/**
 * Meridian Resolve Single Ticket Processing Pipeline
 * Connects validation, PII masking, entity resolution, decision engine,
 * vehicle selection, idempotent work order, AI message drafting, human approvals, and audit trail.
 */

import { QueueTicket } from '../types';
import { DecisionEngine } from '../decision-engine';
import { ReplacementVehicleSelectionService } from '../vehicle-selection';
import { createWorkOrderIdempotent } from '../work-orders';
import { draftClientMessage } from '../ai';
import { createApproval } from '../approvals';
import { createAuditEvent, getTicketAuditTimeline } from '../audit';
import { QueueRepository } from '../repositories';
import { ProcessTicketResult } from './types';

export async function processTicket(ticket: QueueTicket): Promise<ProcessTicketResult> {
  const ticketId = ticket.ticketId || ticket.canonicalTicketId;

  try {
    // Stage 1: Audit Ticket Reception
    await createAuditEvent({
      ticketId,
      eventType: 'TICKET_RECEIVED',
      actor: 'system:pipeline',
      reason: `Ticket ${ticketId} received into processing pipeline`,
      sourceReferences: [ticket.sourceFile || 'tickets.json'],
      safeMetadata: { originHub: ticket.originHub, destination: ticket.destination },
    });

    // Stage 2: Validation & Quarantine Guard
    if (ticket.isQuarantined || ticket.status === 'QUARANTINED') {
      await createAuditEvent({
        ticketId,
        eventType: 'TICKET_QUARANTINED',
        actor: 'system:validator',
        reason: ticket.validationErrors?.join('; ') || 'Ticket quarantined due to malformed payload or missing required fields',
        sourceReferences: [ticket.sourceFile || 'tickets.json'],
        safeMetadata: { validationErrors: ticket.validationErrors || [] },
      });

      const auditEvents = await getTicketAuditTimeline(ticketId);
      return {
        ticketId,
        outcome: 'QUARANTINED',
        queueTicket: ticket,
        auditEvents,
      };
    }

    // Stage 3: Deduplication Guard
    if (ticket.isDuplicate || ticket.status === 'DUPLICATE') {
      await createAuditEvent({
        ticketId,
        eventType: 'WORK_ORDER_ALREADY_EXISTS',
        actor: 'system:deduplicator',
        reason: `Duplicate ticket detected for canonical ticket '${ticket.canonicalTicketId || ticketId}'. Downstream dispatch skipped.`,
        sourceReferences: [ticket.sourceFile || 'tickets.json'],
        safeMetadata: { canonicalTicketId: ticket.canonicalTicketId },
      });

      const auditEvents = await getTicketAuditTimeline(ticketId);
      return {
        ticketId,
        outcome: 'DUPLICATE_SKIPPED',
        queueTicket: ticket,
        workOrderStatus: 'skipped',
        auditEvents,
      };
    }

    // Stage 4: PII Masking & Entity Resolution Audit
    await createAuditEvent({
      ticketId,
      eventType: 'PII_MASKED',
      actor: 'system:pii_guard',
      reason: 'Driver contact and identity fields redacted under PII protection boundary',
      sourceReferences: ['drivers_roster.csv'],
      safeMetadata: { vehicle: ticket.vehicle, driverId: ticket.driverId },
    });

    await createAuditEvent({
      ticketId,
      eventType: 'ENTITY_RESOLVED',
      actor: 'system:entity_resolver',
      reason: `Resolved vehicle '${ticket.vehicle}', driver '${ticket.driverId}', client '${ticket.client}'`,
      sourceReferences: ['fleet_master.csv', 'drivers_roster.csv'],
      safeMetadata: { vehicle: ticket.vehicle, client: ticket.client },
    });

    // Stage 5: Decision Engine
    const decisionEngine = DecisionEngine.getInstance();
    const decision = await decisionEngine.evaluateTicket(ticket);

    // Audit matched rules
    for (const rule of decision.rulesApplied) {
      await createAuditEvent({
        ticketId,
        eventType: 'RULE_EVALUATED',
        actor: 'system:decision_engine',
        reason: `Applied rule ${rule.ruleId} (${rule.name}): ${rule.condition}`,
        ruleId: rule.ruleId,
        sourceReferences: [rule.source],
        safeMetadata: { ruleName: rule.name, decision: rule.decision },
      });
    }

    if (decision.decisionStatus === 'INSUFFICIENT_DATA') {
      const auditEvents = await getTicketAuditTimeline(ticketId);
      return {
        ticketId,
        outcome: 'INSUFFICIENT_DATA',
        queueTicket: ticket,
        decision,
        auditEvents,
      };
    }

    // Stage 6: Replacement Vehicle Selection
    const vehicleService = ReplacementVehicleSelectionService.getInstance();
    const selectionResult = await vehicleService.findReplacementVehicle(ticket);
    const selectedVehicle = selectionResult.selectedVehicle;

    if (selectedVehicle) {
      await createAuditEvent({
        ticketId,
        eventType: 'VEHICLE_SELECTED',
        actor: 'system:vehicle_selector',
        reason: selectionResult.selectionReason,
        sourceReferences: ['fleet_master.csv'],
        safeMetadata: {
          replacementRegistration: selectedVehicle.registrationNumber,
          homeHub: selectedVehicle.homeHub,
          distanceKm: selectedVehicle.distanceKm,
        },
      });
    }

    // Stage 7: Exactly-Once Work Order Creation
    const workOrderResult = await createWorkOrderIdempotent({
      ticketId,
      action: decision.action,
      severity: decision.severity,
      client: ticket.client,
      vehicleAssigned: ticket.vehicle,
      replacementVehicle: selectedVehicle?.registrationNumber,
      driverAssigned: ticket.driverId,
      slaDeadlineHours: decision.slaDeadlineHours,
      instructions: [decision.explanation],
      rulesApplied: decision.rulesApplied.map((r) => r.ruleId),
      metadata: {
        originHub: ticket.originHub,
        destination: ticket.destination,
        kmFromOriginHub: ticket.kmFromOriginHub,
      },
    });

    await createAuditEvent({
      ticketId,
      eventType: workOrderResult.status === 'created' ? 'WORK_ORDER_CREATED' : 'WORK_ORDER_ALREADY_EXISTS',
      actor: 'system:work_order_service',
      reason: `Work Order ${workOrderResult.workOrderId} (${workOrderResult.status}) with key ${workOrderResult.idempotencyKey}`,
      sourceReferences: ['work_orders'],
      safeMetadata: {
        workOrderId: workOrderResult.workOrderId,
        idempotencyKey: workOrderResult.idempotencyKey,
        status: workOrderResult.status,
      },
    });

    // Stage 8: AI Client Message Drafting
    const approvedFacts: string[] = [
      `Breakdown issue: ${ticket.issue}`,
      `Severity: ${decision.severity}`,
      `Operational Action: ${decision.action}`,
      `SLA Resolution Target: within ${decision.slaDeadlineHours} hours`,
    ];
    if (selectedVehicle) {
      approvedFacts.push(`Assigned replacement vehicle ${selectedVehicle.registrationNumber} from ${selectedVehicle.homeHub}`);
    }

    const aiDraftResult = await draftClientMessage({
      sanitizedTicket: {
        ticketId,
        originHub: ticket.originHub,
        destination: ticket.destination,
        issue: ticket.issue,
        severity: decision.severity,
        client: ticket.client,
        createdAt: ticket.createdAt,
      },
      resolvedVehicle: {
        registrationNumber: ticket.vehicle,
      },
      selectedReplacementVehicle: selectedVehicle
        ? {
            registrationNumber: selectedVehicle.registrationNumber,
            model: selectedVehicle.model,
            homeHub: selectedVehicle.homeHub,
            distanceKm: selectedVehicle.distanceKm,
            bsStage: selectedVehicle.bsStage,
          }
        : null,
      client: ticket.client,
      sla: {
        slaDeadlineHours: decision.slaDeadlineHours,
        specialInstructions: [decision.explanation],
      },
      approvedFacts,
      sourceCitations: decision.sources.map((s) => ({
        sourceId: s.sourceId,
        sourceFile: s.sourceFile,
        field: s.field,
        resolvedValue: s.resolvedValue,
      })),
    });

    const clientMessageDraft = aiDraftResult.draft || null;
    if (clientMessageDraft) {
      await createAuditEvent({
        ticketId,
        eventType: 'MESSAGE_DRAFTED',
        actor: 'assistant:gemini',
        reason: 'Client update notification message drafted with verified operational facts',
        sourceReferences: ['gemini-2.5-flash'],
        safeMetadata: { subject: clientMessageDraft.subject },
      });
    }

    // Stage 9: Human Approval Workflow
    let approvalRecord = null;
    if (clientMessageDraft) {
      approvalRecord = await createApproval({
        ticketId,
        workOrderId: workOrderResult.workOrderId,
        message: {
          subject: clientMessageDraft.subject,
          message: clientMessageDraft.message,
          factsUsed: clientMessageDraft.factsUsed,
          citations: clientMessageDraft.citations,
        },
      });

      await createAuditEvent({
        ticketId,
        eventType: 'APPROVAL_REQUESTED',
        actor: 'system:approval_service',
        reason: `Client message approval record '${approvalRecord.approvalId}' created in PENDING status`,
        sourceReferences: ['approvals'],
        safeMetadata: { approvalId: approvalRecord.approvalId, status: approvalRecord.status },
      });
    }

    await new QueueRepository().updateStatus(ticketId, 'COMPLETED');
    const auditEvents = await getTicketAuditTimeline(ticketId);

    return {
      ticketId,
      outcome: 'COMPLETED',
      queueTicket: ticket,
      decision,
      selectedVehicle,
      workOrder: workOrderResult.workOrder,
      workOrderStatus: workOrderResult.status,
      clientMessageDraft,
      approvalRecord,
      auditEvents,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    await createAuditEvent({
      ticketId,
      eventType: 'RULE_EVALUATED',
      actor: 'system:pipeline_error_handler',
      reason: `Pipeline execution error for ticket ${ticketId}: ${errorMsg}`,
      sourceReferences: [],
      safeMetadata: { error: errorMsg },
    });

    const auditEvents = await getTicketAuditTimeline(ticketId);
    return {
      ticketId,
      outcome: 'ERROR',
      queueTicket: ticket,
      error: errorMsg,
      auditEvents,
    };
  }
}

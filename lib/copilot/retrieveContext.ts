/**
 * Targeted Context Retrieval Engine for Operations Copilot
 * Queries Unified Context Store, MongoDB repositories, Decision Engine,
 * Maintenance logs, Meridian trips, Audit trails, and Dispatcher transcripts.
 */

import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { UnifiedContextStore } from '../context';
import { WorkOrderRepository } from '../work-orders/repository';
import { ApprovalRepository } from '../approvals/repository';
import { AuditLogRepository } from '../audit/repository';
import { DISPATCHER_RULES } from '../decision-engine/rules';
import { evaluateCandidateVehicle } from '../vehicle-selection/engine';
import { normalizeVehicleReg } from '../normalization';
import { maskPii } from '../pii';
import { Conflict } from '../types';
import { ExtractedEntities, QueryIntent, RetrievedContext, SourceCitationDetail } from './types';

// Memoized maintenance logs & trips for instant query response without full DB scan
let cachedMaintenanceRecords: Array<{
  id: string;
  date: string;
  vehicleReg: string;
  odometerKm: number;
  mechanic: string;
  notes: string;
}> | null = null;

let cachedTripsRecords: Array<{
  tripId: string;
  createdAt: string;
  routeType: string;
  originName: string;
  destName: string;
  distanceKm: number;
  vehicleReg: string;
  driverId: string;
  client: string;
  status: string;
  billedAmount: number;
}> | null = null;

function getDataDir(): string {
  const primaryDir = path.join(process.cwd(), 'data');
  const fallbackDir = path.join(process.cwd(), '../data');
  return fs.existsSync(primaryDir) ? primaryDir : fallbackDir;
}

function loadMaintenanceRecords(): Array<{
  id: string;
  date: string;
  vehicleReg: string;
  odometerKm: number;
  mechanic: string;
  notes: string;
}> {
  if (cachedMaintenanceRecords) return cachedMaintenanceRecords;

  const records: Array<{
    id: string;
    date: string;
    vehicleReg: string;
    odometerKm: number;
    mechanic: string;
    notes: string;
  }> = [];

  try {
    const dataDir = getDataDir();
    const maintPath = path.join(dataDir, 'maintenance_log.xlsx');
    if (fs.existsSync(maintPath)) {
      const fileBuffer = fs.readFileSync(maintPath);
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const sheetData = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[sheetName]);

      let idx = 0;
      for (const row of sheetData) {
        idx++;
        const rawVeh = String(row['vehicle'] || '');
        const normVeh = normalizeVehicleReg(rawVeh);
        records.push({
          id: `maint_${idx}`,
          date: String(row['date'] || '').trim(),
          vehicleReg: normVeh,
          odometerKm: parseInt(String(row['odometer_km']), 10) || 0,
          mechanic: String(row['mechanic'] || '').trim(),
          notes: String(row['notes'] || '').trim(),
        });
      }
    }
  } catch (err) {
    console.warn('Failed to load maintenance records from xlsx:', err);
  }

  cachedMaintenanceRecords = records;
  return records;
}

function loadRecentTrips(filter: { vehicleReg?: string; driverId?: string; client?: string; limit?: number }): Array<{
  tripId: string;
  createdAt: string;
  routeType: string;
  originName: string;
  destName: string;
  distanceKm: number;
  vehicleReg: string;
  driverId: string;
  client: string;
  status: string;
  billedAmount: number;
}> {
  if (!cachedTripsRecords) {
    const trips: Array<{
      tripId: string;
      createdAt: string;
      routeType: string;
      originName: string;
      destName: string;
      distanceKm: number;
      vehicleReg: string;
      driverId: string;
      client: string;
      status: string;
      billedAmount: number;
    }> = [];

    try {
      const dataDir = getDataDir();
      const tripsPath = path.join(dataDir, 'meridian_trips.csv');
      if (fs.existsSync(tripsPath)) {
        const content = fs.readFileSync(tripsPath, 'utf-8');
        const parsed = Papa.parse<Record<string, string>>(content, { header: true, skipEmptyLines: true });
        for (const row of parsed.data) {
          trips.push({
            tripId: row.trip_id || '',
            createdAt: row.created_at || '',
            routeType: row.route_type || '',
            originName: row.origin_name || '',
            destName: row.dest_name || '',
            distanceKm: parseFloat(row.osrm_distance_km) || 0,
            vehicleReg: normalizeVehicleReg(row.vehicle_reg),
            driverId: (row.driver_id || '').toUpperCase().trim(),
            client: row.client || '',
            status: row.status || '',
            billedAmount: parseFloat(row.billed_amount) || 0,
          });
        }
      }
    } catch (err) {
      console.warn('Failed to load meridian trips:', err);
    }
    cachedTripsRecords = trips;
  }

  const limit = filter.limit || 8;
  const filtered = cachedTripsRecords.filter((t) => {
    if (filter.vehicleReg && t.vehicleReg.replace(/[\s\-]+/g, '').toUpperCase() !== filter.vehicleReg.replace(/[\s\-]+/g, '').toUpperCase()) {
      return false;
    }
    if (filter.driverId && t.driverId !== filter.driverId) {
      return false;
    }
    if (filter.client && !t.client.toLowerCase().includes(filter.client.toLowerCase())) {
      return false;
    }
    return true;
  });

  return filtered.slice(0, limit);
}

export async function retrieveTargetedContext(
  entities: ExtractedEntities,
  intent: QueryIntent
): Promise<RetrievedContext> {
  const store = UnifiedContextStore.getInstance();
  const workOrderRepo = new WorkOrderRepository();
  const approvalRepo = new ApprovalRepository();
  const auditRepo = new AuditLogRepository();

  const evidenceStatements: string[] = [];
  const citations: SourceCitationDetail[] = [];
  const conflicts: Conflict[] = [];

  const lowerQ = entities.rawQuestion.toLowerCase();

  // 1. VEHICLE RETRIEVAL
  const queriedVehicles = new Set<string>(entities.vehicleIds);

  // If question references a specific location (e.g. "truck from Kanpur")
  if (entities.locations.length > 0 && queriedVehicles.size === 0) {
    const allVehicles = await store.getAllVehicles();
    for (const v of allVehicles) {
      if (entities.locations.some((loc) => v.homeHub.toLowerCase() === loc.toLowerCase())) {
        queriedVehicles.add(v.registrationNumber);
      }
    }
  }

  // If query mentions TRK-104, map to alias RJ43DD3546 / UP17GN7381
  for (const vId of Array.from(queriedVehicles)) {
    const cleanVid = vId.replace(/[\s\-]+/g, '').toUpperCase();
    if (cleanVid === 'TRK104' || cleanVid === 'TRK-104') {
      queriedVehicles.add('RJ43DD3546');
      queriedVehicles.add('UP17GN7381');
    }
  }

  for (const vQuery of Array.from(queriedVehicles)) {
    const vehicle = await store.getVehicle(vQuery);
    if (vehicle) {
      const resEntity = await store.getResolvedEntity(vehicle.registrationNumber);
      if (resEntity) {
        conflicts.push(...resEntity.conflicts);
      }

      evidenceStatements.push(
        `Vehicle Profile [${vehicle.registrationNumber} / ${vehicle.vehicleId || 'N/A'}]: Model: ${vehicle.model}, Year: ${
          vehicle.year
        }, BS Stage: ${vehicle.bsStage}, Engine Heater: ${vehicle.engineHeater ? 'Yes' : 'No'}, Home Hub: ${
          vehicle.homeHub
        }, Capacity: ${vehicle.capacityTonnes} tonnes, Status: ${vehicle.status}.`
      );

      citations.push({
        sourceType: 'fleet_master',
        sourceId: `fleet_master_${vehicle.registrationNumber}`,
        title: 'fleet_master.csv',
        recordId: vehicle.registrationNumber,
        field: 'vehicle_profile',
        originalValueMasked: vehicle,
        resolvedValue: vehicle,
        precedence: 1,
        resolutionReason: 'Authoritative Fleet Master registration record',
        relevance: `Fleet Master specifications for vehicle ${vehicle.registrationNumber}`,
      });

      // Retrieve Maintenance Records for this vehicle
      const maintRecords = loadMaintenanceRecords().filter(
        (m) =>
          m.vehicleReg.replace(/[\s\-]+/g, '').toUpperCase() ===
          vehicle.registrationNumber.replace(/[\s\-]+/g, '').toUpperCase()
      );

      if (maintRecords.length > 0) {
        for (const m of maintRecords) {
          evidenceStatements.push(
            `Maintenance Entry [${m.date}]: Vehicle ${vehicle.registrationNumber} at ${m.odometerKm} km inspected by Mechanic ${m.mechanic}. Notes: "${m.notes}".`
          );

          citations.push({
            sourceType: 'maintenance_log',
            sourceId: m.id,
            title: 'maintenance_log.xlsx',
            recordId: m.id,
            field: 'maintenance_entry',
            originalValueMasked: m,
            resolvedValue: m,
            precedence: 2,
            resolutionReason: 'Workshop maintenance log entry',
            relevance: `Workshop log for vehicle ${vehicle.registrationNumber} (${m.notes})`,
            timestamp: m.date,
          });
        }
      }

      // Retrieve Recent Trips for this vehicle
      const trips = loadRecentTrips({ vehicleReg: vehicle.registrationNumber, limit: 5 });
      if (trips.length > 0) {
        for (const t of trips) {
          evidenceStatements.push(
            `Trip History [${t.tripId}]: Date: ${t.createdAt}, Route: ${t.originName} -> ${t.destName} (${t.distanceKm} km), Client: ${t.client}, Status: ${t.status}, Driver: ${t.driverId}.`
          );

          citations.push({
            sourceType: 'meridian_trips',
            sourceId: `trip_${t.tripId}`,
            title: 'meridian_trips.csv',
            recordId: t.tripId,
            field: 'trip_record',
            originalValueMasked: t,
            resolvedValue: t,
            precedence: 3,
            resolutionReason: 'Historical Meridian Freight operational trip log',
            relevance: `Recent trip on route ${t.originName} to ${t.destName}`,
            timestamp: t.createdAt,
          });
        }
      }

      // If evaluating why vehicle was rejected or evaluated as candidate
      if (intent === 'vehicle_rejection' || intent === 'replacement_selection' || lowerQ.includes('reject') || lowerQ.includes('why')) {
        // Evaluate candidate vehicle against sample breakdown scenario (e.g. Hill route Rudrapur / Winter Delhi NCR)
        const mockHillTicket = {
          ticketId: 'TKT-EVAL-REF',
          idempotencyKey: 'BREAKDOWN:TKT-EVAL-REF',
          canonicalTicketId: 'TKT-EVAL-REF',
          createdAt: new Date().toISOString(),
          vehicle: 'UP40IM3144',
          rawVehicle: 'UP40IM3144',
          driverId: 'DRV-020',
          rawDriverId: 'DRV-020',
          originHub: vehicle.homeHub,
          kmFromOriginHub: 20,
          destination: 'Rudrapur (Hill Route)',
          issue: 'turbo failure',
          severity: 'HIGH',
          client: 'Shakti Cement',
          status: 'READY' as const,
          isDuplicate: false,
          isQuarantined: false,
          ingestionRunId: 'eval',
          sourceFile: 'tickets.json',
        };

        const evalResult = evaluateCandidateVehicle(vehicle, mockHillTicket, 10);
        if (!evalResult.eligible) {
          evidenceStatements.push(
            `Candidate Evaluation [${vehicle.registrationNumber}]: Ineligible for assignment. Rejection reason: ${evalResult.reasons.join(
              '; '
            )}.`
          );

          for (const failure of evalResult.failureDetails) {
            const rule = failure.ruleId ? DISPATCHER_RULES[failure.ruleId] : undefined;
            evidenceStatements.push(
              `Dispatcher Rule Triggered [${failure.ruleId || failure.check}]: ${failure.reason}.${
                rule ? ` Source Reference: ${rule.sourceReference}` : ''
              }`
            );

            if (rule) {
              citations.push({
                sourceType: 'dispatcher_interview',
                sourceId: `rule_${rule.ruleId}`,
                title: rule.source || 'dispatcher_interview.txt',
                recordId: rule.ruleId,
                field: 'dispatcher_rule',
                originalValueMasked: rule.sourceReference,
                resolvedValue: rule,
                precedence: 5,
                resolutionReason: rule.sourceReference,
                relevance: `Operational rule ${rule.ruleId} (${rule.name})`,
              });
            }
          }
        }
      }
    }
  }

  // 2. DRIVER RETRIEVAL
  for (const dId of entities.driverIds) {
    const driver = await store.getDriver(dId);
    if (driver) {
      const { data: maskedDriver } = maskPii(driver);
      evidenceStatements.push(
        `Driver Profile [${driver.driverId}]: Name: ${driver.name}, Home Hub: ${driver.homeHub}, Joining Date: ${driver.joiningDate}, Phone: [REDACTED], DL: [REDACTED], Aadhaar: [REDACTED].`
      );

      citations.push({
        sourceType: 'drivers_roster',
        sourceId: `drivers_roster_${driver.driverId}`,
        title: 'drivers_roster.csv',
        recordId: driver.driverId,
        field: 'driver_profile',
        originalValueMasked: maskedDriver,
        resolvedValue: maskedDriver,
        precedence: 1,
        resolutionReason: 'Authoritative Drivers Roster record',
        relevance: `Driver roster profile for ${driver.name} (${driver.driverId})`,
      });

      // Recent trips for driver
      const dTrips = loadRecentTrips({ driverId: driver.driverId, limit: 3 });
      for (const t of dTrips) {
        evidenceStatements.push(
          `Driver Trip History [${t.tripId}]: Vehicle: ${t.vehicleReg}, Route: ${t.originName} -> ${t.destName}, Status: ${t.status}.`
        );
      }
    }
  }

  // 3. CLIENT RETRIEVAL
  for (const cName of entities.clientNames) {
    const client = await store.getClient(cName);
    if (client) {
      evidenceStatements.push(
        `Client Profile [${client.name}]: Contract SLA: ${client.contractSlaHours}h, Operational SLA: ${
          client.operationalSlaHours
        }h, Special Operational Rules: ${client.specialRules.join('; ')}.`
      );

      citations.push({
        sourceType: 'fleet_master',
        sourceId: `client_${client.clientId}`,
        title: 'contract_master',
        recordId: client.clientId,
        field: 'client_contract',
        originalValueMasked: client,
        resolvedValue: client,
        precedence: 1,
        resolutionReason: 'Client operational contract profile',
        relevance: `SLA terms and operational dispatch rules for ${client.name}`,
      });

      if (client.name.toLowerCase().includes('shakti')) {
        citations.push({
          sourceType: 'email_thread',
          sourceId: 'thread_01_shakti_sla.txt',
          title: 'thread_01_shakti_sla.txt',
          recordId: 'thread_01',
          field: 'operational_sla_agreement',
          originalValueMasked: 'Plant head agreement for 36-hour strict operational delivery',
          resolvedValue: { operationalSlaHours: 36 },
          precedence: 4,
          resolutionReason: 'Confirmed Operational Email Agreement with Shakti Cement plant head',
          relevance: 'Enforced 36-hour operational delivery window override',
        });
      }
    }
  }

  // 4. TICKET RETRIEVAL
  const allTickets = await store.getAllTickets();
  for (const t of allTickets) {
    const isTarget =
      entities.ticketIds.some((id) => id.includes(t.ticketId) || t.ticketId.includes(id)) ||
      (entities.ticketIds.length === 0 &&
        entities.vehicleIds.some((v) => v.replace(/[\s\-]+/g, '').toUpperCase() === t.vehicle.replace(/[\s\-]+/g, '').toUpperCase()));

    if (isTarget) {
      evidenceStatements.push(
        `Breakdown Ticket [${t.ticketId}]: Created: ${t.createdAt}, Vehicle: ${t.vehicle}, Driver: ${t.driverId}, Client: ${t.client}, Origin Hub: ${t.originHub} (${t.kmFromOriginHub} km away), Destination: ${t.destination}, Issue: "${t.issue}", Severity: ${t.severity}, Status: ${t.status}, Resolution: "${t.resolutionNote || 'Pending dispatch'}".`
      );

      citations.push({
        sourceType: 'tickets',
        sourceId: `ticket_${t.ticketId}`,
        title: 'tickets.json',
        recordId: t.ticketId,
        field: 'ticket_record',
        originalValueMasked: t,
        resolvedValue: t,
        precedence: 3,
        resolutionReason: 'Live breakdown incident ticket',
        relevance: `Breakdown ticket for vehicle ${t.vehicle} reported at ${t.originHub}`,
        timestamp: t.createdAt,
      });

      // Check Decision for this ticket
      const decision = await store.getDecisionByTicketId(t.ticketId);
      if (decision) {
        evidenceStatements.push(
          `Decision Engine Outcome [${decision.decisionId}]: Status: ${decision.decisionStatus}, Action: ${
            decision.action
          }, Reason: "${decision.actionReason}", SLA Deadline: ${decision.slaDeadlineHours || 36}h. Selected Vehicle: ${
            decision.selectedVehicle?.registrationNumber || 'None'
          }. Explanation: "${decision.explanation}".`
        );

        citations.push({
          sourceType: 'decision_record',
          sourceId: `decision_${decision.decisionId}`,
          title: 'Decision Engine Record',
          recordId: decision.decisionId,
          field: 'deterministic_decision',
          originalValueMasked: decision,
          resolvedValue: decision,
          precedence: 3,
          resolutionReason: 'Deterministic Decision Engine execution log',
          relevance: `Incident resolution decision (${decision.action}: ${decision.actionReason})`,
          timestamp: decision.createdAt,
        });

        // Add rules evaluated in decision
        for (const rule of decision.rulesApplied) {
          citations.push({
            sourceType: 'dispatcher_interview',
            sourceId: `rule_${rule.ruleId}`,
            title: rule.source || 'dispatcher_interview.txt',
            recordId: rule.ruleId,
            field: 'applied_rule',
            originalValueMasked: rule.sourceReference,
            resolvedValue: rule,
            precedence: 5,
            resolutionReason: rule.sourceReference,
            relevance: `Applied operational rule ${rule.ruleId} (${rule.name})`,
          });
        }
      }

      // Check Work Order
      const workOrder = await workOrderRepo.findByTicketId(t.ticketId);
      if (workOrder) {
        evidenceStatements.push(
          `Work Order [${workOrder.workOrderId}]: Status: ${workOrder.status}, Action: ${workOrder.action}, Dispatched Vehicle: ${
            workOrder.replacementVehicle || 'None'
          }, Assigned Driver: ${workOrder.driverAssigned || 'N/A'}, SLA Deadline: ${workOrder.slaDeadlineHours || 36}h.`
        );

        citations.push({
          sourceType: 'work_order',
          sourceId: `wo_${workOrder.workOrderId}`,
          title: 'Dispatched Work Order',
          recordId: workOrder.workOrderId,
          field: 'work_order_record',
          originalValueMasked: workOrder,
          resolvedValue: workOrder,
          precedence: 3,
          resolutionReason: 'Dispatched work order record in MongoDB',
          relevance: `Work order dispatched to vehicle ${workOrder.replacementVehicle || 'None'}`,
          timestamp: workOrder.createdAt,
        });
      }

      // Check Approval
      const approval = await approvalRepo.findByTicketId(t.ticketId);
      if (approval) {
        evidenceStatements.push(
          `Human Dispatch Approval [${approval.approvalId}]: Status: ${approval.status}, Actor: ${
            approval.actor || 'Pending'
          }, Approved At: ${approval.approvedAt || 'N/A'}, Dispatcher Notes: "${approval.approvalNotes || 'None'}".`
        );

        citations.push({
          sourceType: 'approval_record',
          sourceId: `approval_${approval.approvalId}`,
          title: 'Human Dispatch Approval',
          recordId: approval.approvalId,
          field: 'approval_status',
          originalValueMasked: approval,
          resolvedValue: approval,
          precedence: 3,
          resolutionReason: 'Dispatcher approval workflow record',
          relevance: `Human approval status (${approval.status})`,
        });
      }

      // Check Audit Trail
      const auditEvents = await auditRepo.findByTicketId(t.ticketId);
      if (auditEvents.length > 0) {
        const eventsSummary = auditEvents.map((e) => `[${e.timestamp}] ${e.eventType} by ${e.actor}: ${e.reason}`).join(' | ');
        evidenceStatements.push(`Audit Trail for Ticket ${t.ticketId}: ${eventsSummary}`);

        citations.push({
          sourceType: 'audit_log',
          sourceId: `audit_${t.ticketId}`,
          title: 'Audit Log Trail',
          recordId: t.ticketId,
          field: 'audit_timeline',
          originalValueMasked: auditEvents,
          resolvedValue: auditEvents,
          precedence: 3,
          resolutionReason: 'Immutable MongoDB audit trail',
          relevance: `Audit event history for ticket ${t.ticketId}`,
        });
      }
    }
  }

  // 5. DISPATCHER RULES & OPERATIONAL POLICIES
  if (
    intent === 'dispatcher_rule' ||
    lowerQ.includes('rule') ||
    lowerQ.includes('delhi') ||
    lowerQ.includes('winter') ||
    lowerQ.includes('hill') ||
    lowerQ.includes('brake') ||
    lowerQ.includes('50km') ||
    lowerQ.includes('origin') ||
    lowerQ.includes('jugaad') ||
    lowerQ.includes('shakti') ||
    lowerQ.includes('grap') ||
    lowerQ.includes('monsoon') ||
    lowerQ.includes('night')
  ) {
    const rulesList = Object.values(DISPATCHER_RULES);
    for (const rule of rulesList) {
      const matchKeyword =
        (lowerQ.includes('delhi') && rule.ruleId === 'R-001') ||
        (lowerQ.includes('winter') && (rule.ruleId === 'R-001' || rule.ruleId === 'R-002')) ||
        (lowerQ.includes('hill') && (rule.ruleId === 'R-002' || rule.ruleId === 'R-003')) ||
        (lowerQ.includes('brake') && rule.ruleId === 'R-003') ||
        (lowerQ.includes('50km') && rule.ruleId === 'R-004') ||
        (lowerQ.includes('origin') && rule.ruleId === 'R-004') ||
        (lowerQ.includes('grounded') && rule.ruleId === 'R-005') ||
        (lowerQ.includes('service') && rule.ruleId === 'R-005') ||
        (lowerQ.includes('jugaad') && rule.ruleId === 'R-006') ||
        (lowerQ.includes('orion') && rule.ruleId === 'R-007') ||
        (lowerQ.includes('shakti') && rule.ruleId === 'R-008') ||
        (lowerQ.includes('vertex') && rule.ruleId === 'R-009') ||
        (lowerQ.includes('apex') && rule.ruleId === 'R-010') ||
        (lowerQ.includes('monsoon') && rule.ruleId === 'R-011') ||
        (lowerQ.includes('night') && rule.ruleId === 'R-012') ||
        entities.ruleIds.includes(rule.ruleId);

      if (matchKeyword || intent === 'dispatcher_rule') {
        evidenceStatements.push(
          `Dispatcher Rule [${rule.ruleId} - ${rule.name}]: Condition: ${rule.condition}. Decision: ${rule.decision}. Reference: "${rule.sourceReference}".`
        );

        citations.push({
          sourceType: 'dispatcher_interview',
          sourceId: `rule_${rule.ruleId}`,
          title: 'dispatcher_interview.txt',
          recordId: rule.ruleId,
          field: 'interview_rule',
          originalValueMasked: rule.sourceReference,
          resolvedValue: rule,
          precedence: 5,
          resolutionReason: 'Knowledge capture interview transcript (Rajender Pal Yadav)',
          relevance: `Rule ${rule.ruleId}: ${rule.name}`,
        });
      }
    }
  }

  // 6. CHECK CONFLICTS
  const allStoredConflicts = await store.getAllConflicts();
  for (const c of allStoredConflicts) {
    if (
      entities.vehicleIds.some((v) => c.entityId.replace(/[\s\-]+/g, '').toUpperCase() === v.replace(/[\s\-]+/g, '').toUpperCase()) ||
      entities.clientNames.some((cl) => c.entityId.toLowerCase() === cl.toLowerCase()) ||
      lowerQ.includes('conflict') ||
      lowerQ.includes('discrepancy')
    ) {
      conflicts.push(c);
      evidenceStatements.push(
        `Source Conflict [${c.entityType} ${c.entityId}]: Field "${c.field}" has conflicting values between ${c.winningSource} (Value: ${c.winningValue}) and ${c.rejectedSource} (Value: ${c.rejectedValue}). Winning value chosen per precedence: ${c.reason}.`
      );
    }
  }

  // Deduplicate citations by sourceId
  const uniqueCitationsMap = new Map<string, SourceCitationDetail>();
  for (const c of citations) {
    uniqueCitationsMap.set(c.sourceId, c);
  }

  // Deduplicate conflicts
  const uniqueConflictsMap = new Map<string, Conflict>();
  for (const c of conflicts) {
    uniqueConflictsMap.set(c.id, c);
  }

  return {
    evidenceStatements,
    citations: Array.from(uniqueCitationsMap.values()),
    conflicts: Array.from(uniqueConflictsMap.values()),
    entities,
    intent,
  };
}

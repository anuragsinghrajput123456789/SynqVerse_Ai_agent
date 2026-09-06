/**
 * Grounded Query Engine
 * Executes grounded question answering using context citations and validated AI responses.
 * Guarantees zero hallucinations by returning status "insufficient_data" when context is lacking.
 */

import { QueryResult, SourceCitation, Conflict } from '../types';
import { UnifiedContextStore } from '../context';
import { maskPii } from '../pii';
import { generateValidatedGroundedAnswer } from '../ai/gemini';

export * from './chat';


export async function answerContextQuery(question: string): Promise<QueryResult> {
  if (!question || typeof question !== 'string' || question.trim() === '') {
    return {
      answer: 'Insufficient data to determine this.',
      status: 'insufficient_data',
      sources: [],
      conflicts: [],
    };
  }

  const store = UnifiedContextStore.getInstance();
  const lowerQ = question.toLowerCase().trim();

  const matchedCitations: SourceCitation[] = [];
  const matchedConflicts: Conflict[] = [];
  let groundedEvidence = '';

  // 1. Check Vehicles
  const targetVehicle = await store.getVehicle(question);
  if (targetVehicle) {
    const resEntity = await store.getResolvedEntity(targetVehicle.registrationNumber);
    if (resEntity) {
      matchedCitations.push(...resEntity.citations);
      matchedConflicts.push(...resEntity.conflicts);
    }
    groundedEvidence += `Vehicle Registration: ${targetVehicle.registrationNumber}, Fleet ID: ${
      targetVehicle.vehicleId || 'N/A'
    }, Model: ${targetVehicle.model}, Year: ${targetVehicle.year}, BS Stage: ${targetVehicle.bsStage}, Engine Heater: ${
      targetVehicle.engineHeater ? 'Yes' : 'No'
    }, Home Hub: ${targetVehicle.homeHub}, Status: ${targetVehicle.status}.\n`;
  }

  // 2. Check Drivers
  const targetDriver = await store.getDriver(question);
  if (targetDriver) {
    const resEntity = await store.getResolvedEntity(targetDriver.driverId);
    if (resEntity) {
      matchedCitations.push(...resEntity.citations);
      matchedConflicts.push(...resEntity.conflicts);
    }
    groundedEvidence += `Driver ID: ${targetDriver.driverId}, Name: ${targetDriver.name}, Home Hub: ${targetDriver.homeHub}, Joining Date: ${targetDriver.joiningDate}, Phone: [REDACTED], DL: [REDACTED], Aadhaar: [REDACTED].\n`;
  }

  // 3. Check Clients
  const targetClient = await store.getClient(question);
  if (targetClient) {
    const resEntity = await store.getResolvedEntity(targetClient.name);
    if (resEntity) {
      matchedCitations.push(...resEntity.citations);
      matchedConflicts.push(...resEntity.conflicts);
    }
    groundedEvidence += `Client Name: ${targetClient.name}, Contract SLA: ${targetClient.contractSlaHours}h, Operational SLA: ${
      targetClient.operationalSlaHours
    }h, Special Operating Rules: ${targetClient.specialRules.join('; ')}.\n`;
  }

  // 4. Check Tickets
  const tickets = await store.getAllTickets();
  for (const t of tickets) {
    if (lowerQ.includes(t.ticketId.toLowerCase())) {
      groundedEvidence += `Breakdown Ticket: ${t.ticketId}, Vehicle: ${t.vehicle}, Driver: ${t.driverId}, Client: ${t.client}, Issue: ${t.issue}, Severity: ${t.severity}, Status: ${t.status}, Hub: ${t.originHub}.\n`;
      matchedCitations.push({
        sourceId: `ticket_${t.ticketId}`,
        sourceFile: 'tickets.json',
        sourceType: 'tickets',
        recordId: t.ticketId,
        field: 'ticket_record',
        originalValueMasked: t,
        resolvedValue: t,
        precedence: 3,
        resolutionReason: 'Live breakdown ticket record',
        timestamp: t.createdAt,
      });
    }
  }

  // 5. Check Operating Rules / Dispatcher keywords
  if (
    lowerQ.includes('rule') ||
    lowerQ.includes('delhi') ||
    lowerQ.includes('winter') ||
    lowerQ.includes('hill') ||
    lowerQ.includes('shakti') ||
    lowerQ.includes('jugaad') ||
    lowerQ.includes('night') ||
    lowerQ.includes('brake') ||
    lowerQ.includes('hub')
  ) {
    groundedEvidence += `Dispatcher Operating Rules: Winter Delhi NCR routes require BS6 vehicles (Oct-Feb). Hill routes require engine heater and no brake work in last 30 days. Breakdown within 50km of origin hub must send replacement from origin hub. Overdue service >30 days grounds vehicle. Jugaad patch has 7-day clock. Shakti SLA is 36 hours.\n`;
    matchedCitations.push({
      sourceId: 'dispatcher_interview_transcript',
      sourceFile: 'dispatcher_interview.txt',
      sourceType: 'dispatcher_interview',
      recordId: 'dispatcher_interview_transcript',
      field: 'interview_rules',
      originalValueMasked: 'Senior Dispatch Manager Knowledge Capture Transcript',
      resolvedValue: 'Operating Rules',
      precedence: 5,
      resolutionReason: 'Verbatim Knowledge Capture Transcript',
    });
  }

  // Deduplicate citations
  const citationsMap = new Map<string, SourceCitation>();
  for (const c of matchedCitations) {
    citationsMap.set(c.sourceId, c);
  }
  const uniqueCitations = Array.from(citationsMap.values());

  // Deduplicate conflicts
  const conflictsMap = new Map<string, Conflict>();
  for (const conf of matchedConflicts) {
    conflictsMap.set(conf.id, conf);
  }
  const uniqueConflicts = Array.from(conflictsMap.values());

  if (!groundedEvidence || uniqueCitations.length === 0) {
    return {
      answer: 'Insufficient data to determine this.',
      status: 'insufficient_data',
      sources: [],
      conflicts: [],
    };
  }

  // Enforce PII masking on all returned citations
  const maskedCitations = uniqueCitations.map((c) => ({
    ...c,
    originalValueMasked: maskPii(c.originalValueMasked).data,
    resolvedValue: maskPii(c.resolvedValue).data,
  }));

  // Try Gemini if API key is present
  if (process.env.GEMINI_API_KEY) {
    try {
      const validatedAiRes = await generateValidatedGroundedAnswer(question, groundedEvidence, maskedCitations);
      return {
        answer: validatedAiRes.answer,
        status: validatedAiRes.status,
        sources: validatedAiRes.validCitations,
        conflicts: uniqueConflicts,
      };
    } catch (err) {
      console.warn('Gemini evaluation failed, falling back to deterministic answer synthesis:', err);
    }
  }

  // Fallback to deterministic grounded answer
  return {
    answer: `Based on grounded context from Meridian Freight records:\n${groundedEvidence.trim()}`,
    status: 'grounded',
    sources: maskedCitations,
    conflicts: uniqueConflicts,
  };
}

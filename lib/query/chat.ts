/**
 * Grounded Chat Query Service
 * Coordinates fact retrieval, relevance threshold gating, Gemini generation,
 * PII masking, source citations, and immutable audit trail logging.
 */

import { UnifiedContextStore } from '../context';
import { maskPii } from '../pii';
import { Fact, generateAnswer } from '../ai';
import { createAuditEvent } from '../audit';
import { DISPATCHER_RULES } from '../decision-engine/rules';
import { SourceCitation } from '../types';

export interface AnswerWithCitations {
  answer: string;
  status: 'grounded' | 'insufficient_data';
  source_refs: string[];
  sources?: SourceCitation[];
  maskedUserMessage?: string;
}

export interface ChatMessageHistory {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

const RELEVANCE_THRESHOLD = 0.15;

/**
 * Normalizes query string for entity extraction
 */
function cleanQueryString(text: string): string {
  return text.toLowerCase().replace(/[^\w\s-]/g, ' ').trim();
}

/**
 * Retrieves candidate facts from all ingested data sources
 */
export async function retrieveContextFacts(
  userMessage: string,
  conversationHistory: ChatMessageHistory[] = []
): Promise<Fact[]> {
  const store = UnifiedContextStore.getInstance();
  const rawQuery = userMessage.trim();
  const cleanedQuery = cleanQueryString(rawQuery);
  const words = new Set(cleanedQuery.split(/\s+/).filter((w) => w.length > 2));

  // Include recent conversation history keywords for pronoun resolution
  const historyText = conversationHistory.slice(-2).map((m) => m.content).join(' ');
  const historyCleaned = cleanQueryString(historyText);

  const allFacts: Fact[] = [];

  // 1. Vehicle Facts
  const vehicles = await store.getAllVehicles();
  for (const v of vehicles) {
    const regClean = v.registrationNumber.toLowerCase().replace(/[\s-]/g, '');
    const idClean = (v.vehicleId || '').toLowerCase().replace(/[\s-]/g, '');
    const modelClean = v.model.toLowerCase();
    const queryComp = cleanedQuery.replace(/[\s-]/g, '');
    const histComp = historyCleaned.replace(/[\s-]/g, '');
    const aliasMatches = (v.aliases || []).some(
      (a) => a && queryComp.includes(a.toLowerCase().replace(/[\s-]/g, ''))
    );

    let score = 0;
    if (queryComp.includes(regClean) || (idClean && queryComp.includes(idClean)) || aliasMatches) {
      score += 1.0;
    } else if (histComp.includes(regClean) || (idClean && histComp.includes(idClean))) {
      score += 0.6;
    } else if (words.has(modelClean) || words.has(v.homeHub.toLowerCase())) {
      score += 0.3;
    }


    if (score > 0) {
      allFacts.push({
        text: `Vehicle ${v.registrationNumber} (ID: ${v.vehicleId || 'N/A'}, Model: ${v.model}, Year: ${v.year}, BS Stage: ${v.bsStage}, Engine Heater: ${v.engineHeater ? 'Yes' : 'No'}, Home Hub: ${v.homeHub}, Status: ${v.status}, Capacity: ${v.capacityTonnes}T).`,
        source_ref: `fleet_master.csv ${v.registrationNumber}`,
        relevanceScore: score,
        metadata: { type: 'vehicle', id: v.registrationNumber },
      });
    }
  }

  // 2. Client Facts & SLAs
  const clients = await store.getAllClients();
  for (const c of clients) {
    const nameClean = c.name.toLowerCase();
    let score = 0;
    if (cleanedQuery.includes(nameClean)) {
      score += 1.0;
    } else if (historyCleaned.includes(nameClean)) {
      score += 0.5;
    } else {
      const nameParts = nameClean.split(/\s+/);
      if (nameParts.some((p) => words.has(p))) {
        score += 0.4;
      }
    }

    if (score > 0) {
      allFacts.push({
        text: `Client ${c.name} has Contract SLA of ${c.contractSlaHours} hours and Operational SLA of ${c.operationalSlaHours} hours. Special Rules: ${c.specialRules.join('; ') || 'Standard'}.`,
        source_ref: `contracts_master.csv ${c.name}`,
        relevanceScore: score,
        metadata: { type: 'client', id: c.name },
      });
    }
  }

  // 3. Driver Facts
  const drivers = await store.getAllDrivers();
  for (const d of drivers) {
    const dId = d.driverId.toLowerCase().replace(/[\s-]/g, '');
    const dName = d.name.toLowerCase();
    const queryComp = cleanedQuery.replace(/[\s-]/g, '');

    let score = 0;
    if (queryComp.includes(dId) || cleanedQuery.includes(dName)) {
      score += 1.0;
    }

    if (score > 0) {
      allFacts.push({
        text: `Driver ${d.name} (ID: ${d.driverId}, Home Hub: ${d.homeHub}, Joining Date: ${d.joiningDate}, Phone: [REDACTED], DL: [REDACTED], Aadhaar: [REDACTED]).`,
        source_ref: `drivers_roster.csv ${d.driverId}`,
        relevanceScore: score,
        metadata: { type: 'driver', id: d.driverId },
      });
    }
  }

  // 4. Breakdown Tickets Facts
  const tickets = await store.getAllTickets();
  for (const t of tickets) {
    const tId = t.ticketId.toLowerCase().replace(/[\s-]/g, '');
    const queryComp = cleanedQuery.replace(/[\s-]/g, '');
    let score = 0;
    if (queryComp.includes(tId)) {
      score += 1.0;
    } else if (cleanedQuery.includes(t.vehicle.toLowerCase())) {
      score += 0.5;
    }

    if (score > 0) {
      allFacts.push({
        text: `Breakdown Ticket ${t.ticketId}: Vehicle ${t.vehicle}, Driver ${t.driverId}, Client ${t.client}, Issue: "${t.issue}", Severity: ${t.severity}, Status: ${t.status}, Origin Hub: ${t.originHub} (${t.kmFromOriginHub} km away), Destination: ${t.destination}.`,
        source_ref: `tickets.json ${t.ticketId}`,
        relevanceScore: score,
        metadata: { type: 'ticket', id: t.ticketId },
      });
    }
  }

  // 5. Dispatcher Rules Facts
  for (const rule of Object.values(DISPATCHER_RULES)) {
    let score = 0;
    const ruleIdLower = rule.ruleId.toLowerCase();

    const ruleNameLower = rule.name.toLowerCase();

    if (cleanedQuery.includes(ruleIdLower)) {
      score += 1.0;
    } else if (cleanedQuery.includes(ruleNameLower)) {
      score += 0.8;
    } else {
      // Keyword matching
      if (rule.ruleId === 'R-001' && (words.has('delhi') || words.has('ncr') || words.has('bs6') || words.has('bs4') || words.has('winter'))) {
        score += 0.6;
      } else if (rule.ruleId === 'R-002' && (words.has('hill') || words.has('heater') || words.has('rudrapur') || words.has('nainital'))) {
        score += 0.6;
      } else if (rule.ruleId === 'R-003' && (words.has('brake') || words.has('recency') || words.has('hill'))) {
        score += 0.6;
      } else if (rule.ruleId === 'R-004' && (words.has('origin') || words.has('50km') || words.has('hub') || words.has('buffer'))) {
        score += 0.5;
      } else if (rule.ruleId === 'R-005' && (words.has('service') || words.has('overdue') || words.has('grounded') || words.has('maintenance'))) {
        score += 0.5;
      } else if (rule.ruleId === 'R-006' && (words.has('jugaad') || words.has('temporary') || words.has('patch') || words.has('repair'))) {
        score += 0.7;
      } else if (rule.ruleId === 'R-007' && (words.has('orion') || words.has('pharma') || words.has('2020') || words.has('model') || words.has('year'))) {
        score += 0.7;
      } else if (rule.ruleId === 'R-008' && (words.has('shakti') || words.has('cement') || words.has('36') || words.has('sla') || words.has('48'))) {
        score += 0.7;
      } else if (rule.ruleId === 'R-009' && (words.has('vertex') || words.has('ludhiana') || words.has('cutoff') || words.has('gate') || words.has('18:00'))) {
        score += 0.7;
      } else if (rule.ruleId === 'R-010' && (words.has('apex') || words.has('rotation') || words.has('plate') || words.has('chemicals'))) {
        score += 0.7;
      } else if (rule.ruleId === 'R-011' && (words.has('monsoon') || words.has('eastern') || words.has('buffer') || words.has('transit'))) {
        score += 0.7;
      } else if (rule.ruleId === 'R-013' && (words.has('night') || words.has('solo') || words.has('tenure') || words.has('driver'))) {
        score += 0.6;
      }
    }

    if (score > 0) {
      allFacts.push({
        text: `Rule ${rule.ruleId} (${rule.name}): ${rule.condition}. Decision: ${rule.decision}.`,
        source_ref: rule.sourceReference || `dispatcher_interview.txt ${rule.ruleId}`,
        relevanceScore: score,
        metadata: { type: 'rule', id: rule.ruleId },
      });
    }
  }

  // Sort facts by relevance score descending and take top 10
  allFacts.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
  return allFacts.slice(0, 10);
}

/**
 * Primary chat entry point.
 * Masks PII in user message, retrieves facts, gates with relevance threshold,
 * calls Gemini, and logs immutable audit trail with citations.
 */
export async function chatAnswer(
  userMessage: string,
  conversationHistory: ChatMessageHistory[] = []
): Promise<AnswerWithCitations> {
  if (!userMessage || typeof userMessage !== 'string' || !userMessage.trim()) {
    return {
      answer: "I don't have enough information to answer this based on the ingested records.",
      status: 'insufficient_data',
      source_refs: [],
      sources: [],
    };
  }

  // 1. Enforce PII masking boundary on user message before processing or logging
  const { data: sanitizedUserMessage } = maskPii(userMessage.trim());
  const safeMessage = String(sanitizedUserMessage);

  // 2. Retrieve relevant facts
  const candidateFacts = await retrieveContextFacts(safeMessage, conversationHistory);

  // 3. Filter by relevance threshold
  const relevantFacts = candidateFacts.filter(
    (f) => (f.relevanceScore || 0) >= RELEVANCE_THRESHOLD
  );

  // 4. If no facts clear the relevance threshold, SKIP Gemini call entirely!
  if (relevantFacts.length === 0) {
    const insufficientAnswer = "I don't have enough information to answer this based on the ingested records.";
    
    // Log refusal to audit trail
    await createAuditEvent({
      ticketId: 'CHAT',
      eventType: 'CHAT_QUERY',
      actor: 'user',
      reason: safeMessage,
      sourceReferences: [],
      safeMetadata: {
        question: safeMessage,
        factsRetrieved: [],
        citations: [],
        finalAnswer: insufficientAnswer,
        status: 'insufficient_data',
      },
    });

    return {
      answer: insufficientAnswer,
      status: 'insufficient_data',
      source_refs: [],
      sources: [],
      maskedUserMessage: safeMessage,
    };
  }

  // 5. Extract unique source references
  const sourceRefs = Array.from(new Set(relevantFacts.map((f) => f.source_ref)));

  // Convert facts to SourceCitation objects for structured representation
  const structuredSources: SourceCitation[] = relevantFacts.map((f, i) => ({
    sourceId: `chat_fact_${i + 1}`,
    sourceFile: f.source_ref.split(' ')[0] || 'records',
    sourceType: (f.metadata?.type as string) === 'vehicle' ? 'fleet_master' : 'dispatcher_interview',
    recordId: String(f.metadata?.id || f.source_ref),
    field: 'operational_fact',
    originalValueMasked: f.text,
    resolvedValue: f.text,
    precedence: 3,
    resolutionReason: 'Retrieved operational fact',
  }));

  // 6. Call generateAnswer() with strictly masked facts
  let finalAnswer = '';
  let status: 'grounded' | 'insufficient_data' = 'grounded';

  try {
    finalAnswer = await generateAnswer(safeMessage, relevantFacts);
    if (
      finalAnswer.toLowerCase().includes("don't have enough information") ||
      finalAnswer.toLowerCase().includes('insufficient data')
    ) {
      status = 'insufficient_data';
    }
  } catch (err) {
    console.warn('generateAnswer failed, falling back to deterministic facts output:', err);
    finalAnswer = `Based on operational records:\n${relevantFacts.map((f) => f.text).join('\n')}`;
    status = 'grounded';
  }

  // 7. Log complete exchange to audit trail
  await createAuditEvent({
    ticketId: 'CHAT',
    eventType: 'CHAT_QUERY',
    actor: 'user',
    reason: safeMessage,
    sourceReferences: sourceRefs,
    safeMetadata: {
      question: safeMessage,
      factsRetrieved: relevantFacts.map((f) => f.text),
      citations: sourceRefs,
      finalAnswer,
      status,
    },
  });

  return {
    answer: finalAnswer,
    status,
    source_refs: sourceRefs,
    sources: structuredSources,
    maskedUserMessage: safeMessage,
  };
}

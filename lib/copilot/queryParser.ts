/**
 * Query Parser & Entity Extraction Service for Operations Copilot
 * Identifies structured operational entities, query intent, and resolves conversational pronouns.
 */

import { ConversationMessage, ExtractedEntities, QueryIntent } from './types';
import { normalizeVehicleReg, normalizeDriverId, normalizeClientName } from '../normalization';

const INDIAN_PLATE_REGEX = /\b[A-Z]{2}[0-9]{1,2}(?:[\s\-]?[A-Z]{1,3})?[\s\-]?[0-9]{1,4}\b/gi;
const FLEET_ID_REGEX = /\bMF[\s\-]?[0-9]{1,3}\b/gi;
const TRUCK_ID_REGEX = /\b(?:TRK|TRUCK)[\s\-]?[0-9]{1,4}\b/gi;
const DRIVER_ID_REGEX = /\bDRV[\s\-]?[0-9]{1,3}\b/gi;
const TICKET_ID_REGEX = /\b(?:TKT|BRK|TICKET|INCIDENT)[\s\-]?[A-Z0-9_\-]{3,15}\b/gi;
const RULE_ID_REGEX = /\bR[\s\-]?[0-9]{1,3}\b/gi;

const KNOWN_HUBS = [
  'delhi',
  'gurgaon',
  'kanpur',
  'lucknow',
  'jaipur',
  'ludhiana',
  'ambala',
  'chandigarh',
  'rudrapur',
  'nainital',
  'mumbai',
  'pune',
  'bengaluru',
  'chennai',
];

const KNOWN_CLIENTS = ['shakti', 'vertex', 'apex', 'orion', 'internal'];

const PRONOUN_FOLLOW_UP_REGEX = /\b(it|this|that|its|the vehicle|the truck|the ticket|the driver|this vehicle|this truck|this decision|this ticket|he|him|they|iska|iski|iske|usko|use|wo|woh|yeh|ye|gaadi|gadi|truck|इसकी|इसका|इसके|गाड़ी)\b/i;

export function parseQuery(
  question: string,
  conversationHistory: ConversationMessage[] = []
): { entities: ExtractedEntities; intent: QueryIntent } {
  const cleanQ = question.trim();
  const lowerQ = cleanQ.toLowerCase();

  const vehicleSet = new Set<string>();
  const driverSet = new Set<string>();
  const ticketSet = new Set<string>();
  const clientSet = new Set<string>();
  const ruleSet = new Set<string>();
  const locationSet = new Set<string>();

  // 1. Direct Entity Extraction from current question
  const plateMatches = cleanQ.match(INDIAN_PLATE_REGEX) || [];
  for (const m of plateMatches) {
    const norm = normalizeVehicleReg(m);
    if (norm && !norm.startsWith('DRV-') && !norm.startsWith('TKT-') && !norm.startsWith('BRK-')) {
      vehicleSet.add(norm);
    }
  }

  const fleetMatches = cleanQ.match(FLEET_ID_REGEX) || [];
  for (const m of fleetMatches) {
    const norm = normalizeVehicleReg(m);
    if (norm) vehicleSet.add(norm);
  }

  const truckMatches = cleanQ.match(TRUCK_ID_REGEX) || [];
  for (const m of truckMatches) {
    const norm = normalizeVehicleReg(m);
    if (norm) vehicleSet.add(norm);
  }

  const driverMatches = cleanQ.match(DRIVER_ID_REGEX) || [];
  for (const m of driverMatches) {
    const norm = normalizeDriverId(m);
    if (norm) driverSet.add(norm);
  }

  const ticketMatches = cleanQ.match(TICKET_ID_REGEX) || [];
  for (const m of ticketMatches) {
    const cleanId = m.toUpperCase().replace(/\s+/g, '-');
    ticketSet.add(cleanId);
  }

  const ruleMatches = cleanQ.match(RULE_ID_REGEX) || [];
  for (const m of ruleMatches) {
    const cleanRule = m.toUpperCase().replace(/\s+/g, '-');
    ruleSet.add(cleanRule);
  }

  for (const client of KNOWN_CLIENTS) {
    if (lowerQ.includes(client)) {
      clientSet.add(normalizeClientName(client));
    }
  }

  for (const hub of KNOWN_HUBS) {
    if (lowerQ.includes(hub)) {
      locationSet.add(hub.charAt(0).toUpperCase() + hub.slice(1));
    }
  }

  // 2. Check for Conversational Pronouns / Follow-up references
  const hasPronounOrFollowUp = PRONOUN_FOLLOW_UP_REGEX.test(cleanQ) || cleanQ.length < 40;

  if (conversationHistory.length > 0) {
    // If entities are missing in current question and follow-up words are detected, resolve from history
    const recentMessages = [...conversationHistory].reverse();
    for (const msg of recentMessages) {
      if (vehicleSet.size === 0) {
        const hPlate = msg.content.match(INDIAN_PLATE_REGEX) || [];
        const hFleet = msg.content.match(FLEET_ID_REGEX) || [];
        const hTruck = msg.content.match(TRUCK_ID_REGEX) || [];
        for (const m of [...hPlate, ...hFleet, ...hTruck]) {
          const norm = normalizeVehicleReg(m);
          if (norm && !norm.startsWith('DRV-') && !norm.startsWith('TKT-') && !norm.startsWith('BRK-')) {
            vehicleSet.add(norm);
            break;
          }
        }
      }

      if (ticketSet.size === 0) {
        const hTicket = msg.content.match(TICKET_ID_REGEX) || [];
        for (const m of hTicket) {
          ticketSet.add(m.toUpperCase().replace(/\s+/g, '-'));
          break;
        }
      }

      if (driverSet.size === 0) {
        const hDriver = msg.content.match(DRIVER_ID_REGEX) || [];
        for (const m of hDriver) {
          const norm = normalizeDriverId(m);
          if (norm) {
            driverSet.add(norm);
            break;
          }
        }
      }

      if (clientSet.size === 0) {
        for (const client of KNOWN_CLIENTS) {
          if (msg.content.toLowerCase().includes(client)) {
            clientSet.add(normalizeClientName(client));
            break;
          }
        }
      }
    }
  }

  // 3. Intent Classification
  let intent: QueryIntent = 'general_query';

  if (
    lowerQ.includes('reject') ||
    lowerQ.includes('ineligible') ||
    lowerQ.includes('kyun kiya') ||
    lowerQ.includes('kyu kiya') ||
    lowerQ.includes('क्यों') ||
    (lowerQ.includes('why') && lowerQ.includes('rejected'))
  ) {
    intent = 'vehicle_rejection';
  } else if (
    lowerQ.includes('maint') ||
    lowerQ.includes('repair') ||
    lowerQ.includes('mechanic') ||
    lowerQ.includes('jugaad') ||
    lowerQ.includes('kharab') ||
    lowerQ.includes('खराब') ||
    lowerQ.includes('service overdue')
  ) {
    intent = 'maintenance_issue';
  } else if (
    lowerQ.includes('trip') ||
    lowerQ.includes('route') ||
    lowerQ.includes('history') ||
    lowerQ.includes('consign') ||
    lowerQ.includes('kaha gayi') ||
    lowerQ.includes('kahan')
  ) {
    intent = 'trip_history';
  } else if (
    lowerQ.includes('client') ||
    lowerQ.includes('customer') ||
    lowerQ.includes('sla') ||
    lowerQ.includes('contract')
  ) {
    intent = 'client_info';
  } else if (
    lowerQ.includes('replacement') ||
    lowerQ.includes('selected') ||
    lowerQ.includes('choose') ||
    lowerQ.includes('candidate') ||
    lowerQ.includes('badle') ||
    lowerQ.includes('chunna')
  ) {
    intent = 'replacement_selection';
  } else if (
    lowerQ.includes('rule') ||
    lowerQ.includes('policy') ||
    lowerQ.includes('grap') ||
    lowerQ.includes('winter') ||
    lowerQ.includes('50km') ||
    lowerQ.includes('niyam') ||
    lowerQ.includes('नियम')
  ) {
    intent = 'dispatcher_rule';
  } else if (lowerQ.includes('evidence') || lowerQ.includes('source') || lowerQ.includes('audit') || lowerQ.includes('log')) {
    intent = lowerQ.includes('audit') ? 'audit_trail' : 'decision_evidence';
  } else if (lowerQ.includes('conflict') || lowerQ.includes('discrepancy') || lowerQ.includes('mismatch')) {
    intent = 'vehicle_conflicts';
  } else if (lowerQ.includes('work order') || lowerQ.includes('order')) {
    intent = 'work_order';
  } else if (ticketSet.size > 0 || lowerQ.includes('ticket') || lowerQ.includes('breakdown')) {
    intent = 'ticket_status';
  } else if (vehicleSet.size > 0 || lowerQ.includes('truck') || lowerQ.includes('vehicle') || lowerQ.includes('gaadi') || lowerQ.includes('गाड़ी')) {
    intent = 'vehicle_status';
  }

  const entities: ExtractedEntities = {
    vehicleIds: Array.from(vehicleSet),
    driverIds: Array.from(driverSet),
    ticketIds: Array.from(ticketSet),
    clientNames: Array.from(clientSet),
    ruleIds: Array.from(ruleSet),
    locations: Array.from(locationSet),
    hasPronounOrFollowUp,
    rawQuestion: cleanQ,
  };

  return { entities, intent };
}

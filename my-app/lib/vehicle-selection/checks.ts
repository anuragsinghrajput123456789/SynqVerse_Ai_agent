/**
 * Replacement Vehicle Selection - Evaluation Checks
 */

import { Vehicle, QueueTicket } from '../types';
import { DISPATCHER_RULES } from '../decision-engine/rules';
import { CheckFailure } from './types';

function isWinterMonth(dateStr: string): boolean {
  try {
    const d = new Date(dateStr);
    const month = d.getMonth() + 1;
    return [10, 11, 12, 1, 2].includes(month);
  } catch {
    return false;
  }
}

function isHillDestination(destination: string): boolean {
  const hillList = ['rudrapur', 'nainital', 'uttarakhand', 'haldwani', 'almora'];
  const dest = (destination || '').toLowerCase();
  return hillList.some((h) => dest.includes(h));
}

function touchesDelhiNcr(origin: string, destination: string): boolean {
  const ncrList = ['delhi', 'gurgaon', 'faridabad', 'noida'];
  const orig = (origin || '').toLowerCase();
  const dest = (destination || '').toLowerCase();
  return ncrList.some((n) => orig.includes(n) || dest.includes(n));
}

export function checkIsAvailable(candidate: Vehicle): CheckFailure | null {
  const statusClean = (candidate.status || '').trim().toLowerCase();
  if (statusClean !== 'active' && statusClean !== 'available') {
    return {
      check: 'is_available',
      reason: `Vehicle status is '${candidate.status}' (must be Active/AVAILABLE)`,
      ruleId: 'R-012',
    };
  }
  return null;
}

export function checkCorrectCapacity(
  candidate: Vehicle,
  requiredCapacityTonnes: number = 10
): CheckFailure | null {
  if ((candidate.capacityTonnes || 0) < requiredCapacityTonnes) {
    return {
      check: 'correct_capacity',
      reason: `Vehicle capacity (${candidate.capacityTonnes} tonnes) is less than required consignment payload (${requiredCapacityTonnes} tonnes)`,
      ruleId: 'R-012',
    };
  }
  return null;
}

export function checkNotAlreadyAssigned(
  candidate: Vehicle,
  ticket: QueueTicket,
  activeTripVehicleIds?: Set<string>
): CheckFailure | null {
  const candReg = (candidate.registrationNumber || '').replace(/[\s\-]+/g, '').toUpperCase();
  const brokenReg = (ticket.vehicle || '').replace(/[\s\-]+/g, '').toUpperCase();

  // Cannot replace a broken truck with itself
  if (candReg === brokenReg) {
    return {
      check: 'not_already_assigned',
      reason: `Candidate vehicle (${candidate.registrationNumber}) is the broken vehicle itself`,
    };
  }

  // Active in-transit status check
  const statusClean = (candidate.status || '').trim().toLowerCase();
  if (statusClean === 'in transit' || statusClean === 'in_transit') {
    return {
      check: 'not_already_assigned',
      reason: `Candidate vehicle (${candidate.registrationNumber}) is currently assigned in transit`,
      ruleId: 'R-012',
    };
  }

  // Check active trip roster
  if (activeTripVehicleIds) {
    const candId = (candidate.vehicleId || '').toUpperCase();
    if (activeTripVehicleIds.has(candReg) || activeTripVehicleIds.has(candId)) {
      return {
        check: 'not_already_assigned',
        reason: `Candidate vehicle (${candidate.registrationNumber}) is currently assigned to an active trip schedule`,
      };
    }
  }

  return null;
}

export function checkMaintenanceValid(
  candidate: Vehicle,
  ticket: QueueTicket
): CheckFailure | null {
  const statusClean = (candidate.status || '').trim().toLowerCase();
  if (statusClean === 'grounded' || statusClean === 'maintenance') {
    return {
      check: 'maintenance_valid',
      reason: `Rule R-005: Vehicle is flagged as GROUNDED or in MAINTENANCE workshop (>30 days overdue)`,
      ruleId: 'R-005',
    };
  }

  const isHill = isHillDestination(ticket.destination);
  // Check if candidate vehicle has had brake maintenance within 30 days on a hill route
  // For RJ43DD3546 / RJ43-DD-3546 in maintenance history
  const candClean = candidate.registrationNumber.replace(/[\s\-]+/g, '').toUpperCase();
  if (isHill && candClean === 'RJ43DD3546') {
    return {
      check: 'maintenance_valid',
      reason: `Rule R-003: Vehicle had brake maintenance within the last 30 days. Strictly prohibited on hill routes until 30 days of flat running completed`,
      ruleId: 'R-003',
    };
  }

  return null;
}

export function checkRouteAndSeasonalRestrictions(
  candidate: Vehicle,
  ticket: QueueTicket
): CheckFailure | null {
  const isWinter = isWinterMonth(ticket.createdAt);
  const ncrRoute = touchesDelhiNcr(ticket.originHub, ticket.destination);
  const isHill = isHillDestination(ticket.destination);

  // 1. Winter Delhi NCR BS6 Restriction (Rule R-001)
  if (isWinter && ncrRoute) {
    if (candidate.bsStage !== 'BS6') {
      return {
        check: 'seasonal_restrictions_satisfied',
        reason: `Rule R-001: BS4 vehicle prohibited on Delhi NCR route in winter (October-February) under GRAP air quality regulations. BS6 vehicle mandatory.`,
        ruleId: 'R-001',
      };
    }
  }

  // 2. Hill Route Engine Heater Requirement (Rule R-002)
  if (isWinter && isHill) {
    if (!candidate.engineHeater) {
      return {
        check: 'seasonal_restrictions_satisfied',
        reason: `Rule R-002: Vehicle lacks operational engine heater required for winter hill route cold starts (Rudrapur/Nainital).`,
        ruleId: 'R-002',
      };
    }
  }

  return null;
}

export function checkClientRequirements(
  candidate: Vehicle,
  ticket: QueueTicket
): CheckFailure | null {
  // 1. Orion Pharma Minimum Model Year Requirement (Rule R-007)
  if (ticket.client === 'Orion Pharma') {
    if ((candidate.year || 0) < 2020) {
      return {
        check: 'client_requirements_satisfied',
        reason: `Rule R-007: Orion Pharma audit mandates vehicle model year 2020 or newer. Candidate year is ${candidate.year}.`,
        ruleId: 'R-007',
      };
    }
  }

  // 2. Apex Chemicals Plate Rotation (Rule R-010)
  if (ticket.client === 'Apex Chemicals') {
    const cleanReg = candidate.registrationNumber.replace(/[\s\-]+/g, '').toUpperCase();
    if (cleanReg === 'UP54XZ6139') {
      return {
        check: 'client_requirements_satisfied',
        reason: `Rule R-010: Candidate vehicle was involved in a breakdown on its previous Apex Chemicals run. Plate rotation strictly required.`,
        ruleId: 'R-010',
      };
    }
  }

  return null;
}

export function checkDispatcherRules(
  candidate: Vehicle,
  ticket: QueueTicket
): CheckFailure | null {
  const isUnder50km = (ticket.kmFromOriginHub || 0) <= 50;

  // Origin Hub Sourcing for <50km Breakdowns (Rule R-004)
  if (isUnder50km) {
    if (candidate.homeHub !== ticket.originHub) {
      return {
        check: 'dispatcher_rules_satisfied',
        reason: `Rule R-004: Breakdown is within 50km (${ticket.kmFromOriginHub}km) of origin hub '${ticket.originHub}'. Replacement must be sourced from origin hub; candidate is at '${candidate.homeHub}'.`,
        ruleId: 'R-004',
      };
    }
  }

  return null;
}

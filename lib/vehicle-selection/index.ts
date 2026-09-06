/**
 * Replacement Vehicle Selection Service
 * Deterministic candidate evaluation, constraint verification, and ranking.
 */

import { QueueTicket, Vehicle } from '../types';
import { UnifiedContextStore } from '../context';
import { selectReplacementVehicle, evaluateCandidateVehicle } from './engine';
import {
  VehicleSelectionResult,
  CandidateEvaluationResult,
  VehicleSelectionQuery,
} from './types';

export * from './types';
export * from './checks';
export * from './engine';

export class ReplacementVehicleSelectionService {
  private static instance: ReplacementVehicleSelectionService;
  private store = UnifiedContextStore.getInstance();

  public static getInstance(): ReplacementVehicleSelectionService {
    if (!ReplacementVehicleSelectionService.instance) {
      ReplacementVehicleSelectionService.instance = new ReplacementVehicleSelectionService();
    }
    return ReplacementVehicleSelectionService.instance;
  }

  /**
   * Evaluates all fleet vehicles in the context store against the breakdown ticket requirements
   */
  public async findReplacementVehicle(
    ticket: QueueTicket,
    requiredCapacityTonnes: number = 10,
    activeTripVehicleIds?: Set<string>
  ): Promise<VehicleSelectionResult> {
    const allVehicles: Vehicle[] = await this.store.getAllVehicles();

    const query: VehicleSelectionQuery = {
      ticket,
      requiredCapacityTonnes,
      candidatePool: allVehicles,
      activeTripVehicleIds,
    };

    return selectReplacementVehicle(query);
  }

  /**
   * Evaluates a specific single candidate vehicle
   */
  public evaluateSingleCandidate(
    candidate: Vehicle,
    ticket: QueueTicket,
    requiredCapacityTonnes: number = 10,
    activeTripVehicleIds?: Set<string>
  ): CandidateEvaluationResult {
    return evaluateCandidateVehicle(candidate, ticket, requiredCapacityTonnes, activeTripVehicleIds);
  }
}

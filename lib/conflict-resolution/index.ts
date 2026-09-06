/**
 * Conflict Resolution Engine
 */

import { Conflict, SourceCitation } from '../types';

export interface FieldCandidate {
  value: unknown;
  sourceType: SourceCitation['sourceType'];
  sourceFile: string;
  sourceId: string;
  recordId: string;
  timestamp?: string;
}

export const DEFAULT_SOURCE_PRECEDENCE: Record<string, number> = {
  fleet_master: 1,
  drivers_roster: 1,
  maintenance_log: 2,
  meridian_trips: 3,
  tickets: 3,
  email_thread: 4,
  dispatcher_interview: 5,
};

export const FIELD_PRECEDENCE_OVERRIDES: Record<string, Record<string, number>> = {
  operationalSlaHours: {
    email_thread: 1,
    dispatcher_interview: 1,
    tickets: 2,
    meridian_trips: 2,
    fleet_master: 3,
  },
};

export class ConflictResolver {
  private conflicts: Conflict[] = [];

  public resolveField<T = unknown>(
    entityType: Conflict['entityType'],
    entityId: string,
    field: string,
    candidates: FieldCandidate[],
    ingestionRunId: string,
    customReason?: string
  ): { winningValue: T; winningSource: string; citations: SourceCitation[]; conflicts: Conflict[] } {
    if (!candidates || candidates.length === 0) {
      throw new Error(`No candidates provided to resolve field ${field} for ${entityId}`);
    }

    const fieldOverrides = FIELD_PRECEDENCE_OVERRIDES[field];

    const sorted = [...candidates].sort((a, b) => {
      const rankA = fieldOverrides?.[a.sourceType] ?? DEFAULT_SOURCE_PRECEDENCE[a.sourceType] ?? 99;
      const rankB = fieldOverrides?.[b.sourceType] ?? DEFAULT_SOURCE_PRECEDENCE[b.sourceType] ?? 99;
      if (rankA !== rankB) return rankA - rankB;

      if (a.timestamp && b.timestamp) {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      }
      return 0;
    });

    const winner = sorted[0];
    const winningRank = fieldOverrides?.[winner.sourceType] ?? DEFAULT_SOURCE_PRECEDENCE[winner.sourceType] ?? 99;

    const winnerCitation: SourceCitation = {
      sourceId: winner.sourceId,
      sourceFile: winner.sourceFile,
      sourceType: winner.sourceType,
      recordId: winner.recordId,
      field,
      originalValueMasked: winner.value,
      resolvedValue: winner.value,
      precedence: winningRank,
      resolutionReason: customReason || `Selected by precedence rank ${winningRank} from source '${winner.sourceType}'`,
      timestamp: winner.timestamp || new Date().toISOString(),
    };

    const fieldConflicts: Conflict[] = [];

    for (let i = 1; i < sorted.length; i++) {
      const rejected = sorted[i];

      if (String(winner.value) !== String(rejected.value)) {
        const conflictRecord: Conflict = {
          id: `conflict_${entityId}_${field}_${i}_${ingestionRunId.slice(0, 8)}`,
          entityType,
          entityId,
          field,
          winningValue: winner.value,
          winningSource: winner.sourceId,
          rejectedValue: rejected.value,
          rejectedSource: rejected.sourceId,
          reason:
            customReason ||
            `Source '${winner.sourceType}' (rank ${winningRank}) overrides source '${rejected.sourceType}'`,
          timestamp: winner.timestamp || new Date().toISOString(),
          ingestionRunId,
        };

        fieldConflicts.push(conflictRecord);
        this.conflicts.push(conflictRecord);
      }
    }

    return {
      winningValue: winner.value as T,
      winningSource: winner.sourceId,
      citations: [winnerCitation],
      conflicts: fieldConflicts,
    };
  }

  public getAllConflicts(): Conflict[] {
    return [...this.conflicts];
  }

  public clear() {
    this.conflicts = [];
  }
}

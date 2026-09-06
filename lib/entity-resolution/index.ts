/**
 * Deterministic Entity Resolution Engine
 */

import { ResolvedEntity, EntityStatus, MatchingMethod, SourceCitation, Conflict } from '../types';
import { normalizeVehicleReg, normalizeDriverId } from '../normalization';

export class EntityResolver {
  private vehicleAliasMap: Map<string, string> = new Map();
  private driverAliasMap: Map<string, string> = new Map();

  public registerVehicleAlias(alias: string, canonicalReg: string) {
    const normAlias = normalizeVehicleReg(alias);
    const normReg = normalizeVehicleReg(canonicalReg);
    if (normReg) {
      this.vehicleAliasMap.set(normReg, normReg);
      if (normAlias) {
        this.vehicleAliasMap.set(normAlias, normReg);
      }
    }
  }

  public resolveVehicleId(input: string): {
    canonicalId: string;
    matchingMethod: MatchingMethod;
    confidence: number;
    status: EntityStatus;
  } {
    const norm = normalizeVehicleReg(input);
    if (!norm) {
      return {
        canonicalId: '',
        matchingMethod: 'EXACT_ALIAS',
        confidence: 0,
        status: 'UNRESOLVED',
      };
    }

    const resolved = this.vehicleAliasMap.get(norm);
    if (resolved) {
      return {
        canonicalId: resolved,
        matchingMethod: norm === resolved ? 'CANONICAL_ID' : 'EXACT_ALIAS',
        confidence: 1.0,
        status: 'RESOLVED',
      };
    }

    if (/^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/.test(norm)) {
      return {
        canonicalId: norm,
        matchingMethod: 'EXACT_PLATE',
        confidence: 0.95,
        status: 'RESOLVED',
      };
    }

    return {
      canonicalId: norm,
      matchingMethod: 'EXACT_ALIAS',
      confidence: 0.5,
      status: 'AMBIGUOUS',
    };
  }

  public registerDriverAlias(alias: string, canonicalId: string) {
    const normAlias = normalizeDriverId(alias);
    const normId = normalizeDriverId(canonicalId);
    if (normId) {
      this.driverAliasMap.set(normId, normId);
      if (normAlias) {
        this.driverAliasMap.set(normAlias, normId);
      }
    }
  }

  public resolveDriverId(input: string): {
    canonicalId: string;
    matchingMethod: MatchingMethod;
    confidence: number;
    status: EntityStatus;
  } {
    const norm = normalizeDriverId(input);
    if (!norm) {
      return {
        canonicalId: '',
        matchingMethod: 'EXACT_ROSTER_ID',
        confidence: 0,
        status: 'UNRESOLVED',
      };
    }

    const resolved = this.driverAliasMap.get(norm);
    if (resolved) {
      return {
        canonicalId: resolved,
        matchingMethod: 'EXACT_ROSTER_ID',
        confidence: 1.0,
        status: 'RESOLVED',
      };
    }

    return {
      canonicalId: norm,
      matchingMethod: 'EXACT_ROSTER_ID',
      confidence: 0.3,
      status: 'UNRESOLVED',
    };
  }

  public createResolvedEntity(
    canonicalId: string,
    type: 'vehicle' | 'driver' | 'client',
    canonicalData: Record<string, unknown>,
    originalValue: string,
    source: string,
    matchingMethod: MatchingMethod,
    confidence: number,
    status: EntityStatus,
    aliases: string[],
    citations: SourceCitation[],
    conflicts: Conflict[],
    ingestionRunId: string
  ): ResolvedEntity {
    return {
      canonicalId,
      type,
      canonicalData,
      originalValue,
      source,
      matchingMethod,
      confidence,
      status,
      aliases: Array.from(new Set(aliases.filter(Boolean))),
      citations,
      conflicts,
      ingestionRunId,
    };
  }
}

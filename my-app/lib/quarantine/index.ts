/**
 * Quarantine Engine
 */

import { QuarantineRecord } from '../types';
import { maskPii } from '../pii';

export class QuarantineManager {
  private records: QuarantineRecord[] = [];

  public quarantine(
    source: string,
    recordIdentifier: string,
    reason: string,
    validationErrors: string[],
    rawRecord: Record<string, unknown>,
    ingestionRunId: string
  ): QuarantineRecord {
    const maskedPayload = maskPii(rawRecord).data;

    const record: QuarantineRecord = {
      id: `quarantine_${recordIdentifier || Math.random().toString(36).substring(7)}_${ingestionRunId.slice(0, 8)}`,
      source,
      recordIdentifier,
      reason,
      validationErrors,
      ingestionRunId,
      timestamp: new Date().toISOString(),
      status: 'QUARANTINED',
      rawRecordMasked: typeof maskedPayload === 'object' && maskedPayload !== null ? (maskedPayload as Record<string, unknown>) : { raw: maskedPayload },
    };

    this.records.push(record);
    return record;
  }

  public getQuarantinedRecords(): QuarantineRecord[] {
    return [...this.records];
  }

  public clear() {
    this.records = [];
  }
}

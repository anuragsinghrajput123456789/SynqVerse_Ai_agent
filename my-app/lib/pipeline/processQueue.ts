/**
 * Meridian Resolve Full Queue Processing Service
 * Iterates through tickets deterministically, accumulating statistics and ensuring
 * that one malformed ticket never halts queue progression.
 */

import { QueueTicket } from '../types';
import { QueueRepository } from '../repositories';
import { processTicket } from './processTicket';
import {
  ProcessTicketResult,
  QueueProcessingStatistics,
  ProcessQueueResult,
} from './types';

export async function processQueue(
  explicitTickets?: QueueTicket[]
): Promise<ProcessQueueResult> {
  const queueRepo = new QueueRepository();
  const ticketsToProcess: QueueTicket[] =
    explicitTickets || (await queueRepo.findAll());

  const stats: QueueProcessingStatistics = {
    total: ticketsToProcess.length,
    processed: 0,
    duplicates: 0,
    quarantined: 0,
    errors: 0,
    workOrdersCreated: 0,
    workOrdersExisting: 0,
    messagesDrafted: 0,
    approvalsPending: 0,
  };

  const results: ProcessTicketResult[] = [];

  for (const ticket of ticketsToProcess) {
    try {
      const res = await processTicket(ticket);
      results.push(res);

      if (res.outcome === 'COMPLETED') {
        stats.processed++;
      } else if (res.outcome === 'DUPLICATE_SKIPPED') {
        stats.duplicates++;
      } else if (res.outcome === 'QUARANTINED') {
        stats.quarantined++;
      } else if (res.outcome === 'ERROR') {
        stats.errors++;
      }

      if (res.workOrderStatus === 'created') {
        stats.workOrdersCreated++;
      } else if (res.workOrderStatus === 'existing') {
        stats.workOrdersExisting++;
      }

      if (res.clientMessageDraft) {
        stats.messagesDrafted++;
      }

      if (res.approvalRecord && res.approvalRecord.status === 'PENDING') {
        stats.approvalsPending++;
      }
    } catch (err: unknown) {
      // Guard: A fatal exception in one ticket never halts the entire queue
      stats.errors++;
      const errTicketId = ticket.ticketId || ticket.canonicalTicketId || 'UNKNOWN';
      results.push({
        ticketId: errTicketId,
        outcome: 'ERROR',
        queueTicket: ticket,
        error: err instanceof Error ? err.message : String(err),
        auditEvents: [],
      });
    }
  }

  return {
    stats,
    results,
  };
}

import { NextResponse } from 'next/server';
import { processQueue } from '@/lib/pipeline';
import { runIngestion } from '@/lib/ingestion';
import { QueueRepository } from '@/lib/repositories';

export async function POST() {
  try {
    const queueRepo = new QueueRepository();
    let tickets = await queueRepo.findAll();
    
    // Auto-ingest if empty
    if (tickets.length === 0) {
      await runIngestion();
      tickets = await queueRepo.findAll();
    }

    const result = await processQueue(tickets);
    return NextResponse.json({
      success: true,
      stats: result.stats,
      resultsCount: result.results.length,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

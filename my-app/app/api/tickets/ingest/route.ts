import { NextRequest, NextResponse } from 'next/server';
import { BreakdownQueueService } from '@/lib/queue';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const queueService = BreakdownQueueService.getInstance();

    const result = await queueService.ingestTickets({
      customTickets: Array.isArray(body.tickets) ? body.tickets : undefined,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('API Error /api/tickets/ingest POST:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

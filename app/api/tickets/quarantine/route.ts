import { NextResponse } from 'next/server';
import { BreakdownQueueService } from '@/lib/queue';

export async function GET() {
  try {
    const queueService = BreakdownQueueService.getInstance();
    const quarantined = await queueService.getQuarantineTickets();

    return NextResponse.json({
      count: quarantined.length,
      quarantined,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('API Error /api/tickets/quarantine GET:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { BreakdownQueueService } from '@/lib/queue';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { ticketId, status } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId is required' }, { status: 400 });
    }

    const queueService = BreakdownQueueService.getInstance();
    const updated = await queueService.processTicket(ticketId, status);

    if (!updated) {
      return NextResponse.json({ error: `Ticket '${ticketId}' not found` }, { status: 404 });
    }

    return NextResponse.json({ success: true, ticket: updated });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('API Error /api/tickets/process POST:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { BreakdownQueueService } from '@/lib/queue';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const queueService = BreakdownQueueService.getInstance();
    const result = await queueService.getTicketDetail(id);

    if (!result.ticket) {
      return NextResponse.json({ error: `Ticket '${id}' not found` }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('API Error /api/tickets/[id] GET:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

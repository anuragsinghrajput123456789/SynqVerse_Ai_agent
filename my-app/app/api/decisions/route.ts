import { NextRequest, NextResponse } from 'next/server';
import { DecisionEngine } from '@/lib/decision-engine';
import { BreakdownQueueService } from '@/lib/queue';

export async function GET() {
  try {
    const decisionEngine = DecisionEngine.getInstance();
    const decisions = await decisionEngine.getAllDecisions();
    return NextResponse.json({ count: decisions.length, decisions });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('API Error /api/decisions GET:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { ticketId } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'ticketId is required' }, { status: 400 });
    }

    const queueService = BreakdownQueueService.getInstance();
    const ticketDetail = await queueService.getTicketDetail(ticketId);

    if (!ticketDetail.ticket) {
      return NextResponse.json({ error: `Ticket '${ticketId}' not found` }, { status: 404 });
    }

    const decisionEngine = DecisionEngine.getInstance();
    const decision = await decisionEngine.evaluateTicket(ticketDetail.ticket);

    return NextResponse.json(decision);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('API Error /api/decisions POST:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

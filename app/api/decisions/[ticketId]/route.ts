import { NextRequest, NextResponse } from 'next/server';
import { DecisionEngine } from '@/lib/decision-engine';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ ticketId: string }> }
) {
  try {
    const { ticketId } = await params;
    const decisionEngine = DecisionEngine.getInstance();
    const decision = await decisionEngine.getOrEvaluateDecision(ticketId);

    if (!decision) {
      return NextResponse.json({ error: `No ticket or decision found for '${ticketId}'` }, { status: 404 });
    }

    return NextResponse.json(decision);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('API Error /api/decisions/[ticketId] GET:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

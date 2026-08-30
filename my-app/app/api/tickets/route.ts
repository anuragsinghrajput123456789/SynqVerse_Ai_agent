import { NextRequest, NextResponse } from 'next/server';
import { BreakdownQueueService } from '@/lib/queue';

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const search = url.searchParams.get('search') || '';
    const status = url.searchParams.get('status') || '';
    const severity = url.searchParams.get('severity') || '';

    const queueService = BreakdownQueueService.getInstance();
    const result = await queueService.getTickets({ search, status, severity });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('API Error /api/tickets GET:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

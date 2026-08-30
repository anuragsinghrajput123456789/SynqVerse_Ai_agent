import { NextRequest, NextResponse } from 'next/server';
import { AuditLogRepository } from '@/lib/audit';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');
    const eventType = searchParams.get('eventType');

    const auditRepo = new AuditLogRepository();
    let events = await auditRepo.findAll();

    if (ticketId) {
      events = events.filter((e) => e.ticketId === ticketId);
    }
    if (eventType) {
      events = events.filter((e) => e.eventType === eventType);
    }

    // Sort descending by timestamp for operational timeline
    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return NextResponse.json(events);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

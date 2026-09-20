import { NextRequest, NextResponse } from 'next/server';
import { EmergencyService } from '@/lib/emergency';
import { AuditLogRepository } from '@/lib/audit';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = EmergencyService.getInstance();
    const emergency = await service.getEmergencyById(id);

    if (!emergency) {
      return NextResponse.json(
        { success: false, error: `Emergency ${id} not found.` },
        { status: 404 }
      );
    }

    // Retrieve related audit events using indexed queries
    const auditRepo = new AuditLogRepository();
    const primaryAudit = await auditRepo.findByTicketId(emergency.id);
    let relatedAudit = primaryAudit;
    if (emergency.relatedIncidentId && emergency.relatedIncidentId !== emergency.id) {
      const secondaryAudit = await auditRepo.findByTicketId(emergency.relatedIncidentId);
      relatedAudit = [...primaryAudit, ...secondaryAudit].sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      );
    }

    return NextResponse.json({
      success: true,
      emergency,
      auditEvents: relatedAudit,
      auditTrail: relatedAudit,
    });

  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { QueueRepository, DecisionRepository } from '@/lib/repositories';
import { WorkOrderRepository } from '@/lib/work-orders';
import { ApprovalRepository } from '@/lib/approvals';

export async function GET() {
  try {
    const queueRepo = new QueueRepository();
    const decisionRepo = new DecisionRepository();
    const workOrderRepo = new WorkOrderRepository();
    const approvalRepo = new ApprovalRepository();

    const [tickets, decisions, workOrders, approvals] = await Promise.all([
      queueRepo.findAll(),
      decisionRepo.findAll(),
      workOrderRepo.findAll(),
      approvalRepo.findAll(),
    ]);

    const decisionMap = new Map(decisions.map((d) => [d.ticketId, d]));
    const workOrderMap = new Map(workOrders.map((w) => [w.ticketId, w]));
    const approvalMap = new Map(approvals.map((a) => [a.ticketId, a]));

    const enriched = tickets.map((t) => {
      const dec = decisionMap.get(t.ticketId);
      const wo = workOrderMap.get(t.ticketId);
      const app = approvalMap.get(t.ticketId);

      return {
        ticketId: t.ticketId,
        canonicalTicketId: t.canonicalTicketId,
        createdAt: t.createdAt,
        vehicle: t.vehicle,
        driverId: t.driverId,
        client: t.client,
        issue: t.issue,
        originHub: t.originHub,
        destination: t.destination,
        severity: dec?.severity || t.severity || 'MEDIUM',
        status: t.status,
        isQuarantined: t.isQuarantined,
        isDuplicate: t.isDuplicate,
        action: dec?.action || null,
        replacementVehicle: wo?.replacementVehicle || dec?.selectedVehicle?.registrationNumber || null,
        workOrderId: wo?.workOrderId || null,
        approvalStatus: app?.status || null,
      };
    });

    return NextResponse.json(enriched);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

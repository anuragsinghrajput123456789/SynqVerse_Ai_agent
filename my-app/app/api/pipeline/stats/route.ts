import { NextResponse } from 'next/server';
import { QueueRepository, DecisionRepository } from '@/lib/repositories';
import { WorkOrderRepository } from '@/lib/work-orders';
import { ApprovalRepository } from '@/lib/approvals';
import { AuditLogRepository } from '@/lib/audit';

export async function GET() {
  try {
    const queueRepo = new QueueRepository();
    const decisionRepo = new DecisionRepository();
    const workOrderRepo = new WorkOrderRepository();
    const approvalRepo = new ApprovalRepository();
    const auditRepo = new AuditLogRepository();

    const [tickets, decisions, workOrders, pendingApprovals, auditLogs] = await Promise.all([
      queueRepo.findAll(),
      decisionRepo.findAll(),
      workOrderRepo.findAll(),
      approvalRepo.findPending(),
      auditRepo.findAll(),
    ]);

    const total = tickets.length;
    const quarantined = tickets.filter((t) => t.isQuarantined).length;
    const duplicates = tickets.filter((t) => t.isDuplicate).length;
    const processed = tickets.filter((t) => t.status === 'COMPLETED' || (!t.isQuarantined && !t.isDuplicate)).length;

    return NextResponse.json({
      total,
      processed,
      duplicates,
      quarantined,
      workOrdersCount: workOrders.length,
      decisionsCount: decisions.length,
      pendingApprovalsCount: pendingApprovals.length,
      auditLogsCount: auditLogs.length,
      latestAudit: auditLogs[auditLogs.length - 1] || null,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

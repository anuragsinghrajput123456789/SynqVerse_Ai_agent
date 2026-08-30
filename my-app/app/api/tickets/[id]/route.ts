import { NextRequest, NextResponse } from 'next/server';
import {
  QueueRepository,
  DecisionRepository,
  VehicleRepository,
  DriverRepository,
  ClientRepository,
} from '@/lib/repositories';
import { WorkOrderRepository } from '@/lib/work-orders';
import { ApprovalRepository } from '@/lib/approvals';
import { AuditLogRepository } from '@/lib/audit';
import { getMongoDb } from '@/lib/db/mongodb';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const ticketId = id;

    const queueRepo = new QueueRepository();
    const decisionRepo = new DecisionRepository();
    const vehicleRepo = new VehicleRepository();
    const driverRepo = new DriverRepository();
    const clientRepo = new ClientRepository();
    const workOrderRepo = new WorkOrderRepository();
    const approvalRepo = new ApprovalRepository();
    const auditRepo = new AuditLogRepository();

    const ticket = await queueRepo.findByTicketId(ticketId);
    if (!ticket) {
      return NextResponse.json({ error: `Ticket '${ticketId}' not found` }, { status: 404 });
    }

    const [
      decision,
      vehicle,
      driver,
      client,
      workOrder,
      approval,
      auditTimeline,
    ] = await Promise.all([
      decisionRepo.findByTicketId(ticketId),
      vehicleRepo.findByReg(ticket.vehicle),
      driverRepo.findById(ticket.driverId),
      clientRepo.findByName(ticket.client),
      workOrderRepo.findByTicketId(ticketId),
      approvalRepo.findByTicketId(ticketId),
      auditRepo.findByTicketId(ticketId),
    ]);

    // Query maintenance & trip citations or logs if available
    let maintenanceHistory: unknown[] = [];
    let relevantTrip: unknown = null;

    try {
      const db = await getMongoDb();
      const entity = await db.collection('resolved_entities').findOne({ canonicalId: ticket.vehicle });
      if (entity && Array.isArray(entity.citations)) {
        maintenanceHistory = entity.citations.filter((c: { sourceType: string }) => c.sourceType === 'maintenance_log');
      }
    } catch {
      // Graceful fallback
    }

    // Build relevant trip summary from ticket origin/destination/driver/vehicle
    if (ticket.vehicle) {
      relevantTrip = {
        tripId: `TRIP-${ticket.vehicle}-${ticket.canonicalTicketId || ticket.ticketId}`,
        vehicle: ticket.vehicle,
        driverId: ticket.driverId,
        originHub: ticket.originHub,
        destination: ticket.destination,
        kmFromOriginHub: ticket.kmFromOriginHub,
        client: ticket.client,
        status: ticket.status === 'COMPLETED' ? 'DISPATCH_IN_PROGRESS' : 'ACTIVE_BREAKDOWN',
      };
    }

    return NextResponse.json({
      ticket,
      vehicle,
      driver,
      client,
      relevantTrip,
      maintenanceHistory,
      decision,
      workOrder,
      approval,
      auditTimeline: (auditTimeline || []).sort(
        (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
      ),
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

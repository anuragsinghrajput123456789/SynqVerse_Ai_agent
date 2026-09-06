/**
 * Work Order & Idempotency Service
 * Provides atomic, MongoDB-backed idempotent creation and retrieval.
 */

import { maskPii } from '../pii';
import { WorkOrderRepository } from './repository';
import {
  WorkOrder,
  CreateWorkOrderInput,
  CreateWorkOrderResult,
  WorkOrderStatus,
} from './types';

export * from './types';
export * from './repository';

const repository = new WorkOrderRepository();

/**
 * Creates a work order deterministically with idempotent deduplication.
 * Uses MongoDB unique index on `idempotencyKey` and `ticketId`.
 */
export async function createWorkOrderIdempotent(
  input: CreateWorkOrderInput
): Promise<CreateWorkOrderResult> {
  const { data: sanitizedInput } = maskPii(input);
  const idempotencyKey = sanitizedInput.customIdempotencyKey || `WORK_ORDER:${sanitizedInput.ticketId}`;
  const now = new Date().toISOString();

  const newWorkOrder: WorkOrder = {
    workOrderId: `WO-${sanitizedInput.ticketId}`,
    idempotencyKey,
    ticketId: sanitizedInput.ticketId,
    createdAt: now,
    updatedAt: now,
    status: 'DISPATCHED' as WorkOrderStatus,
    action: sanitizedInput.action,
    severity: sanitizedInput.severity,
    client: sanitizedInput.client,
    vehicleAssigned: sanitizedInput.vehicleAssigned,
    replacementVehicle: sanitizedInput.replacementVehicle,
    driverAssigned: sanitizedInput.driverAssigned,
    slaDeadlineHours: sanitizedInput.slaDeadlineHours,
    instructions: sanitizedInput.instructions || [],
    rulesApplied: sanitizedInput.rulesApplied || [],
    metadata: sanitizedInput.metadata || {},
  };

  const result = await repository.createIdempotent(newWorkOrder);

  return {
    status: result.created ? 'created' : 'existing',
    workOrderId: result.workOrder.workOrderId,
    idempotencyKey: result.workOrder.idempotencyKey,
    workOrder: result.workOrder,
  };
}

/**
 * Retrieves a work order by ticket ID
 */
export async function getWorkOrderByTicket(
  ticketId: string
): Promise<WorkOrder | null> {
  return repository.findByTicketId(ticketId);
}

/**
 * Retrieves a work order by idempotency key
 */
export async function getWorkOrderByIdempotencyKey(
  idempotencyKey: string
): Promise<WorkOrder | null> {
  return repository.findByIdempotencyKey(idempotencyKey);
}

export class WorkOrderService {
  private static instance: WorkOrderService;
  private repo = new WorkOrderRepository();

  public static getInstance(): WorkOrderService {
    if (!WorkOrderService.instance) {
      WorkOrderService.instance = new WorkOrderService();
    }
    return WorkOrderService.instance;
  }

  public async createWorkOrder(input: CreateWorkOrderInput): Promise<CreateWorkOrderResult> {
    return createWorkOrderIdempotent(input);
  }

  public async getByTicket(ticketId: string): Promise<WorkOrder | null> {
    return getWorkOrderByTicket(ticketId);
  }

  public async getByIdempotencyKey(key: string): Promise<WorkOrder | null> {
    return getWorkOrderByIdempotencyKey(key);
  }

  public async getAllWorkOrders(): Promise<WorkOrder[]> {
    return this.repo.findAll();
  }

  public async getCount(): Promise<number> {
    return this.repo.count();
  }

  public async clearAll(): Promise<void> {
    await this.repo.clear();
  }
}

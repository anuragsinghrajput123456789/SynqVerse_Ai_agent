/**
 * Work Order & Idempotency Module Types
 */

export type WorkOrderStatus =
  | 'DRAFT'
  | 'DISPATCHED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED';

export interface WorkOrder {
  workOrderId: string;
  idempotencyKey: string; // e.g. WORK_ORDER:TKT-101
  ticketId: string;
  createdAt: string;
  updatedAt: string;
  status: WorkOrderStatus;
  action: string;
  severity: string;
  client: string;
  vehicleAssigned: string;
  replacementVehicle?: string;
  driverAssigned?: string;
  slaDeadlineHours?: number;
  instructions?: string[];
  rulesApplied?: string[];
  metadata?: Record<string, unknown>;
}

export interface CreateWorkOrderInput {
  ticketId: string;
  action: string;
  severity: string;
  client: string;
  vehicleAssigned: string;
  replacementVehicle?: string;
  driverAssigned?: string;
  slaDeadlineHours?: number;
  instructions?: string[];
  rulesApplied?: string[];
  customIdempotencyKey?: string;
  metadata?: Record<string, unknown>;
}

export interface CreateWorkOrderResult {
  status: 'created' | 'existing';
  workOrderId: string;
  idempotencyKey: string;
  workOrder: WorkOrder;
}

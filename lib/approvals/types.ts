/**
 * Human Approval Workflow Types & State Transitions
 */

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface ApprovalMessagePayload {
  subject: string;
  message: string;
  factsUsed: string[];
  citations: Array<{
    sourceId: string;
    sourceFile: string;
    field: string;
    resolvedValue: unknown;
  }>;
}

export interface ApprovalRecord {
  approvalId: string;
  ticketId: string;
  workOrderId: string;
  message: ApprovalMessagePayload;
  status: ApprovalStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  actor: string | null;
  rejectionReason: string | null;
  approvalNotes: string | null;
}

export interface CreateApprovalInput {
  ticketId: string;
  workOrderId: string;
  message: ApprovalMessagePayload;
  customApprovalId?: string;
}

export interface ApprovalOperationResult {
  success: boolean;
  status: ApprovalStatus;
  approval: ApprovalRecord;
  error?: string;
}

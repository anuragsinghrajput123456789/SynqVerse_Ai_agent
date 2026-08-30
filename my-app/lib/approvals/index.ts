/**
 * Human Approval Workflow Service
 * Manages explicit human review for AI client-messages with MongoDB state of truth.
 */

import { ApprovalRepository } from './repository';
import {
  ApprovalRecord,
  CreateApprovalInput,
  ApprovalOperationResult,
  ApprovalStatus,
} from './types';

export * from './types';
export * from './repository';

const repository = new ApprovalRepository();

/**
 * Creates a new Human Approval record for an AI-drafted message.
 * An AI-generated message ALWAYS begins in PENDING status.
 */
export async function createApproval(
  input: CreateApprovalInput
): Promise<ApprovalRecord> {
  const approvalId = input.customApprovalId || `APR-${input.ticketId}`;
  const now = new Date().toISOString();

  // Check if approval record already exists
  const existing = await repository.findById(approvalId);
  if (existing) {
    return existing;
  }

  const newRecord: ApprovalRecord = {
    approvalId,
    ticketId: input.ticketId,
    workOrderId: input.workOrderId,
    message: input.message,
    status: 'PENDING' as ApprovalStatus,
    createdAt: now,
    updatedAt: now,
    approvedAt: null,
    rejectedAt: null,
    actor: null,
    rejectionReason: null,
    approvalNotes: null,
  };

  return repository.insert(newRecord);
}

/**
 * Explicitly approves an AI client message.
 * Enforces valid state transitions:
 * - PENDING -> APPROVED (Valid)
 * - APPROVED -> APPROVED (Idempotent / Safe duplicate)
 * - REJECTED -> APPROVED (Blocked: Unauthorized state transition)
 */
export async function approveMessage(
  approvalId: string,
  actor: string,
  notes?: string
): Promise<ApprovalOperationResult> {
  const record = await repository.findById(approvalId);
  if (!record) {
    throw new Error(`Approval record with ID '${approvalId}' not found`);
  }

  // Idempotent repeated approve
  if (record.status === 'APPROVED') {
    return {
      success: true,
      status: 'APPROVED',
      approval: record,
    };
  }

  // Block unauthorized transition from REJECTED
  if (record.status === 'REJECTED') {
    return {
      success: false,
      status: 'REJECTED',
      approval: record,
      error: 'Unauthorized state transition: Cannot approve a previously REJECTED message',
    };
  }

  const now = new Date().toISOString();
  record.status = 'APPROVED';
  record.approvedAt = now;
  record.actor = actor;
  record.approvalNotes = notes || null;
  record.updatedAt = now;

  await repository.update(record);

  return {
    success: true,
    status: 'APPROVED',
    approval: record,
  };
}

/**
 * Explicitly rejects an AI client message with a required reason.
 * Enforces valid state transitions:
 * - PENDING -> REJECTED (Valid)
 * - REJECTED -> REJECTED (Idempotent / Safe duplicate)
 * - APPROVED -> REJECTED (Blocked: Unauthorized state transition)
 */
export async function rejectMessage(
  approvalId: string,
  actor: string,
  reason: string
): Promise<ApprovalOperationResult> {
  if (!reason || !reason.trim()) {
    throw new Error('Rejection reason is mandatory when rejecting a message');
  }

  const record = await repository.findById(approvalId);
  if (!record) {
    throw new Error(`Approval record with ID '${approvalId}' not found`);
  }

  // Idempotent repeated reject
  if (record.status === 'REJECTED') {
    return {
      success: true,
      status: 'REJECTED',
      approval: record,
    };
  }

  // Block unauthorized transition from APPROVED
  if (record.status === 'APPROVED') {
    return {
      success: false,
      status: 'APPROVED',
      approval: record,
      error: 'Unauthorized state transition: Cannot reject an already APPROVED message',
    };
  }

  const now = new Date().toISOString();
  record.status = 'REJECTED';
  record.rejectedAt = now;
  record.actor = actor;
  record.rejectionReason = reason.trim();
  record.updatedAt = now;

  await repository.update(record);

  return {
    success: true,
    status: 'REJECTED',
    approval: record,
  };
}

/**
 * Retrieves all pending approvals awaiting human dispatcher action.
 */
export async function getPendingApprovals(): Promise<ApprovalRecord[]> {
  return repository.findPending();
}

/**
 * Retrieves approval by ID
 */
export async function getApprovalById(
  approvalId: string
): Promise<ApprovalRecord | null> {
  return repository.findById(approvalId);
}

/**
 * Retrieves approval by ticket ID
 */
export async function getApprovalByTicket(
  ticketId: string
): Promise<ApprovalRecord | null> {
  return repository.findByTicketId(ticketId);
}

export class HumanApprovalService {
  private static instance: HumanApprovalService;
  private repo = new ApprovalRepository();

  public static getInstance(): HumanApprovalService {
    if (!HumanApprovalService.instance) {
      HumanApprovalService.instance = new HumanApprovalService();
    }
    return HumanApprovalService.instance;
  }

  public async create(input: CreateApprovalInput): Promise<ApprovalRecord> {
    return createApproval(input);
  }

  public async approve(approvalId: string, actor: string, notes?: string): Promise<ApprovalOperationResult> {
    return approveMessage(approvalId, actor, notes);
  }

  public async reject(approvalId: string, actor: string, reason: string): Promise<ApprovalOperationResult> {
    return rejectMessage(approvalId, actor, reason);
  }

  public async getPending(): Promise<ApprovalRecord[]> {
    return getPendingApprovals();
  }

  public async getById(id: string): Promise<ApprovalRecord | null> {
    return getApprovalById(id);
  }

  public async getByTicket(ticketId: string): Promise<ApprovalRecord | null> {
    return getApprovalByTicket(ticketId);
  }

  public async getAll(): Promise<ApprovalRecord[]> {
    return this.repo.findAll();
  }

  public async clearAll(): Promise<void> {
    await this.repo.clear();
  }
}

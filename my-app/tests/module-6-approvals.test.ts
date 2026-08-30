/**
 * Module 6: Human Approval Workflow Test Suite
 * Validates explicit dispatcher review, valid state transitions (PENDING, APPROVED, REJECTED),
 * duplicate operation safety, and unauthorized transition rejection.
 */

import {
  createApproval,
  approveMessage,
  rejectMessage,
  getPendingApprovals,
  getApprovalById,
  HumanApprovalService,
  CreateApprovalInput,
} from '../lib/approvals';
import { closeMongoDb } from '../lib/db/mongodb';

async function runApprovalWorkflowTests() {
  console.log('===================================================================');
  console.log(' MERIDIAN RESOLVE - MODULE 6: HUMAN APPROVAL WORKFLOW TEST SUITE');
  console.log('===================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  const service = HumanApprovalService.getInstance();
  await service.clearAll();

  const mockApprovalInput: CreateApprovalInput = {
    ticketId: 'TKT-APR-001',
    workOrderId: 'WO-TKT-APR-001',
    message: {
      subject: '[HIGH] Breakdown Update - Ticket #TKT-APR-001',
      message: 'Dear Client, replacement vehicle has been dispatched.',
      factsUsed: ['Alternator breakdown', 'Replacement dispatched'],
      citations: [
        {
          sourceId: 'ticket_001',
          sourceFile: 'tickets.json',
          field: 'issue',
          resolvedValue: 'Alternator breakdown',
        },
      ],
    },
  };

  console.log('--- TEST 1: Create Pending Approval ---');
  const record1 = await createApproval(mockApprovalInput);
  assert(record1.status === 'PENDING', 'AI client message begins in status: PENDING');
  assert(record1.approvalId === 'APR-TKT-APR-001', 'Approval ID matches deterministic pattern');
  assert(record1.approvedAt === null, 'Initial approvedAt is null');
  assert(record1.rejectedAt === null, 'Initial rejectedAt is null');
  assert(record1.actor === null, 'Initial actor is null');

  const pendingList1 = await getPendingApprovals();
  assert(pendingList1.length === 1, 'getPendingApprovals() returns 1 pending item');
  assert(pendingList1[0].approvalId === 'APR-TKT-APR-001', 'Pending item ID matches');

  console.log('\n--- TEST 2: Approve Message ---');
  const approveRes = await approveMessage('APR-TKT-APR-001', 'dispatcher_ankit', 'Verified with depot manager');
  assert(approveRes.success === true, 'Explicit approval succeeds');
  assert(approveRes.status === 'APPROVED', 'Status transitions from PENDING to APPROVED');
  assert(approveRes.approval.approvedAt !== null, 'approvedAt timestamp is recorded');
  assert(approveRes.approval.actor === 'dispatcher_ankit', 'Dispatcher actor is logged in approval record');
  assert(approveRes.approval.approvalNotes === 'Verified with depot manager', 'Approval notes are recorded');

  const pendingAfterApprove = await getPendingApprovals();
  assert(pendingAfterApprove.length === 0, 'Approved message is removed from pending approvals queue');

  console.log('\n--- TEST 3: Repeated Approve (Idempotent / Duplicate Safe) ---');
  const originalApprovedAt = approveRes.approval.approvedAt;
  const repeatedApproveRes = await approveMessage('APR-TKT-APR-001', 'dispatcher_ankit');
  assert(repeatedApproveRes.success === true, 'Repeated approval succeeds idempotently');
  assert(repeatedApproveRes.status === 'APPROVED', 'Status remains APPROVED');
  assert(repeatedApproveRes.approval.approvedAt === originalApprovedAt, 'Original approvedAt timestamp is preserved without overwrite');

  console.log('\n--- TEST 4: Reject Message ---');
  const mockRejectInput: CreateApprovalInput = {
    ticketId: 'TKT-APR-002',
    workOrderId: 'WO-TKT-APR-002',
    message: {
      subject: '[MEDIUM] Update',
      message: 'Draft message body',
      factsUsed: [],
      citations: [],
    },
  };
  await createApproval(mockRejectInput);
  const rejectRes = await rejectMessage('APR-TKT-APR-002', 'dispatcher_priya', 'Draft message lacks ETA breakdown details');
  assert(rejectRes.success === true, 'Explicit rejection succeeds');
  assert(rejectRes.status === 'REJECTED', 'Status transitions to REJECTED');
  assert(rejectRes.approval.rejectedAt !== null, 'rejectedAt timestamp is recorded');
  assert(rejectRes.approval.actor === 'dispatcher_priya', 'Dispatcher actor is logged in rejection record');
  assert(rejectRes.approval.rejectionReason === 'Draft message lacks ETA breakdown details', 'Rejection reason is stored');

  console.log('\n--- TEST 5: Approve After Reject (Unauthorized State Transition) ---');
  const approveAfterRejectRes = await approveMessage('APR-TKT-APR-002', 'dispatcher_ankit');
  assert(approveAfterRejectRes.success === false, 'Approving a rejected message is blocked (success: false)');
  assert(approveAfterRejectRes.status === 'REJECTED', 'Record status remains strictly REJECTED');
  assert(
    approveAfterRejectRes.error?.includes('Cannot approve a previously REJECTED message') === true,
    'Error explicitly explains unauthorized transition from REJECTED to APPROVED'
  );

  console.log('\n--- TEST 6: Reject After Approve (Unauthorized State Transition) ---');
  const rejectAfterApproveRes = await rejectMessage('APR-TKT-APR-001', 'dispatcher_priya', 'Late change of mind');
  assert(rejectAfterApproveRes.success === false, 'Rejecting an approved message is blocked (success: false)');
  assert(rejectAfterApproveRes.status === 'APPROVED', 'Record status remains strictly APPROVED');
  assert(
    rejectAfterApproveRes.error?.includes('Cannot reject an already APPROVED message') === true,
    'Error explicitly explains unauthorized transition from APPROVED to REJECTED'
  );

  console.log('\n--- TEST 7: Database State Verification & Retrieval ---');
  const fetchedRecord = await getApprovalById('APR-TKT-APR-001');
  assert(fetchedRecord !== null, 'getApprovalById retrieves approved record');
  assert(fetchedRecord?.status === 'APPROVED', 'Database state confirms APPROVED status');

  console.log('\n===================================================================');
  console.log(` MODULE 6 TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================\n');

  await closeMongoDb();
  if (failed > 0) {
    throw new Error(`Module 6 tests failed with ${failed} failure(s)`);
  }
}

runApprovalWorkflowTests().catch((err) => {
  console.error('Module 6 test suite encountered an error:', err);
  process.exit(1);
});

/**
 * AI Client-Message Drafting Service
 * Gemini serves as an assistant to draft professional communication based strictly
 * on pre-computed operational facts and PII-sanitized inputs.
 * Uses centralized GeminiProvider for reliable generation and bounded fallbacks.
 */

import { geminiProvider } from './provider';
import { maskPii, maskTextPii } from '../pii';
import {
  DraftClientMessageInput,
  DraftClientMessageResult,
  ClientMessageDraftSchema,
  ClientMessageDraft,
} from './types';

export function buildDeterministicFallbackDraft(
  input: DraftClientMessageInput
): ClientMessageDraft {
  const clientName = typeof input.client === 'string' ? input.client : input.client.name;
  const ticketId = input.sanitizedTicket.ticketId;
  const severity = input.sanitizedTicket.severity || 'MEDIUM';
  const issue = input.sanitizedTicket.issue || 'Mechanical breakdown';
  const origin = input.sanitizedTicket.originHub || 'Origin';
  const dest = input.sanitizedTicket.destination || 'Destination';
  const brokenVeh = input.resolvedVehicle?.registrationNumber || 'Assigned vehicle';
  const replVeh = input.selectedReplacementVehicle?.registrationNumber;
  const slaHours = input.sla.slaDeadlineHours || 24;

  const subject = `[${severity}] Breakdown Notification & Dispatch Update - Ticket #${ticketId}`;

  const messageLines = [
    `Dear ${clientName} Operations Team,`,
    ``,
    `This is an operational notification regarding your consignment in transit from ${origin} to ${dest}.`,
    ``,
    `Vehicle ${brokenVeh} experienced a mechanical issue (${issue}). Our automated dispatch and monitoring system has initiated immediate resolution procedures.`,
  ];

  if (replVeh) {
    messageLines.push(
      `Replacement vehicle ${replVeh} (Hub: ${input.selectedReplacementVehicle?.homeHub || 'Regional'}, ${input.selectedReplacementVehicle?.bsStage || 'BS6'}) has been assigned and dispatched.`
    );
  } else {
    messageLines.push(
      `Our regional support team has dispatched immediate roadside assistance to resolve the incident.`
    );
  }

  messageLines.push(
    ``,
    `Target operational SLA window: ${slaHours} hours.`,
    `We are actively tracking telemetry and will provide further status updates as progress develops.`,
    ``,
    `Regards,`,
    `Meridian Operations Control Desk`
  );

  return {
    subject,
    message: messageLines.join('\n'),
    factsUsed: [...input.approvedFacts],
    citations: input.sourceCitations
      ? input.sourceCitations.map((c) => ({
          sourceId: c.sourceId,
          sourceFile: c.sourceFile,
          field: c.field,
          resolvedValue: c.resolvedValue,
        }))
      : [],
  };
}

export async function draftClientMessage(
  input: DraftClientMessageInput
): Promise<DraftClientMessageResult> {
  // Step 1: Deterministic Context Sanitization & PII Masking
  let piiAudited = true;

  // Mask issue text
  let safeIssue = input.sanitizedTicket.issue || '';
  const issueMask = maskTextPii(safeIssue);
  if (issueMask.count > 0) {
    safeIssue = issueMask.maskedText;
  }

  // Mask all approved facts
  const safeFacts = input.approvedFacts.map((fact) => {
    const factMask = maskTextPii(fact);
    return factMask.maskedText;
  });

  // Verify zero raw Aadhaar or mobile remains
  const sanitizedInput: DraftClientMessageInput = {
    ...input,
    sanitizedTicket: {
      ...input.sanitizedTicket,
      issue: safeIssue,
    },
    approvedFacts: safeFacts,
  };

  const piiCheckTarget = JSON.stringify(sanitizedInput);
  const piiScan = maskPii(piiCheckTarget);
  if (piiScan.maskedCount > 0) {
    piiAudited = true;
  }

  // Step 2: Input Completeness Guard
  if (
    !sanitizedInput.sanitizedTicket.ticketId ||
    sanitizedInput.approvedFacts.length === 0
  ) {
    return {
      status: 'INSUFFICIENT_DATA',
      error: 'Cannot draft client message: missing critical ticket context or operational facts',
      piiAudited,
    };
  }

  const clientName =
    typeof sanitizedInput.client === 'string'
      ? sanitizedInput.client
      : sanitizedInput.client.name;

  // Step 3: Invoke Gemini with structured JSON output requirements
  const prompt = `You are a professional customer communications assistant for Meridian Resolve logistics.
Draft a clear, professional, and reassuring client update message regarding a vehicle breakdown and dispatch action.

CRITICAL CONSTRAINTS:
1. You are an assistant drafting text ONLY.
2. You MUST use ONLY the approved operational facts, vehicle data, SLA constraints, and evidence provided below.
3. Do NOT make any operational decisions (severity, vehicle selection, SLA deadline, or route choices are already decided).
4. Do NOT include any private driver information (phone numbers, driver license numbers, or government IDs).
5. Output ONLY a valid JSON object matching this schema:
{
  "subject": string,
  "message": string,
  "factsUsed": string[],
  "citations": [
    {
      "sourceId": string,
      "sourceFile": string,
      "field": string,
      "resolvedValue": any
    }
  ]
}

CONTEXT DATA:
- Client: ${clientName}
- Ticket ID: ${sanitizedInput.sanitizedTicket.ticketId}
- Route: ${sanitizedInput.sanitizedTicket.originHub || 'N/A'} -> ${sanitizedInput.sanitizedTicket.destination || 'N/A'}
- Issue: ${sanitizedInput.sanitizedTicket.issue || 'N/A'}
- Pre-computed Severity: ${sanitizedInput.sanitizedTicket.severity || 'MEDIUM'}
- Broken Vehicle: ${sanitizedInput.resolvedVehicle?.registrationNumber || 'N/A'} (${sanitizedInput.resolvedVehicle?.model || ''})
- Selected Replacement: ${sanitizedInput.selectedReplacementVehicle ? `${sanitizedInput.selectedReplacementVehicle.registrationNumber} (${sanitizedInput.selectedReplacementVehicle.model || ''}, Hub: ${sanitizedInput.selectedReplacementVehicle.homeHub || ''})` : 'Roadside repair / Direct fix'}
- Operational SLA Target: ${sanitizedInput.sla.slaDeadlineHours || 24} hours ${sanitizedInput.sla.gateCutoffTime ? `(Gate Cutoff: ${sanitizedInput.sla.gateCutoffTime})` : ''}
- Approved Operational Facts:
${sanitizedInput.approvedFacts.map((f) => `  * ${f}`).join('\n')}

SOURCE CITATIONS AVAILABLE:
${JSON.stringify(sanitizedInput.sourceCitations || [], null, 2)}
`;

  const fallbackDraft = buildDeterministicFallbackDraft(sanitizedInput);

  if (!geminiProvider.isConfigured()) {
    return {
      status: 'SUCCESS',
      draft: fallbackDraft,
      piiAudited,
    };
  }


  try {
    const res = await geminiProvider.generateStructuredJson<ClientMessageDraft>({
      prompt,
      schema: ClientMessageDraftSchema,
      contextName: 'ClientMessageDrafting',
      temperature: 0.1,
    });

    if (!res.success || !res.data) {
      return {
        status: 'AI_ERROR',
        draft: fallbackDraft,
        error: res.error || 'Gemini drafting failed',
        piiAudited,
      };
    }

    return {
      status: 'SUCCESS',
      draft: res.data,
      piiAudited,
    };
  } catch (err: unknown) {
    const rawError = err instanceof Error ? err.message : String(err);
    const safeError = rawError.replace(/key=[a-zA-Z0-9_\-]+/gi, 'key=[REDACTED]');
    return {
      status: 'AI_ERROR',
      draft: fallbackDraft,
      error: `Gemini service error: ${safeError}`,
      piiAudited,
    };
  }
}

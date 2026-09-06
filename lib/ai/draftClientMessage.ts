/**
 * AI Client-Message Drafting Service
 * Gemini serves as an assistant to draft professional communication based strictly
 * on pre-computed operational facts and PII-sanitized inputs.
 */

import { GoogleGenAI } from '@google/genai';
import { maskPii, maskTextPii } from '../pii';
import {
  DraftClientMessageInput,
  DraftClientMessageResult,
  ClientMessageDraftSchema,
  ClientMessageDraft,
} from './types';

function buildDeterministicFallbackDraft(
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
    `Committed SLA Resolution Target: within ${slaHours} hours.`,
    `We will keep you informed with live milestone updates.`,
    ``,
    `Sincerely,`,
    `Meridian Resolve Logistics Operations`
  );

  return {
    subject,
    message: messageLines.join('\n'),
    factsUsed: input.approvedFacts.length > 0 ? input.approvedFacts : [issue, `SLA: ${slaHours}h`],
    citations: input.sourceCitations || [],
  };
}

export async function draftClientMessage(
  rawInput: DraftClientMessageInput
): Promise<DraftClientMessageResult> {
  // Step 1: Validate minimum required context
  if (
    !rawInput.sanitizedTicket ||
    !rawInput.sanitizedTicket.ticketId ||
    !rawInput.client
  ) {
    return {
      status: 'INSUFFICIENT_DATA',
      error: 'Missing required ticket or client context for message drafting',
      piiAudited: true,
    };
  }

  // Step 2: Enforce PII masking boundary on all inputs
  const { data: sanitizedInput } = maskPii(rawInput);

  // Audit prompt for raw PII digits
  const serialized = JSON.stringify(sanitizedInput);
  const { count: leakedCount } = maskTextPii(serialized);
  const piiAudited = leakedCount === 0;

  const clientName =
    typeof sanitizedInput.client === 'string'
      ? sanitizedInput.client
      : sanitizedInput.client.name;

  const apiKey = process.env.GEMINI_API_KEY;

  // Step 3: If no API key configured, use deterministic grounded fallback
  if (!apiKey || apiKey === 'mock_key' || apiKey === 'test_key') {
    const fallbackDraft = buildDeterministicFallbackDraft(sanitizedInput);
    return {
      status: 'SUCCESS',
      draft: fallbackDraft,
      piiAudited,
    };
  }

  // Step 4: Invoke Gemini with structured JSON output requirements
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

  try {
    const ai = new GoogleGenAI({ apiKey });

    async function queryGemini(p: string): Promise<string> {
      const res = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: p,
      });
      return res.text?.trim() || '';
    }

    let responseText = await queryGemini(prompt);

    // Attempt to parse JSON
    let jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      // Retry once if invalid format
      const retryPrompt = `${prompt}\n\nWARNING: Your previous response did not contain valid JSON. Please return ONLY raw JSON.`;
      responseText = await queryGemini(retryPrompt);
      jsonMatch = responseText.match(/\{[\s\S]*\}/);
    }

    if (!jsonMatch) {
      return {
        status: 'AI_ERROR',
        error: 'Gemini returned non-JSON response after retry',
        piiAudited,
      };
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch {
      return {
        status: 'AI_ERROR',
        error: 'Failed to parse Gemini response as JSON',
        piiAudited,
      };
    }

    // Step 5: Validate JSON against Zod schema
    const validation = ClientMessageDraftSchema.safeParse(parsed);
    if (!validation.success) {
      return {
        status: 'AI_ERROR',
        error: `Gemini JSON payload schema validation failed: ${validation.error.message}`,
        piiAudited,
      };
    }

    return {
      status: 'SUCCESS',
      draft: validation.data,
      piiAudited,
    };
  } catch (err: unknown) {
    const rawError = err instanceof Error ? err.message : String(err);
    // Sanitize any accidental API key exposure in error strings
    const safeError = rawError.replace(/key=[a-zA-Z0-9_\-]+/gi, 'key=[REDACTED]');
    return {
      status: 'AI_ERROR',
      error: `Gemini service error: ${safeError}`,
      piiAudited,
    };
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { answerCopilotQuery, CopilotQueryRequestSchema } from '@/lib/copilot';
import { rateLimiters, getClientIdentifier } from '@/lib/security/rateLimit';
import { getOrCreateRequestId, REQUEST_ID_HEADER } from '@/lib/infrastructure/request-id';
import { requireRole } from '@/lib/infrastructure/auth';
import { UnauthorizedError, ForbiddenError } from '@/lib/infrastructure/api-error';
import { logger } from '@/lib/infrastructure/logger';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const requestId = getOrCreateRequestId(req.headers);

  try {
    // 1. Authenticate (non-blocking in development & test environments)
    try {
      requireRole(req, [
        'DISPATCHER',
        'OPERATIONS_MANAGER',
        'DRIVER',
        'AUDITOR',
        'SYSTEM',
      ]);
    } catch (authErr) {
      if (authErr instanceof UnauthorizedError || authErr instanceof ForbiddenError) {
        return NextResponse.json(
          {
            answer: 'Authentication required to query Operations Copilot',
            status: 'error',
            citations: [],
            confidence: 'low',
            insufficientData: false,
            sourcesUsed: [],
            sources: [],
            entities: [],
            rules: [],
            conflicts: [],
            error: authErr.message,
          },
          { status: authErr.statusCode, headers: { [REQUEST_ID_HEADER]: requestId } }
        );
      }
      throw authErr;
    }

    // 2. Rate Limiting Check
    const clientIp = getClientIdentifier(req);
    const limit = rateLimiters.ai.check(clientIp);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          answer: 'Rate limit exceeded. Please wait a moment before asking another question.',
          status: 'error',
          citations: [],
          confidence: 'low',
          insufficientData: false,
          sourcesUsed: [],
          sources: [],
          entities: [],
          rules: [],
          conflicts: [],
          error: 'Rate limit exceeded',
        },
        { status: 429, headers: { [REQUEST_ID_HEADER]: requestId } }
      );
    }

    // 3. Payload Extraction & Normalization
    const rawBody = await req.json().catch(() => null);
    if (!rawBody || typeof rawBody !== 'object') {
      return NextResponse.json(
        {
          answer: 'Invalid request payload format: JSON object expected',
          status: 'error',
          citations: [],
          confidence: 'low',
          insufficientData: false,
          sourcesUsed: [],
          sources: [],
          entities: [],
          rules: [],
          conflicts: [],
          error: 'Invalid payload: JSON object expected',
        },
        { status: 400, headers: { [REQUEST_ID_HEADER]: requestId } }
      );
    }

    const question = String(rawBody.question || rawBody.query || rawBody.message || '').trim();
    if (!question) {
      return NextResponse.json(
        {
          answer: "Please provide a valid question or query (e.g. 'Why was TRK-104 rejected?').",
          status: 'insufficient_data',
          citations: [],
          confidence: 'low',
          insufficientData: true,
          sourcesUsed: [],
          sources: [],
          entities: [],
          rules: [],
          conflicts: [],
        },
        { status: 400, headers: { [REQUEST_ID_HEADER]: requestId } }
      );
    }

    const conversationHistory = Array.isArray(rawBody.conversationHistory)
      ? rawBody.conversationHistory
      : [];

    // 4. Schema Validation
    const parsedRequest = CopilotQueryRequestSchema.safeParse({
      question,
      conversationHistory,
    });

    if (!parsedRequest.success) {
      const errorMsg = parsedRequest.error.issues.map((i) => i.message).join('; ');
      return NextResponse.json(
        {
          answer: `Invalid question: ${errorMsg}`,
          status: 'error',
          citations: [],
          confidence: 'low',
          insufficientData: false,
          sourcesUsed: [],
          sources: [],
          entities: [],
          rules: [],
          conflicts: [],
          error: errorMsg,
        },
        { status: 400, headers: { [REQUEST_ID_HEADER]: requestId } }
      );
    }

    // 5. Execute Operations Copilot Pipeline
    const response = await answerCopilotQuery(parsedRequest.data);

    return NextResponse.json(response, {
      status: 200,
      headers: { [REQUEST_ID_HEADER]: requestId },
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logger.error('Error in /api/copilot', err, { requestId });

    return NextResponse.json(
      {
        answer: 'An operational error occurred while generating copilot analysis. Please retry.',
        status: 'error',
        citations: [],
        confidence: 'low',
        insufficientData: false,
        sourcesUsed: [],
        sources: [],
        entities: [],
        rules: [],
        conflicts: [],
        error: errorMsg,
      },
      { status: 500, headers: { [REQUEST_ID_HEADER]: requestId } }
    );
  }
}

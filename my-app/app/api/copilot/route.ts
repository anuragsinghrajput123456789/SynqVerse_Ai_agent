/**
 * Operations Copilot API Endpoint
 * POST /api/copilot
 */

import { NextRequest, NextResponse } from 'next/server';
import { answerCopilotQuery } from '@/lib/copilot';
import { rateLimiters, getClientIdentifier } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const clientIp = getClientIdentifier(req);
    const limit = rateLimiters.ai.check(clientIp);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          answer: 'Rate limit exceeded. Please wait a moment before asking another question.',
          status: 'error',
          sources: [],
          entities: [],
          rules: [],
          conflicts: [],
          confidence: 'low',
          error: 'Rate limit exceeded',
        },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        {
          answer: 'Invalid request payload format',
          status: 'error',
          sources: [],
          entities: [],
          rules: [],
          conflicts: [],
          confidence: 'low',
          error: 'Invalid payload: JSON object expected',
        },
        { status: 400 }
      );
    }

    const question = String(body.question || body.query || body.message || '').trim();
    if (!question) {
      return NextResponse.json(
        {
          answer: "Please provide a valid question or query (e.g. 'Why was TRK-104 rejected?').",
          status: 'insufficient_data',
          sources: [],
          entities: [],
          rules: [],
          conflicts: [],
          confidence: 'low',
        },
        { status: 400 }
      );
    }

    const conversationHistory = Array.isArray(body.conversationHistory)
      ? body.conversationHistory
      : [];

    const response = await answerCopilotQuery({
      question,
      conversationHistory,
    });

    return NextResponse.json(response);
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error('Error in /api/copilot:', errorMsg);

    return NextResponse.json(
      {
        answer: 'An operational error occurred while generating copilot analysis. Please retry.',
        status: 'error',
        sources: [],
        entities: [],
        rules: [],
        conflicts: [],
        confidence: 'low',
        error: errorMsg,
      },
      { status: 500 }
    );
  }
}

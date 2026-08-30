/**
 * Operations Copilot API Endpoint
 * POST /api/copilot
 */

import { NextRequest, NextResponse } from 'next/server';
import { answerCopilotQuery } from '@/lib/copilot';

// Lightweight in-memory rate limiter: max 60 requests per minute per client IP
interface RateLimitEntry {
  count: number;
  resetAt: number;
}
const rateLimits = new Map<string, RateLimitEntry>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 60;

function checkRateLimit(clientIp: string): boolean {
  const now = Date.now();
  const entry = rateLimits.get(clientIp);

  if (!entry || now > entry.resetAt) {
    rateLimits.set(clientIp, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }

  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const clientIp = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'anonymous';
    if (!checkRateLimit(clientIp)) {
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
          error: 'Expected JSON object in request body',
        },
        { status: 400 }
      );
    }

    const result = await answerCopilotQuery(body);

    if (result.status === 'error' && result.error?.includes('Invalid question')) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    console.error('Unhandled exception in /api/copilot:', err instanceof Error ? err.message : 'Unknown error');
    return NextResponse.json(
      {
        answer: 'An unexpected internal error occurred while processing your query.',
        status: 'error',
        sources: [],
        entities: [],
        rules: [],
        conflicts: [],
        confidence: 'low',
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}

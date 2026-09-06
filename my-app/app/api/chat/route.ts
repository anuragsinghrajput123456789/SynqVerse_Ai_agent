import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { chatAnswer } from '@/lib/query';
import { runIngestion } from '@/lib/ingestion';
import { UnifiedContextStore } from '@/lib/context';
import { rateLimiters, getClientIdentifier } from '@/lib/security/rateLimit';

const ChatMessageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system']),
  content: z.string().max(2000),
});

const ChatRequestSchema = z.object({
  message: z.string().max(1000).optional(),
  userMessage: z.string().max(1000).optional(),
  question: z.string().max(1000).optional(),
  conversationHistory: z.array(ChatMessageSchema).optional().default([]),
});

// In-memory query response cache (5 minutes TTL) to minimize redundant AI calls
interface CachedChatResponse {
  result: unknown;
  expiresAt: number;
}
const queryCache = new Map<string, CachedChatResponse>();

async function ensureIngested() {
  const store = UnifiedContextStore.getInstance();
  if (!store.getStatus()) {
    await runIngestion();
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req);
    const limit = rateLimiters.ai.check(clientId);
    if (!limit.allowed) {
      return NextResponse.json(
        {
          answer: 'Rate limit exceeded. Please wait a moment before sending more queries.',
          status: 'error',
          source_refs: [],
          sources: [],
          error: 'Rate limit exceeded',
        },
        { status: 429 }
      );
    }

    await ensureIngested();
    const body = await req.json().catch(() => ({}));
    const validation = ChatRequestSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          answer: "I don't have enough information to answer this based on the ingested records.",
          status: 'insufficient_data',
          source_refs: [],
          sources: [],
          error: validation.error.issues[0]?.message || 'Invalid request payload',
        },
        { status: 400 }
      );
    }

    const { message, userMessage, question, conversationHistory } = validation.data;
    const query = (message || userMessage || question || '').trim();

    if (!query) {
      return NextResponse.json(
        {
          answer: "I don't have enough information to answer this based on the ingested records.",
          status: 'insufficient_data',
          source_refs: [],
          sources: [],
        },
        { status: 200 }
      );
    }

    // Query Cache Check (only for zero-history standalone questions)
    const cacheKey = query.toLowerCase();
    const now = Date.now();
    if (conversationHistory.length === 0) {
      const cached = queryCache.get(cacheKey);
      if (cached && now < cached.expiresAt) {
        return NextResponse.json(cached.result, { status: 200 });
      }
    }

    const result = await chatAnswer(query, conversationHistory);

    if (conversationHistory.length === 0) {
      queryCache.set(cacheKey, { result, expiresAt: now + 5 * 60 * 1000 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    console.error('API /api/chat error:', err);
    return NextResponse.json(
      {
        answer: "I don't have enough information to answer this based on the ingested records.",
        status: 'insufficient_data',
        source_refs: [],
        sources: [],
        error: err instanceof Error ? err.message : 'Internal Server Error',
      },
      { status: 500 }
    );
  }
}

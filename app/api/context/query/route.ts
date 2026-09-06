import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { answerContextQuery } from '@/lib/query';
import { runIngestion } from '@/lib/ingestion';
import { UnifiedContextStore } from '@/lib/context';

const QuerySchema = z.object({
  question: z.string().min(1, 'Question cannot be empty'),
});

async function ensureIngested() {
  const store = UnifiedContextStore.getInstance();
  if (!store.getStatus()) {
    await runIngestion();
  }
}

export async function GET(req: NextRequest) {
  try {
    await ensureIngested();
    const url = new URL(req.url);
    const questionParam = url.searchParams.get('q') || url.searchParams.get('question') || '';

    const validation = QuerySchema.safeParse({ question: questionParam });
    if (!validation.success) {
      return NextResponse.json(
        {
          answer: 'Insufficient data to determine this.',
          status: 'insufficient_data',
          sources: [],
          conflicts: [],
          error: validation.error.issues[0]?.message || 'Validation error',
        },
        { status: 200 }
      );
    }

    const result = await answerContextQuery(validation.data.question);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        answer: 'Insufficient data to determine this.',
        status: 'insufficient_data',
        sources: [],
        conflicts: [],
      },
      { status: 200 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureIngested();
    const body = await req.json().catch(() => ({}));
    const validation = QuerySchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          answer: 'Insufficient data to determine this.',
          status: 'insufficient_data',
          sources: [],
          conflicts: [],
          error: validation.error.issues[0]?.message || 'Validation error',
        },
        { status: 200 }
      );
    }

    const result = await answerContextQuery(validation.data.question);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json(
      {
        answer: 'Insufficient data to determine this.',
        status: 'insufficient_data',
        sources: [],
        conflicts: [],
      },
      { status: 200 }
    );
  }
}

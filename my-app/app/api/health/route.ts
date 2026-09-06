import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongodb';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();

  // 1. Check AI Key availability
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  const aiStatus = {
    status: hasGeminiKey ? 'connected' : 'fallback',
    label: hasGeminiKey ? 'Connected' : 'Fallback Active',
    provider: 'Gemini 2.5 Flash',
  };

  // 2. Check Database connectivity
  let dbStatus = {
    status: 'connected',
    label: 'Connected',
    type: 'MongoDB',
  };
  try {
    const db = await getMongoDb();
    if (db) {
      dbStatus = {
        status: 'connected',
        label: 'Connected',
        type: 'MongoDB',
      };
    } else {
      dbStatus = {
        status: 'fallback',
        label: 'In-Memory Active',
        type: 'In-Memory',
      };
    }
  } catch {
    dbStatus = {
      status: 'error',
      label: 'Database Unreachable (Fallback)',
      type: 'In-Memory',
    };
  }

  // 3. Pipeline readiness (13 deterministic dispatch rules)
  const pipelineStatus = {
    status: 'ready',
    label: 'Ready',
    rulesCount: 13,
  };

  const latencyMs = Date.now() - startTime;

  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    latencyMs,
    services: {
      api: {
        status: 'operational',
        label: 'Operational',
        latencyMs,
      },
      ai: aiStatus,
      database: dbStatus,
      pipeline: pipelineStatus,
    },
  });
}

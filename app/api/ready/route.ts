import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongodb';
import { EmergencyService } from '@/lib/emergency';
import { LocationService } from '@/lib/location';

export const dynamic = 'force-dynamic';

export async function GET() {
  const startTime = Date.now();
  const checks: Record<string, { status: 'healthy' | 'degraded' | 'unavailable'; message?: string; latencyMs?: number }> = {};

  let isReady = true;

  // 1. Check MongoDB Ping
  const dbStart = Date.now();
  try {
    const db = await getMongoDb();
    if (db) {
      await db.command({ ping: 1 });
      checks.database = {
        status: 'healthy',
        latencyMs: Date.now() - dbStart,
        message: 'MongoDB responsive',
      };
    } else {
      checks.database = {
        status: 'degraded',
        latencyMs: Date.now() - dbStart,
        message: 'Using in-memory fallback store',
      };
    }
  } catch (err) {
    checks.database = {
      status: 'degraded',
      latencyMs: Date.now() - dbStart,
      message: err instanceof Error ? err.message : 'Database ping failed',
    };
    // If strict production, set isReady = false; otherwise degraded fallback operates safely
    if (process.env.NODE_ENV === 'production') {
      isReady = false;
    }
  }

  // 2. Check Emergency Event Bus
  try {
    const emergencyCount = (await EmergencyService.getInstance().getAllEmergencies()).length;
    checks.emergency = {
      status: 'healthy',
      message: `Emergency service active with ${emergencyCount} tracked records`,
    };
  } catch {
    checks.emergency = { status: 'unavailable', message: 'Emergency service failed initialization' };
    isReady = false;
  }

  // 3. Check Location Telemetry Bus
  try {
    const fleetStats = await LocationService.getInstance().getFleetStats();
    checks.telemetry = {
      status: 'healthy',
      message: `Location service tracking ${fleetStats.totalDrivers} drivers`,
    };
  } catch {
    checks.telemetry = { status: 'unavailable', message: 'Location service failed initialization' };
    isReady = false;
  }

  // 4. Check AI Configuration
  const hasGeminiKey = Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY);
  checks.ai = {
    status: hasGeminiKey ? 'healthy' : 'degraded',
    message: hasGeminiKey ? 'Gemini 2.5 Flash API configured' : 'Fallback deterministic mode active',
  };

  const totalDurationMs = Date.now() - startTime;

  return NextResponse.json(
    {
      ready: isReady,
      status: isReady ? 'ready' : 'unhealthy',
      timestamp: new Date().toISOString(),
      durationMs: totalDurationMs,
      checks,
    },
    { status: isReady ? 200 : 503 }
  );
}

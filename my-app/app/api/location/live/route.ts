import { NextResponse } from 'next/server';
import { LocationService } from '@/lib/location';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const service = LocationService.getInstance();
    const [fleet, stats] = await Promise.all([
      service.getLiveFleet(),
      service.getFleetStats(),
    ]);

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      stats,
      fleet,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

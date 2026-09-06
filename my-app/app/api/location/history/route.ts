import { NextRequest, NextResponse } from 'next/server';
import { LocationService } from '@/lib/location';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const driverId = searchParams.get('driverId');
    const range = searchParams.get('range') || 'today';

    if (!driverId) {
      return NextResponse.json(
        { success: false, error: 'driverId query parameter is required.' },
        { status: 400 }
      );
    }

    const service = LocationService.getInstance();
    const history = await service.getDriverHistory(driverId, range);

    return NextResponse.json({
      success: true,
      driverId,
      range,
      count: history.length,
      history,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

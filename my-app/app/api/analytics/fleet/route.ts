import { NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/analytics';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const service = AnalyticsService.getInstance();
    const data = await service.getFleetHealth();

    return NextResponse.json({ success: true, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

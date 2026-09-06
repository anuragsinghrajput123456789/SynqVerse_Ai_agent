import { NextRequest, NextResponse } from 'next/server';
import { AnalyticsService } from '@/lib/analytics';
import { AnalyticsQuerySchema } from '@/lib/security/validation';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rangeParam = searchParams.get('range') || '7d';
    const validation = AnalyticsQuerySchema.safeParse({ range: rangeParam });
    const range = validation.success ? validation.data.range : '7d';

    const service = AnalyticsService.getInstance();
    const data = await service.getIncidentPerformance(range);

    return NextResponse.json({ success: true, range, data });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

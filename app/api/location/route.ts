import { NextRequest, NextResponse } from 'next/server';
import { LocationService } from '@/lib/location';
import { LocationIngestSchema } from '@/lib/security/validation';
import { rateLimiters, getClientIdentifier } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req);
    const limit = rateLimiters.telemetry.check(clientId);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Telemetry ingestion rate limit reached. Throttled.' },
        { status: 429 }
      );
    }

    const rawBody = await req.json().catch(() => ({}));
    const validation = LocationIngestSchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation failed: ${validation.error.issues.map((i) => i.message).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const body = validation.data;
    const service = LocationService.getInstance();
    const updated = await service.ingestLocation({
      driverId: body.driverId,
      vehicleRegistration: body.vehicleRegistration,
      latitude: body.latitude,
      longitude: body.longitude,
      speedKmH: body.speedKmH,
      heading: body.heading,
      accuracyMeters: body.accuracyMeters,
      timestamp: body.timestamp,
    });

    return NextResponse.json({
      success: true,
      message: 'Location position ingested.',
      location: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

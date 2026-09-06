import { NextRequest, NextResponse } from 'next/server';
import { EmergencyService } from '@/lib/emergency';
import { CreateSOSRequestSchema } from '@/lib/security/validation';
import { rateLimiters, getClientIdentifier } from '@/lib/security/rateLimit';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const service = EmergencyService.getInstance();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    let emergencies = await service.getAllEmergencies();
    if (status) {
      if (status === 'ACTIVE') {
        emergencies = emergencies.filter(
          (e) => e.status === 'ACTIVE' || e.status === 'ACKNOWLEDGED' || e.status === 'RESPONDING'
        );
      } else {
        emergencies = emergencies.filter((e) => e.status === status);
      }
    }

    return NextResponse.json({
      success: true,
      total: emergencies.length,
      emergencies,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const clientId = getClientIdentifier(req);
    const limit = rateLimiters.sos.check(clientId);
    if (!limit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Too many SOS requests. Please wait a moment.' },
        { status: 429 }
      );
    }

    const rawBody = await req.json().catch(() => ({}));
    const validation = CreateSOSRequestSchema.safeParse(rawBody);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: `Validation error: ${validation.error.issues.map((i) => i.message).join(', ')}`,
        },
        { status: 400 }
      );
    }

    const body = validation.data;
    const service = EmergencyService.getInstance();
    const emergency = await service.triggerSOS(body);

    return NextResponse.json(
      {
        success: true,
        message: 'Emergency SOS received and broadcast to operations console.',
        emergency,
      },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

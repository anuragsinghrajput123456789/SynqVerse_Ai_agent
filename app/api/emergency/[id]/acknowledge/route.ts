import { NextRequest, NextResponse } from 'next/server';
import { EmergencyService } from '@/lib/emergency';

export const dynamic = 'force-dynamic';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    let actor = 'operations_lead';
    try {
      const body = await req.json();
      if (body.actor) actor = body.actor;
    } catch {
      // Default actor
    }

    const service = EmergencyService.getInstance();
    const updated = await service.acknowledgeEmergency(id, actor);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Emergency ${id} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Emergency ${id} acknowledged. Operations team notified.`,
      emergency: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

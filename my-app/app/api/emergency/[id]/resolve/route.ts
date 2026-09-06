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
    let resolutionNote = 'Emergency resolved and driver assistance concluded.';

    try {
      const body = await req.json();
      if (body.actor) actor = body.actor;
      if (body.resolutionNote) resolutionNote = body.resolutionNote;
    } catch {
      // Default fallback
    }

    const service = EmergencyService.getInstance();
    const updated = await service.resolveEmergency(id, actor, resolutionNote);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: `Emergency ${id} not found.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Emergency ${id} successfully resolved.`,
      emergency: updated,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { EmergencyService } from '@/lib/emergency';

export const dynamic = 'force-dynamic';

async function handleResolve(
  req: NextRequest,
  params: Promise<{ id: string }>
) {
  try {
    const { id } = await params;
    let actor = 'operations_lead';
    let resolutionNote = 'Emergency resolved and driver assistance concluded.';

    try {
      const body = await req.json();
      if (body.actor) actor = body.actor;
      else if (body.resolvedBy) actor = body.resolvedBy;

      if (body.resolutionNote) resolutionNote = body.resolutionNote;
      else if (body.resolutionNotes) resolutionNote = body.resolutionNotes;
      else if (body.notes) resolutionNote = body.notes;
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleResolve(req, params);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleResolve(req, params);
}

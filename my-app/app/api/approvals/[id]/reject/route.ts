import { NextRequest, NextResponse } from 'next/server';
import { rejectMessage } from '@/lib/approvals';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const actor = body.actor || 'dispatcher_ankit';
    const reason = body.reason || 'Rejected by dispatcher';

    const result = await rejectMessage(id, actor, reason);
    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }
    return NextResponse.json({ success: true, record: result.approval, approval: result.approval });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}

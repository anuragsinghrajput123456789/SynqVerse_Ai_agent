import { NextResponse } from 'next/server';
import { getPendingApprovals } from '@/lib/approvals';

export async function GET() {
  try {
    const pending = await getPendingApprovals();
    return NextResponse.json(pending);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

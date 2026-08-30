import { NextResponse } from 'next/server';
import { runIngestion } from '@/lib/ingestion';
import { UnifiedContextStore } from '@/lib/context';

export async function GET() {
  const store = UnifiedContextStore.getInstance();
  let status = store.getStatus();
  if (!status) {
    status = await runIngestion();
  }
  return NextResponse.json(status);
}

export async function POST() {
  const status = await runIngestion();
  return NextResponse.json(status);
}

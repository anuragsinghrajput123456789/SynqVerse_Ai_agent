import { NextResponse } from 'next/server';
import { runIngestion } from '@/lib/ingestion';
import { UnifiedContextStore } from '@/lib/context';

export async function GET() {
  try {
    const store = UnifiedContextStore.getInstance();
    let status = store.getStatus();
    if (!status) {
      status = await runIngestion();
    }
    return NextResponse.json(status);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('API Error /api/context/ingest GET:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const status = await runIngestion();
    return NextResponse.json(status);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('API Error /api/context/ingest POST:', message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

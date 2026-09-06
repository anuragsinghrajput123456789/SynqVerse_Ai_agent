import { NextResponse } from 'next/server';
import { WorkOrderRepository } from '@/lib/work-orders';

export async function GET() {
  try {
    const workOrderRepo = new WorkOrderRepository();
    const orders = await workOrderRepo.findAll();
    return NextResponse.json(orders);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

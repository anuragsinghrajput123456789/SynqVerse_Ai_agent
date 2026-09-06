import { NextResponse } from 'next/server';
import { UnifiedContextStore } from '@/lib/context';
import { runIngestion } from '@/lib/ingestion';

export async function GET() {
  try {
    const store = UnifiedContextStore.getInstance();
    if (!store.getStatus()) {
      await runIngestion();
    }

    const [vehicles, drivers, clients, tickets, conflicts, quarantine] = await Promise.all([
      store.getAllVehicles(),
      store.getAllDrivers(),
      store.getAllClients(),
      store.getAllTickets(),
      store.getAllConflicts(),
      store.getAllQuarantine(),
    ]);

    return NextResponse.json({
      vehicles,
      drivers,
      clients,
      tickets,
      conflicts,
      quarantine,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { Db, Collection } from 'mongodb';
import { getMongoDb } from '../db/mongodb';
import { EmergencyEvent } from './types';

const defaultSeedEmergencies: EmergencyEvent[] = [
  {
    id: 'SOS-1042',
    driverId: 'DRV-014',
    driverName: 'Devin Sibal',
    driverPhone: '+91 98765-43210',
    vehicleId: 'TRK-104',
    vehicleRegistration: 'UP17GN7381',
    tripId: 'trip-153712955',
    status: 'ACTIVE',
    priority: 'CRITICAL',
    severity: 'CRITICAL',
    latitude: 28.2045,
    longitude: 76.8320,
    speed: 0,
    locationName: 'NH-48 Dharuhera Corridor (KM 72)',
    accuracyMeters: 5,
    emergencyType: 'MECHANICAL_BREAKDOWN',
    description: 'Vehicle radiator failure & loss of engine coolant. Heavy vehicle immobilized on shoulder.',
    notes: 'Driver Devin Sibal reported critical breakdown on NH-48. Engine overheating alarm triggered.',
    breakdownId: 'BRK-1042',
    relatedIncidentId: 'INC-1042',
    triggeredAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    timeline: [
      {
        status: 'ACTIVE',
        timestamp: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
        actor: 'Devin Sibal (Driver)',
        note: 'SOS triggered via mobile driver console. Live GPS lock established.',
      },
    ],
    createdAt: new Date(Date.now() - 12 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'SOS-1039',
    driverId: 'DRV-004',
    driverName: 'Hardik Saini',
    driverPhone: '+91 98112-XXXXX',
    vehicleId: 'TRK-102',
    vehicleRegistration: 'UP13DI3925',
    tripId: 'trip-153699945',
    status: 'RESOLVED',
    priority: 'HIGH',
    severity: 'HIGH',
    latitude: 26.8467,
    longitude: 80.9462,
    speed: 22,
    locationName: 'Lucknow-Kanpur Toll Barrier',
    accuracyMeters: 15,
    emergencyType: 'TIRE_PUNCTURE',
    description: 'Dual tire blowout on rear axle. Roadside mobile repair unit dispatched.',
    notes: 'Tire replaced on-site. Unit cleared to resume route.',
    triggeredAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    acknowledgedAt: new Date(Date.now() - 3.9 * 3600 * 1000).toISOString(),
    resolvedAt: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
    acknowledgedBy: 'HQ-DISPATCHER',
    resolvedBy: 'HQ-DISPATCHER',
    timeline: [
      {
        status: 'ACTIVE',
        timestamp: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
        actor: 'Hardik Saini',
        note: 'SOS triggered for rear axle puncture.',
      },
      {
        status: 'ACKNOWLEDGED',
        timestamp: new Date(Date.now() - 3.9 * 3600 * 1000).toISOString(),
        actor: 'HQ-DISPATCHER',
        note: 'Operations acknowledged. Service vehicle dispatched.',
      },
      {
        status: 'RESOLVED',
        timestamp: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
        actor: 'HQ-DISPATCHER',
        note: 'Dual tire mounted. Driver resuming trip.',
      },
    ],
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    updatedAt: new Date(Date.now() - 2.5 * 3600 * 1000).toISOString(),
  },
];

const inMemoryEmergencies = new Map<string, EmergencyEvent>();
defaultSeedEmergencies.forEach((e) => inMemoryEmergencies.set(e.id, e));

async function getDb(): Promise<Db | null> {
  try {
    return await getMongoDb();
  } catch {
    return null;
  }
}

let emergencyIndexesInitialized = false;

async function ensureEmergencyIndexes(col: Collection<EmergencyEvent>) {
  if (emergencyIndexesInitialized) return;
  try {
    await col.createIndex({ id: 1 }, { unique: true });
    await col.createIndex({ driverId: 1 });
    await col.createIndex({ status: 1 });
    await col.createIndex({ triggeredAt: -1 });
    emergencyIndexesInitialized = true;
  } catch {
    // Non-fatal
  }
}

export class EmergencyRepository {
  private seeded = false;

  private async ensureSeed(db: Db | null) {
    if (this.seeded) return;
    this.seeded = true;
    if (db) {
      const col = db.collection<EmergencyEvent>('emergencies');
      await ensureEmergencyIndexes(col);
      const count = await col.countDocuments();
      if (count === 0) {
        for (const seed of defaultSeedEmergencies) {
          await col.updateOne({ id: seed.id }, { $set: seed }, { upsert: true });
        }
      }
    }
  }

  public async insert(event: EmergencyEvent): Promise<EmergencyEvent> {
    const db = await getDb();
    await this.ensureSeed(db);
    if (db) {
      const col = db.collection<EmergencyEvent>('emergencies');
      await col.updateOne({ id: event.id }, { $set: event }, { upsert: true });
    }
    inMemoryEmergencies.set(event.id, event);
    return event;
  }

  public async findById(id: string): Promise<EmergencyEvent | null> {
    const db = await getDb();
    await this.ensureSeed(db);
    if (db) {
      const col = db.collection<EmergencyEvent>('emergencies');
      const found = await col.findOne({ id });
      if (found) return found;
    }
    return inMemoryEmergencies.get(id) || null;
  }

  public async findAll(): Promise<EmergencyEvent[]> {
    const db = await getDb();
    await this.ensureSeed(db);
    if (db) {
      const col = db.collection<EmergencyEvent>('emergencies');
      const list = await col.find({}).sort({ triggeredAt: -1 }).toArray();
      if (list.length > 0) return list;
    }
    return Array.from(inMemoryEmergencies.values()).sort(
      (a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()
    );
  }

  public async findActive(): Promise<EmergencyEvent[]> {
    const all = await this.findAll();
    return all.filter(
      (e) => e.status === 'ACTIVE' || e.status === 'ACKNOWLEDGED' || e.status === 'RESPONDING'
    );
  }

  public async update(id: string, updates: Partial<EmergencyEvent>): Promise<EmergencyEvent | null> {
    const current = await this.findById(id);
    if (!current) return null;

    const updated: EmergencyEvent = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    const db = await getDb();
    if (db) {
      const col = db.collection<EmergencyEvent>('emergencies');
      await col.updateOne({ id }, { $set: updated });
    }
    inMemoryEmergencies.set(id, updated);
    return updated;
  }

  public async countActive(): Promise<number> {
    const active = await this.findActive();
    return active.length;
  }
}

export const emergencyRepository = new EmergencyRepository();

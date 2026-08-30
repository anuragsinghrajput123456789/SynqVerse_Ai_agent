/**
 * Unified Repositories Layer
 * Supports MongoDB with production fail-fast enforcement and local dev fallback.
 */

import { Db } from 'mongodb';
import { getMongoDb } from '../db/mongodb';
import {
  Vehicle,
  Driver,
  Client,
  BreakdownTicket,
  ResolvedEntity,
  Conflict,
  QuarantineRecord,
  IngestionStatus,
  QueueTicket,
  QueueTicketStatus,
  QueueStats,
} from '../types';

class InMemoryStore {
  public vehicles = new Map<string, Vehicle>();
  public drivers = new Map<string, Driver>();
  public clients = new Map<string, Client>();
  public tickets = new Map<string, BreakdownTicket>();
  public resolvedEntities = new Map<string, ResolvedEntity>();
  public conflicts = new Map<string, Conflict>();
  public quarantine = new Map<string, QuarantineRecord>();
  public queueTickets = new Map<string, QueueTicket>();
  public status: IngestionStatus | null = null;

  public clear() {
    this.vehicles.clear();
    this.drivers.clear();
    this.clients.clear();
    this.tickets.clear();
    this.resolvedEntities.clear();
    this.conflicts.clear();
    this.quarantine.clear();
    this.queueTickets.clear();
    this.status = null;
  }
}

export const inMemoryTestStore = new InMemoryStore();

async function getDb(): Promise<Db | null> {
  try {
    return await getMongoDb();
  } catch (err) {
    if (process.env.NODE_ENV === 'production') {
      throw err; // Strict fail-fast in production
    }
    console.warn('MongoDB unavailable in dev/test mode, utilizing repository store:', (err as Error).message);
    return null;
  }
}

export class VehicleRepository {
  public async upsertVehicle(v: Vehicle): Promise<void> {
    const db = await getDb();
    if (db) {
      const col = db.collection('vehicles');
      await col.updateOne(
        { registrationNumber: v.registrationNumber },
        { $set: v },
        { upsert: true }
      );
    } else {
      inMemoryTestStore.vehicles.set(v.registrationNumber, v);
    }
  }

  public async findByReg(reg: string): Promise<Vehicle | null> {
    const db = await getDb();
    if (db) {
      const col = db.collection<Vehicle>('vehicles');
      return col.findOne({ registrationNumber: reg });
    }
    return inMemoryTestStore.vehicles.get(reg) || null;
  }

  public async findAll(): Promise<Vehicle[]> {
    const db = await getDb();
    if (db) {
      const col = db.collection<Vehicle>('vehicles');
      return col.find({}).toArray();
    }
    return Array.from(inMemoryTestStore.vehicles.values());
  }
}

export class DriverRepository {
  public async upsertDriver(d: Driver): Promise<void> {
    const db = await getDb();
    if (db) {
      const col = db.collection('drivers');
      await col.updateOne({ driverId: d.driverId }, { $set: d }, { upsert: true });
    } else {
      inMemoryTestStore.drivers.set(d.driverId, d);
    }
  }

  public async findById(id: string): Promise<Driver | null> {
    const db = await getDb();
    if (db) {
      const col = db.collection<Driver>('drivers');
      return col.findOne({ driverId: id });
    }
    return inMemoryTestStore.drivers.get(id) || null;
  }

  public async findAll(): Promise<Driver[]> {
    const db = await getDb();
    if (db) {
      const col = db.collection<Driver>('drivers');
      return col.find({}).toArray();
    }
    return Array.from(inMemoryTestStore.drivers.values());
  }
}

export class ClientRepository {
  public async upsertClient(c: Client): Promise<void> {
    const db = await getDb();
    if (db) {
      const col = db.collection('clients');
      await col.updateOne({ name: c.name }, { $set: c }, { upsert: true });
    } else {
      inMemoryTestStore.clients.set(c.name, c);
    }
  }

  public async findByName(name: string): Promise<Client | null> {
    const db = await getDb();
    if (db) {
      const col = db.collection<Client>('clients');
      return col.findOne({ name });
    }
    return inMemoryTestStore.clients.get(name) || null;
  }

  public async findAll(): Promise<Client[]> {
    const db = await getDb();
    if (db) {
      const col = db.collection<Client>('clients');
      return col.find({}).toArray();
    }
    return Array.from(inMemoryTestStore.clients.values());
  }
}

export class TicketRepository {
  public async upsertTicket(t: BreakdownTicket): Promise<void> {
    const db = await getDb();
    if (db) {
      const col = db.collection('tickets');
      await col.updateOne({ ticketId: t.ticketId }, { $set: t }, { upsert: true });
    } else {
      inMemoryTestStore.tickets.set(t.ticketId, t);
    }
  }

  public async findById(id: string): Promise<BreakdownTicket | null> {
    const db = await getDb();
    if (db) {
      const col = db.collection<BreakdownTicket>('tickets');
      return col.findOne({ ticketId: id });
    }
    return inMemoryTestStore.tickets.get(id) || null;
  }

  public async findAll(): Promise<BreakdownTicket[]> {
    const db = await getDb();
    if (db) {
      const col = db.collection<BreakdownTicket>('tickets');
      return col.find({}).toArray();
    }
    return Array.from(inMemoryTestStore.tickets.values());
  }
}

export class ResolvedEntityRepository {
  public async upsertEntity(re: ResolvedEntity): Promise<void> {
    const db = await getDb();
    if (db) {
      const col = db.collection('resolved_entities');
      await col.updateOne({ canonicalId: re.canonicalId }, { $set: re }, { upsert: true });
    } else {
      inMemoryTestStore.resolvedEntities.set(re.canonicalId, re);
    }
  }

  public async findById(canonicalId: string): Promise<ResolvedEntity | null> {
    const db = await getDb();
    if (db) {
      const col = db.collection<ResolvedEntity>('resolved_entities');
      return col.findOne({ canonicalId });
    }
    return inMemoryTestStore.resolvedEntities.get(canonicalId) || null;
  }

  public async findAll(): Promise<ResolvedEntity[]> {
    const db = await getDb();
    if (db) {
      const col = db.collection<ResolvedEntity>('resolved_entities');
      return col.find({}).toArray();
    }
    return Array.from(inMemoryTestStore.resolvedEntities.values());
  }
}

export class ConflictRepository {
  public async upsertConflict(c: Conflict): Promise<void> {
    const db = await getDb();
    if (db) {
      const col = db.collection('conflicts');
      await col.updateOne({ id: c.id }, { $set: c }, { upsert: true });
    } else {
      inMemoryTestStore.conflicts.set(c.id, c);
    }
  }

  public async findAll(): Promise<Conflict[]> {
    const db = await getDb();
    if (db) {
      const col = db.collection<Conflict>('conflicts');
      return col.find({}).toArray();
    }
    return Array.from(inMemoryTestStore.conflicts.values());
  }
}

export class QuarantineRepository {
  public async upsertQuarantine(q: QuarantineRecord): Promise<void> {
    const db = await getDb();
    if (db) {
      const col = db.collection('quarantine');
      await col.updateOne({ id: q.id }, { $set: q }, { upsert: true });
    } else {
      inMemoryTestStore.quarantine.set(q.id, q);
    }
  }

  public async findAll(): Promise<QuarantineRecord[]> {
    const db = await getDb();
    if (db) {
      const col = db.collection<QuarantineRecord>('quarantine');
      return col.find({}).toArray();
    }
    return Array.from(inMemoryTestStore.quarantine.values());
  }
}

export class QueueRepository {
  public async upsertQueueTicket(ticket: QueueTicket): Promise<void> {
    const db = await getDb();
    if (db) {
      const col = db.collection('breakdown_queue');
      await col.updateOne(
        { ticketId: ticket.ticketId },
        { $set: ticket },
        { upsert: true }
      );
    } else {
      inMemoryTestStore.queueTickets.set(ticket.ticketId, ticket);
    }
  }

  public async findByTicketId(ticketId: string): Promise<QueueTicket | null> {
    const db = await getDb();
    if (db) {
      const col = db.collection<QueueTicket>('breakdown_queue');
      return col.findOne({ ticketId });
    }
    return inMemoryTestStore.queueTickets.get(ticketId) || null;
  }

  public async findByIdempotencyKey(key: string): Promise<QueueTicket | null> {
    const db = await getDb();
    if (db) {
      const col = db.collection<QueueTicket>('breakdown_queue');
      return col.findOne({ idempotencyKey: key });
    }
    for (const t of inMemoryTestStore.queueTickets.values()) {
      if (t.idempotencyKey === key) return t;
    }
    return null;
  }

  public async findAll(): Promise<QueueTicket[]> {
    const db = await getDb();
    if (db) {
      const col = db.collection<QueueTicket>('breakdown_queue');
      return col.find({}).sort({ createdAt: -1 }).toArray();
    }
    return Array.from(inMemoryTestStore.queueTickets.values()).sort((a, b) =>
      b.createdAt.localeCompare(a.createdAt)
    );
  }

  public async findQuarantined(): Promise<QueueTicket[]> {
    const db = await getDb();
    if (db) {
      const col = db.collection<QueueTicket>('breakdown_queue');
      return col.find({ isQuarantined: true }).toArray();
    }
    return Array.from(inMemoryTestStore.queueTickets.values()).filter((t) => t.isQuarantined);
  }

  public async updateStatus(
    ticketId: string,
    status: QueueTicketStatus,
    processedAt?: string
  ): Promise<QueueTicket | null> {
    const db = await getDb();
    const updatePayload: Partial<QueueTicket> = {
      status,
      processedAt: processedAt || new Date().toISOString(),
    };

    if (db) {
      const col = db.collection<QueueTicket>('breakdown_queue');
      await col.updateOne({ ticketId }, { $set: updatePayload });
      return col.findOne({ ticketId });
    } else {
      const ticket = inMemoryTestStore.queueTickets.get(ticketId);
      if (ticket) {
        const updated = { ...ticket, ...updatePayload };
        inMemoryTestStore.queueTickets.set(ticketId, updated);
        return updated;
      }
      return null;
    }
  }

  public async getStats(): Promise<QueueStats> {
    const tickets = await this.findAll();
    const stats: QueueStats = {
      total: tickets.length,
      valid: 0,
      duplicates: 0,
      quarantined: 0,
      ready: 0,
      processing: 0,
      completed: 0,
    };

    for (const t of tickets) {
      if (t.isQuarantined) stats.quarantined++;
      else if (t.isDuplicate) stats.duplicates++;
      else stats.valid++;

      if (t.status === 'READY') stats.ready++;
      else if (t.status === 'PROCESSING') stats.processing++;
      else if (t.status === 'COMPLETED') stats.completed++;
    }

    return stats;
  }

  public async clear(): Promise<void> {
    const db = await getDb();
    if (db) {
      const col = db.collection('breakdown_queue');
      await col.deleteMany({});
    }
    inMemoryTestStore.queueTickets.clear();
  }
}

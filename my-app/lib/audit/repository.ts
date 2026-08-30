/**
 * Audit Trail MongoDB Repository
 */

import { Db, Collection, MongoServerError } from 'mongodb';
import { getMongoDb } from '../db/mongodb';
import { AuditEvent } from './types';

let indexesEnsured = false;

async function getDb(): Promise<Db> {
  const db = await getMongoDb();
  if (!indexesEnsured) {
    const col = db.collection<AuditEvent>('auditLogs');
    await col.createIndex({ eventId: 1 }, { unique: true });
    await col.createIndex({ ticketId: 1, timestamp: 1 });
    await col.createIndex({ eventType: 1 });
    indexesEnsured = true;
  }
  return db;
}

export class AuditLogRepository {
  private async getCollection(): Promise<Collection<AuditEvent>> {
    const db = await getDb();
    return db.collection<AuditEvent>('auditLogs');
  }

  public async insert(event: AuditEvent): Promise<AuditEvent> {
    const col = await this.getCollection();
    try {
      await col.insertOne(event as import('mongodb').OptionalUnlessRequiredId<AuditEvent>);
      return event;
    } catch (err: unknown) {
      if (err instanceof MongoServerError && err.code === 11000) {
        const existing = await col.findOne({ eventId: event.eventId });
        if (existing) return existing;
      }
      throw err;
    }
  }

  public async findByTicketId(ticketId: string): Promise<AuditEvent[]> {
    const col = await this.getCollection();
    return col.find({ ticketId }).sort({ timestamp: 1 }).toArray();
  }

  public async findByEventType(eventType: string): Promise<AuditEvent[]> {
    const col = await this.getCollection();
    return col.find({ eventType: eventType as any }).sort({ timestamp: -1 }).toArray();
  }

  public async findAll(): Promise<AuditEvent[]> {
    const col = await this.getCollection();
    return col.find({}).sort({ timestamp: 1 }).toArray();
  }

  public async count(): Promise<number> {
    const col = await this.getCollection();
    return col.countDocuments();
  }

  public async clear(): Promise<void> {
    const col = await this.getCollection();
    await col.deleteMany({});
  }
}

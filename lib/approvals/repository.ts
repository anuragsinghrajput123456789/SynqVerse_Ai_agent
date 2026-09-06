/**
 * Human Approval Workflow MongoDB Repository
 */

import { Db, Collection, MongoServerError } from 'mongodb';
import { getMongoDb } from '../db/mongodb';
import { ApprovalRecord } from './types';

let indexesEnsured = false;

async function getDb(): Promise<Db> {
  const db = await getMongoDb();
  if (!indexesEnsured) {
    const col = db.collection<ApprovalRecord>('approvals');
    await col.createIndex({ approvalId: 1 }, { unique: true });
    await col.createIndex({ ticketId: 1 });
    await col.createIndex({ status: 1 });
    indexesEnsured = true;
  }
  return db;
}

export class ApprovalRepository {
  private async getCollection(): Promise<Collection<ApprovalRecord>> {
    const db = await getDb();
    return db.collection<ApprovalRecord>('approvals');
  }

  public async insert(record: ApprovalRecord): Promise<ApprovalRecord> {
    const col = await this.getCollection();
    try {
      await col.insertOne(record as import('mongodb').OptionalUnlessRequiredId<ApprovalRecord>);
      return record;
    } catch (err: unknown) {
      if (err instanceof MongoServerError && err.code === 11000) {
        const existing = await col.findOne({ approvalId: record.approvalId });
        if (existing) return existing;
      }
      throw err;
    }
  }

  public async findById(approvalId: string): Promise<ApprovalRecord | null> {
    const col = await this.getCollection();
    return col.findOne({ approvalId });
  }

  public async findByTicketId(ticketId: string): Promise<ApprovalRecord | null> {
    const col = await this.getCollection();
    return col.findOne({ ticketId });
  }

  public async findByWorkOrderId(workOrderId: string): Promise<ApprovalRecord | null> {
    const col = await this.getCollection();
    return col.findOne({ workOrderId });
  }

  public async findPending(): Promise<ApprovalRecord[]> {
    const col = await this.getCollection();
    return col.find({ status: 'PENDING' }).sort({ createdAt: -1 }).toArray();
  }

  public async findAll(): Promise<ApprovalRecord[]> {
    const col = await this.getCollection();
    return col.find({}).sort({ createdAt: -1 }).toArray();
  }

  public async update(record: ApprovalRecord): Promise<void> {
    const col = await this.getCollection();
    await col.updateOne(
      { approvalId: record.approvalId },
      { $set: record },
      { upsert: true }
    );
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

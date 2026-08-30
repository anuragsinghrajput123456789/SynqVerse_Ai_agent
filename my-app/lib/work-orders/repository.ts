/**
 * Work Order MongoDB Repository with Unique Idempotency Key Enforcement
 */

import { Db, Collection, MongoServerError } from 'mongodb';
import { getMongoDb } from '../db/mongodb';
import { WorkOrder } from './types';

let indexesEnsured = false;

async function getDb(): Promise<Db> {
  const db = await getMongoDb();
  if (!indexesEnsured) {
    const col = db.collection<WorkOrder>('work_orders');
    // Ensure UNIQUE indexes on idempotencyKey and ticketId
    await col.createIndex({ idempotencyKey: 1 }, { unique: true });
    await col.createIndex({ ticketId: 1 }, { unique: true });
    indexesEnsured = true;
  }
  return db;
}

export class WorkOrderRepository {
  private async getCollection(): Promise<Collection<WorkOrder>> {
    const db = await getDb();
    return db.collection<WorkOrder>('work_orders');
  }

  /**
   * Atomic idempotent creation powered directly by MongoDB unique constraint.
   * Concurrent duplicate attempts trigger MongoServerError 11000 and return the existing record.
   */
  public async createIdempotent(workOrder: WorkOrder): Promise<{ created: boolean; workOrder: WorkOrder }> {
    const col = await this.getCollection();

    try {
      await col.insertOne(workOrder as any);
      return { created: true, workOrder };
    } catch (err: unknown) {
      // Check for MongoDB Duplicate Key Error (Code 11000)
      if (err instanceof MongoServerError && err.code === 11000) {
        // Fetch existing work order deterministically
        const existing = await col.findOne({
          $or: [
            { idempotencyKey: workOrder.idempotencyKey },
            { ticketId: workOrder.ticketId },
          ],
        });

        if (existing) {
          return { created: false, workOrder: existing };
        }
      }
      // If other unexpected DB error, throw clearly
      throw err;
    }
  }

  public async findByTicketId(ticketId: string): Promise<WorkOrder | null> {
    const col = await this.getCollection();
    return col.findOne({ ticketId });
  }

  public async findByIdempotencyKey(idempotencyKey: string): Promise<WorkOrder | null> {
    const col = await this.getCollection();
    return col.findOne({ idempotencyKey });
  }

  public async findById(workOrderId: string): Promise<WorkOrder | null> {
    const col = await this.getCollection();
    return col.findOne({ workOrderId });
  }

  public async findAll(): Promise<WorkOrder[]> {
    const col = await this.getCollection();
    return col.find({}).sort({ createdAt: -1 }).toArray();
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

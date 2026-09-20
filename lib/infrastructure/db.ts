/**
 * Reusable Production-Grade MongoDB Infrastructure
 * Provides singleton connection pooling, duplicate connection prevention,
 * index registration, and health monitoring.
 */

import { MongoClient, Db } from 'mongodb';
import { getEnv, isTest, isProduction } from './env';
import { logger } from './logger';

declare global {
  var __mongoClientPromise: Promise<MongoClient> | undefined;
  var __mongoClient: MongoClient | undefined;
  var __indexesEnsured: boolean | undefined;
}

let clientInstance: MongoClient | null = null;
let dbInstance: Db | null = null;
let connectionPromise: Promise<MongoClient> | null = null;

export async function getDatabase(): Promise<Db> {
  if (dbInstance) return dbInstance;

  const env = getEnv();
  const uri = env.MONGODB_URI;

  // Use global cache across hot reloads in development
  if (!isProduction()) {
    if (!global.__mongoClientPromise) {
      const client = new MongoClient(uri, {
        maxPoolSize: isTest() ? 5 : 20,
        minPoolSize: 1,
        serverSelectionTimeoutMS: isTest() ? 1000 : 5000,
      });
      global.__mongoClientPromise = client.connect();
      global.__mongoClient = client;
    }
    const client = await global.__mongoClientPromise;
    dbInstance = client.db();
    clientInstance = client;
  } else {
    // Production connection singleton with mutex promise
    if (!connectionPromise) {
      const client = new MongoClient(uri, {
        maxPoolSize: 30,
        minPoolSize: 3,
        serverSelectionTimeoutMS: 5000,
      });
      connectionPromise = client.connect();
    }
    const client = await connectionPromise;
    clientInstance = client;
    dbInstance = client.db();
  }

  // Ensure database indexes on first connect
  if (!global.__indexesEnsured) {
    try {
      await ensureAllDatabaseIndexes(dbInstance);
      global.__indexesEnsured = true;
    } catch (err) {
      logger.warn('Initial database index setup encountered non-fatal error:', {
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return dbInstance;
}

/**
 * Health check probe for database connectivity and latency.
 */
export async function checkDatabaseHealth(): Promise<{
  isConnected: boolean;
  latencyMs?: number;
  error?: string;
}> {
  const startTime = Date.now();
  try {
    const db = await getDatabase();
    await db.command({ ping: 1 });
    return {
      isConnected: true,
      latencyMs: Date.now() - startTime,
    };
  } catch (err) {
    return {
      isConnected: false,
      latencyMs: Date.now() - startTime,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

/**
 * Ensures indexes across all 13 core collections.
 */
export async function ensureAllDatabaseIndexes(db: Db): Promise<void> {
  const indexDefinitions: Array<{
    collection: string;
    specs: Array<{ spec: Record<string, number>; options?: { unique?: boolean } }>;
  }> = [
    {
      collection: 'vehicles',
      specs: [
        { spec: { registrationNumber: 1 }, options: { unique: true } },
        { spec: { homeHub: 1 } },
        { spec: { status: 1 } },
      ],
    },
    {
      collection: 'drivers',
      specs: [
        { spec: { driverId: 1 }, options: { unique: true } },
        { spec: { status: 1 } },
      ],
    },
    {
      collection: 'clients',
      specs: [
        { spec: { name: 1 }, options: { unique: true } },
        { spec: { clientId: 1 } },
      ],
    },
    {
      collection: 'tickets',
      specs: [
        { spec: { ticketId: 1 }, options: { unique: true } },
        { spec: { status: 1 } },
        { spec: { createdAt: -1 } },
      ],
    },
    {
      collection: 'decisions',
      specs: [
        { spec: { ticketId: 1 }, options: { unique: true } },
      ],
    },
    {
      collection: 'trips',
      specs: [
        { spec: { tripId: 1 }, options: { unique: true } },
        { spec: { vehicleId: 1 } },
        { spec: { driverId: 1 } },
      ],
    },
    {
      collection: 'maintenance_logs',
      specs: [
        { spec: { vehicleId: 1 } },
        { spec: { serviceDate: -1 } },
      ],
    },
    {
      collection: 'quarantined_tickets',
      specs: [
        { spec: { ticketId: 1 }, options: { unique: true } },
      ],
    },
    {
      collection: 'work_orders',
      specs: [
        { spec: { idempotencyKey: 1 }, options: { unique: true } },
        { spec: { ticketId: 1 }, options: { unique: true } },
      ],
    },
    {
      collection: 'approvals',
      specs: [
        { spec: { approvalId: 1 }, options: { unique: true } },
        { spec: { ticketId: 1 } },
        { spec: { status: 1 } },
      ],
    },
    {
      collection: 'auditLogs',
      specs: [
        { spec: { eventId: 1 }, options: { unique: true } },
        { spec: { ticketId: 1, timestamp: 1 } },
        { spec: { eventType: 1 } },
      ],
    },
    {
      collection: 'driver_locations',
      specs: [
        { spec: { driverId: 1 }, options: { unique: true } },
        { spec: { status: 1 } },
        { spec: { lastUpdated: -1 } },
      ],
    },
    {
      collection: 'emergencies',
      specs: [
        { spec: { id: 1 }, options: { unique: true } },
        { spec: { driverId: 1 } },
        { spec: { status: 1 } },
        { spec: { triggeredAt: -1 } },
      ],
    },
  ];

  for (const def of indexDefinitions) {
    try {
      const col = db.collection(def.collection);
      for (const idx of def.specs) {
        await col.createIndex(idx.spec, idx.options || {});
      }
    } catch (err) {
      // Non-fatal if index already exists or in-memory
      logger.debug(`Index registration for ${def.collection}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }
}

/**
 * Gracefully closes the database connection and resets singletons.
 */
export async function closeDatabaseConnection(): Promise<void> {
  if (clientInstance) {
    await clientInstance.close();
    clientInstance = null;
    dbInstance = null;
    connectionPromise = null;
  }
  if (global.__mongoClient) {
    await global.__mongoClient.close();
    global.__mongoClient = undefined;
    global.__mongoClientPromise = undefined;
    global.__indexesEnsured = undefined;
  }
}

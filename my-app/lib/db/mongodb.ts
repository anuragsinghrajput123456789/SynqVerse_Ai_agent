import { MongoClient, Db } from 'mongodb';

let client: MongoClient | null = null;
let db: Db | null = null;

export async function getMongoDb(): Promise<Db> {
  if (db) return db;

  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/meridian_resolve';
  const isTest = process.env.NODE_ENV === 'test';

  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: isTest ? 1000 : 5000,
    });
    await client.connect();
    db = client.db();
    console.log(`Connected to MongoDB at ${uri}`);
    return db;
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL: MongoDB production database connection failed:', err);
      throw new Error(`MongoDB Production Connection Failed: ${errorMsg}. Silently falling back to volatile memory is strictly disabled.`);
    }
    throw new Error(`MongoDB Connection Failed: ${errorMsg}`);
  }
}

export async function closeMongoDb() {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}

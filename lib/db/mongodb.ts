import { Db } from 'mongodb';
import { getDatabase, closeDatabaseConnection } from '../infrastructure/db';

export async function getMongoDb(): Promise<Db> {
  try {
    return await getDatabase();
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    if (process.env.NODE_ENV === 'production') {
      console.error('FATAL: MongoDB production database connection failed:', err);
      throw new Error(`MongoDB Production Connection Failed: ${errorMsg}. Silently falling back to volatile memory is strictly disabled.`);
    }
    throw new Error(`MongoDB Connection Failed: ${errorMsg}`);
  }
}

export async function closeMongoDb(): Promise<void> {
  await closeDatabaseConnection();
}


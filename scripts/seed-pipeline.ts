import { runIngestion } from '../lib/ingestion';
import { BreakdownQueueService } from '../lib/queue';
import { processQueue } from '../lib/pipeline';
import { closeMongoDb } from '../lib/db/mongodb';

async function seed() {
  console.log('Ingesting all canonical source datasets...');
  const status = await runIngestion();
  console.log('Ingestion completed:', status.recordsIngested);

  console.log('Ingesting tickets into BreakdownQueueService...');
  const queueResult = await BreakdownQueueService.getInstance().ingestTickets();
  console.log('Queue stats:', queueResult.stats);

  console.log('Processing all queue tickets with decision engine, vehicle selection, work orders, AI drafts...');
  const result = await processQueue();
  console.log('Pipeline processed stats:', result.stats);
  await closeMongoDb();
}

seed().catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});

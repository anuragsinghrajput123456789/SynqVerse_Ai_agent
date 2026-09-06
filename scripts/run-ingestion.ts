import { runIngestion } from '../lib/ingestion';

async function main() {
  console.log('=== Starting Meridian Resolve Ingestion ===');
  const status = await runIngestion();

  console.log('\n--- INGESTION METRICS ---');
  console.log('Ingestion Run ID:', status.ingestionRunId);
  console.log('Files Discovered:', status.filesDiscovered.length);
  console.log('Records Ingested:', JSON.stringify(status.recordsIngested, null, 2));
  console.log('Records Normalized:', status.recordsNormalized);
  console.log('Entities Resolved:', JSON.stringify(status.entitiesResolved, null, 2));
  console.log('Conflicts Detected:', status.conflictsDetected);
  console.log('PII Fields Masked:', status.piiFieldsMasked);
  console.log('Quarantined Records:', status.quarantinedRecords.length);
  console.log('\n[SUCCESS] Ingestion completed successfully.');
}

main().catch((err) => {
  console.error('Ingestion failed:', err);
  process.exit(1);
});

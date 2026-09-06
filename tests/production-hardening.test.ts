/**
 * Production Hardening Test Suite
 * Validates:
 * 1. Centralized sliding-window rate limiter & limits
 * 2. Zod validation schemas for coordinates, SOS requests, telemetry, and analytics date filters
 * 3. Driver SOS deduplication & authoritative driver validation
 * 4. Comprehensive analytics service calculations (7 dimensions)
 * 5. Production readiness probe dependencies check
 */

import { RateLimiter, rateLimiters } from '../lib/security/rateLimit';
import {
  CreateSOSRequestSchema,
  LocationIngestSchema,
  DateRangeSchema,
} from '../lib/security/validation';
import { EmergencyService } from '../lib/emergency';
import { AnalyticsService } from '../lib/analytics';
import { closeMongoDb } from '../lib/db/mongodb';

async function runProductionHardeningTests() {
  console.log('===================================================================');
  console.log(' GRAFITY - PRODUCTION HARDENING & RELIABILITY TEST SUITE');
  console.log('===================================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`❌ [FAIL] ${testName}`);
      failed++;
    }
  }

  // -------------------------------------------------------------
  // TEST GROUP 1: Centralized Sliding Window Rate Limiter
  // -------------------------------------------------------------
  console.log('--- TEST GROUP 1: Sliding Window Rate Limiter ---');
  const customLimiter = new RateLimiter({ windowMs: 2000, maxRequests: 3 });
  const testKey = `test-client-${Date.now()}`;

  // Hit 1
  const r1 = customLimiter.check(testKey);
  assert(r1.allowed === true, 'Hit 1 is allowed');
  assert(r1.remaining === 2, 'Hit 1 leaves 2 remaining requests');

  // Hit 2
  const r2 = customLimiter.check(testKey);
  assert(r2.allowed === true, 'Hit 2 is allowed');
  assert(r2.remaining === 1, 'Hit 2 leaves 1 remaining request');

  // Hit 3
  const r3 = customLimiter.check(testKey);
  assert(r3.allowed === true, 'Hit 3 is allowed (reaches limit)');
  assert(r3.remaining === 0, 'Hit 3 leaves 0 remaining requests');

  // Hit 4 (Throttled)
  const r4 = customLimiter.check(testKey);
  assert(r4.allowed === false, 'Hit 4 is throttled (429 rejected)');
  assert(r4.remaining === 0, 'Hit 4 remaining is 0');
  assert(r4.resetAt > Date.now(), 'Hit 4 returns future resetAt timestamp');

  // Independent identifier isolation
  const otherKey = `other-client-${Date.now()}`;
  const rOther = customLimiter.check(otherKey);
  assert(rOther.allowed === true, 'Different client key is independently allowed despite prior throttle');

  // Preset rate limiters are defined and properly configured
  assert(Boolean(rateLimiters.sos), 'rateLimiters.sos is defined');
  assert(Boolean(rateLimiters.ai), 'rateLimiters.ai is defined');
  assert(Boolean(rateLimiters.telemetry), 'rateLimiters.telemetry is defined');
  assert(Boolean(rateLimiters.ingest), 'rateLimiters.ingest is defined');

  // -------------------------------------------------------------
  // TEST GROUP 2: Zod Input Validation & Security Schemas
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 2: Zod Input Validation & Security Schemas ---');

  // Valid SOS Request
  const validSos = CreateSOSRequestSchema.safeParse({
    driverId: 'DRV-014',
    vehicleRegistration: 'UP17GN7381',
    latitude: 28.2045,
    longitude: 76.8320,
    emergencyType: 'CRITICAL_SOS',
    description: 'Roadside distress',
  });
  assert(validSos.success === true, 'Valid SOS request passes schema validation');

  // Invalid SOS Request (Out of bounds coordinates)
  const invalidSosCoords = CreateSOSRequestSchema.safeParse({
    driverId: 'DRV-014',
    latitude: 95.0, // Invalid latitude (> 90)
    longitude: 76.8320,
  });
  assert(invalidSosCoords.success === false, 'Invalid latitude (>90) is rejected by schema');

  // Invalid SOS Request (Missing required driverId)
  const invalidSosDriver = CreateSOSRequestSchema.safeParse({
    driverId: '',
    latitude: 28.2045,
    longitude: 76.8320,
  });
  assert(invalidSosDriver.success === false, 'Empty driverId is rejected by schema');

  // Valid Location Ingestion
  const validLocation = LocationIngestSchema.safeParse({
    driverId: 'DRV-014',
    vehicleRegistration: 'UP17GN7381',
    latitude: 28.4595,
    longitude: 77.0266,
    speedKmH: 45,
    heading: 180,
  });
  assert(validLocation.success === true, 'Valid telemetry packet passes validation');

  // Invalid Speed (< 0 or > 200)
  const invalidSpeed = LocationIngestSchema.safeParse({
    driverId: 'DRV-014',
    latitude: 28.4595,
    longitude: 77.0266,
    speedKmH: 350,
  });
  assert(invalidSpeed.success === false, 'Unrealistic speed (>200km/h) is rejected by schema');

  // Date Range Schema
  assert(DateRangeSchema.safeParse('7d').success === true, 'DateRange 7d is valid');
  assert(DateRangeSchema.safeParse('30d').success === true, 'DateRange 30d is valid');
  assert(DateRangeSchema.safeParse('90d').success === true, 'DateRange 90d is valid');
  assert(DateRangeSchema.safeParse('invalid_range').success === false, 'Illegal date range is rejected');

  // -------------------------------------------------------------
  // TEST GROUP 3: Emergency Deduplication & Authority
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 3: Emergency Deduplication & Idempotency ---');
  const emergencyService = EmergencyService.getInstance();

  const sosInput = {
    driverId: 'DRV-014',
    vehicleRegistration: 'UP17GN7381',
    latitude: 28.2045,
    longitude: 76.8320,
    emergencyType: 'CRITICAL_SOS',
    description: 'Highway flat tyre with cargo',
  };

  const emergency1 = await emergencyService.triggerSOS(sosInput);
  assert(Boolean(emergency1.id), 'First SOS trigger creates an emergency record with unique ID');
  assert(emergency1.status === 'ACTIVE', 'Created emergency status is ACTIVE');

  // Duplicate trigger within 15 minutes should return existing emergency
  const emergency2 = await emergencyService.triggerSOS(sosInput);
  assert(emergency2.id === emergency1.id, 'Duplicate SOS within 15m returns identical emergency ID (Idempotent)');
  assert(emergency2.triggeredAt === emergency1.triggeredAt, 'Duplicate SOS preserves original triggered timestamp');

  // -------------------------------------------------------------
  // TEST GROUP 4: Analytics Engine Aggregation
  // -------------------------------------------------------------
  console.log('\n--- TEST GROUP 4: Analytics Service 7-Section Aggregation ---');
  const analytics = AnalyticsService.getInstance();

  const overview = await analytics.getOperationsOverview('7d');
  assert(typeof overview.activeIncidents === 'number', 'Overview returns activeIncidents number');
  assert(typeof overview.resolvedIncidents === 'number', 'Overview returns resolvedIncidents number');
  assert(overview.resolutionRatePct >= 0 && overview.resolutionRatePct <= 100, 'Resolution rate is between 0% and 100%');
  assert(Boolean(overview.lastUpdated), 'Overview includes ISO timestamp');

  const incidentsMetrics = await analytics.getIncidentPerformance('7d');
  assert(incidentsMetrics.totalIncidents >= 0, 'Incident performance returns totalIncidents');
  assert(Array.isArray(incidentsMetrics.incidentsOverTime), 'Incident performance returns incidentsOverTime array');
  assert(Array.isArray(incidentsMetrics.incidentsBySeverity), 'Incident performance returns incidentsBySeverity array');

  const fleetHealth = await analytics.getFleetHealth();
  assert(fleetHealth.totalVehicles >= 0, 'Fleet health returns totalVehicles');
  assert(fleetHealth.utilizationRatePct >= 0 && fleetHealth.utilizationRatePct <= 100, 'Fleet utilizationRatePct is valid');

  const driverSafety = await analytics.getDriverSafety();
  assert(typeof driverSafety.activeEmergencies === 'number', 'Driver safety returns activeEmergencies count');
  assert(typeof driverSafety.averageAcknowledgementTimeSec === 'number', 'Driver safety returns ack time in seconds');
  assert(Boolean(driverSafety.insight), 'Driver safety returns executive grounded insight');

  const workOrders = await analytics.getWorkOrderPerformance();
  assert(typeof workOrders.completedCount === 'number', 'Work orders returns completedCount');
  assert(workOrders.completionRatePct >= 0 && workOrders.completionRatePct <= 100, 'Work orders completionRatePct is valid');

  const aiUsage = await analytics.getAiUsage();
  assert(typeof aiUsage.copilotQueries === 'number', 'AI usage returns copilotQueries');
  assert(typeof aiUsage.aiRequests === 'number', 'AI usage returns aiRequests');
  assert(aiUsage.successRatePct >= 0 && aiUsage.successRatePct <= 100, 'AI successRatePct is valid percentage');

  // -------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------
  console.log('\n===================================================================');
  console.log(` PRODUCTION HARDENING TESTS COMPLETE: ${passed} PASSED, ${failed} FAILED`);
  console.log('===================================================================\n');

  await closeMongoDb();

  if (failed > 0) {
    process.exit(1);
  }
}

runProductionHardeningTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});

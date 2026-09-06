/**
 * Centralized Input Validation Schemas
 * Strict Zod validation for external payloads, coordinates, and query parameters.
 */

import { z } from 'zod';

export const CoordinatesSchema = z.object({
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().min(0).max(10000).optional(),
});

export const LocationIngestSchema = z.object({
  driverId: z.string().min(1).max(64),
  vehicleRegistration: z.string().max(32).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  speedKmH: z.number().min(0).max(200).optional(),
  heading: z.number().min(0).max(360).optional(),
  accuracyMeters: z.number().min(0).max(10000).optional(),
  timestamp: z.string().datetime({ offset: true }).or(z.string()).optional(),
});

export const CreateSOSRequestSchema = z.object({
  driverId: z.string().min(1).max(64),
  vehicleRegistration: z.string().max(32).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  accuracyMeters: z.number().min(0).max(5000).optional(),
  locationName: z.string().max(256).optional(),
  emergencyType: z.string().max(128).optional(),
  description: z.string().max(1000).optional(),
  tripId: z.string().max(64).optional(),
  idempotencyKey: z.string().max(128).optional(),
});

export const DateRangeSchema = z.enum(['today', '7d', '30d', '90d', 'custom']);

export const AnalyticsQuerySchema = z.object({
  range: DateRangeSchema.optional().default('7d'),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export type LocationIngestValidated = z.infer<typeof LocationIngestSchema>;
export type CreateSOSRequestValidated = z.infer<typeof CreateSOSRequestSchema>;
export type AnalyticsQueryValidated = z.infer<typeof AnalyticsQuerySchema>;

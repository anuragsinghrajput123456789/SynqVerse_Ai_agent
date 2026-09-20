/**
 * Reusable Request Validation Infrastructure
 * Validates request bodies, query strings, and parameters against Zod schemas.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { ValidationError } from './api-error';

/**
 * Parses and validates JSON request bodies.
 */
export async function validateBody<T>(req: NextRequest | Request, schema: z.ZodType<T>): Promise<T> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw new ValidationError('Invalid JSON body in request payload');
  }

  const result = schema.safeParse(raw);
  if (!result.success) {
    const errorMessages = result.error.issues.map((i) => `${i.path.join('.') || 'body'}: ${i.message}`).join(', ');
    throw new ValidationError(`Validation failed: ${errorMessages}`, result.error.format());
  }

  return result.data;
}

/**
 * Validates URL query search parameters.
 */
export function validateSearchParams<T>(req: NextRequest | Request, schema: z.ZodType<T>): T {
  const url = new URL(req.url);
  const rawParams: Record<string, string> = {};
  url.searchParams.forEach((val, key) => {
    rawParams[key] = val;
  });

  const result = schema.safeParse(rawParams);
  if (!result.success) {
    const errorMessages = result.error.issues.map((i) => `${i.path.join('.') || 'param'}: ${i.message}`).join(', ');
    throw new ValidationError(`Query parameter validation failed: ${errorMessages}`, result.error.format());
  }

  return result.data;
}

/**
 * Validates route params.
 */
export async function validateRouteParams<T>(
  paramsPromise: Promise<Record<string, string>>,
  schema: z.ZodType<T>
): Promise<T> {
  const raw = await paramsPromise;
  const result = schema.safeParse(raw);
  if (!result.success) {
    const errorMessages = result.error.issues.map((i) => `${i.path.join('.') || 'routeParam'}: ${i.message}`).join(', ');
    throw new ValidationError(`Route parameter validation failed: ${errorMessages}`, result.error.format());
  }
  return result.data;
}

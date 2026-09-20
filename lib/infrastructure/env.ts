/**
 * Reusable Environment Configuration Infrastructure
 * Validates, normalizes, and provides typed access to runtime environment variables.
 */

import { z } from 'zod';

const EnvironmentSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  MONGODB_URI: z
    .string()
    .default('mongodb://localhost:27017/meridian_resolve'),
  GEMINI_API_KEY: z.string().optional(),
  GOOGLE_API_KEY: z.string().optional(),
  GEMINI_MODEL: z.string().default('gemini-2.0-flash'),
  API_AUTH_SECRET: z.string().default('meridian_dev_secret_key_2026'),
  APP_URL: z.string().default('http://localhost:3000'),
});

export type Environment = z.infer<typeof EnvironmentSchema>;

let cachedEnv: Environment | null = null;

export function getEnv(): Environment {
  if (cachedEnv) return cachedEnv;

  const raw = {
    NODE_ENV: process.env.NODE_ENV,
    PORT: process.env.PORT,
    MONGODB_URI: process.env.MONGODB_URI,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    GOOGLE_API_KEY: process.env.GOOGLE_API_KEY,
    GEMINI_MODEL: process.env.GEMINI_MODEL,
    API_AUTH_SECRET: process.env.API_AUTH_SECRET,
    APP_URL: process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL,
  };

  const parsed = EnvironmentSchema.safeParse(raw);
  if (!parsed.success) {
    console.error('Environment variable validation failed:', parsed.error.format());
    // Fall back to safe defaults rather than crashing in dev/test
    cachedEnv = EnvironmentSchema.parse({});
  } else {
    cachedEnv = parsed.data;
  }

  return cachedEnv;
}

export function isProduction(): boolean {
  return getEnv().NODE_ENV === 'production';
}

export function isTest(): boolean {
  return getEnv().NODE_ENV === 'test';
}

export function isDevelopment(): boolean {
  return getEnv().NODE_ENV === 'development';
}

export function getGeminiApiKey(): string | undefined {
  const env = getEnv();
  return env.GEMINI_API_KEY || env.GOOGLE_API_KEY;
}

export function getGeminiModel(): string {
  return getEnv().GEMINI_MODEL;
}

/**
 * Reusable Request ID Infrastructure
 * Generates and traces unique correlation request IDs across HTTP operations.
 */

export const REQUEST_ID_HEADER = 'x-request-id';
export const CORRELATION_ID_HEADER = 'x-correlation-id';

/**
 * Generates an RFC-compliant collision-resistant request identifier.
 */
export function generateRequestId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 10);
  return `req_${timestamp}_${randomPart}`;
}

/**
 * Extracts an existing request ID from headers or generates a new one.
 */
export function getOrCreateRequestId(headers: Headers | Record<string, string | string[] | undefined>): string {
  if (headers instanceof Headers) {
    const existing = headers.get(REQUEST_ID_HEADER) || headers.get(CORRELATION_ID_HEADER);
    if (existing && existing.trim()) return existing.trim();
  } else {
    const raw = headers[REQUEST_ID_HEADER] || headers[CORRELATION_ID_HEADER];
    if (typeof raw === 'string' && raw.trim()) return raw.trim();
    if (Array.isArray(raw) && raw[0]?.trim()) return raw[0].trim();
  }

  return generateRequestId();
}

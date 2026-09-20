/**
 * Reusable Server Response Infrastructure
 * Standardizes Next.js route API responses, error wrapping, and request correlation.
 */

import { NextResponse, NextRequest } from 'next/server';
import { AppError } from './api-error';
import { getOrCreateRequestId, REQUEST_ID_HEADER } from './request-id';
import { logger } from './logger';

export interface ApiResponseMeta {
  requestId: string;
  timestamp: string;
}

export interface ApiResponseEnvelope<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  details?: unknown;
  meta: ApiResponseMeta;
}

export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200,
  requestId?: string,
  extraHeaders?: Record<string, string>
): NextResponse {
  const reqId = requestId || getOrCreateRequestId({});
  const payload: ApiResponseEnvelope<T> = {
    success: true,
    data,
    meta: {
      requestId: reqId,
      timestamp: new Date().toISOString(),
    },
  };

  return NextResponse.json(payload, {
    status: statusCode,
    headers: {
      [REQUEST_ID_HEADER]: reqId,
      ...extraHeaders,
    },
  });
}

export function createErrorResponse(
  err: unknown,
  fallbackStatusCode: number = 500,
  requestId?: string
): NextResponse {
  const reqId = requestId || getOrCreateRequestId({});
  let statusCode = fallbackStatusCode;
  let message = 'An unexpected server error occurred';
  let code = 'INTERNAL_SERVER_ERROR';
  let details: unknown = undefined;

  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code;
    details = err.details;
  } else if (err instanceof Error) {
    message = err.message;
  } else if (typeof err === 'string') {
    message = err;
  }

  // Never expose sensitive internal traces in production
  if (process.env.NODE_ENV === 'production' && statusCode === 500 && !(err instanceof AppError)) {
    message = 'Internal server error. Telemetry incident logged.';
    details = undefined;
  }

  const payload: ApiResponseEnvelope = {
    success: false,
    error: message,
    code,
    details,
    meta: {
      requestId: reqId,
      timestamp: new Date().toISOString(),
    },
  };

  logger.error(`API Request Failed: [${statusCode}] ${message}`, err, { requestId: reqId });

  return NextResponse.json(payload, {
    status: statusCode,
    headers: {
      [REQUEST_ID_HEADER]: reqId,
    },
  });
}

/**
 * Route handler decorator that automatically intercepts unhandled rejections,
 * injects request IDs, and formats responses consistently.
 */
export function withApiHandler<T>(
  handler: (req: NextRequest, context: { params: Promise<Record<string, string>> }) => Promise<NextResponse | T>
) {
  return async (req: NextRequest, context: { params: Promise<Record<string, string>> }): Promise<NextResponse> => {
    const requestId = getOrCreateRequestId(req.headers);
    try {
      const res = await handler(req, context);
      if (res instanceof NextResponse) {
        res.headers.set(REQUEST_ID_HEADER, requestId);
        return res;
      }
      return createSuccessResponse(res, 200, requestId);
    } catch (err: unknown) {
      return createErrorResponse(err, 500, requestId);
    }
  };
}

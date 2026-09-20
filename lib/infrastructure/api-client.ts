/**
 * Reusable Typed Frontend API Client Infrastructure
 * Provides standardized request tracing, timeout aborts, typed response parsing, and error encapsulation.
 */

import { generateRequestId, REQUEST_ID_HEADER } from './request-id';

export interface ApiClientResponse<T> {
  data: T | null;
  error: string | null;
  status: number;
  ok: boolean;
  requestId?: string;
}

export interface ApiClientOptions extends RequestInit {
  timeoutMs?: number;
  params?: Record<string, string | number | boolean | undefined>;
}

class ApiClient {
  private defaultTimeout = 15000;

  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    if (!params) return endpoint;

    const url = new URL(endpoint, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined) {
        url.searchParams.set(key, String(val));
      }
    });
    return url.pathname + url.search;
  }

  public async request<T>(endpoint: string, options: ApiClientOptions = {}): Promise<ApiClientResponse<T>> {
    const { timeoutMs = this.defaultTimeout, params, headers = {}, ...rest } = options;
    const url = this.buildUrl(endpoint, params);
    const requestId = generateRequestId();

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    const mergedHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      [REQUEST_ID_HEADER]: requestId,
      ...(headers as Record<string, string>),
    };

    try {
      const res = await fetch(url, {
        ...rest,
        headers: mergedHeaders,
        signal: controller.signal,
      });

      clearTimeout(timer);

      const responseRequestId = res.headers.get(REQUEST_ID_HEADER) || requestId;
      let json: unknown = null;
      try {
        json = await res.json();
      } catch {
        // Response might be empty or non-JSON
      }

      if (!res.ok) {
        let errorMessage = `HTTP Error ${res.status}`;
        if (json && typeof json === 'object') {
          const obj = json as Record<string, unknown>;
          errorMessage = (obj.error as string) || (obj.message as string) || errorMessage;
        }
        return {
          data: null,
          error: errorMessage,
          status: res.status,
          ok: false,
          requestId: responseRequestId,
        };
      }

      // Check for standardized envelope { success: true, data: T }
      let data: T;
      if (json && typeof json === 'object' && 'data' in json && 'success' in json) {
        data = (json as { data: T }).data;
      } else {
        data = json as T;
      }

      return {
        data,
        error: null,
        status: res.status,
        ok: true,
        requestId: responseRequestId,
      };
    } catch (err: unknown) {
      clearTimeout(timer);
      const isAbort = err instanceof DOMException && err.name === 'AbortError';
      const errorMessage = isAbort
        ? `Request timed out after ${timeoutMs}ms`
        : err instanceof Error
        ? err.message
        : 'Network connection failed';

      return {
        data: null,
        error: errorMessage,
        status: 0,
        ok: false,
        requestId,
      };
    }
  }

  public get<T>(endpoint: string, options?: ApiClientOptions): Promise<ApiClientResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  public post<T>(endpoint: string, body?: unknown, options?: ApiClientOptions): Promise<ApiClientResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public patch<T>(endpoint: string, body?: unknown, options?: ApiClientOptions): Promise<ApiClientResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: unknown, options?: ApiClientOptions): Promise<ApiClientResponse<T>> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string, options?: ApiClientOptions): Promise<ApiClientResponse<T>> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();

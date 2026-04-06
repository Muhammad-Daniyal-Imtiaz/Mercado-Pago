/**
 * api.ts
 *
 * Helpers for testing Next.js App Router API endpoints.
 */
import { NextRequest } from 'next/server';

// 1. Tipado estricto para reemplazar el 'any'
interface MockRequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
}

/**
 * Creates a mock NextRequest object.
 * @param url Full URL for the request
 * @param options Node-fetch like options (method, body, headers, etc.)
 */
export function createMockRequest(url: string, options: MockRequestOptions = {}): NextRequest {
  const { method = 'GET', body, headers } = options;

  // 2. Prevenir la doble serialización si el test ya envía un string
  const parsedBody = typeof body === 'string' ? body : (body ? JSON.stringify(body) : undefined);

  return new NextRequest(new URL(url, 'http://localhost').toString(), {
    method,
    body: parsedBody,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  });
}

/**
 * Parses a NextResponse for testing.
 */
export async function parseResponse(res: Response) {
  const status = res.status;
  const data = await res.json();
  return { status, data };
}
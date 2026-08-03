function normalizeApiUrl(value: string): string {
  const trimmed = value.trim().replace(/\/$/, '');
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes('localhost') || trimmed.startsWith('127.0.0.1')) {
    return `http://${trimmed}`;
  }
  return `https://${trimmed}`;
}

const API_URL = normalizeApiUrl(
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000',
);

type ApiEnvelope<T> = { data: T };

export type ApiFetchOptions = RequestInit & {
  /**
   * Keeps a read response in memory only. It is never written to browser
   * storage and should only be used for low-risk, slowly changing data.
   */
  memoryCacheTtlMs?: number;
};

type MemoryCacheEntry = {
  expiresAt: number;
  payload: unknown;
};

const memoryReadCache = new Map<string, MemoryCacheEntry>();
const inFlightReadRequests = new Map<string, Promise<unknown>>();
const DEFAULT_MEMORY_READ_TTL_MS = 60_000;

export const LEARNING_DATA_UPDATED_EVENT = 'jee-ai:learning-data-updated';

export function clearApiMemoryCache() {
  memoryReadCache.clear();
  inFlightReadRequests.clear();
}

function shouldRefreshLearningViews(path: string) {
  return (
    path.startsWith('/api/learning/sessions') ||
    path.startsWith('/api/practice/sessions') ||
    path.startsWith('/api/diagnostics')
  );
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function errorMessage(payload: unknown, fallback: string): string {
  if (!isRecord(payload)) return fallback;
  const message = payload.message;
  if (Array.isArray(message)) return message.join(' ');
  return typeof message === 'string' ? message : fallback;
}

/**
 * Browser API client for the same-site, HttpOnly-session backend. It never
 * stores or exposes authentication tokens in localStorage or application state.
 */
export async function apiFetch<T>(
  path: string,
  options: ApiFetchOptions = {},
): Promise<T> {
  const { memoryCacheTtlMs, ...requestOptions } = options;
  const method = requestOptions.method?.toUpperCase() ?? 'GET';
  const isRead = method === 'GET';
  const requestKey = `${method}:${API_URL}${path}`;
  const now = Date.now();

  const cacheTtlMs = isRead
    ? (memoryCacheTtlMs ?? DEFAULT_MEMORY_READ_TTL_MS)
    : 0;

  if (!isRead) {
    clearApiMemoryCache();
  } else if (cacheTtlMs > 0) {
    const cached = memoryReadCache.get(requestKey);
    if (cached && cached.expiresAt > now) return cached.payload as T;
    if (cached) memoryReadCache.delete(requestKey);
  }

  const activeRequest = isRead ? inFlightReadRequests.get(requestKey) : undefined;
  if (activeRequest) return activeRequest as Promise<T>;

  const request = requestApi<T>(path, requestOptions);
  if (isRead) inFlightReadRequests.set(requestKey, request);

  try {
    const payload = await request;
    if (isRead && cacheTtlMs > 0) {
      memoryReadCache.set(requestKey, {
        expiresAt: now + cacheTtlMs,
        payload,
      });
    }
    if (!isRead && shouldRefreshLearningViews(path) && typeof window !== 'undefined') {
      window.dispatchEvent(new Event(LEARNING_DATA_UPDATED_EVENT));
    }
    return payload;
  } finally {
    if (isRead) inFlightReadRequests.delete(requestKey);
  }
}

async function requestApi<T>(path: string, options: RequestInit): Promise<T> {
  const headers = new Headers(options.headers);
  const hasJsonBody =
    options.body !== undefined &&
    !(typeof FormData !== 'undefined' && options.body instanceof FormData);
  if (hasJsonBody && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  headers.set('Accept', 'application/json');

  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers,
      credentials: 'include',
      cache: options.cache ?? 'no-store',
    });
  } catch {
    throw new ApiError(0, 'Unable to reach the learning server. Please try again.');
  }

  const responseText = await response.text();
  let payload: unknown = null;
  if (responseText) {
    try {
      payload = JSON.parse(responseText) as unknown;
    } catch {
      payload = responseText;
    }
  }

  if (!response.ok) {
    throw new ApiError(
      response.status,
      errorMessage(payload, 'The request could not be completed.'),
    );
  }

  if (isRecord(payload) && 'data' in payload) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
}

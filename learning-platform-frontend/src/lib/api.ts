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
  options: RequestInit = {},
): Promise<T> {
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

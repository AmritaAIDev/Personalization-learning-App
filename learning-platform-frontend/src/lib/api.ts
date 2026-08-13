function normalizeApiUrl(value: string): string {
  const trimmed = value.trim().replace(/\/$/, "");
  if (!trimmed || trimmed === "same-origin") return "";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  if (trimmed.includes("localhost") || trimmed.startsWith("127.0.0.1")) {
    return `http://${trimmed}`;
  }
  return `https://${trimmed}`;
}

function isLocalHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1";
}

/**
 * The session cookie is issued SameSite=None/Secure and scoped to whatever
 * host actually sets it, so the browser must always talk to the backend
 * same-origin — otherwise the request becomes cross-site and the cookie can
 * get dropped by third-party-cookie policies. next.config.ts's `/api/:path*`
 * rewrite (driven by the server-only BACKEND_URL) already proxies same-origin
 * traffic to any backend, for any deployed host, so a real (non-local)
 * browser must never bypass it — even if NEXT_PUBLIC_API_URL happens to be
 * baked into the build from an old/unrelated config. That var only makes
 * sense for local dev, where there is no rewrite proxy running.
 */
function resolveApiUrl(): string {
  if (typeof window !== "undefined" && !isLocalHost(window.location.hostname)) {
    return "";
  }
  const configured = process.env.NEXT_PUBLIC_API_URL;
  return normalizeApiUrl(configured ?? "http://localhost:4000");
}

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

export const LEARNING_DATA_UPDATED_EVENT = "jee-ai:learning-data-updated";

export function clearApiMemoryCache() {
  memoryReadCache.clear();
  inFlightReadRequests.clear();
}

function shouldRefreshLearningViews(path: string) {
  return (
    path.startsWith("/api/learning/sessions") ||
    path.startsWith("/api/practice/sessions") ||
    path.startsWith("/api/diagnostics") ||
    path.startsWith("/api/doubts") ||
    path.startsWith("/api/notebook")
  );
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function errorMessage(payload: unknown, fallback: string): string {
  if (!isRecord(payload)) return fallback;
  const message = payload.message;
  if (Array.isArray(message)) return message.join(" ");
  return typeof message === "string" ? message : fallback;
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
  const method = requestOptions.method?.toUpperCase() ?? "GET";
  const isRead = method === "GET";
  const apiUrl = resolveApiUrl();
  const requestKey = `${method}:${apiUrl}${path}`;
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

  const activeRequest = isRead
    ? inFlightReadRequests.get(requestKey)
    : undefined;
  if (activeRequest) return activeRequest as Promise<T>;

  const request = requestApi<T>(apiUrl, path, requestOptions);
  if (isRead) inFlightReadRequests.set(requestKey, request);

  try {
    const payload = await request;
    if (isRead && cacheTtlMs > 0) {
      memoryReadCache.set(requestKey, {
        expiresAt: now + cacheTtlMs,
        payload,
      });
    }
    if (
      !isRead &&
      shouldRefreshLearningViews(path) &&
      typeof window !== "undefined"
    ) {
      window.dispatchEvent(new Event(LEARNING_DATA_UPDATED_EVENT));
    }
    return payload;
  } finally {
    if (isRead) inFlightReadRequests.delete(requestKey);
  }
}

export type SseEvent = { event: string; data: unknown };

/**
 * Consumes a Server-Sent Events endpoint that needs a JSON POST body (so the
 * native `EventSource`, which is GET-only and header-less, can't be used).
 * Shares `apiFetch`'s cookie-based session auth and API base URL, but streams
 * parsed events instead of waiting for one full JSON response.
 */
export async function* streamApi(
  path: string,
  options: { body?: unknown } = {},
): AsyncGenerator<SseEvent> {
  const apiUrl = resolveApiUrl();
  const headers = new Headers({ Accept: "text/event-stream" });
  const body = options.body !== undefined ? JSON.stringify(options.body) : undefined;
  if (body !== undefined) headers.set("Content-Type", "application/json");

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      method: "POST",
      headers,
      body,
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      0,
      "Unable to reach the learning server. Please try again.",
    );
  }

  if (!response.ok || !response.body) {
    const text = await response.text().catch(() => "");
    let message = "The request could not be completed.";
    try {
      message = errorMessage(JSON.parse(text) as unknown, message);
    } catch {
      // Non-JSON error body; keep the generic message.
    }
    throw new ApiError(response.status, message);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      const parsed = parseSseEvent(rawEvent);
      if (parsed) yield parsed;
      boundary = buffer.indexOf("\n\n");
    }
  }
}

function parseSseEvent(raw: string): SseEvent | null {
  let eventName = "message";
  const dataLines: string[] = [];
  for (const line of raw.split("\n")) {
    if (line.startsWith("event:")) eventName = line.slice(6).trim();
    else if (line.startsWith("data:")) dataLines.push(line.slice(5).trim());
  }
  if (dataLines.length === 0) return null;
  try {
    return { event: eventName, data: JSON.parse(dataLines.join("\n")) as unknown };
  } catch {
    return null;
  }
}

async function requestApi<T>(
  apiUrl: string,
  path: string,
  options: RequestInit,
): Promise<T> {
  const headers = new Headers(options.headers);
  const hasJsonBody =
    options.body !== undefined &&
    !(typeof FormData !== "undefined" && options.body instanceof FormData);
  if (hasJsonBody && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  let response: Response;
  try {
    response = await fetch(`${apiUrl}${path}`, {
      ...options,
      headers,
      credentials: "include",
      cache: options.cache ?? "no-store",
    });
  } catch {
    throw new ApiError(
      0,
      "Unable to reach the learning server. Please try again.",
    );
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
      errorMessage(payload, "The request could not be completed."),
    );
  }

  if (isRecord(payload) && "data" in payload) {
    return (payload as ApiEnvelope<T>).data;
  }

  return payload as T;
}

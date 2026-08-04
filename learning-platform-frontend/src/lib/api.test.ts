import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiError, apiFetch, clearApiMemoryCache } from "./api";

describe("apiFetch", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    fetchMock.mockReset();
    clearApiMemoryCache();
    vi.stubGlobal("fetch", fetchMock);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses credentials and unwraps the backend data envelope", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { id: "student-1" } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    await expect(apiFetch<{ id: string }>("/api/auth/me")).resolves.toEqual({
      id: "student-1",
    });

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(options.credentials).toBe("include");
    expect(options.cache).toBe("no-store");
    expect((options.headers as Headers).get("Accept")).toBe("application/json");
  });

  it("sets JSON content type for a JSON mutation body", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { saved: true } }), { status: 200 }),
    );

    await apiFetch("/api/diagnostics", {
      method: "POST",
      body: JSON.stringify({ subject: "Physics" }),
    });

    const [, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect((options.headers as Headers).get("Content-Type")).toBe(
      "application/json",
    );
  });

  it("deduplicates concurrent reads without persisting data in browser storage", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { topics: ["Gauss Law"] } }), {
        status: 200,
      }),
    );

    const [first, second] = await Promise.all([
      apiFetch<{ topics: string[] }>("/api/questions/catalog?limit=6"),
      apiFetch<{ topics: string[] }>("/api/questions/catalog?limit=6"),
    ]);

    expect(first).toEqual(second);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("uses a short-lived in-memory cache only when a caller opts in", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ data: { topics: ["Gauss Law"] } }), {
        status: 200,
      }),
    );

    await apiFetch("/api/questions/catalog?limit=6", {
      memoryCacheTtlMs: 45_000,
    });
    await apiFetch("/api/questions/catalog?limit=6", {
      memoryCacheTtlMs: 45_000,
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("surfaces the API error message and status", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ message: "Authentication is required." }), {
        status: 401,
      }),
    );

    await expect(apiFetch("/api/diagnostics/dashboard")).rejects.toEqual(
      expect.objectContaining<ApiError>({
        name: "ApiError",
        status: 401,
        message: "Authentication is required.",
      }),
    );
  });
});

import type { Request } from 'express';

/** Safely read a string cookie without trusting cookie-parser's `any` shape. */
export function readStringCookie(
  request: Pick<Request, 'cookies'>,
  cookieName: string,
): string | undefined {
  const cookies = request.cookies as unknown;
  if (typeof cookies !== 'object' || cookies === null) {
    return undefined;
  }

  const value = (cookies as Record<string, unknown>)[cookieName];
  return typeof value === 'string' ? value : undefined;
}

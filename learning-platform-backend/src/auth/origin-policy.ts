export const DEFAULT_FRONTEND_ORIGINS = [
  'http://localhost:3000',
  'https://personalization-learning-app.vercel.app',
];

/**
 * Parses the explicit browser origins permitted to call the API. Preview
 * deployments are never accepted by hostname pattern: add one to
 * FRONTEND_ORIGIN deliberately when it needs access to production sessions.
 */
export function configuredAllowedOrigins(value?: string): string[] {
  return (value ?? DEFAULT_FRONTEND_ORIGINS.join(','))
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

export function isAllowedBrowserOrigin(
  origin: string | undefined,
  allowedOrigins: string[],
): boolean {
  if (!origin) return false;
  return allowedOrigins.includes(origin.replace(/\/$/, ''));
}

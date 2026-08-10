export const DEFAULT_FRONTEND_ORIGINS = [
  'http://localhost:3000',
  'https://personalization-learning-app.vercel.app',
];

/**
 * Parses the explicit browser origins permitted to call the API. Preview
 * deployments are never accepted by hostname pattern: add one to
 * FRONTEND_ORIGIN deliberately when it needs access to production sessions.
 */
export function configuredAllowedOrigins(
  ...values: Array<string | undefined>
): string[] {
  const configuredValues = values.filter((value) => value?.trim());
  const origins = [...DEFAULT_FRONTEND_ORIGINS, ...configuredValues]
    .join(',')
    .split(',')
    .map((origin) => origin.trim().replace(/\/$/, ''))
    .filter(Boolean);

  return Array.from(new Set(origins));
}

export function isAllowedBrowserOrigin(
  origin: string | undefined,
  allowedOrigins: string[],
): boolean {
  if (!origin) return false;
  return allowedOrigins.includes(origin.replace(/\/$/, ''));
}

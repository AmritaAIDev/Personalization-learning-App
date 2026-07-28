/**
 * Keeps PostgreSQL TLS semantics explicit even when a managed provider supplies
 * a legacy `sslmode=require` URL. The `pg` driver is changing those aliases in
 * a future major release; `verify-full` preserves hostname and certificate
 * verification when SSL is enabled.
 */
export function normalizeDatabaseUrl(
  databaseUrl: string,
  sslEnabled: boolean,
): string {
  if (!sslEnabled) return databaseUrl;

  const parsed = new URL(databaseUrl);
  const sslMode = parsed.searchParams.get('sslmode')?.toLowerCase();
  if (
    sslMode === 'prefer' ||
    sslMode === 'require' ||
    sslMode === 'verify-ca'
  ) {
    parsed.searchParams.set('sslmode', 'verify-full');
  }
  return parsed.toString();
}

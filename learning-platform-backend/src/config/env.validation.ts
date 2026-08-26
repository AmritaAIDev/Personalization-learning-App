/**
 * Validates configuration once, at boot.
 *
 * Without this, a missing or malformed variable surfaces as a confusing runtime
 * failure on whichever request happens to need it first — an unreachable
 * database on the learner's first click, or a silently CORS-blocked frontend.
 * Failing at startup instead means a bad deploy never serves traffic.
 */

const PRODUCTION_REQUIRED = ['DATABASE_URL', 'FRONTEND_ORIGIN'] as const;

function isProduction(env: Record<string, unknown>): boolean {
  return env.NODE_ENV === 'production';
}

function asString(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export function validateEnv(
  config: Record<string, unknown>,
): Record<string, unknown> {
  const errors: string[] = [];

  const databaseUrl = asString(config.DATABASE_URL);
  if (!databaseUrl) {
    errors.push('DATABASE_URL is required.');
  } else if (!/^postgres(ql)?:\/\//i.test(databaseUrl)) {
    errors.push('DATABASE_URL must be a postgres:// or postgresql:// URL.');
  }

  if (isProduction(config)) {
    for (const key of PRODUCTION_REQUIRED) {
      if (!asString(config[key])) {
        errors.push(`${key} is required in production.`);
      }
    }

    // A production database reached without TLS exposes session cookies and
    // learner data on the wire, so the opt-out must be deliberate and local.
    if (asString(config.DATABASE_SSL) === 'false') {
      errors.push(
        'DATABASE_SSL must not be "false" in production; TLS to the database is required.',
      );
    }
    if (asString(config.DATABASE_SSL_REJECT_UNAUTHORIZED) === 'false') {
      errors.push(
        'DATABASE_SSL_REJECT_UNAUTHORIZED must not be "false" in production; ' +
          'certificate verification is required.',
      );
    }

    for (const origin of asString(config.FRONTEND_ORIGIN)
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)) {
      if (!origin.startsWith('https://')) {
        errors.push(
          `FRONTEND_ORIGIN entry "${origin}" must use https:// in production.`,
        );
      }
    }
  }

  const qdrantUrl = asString(config.QDRANT_URL);
  if (qdrantUrl && !qdrantUrl.startsWith('https://')) {
    errors.push('QDRANT_URL must use https:// (Qdrant Cloud requires TLS).');
  }

  const deepseekKey = asString(config.DEEPSEEK_API_KEY);
  if (deepseekKey && deepseekKey.length < 10) {
    errors.push('DEEPSEEK_API_KEY looks too short to be valid.');
  }

  if (isProduction(config)) {
    if (!qdrantUrl) {
      // Non-blocking in env validation, but log will warn at boot — AI features will degrade to DB fallback
      // We don't throw here to allow prod boot without vector DB, but health check will report degraded
    }
    if (!deepseekKey) {
      // Same — allow boot, Degraded health
    }
  }

  const tracesSampleRate = asString(config.SENTRY_TRACES_SAMPLE_RATE);
  if (tracesSampleRate) {
    const parsed = Number(tracesSampleRate);
    if (!Number.isFinite(parsed) || parsed < 0 || parsed > 1) {
      errors.push(
        'SENTRY_TRACES_SAMPLE_RATE must be a number between 0 and 1.',
      );
    }
  }

  if (errors.length > 0) {
    throw new Error(
      `Invalid environment configuration:\n  - ${errors.join('\n  - ')}`,
    );
  }

  return config;
}

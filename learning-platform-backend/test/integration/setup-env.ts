/**
 * Integration runs talk to a real PostgreSQL database. Nest reads configuration
 * through ConfigModule at import time, so the required defaults must be in
 * place before `AppModule` is pulled in by any spec.
 */
process.env.NODE_ENV ??= 'test';
process.env.DATABASE_SSL ??= 'false';
process.env.DATABASE_SSL_REJECT_UNAUTHORIZED ??= 'false';
process.env.FRONTEND_ORIGIN ??= 'http://localhost:3000';

/**
 * Never let the suite reach a paid or rate-limited third party. A developer
 * with real credentials exported would otherwise spend DeepSeek tokens on every
 * run, and — worse — the low-supply specs would silently assert the opposite of
 * what they claim, because a configured LLM generates the questions whose
 * absence they are meant to prove. Cleared unconditionally, not defaulted.
 */
process.env.DEEPSEEK_API_KEY = '';
process.env.QDRANT_URL = '';
process.env.QDRANT_API_KEY = '';

if (!process.env.DATABASE_URL) {
  throw new Error(
    'DATABASE_URL must point at a disposable PostgreSQL database to run the ' +
      'integration suite. Never point it at production: the suite writes and ' +
      'deletes rows.',
  );
}

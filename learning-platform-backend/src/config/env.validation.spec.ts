import { validateEnv } from './env.validation';

const productionEnv = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://user:pass@db.example.com:5432/jee',
  FRONTEND_ORIGIN: 'https://app.example.com',
};

describe('validateEnv', () => {
  it('accepts a complete production configuration', () => {
    expect(() => validateEnv({ ...productionEnv })).not.toThrow();
  });

  it('accepts local development without production-only requirements', () => {
    expect(() =>
      validateEnv({
        NODE_ENV: 'development',
        DATABASE_URL: 'postgresql://localhost:5432/jee',
        DATABASE_SSL: 'false',
      }),
    ).not.toThrow();
  });

  it('rejects a missing database url', () => {
    expect(() => validateEnv({ NODE_ENV: 'development' })).toThrow(
      /DATABASE_URL is required/,
    );
  });

  it('rejects a database url that is not a postgres connection string', () => {
    expect(() =>
      validateEnv({ NODE_ENV: 'development', DATABASE_URL: 'mysql://host/db' }),
    ).toThrow(/must be a postgres/);
  });

  it('rejects production without a configured frontend origin', () => {
    const withoutOrigin: Record<string, unknown> = { ...productionEnv };
    delete withoutOrigin.FRONTEND_ORIGIN;
    expect(() => validateEnv(withoutOrigin)).toThrow(
      /FRONTEND_ORIGIN is required in production/,
    );
  });

  it('rejects a production frontend origin served over http', () => {
    expect(() =>
      validateEnv({
        ...productionEnv,
        FRONTEND_ORIGIN: 'http://app.example.com',
      }),
    ).toThrow(/must use https/);
  });

  it('rejects disabling database TLS in production', () => {
    expect(() =>
      validateEnv({ ...productionEnv, DATABASE_SSL: 'false' }),
    ).toThrow(/TLS to the database is required/);
  });

  it('rejects disabling certificate verification in production', () => {
    expect(() =>
      validateEnv({
        ...productionEnv,
        DATABASE_SSL_REJECT_UNAUTHORIZED: 'false',
      }),
    ).toThrow(/certificate verification is required/);
  });

  it('rejects a Sentry sample rate outside the unit interval', () => {
    expect(() =>
      validateEnv({ ...productionEnv, SENTRY_TRACES_SAMPLE_RATE: '5' }),
    ).toThrow(/between 0 and 1/);
  });

  it('reports every configuration problem at once', () => {
    expect(() =>
      validateEnv({ NODE_ENV: 'production', DATABASE_SSL: 'false' }),
    ).toThrow(/DATABASE_URL[\s\S]*FRONTEND_ORIGIN[\s\S]*TLS/);
  });
});

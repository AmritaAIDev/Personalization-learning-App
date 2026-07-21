import { normalizeDatabaseUrl } from './database-url';

describe('normalizeDatabaseUrl', () => {
  it('upgrades legacy TLS aliases to explicit verify-full mode', () => {
    expect(
      normalizeDatabaseUrl(
        'postgres://learner:password@db.example.com:5432/jee?sslmode=require',
        true,
      ),
    ).toContain('sslmode=verify-full');
  });

  it('preserves a URL unchanged when TLS is intentionally disabled locally', () => {
    const url = 'postgres://localhost:5432/jee?sslmode=disable';
    expect(normalizeDatabaseUrl(url, false)).toBe(url);
  });
});

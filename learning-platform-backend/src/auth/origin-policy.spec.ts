import {
  configuredAllowedOrigins,
  isAllowedBrowserOrigin,
} from './origin-policy';

describe('origin policy', () => {
  it('normalizes an explicit comma-separated allowlist', () => {
    expect(
      configuredAllowedOrigins(
        ' https://app.example.test/ , http://localhost:3000 ',
      ),
    ).toEqual(['https://app.example.test', 'http://localhost:3000']);
  });

  it('accepts only an exact configured browser origin', () => {
    const origins = configuredAllowedOrigins('https://app.example.test');

    expect(isAllowedBrowserOrigin('https://app.example.test/', origins)).toBe(
      true,
    );
    expect(
      isAllowedBrowserOrigin('https://app-example-preview.vercel.app', origins),
    ).toBe(false);
  });

  it('uses the first configured allowlist and removes duplicates', () => {
    expect(
      configuredAllowedOrigins(
        undefined,
        'https://app.example.test, https://app.example.test/',
        'https://ignored.example.test',
      ),
    ).toEqual(['https://app.example.test']);
  });

  it('rejects requests that omit an origin in browser-origin checks', () => {
    expect(isAllowedBrowserOrigin(undefined, configuredAllowedOrigins())).toBe(
      false,
    );
  });
});

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
    ).toEqual([
      'http://localhost:3000',
      'https://personalization-learning-app.vercel.app',
      'https://app.example.test',
    ]);
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

  it('keeps default origins while adding configured allowlists', () => {
    expect(
      configuredAllowedOrigins(
        undefined,
        'https://app.example.test, https://app.example.test/',
        'https://ignored.example.test',
      ),
    ).toEqual([
      'http://localhost:3000',
      'https://personalization-learning-app.vercel.app',
      'https://app.example.test',
      'https://ignored.example.test',
    ]);
  });

  it('rejects requests that omit an origin in browser-origin checks', () => {
    expect(isAllowedBrowserOrigin(undefined, configuredAllowedOrigins())).toBe(
      false,
    );
  });
});

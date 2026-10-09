import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Components are compiled with the automatic JSX runtime, like Next does.
  oxc: { jsx: { runtime: 'automatic' } },
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});

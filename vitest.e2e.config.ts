import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    root: 'test',
    include: ['e2e/**/*.test.ts'],
    globalSetup: './setup.ts',
  },
});

import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '*.spec.ts',
  use: {
    baseURL: 'http://127.0.0.1:3000',
  },
  webServer: {
    command: 'node scripts/playwright-webserver.cjs',
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: false,
    timeout: 180000,
  },
})

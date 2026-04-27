import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '*.spec.ts',
  use: {
    baseURL: 'http://127.0.0.1:3000',
  },
  webServer: {
    command: `node -e "require('node:fs').rmSync('.next', { recursive: true, force: true })" && npm run build && npm run start -- --hostname 127.0.0.1 --port 3000`,
    url: 'http://127.0.0.1:3000',
    reuseExistingServer: false,
    timeout: 180000,
  },
})

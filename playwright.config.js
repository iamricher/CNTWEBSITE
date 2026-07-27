// @ts-check
const { defineConfig, devices } = require('@playwright/test');

const PORT = 4173;

/**
 * E2E config for the CNT ATS static apps.
 *
 * Tests exercise client-side behaviour that must not regress (form validation,
 * conditional fields, privacy controls, auth gates rendering) WITHOUT depending
 * on the live Supabase backend — so they stay deterministic in CI.
 */
module.exports = defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'list' : 'line',
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: `node scripts/serve.js ${PORT}`,
    url: `http://127.0.0.1:${PORT}/index.html`,
    reuseExistingServer: !process.env.CI,
    timeout: 30000,
  },
});

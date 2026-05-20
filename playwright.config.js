/** @type {import('@playwright/test').PlaywrightTestConfig} */
export default {
  testDir: './tests',
  timeout: 60_000,
  use: {
    headless: process.env.HEADLESS !== 'false',
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    trace: 'on-first-retry',
  },
};

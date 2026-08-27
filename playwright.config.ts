import { defineConfig, devices } from "@playwright/test";

const baseURL = process.env.E2E_BASE_URL || "https://membership.susandrury.com";

export default defineConfig({
  testDir: "./tests/e2e",
  outputDir: "./test-results/playwright",
  timeout: 30_000,
  expect: {
    timeout: 8_000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.02,
    },
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  reporter: [["list"], ["html", { outputFolder: "test-results/playwright-report", open: "never" }]],
  use: {
    baseURL,
    colorScheme: "light",
    locale: "en-US",
    timezoneId: "America/Denver",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  projects: [
    {
      name: "mobile-320",
      use: { ...devices["Desktop Chrome"], viewport: { width: 320, height: 740 }, deviceScaleFactor: 1 },
    },
    {
      name: "mobile-430",
      use: { ...devices["Desktop Chrome"], viewport: { width: 430, height: 932 }, deviceScaleFactor: 1 },
    },
    {
      name: "tablet-768",
      use: { ...devices["Desktop Chrome"], viewport: { width: 768, height: 1024 }, deviceScaleFactor: 1 },
    },
    {
      name: "desktop-1440",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 1000 }, deviceScaleFactor: 1 },
    },
  ],
});

import { defineConfig } from "@playwright/test";

/** Playwright config — Chrome extension E2E (live Vivino + Wineview). */
export default defineConfig({
  testDir: "e2e",
  timeout: 120_000,
  expect: { timeout: 90_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"]],
  use: {
    trace: "retain-on-failure",
  },
});

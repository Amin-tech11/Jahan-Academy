import { defineConfig, devices } from "@playwright/test";

const browserName = process.env.BROWSER_ENGINE === "firefox" ? "firefox"
  : process.env.BROWSER_ENGINE === "webkit" ? "webkit" : "chromium";

export default defineConfig({
  testDir: "./browser-tests",
  timeout: 45000,
  expect: { timeout: 10000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: {
    ...devices["Desktop Chrome"],
    browserName,
    baseURL: process.env.BROWSER_BASE_URL ?? "http://localhost:5100",
    channel: browserName === "chromium" ? process.env.BROWSER_CHANNEL || undefined : undefined,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
});

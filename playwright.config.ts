import path from "node:path"
import { defineConfig, devices } from "@playwright/test"

// Stories run against docs/ served under the same sub-path GitHub Pages uses, so a root-absolute link fails here too.
const BASE_PATH = "/ui-sdk-demo/"
const PORT = 4377
const CI = !!process.env.CI

export default defineConfig({
  testDir: "./tests",
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 2 : 0,
  failOnFlakyTests: CI,
  workers: CI ? (process.env.PLAYWRIGHT_WORKERS ?? "50%") : undefined,
  reporter: [
    ["list"],
    ["html", { open: "never" }],
    ["executable-stories-playwright/reporter", { formats: ["html"], outputDir: path.join(import.meta.dirname, "docs/report") }],
  ],
  use: {
    ...devices["Desktop Chrome"],
    baseURL: `http://localhost:${PORT}${BASE_PATH}`,
    viewport: { width: 1280, height: 800 },
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  expect: { timeout: 7_500 },
  timeout: 60_000,
  webServer: {
    command: `npm run pages && vite preview --outDir docs --port ${PORT} --strictPort --base ${BASE_PATH}`,
    url: `http://localhost:${PORT}${BASE_PATH}`,
    reuseExistingServer: !CI,
    timeout: 120_000,
  },
})

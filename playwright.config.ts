import { defineConfig, devices } from "@playwright/test";

/** The app uses the library's built `dist`, so run `pnpm build` there first. */
export default defineConfig({
  testDir: "./e2e",
  outputDir: "test-results",
  fullyParallel: true,
  reporter: [["list"], ["html", { open: "never" }]],
  retries: process.env.CI ? 1 : 0,
  use: {
    baseURL: "http://localhost:5199",
    viewport: { width: 2100, height: 1100 },
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"], viewport: { width: 2100, height: 1100 } } }],
  webServer: {
    command: "pnpm exec vite --port 5199 --strictPort",
    url: "http://localhost:5199",
    reuseExistingServer: !process.env.CI,
  },
});

import { defineConfig } from "@playwright/test";
export default defineConfig({
  testDir: "./tests/e2e", fullyParallel: false, workers: 1,
  use: { baseURL: "http://localhost:3100", browserName: "chromium", trace: "retain-on-failure" },
  webServer: { command: "npm run start -- --port 3100", url: "http://localhost:3100", reuseExistingServer: !process.env.CI, timeout: 60_000 },
});

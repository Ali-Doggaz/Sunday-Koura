import { config } from "dotenv";
import { defineConfig, devices } from "@playwright/test";

config({ path: ".env.local", quiet: true });

const PORT = 3100;
const BASE_URL = `http://localhost:${PORT}`;
// End-to-end tests run against the test database, never the dev one.
export const E2E_DATABASE_URL = process.env.DATABASE_URL!.replace(
  /\/sunday_koura$/,
  "/sunday_koura_test",
);

export default defineConfig({
  testDir: "./e2e",
  globalSetup: "./e2e/global-setup.ts",
  fullyParallel: false,
  workers: 1,
  use: { baseURL: BASE_URL, ...devices["Pixel 7"] },
  webServer: {
    command: `npx next build && npx next start --port ${PORT}`,
    url: BASE_URL,
    reuseExistingServer: false,
    timeout: 300_000,
    env: {
      DATABASE_URL: E2E_DATABASE_URL,
      BETTER_AUTH_URL: BASE_URL,
      E2E_TEST_LOGIN: "true",
      ADMIN_EMAILS: "admin@test.local",
      GOOGLE_CLIENT_ID: "",
      FACEBOOK_CLIENT_ID: "",
    },
  },
});

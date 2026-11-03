import { config } from "dotenv";

config({ path: ".env.local", quiet: true });
// Tests never touch the dev database.
process.env.DATABASE_URL = process.env.DATABASE_URL!.replace(
  /\/sunday_koura$/,
  "/sunday_koura_test",
);
process.env.E2E_TEST_LOGIN = "false";

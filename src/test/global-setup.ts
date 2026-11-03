import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

// Brings the test database up to date before any test runs.
export default async function setup() {
  config({ path: ".env.local", quiet: true });
  const url = process.env.DATABASE_URL!.replace(/\/sunday_koura$/, "/sunday_koura_test");
  const db = drizzle(url);
  await migrate(db, { migrationsFolder: "drizzle" });
  await db.$client.end();
}

import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { E2E_DATABASE_URL } from "../playwright.config";

export default async function setup() {
  const db = drizzle(E2E_DATABASE_URL);
  await migrate(db, { migrationsFolder: "drizzle" });
  await db.execute(
    sql`truncate table participation, game, session, account, verification, "user" cascade`,
  );
  await db.$client.end();
}

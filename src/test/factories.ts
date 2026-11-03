import { randomUUID } from "node:crypto";
import { sql } from "drizzle-orm";
import { db } from "@/db";
import { game, user } from "@/db/schema";

export async function resetDatabase() {
  await db.execute(sql`truncate table participation, game, session, account, "user" cascade`);
}

export async function createUser(attrs: Partial<typeof user.$inferInsert> = {}) {
  const id = randomUUID();
  const [created] = await db
    .insert(user)
    .values({
      id,
      name: `Joueur ${id.slice(0, 4)}`,
      email: `${id}@test.local`,
      role: "user",
      ...attrs,
    })
    .returning();
  return created;
}

export const createAdmin = () => createUser({ role: "admin" });

export async function createGame(attrs: Partial<typeof game.$inferInsert> = {}) {
  const [created] = await db
    .insert(game)
    .values({
      title: "Foot du dimanche",
      location: "City stade",
      startsAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      maxPlayers: 2,
      ...attrs,
      createdById: attrs.createdById ?? (await createAdmin()).id,
    })
    .returning();
  return created;
}

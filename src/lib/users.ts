import { and, asc, count, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { participation, user } from "@/db/schema";

export async function listUsers() {
  return db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      role: user.role,
      banned: user.banned,
      banReason: user.banReason,
      createdAt: user.createdAt,
      games: count(participation.id),
    })
    .from(user)
    .leftJoin(
      participation,
      and(eq(participation.userId, user.id), isNull(participation.guestName)),
    )
    .groupBy(user.id)
    .orderBy(asc(user.name));
}

export type UserRow = Awaited<ReturnType<typeof listUsers>>[number];

import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema";

export * from "./auth-schema";

export const game = pgTable("game", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  location: text("location").notNull(),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  maxPlayers: integer("max_players").notNull(),
  notes: text("notes"),
  // A locked game accepts no new sign-ups (not even on the waiting list).
  locked: boolean("locked").default(false).notNull(),
  cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
  createdById: text("created_by_id")
    .notNull()
    .references(() => user.id),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const participationStatus = pgEnum("participation_status", [
  "confirmed",
  "pending_confirmation",
  "waitlisted",
]);

// One row per spot in a game: a player, or a named guest invited by a player.
export const participation = pgTable(
  "participation",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    gameId: uuid("game_id")
      .notNull()
      .references(() => game.id, { onDelete: "cascade" }),
    // The player, or the inviter when guestName is set.
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    guestName: text("guest_name"),
    status: participationStatus("status").notNull(),
    addedById: text("added_by_id")
      .notNull()
      .references(() => user.id),
    // Waiting-list order.
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("participation_game_idx").on(table.gameId, table.createdAt),
    index("participation_user_idx").on(table.userId),
    uniqueIndex("participation_one_spot_per_player")
      .on(table.gameId, table.userId)
      .where(sql`${table.guestName} is null`),
  ],
);

export const gameRelations = relations(game, ({ many }) => ({
  participations: many(participation),
}));

export const participationRelations = relations(participation, ({ one }) => ({
  game: one(game, { fields: [participation.gameId], references: [game.id] }),
  user: one(user, { fields: [participation.userId], references: [user.id] }),
}));

export type Game = typeof game.$inferSelect;
export type Participation = typeof participation.$inferSelect;
export type ParticipationStatus = Participation["status"];

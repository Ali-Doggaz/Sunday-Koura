import { and, asc, desc, eq, gte, inArray, isNull, lt } from "drizzle-orm";
import { db } from "@/db";
import { game, participation, user, type Game, type ParticipationStatus } from "@/db/schema";
import { takenSpots } from "./rules";

// Games stay "upcoming" until 3 hours after kickoff, so they're visible during the game.
const UPCOMING_GRACE_MS = 3 * 60 * 60 * 1000;
const upcomingSince = () => new Date(Date.now() - UPCOMING_GRACE_MS);

export type GameEntry = {
  id: string;
  userId: string;
  userName: string;
  guestName: string | null;
  status: ParticipationStatus;
  createdAt: Date;
};

export type GameDetail = Game & {
  players: GameEntry[];
  waitlist: GameEntry[];
};

export type GameSummary = Game & {
  taken: number;
  waitlisted: number;
  viewerStatus: ParticipationStatus | null;
};

async function entriesFor(gameIds: string[]): Promise<(GameEntry & { gameId: string })[]> {
  if (gameIds.length === 0) return [];
  const rows = await db
    .select({
      id: participation.id,
      gameId: participation.gameId,
      userId: participation.userId,
      userName: user.name,
      guestName: participation.guestName,
      status: participation.status,
      createdAt: participation.createdAt,
    })
    .from(participation)
    .innerJoin(user, eq(user.id, participation.userId))
    .where(inArray(participation.gameId, gameIds))
    .orderBy(asc(participation.createdAt));
  return rows;
}

function summarize(
  games: Game[],
  entries: (GameEntry & { gameId: string })[],
  viewerId?: string,
): GameSummary[] {
  return games.map((g) => {
    const own = entries.filter((e) => e.gameId === g.id);
    return {
      ...g,
      taken: takenSpots(own),
      waitlisted: own.filter((e) => e.status === "waitlisted").length,
      viewerStatus: own.find((e) => e.userId === viewerId && e.guestName === null)?.status ?? null,
    };
  });
}

export async function listUpcomingGames(viewerId?: string): Promise<GameSummary[]> {
  const games = await db
    .select()
    .from(game)
    .where(gte(game.startsAt, upcomingSince()))
    .orderBy(asc(game.startsAt));
  return summarize(games, await entriesFor(games.map((g) => g.id)), viewerId);
}

export async function listRecentGames(limit = 10): Promise<GameSummary[]> {
  const games = await db
    .select()
    .from(game)
    .where(lt(game.startsAt, upcomingSince()))
    .orderBy(desc(game.startsAt))
    .limit(limit);
  return summarize(games, await entriesFor(games.map((g) => g.id)));
}

export async function getGameDetail(gameId: string): Promise<GameDetail | null> {
  const [found] = await db.select().from(game).where(eq(game.id, gameId));
  if (!found) return null;
  const entries = await entriesFor([gameId]);
  return {
    ...found,
    players: entries.filter((e) => e.status !== "waitlisted"),
    waitlist: entries.filter((e) => e.status === "waitlisted"),
  };
}

/** Games the user signed up for themselves (not as a guest's inviter). */
export async function listGamesForUser(userId: string) {
  return db
    .select({ game, status: participation.status, entryId: participation.id })
    .from(participation)
    .innerJoin(game, eq(game.id, participation.gameId))
    .where(and(eq(participation.userId, userId), isNull(participation.guestName)))
    .orderBy(desc(game.startsAt));
}

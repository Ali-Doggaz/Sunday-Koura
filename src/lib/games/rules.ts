import type { Game, ParticipationStatus } from "@/db/schema";

export const MAX_GUESTS_PER_PLAYER = 2;

type Entry = { id: string; status: ParticipationStatus; createdAt: Date };

/** Error shown to the user when an action breaks a game rule. */
export class GameError extends Error {}

export function takenSpots(entries: Entry[]) {
  return entries.filter((entry) => entry.status !== "waitlisted").length;
}

export function statusForNewEntry(maxPlayers: number, entries: Entry[]): ParticipationStatus {
  return takenSpots(entries) < maxPlayers ? "confirmed" : "waitlisted";
}

/** Ids of the waiting-list entries that move into the game, first in line first. */
export function entriesToPromote(maxPlayers: number, entries: Entry[]): string[] {
  const freeSpots = maxPlayers - takenSpots(entries);
  if (freeSpots <= 0) return [];

  return entries
    .filter((entry) => entry.status === "waitlisted")
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
    .slice(0, freeSpots)
    .map((entry) => entry.id);
}

/** Why players can't sign up right now, or null when they can. */
export function signUpClosedReason(
  game: Pick<Game, "cancelledAt" | "locked" | "startsAt">,
  now = new Date(),
): string | null {
  if (game.cancelledAt) return "Ce match est annulé.";
  if (game.startsAt <= now) return "Ce match a déjà commencé.";
  if (game.locked) return "Les inscriptions sont fermées pour ce match.";
  return null;
}

import { asc, eq } from "drizzle-orm";
import { beforeEach, describe, expect, it } from "vitest";
import { db } from "@/db";
import { game, participation } from "@/db/schema";
import { createAdmin, createGame, createUser, resetDatabase } from "@/test/factories";
import {
  addGuest,
  adminAddPlayer,
  confirmEntry,
  duplicateGame,
  joinGame,
  removeEntry,
  removeUserFromUpcomingGames,
  setGameLocked,
  updateGame,
} from "./service";

const entriesOf = (gameId: string) =>
  db
    .select()
    .from(participation)
    .where(eq(participation.gameId, gameId))
    .orderBy(asc(participation.createdAt));

const statusOf = async (gameId: string, userId: string) =>
  (await entriesOf(gameId)).find((e) => e.userId === userId && e.guestName === null)?.status;

beforeEach(resetDatabase);

describe("joinGame", () => {
  it("confirms players until the game is full, then waitlists", async () => {
    const g = await createGame({ maxPlayers: 2 });
    const [a, b, c] = await Promise.all([createUser(), createUser(), createUser()]);

    expect(await joinGame(a, g.id)).toBe("confirmed");
    expect(await joinGame(b, g.id)).toBe("confirmed");
    expect(await joinGame(c, g.id)).toBe("waitlisted");
  });

  it("refuses a second sign-up from the same player", async () => {
    const g = await createGame();
    const a = await createUser();
    await joinGame(a, g.id);
    await expect(joinGame(a, g.id)).rejects.toThrow("Tu es déjà inscrit.");
  });

  it("refuses sign-ups on a locked, cancelled or started game", async () => {
    const a = await createUser();
    const locked = await createGame({ locked: true });
    const cancelled = await createGame({ cancelledAt: new Date() });
    const started = await createGame({ startsAt: new Date(Date.now() - 1000) });

    await expect(joinGame(a, locked.id)).rejects.toThrow(/fermées/);
    await expect(joinGame(a, cancelled.id)).rejects.toThrow(/annulé/);
    await expect(joinGame(a, started.id)).rejects.toThrow(/commencé/);
  });

  it("gives the last spot to exactly one of two simultaneous players", async () => {
    const g = await createGame({ maxPlayers: 1 });
    const [a, b] = await Promise.all([createUser(), createUser()]);

    const statuses = await Promise.all([joinGame(a, g.id), joinGame(b, g.id)]);
    expect(statuses.sort()).toEqual(["confirmed", "waitlisted"]);
  });
});

describe("removeEntry", () => {
  it("moves the first in line into the game as pending confirmation", async () => {
    const g = await createGame({ maxPlayers: 1 });
    const [a, b, c] = await Promise.all([createUser(), createUser(), createUser()]);
    await joinGame(a, g.id);
    await joinGame(b, g.id);
    await joinGame(c, g.id);

    const [aEntry] = await entriesOf(g.id);
    await removeEntry(a, aEntry.id);

    expect(await statusOf(g.id, b.id)).toBe("pending_confirmation");
    expect(await statusOf(g.id, c.id)).toBe("waitlisted");
  });

  it("lets a player remove only their own spots", async () => {
    const g = await createGame();
    const [a, b] = await Promise.all([createUser(), createUser()]);
    await joinGame(a, g.id);
    const [aEntry] = await entriesOf(g.id);

    await expect(removeEntry(b, aEntry.id)).rejects.toThrow(/ne peux pas retirer/);
  });

  it("lets an admin remove anyone", async () => {
    const g = await createGame();
    const [a, admin] = await Promise.all([createUser(), createAdmin()]);
    await joinGame(a, g.id);
    const [aEntry] = await entriesOf(g.id);

    await removeEntry(admin, aEntry.id);
    expect(await entriesOf(g.id)).toHaveLength(0);
  });
});

describe("confirmEntry", () => {
  it("lets the promoted player confirm, but not someone else", async () => {
    const g = await createGame({ maxPlayers: 1 });
    const [a, b, other] = await Promise.all([createUser(), createUser(), createUser()]);
    await joinGame(a, g.id);
    await joinGame(b, g.id);
    const [aEntry, bEntry] = await entriesOf(g.id);
    await removeEntry(a, aEntry.id);

    await expect(confirmEntry(other, bEntry.id)).rejects.toThrow(/ne peux pas confirmer/);
    await confirmEntry(b, bEntry.id);
    expect(await statusOf(g.id, b.id)).toBe("confirmed");
  });

  it("lets an admin confirm for a player", async () => {
    const g = await createGame({ maxPlayers: 1 });
    const [a, b, admin] = await Promise.all([createUser(), createUser(), createAdmin()]);
    await joinGame(a, g.id);
    await joinGame(b, g.id);
    const [aEntry, bEntry] = await entriesOf(g.id);
    await removeEntry(admin, aEntry.id);

    await confirmEntry(admin, bEntry.id);
    expect(await statusOf(g.id, b.id)).toBe("confirmed");
  });
});

describe("addGuest", () => {
  it("counts guests toward the player limit", async () => {
    const g = await createGame({ maxPlayers: 2 });
    const [a, b] = await Promise.all([createUser(), createUser()]);
    await joinGame(a, g.id);

    expect(await addGuest(a, g.id, "Karim")).toBe("confirmed");
    expect(await joinGame(b, g.id)).toBe("waitlisted");
  });

  it("limits a player to 2 guests", async () => {
    const g = await createGame({ maxPlayers: 10 });
    const a = await createUser();
    await addGuest(a, g.id, "Karim");
    await addGuest(a, g.id, "Yanis");
    await expect(addGuest(a, g.id, "Sami")).rejects.toThrow(/plus de 2 invités/);
  });

  it("requires a name", async () => {
    const g = await createGame();
    const a = await createUser();
    await expect(addGuest(a, g.id, "  ")).rejects.toThrow(/nom/);
  });
});

describe("admin actions", () => {
  it("adminAddPlayer works on a locked game and is admin-only", async () => {
    const g = await createGame({ locked: true });
    const [a, admin] = await Promise.all([createUser(), createAdmin()]);

    await expect(adminAddPlayer(a, g.id, a.id)).rejects.toThrow(/administrateurs/);
    expect(await adminAddPlayer(admin, g.id, a.id)).toBe("confirmed");
  });

  it("raising maxPlayers promotes the waiting list", async () => {
    const g = await createGame({ maxPlayers: 1 });
    const [a, b, admin] = await Promise.all([createUser(), createUser(), createAdmin()]);
    await joinGame(a, g.id);
    await joinGame(b, g.id);

    await updateGame(admin, g.id, { ...g, notes: g.notes ?? undefined, maxPlayers: 2 });
    expect(await statusOf(g.id, b.id)).toBe("pending_confirmation");
  });

  it("duplicateGame copies the game one week later without players", async () => {
    const g = await createGame();
    const [a, admin] = await Promise.all([createUser(), createAdmin()]);
    await joinGame(a, g.id);

    const copy = await duplicateGame(admin, g.id);
    expect(copy.startsAt.getTime() - g.startsAt.getTime()).toBe(7 * 24 * 60 * 60 * 1000);
    expect(await entriesOf(copy.id)).toHaveLength(0);
  });

  it("setGameLocked toggles the lock", async () => {
    const g = await createGame();
    const admin = await createAdmin();
    await setGameLocked(admin, g.id, true);
    const [reloaded] = await db.select().from(game).where(eq(game.id, g.id));
    expect(reloaded.locked).toBe(true);
  });

  it("removeUserFromUpcomingGames frees the spot and promotes", async () => {
    const g = await createGame({ maxPlayers: 1 });
    const [banned, b] = await Promise.all([createUser(), createUser()]);
    await joinGame(banned, g.id);
    await addGuest(banned, g.id, "Karim");
    await joinGame(b, g.id);

    await removeUserFromUpcomingGames(banned.id);
    const entries = await entriesOf(g.id);
    expect(entries).toHaveLength(1);
    expect(entries[0]).toMatchObject({ userId: b.id, status: "pending_confirmation" });
  });
});

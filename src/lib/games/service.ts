import { and, eq, gt, inArray, isNull } from "drizzle-orm";
import { z } from "zod";
import { db, type Tx } from "@/db";
import { game, participation, type Game, type Participation } from "@/db/schema";
import {
  GameError,
  MAX_GUESTS_PER_PLAYER,
  entriesToPromote,
  signUpClosedReason,
  statusForNewEntry,
} from "./rules";

export type Actor = { id: string; role?: string | null };

const isAdmin = (actor: Actor) => actor.role === "admin";

function requireAdmin(actor: Actor) {
  if (!isAdmin(actor)) throw new GameError("Action réservée aux administrateurs.");
}

/** Runs `fn` while holding a row lock on the game, so sign-ups never race. */
async function withLockedGame<T>(
  gameId: string,
  fn: (tx: Tx, game: Game, entries: Participation[]) => Promise<T>,
): Promise<T> {
  return db.transaction(async (tx) => {
    const [locked] = await tx.select().from(game).where(eq(game.id, gameId)).for("update");
    if (!locked) throw new GameError("Match introuvable.");
    const entries = await tx.select().from(participation).where(eq(participation.gameId, gameId));
    return fn(tx, locked, entries);
  });
}

async function promoteWaitlisted(tx: Tx, maxPlayers: number, entries: Participation[]) {
  const ids = entriesToPromote(maxPlayers, entries);
  if (ids.length === 0) return;
  await tx
    .update(participation)
    .set({ status: "pending_confirmation" })
    .where(inArray(participation.id, ids));
}

type NewEntry = { userId: string; guestName: string | null; addedById: string };

async function addEntry(gameId: string, entry: NewEntry, { byAdmin }: { byAdmin: boolean }) {
  return withLockedGame(gameId, async (tx, lockedGame, entries) => {
    if (!byAdmin) {
      const closedReason = signUpClosedReason(lockedGame);
      if (closedReason) throw new GameError(closedReason);
    }

    if (entry.guestName === null) {
      if (entries.some((e) => e.userId === entry.userId && e.guestName === null)) {
        throw new GameError(byAdmin ? "Ce joueur est déjà inscrit." : "Tu es déjà inscrit.");
      }
    } else if (!byAdmin) {
      const guests = entries.filter((e) => e.userId === entry.userId && e.guestName !== null);
      if (guests.length >= MAX_GUESTS_PER_PLAYER) {
        throw new GameError(`Tu ne peux pas ajouter plus de ${MAX_GUESTS_PER_PLAYER} invités.`);
      }
    }

    const status = statusForNewEntry(lockedGame.maxPlayers, entries);
    await tx.insert(participation).values({ ...entry, gameId, status });
    return status;
  });
}

export async function joinGame(actor: Actor, gameId: string) {
  return addEntry(
    gameId,
    { userId: actor.id, guestName: null, addedById: actor.id },
    { byAdmin: false },
  );
}

const guestNameSchema = z.string().trim().min(1, "Donne un nom à ton invité.").max(60);

export async function addGuest(actor: Actor, gameId: string, name: string) {
  const guestName = parse(guestNameSchema, name);
  return addEntry(
    gameId,
    { userId: actor.id, guestName, addedById: actor.id },
    { byAdmin: isAdmin(actor) },
  );
}

export async function adminAddPlayer(actor: Actor, gameId: string, userId: string) {
  requireAdmin(actor);
  return addEntry(gameId, { userId, guestName: null, addedById: actor.id }, { byAdmin: true });
}

async function findEntry(entryId: string) {
  const [entry] = await db.select().from(participation).where(eq(participation.id, entryId));
  if (!entry) throw new GameError("Inscription introuvable.");
  return entry;
}

/** Removes a spot: a player leaving, a player removing their guest, or an admin. */
export async function removeEntry(actor: Actor, entryId: string) {
  const { gameId } = await findEntry(entryId);
  await withLockedGame(gameId, async (tx, lockedGame, entries) => {
    const entry = entries.find((e) => e.id === entryId);
    if (!entry) throw new GameError("Inscription introuvable.");
    if (!isAdmin(actor)) {
      if (entry.userId !== actor.id) throw new GameError("Tu ne peux pas retirer ce joueur.");
      if (lockedGame.startsAt <= new Date()) throw new GameError("Ce match a déjà commencé.");
    }

    await tx.delete(participation).where(eq(participation.id, entryId));
    await promoteWaitlisted(
      tx,
      lockedGame.maxPlayers,
      entries.filter((e) => e.id !== entryId),
    );
  });
}

export async function confirmEntry(actor: Actor, entryId: string) {
  const entry = await findEntry(entryId);
  if (!isAdmin(actor) && entry.userId !== actor.id) {
    throw new GameError("Tu ne peux pas confirmer cette place.");
  }
  if (entry.status !== "pending_confirmation")
    throw new GameError("Cette place n'est pas à confirmer.");
  await db.update(participation).set({ status: "confirmed" }).where(eq(participation.id, entryId));
}

export const gameInputSchema = z.object({
  title: z.string().trim().min(1, "Le titre est obligatoire.").max(80),
  location: z.string().trim().min(1, "Le lieu est obligatoire.").max(120),
  startsAt: z.coerce.date({ error: "Date invalide." }),
  maxPlayers: z.coerce.number().int().min(2, "Au moins 2 joueurs.").max(60, "60 joueurs maximum."),
  notes: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform((notes) => notes || null),
});

export type GameInput = z.input<typeof gameInputSchema>;

function parse<T extends z.ZodType>(schema: T, input: unknown): z.output<T> {
  const result = schema.safeParse(input);
  if (!result.success) throw new GameError(result.error.issues[0].message);
  return result.data;
}

export async function createGame(actor: Actor, input: GameInput) {
  requireAdmin(actor);
  const [created] = await db
    .insert(game)
    .values({ ...parse(gameInputSchema, input), createdById: actor.id })
    .returning();
  return created;
}

export async function updateGame(actor: Actor, gameId: string, input: GameInput) {
  requireAdmin(actor);
  const values = parse(gameInputSchema, input);
  await withLockedGame(gameId, async (tx, _game, entries) => {
    await tx.update(game).set(values).where(eq(game.id, gameId));
    // A bigger game frees spots for the waiting list.
    await promoteWaitlisted(tx, values.maxPlayers, entries);
  });
}

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/** Copies a game one week later, without its players. */
export async function duplicateGame(actor: Actor, gameId: string) {
  requireAdmin(actor);
  const [source] = await db.select().from(game).where(eq(game.id, gameId));
  if (!source) throw new GameError("Match introuvable.");
  return createGame(actor, {
    title: source.title,
    location: source.location,
    startsAt: new Date(source.startsAt.getTime() + ONE_WEEK_MS),
    maxPlayers: source.maxPlayers,
    notes: source.notes ?? undefined,
  });
}

export async function setGameLocked(actor: Actor, gameId: string, locked: boolean) {
  requireAdmin(actor);
  await db.update(game).set({ locked }).where(eq(game.id, gameId));
}

export async function cancelGame(actor: Actor, gameId: string) {
  requireAdmin(actor);
  await db.update(game).set({ cancelledAt: new Date() }).where(eq(game.id, gameId));
}

/** Frees a banned player's spots (and their guests') in upcoming games. */
export async function removeUserFromUpcomingGames(userId: string) {
  const games = await db
    .selectDistinct({ id: participation.gameId })
    .from(participation)
    .innerJoin(game, eq(game.id, participation.gameId))
    .where(
      and(
        eq(participation.userId, userId),
        gt(game.startsAt, new Date()),
        isNull(game.cancelledAt),
      ),
    );

  for (const { id } of games) {
    await withLockedGame(id, async (tx, lockedGame, entries) => {
      await tx
        .delete(participation)
        .where(and(eq(participation.gameId, id), eq(participation.userId, userId)));
      await promoteWaitlisted(
        tx,
        lockedGame.maxPlayers,
        entries.filter((e) => e.userId !== userId),
      );
    });
  }
}

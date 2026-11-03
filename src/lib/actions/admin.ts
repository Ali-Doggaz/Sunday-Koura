"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { fromLocalInput } from "@/lib/dates";
import { env } from "@/lib/env";
import { GameError } from "@/lib/games/rules";
import {
  adminAddPlayer,
  cancelGame,
  createGame,
  duplicateGame,
  removeUserFromUpcomingGames,
  setGameLocked,
  updateGame,
  type GameInput,
} from "@/lib/games/service";
import { requireAdmin } from "@/lib/session";
import { run, type ActionResult } from "./run";

function gameInputFrom(form: FormData): GameInput {
  return {
    title: String(form.get("title") ?? ""),
    location: String(form.get("location") ?? ""),
    startsAt: fromLocalInput(String(form.get("startsAt") ?? ""), env.APP_TIMEZONE),
    maxPlayers: String(form.get("maxPlayers") ?? ""),
    notes: String(form.get("notes") ?? ""),
  };
}

export async function createGameAction(_prev: ActionResult, form: FormData): Promise<ActionResult> {
  const admin = await requireAdmin();
  let gameId: string;
  try {
    gameId = (await createGame(admin, gameInputFrom(form))).id;
  } catch (error) {
    if (error instanceof GameError) return { error: error.message };
    throw error;
  }
  redirect(`/admin/matchs/${gameId}`);
}

export async function updateGameAction(
  gameId: string,
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  return run(await requireAdmin(), (admin) => updateGame(admin, gameId, gameInputFrom(form)));
}

export async function duplicateGameAction(gameId: string): Promise<ActionResult> {
  const copy = await duplicateGame(await requireAdmin(), gameId);
  redirect(`/admin/matchs/${copy.id}`);
}

export async function setGameLockedAction(gameId: string, locked: boolean): Promise<ActionResult> {
  return run(await requireAdmin(), (admin) => setGameLocked(admin, gameId, locked));
}

export async function cancelGameAction(gameId: string): Promise<ActionResult> {
  return run(await requireAdmin(), (admin) => cancelGame(admin, gameId));
}

export async function adminAddPlayerAction(
  gameId: string,
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const userId = String(form.get("userId") ?? "");
  if (!userId) return { error: "Choisis un joueur." };
  return run(await requireAdmin(), (admin) => adminAddPlayer(admin, gameId, userId));
}

export async function banUserAction(
  userId: string,
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  return run(await requireAdmin(), async (admin) => {
    if (userId === admin.id) throw new GameError("Tu ne peux pas te bannir toi-même.");
    const banReason = String(form.get("reason") ?? "").trim() || undefined;
    await auth.api.banUser({ body: { userId, banReason }, headers: await headers() });
    await removeUserFromUpcomingGames(userId);
  });
}

export async function unbanUserAction(userId: string): Promise<ActionResult> {
  return run(await requireAdmin(), async () => {
    await auth.api.unbanUser({ body: { userId }, headers: await headers() });
  });
}

export async function setRoleAction(userId: string, role: "admin" | "user"): Promise<ActionResult> {
  return run(await requireAdmin(), async (admin) => {
    if (userId === admin.id) throw new GameError("Tu ne peux pas changer ton propre rôle.");
    await auth.api.setRole({ body: { userId, role }, headers: await headers() });
  });
}

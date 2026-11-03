"use server";

import { addGuest, confirmEntry, joinGame, removeEntry } from "@/lib/games/service";
import { requireViewer } from "@/lib/session";
import { run, type ActionResult } from "./run";

const gamePath = (gameId: string) => `/matchs/${gameId}`;

export async function joinGameAction(gameId: string): Promise<ActionResult> {
  return run(await requireViewer(gamePath(gameId)), (viewer) => joinGame(viewer, gameId));
}

export async function addGuestAction(
  gameId: string,
  _prev: ActionResult,
  form: FormData,
): Promise<ActionResult> {
  const name = String(form.get("guestName") ?? "");
  return run(await requireViewer(gamePath(gameId)), (viewer) => addGuest(viewer, gameId, name));
}

export async function removeEntryAction(entryId: string): Promise<ActionResult> {
  return run(await requireViewer(), (viewer) => removeEntry(viewer, entryId));
}

export async function confirmEntryAction(entryId: string): Promise<ActionResult> {
  return run(await requireViewer(), (viewer) => confirmEntry(viewer, entryId));
}

import "server-only";
import { refresh } from "next/cache";
import { GameError } from "@/lib/games/rules";
import type { Viewer } from "@/lib/session";

export type ActionResult = { error: string } | null;

/** Runs a mutation, turns rule errors into a message, and refreshes the page. */
export async function run(
  viewer: Viewer,
  mutation: (viewer: Viewer) => Promise<unknown>,
): Promise<ActionResult> {
  try {
    await mutation(viewer);
  } catch (error) {
    if (error instanceof GameError) return { error: error.message };
    throw error;
  }
  refresh();
  return null;
}

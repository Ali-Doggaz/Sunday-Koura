import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { auth } from "./auth";

export type Viewer = { id: string; name: string; image: string | null; role: string | null };

/** The signed-in user, or null for visitors. */
export async function getViewer(): Promise<Viewer | null> {
  // Pages that know the viewer also depend on the current time (upcoming games, kickoff).
  await connection();
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) return null;
  const { id, name, image, role } = session.user;
  return { id, name, image: image ?? null, role: role ?? null };
}

export async function requireViewer(next = "/"): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect(`/connexion?next=${encodeURIComponent(next)}`);
  return viewer;
}

export async function requireAdmin(): Promise<Viewer> {
  const viewer = await requireViewer("/admin");
  if (viewer.role !== "admin") redirect("/");
  return viewer;
}

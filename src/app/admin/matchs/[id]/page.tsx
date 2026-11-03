import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { ActionButton } from "@/components/action-button";
import { ActionForm } from "@/components/action-form";
import { AutoRefresh } from "@/components/auto-refresh";
import { Roster } from "@/components/games/roster";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  adminAddPlayerAction,
  cancelGameAction,
  duplicateGameAction,
  setGameLockedAction,
  updateGameAction,
} from "@/lib/actions/admin";
import { getGameDetail } from "@/lib/games/queries";
import { requireAdmin } from "@/lib/session";
import { listUsers } from "@/lib/users";
import { GameForm } from "../../game-form";

export default function AdminGamePage({ params }: PageProps<"/admin/matchs/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
      <AdminGame params={params} />
    </Suspense>
  );
}

async function AdminGame({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [game, users] = await Promise.all([getGameDetail(id), listUsers()]);
  if (!game) notFound();

  const signedUp = new Set(
    [...game.players, ...game.waitlist].filter((e) => !e.guestName).map((e) => e.userId),
  );
  const addable = users.filter((u) => !signedUp.has(u.id) && !u.banned);

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">{game.title}</h1>
        <Link href={`/matchs/${game.id}`} className="text-sm text-primary underline">
          Voir la page publique
        </Link>
      </div>

      {game.cancelledAt && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
          Ce match est annulé.
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {!game.cancelledAt && (
          <>
            <ActionButton
              variant="outline"
              action={setGameLockedAction.bind(null, game.id, !game.locked)}
            >
              {game.locked ? "Rouvrir les inscriptions" : "Fermer les inscriptions"}
            </ActionButton>
            <ActionButton
              variant="destructive"
              action={cancelGameAction.bind(null, game.id)}
              confirmMessage="Annuler ce match ?"
            >
              Annuler le match
            </ActionButton>
          </>
        )}
        <ActionButton variant="secondary" action={duplicateGameAction.bind(null, game.id)}>
          Dupliquer (semaine suivante)
        </ActionButton>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ajouter un joueur</CardTitle>
        </CardHeader>
        <CardContent>
          <ActionForm
            action={adminAddPlayerAction.bind(null, game.id)}
            submitLabel="Ajouter"
            className="flex flex-wrap gap-2"
          >
            <select
              name="userId"
              aria-label="Joueur à ajouter"
              className="h-8 flex-1 rounded-lg border bg-background px-2 text-sm"
              defaultValue=""
            >
              <option value="" disabled>
                Choisir un joueur…
              </option>
              {addable.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
          </ActionForm>
        </CardContent>
      </Card>

      <Roster game={game} viewer={admin} />

      <Card>
        <CardHeader>
          <CardTitle>Modifier le match</CardTitle>
        </CardHeader>
        <CardContent>
          <GameForm
            action={updateGameAction.bind(null, game.id)}
            submitLabel="Enregistrer"
            game={game}
          />
        </CardContent>
      </Card>
    </div>
  );
}

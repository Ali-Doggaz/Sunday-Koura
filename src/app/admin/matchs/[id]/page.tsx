import { ArrowLeft, Copy, Lock, LockOpen } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { ActionButton } from "@/components/action-button";
import { ActionForm } from "@/components/action-form";
import { AutoRefresh } from "@/components/auto-refresh";
import { Roster } from "@/components/games/roster";
import { buttonVariants } from "@/components/ui/button";
import {
  adminAddPlayerAction,
  cancelGameAction,
  duplicateGameAction,
  setGameLockedAction,
  updateGameAction,
} from "@/lib/actions/admin";
import { dateParts } from "@/lib/dates";
import { env } from "@/lib/env";
import { getGameDetail } from "@/lib/games/queries";
import { requireAdmin } from "@/lib/session";
import { listUsers } from "@/lib/users";
import { cn } from "@/lib/utils";
import { GameForm } from "../../game-form";

export default function AdminGamePage({ params }: PageProps<"/admin/matchs/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
      <AdminGame params={params} />
    </Suspense>
  );
}

const sectionTitle = "text-[13px] font-semibold tracking-[0.16em] text-muted-foreground uppercase";
const actionButton = "h-11 rounded-xl px-3.5";

async function AdminGame({ params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin();
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [game, users] = await Promise.all([getGameDetail(id), listUsers()]);
  if (!game) notFound();

  const date = dateParts(game.startsAt, env.APP_TIMEZONE);
  const signedUp = new Set(
    [...game.players, ...game.waitlist].filter((e) => !e.guestName).map((e) => e.userId),
  );
  const addable = users.filter((u) => !signedUp.has(u.id) && !u.banned);
  const pending = game.players.filter((e) => e.status === "pending_confirmation").length;
  const stats = [
    { label: "Confirmés", value: game.players.length - pending, highlight: false },
    { label: "À confirmer", value: pending, highlight: pending > 0 },
    { label: "En attente", value: game.waitlist.length, highlight: false },
  ];

  return (
    <div className="flex flex-col gap-6">
      <AutoRefresh />
      <div className="flex items-center gap-3">
        <Link
          href="/admin"
          aria-label="Retour à l'administration"
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-lg" }),
            "size-11 rounded-full",
          )}
        >
          <ArrowLeft aria-hidden />
        </Link>
        <span className={cn(sectionTitle, "flex-1")}>Gérer le match</span>
        <Link href={`/matchs/${game.id}`} className="text-sm text-primary hover:underline">
          Page publique
        </Link>
      </div>

      <section className="flex flex-col gap-1.5">
        <h1 className="font-display text-[30px] leading-tight font-bold tracking-[0.02em]">
          {date.weekday} {date.day} {date.month} · {date.time}
        </h1>
        <p className="text-sm text-muted-foreground">
          {game.title} · {game.location}
        </p>
      </section>

      {game.cancelledAt && (
        <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm">
          Ce match est annulé.
        </p>
      )}

      <section className="grid grid-cols-3 gap-2.5">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className={cn(
              "flex flex-col gap-1.5 rounded-[14px] border p-3.5",
              stat.highlight ? "border-primary/35 bg-primary/10" : "bg-card",
            )}
          >
            <span
              className={cn(
                "font-mono text-[26px] font-semibold",
                stat.highlight && "text-primary",
              )}
            >
              {stat.value}
            </span>
            <span className="text-xs text-muted-foreground">{stat.label}</span>
          </div>
        ))}
      </section>

      <section className="flex flex-wrap gap-2">
        {!game.cancelledAt && (
          <ActionButton
            variant="outline"
            className={actionButton}
            action={setGameLockedAction.bind(null, game.id, !game.locked)}
          >
            {game.locked ? <LockOpen aria-hidden /> : <Lock aria-hidden />}
            {game.locked ? "Rouvrir les inscriptions" : "Fermer les inscriptions"}
          </ActionButton>
        )}
        <ActionButton
          variant="outline"
          className={actionButton}
          action={duplicateGameAction.bind(null, game.id)}
        >
          <Copy aria-hidden />
          Dupliquer (semaine suivante)
        </ActionButton>
        {!game.cancelledAt && (
          <ActionButton
            variant="destructive"
            className={actionButton}
            action={cancelGameAction.bind(null, game.id)}
            confirmMessage="Annuler ce match ?"
          >
            Annuler le match
          </ActionButton>
        )}
      </section>

      <section className="flex flex-col gap-2">
        <label htmlFor="add-player" className={sectionTitle}>
          Ajouter un joueur
        </label>
        <ActionForm
          action={adminAddPlayerAction.bind(null, game.id)}
          submitLabel="Ajouter"
          className="flex gap-2"
        >
          <select
            id="add-player"
            name="userId"
            aria-label="Joueur à ajouter"
            className="h-11 min-w-0 flex-1 rounded-xl border bg-card px-3 text-[15px]"
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
      </section>

      <Roster game={game} viewer={admin} />

      <section className="flex flex-col gap-3 rounded-2xl border bg-card p-5">
        <h2 className={sectionTitle}>Modifier le match</h2>
        <GameForm
          action={updateGameAction.bind(null, game.id)}
          submitLabel="Enregistrer"
          game={game}
        />
      </section>
    </div>
  );
}

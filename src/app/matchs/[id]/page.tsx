import { ArrowLeft, Check, MapPin } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { ActionButton } from "@/components/action-button";
import { ActionForm } from "@/components/action-form";
import { AutoRefresh } from "@/components/auto-refresh";
import { CapacityBar } from "@/components/games/capacity-bar";
import { GameBadges } from "@/components/games/game-badges";
import { Roster } from "@/components/games/roster";
import { ShareButton } from "@/components/share-button";
import { buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  addGuestAction,
  confirmEntryAction,
  joinGameAction,
  removeEntryAction,
} from "@/lib/actions/games";
import { dateParts } from "@/lib/dates";
import { env } from "@/lib/env";
import { getGameDetail, type GameDetail } from "@/lib/games/queries";
import { MAX_GUESTS_PER_PLAYER, signUpClosedReason } from "@/lib/games/rules";
import { getViewer, type Viewer } from "@/lib/session";
import { cn } from "@/lib/utils";

export default function GamePage({ params }: PageProps<"/matchs/[id]">) {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
      <GameView params={params} />
    </Suspense>
  );
}

async function GameView({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success) notFound();
  const [viewer, game] = await Promise.all([getViewer(), getGameDetail(id)]);
  if (!game) notFound();
  const date = dateParts(game.startsAt, env.APP_TIMEZONE);
  const taken = game.players.length;
  const free = game.maxPlayers - taken;

  return (
    <div className="flex flex-col gap-6">
      <AutoRefresh />
      <div className="flex items-center justify-between">
        <Link
          href="/"
          aria-label="Retour aux matchs"
          className={cn(
            buttonVariants({ variant: "outline", size: "icon-lg" }),
            "size-11 rounded-full",
          )}
        >
          <ArrowLeft aria-hidden />
        </Link>
        <ShareButton title={`${game.title} · ${date.weekday} ${date.day} ${date.month}`} />
      </div>

      <section className="flex flex-col gap-2.5">
        <span className="font-mono text-sm tracking-wide text-primary uppercase">
          {date.weekday} · {date.time}
        </span>
        <h1 className="font-display text-[40px] leading-[1.05] font-bold tracking-[0.02em]">
          {date.day} {date.month}
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-semibold">{game.title}</p>
          <GameBadges game={game} />
        </div>
        <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden />
          {game.location}
        </p>
        {game.notes && (
          <p className="mt-1 rounded-xl border bg-card px-3.5 py-3 text-sm leading-relaxed whitespace-pre-line text-zinc-300">
            {game.notes}
          </p>
        )}
        {viewer?.role === "admin" && (
          <Link href={`/admin/matchs/${game.id}`} className="text-sm text-primary hover:underline">
            Gérer ce match
          </Link>
        )}
      </section>

      <section className="flex flex-col gap-3 border-t pt-5">
        <div className="flex items-end justify-between gap-3">
          <span className="font-mono text-[34px] leading-none font-semibold">
            {taken}
            <span className="text-zinc-600">/{game.maxPlayers}</span>
          </span>
          <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold">
            {free > 0
              ? `${free} place${free > 1 ? "s" : ""} libre${free > 1 ? "s" : ""}`
              : "Complet"}
            {game.waitlist.length > 0 && ` · ${game.waitlist.length} en attente`}
          </span>
        </div>
        <CapacityBar taken={taken} max={game.maxPlayers} />
      </section>

      <ViewerPanel game={game} viewer={viewer} />
      <Roster game={game} viewer={viewer} />
    </div>
  );
}

const primaryButton = "h-12 w-full rounded-xl text-[15px] font-bold";

function ViewerPanel({ game, viewer }: { game: GameDetail; viewer: Viewer | null }) {
  if (!viewer) {
    return (
      <Link
        href={`/connexion?next=/matchs/${game.id}`}
        className={buttonVariants({ className: primaryButton })}
      >
        Connecte-toi pour t&apos;inscrire
      </Link>
    );
  }

  const entries = [...game.players, ...game.waitlist];
  const own = entries.find((e) => e.userId === viewer.id && e.guestName === null);
  const guestCount = entries.filter((e) => e.userId === viewer.id && e.guestName !== null).length;
  const closedReason = signUpClosedReason(game);
  const pending = own?.status === "pending_confirmation";

  return (
    <section
      className={
        pending
          ? "flex flex-col gap-4 rounded-[18px] border border-primary/35 bg-primary/10 p-4"
          : "flex flex-col gap-4 rounded-[18px] border bg-card p-4"
      }
    >
      <OwnSpot game={game} entryId={own?.id} status={own?.status} closedReason={closedReason} />
      {!closedReason && guestCount < MAX_GUESTS_PER_PLAYER && (
        <ActionForm
          action={addGuestAction.bind(null, game.id)}
          submitLabel="Ajouter un invité"
          submitVariant="outline"
          className="flex flex-wrap gap-2 border-t pt-4"
        >
          <Input
            name="guestName"
            placeholder="Nom de ton invité"
            aria-label="Nom de ton invité"
            className="min-w-40 flex-1"
            maxLength={60}
            required
          />
        </ActionForm>
      )}
    </section>
  );
}

function OwnSpot({
  game,
  entryId,
  status,
  closedReason,
}: {
  game: GameDetail;
  entryId?: string;
  status?: string;
  closedReason: string | null;
}) {
  const started = game.startsAt <= new Date();

  if (!entryId) {
    if (closedReason) return <p className="text-sm text-muted-foreground">{closedReason}</p>;
    const full = game.players.length >= game.maxPlayers;
    return (
      <ActionButton
        size="lg"
        variant={full ? "outline" : "default"}
        className={primaryButton}
        action={joinGameAction.bind(null, game.id)}
      >
        {full ? "Rejoindre la liste d'attente" : "Je viens !"}
      </ActionButton>
    );
  }

  const leave = !started && (
    <ActionButton
      size="lg"
      variant="outline"
      className="h-12 flex-1 rounded-xl text-[15px]"
      action={removeEntryAction.bind(null, entryId)}
      confirmMessage="Tu es sûr de vouloir te retirer ?"
    >
      {status === "waitlisted" ? "Quitter la liste d'attente" : "Je me retire"}
    </ActionButton>
  );

  if (status === "pending_confirmation") {
    return (
      <div className="flex flex-col gap-3.5">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-semibold tracking-[0.14em] text-primary uppercase">
            Place libérée
          </span>
          <p className="text-[17px] leading-snug font-semibold">
            Une place s&apos;est libérée pour toi ! Confirme ta présence.
          </p>
        </div>
        <div className="flex gap-2.5">
          <ActionButton
            size="lg"
            className="h-12 flex-1 rounded-xl text-[15px] font-bold"
            action={confirmEntryAction.bind(null, entryId)}
          >
            Confirmer ma place
          </ActionButton>
          {leave}
        </div>
      </div>
    );
  }

  const position = game.waitlist.findIndex((e) => e.id === entryId) + 1;
  return (
    <div className="flex flex-col gap-3">
      <p className="flex items-center gap-2 font-semibold">
        {status === "waitlisted" ? (
          `Tu es n°${position} sur la liste d'attente.`
        ) : (
          <>
            <Check className="size-4 text-success" strokeWidth={3} aria-hidden />
            Tu es inscrit
          </>
        )}
      </p>
      {leave && <div className="flex">{leave}</div>}
    </div>
  );
}

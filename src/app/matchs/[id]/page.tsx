import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { z } from "zod";
import { ActionButton } from "@/components/action-button";
import { ActionForm } from "@/components/action-form";
import { AutoRefresh } from "@/components/auto-refresh";
import { GameBadges } from "@/components/games/game-badges";
import { Roster } from "@/components/games/roster";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  addGuestAction,
  confirmEntryAction,
  joinGameAction,
  removeEntryAction,
} from "@/lib/actions/games";
import { formatGameDate } from "@/lib/dates";
import { env } from "@/lib/env";
import { getGameDetail, type GameDetail } from "@/lib/games/queries";
import { MAX_GUESTS_PER_PLAYER, signUpClosedReason } from "@/lib/games/rules";
import { getViewer, type Viewer } from "@/lib/session";

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
  const taken = game.players.length;

  return (
    <div className="space-y-6">
      <AutoRefresh />
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2 text-xl">
            {game.title}
            <GameBadges game={game} taken={taken} />
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm">
          <p>{formatGameDate(game.startsAt, env.APP_TIMEZONE)}</p>
          <p>{game.location}</p>
          {game.notes && <p className="whitespace-pre-line text-muted-foreground">{game.notes}</p>}
          {viewer?.role === "admin" && (
            <Link href={`/admin/matchs/${game.id}`} className="text-primary underline">
              Gérer ce match
            </Link>
          )}
        </CardContent>
      </Card>

      <ViewerPanel game={game} viewer={viewer} />
      <Roster game={game} viewer={viewer} />
    </div>
  );
}

function ViewerPanel({ game, viewer }: { game: GameDetail; viewer: Viewer | null }) {
  if (!viewer) {
    return (
      <Link
        href={`/connexion?next=/matchs/${game.id}`}
        className={buttonVariants({ size: "lg", className: "w-full" })}
      >
        Connecte-toi pour t&apos;inscrire
      </Link>
    );
  }

  const closedReason = signUpClosedReason(game);
  const own = [...game.players, ...game.waitlist].find(
    (e) => e.userId === viewer.id && e.guestName === null,
  );
  const guestCount = [...game.players, ...game.waitlist].filter(
    (e) => e.userId === viewer.id && e.guestName !== null,
  ).length;

  return (
    <div className="space-y-3 rounded-lg border bg-background p-4">
      <OwnSpot game={game} entryId={own?.id} status={own?.status} closedReason={closedReason} />
      {!closedReason && guestCount < MAX_GUESTS_PER_PLAYER && (
        <ActionForm
          action={addGuestAction.bind(null, game.id)}
          submitLabel="Ajouter un invité"
          className="flex flex-wrap gap-2"
        >
          <Input
            name="guestName"
            placeholder="Nom de ton invité"
            aria-label="Nom de ton invité"
            className="flex-1"
            maxLength={60}
            required
          />
        </ActionForm>
      )}
    </div>
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
      <ActionButton size="lg" className="w-full" action={joinGameAction.bind(null, game.id)}>
        {full ? "Rejoindre la liste d'attente" : "Je viens !"}
      </ActionButton>
    );
  }

  const leave = !started && (
    <ActionButton
      variant="outline"
      action={removeEntryAction.bind(null, entryId)}
      confirmMessage="Tu es sûr de vouloir te retirer ?"
    >
      {status === "waitlisted" ? "Quitter la liste d'attente" : "Je me retire"}
    </ActionButton>
  );

  if (status === "pending_confirmation") {
    return (
      <div className="space-y-2">
        <p className="font-medium">Une place s&apos;est libérée pour toi ! Confirme ta présence.</p>
        <div className="flex flex-wrap gap-2">
          <ActionButton action={confirmEntryAction.bind(null, entryId)}>
            Confirmer ma place
          </ActionButton>
          {leave}
        </div>
      </div>
    );
  }

  const position = game.waitlist.findIndex((e) => e.id === entryId) + 1;
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="font-medium">
        {status === "waitlisted"
          ? `Tu es n°${position} sur la liste d'attente.`
          : "Tu es inscrit ✅"}
      </p>
      {leave}
    </div>
  );
}

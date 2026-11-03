import Link from "next/link";
import { Suspense } from "react";
import { StatusBadge } from "@/components/games/game-badges";
import { formatGameDate } from "@/lib/dates";
import { env } from "@/lib/env";
import { listGamesForUser } from "@/lib/games/queries";
import { requireViewer } from "@/lib/session";

export default function MyGamesPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Mes matchs</h1>
      <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
        <MyGames />
      </Suspense>
    </div>
  );
}

async function MyGames() {
  const viewer = await requireViewer("/moi");
  const rows = await listGamesForUser(viewer.id);

  if (rows.length === 0) {
    return <p className="text-muted-foreground">Tu ne t&apos;es encore inscrit à aucun match.</p>;
  }

  return (
    <ul className="divide-y rounded-lg border bg-background">
      {rows.map(({ game, status }) => (
        <li key={game.id}>
          <Link
            href={`/matchs/${game.id}`}
            className="flex flex-wrap items-center gap-2 px-3 py-3 text-sm hover:bg-muted"
          >
            <span className="font-medium">{game.title}</span>
            <span className="text-muted-foreground">
              {formatGameDate(game.startsAt, env.APP_TIMEZONE)}
            </span>
            <span className="ml-auto">
              {game.cancelledAt ? "Annulé" : <StatusBadge status={status} />}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

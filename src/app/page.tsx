import { Suspense } from "react";
import { GameCard } from "@/components/games/game-card";
import { listUpcomingGames } from "@/lib/games/queries";
import { getViewer } from "@/lib/session";

export default function HomePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Prochains matchs</h1>
      <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
        <UpcomingGames />
      </Suspense>
    </div>
  );
}

async function UpcomingGames() {
  const viewer = await getViewer();
  const games = await listUpcomingGames(viewer?.id);
  const toConfirm = games.filter((g) => g.viewerStatus === "pending_confirmation");

  if (games.length === 0) {
    return <p className="text-muted-foreground">Aucun match prévu pour le moment.</p>;
  }

  return (
    <>
      {toConfirm.length > 0 && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
          Une place s&apos;est libérée pour toi ! Ouvre le match pour confirmer ta présence.
        </p>
      )}
      {games.map((game) => (
        <GameCard key={game.id} game={game} href={`/matchs/${game.id}`} />
      ))}
    </>
  );
}

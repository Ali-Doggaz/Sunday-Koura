import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { FeaturedGameCard, GameCard } from "@/components/games/game-card";
import { listUpcomingGames } from "@/lib/games/queries";
import { getViewer } from "@/lib/session";

export default function HomePage() {
  return (
    <div className="flex flex-col gap-5">
      <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
        <UpcomingGames />
      </Suspense>
    </div>
  );
}

async function UpcomingGames() {
  const viewer = await getViewer();
  const games = await listUpcomingGames(viewer?.id);
  const toConfirm = games.find((g) => g.viewerStatus === "pending_confirmation");
  const [next, ...later] = games;

  return (
    <>
      {toConfirm && (
        <Link
          href={`/matchs/${toConfirm.id}`}
          className="flex items-center gap-3 rounded-[14px] border border-primary/35 bg-primary/10 px-4 py-3.5"
        >
          <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
          <span className="flex-1 text-sm leading-snug">
            Une place s&apos;est libérée pour toi !{" "}
            <strong className="font-semibold">Confirme ta présence.</strong>
          </span>
          <ChevronRight className="size-5 text-primary" aria-hidden />
        </Link>
      )}

      <div className="flex items-baseline justify-between">
        <h1 className="text-[13px] font-semibold tracking-[0.16em] text-muted-foreground uppercase">
          Prochains matchs
        </h1>
        {games.length > 0 && (
          <span className="text-[13px] text-muted-foreground">{games.length} à venir</span>
        )}
      </div>

      {next ? (
        <>
          <FeaturedGameCard game={next} href={`/matchs/${next.id}`} />
          {later.map((game) => (
            <GameCard key={game.id} game={game} href={`/matchs/${game.id}`} />
          ))}
        </>
      ) : (
        <p className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          Aucun match prévu pour le moment.
        </p>
      )}
    </>
  );
}

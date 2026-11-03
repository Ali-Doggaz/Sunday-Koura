import Link from "next/link";
import { Suspense } from "react";
import { GameCard } from "@/components/games/game-card";
import { buttonVariants } from "@/components/ui/button";
import { listRecentGames, listUpcomingGames } from "@/lib/games/queries";
import { requireAdmin } from "@/lib/session";

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-semibold">Administration</h1>
        <div className="flex gap-2">
          <Link href="/admin/joueurs" className={buttonVariants({ variant: "outline" })}>
            Joueurs
          </Link>
          <Link href="/admin/matchs/nouveau" className={buttonVariants()}>
            Nouveau match
          </Link>
        </div>
      </div>
      <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
        <AdminGames />
      </Suspense>
    </div>
  );
}

async function AdminGames() {
  await requireAdmin();
  const [upcoming, recent] = await Promise.all([listUpcomingGames(), listRecentGames()]);

  return (
    <>
      <section className="space-y-3">
        <h2 className="font-semibold">À venir</h2>
        {upcoming.length === 0 && <p className="text-sm text-muted-foreground">Aucun match.</p>}
        {upcoming.map((game) => (
          <GameCard key={game.id} game={game} href={`/admin/matchs/${game.id}`} />
        ))}
      </section>
      {recent.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-semibold">Passés</h2>
          {recent.map((game) => (
            <GameCard key={game.id} game={game} href={`/admin/matchs/${game.id}`} />
          ))}
        </section>
      )}
    </>
  );
}

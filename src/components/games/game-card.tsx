import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatGameDate } from "@/lib/dates";
import { env } from "@/lib/env";
import type { GameSummary } from "@/lib/games/queries";
import { GameBadges, StatusBadge } from "./game-badges";

export function GameCard({ game, href }: { game: GameSummary; href: string }) {
  return (
    <Link href={href} className="block transition-opacity hover:opacity-80">
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            {game.title}
            <GameBadges game={game} taken={game.taken} />
            {game.viewerStatus && <StatusBadge status={game.viewerStatus} />}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-1 text-sm text-muted-foreground">
          <p>{formatGameDate(game.startsAt, env.APP_TIMEZONE)}</p>
          <p>{game.location}</p>
          <p className="font-medium text-foreground">
            {game.taken}/{game.maxPlayers} joueurs
            {game.waitlisted > 0 && ` · ${game.waitlisted} en attente`}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

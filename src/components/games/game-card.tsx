import { MapPin } from "lucide-react";
import Link from "next/link";
import { dateParts } from "@/lib/dates";
import { env } from "@/lib/env";
import type { GameSummary } from "@/lib/games/queries";
import { CapacityBar } from "./capacity-bar";
import { GameBadges, StatusBadge } from "./game-badges";

/** The next game, shown big with its fill bar. */
export function FeaturedGameCard({ game, href }: { game: GameSummary; href: string }) {
  const date = dateParts(game.startsAt, env.APP_TIMEZONE);

  return (
    <Link
      href={href}
      className="flex flex-col gap-5 rounded-[20px] border bg-gradient-to-b from-[#17171a] to-card p-5 transition-colors hover:border-zinc-600"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="font-display text-[26px] leading-none font-bold tracking-[0.04em]">
            {date.weekdayShort} {date.day.padStart(2, "0")} {date.monthShort}
          </span>
          <span className="font-mono text-[15px] text-primary">{date.time}</span>
        </div>
        <div className="flex flex-wrap justify-end gap-1.5">
          <GameBadges game={game} taken={game.taken} />
          {game.viewerStatus && <StatusBadge status={game.viewerStatus} />}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-lg font-semibold">{game.title}</span>
        <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="size-3.5" aria-hidden />
          {game.location}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        <CapacityBar taken={game.taken} max={game.maxPlayers} />
        <div className="flex justify-between text-[13px]">
          <span>
            <span className="font-mono font-semibold">
              {game.taken}/{game.maxPlayers}
            </span>{" "}
            <span className="text-muted-foreground">joueurs</span>
          </span>
          {game.waitlisted > 0 && (
            <span className="text-muted-foreground">{game.waitlisted} en attente</span>
          )}
        </div>
      </div>
    </Link>
  );
}

/** Later games, one compact row each. */
export function GameCard({ game, href }: { game: GameSummary; href: string }) {
  const date = dateParts(game.startsAt, env.APP_TIMEZONE);
  const full = game.taken >= game.maxPlayers;

  return (
    <Link
      href={href}
      className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:border-zinc-600"
    >
      <div className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl border bg-secondary">
        <span className="text-[11px] font-semibold tracking-[0.1em] text-muted-foreground">
          {date.monthShort}
        </span>
        <span className="font-display text-[22px] leading-none font-bold">{date.day}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="truncate font-semibold">{game.title}</span>
        <span className="truncate text-[13px] text-muted-foreground">
          {date.time} · {game.location}
        </span>
        {game.viewerStatus && (
          <span className="mt-1">
            <StatusBadge status={game.viewerStatus} />
          </span>
        )}
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="font-mono text-sm font-semibold">
          {game.taken}/{game.maxPlayers}
        </span>
        {game.cancelledAt ? (
          <span className="text-xs text-destructive">Annulé</span>
        ) : (
          <span className={full ? "text-xs text-muted-foreground" : "text-xs text-primary"}>
            {full ? "Complet" : "Ouvert"}
          </span>
        )}
      </div>
    </Link>
  );
}

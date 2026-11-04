import { Check, X } from "lucide-react";
import { ActionButton } from "@/components/action-button";
import { confirmEntryAction, removeEntryAction } from "@/lib/actions/games";
import type { GameDetail, GameEntry } from "@/lib/games/queries";
import type { Viewer } from "@/lib/session";
import { cn } from "@/lib/utils";

const sectionTitle = "text-[13px] font-semibold tracking-[0.16em] text-muted-foreground uppercase";

export function Roster({ game, viewer }: { game: GameDetail; viewer: Viewer | null }) {
  return (
    <div className="flex flex-col gap-7">
      <section className="flex flex-col gap-3">
        <h2 className={sectionTitle}>
          Joueurs ({game.players.length}/{game.maxPlayers})
        </h2>
        {game.players.length === 0 ? (
          <p className="text-sm text-muted-foreground">Personne pour l&apos;instant.</p>
        ) : (
          <ol className="overflow-hidden rounded-2xl border bg-card">
            {game.players.map((entry, index) => (
              <PlayerRow key={entry.id} entry={entry} position={index + 1} viewer={viewer} />
            ))}
          </ol>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className={sectionTitle}>Liste d&apos;attente ({game.waitlist.length})</h2>
        {game.waitlist.length === 0 ? (
          <p className="text-sm text-muted-foreground">Personne en attente.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {game.waitlist.map((entry, index) => (
              <li
                key={entry.id}
                data-testid="entry"
                className="flex items-center gap-3 rounded-xl border border-dashed px-3.5 py-2"
              >
                <span className="font-mono text-[13px] font-semibold text-muted-foreground">
                  #{index + 1}
                </span>
                <EntryName entry={entry} />
                <EntryActions entry={entry} viewer={viewer} />
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}

function PlayerRow({
  entry,
  position,
  viewer,
}: {
  entry: GameEntry;
  position: number;
  viewer: Viewer | null;
}) {
  const pending = entry.status === "pending_confirmation";
  const name = entry.guestName ?? entry.userName;

  return (
    <li
      data-testid="entry"
      className="flex items-center gap-3 border-b px-3.5 py-2.5 last:border-b-0"
    >
      <span className="w-5 font-mono text-xs text-zinc-500">{position}</span>
      <span
        aria-hidden
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-bold",
          pending ? "bg-primary text-primary-foreground" : "bg-secondary",
        )}
      >
        {initials(name)}
      </span>
      <EntryName entry={entry} />
      {pending && (
        <span className="rounded-full bg-primary/15 px-2 py-1 text-[11px] font-semibold text-primary">
          À confirmer
        </span>
      )}
      <EntryActions entry={entry} viewer={viewer} />
    </li>
  );
}

function EntryName({ entry }: { entry: GameEntry }) {
  return (
    <span className="flex min-w-0 flex-1 flex-col">
      <span className="truncate font-medium">{entry.guestName ?? entry.userName}</span>
      {entry.guestName && (
        <span className="text-xs text-muted-foreground">invité de {entry.userName}</span>
      )}
    </span>
  );
}

function EntryActions({ entry, viewer }: { entry: GameEntry; viewer: Viewer | null }) {
  const isAdmin = viewer?.role === "admin";
  const isOwner = viewer?.id === entry.userId;
  // Players manage their own spot from the panel above; here they manage their guests.
  const canRemove = isAdmin || (isOwner && entry.guestName !== null);
  const canConfirm =
    entry.status === "pending_confirmation" && (isAdmin || (isOwner && entry.guestName !== null));
  const name = entry.guestName ?? entry.userName;

  if (!canRemove && !canConfirm) return null;
  return (
    <span className="flex gap-1.5">
      {canConfirm && (
        <ActionButton
          size="icon-lg"
          className="size-11 rounded-[10px]"
          aria-label={`Confirmer ${name}`}
          action={confirmEntryAction.bind(null, entry.id)}
        >
          <Check aria-hidden />
        </ActionButton>
      )}
      {canRemove && (
        <ActionButton
          size="icon-lg"
          variant="outline"
          className="size-11 rounded-[10px] text-muted-foreground"
          aria-label={`Retirer ${name}`}
          action={removeEntryAction.bind(null, entry.id)}
          confirmMessage={`Retirer ${name} du match ?`}
        >
          <X aria-hidden />
        </ActionButton>
      )}
    </span>
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

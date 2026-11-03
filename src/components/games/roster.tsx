import { ActionButton } from "@/components/action-button";
import { confirmEntryAction, removeEntryAction } from "@/lib/actions/games";
import type { GameDetail, GameEntry } from "@/lib/games/queries";
import type { Viewer } from "@/lib/session";
import { StatusBadge } from "./game-badges";

export function Roster({ game, viewer }: { game: GameDetail; viewer: Viewer | null }) {
  return (
    <div className="space-y-6">
      <section className="space-y-2">
        <h2 className="font-semibold">
          Joueurs ({game.players.length}/{game.maxPlayers})
        </h2>
        <EntryList entries={game.players} viewer={viewer} empty="Personne pour l'instant." />
      </section>
      <section className="space-y-2">
        <h2 className="font-semibold">Liste d&apos;attente ({game.waitlist.length})</h2>
        <EntryList entries={game.waitlist} viewer={viewer} empty="Personne en attente." />
      </section>
    </div>
  );
}

function EntryList({
  entries,
  viewer,
  empty,
}: {
  entries: GameEntry[];
  viewer: Viewer | null;
  empty: string;
}) {
  if (entries.length === 0) return <p className="text-sm text-muted-foreground">{empty}</p>;

  return (
    <ol className="divide-y rounded-lg border bg-background">
      {entries.map((entry, index) => (
        <EntryRow key={entry.id} entry={entry} position={index + 1} viewer={viewer} />
      ))}
    </ol>
  );
}

function EntryRow({
  entry,
  position,
  viewer,
}: {
  entry: GameEntry;
  position: number;
  viewer: Viewer | null;
}) {
  const isAdmin = viewer?.role === "admin";
  const isOwner = viewer?.id === entry.userId;
  // Players manage their own spot from the panel above; here they manage their guests.
  const canRemove = isAdmin || (isOwner && entry.guestName !== null);
  const canConfirm =
    entry.status === "pending_confirmation" && (isAdmin || (isOwner && entry.guestName !== null));
  const name = entry.guestName ?? entry.userName;

  return (
    <li className="flex flex-wrap items-center gap-2 px-3 py-2 text-sm" data-testid="entry">
      <span className="w-6 text-muted-foreground">{position}.</span>
      <span className="font-medium">{name}</span>
      {entry.guestName && (
        <span className="text-muted-foreground">(invité de {entry.userName})</span>
      )}
      {entry.status === "pending_confirmation" && <StatusBadge status={entry.status} />}
      <span className="ml-auto flex gap-1">
        {canConfirm && (
          <ActionButton size="xs" action={confirmEntryAction.bind(null, entry.id)}>
            Confirmer
          </ActionButton>
        )}
        {canRemove && (
          <ActionButton
            size="xs"
            variant="destructive"
            action={removeEntryAction.bind(null, entry.id)}
            confirmMessage={`Retirer ${name} du match ?`}
          >
            Retirer
          </ActionButton>
        )}
      </span>
    </li>
  );
}

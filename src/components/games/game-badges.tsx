import { Check } from "lucide-react";
import type { Game, ParticipationStatus } from "@/db/schema";
import { cn } from "@/lib/utils";

export const STATUS_LABELS: Record<ParticipationStatus, string> = {
  confirmed: "Inscrit",
  pending_confirmation: "À confirmer",
  waitlisted: "Liste d'attente",
};

const chip = "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold";

/** `taken` is omitted where the page already says the game is full. */
export function GameBadges({ game, taken }: { game: Game; taken?: number }) {
  if (game.cancelledAt) {
    return <span className={cn(chip, "bg-destructive/15 text-destructive")}>Annulé</span>;
  }
  return (
    <>
      {game.locked && <span className={cn(chip, "border")}>Inscriptions fermées</span>}
      {taken !== undefined && taken >= game.maxPlayers && (
        <span className={cn(chip, "bg-secondary")}>Complet</span>
      )}
    </>
  );
}

export function StatusBadge({ status }: { status: ParticipationStatus }) {
  return (
    <span
      className={cn(
        chip,
        status === "confirmed" && "bg-success/15 text-success",
        status === "pending_confirmation" && "bg-primary/15 text-primary",
        status === "waitlisted" && "bg-secondary text-muted-foreground",
      )}
    >
      {status === "confirmed" && <Check className="size-3" strokeWidth={3} aria-hidden />}
      {STATUS_LABELS[status]}
    </span>
  );
}

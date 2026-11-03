import { Badge } from "@/components/ui/badge";
import type { Game, ParticipationStatus } from "@/db/schema";

export const STATUS_LABELS: Record<ParticipationStatus, string> = {
  confirmed: "Inscrit",
  pending_confirmation: "À confirmer",
  waitlisted: "Liste d'attente",
};

export function GameBadges({ game, taken }: { game: Game; taken: number }) {
  if (game.cancelledAt) return <Badge variant="destructive">Annulé</Badge>;
  return (
    <>
      {game.locked && <Badge variant="outline">Inscriptions fermées</Badge>}
      {taken >= game.maxPlayers && <Badge variant="secondary">Complet</Badge>}
    </>
  );
}

export function StatusBadge({ status }: { status: ParticipationStatus }) {
  return (
    <Badge variant={status === "pending_confirmation" ? "destructive" : "default"}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}

import { ActionForm } from "@/components/action-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import type { Game } from "@/db/schema";
import type { ActionResult } from "@/lib/actions/run";
import { toLocalInput } from "@/lib/dates";
import { env } from "@/lib/env";

type Props = {
  action: (prev: ActionResult, form: FormData) => Promise<ActionResult>;
  submitLabel: string;
  game?: Game;
};

export function GameForm({ action, submitLabel, game }: Props) {
  return (
    <ActionForm action={action} submitLabel={submitLabel}>
      <Field label="Titre" htmlFor="title">
        <Input id="title" name="title" defaultValue={game?.title ?? "Foot du dimanche"} required />
      </Field>
      <Field label="Lieu" htmlFor="location">
        <Input id="location" name="location" defaultValue={game?.location} required />
      </Field>
      <Field label={`Date et heure (${env.APP_TIMEZONE})`} htmlFor="startsAt">
        <Input
          id="startsAt"
          name="startsAt"
          type="datetime-local"
          defaultValue={game && toLocalInput(game.startsAt, env.APP_TIMEZONE)}
          required
        />
      </Field>
      <Field label="Nombre de joueurs" htmlFor="maxPlayers">
        <Input
          id="maxPlayers"
          name="maxPlayers"
          type="number"
          min={2}
          max={60}
          defaultValue={game?.maxPlayers ?? 14}
          required
        />
      </Field>
      <Field label="Notes (optionnel)" htmlFor="notes">
        <Textarea id="notes" name="notes" defaultValue={game?.notes ?? ""} maxLength={500} />
      </Field>
    </ActionForm>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
    </div>
  );
}

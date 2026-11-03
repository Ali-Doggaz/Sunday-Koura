import { Suspense } from "react";
import { createGameAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/session";
import { GameForm } from "../../game-form";

export default function NewGamePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Nouveau match</h1>
      <Suspense fallback={null}>
        <NewGameForm />
      </Suspense>
    </div>
  );
}

async function NewGameForm() {
  await requireAdmin();
  return <GameForm action={createGameAction} submitLabel="Créer le match" />;
}

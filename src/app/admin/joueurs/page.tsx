import { Suspense } from "react";
import { ActionButton } from "@/components/action-button";
import { ActionForm } from "@/components/action-form";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { banUserAction, setRoleAction, unbanUserAction } from "@/lib/actions/admin";
import { requireAdmin } from "@/lib/session";
import { listUsers, type UserRow } from "@/lib/users";

export default function PlayersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Joueurs</h1>
      <Suspense fallback={<p className="text-muted-foreground">Chargement…</p>}>
        <Players />
      </Suspense>
    </div>
  );
}

async function Players() {
  const admin = await requireAdmin();
  const users = await listUsers();

  return (
    <ul className="divide-y rounded-lg border bg-background">
      {users.map((user) => (
        <PlayerRow key={user.id} user={user} isSelf={user.id === admin.id} />
      ))}
    </ul>
  );
}

function PlayerRow({ user, isSelf }: { user: UserRow; isSelf: boolean }) {
  return (
    <li className="space-y-2 px-3 py-3 text-sm" data-testid="player">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-medium">{user.name}</span>
        <span className="text-muted-foreground">{user.email}</span>
        {user.role === "admin" && <Badge>Admin</Badge>}
        {user.banned && <Badge variant="destructive">Banni</Badge>}
        <span className="ml-auto text-muted-foreground">{user.games} matchs</span>
      </div>
      {user.banned && user.banReason && (
        <p className="text-muted-foreground">Raison : {user.banReason}</p>
      )}
      {!isSelf && (
        <div className="flex flex-wrap gap-2">
          {user.banned ? (
            <ActionButton size="sm" variant="outline" action={unbanUserAction.bind(null, user.id)}>
              Débannir
            </ActionButton>
          ) : (
            <ActionForm
              action={banUserAction.bind(null, user.id)}
              submitLabel="Bannir"
              className="flex flex-1 flex-wrap gap-2"
            >
              <Input
                name="reason"
                placeholder="Raison (optionnel)"
                aria-label={`Raison du bannissement de ${user.name}`}
                className="flex-1"
              />
            </ActionForm>
          )}
          <ActionButton
            size="sm"
            variant="secondary"
            action={setRoleAction.bind(null, user.id, user.role === "admin" ? "user" : "admin")}
          >
            {user.role === "admin" ? "Retirer admin" : "Rendre admin"}
          </ActionButton>
        </div>
      )}
    </li>
  );
}

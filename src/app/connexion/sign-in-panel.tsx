"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";

type Props = {
  googleEnabled: boolean;
  next: string;
  testLogin: boolean;
};

export function SignInPanel({ googleEnabled, next, testLogin }: Props) {
  const [error, setError] = useState<string | null>(null);

  async function signInWithGoogle() {
    const { error } = await authClient.signIn.social({ provider: "google", callbackURL: next });
    if (error) setError(error.message ?? "Connexion impossible.");
  }

  return (
    <div className="flex flex-col gap-3">
      {googleEnabled && (
        <Button size="lg" variant="outline" onClick={signInWithGoogle}>
          Continuer avec Google
        </Button>
      )}
      {!googleEnabled && !testLogin && (
        <p className="text-sm text-muted-foreground">Aucun moyen de connexion configuré.</p>
      )}
      {testLogin && <TestSignIn next={next} onError={setError} />}
      {error && <p className="text-sm text-destructive">{error}</p>}
    </div>
  );
}

/** Test-only sign-in by name, enabled with E2E_TEST_LOGIN. Creates the account if needed. */
function TestSignIn({ next, onError }: { next: string; onError: (error: string) => void }) {
  return (
    <form
      className="flex flex-col gap-2 rounded-lg border border-dashed p-3"
      onSubmit={async (event) => {
        event.preventDefault();
        const name = String(new FormData(event.currentTarget).get("name")).trim();
        const email = `${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}@test.local`;
        const password = "test-password-123";
        const signIn = await authClient.signIn.email({ email, password });
        // Unknown account: create it. Any other error (e.g. banned) is shown as is.
        const result =
          signIn.error?.code === "INVALID_EMAIL_OR_PASSWORD"
            ? await authClient.signUp.email({ email, password, name })
            : signIn;
        if (result.error) return onError(result.error.message ?? "Connexion impossible.");
        window.location.assign(next);
      }}
    >
      <p className="text-xs text-muted-foreground">Connexion de test</p>
      <Input name="name" placeholder="Nom" aria-label="Nom de test" required />
      <Button type="submit" variant="secondary">
        Connexion de test
      </Button>
    </form>
  );
}

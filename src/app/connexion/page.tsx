import { Suspense } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { enabledProviders } from "@/lib/auth";
import { env } from "@/lib/env";
import { SignInPanel } from "./sign-in-panel";

export default function SignInPage({ searchParams }: PageProps<"/connexion">) {
  return (
    <Card className="mx-auto max-w-sm">
      <CardHeader>
        <CardTitle>Connexion</CardTitle>
        <CardDescription>Connecte-toi pour t&apos;inscrire aux matchs.</CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={null}>
          <Panel searchParams={searchParams} />
        </Suspense>
      </CardContent>
    </Card>
  );
}

async function Panel({ searchParams }: Pick<PageProps<"/connexion">, "searchParams">) {
  const { next } = await searchParams;
  // Only same-site paths, so the link can't redirect elsewhere.
  const safeNext = typeof next === "string" && /^\/(?!\/)/.test(next) ? next : "/";
  return (
    <SignInPanel providers={enabledProviders} next={safeNext} testLogin={env.E2E_TEST_LOGIN} />
  );
}

import Image from "next/image";
import { Suspense } from "react";
import { googleEnabled } from "@/lib/auth";
import { env } from "@/lib/env";
import { SignInPanel } from "./sign-in-panel";

export default function SignInPage({ searchParams }: PageProps<"/connexion">) {
  return (
    <div className="flex min-h-[65dvh] items-center justify-center">
      <section className="flex w-full max-w-md flex-col items-center gap-7 rounded-3xl border bg-gradient-to-b from-[#17171a] to-card px-6 py-10 text-center sm:px-10">
        <Image src="/logo.svg" alt="" width={88} height={88} className="rounded-2xl border" />
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-bold tracking-[0.06em]">Connexion</h1>
          <p className="text-[15px] text-muted-foreground">
            Connecte-toi pour t&apos;inscrire aux matchs.
          </p>
        </div>
        <Suspense fallback={null}>
          <Panel searchParams={searchParams} />
        </Suspense>
      </section>
    </div>
  );
}

async function Panel({ searchParams }: Pick<PageProps<"/connexion">, "searchParams">) {
  const { next } = await searchParams;
  // Only same-site paths, so the link can't redirect elsewhere.
  const safeNext = typeof next === "string" && /^\/(?!\/)/.test(next) ? next : "/";
  return (
    <SignInPanel googleEnabled={googleEnabled} next={safeNext} testLogin={env.E2E_TEST_LOGIN} />
  );
}

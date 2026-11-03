import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { SignOutButton } from "@/components/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import { getViewer } from "@/lib/session";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Sunday Koura",
  description: "Inscriptions aux matchs de foot du dimanche.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${geist.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-muted/40">
        <header className="border-b bg-background">
          <div className="mx-auto flex h-14 max-w-2xl items-center justify-between gap-2 px-4">
            <Link
              href="/"
              className="flex shrink-0 items-center gap-2 font-semibold tracking-tight whitespace-nowrap"
            >
              <Image
                src="/logo.svg"
                alt=""
                width={32}
                height={32}
                className="rounded-md"
                priority
              />
              Sunday Koura
            </Link>
            <Suspense fallback={null}>
              <ViewerMenu />
            </Suspense>
          </div>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
        <footer className="mx-auto w-full max-w-2xl px-4 py-6 text-xs text-muted-foreground">
          <Link href="/confidentialite" className="hover:underline">
            Confidentialité
          </Link>
          {" · "}
          <Link href="/suppression-donnees" className="hover:underline">
            Suppression des données
          </Link>
        </footer>
      </body>
    </html>
  );
}

async function ViewerMenu() {
  const viewer = await getViewer();
  const link = buttonVariants({ variant: "ghost", size: "sm" });

  if (!viewer) {
    return (
      <Link href="/connexion" className={link}>
        Connexion
      </Link>
    );
  }

  return (
    <nav className="flex items-center">
      <Link href="/moi" className={link}>
        Mes matchs
      </Link>
      {viewer.role === "admin" && (
        <Link href="/admin" className={link}>
          Admin
        </Link>
      )}
      <SignOutButton />
    </nav>
  );
}

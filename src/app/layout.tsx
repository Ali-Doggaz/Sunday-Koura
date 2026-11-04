import type { Metadata, Viewport } from "next";
import { Cinzel, Geist, Geist_Mono } from "next/font/google";
import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { BottomNav } from "@/components/bottom-nav";
import { SignOutButton } from "@/components/sign-out-button";
import { buttonVariants } from "@/components/ui/button";
import { getViewer } from "@/lib/session";
import "./globals.css";

const geist = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
const cinzel = Cinzel({ variable: "--font-cinzel", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: "Sunday Koura",
  description: "Inscriptions aux matchs de foot du dimanche.",
};

export const viewport: Viewport = { themeColor: "#09090b" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="fr"
      className={`dark ${geist.variable} ${geistMono.variable} ${cinzel.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <header className="mx-auto flex w-full max-w-2xl items-center justify-between gap-2 px-4 pt-5 pb-3">
          <Link href="/" className="flex shrink-0 items-center gap-3">
            <Image
              src="/logo.svg"
              alt=""
              width={40}
              height={40}
              className="rounded-[10px] border"
              priority
            />
            <span className="font-display text-[17px] font-bold tracking-[0.14em] whitespace-nowrap">
              SUNDAY KOURA
            </span>
          </Link>
          <Suspense fallback={null}>
            <ViewerMenu />
          </Suspense>
        </header>
        <main className="mx-auto w-full max-w-2xl flex-1 px-4 pt-2 pb-8">{children}</main>
        <footer className="mx-auto w-full max-w-2xl px-4 pt-2 pb-24 text-xs text-muted-foreground">
          <Link href="/confidentialite" className="hover:text-foreground">
            Confidentialité
          </Link>
          {" · "}
          <Link href="/suppression-donnees" className="hover:text-foreground">
            Suppression des données
          </Link>
        </footer>
      </body>
    </html>
  );
}

async function ViewerMenu() {
  const viewer = await getViewer();

  if (!viewer) {
    return (
      <Link href="/connexion" className={buttonVariants({ variant: "outline" })}>
        Connexion
      </Link>
    );
  }

  return (
    <>
      <SignOutButton />
      <BottomNav isAdmin={viewer.role === "admin"} />
    </>
  );
}

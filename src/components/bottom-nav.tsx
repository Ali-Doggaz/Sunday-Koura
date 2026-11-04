"use client";

import { CalendarDays, Shield, Trophy } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/** Thumb-friendly tab bar for signed-in players. */
export function BottomNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const tabs = [
    {
      href: "/",
      label: "Matchs",
      icon: Trophy,
      active: pathname === "/" || pathname.startsWith("/matchs"),
    },
    { href: "/moi", label: "Mes matchs", icon: CalendarDays, active: pathname === "/moi" },
    ...(isAdmin
      ? [{ href: "/admin", label: "Admin", icon: Shield, active: pathname.startsWith("/admin") }]
      : []),
  ];

  return (
    <nav
      aria-label="Navigation principale"
      className="fixed inset-x-0 bottom-0 z-10 border-t bg-background/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
    >
      <div
        className="mx-auto grid max-w-2xl px-3"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map(({ href, label, icon: Icon, active }) => (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 text-[11px] font-medium",
              active ? "text-primary" : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="size-5" aria-hidden />
            {label}
          </Link>
        ))}
      </div>
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen,
  Brain,
  Home,
  ListChecks,
  Network,
  PlusCircle,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/mode-toggle";
import { Separator } from "@/components/ui/separator";

// Desktop nav — all items
const desktopNav = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/learn", label: "Learn", icon: Brain },
  { href: "/word-family", label: "W.Family", icon: Network },
  { href: "/vocabulary", label: "My Words", icon: ListChecks },
  { href: "/add", label: "Add", icon: PlusCircle },
  { href: "/settings", label: "Settings", icon: Settings },
];

// Mobile nav — no Add (accessed from My Words page)
const mobileNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/learn", label: "Learn", icon: Brain },
  { href: "/word-family", label: "W.Family", icon: Network },
  { href: "/vocabulary", label: "My Words", icon: ListChecks },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-linear-to-b from-sky-50 via-white to-white text-foreground dark:from-slate-950 dark:via-slate-950 dark:to-black">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-white/80 backdrop-blur dark:bg-slate-950/80">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-600">
              <BookOpen className="h-5 w-5" />
            </span>
            Học Tiếng Anh
          </Link>
          <div className="hidden items-center gap-2 md:flex">
            {desktopNav.map((item) => {
              const Icon = item.icon;
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition",
                    active
                      ? "bg-sky-500 text-white shadow"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
            <Separator orientation="vertical" className="mx-1 h-6" />
            <ModeToggle />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 pb-24 pt-6 md:pb-10">
        {children}
      </main>
      {/* Mobile bottom nav — 5 items, no Add */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 border-t border-border/60 bg-white/90 backdrop-blur dark:bg-slate-950/90 md:hidden">
        <div className="grid grid-cols-5 gap-1 px-2 py-2">
          {mobileNav.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-2 text-xs font-medium transition",
                  active
                    ? "bg-sky-500 text-white"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

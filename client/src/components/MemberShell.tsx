import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  BookHeart,
  BookOpenText,
  ChevronRight,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings2,
  Sparkles,
  X,
} from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";
import { Link, useLocation } from "wouter";

const navigation = [
  { href: "/", label: "Home", icon: LayoutDashboard },
  { href: "/teachings", label: "Teachings", icon: BookOpenText },
  { href: "/courses", label: "Courses", icon: BookHeart },
  { href: "/apps", label: "Susan’s Apps", icon: Sparkles },
];

function Navigation({ close }: { close?: () => void }) {
  const { user } = useAuth();
  const [location] = useLocation();
  const items = user?.isAdmin
    ? [...navigation, { href: "/admin", label: "Administration", icon: Settings2 }]
    : navigation;

  return (
    <nav aria-label="Member navigation" className="space-y-1.5">
      {items.map(item => {
        const active = item.href === "/" ? location === "/" : location.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={close}
            className={cn(
              "group flex items-center justify-between rounded-2xl px-4 py-3 text-sm transition-[background-color,color,transform] duration-200",
              active
                ? "bg-[#c9a84c] text-[#0e1634] shadow-[0_10px_30px_rgba(201,168,76,0.18)]"
                : "text-[#d7d9e3] hover:translate-x-0.5 hover:bg-white/7 hover:text-white"
            )}
          >
            <span className="flex items-center gap-3">
              <Icon className="size-[18px]" />
              {item.label}
            </span>
            <ChevronRight className={cn("size-4 transition-transform", active ? "opacity-70" : "opacity-0 group-hover:translate-x-0.5 group-hover:opacity-60")} />
          </Link>
        );
      })}
    </nav>
  );
}

export function MemberShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="sticky top-0 hidden h-screen flex-col overflow-hidden bg-[#0e1634] p-6 text-[#f5edd6] lg:flex">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_5%,rgba(201,168,76,0.16),transparent_28%),radial-gradient(circle_at_80%_85%,rgba(45,119,119,0.28),transparent_34%)]" />
        <Link href="/" className="relative flex items-center gap-3 px-2 py-2">
          <img src="https://susan-website-pull.b-cdn.net/2024/logo/sd-mandala-mark.svg" alt="" className="size-11 brightness-0 invert" />
          <span>
            <strong className="block text-sm font-medium tracking-[0.16em] uppercase">Susan Drury</strong>
            <span className="mt-0.5 block text-[10px] tracking-[0.2em] text-[#c9a84c] uppercase">Member sanctuary</span>
          </span>
        </Link>

        <div className="relative mt-10 flex-1">
          <p className="mb-4 px-4 text-[10px] font-semibold tracking-[0.24em] text-[#9da2b5] uppercase">Your journey</p>
          <Navigation />
        </div>

        <div className="relative rounded-2xl border border-white/10 bg-white/5 p-4">
          <p className="truncate text-sm text-white">{user?.name || "Member"}</p>
          <p className="mt-1 truncate text-xs text-[#aeb2c2]">{user?.email}</p>
          <div className="mt-3 flex items-center justify-between border-t border-white/10 pt-3">
            <span className="text-[10px] font-semibold tracking-[0.18em] text-[#c9a84c] uppercase">
              {user?.isAdmin ? "Administrator" : user?.membership?.tier ?? "Member"}
            </span>
            <button onClick={() => void logout()} className="rounded-lg p-1.5 text-[#aeb2c2] transition-colors hover:bg-white/10 hover:text-white" aria-label="Sign out">
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-18 items-center justify-between border-b border-border/70 bg-background/92 px-5 backdrop-blur-xl lg:hidden">
          <Link href="/" className="flex items-center gap-3">
            <img src="https://susan-website-pull.b-cdn.net/2024/logo/sd-mandala-mark.svg" alt="Susan Drury" className="size-9" />
            <span className="text-xs font-semibold tracking-[0.14em] uppercase">Member Sanctuary</span>
          </Link>
          <Button variant="ghost" size="icon" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
            <Menu className="size-5" />
          </Button>
        </header>

        {mobileOpen ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button className="absolute inset-0 bg-[#0e1634]/60 backdrop-blur-sm" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
            <aside className="absolute inset-y-0 right-0 flex w-[min(86vw,340px)] flex-col bg-[#0e1634] p-6 text-[#f5edd6] shadow-2xl">
              <div className="mb-10 flex items-center justify-between">
                <span className="text-xs font-semibold tracking-[0.16em] uppercase">Your sanctuary</span>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 hover:text-white" onClick={() => setMobileOpen(false)}>
                  <X className="size-5" />
                </Button>
              </div>
              <Navigation close={() => setMobileOpen(false)} />
              <div className="mt-auto border-t border-white/10 pt-5">
                <p className="text-sm text-white">{user?.name || "Member"}</p>
                <button onClick={() => void logout()} className="mt-4 flex items-center gap-2 text-sm text-[#c9a84c]">
                  <LogOut className="size-4" /> Sign out
                </button>
              </div>
            </aside>
          </div>
        ) : null}

        <div className="min-h-screen">{children}</div>
      </div>
    </div>
  );
}


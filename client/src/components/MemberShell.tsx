import { useAuth } from "@/_core/hooks/useAuth";
import { SUSAN_LOGO } from "@/lib/brandAssets";
import { cn } from "@/lib/utils";
import {
  BookHeart,
  BookOpenText,
  LayoutDashboard,
  LogOut,
  Settings2,
  Sparkles,
} from "lucide-react";
import type { ReactNode } from "react";
import { Link, useLocation } from "wouter";

const navigation = [
  { href: "/", label: "Home", mobileLabel: "Home", icon: LayoutDashboard },
  { href: "/teachings", label: "Teachings", mobileLabel: "Teachings", icon: BookOpenText },
  { href: "/courses", label: "Courses", mobileLabel: "Courses", icon: BookHeart },
  { href: "/apps", label: "Susan’s Apps", mobileLabel: "Apps", icon: Sparkles },
];

function Navigation({ mobile = false }: { mobile?: boolean }) {
  const { user } = useAuth();
  const [location] = useLocation();
  const qaFocusHref = import.meta.env.DEV ? new URLSearchParams(window.location.search).get("qa-focus") : null;
  const items = user?.isAdmin
    ? [...navigation, { href: "/admin", label: "Administration", mobileLabel: "Admin", icon: Settings2 }]
    : navigation;

  return (
    <nav
      aria-label="Member navigation"
      className={mobile ? "grid w-full" : "hidden items-center gap-1 lg:flex"}
      style={mobile ? { gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` } : undefined}
    >
      {items.map(item => {
        const active = item.href === "/" ? location === "/" : location.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              mobile
                ? "flex min-h-15 min-w-0 flex-col items-center justify-center gap-1 px-1 py-2 text-[9px] font-semibold tracking-[0.04em]"
                : "flex items-center gap-2 rounded-full px-4 py-2.5 text-sm transition-[background-color,color,transform] duration-200",
              active
                ? mobile
                  ? "text-[#2f7772]"
                  : "bg-[#f1e5c6] text-[#245f5c] shadow-[inset_0_0_0_1px_rgba(201,168,76,0.38)]"
                : "text-[#58636e] hover:bg-[#f5efe2] hover:text-[#245f5c]",
              "focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-2 focus-visible:outline-none",
              qaFocusHref === item.href && "ring-2 ring-[#c9a84c] ring-offset-2"
            )}
          >
            <Icon className={cn(mobile ? "size-[19px]" : "size-4", active && mobile ? "fill-[#c9a84c]/20" : "")} />
            <span className={mobile ? "truncate" : undefined}>{mobile ? item.mobileLabel : item.label}</span>
            {mobile && active ? <span className="absolute mt-13 h-0.5 w-7 rounded-full bg-[#c9a84c]" /> : null}
          </Link>
        );
      })}
    </nav>
  );
}

export function MemberShell({ children }: { children: ReactNode }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-[#e5dbc8] bg-[#fffdf8]/94 backdrop-blur-xl">
        <div className="mx-auto flex h-18 w-full max-w-[1440px] items-center justify-between gap-4 px-4 sm:px-6 lg:h-22 lg:px-10">
          <Link href="/" className="flex min-w-0 items-center gap-3 rounded-full focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-2 focus-visible:outline-none">
            <img
              src={SUSAN_LOGO.medium}
              srcSet={`${SUSAN_LOGO.small} 48w, ${SUSAN_LOGO.medium} 96w`}
              sizes="(min-width: 1024px) 52px, 46px"
              alt=""
              className="h-11 w-auto shrink-0 object-contain drop-shadow-[0_5px_12px_rgba(119,88,15,0.16)] lg:h-13"
            />
            <span className="min-w-0">
              <strong className="block truncate text-xs font-semibold tracking-[0.14em] text-[#243f4d] uppercase sm:text-sm">Susan Drury</strong>
              <span className="mt-0.5 hidden text-[9px] tracking-[0.19em] text-[#9b7726] uppercase sm:block">Member sanctuary</span>
            </span>
          </Link>

          <Navigation />

          <div className="flex items-center gap-2 lg:min-w-44 lg:justify-end">
            <div className="hidden min-w-0 text-right xl:block">
              <p className="max-w-36 truncate text-sm text-[#2d4450]">{user?.name || "Member"}</p>
              <p className="mt-0.5 text-[9px] font-bold tracking-[0.15em] text-[#9b7726] uppercase">
                {user?.isAdmin ? "Administrator" : user?.membership?.tier ?? "Member"}
              </p>
            </div>
            <button
              onClick={() => void logout()}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-[#ded3bf] bg-white text-[#607078] shadow-sm transition-colors hover:border-[#c9a84c] hover:text-[#2f7772] focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-2 focus-visible:outline-none"
              aria-label="Sign out"
            >
              <LogOut className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <div className="min-h-[calc(100vh-4.5rem)] lg:min-h-[calc(100vh-5.5rem)]">{children}</div>

      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#dfd3bd] bg-[#fffdf8]/96 px-2 pb-[max(0.4rem,env(safe-area-inset-bottom))] shadow-[0_-10px_35px_rgba(45,68,72,0.08)] backdrop-blur-xl lg:hidden">
        <Navigation mobile />
      </div>
    </div>
  );
}

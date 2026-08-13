import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Loader2, LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useLocation } from "wouter";

type ProtectedRouteProps = {
  children: ReactNode;
  requireAdmin?: boolean;
};

function FullPageLoader() {
  return (
    <div className="grid min-h-screen place-items-center bg-[#0e1634] text-[#f5edd6]">
      <div className="flex items-center gap-3 text-sm tracking-[0.16em] uppercase">
        <Loader2 className="size-5 animate-spin text-[#c9a84c]" />
        Entering your sanctuary
      </div>
    </div>
  );
}

export function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { user, loading, logout } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!loading && !user) setLocation("/login", { replace: true });
  }, [loading, setLocation, user]);

  if (loading) return <FullPageLoader />;
  if (!user) return null;

  if (requireAdmin && !user.isAdmin) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#faf7ef] px-6 text-[#172044]">
        <div className="max-w-md text-center">
          <LockKeyhole className="mx-auto mb-6 size-9 text-[#c9a84c]" />
          <p className="mb-3 text-xs font-semibold tracking-[0.22em] text-[#2d7777] uppercase">Private area</p>
          <h1 className="mb-4 font-serif text-4xl">Administrator access only</h1>
          <p className="mb-8 text-[#5c6174]">This area is reserved for Susan and authorized administrators.</p>
          <Button onClick={() => setLocation("/")}>Return to your dashboard</Button>
        </div>
      </div>
    );
  }

  if (!user.hasPortalAccess) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#0e1634] px-6 text-[#f5edd6]">
        <div className="max-w-xl rounded-[2rem] border border-[#c9a84c]/35 bg-white/5 p-8 text-center shadow-2xl backdrop-blur sm:p-12">
          <div className="mx-auto mb-7 grid size-16 place-items-center rounded-full border border-[#c9a84c]/60 text-2xl text-[#c9a84c]">✦</div>
          <p className="mb-3 text-xs font-semibold tracking-[0.22em] text-[#c9a84c] uppercase">Membership access</p>
          <h1 className="mb-5 font-serif text-4xl sm:text-5xl">Your account is here, but access is not active</h1>
          <p className="mx-auto mb-8 max-w-md leading-7 text-[#d6d8e2]">
            Your learning history is safe. Please contact Susan’s team if your membership should be active, or renew through SusanDrury.com.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="rounded-full bg-[#c9a84c] px-7 text-[#0e1634] hover:bg-[#ddc36f]">
              <a href="https://susandrury.com/membership">View membership options</a>
            </Button>
            <Button variant="outline" className="rounded-full border-[#c9a84c]/60 text-[#f5edd6]" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}


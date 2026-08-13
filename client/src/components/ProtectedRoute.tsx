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
    <div className="grid min-h-screen place-items-center bg-[#faf7ef] px-6 text-[#243f4d]">
      <div className="flex items-center gap-3 rounded-full border border-[#dfd4bf] bg-white px-6 py-3 text-xs font-semibold tracking-[0.14em] shadow-sm uppercase">
        <Loader2 className="size-5 animate-spin text-[#2f7772]" />
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
      <div className="grid min-h-screen place-items-center bg-[#faf7ef] px-6 text-[#243f4d]">
        <div className="max-w-md text-center">
          <LockKeyhole className="mx-auto mb-6 size-9 text-[#c9a84c]" />
          <p className="mb-3 text-xs font-semibold tracking-[0.22em] text-[#2f7772] uppercase">Private area</p>
          <h1 className="mb-4 font-serif text-4xl">Administrator access only</h1>
          <p className="mb-8 text-[#5c6870]">This area is reserved for Susan and authorized administrators.</p>
          <Button className="rounded-full bg-[#2f7772] px-6 text-white hover:bg-[#245f5c]" onClick={() => setLocation("/")}>Return to your dashboard</Button>
        </div>
      </div>
    );
  }

  if (!user.hasPortalAccess) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#f7f1e4] px-5 py-10 text-[#243f4d]">
        <div className="w-full max-w-xl rounded-[2rem] border border-[#ddcfad] bg-[#fffdf8] p-7 text-center shadow-[0_24px_70px_rgba(54,72,73,0.1)] sm:p-12">
          <div className="mx-auto mb-7 grid size-16 place-items-center rounded-full border border-[#d0b76f] bg-[#f4ead0] text-2xl text-[#9b7726]">✦</div>
          <p className="mb-3 text-xs font-semibold tracking-[0.22em] text-[#2f7772] uppercase">Membership access</p>
          <h1 className="mb-5 font-serif text-4xl sm:text-5xl">Your account is here, but access is not active</h1>
          <p className="mx-auto mb-8 max-w-md leading-7 text-[#64747a]">
            Your learning history is safe. Please contact Susan’s team if your membership should be active, or renew through SusanDrury.com.
          </p>
          <div className="flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild className="rounded-full bg-[#2f7772] px-7 text-white hover:bg-[#245f5c]">
              <a href="https://susandrury.com/membership">View membership options</a>
            </Button>
            <Button variant="outline" className="rounded-full border-[#c9a84c] bg-white text-[#445a61]" onClick={() => void logout()}>
              Sign out
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

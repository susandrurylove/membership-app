import { useAuth } from "@/_core/hooks/useAuth";
import { PortalHeroImage } from "@/components/PortalMedia";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SUSAN_LOGO } from "@/lib/brandAssets";
import { PORTAL_IMAGES } from "@/lib/portalImages";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Loader2, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

export default function Login() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const login = trpc.auth.login.useMutation({
    onSuccess: viewer => {
      utils.auth.me.setData(undefined, viewer);
      setLocation("/", { replace: true });
    },
  });
  const previewSignIn = trpc.auth.previewSignIn.useMutation({
    onSuccess: viewer => {
      utils.auth.me.setData(undefined, viewer);
      setLocation("/", { replace: true });
    },
  });

  useEffect(() => {
    if (!loading && user) setLocation("/", { replace: true });
  }, [loading, setLocation, user]);

  useEffect(() => {
    if (!import.meta.env.DEV || loading || user || previewSignIn.isPending) return;
    if (new URLSearchParams(window.location.search).get("qa-preview") === "1") {
      previewSignIn.mutate();
    }
  }, [loading, previewSignIn, user]);

  return (
    <main className="min-h-screen bg-[#faf7ef] text-[#243f4d]">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        <section className="brand-hero hidden p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
          <PortalHeroImage image={PORTAL_IMAGES.natureReflection} />
          <a href="https://susandrury.com" className="relative z-[2] flex items-center gap-4 rounded-full text-sm tracking-[0.16em] text-[#fdfaf5] uppercase focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:outline-none">
            <img src={SUSAN_LOGO.large} alt="Susan Drury" className="h-16 w-auto object-contain brightness-110 drop-shadow-[0_8px_18px_rgba(201,168,76,0.22)]" />
            <span>Susan Drury</span>
          </a>

          <div className="relative z-[2] max-w-2xl">
            <p className="brand-eyebrow">A private space for your practice</p>
            <div className="brand-gold-rule mt-5" />
            <h1 className="mt-7 max-w-xl font-serif text-5xl leading-[1.06] text-[#fdfaf5] xl:text-7xl">Come home to what matters.</h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-[#e8e4da]">
              Your teachings, courses, and transformational tools—gathered in one quiet, trusted place.
            </p>
          </div>

          <div className="relative z-[2] flex items-center gap-3 text-sm text-[#e8e4da]">
            <ShieldCheck className="size-5 text-[#ead79c]" />
            Private access for active members
          </div>
        </section>

        <section className="relative grid place-items-center overflow-hidden px-5 py-8 sm:px-10 sm:py-12 lg:px-14">
          <div className="pointer-events-none absolute -right-24 -top-28 size-64 rounded-full bg-[#f0dfad]/30 lg:hidden" />
          <div className="brand-panel relative w-full max-w-md rounded-[2rem] p-6 sm:p-9 lg:p-10">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <img src={SUSAN_LOGO.medium} alt="Susan Drury" className="h-12 w-auto object-contain drop-shadow-[0_6px_14px_rgba(119,88,15,0.16)]" />
              <span>
                <span className="block text-xs font-semibold tracking-[0.14em] uppercase">Susan Drury</span>
                <span className="mt-0.5 block text-[9px] tracking-[0.16em] text-[#77580f] uppercase">Member sanctuary</span>
              </span>
            </div>

            <p className="eyebrow">Member sanctuary</p>
            <div className="brand-gold-rule mt-4" />
            <h2 className="mt-5 font-serif text-4xl leading-tight text-[#1e234c] sm:text-5xl">Welcome back</h2>
            <p className="mt-4 leading-7 text-[#4f6368]">Sign in with the email and password connected to your membership.</p>

            <form
              className="mt-8 space-y-5"
              onSubmit={event => {
                event.preventDefault();
                login.mutate({ email, password });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} className="h-12 rounded-xl border-[#d9d0be] bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="current-password" required minLength={12} value={password} onChange={event => setPassword(event.target.value)} className="h-12 rounded-xl border-[#d9d0be] bg-white" />
              </div>

              {login.error ? (
                <p role="alert" className="rounded-xl border border-[#b45a4d]/25 bg-[#b45a4d]/10 px-4 py-3 text-sm text-[#823b32]">
                  {login.error.message}
                </p>
              ) : null}

              <Button type="submit" disabled={login.isPending} className="brand-button h-12 w-full text-xs font-bold tracking-[0.16em] uppercase hover:bg-[#205f60]">
                {login.isPending ? <Loader2 className="size-4 animate-spin" /> : <>Enter the portal <ArrowRight className="ml-2 size-4" /></>}
              </Button>
            </form>

            {import.meta.env.DEV ? (
              <Button variant="ghost" disabled={previewSignIn.isPending} className="mt-4 w-full text-xs text-[#526267]" onClick={() => previewSignIn.mutate()}>
                {previewSignIn.isPending ? <Loader2 className="size-4 animate-spin" /> : "Development preview sign-in"}
              </Button>
            ) : null}
            {previewSignIn.error ? <p role="alert" className="mt-2 text-center text-xs text-[#823b32]">{previewSignIn.error.message}</p> : null}

            <p className="mt-7 text-center text-sm leading-6 text-[#526267]">
              Need help accessing your membership? <a href="https://susandrury.com/contact" className="font-semibold text-[#2f7772] underline-offset-4 hover:underline">Contact Susan’s team</a>.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

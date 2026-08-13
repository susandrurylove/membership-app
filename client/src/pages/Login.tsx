import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

  return (
    <main className="min-h-screen bg-[#faf7ef] text-[#243f4d]">
      <div className="grid min-h-screen lg:grid-cols-[0.9fr_1.1fr]">
        <section className="relative hidden overflow-hidden border-r border-[#ddcfb0] bg-[#e8f0eb] p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div className="pointer-events-none absolute -right-28 top-24 size-96 rounded-full border-[58px] border-[#c9a84c]/25" />
          <div className="pointer-events-none absolute -bottom-36 -left-24 size-96 rounded-full bg-[#cfe2db]/70" />
          <a href="https://susandrury.com" className="relative flex items-center gap-3 text-sm tracking-[0.16em] uppercase">
            <span className="grid size-12 place-items-center rounded-full border border-[#d4bd82] bg-[#fffaf0]">
              <img src="https://susan-website-pull.b-cdn.net/2024/logo/sd-mandala-mark.svg" alt="Susan Drury" className="size-8" />
            </span>
            Susan Drury
          </a>

          <div className="relative max-w-2xl">
            <p className="mb-5 text-xs font-semibold tracking-[0.28em] text-[#77580f] uppercase">A private space for your practice</p>
            <h1 className="max-w-xl font-serif text-5xl leading-[1.06] text-[#243f4d] xl:text-7xl">Come home to what matters.</h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-[#586c70]">
              Your teachings, courses, and transformational tools—gathered in one quiet, trusted place.
            </p>
          </div>

          <div className="relative flex items-center gap-3 text-sm text-[#52676c]">
            <ShieldCheck className="size-5 text-[#2f7772]" />
            Private access for active members
          </div>
        </section>

        <section className="relative grid place-items-center overflow-hidden px-5 py-8 sm:px-10 sm:py-12 lg:px-14">
          <div className="pointer-events-none absolute -right-24 -top-28 size-64 rounded-full bg-[#f0dfad]/30 lg:hidden" />
          <div className="relative w-full max-w-md rounded-[2rem] border border-[#e0d5c0] bg-[#fffdf8]/94 p-6 shadow-[0_22px_70px_rgba(54,72,73,0.1)] sm:p-9 lg:border-0 lg:bg-transparent lg:p-0 lg:shadow-none">
            <div className="mb-8 flex items-center gap-3 lg:hidden">
              <span className="grid size-11 place-items-center rounded-full border border-[#d4bd82] bg-[#f8f0dc]">
                <img src="https://susan-website-pull.b-cdn.net/2024/logo/sd-mandala-mark.svg" alt="Susan Drury" className="size-7" />
              </span>
              <span>
                <span className="block text-xs font-semibold tracking-[0.14em] uppercase">Susan Drury</span>
                <span className="mt-0.5 block text-[9px] tracking-[0.16em] text-[#9b7726] uppercase">Member sanctuary</span>
              </span>
            </div>

            <p className="mb-3 text-xs font-semibold tracking-[0.24em] text-[#2f7772] uppercase">Member sanctuary</p>
            <h2 className="font-serif text-4xl leading-tight sm:text-5xl">Welcome back</h2>
            <p className="mt-4 leading-7 text-[#65757a]">Sign in with the email and password connected to your membership.</p>

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

              <Button type="submit" disabled={login.isPending} className="h-12 w-full rounded-full bg-[#2f7772] text-xs font-bold tracking-[0.16em] text-white uppercase hover:bg-[#245f5c]">
                {login.isPending ? <Loader2 className="size-4 animate-spin" /> : <>Enter the portal <ArrowRight className="ml-2 size-4" /></>}
              </Button>
            </form>

            {import.meta.env.DEV ? (
              <Button variant="ghost" disabled={previewSignIn.isPending} className="mt-4 w-full text-xs text-[#6c777b]" onClick={() => previewSignIn.mutate()}>
                {previewSignIn.isPending ? <Loader2 className="size-4 animate-spin" /> : "Development preview sign-in"}
              </Button>
            ) : null}
            {previewSignIn.error ? <p role="alert" className="mt-2 text-center text-xs text-[#823b32]">{previewSignIn.error.message}</p> : null}

            <p className="mt-7 text-center text-sm leading-6 text-[#6c777b]">
              Need help accessing your membership? <a href="https://susandrury.com/contact" className="font-semibold text-[#2f7772] underline-offset-4 hover:underline">Contact Susan’s team</a>.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

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
    <main className="min-h-screen bg-[#0e1634] text-[#f5edd6]">
      <div className="grid min-h-screen lg:grid-cols-[1.08fr_0.92fr]">
        <section className="relative hidden overflow-hidden border-r border-[#c9a84c]/25 p-12 lg:flex lg:flex-col lg:justify-between xl:p-16">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(201,168,76,0.2),transparent_34%),radial-gradient(circle_at_20%_80%,rgba(45,119,119,0.38),transparent_42%)]" />
          <a href="https://susandrury.com" className="relative flex items-center gap-3 text-sm tracking-[0.16em] uppercase">
            <img src="https://susan-website-pull.b-cdn.net/2024/logo/sd-mandala-mark.svg" alt="Susan Drury" className="size-10 brightness-0 invert" />
            Susan Drury
          </a>

          <div className="relative max-w-2xl">
            <p className="mb-6 text-xs font-semibold tracking-[0.28em] text-[#c9a84c] uppercase">A private space for your practice</p>
            <h1 className="max-w-xl font-serif text-6xl leading-[1.05] xl:text-7xl">Come home to what matters.</h1>
            <p className="mt-7 max-w-lg text-lg leading-8 text-[#d6d8e2]">
              Your teachings, courses, and transformational tools — gathered in one quiet, trusted place.
            </p>
          </div>

          <div className="relative flex items-center gap-3 text-sm text-[#d6d8e2]">
            <ShieldCheck className="size-5 text-[#c9a84c]" />
            Private access for active members
          </div>
        </section>

        <section className="grid place-items-center bg-[#faf7ef] px-6 py-12 text-[#172044] sm:px-10 lg:px-14">
          <div className="w-full max-w-md">
            <div className="mb-10 flex items-center gap-3 lg:hidden">
              <img src="https://susan-website-pull.b-cdn.net/2024/logo/sd-mandala-mark.svg" alt="Susan Drury" className="size-10" />
              <span className="text-sm tracking-[0.16em] uppercase">Susan Drury</span>
            </div>

            <p className="mb-3 text-xs font-semibold tracking-[0.24em] text-[#2d7777] uppercase">Member sanctuary</p>
            <h2 className="font-serif text-5xl leading-tight">Welcome back</h2>
            <p className="mt-4 leading-7 text-[#636879]">Sign in with the email and password connected to your membership.</p>

            <form
              className="mt-9 space-y-5"
              onSubmit={event => {
                event.preventDefault();
                login.mutate({ email, password });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={event => setEmail(event.target.value)} className="h-12 rounded-xl border-[#d9d2c2] bg-white" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" autoComplete="current-password" required minLength={12} value={password} onChange={event => setPassword(event.target.value)} className="h-12 rounded-xl border-[#d9d2c2] bg-white" />
              </div>

              {login.error ? (
                <p role="alert" className="rounded-xl border border-[#b45a4d]/25 bg-[#b45a4d]/10 px-4 py-3 text-sm text-[#823b32]">
                  {login.error.message}
                </p>
              ) : null}

              <Button type="submit" disabled={login.isPending} className="h-12 w-full rounded-full bg-[#c9a84c] text-xs font-bold tracking-[0.16em] text-[#0e1634] uppercase hover:bg-[#ddc36f]">
                {login.isPending ? <Loader2 className="size-4 animate-spin" /> : <>Enter the portal <ArrowRight className="ml-2 size-4" /></>}
              </Button>
            </form>

            {import.meta.env.DEV ? (
              <Button variant="ghost" disabled={previewSignIn.isPending} className="mt-4 w-full text-xs text-[#6c7181]" onClick={() => previewSignIn.mutate()}>
                {previewSignIn.isPending ? <Loader2 className="size-4 animate-spin" /> : "Development preview sign-in"}
              </Button>
            ) : null}
            {previewSignIn.error ? <p role="alert" className="mt-2 text-center text-xs text-[#823b32]">{previewSignIn.error.message}</p> : null}

            <p className="mt-8 text-center text-sm leading-6 text-[#6c7181]">
              Need help accessing your membership? <a href="https://susandrury.com/contact" className="font-semibold text-[#2d7777] underline-offset-4 hover:underline">Contact Susan’s team</a>.
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

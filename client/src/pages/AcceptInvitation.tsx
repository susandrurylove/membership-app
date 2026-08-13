import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useState } from "react";
import { useLocation } from "wouter";

export default function AcceptInvitation() {
  const [, setLocation] = useLocation();
  const token = new URLSearchParams(window.location.search).get("token") ?? "";
  const utils = trpc.useUtils();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");

  const invitation = trpc.auth.invitation.useQuery(
    { token },
    { enabled: token.length >= 32, retry: false }
  );
  const accept = trpc.auth.acceptInvitation.useMutation({
    onSuccess: viewer => {
      utils.auth.me.setData(undefined, viewer);
      setLocation("/", { replace: true });
    },
  });

  if (!token || (!invitation.isLoading && !invitation.data?.valid)) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f7f1e4] px-5 py-10 text-[#243f4d]">
        <div className="w-full max-w-lg rounded-[2rem] border border-[#ddcfad] bg-[#fffdf8] p-7 text-center shadow-[0_24px_70px_rgba(54,72,73,0.1)] sm:p-11">
          <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full border border-[#c9a84c]/60 bg-[#f4ead0] text-2xl text-[#77580f]">✦</div>
          <h1 className="font-serif text-4xl sm:text-5xl">This invitation is no longer available</h1>
          <p className="mx-auto mt-5 max-w-md leading-7 text-[#64747a]">It may have expired or already been used. Susan’s team can send a fresh invitation.</p>
          <Button asChild className="mt-8 rounded-full bg-[#2f7772] text-white hover:bg-[#245f5c]">
            <a href="https://susandrury.com/contact">Contact Susan’s team</a>
          </Button>
        </div>
      </main>
    );
  }

  return (
    <main className="grid min-h-screen place-items-center bg-[#faf7ef] px-5 py-10 text-[#243f4d]">
      <div className="w-full max-w-lg rounded-[2rem] border border-[#ded6c5] bg-[#fffdf8] p-6 shadow-[0_24px_80px_rgba(54,72,73,0.1)] sm:p-11">
        <div className="mb-8 flex items-center gap-3">
          <img src="https://susan-website-pull.b-cdn.net/2024/logo/sd-mandala-mark.svg" alt="Susan Drury" className="size-11" />
          <span className="text-sm tracking-[0.16em] uppercase">Member Sanctuary</span>
        </div>

        {invitation.isLoading ? (
          <div className="flex min-h-72 items-center justify-center gap-3 text-[#6c7181]">
            <Loader2 className="size-5 animate-spin text-[#c9a84c]" />
            Checking your invitation
          </div>
        ) : (
          <>
            <CheckCircle2 className="mb-5 size-8 text-[#2d7777]" />
            <p className="mb-3 text-xs font-semibold tracking-[0.22em] text-[#2d7777] uppercase">Your invitation is ready</p>
            <h1 className="font-serif text-4xl leading-tight">Welcome{invitation.data?.name ? `, ${invitation.data.name.split(" ")[0]}` : ""}</h1>
            <p className="mt-4 leading-7 text-[#656a7a]">Create a private password for <strong>{invitation.data?.email}</strong> to enter Susan’s membership portal.</p>

            <form
              className="mt-8 space-y-5"
              onSubmit={event => {
                event.preventDefault();
                if (password !== confirmation) return;
                accept.mutate({ token, password });
              }}
            >
              <div className="space-y-2">
                <Label htmlFor="new-password">Create password</Label>
                <Input id="new-password" type="password" autoComplete="new-password" required minLength={12} value={password} onChange={event => setPassword(event.target.value)} className="h-12 rounded-xl" />
                <p className="text-xs leading-5 text-[#777c8b]">Use at least 12 characters with uppercase, lowercase, and a number.</p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm password</Label>
                <Input id="confirm-password" type="password" autoComplete="new-password" required minLength={12} value={confirmation} onChange={event => setConfirmation(event.target.value)} className="h-12 rounded-xl" />
              </div>

              {confirmation && password !== confirmation ? <p className="text-sm text-[#9c493e]">The passwords do not match.</p> : null}
              {accept.error ? <p role="alert" className="rounded-xl bg-[#b45a4d]/10 px-4 py-3 text-sm text-[#823b32]">{accept.error.message}</p> : null}

              <Button type="submit" disabled={accept.isPending || password !== confirmation} className="h-12 w-full rounded-full bg-[#2f7772] text-xs font-bold tracking-[0.16em] text-white uppercase hover:bg-[#245f5c]">
                {accept.isPending ? <Loader2 className="size-4 animate-spin" /> : <>Create account <ArrowRight className="ml-2 size-4" /></>}
              </Button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}

import { QueryErrorState } from "@/components/QueryErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Heart, Leaf, Loader2, LockKeyhole, Sparkles } from "lucide-react";
import { useState } from "react";

const presentation = {
  elevate: { icon: Heart, color: "from-[#9e3f6d] to-[#612d63]" },
  enlightened_body: { icon: Leaf, color: "from-[#1f7371] to-[#174b59]" },
  tao: { icon: Sparkles, color: "from-[#a48132] to-[#5e4820]" },
};

export default function Apps() {
  const apps = trpc.member.apps.list.useQuery();
  const [launching, setLaunching] = useState<string | null>(null);
  const launch = trpc.member.apps.launch.useMutation({
    onMutate: input => setLaunching(input.appKey),
    onSettled: () => setLaunching(null),
    onSuccess: result => window.location.assign(result.launchUrl),
  });

  return (
    <main className="portal-page">
      <header className="max-w-4xl">
        <p className="eyebrow">Three doorways, one membership</p>
        <h1 className="mt-4 font-serif text-5xl leading-tight text-[#172044] sm:text-6xl">Susan’s Apps</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">Open Susan’s interactive experiences from one trusted place. A one-time member handoff keeps each launch private and connected to your active membership.</p>
      </header>

      <section className="mt-10">
        {apps.error ? (
          <QueryErrorState title="Your connected apps could not be loaded" onRetry={() => void apps.refetch()} />
        ) : apps.isLoading ? (
          <div className="grid gap-6 xl:grid-cols-3">{[0, 1, 2].map(item => <Skeleton key={item} className="h-[470px] rounded-[2rem]" />)}</div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-3">
            {apps.data?.map(app => {
              const { icon: Icon, color } = presentation[app.key];
              const isLaunching = launching === app.key;
              return (
                <article key={app.key} className="group overflow-hidden rounded-[2rem] border border-[#ddd5c5] bg-white shadow-[0_18px_50px_rgba(23,32,68,0.08)]">
                  <div className={`relative min-h-52 bg-gradient-to-br ${color} p-7 text-white`}>
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(255,255,255,0.3),transparent_22%)]" />
                    <div className="relative flex items-start justify-between">
                      <div className="grid size-14 place-items-center rounded-full border border-white/25 bg-white/12 backdrop-blur"><Icon className="size-6" /></div>
                      {app.enabled ? <ArrowUpRight className="size-5 opacity-60" /> : <LockKeyhole className="size-5 opacity-55" />}
                    </div>
                    <div className="relative mt-12">
                      <p className="text-[10px] font-bold tracking-[0.2em] text-white/72 uppercase">{app.eyebrow}</p>
                      <h2 className="mt-3 font-serif text-3xl">{app.title}</h2>
                    </div>
                  </div>
                  <div className="p-7">
                    <p className="min-h-24 text-sm leading-7 text-muted-foreground">{app.description}</p>
                    <Button
                      disabled={!app.enabled || launch.isPending}
                      onClick={() => launch.mutate({ appKey: app.key })}
                      className="mt-6 h-11 w-full rounded-full bg-[#0e1634] text-xs font-bold tracking-[0.12em] text-white uppercase hover:bg-[#1b2855] disabled:opacity-65"
                    >
                      {isLaunching ? <><Loader2 className="mr-2 size-4 animate-spin" /> Creating secure access</> : app.enabled ? <>Open securely <ArrowUpRight className="ml-2 size-4" /></> : <>Connection not configured <LockKeyhole className="ml-2 size-4" /></>}
                    </Button>
                    {launch.error && isLaunching ? <p role="alert" className="mt-3 text-center text-xs leading-5 text-[#9c493e]">{launch.error.message}</p> : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <aside className="mt-8 rounded-[1.5rem] border border-[#c9a84c]/45 bg-[#f7f1df] px-6 py-5 text-sm leading-6 text-[#675927]">
        A launch code can be used once and expires quickly. Your portal password, payment information, and reusable session credential are never sent to another app.
      </aside>
    </main>
  );
}

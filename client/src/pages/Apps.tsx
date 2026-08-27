import { QueryErrorState } from "@/components/QueryErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { SUSAN_LOGO } from "@/lib/brandAssets";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, Heart, Leaf, Loader2, LockKeyhole, Sparkles } from "lucide-react";
import { useState } from "react";

const presentation = {
  elevate: { icon: Heart, eyebrow: "Love in practice", wash: "from-[#2d7d7d]/25 via-[#1e234c]/85 to-[#151938]" },
  enlightened_body: { icon: Leaf, eyebrow: "Embodied wisdom", wash: "from-[#3a7f75]/30 via-[#1e234c]/86 to-[#151938]" },
  tao: { icon: Sparkles, eyebrow: "Timeless wisdom", wash: "from-[#c9a84c]/27 via-[#1e234c]/88 to-[#151938]" },
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
      <header className="brand-hero rounded-[2.25rem] px-6 py-11 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <img src={SUSAN_LOGO.hero} alt="" className="pointer-events-none absolute right-8 top-1/2 z-[1] hidden h-72 w-auto -translate-y-1/2 opacity-[0.12] md:block" />
        <div className="relative z-[2] max-w-3xl">
          <p className="brand-eyebrow">Three doorways, one membership</p>
          <div className="brand-gold-rule mt-5" />
          <h1 className="mt-6 font-serif text-4xl leading-tight text-[#fdfaf5] sm:text-5xl lg:text-6xl">Susan’s Apps</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#e8e4da] sm:text-lg">Move between Susan’s interactive experiences from one trusted place. Each private handoff keeps your journey connected to your active membership.</p>
        </div>
      </header>

      <section className="mt-10">
        {apps.error ? (
          <QueryErrorState title="Your connected apps could not be loaded" onRetry={() => void apps.refetch()} />
        ) : apps.isLoading ? (
          <div className="grid gap-6 xl:grid-cols-3">{[0, 1, 2].map(item => <Skeleton key={item} className="h-[470px] rounded-[2rem]" />)}</div>
        ) : (
          <div className="grid gap-6 xl:grid-cols-3">
            {apps.data?.map(app => {
              const { icon: Icon, eyebrow, wash } = presentation[app.key];
              const isLaunching = launching === app.key;
              return (
                <article key={app.key} className="teaching-card group overflow-hidden rounded-[2rem] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[#c9a84c] hover:shadow-[0_24px_58px_rgba(30,35,76,0.14)]">
                  <div className={`relative min-h-56 overflow-hidden bg-gradient-to-br ${wash} p-7 text-[#fdfaf5]`}>
                    <div className="pointer-events-none absolute -right-12 -top-14 size-44 rounded-full border-[25px] border-[#c9a84c]/15" />
                    <img src={SUSAN_LOGO.medium} alt="" className="pointer-events-none absolute bottom-4 right-6 h-24 w-auto opacity-[0.1]" />
                    <div className="relative flex items-start justify-between">
                      <div className="grid size-14 place-items-center rounded-full border border-[#c9a84c]/55 bg-white/8 text-[#ead79c]"><Icon className="size-6" /></div>
                      {app.enabled ? <ArrowUpRight className="size-5 text-[#ead79c]" /> : <LockKeyhole className="size-5 text-[#d8d4ca]" />}
                    </div>
                    <div className="relative mt-12">
                      <p className="brand-eyebrow">{app.eyebrow || eyebrow}</p>
                      <div className="brand-gold-rule mt-4" />
                      <h2 className="mt-4 font-serif text-3xl">{app.title}</h2>
                    </div>
                  </div>
                  <div className="p-6 sm:p-7">
                    <p className="text-sm leading-7 text-[#607076] xl:min-h-24">{app.description}</p>
                    <Button
                      disabled={!app.enabled || launch.isPending}
                      onClick={() => launch.mutate({ appKey: app.key })}
                      className="brand-button mt-6 h-11 w-full text-xs font-bold uppercase hover:bg-[#205f60] disabled:opacity-65"
                    >
                      {isLaunching ? <><Loader2 className="mr-2 size-4 animate-spin" /> Creating secure access</> : app.enabled ? <>Open securely <ArrowUpRight className="ml-2 size-4" /></> : <><span className="sm:hidden">Setup pending</span><span className="hidden sm:inline">Connection not configured</span><LockKeyhole className="ml-2 size-4 shrink-0" /></>}
                    </Button>
                    {launch.error && isLaunching ? <p role="alert" className="mt-3 text-center text-xs leading-5 text-[#9c493e]">{launch.error.message}</p> : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <aside className="brand-panel mt-8 flex items-start gap-4 rounded-[1.5rem] px-6 py-5 text-sm leading-6 text-[#4f6067]">
        <LockKeyhole className="mt-0.5 size-5 shrink-0 text-[#8a6819]" />
        <p>A launch code can be used once and expires quickly. Your portal password, payment information, and reusable session credential are never sent to another app.</p>
      </aside>
    </main>
  );
}

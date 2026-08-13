import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowRight, FileAudio, FileText, FileVideo, ImageIcon, Layers3 } from "lucide-react";
import { useState } from "react";
import { Link } from "wouter";

const typeIcons = {
  video: FileVideo,
  audio: FileAudio,
  image: ImageIcon,
  text: FileText,
  mixed: Layers3,
};

export default function Teachings() {
  const [category, setCategory] = useState<string | undefined>();
  const categories = trpc.member.teachings.categories.useQuery();
  const teachings = trpc.member.teachings.list.useQuery(category ? { category } : undefined);

  return (
    <main className="portal-page">
      <header className="relative overflow-hidden rounded-[2rem] bg-[#1f7371] px-6 py-10 text-white shadow-[0_24px_70px_rgba(31,115,113,0.2)] sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_82%_18%,rgba(245,237,214,0.28),transparent_25%),linear-gradient(135deg,transparent,rgba(14,22,52,0.22))]" />
        <div className="relative max-w-3xl">
          <p className="mb-4 text-[11px] font-bold tracking-[0.24em] text-[#f1d988] uppercase">Wisdom to return to</p>
          <h1 className="font-serif text-5xl leading-tight sm:text-6xl">Susan’s Teachings</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/82 sm:text-lg">Browse video, audio, imagery, and written reflections created to meet you wherever you are in your journey.</p>
        </div>
      </header>

      <section className="mt-9">
        <div className="flex gap-2 overflow-x-auto pb-3" aria-label="Filter teachings by category">
          <button onClick={() => setCategory(undefined)} className={`shrink-0 rounded-full border px-5 py-2.5 text-xs font-semibold tracking-[0.1em] uppercase transition-colors ${!category ? "border-[#0e1634] bg-[#0e1634] text-white" : "border-[#d8cfbd] bg-white text-[#5f6474] hover:border-[#c9a84c]"}`}>All teachings</button>
          {categories.data?.map(item => (
            <button key={item.id} onClick={() => setCategory(item.slug)} className={`shrink-0 rounded-full border px-5 py-2.5 text-xs font-semibold tracking-[0.08em] uppercase transition-colors ${category === item.slug ? "border-[#0e1634] bg-[#0e1634] text-white" : "border-[#d8cfbd] bg-white text-[#5f6474] hover:border-[#c9a84c]"}`}>
              {item.name} <span className="ml-1 opacity-60">{item.itemCount}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="mt-7">
        {categories.error || teachings.error ? (
          <QueryErrorState
            title="The teachings library could not be loaded"
            onRetry={() => {
              void categories.refetch();
              void teachings.refetch();
            }}
          />
        ) : teachings.isLoading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map(item => <Skeleton key={item} className="h-72 rounded-[1.75rem]" />)}
          </div>
        ) : teachings.data?.length ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {teachings.data.map(item => {
              const Icon = typeIcons[item.contentType];
              return (
                <Link key={item.id} href={`/teachings/${item.slug}`} className="group flex min-h-72 flex-col rounded-[1.75rem] border border-[#ddd5c5] bg-white p-6 shadow-[0_16px_45px_rgba(23,32,68,0.06)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[#c9a84c]/60 hover:shadow-[0_24px_55px_rgba(23,32,68,0.11)]">
                  <div className="flex items-start justify-between gap-4">
                    <div className="grid size-12 place-items-center rounded-2xl bg-[#e7f0ec] text-[#246866]"><Icon className="size-5" /></div>
                    {item.featured ? <Badge className="rounded-full bg-[#f4ead0] text-[#8b6a19] hover:bg-[#f4ead0]">Featured</Badge> : null}
                  </div>
                  <p className="mt-8 text-[10px] font-bold tracking-[0.2em] text-[#2d7777] uppercase">{item.categoryName || item.contentType}</p>
                  <h2 className="mt-3 font-serif text-2xl leading-snug text-[#172044]">{item.title}</h2>
                  <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.summary || "Open this teaching to receive Susan’s reflection."}</p>
                  <span className="mt-auto flex items-center gap-2 pt-6 text-xs font-bold tracking-[0.14em] text-[#2d7777] uppercase">Open teaching <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
                </Link>
              );
            })}
          </div>
        ) : (
          <EmptyState eyebrow="A growing library" title="No teachings are published here yet" description="Susan can add video, audio, image, text, or mixed-media teachings from the administrator area. Published teachings will appear here automatically." />
        )}
      </section>
    </main>
  );
}

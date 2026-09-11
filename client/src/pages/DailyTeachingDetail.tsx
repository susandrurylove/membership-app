import { BunnyImage } from "@/components/BunnyImage";
import { MarkdownContent } from "@/components/MarkdownContent";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ExternalLink, Feather, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useParams } from "wouter";

export default function DailyTeachingDetail() {
  const { slug } = useParams<{ slug: string }>();
  const teaching = trpc.member.dailyTeaching.bySlug.useQuery(
    { slug: slug ?? "" },
    { enabled: Boolean(slug), retry: false }
  );

  if (teaching.isLoading) {
    return (
      <main className="portal-page max-w-[1120px]">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-8 h-[28rem] rounded-[2rem]" />
        <Skeleton className="mx-auto mt-8 h-[34rem] max-w-4xl rounded-[2rem]" />
      </main>
    );
  }

  if (teaching.error) {
    return (
      <main className="portal-page">
        <QueryErrorState title="Today’s teaching could not be opened" onRetry={() => void teaching.refetch()} />
      </main>
    );
  }

  const item = teaching.data;
  if (!item) return null;

  return (
    <main className="portal-page max-w-[1120px]">
      <Button asChild variant="ghost" className="-ml-3 rounded-full text-[#2d7d7d] hover:bg-[#f4ead0] hover:text-[#1e234c]">
        <Link href="/"><ArrowLeft className="mr-2 size-4" aria-hidden="true" /> Home</Link>
      </Button>

      <header className="brand-hero mt-6 min-h-[25rem] overflow-hidden rounded-[2.25rem]">
        <BunnyImage
          src={item.imageUrl}
          alt={item.imageAlt}
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(11,31,47,0.97)_0%,rgba(18,47,61,0.88)_48%,rgba(18,47,61,0.35)_100%)]" />
        <div className="relative z-[2] flex min-h-[25rem] max-w-4xl flex-col justify-end px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
          <p className="brand-eyebrow">Susan Drury · Daily Teaching</p>
          <div className="brand-gold-rule mt-5" />
          <h1 className="mt-6 font-serif text-4xl leading-[1.08] text-[#fdfaf5] sm:text-5xl lg:text-6xl">{item.title}</h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-[#e8e4da] sm:text-lg">{item.summary}</p>
          <div className="mt-6 flex flex-wrap gap-3 text-[10px] font-bold tracking-[0.14em] text-[#ead79c] uppercase">
            <span>{item.collection}</span><span aria-hidden="true">·</span><span>{item.totalWordCount} words</span>
          </div>
        </div>
      </header>

      <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:items-start">
        <article className="reading-surface rounded-[2rem] px-6 py-9 sm:px-10 sm:py-12 lg:px-14">
          <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-medium prose-headings:text-[#1e234c] prose-p:text-[#4f6067] prose-p:leading-8">
            <MarkdownContent>{item.body}</MarkdownContent>
          </div>
          {item.safetyNote ? (
            <aside className="mt-9 rounded-2xl border border-[#b7cec8] bg-[#e8f1ee] p-5 text-sm leading-6 text-[#355a5b]">
              <p className="flex items-center gap-2 font-bold text-[#205f60]"><ShieldCheck className="size-4" aria-hidden="true" /> Gentle care</p>
              <p className="mt-2">{item.safetyNote}</p>
            </aside>
          ) : null}
        </article>

        <aside className="space-y-5 lg:sticky lg:top-28">
          <section className="brand-panel rounded-[1.75rem] p-6">
            <Sparkles className="size-5 text-[#8a6819]" aria-hidden="true" />
            <p className="eyebrow mt-5">A moment to reflect</p>
            <p className="mt-4 font-serif text-xl leading-8 text-[#314b56]">{item.reflectionPrompt}</p>
          </section>
          <section className="rounded-[1.75rem] border border-[#2d7d7d]/30 bg-[#e7f0ec] p-6">
            <Feather className="size-5 text-[#2d7d7d]" aria-hidden="true" />
            <p className="eyebrow mt-5">Today’s practice</p>
            <p className="mt-4 text-sm leading-7 text-[#3d5d60]">{item.practice}</p>
          </section>
          <section className="rounded-[1.75rem] border border-[#c9a84c]/35 bg-[#1e234c] p-6 text-[#fdfaf5]">
            <p className="brand-eyebrow">Source</p>
            <p className="mt-4 font-serif text-xl leading-snug">{item.sourceTitle}</p>
            {item.sourceLocator ? <p className="mt-2 text-xs leading-5 text-[#d8d4ca]">{item.sourceLocator}</p> : null}
            {item.sourceUrl ? (
              <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.13em] text-[#ead79c] uppercase hover:text-white">
                View original <ExternalLink className="size-3.5" aria-hidden="true" />
              </a>
            ) : null}
          </section>
        </aside>
      </div>
    </main>
  );
}

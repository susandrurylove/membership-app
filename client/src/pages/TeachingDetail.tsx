import { MediaViewer } from "@/components/MediaViewer";
import { MarkdownContent } from "@/components/MarkdownContent";
import { BunnyImage } from "@/components/BunnyImage";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BookOpenText, Clock3, ExternalLink, HeartHandshake, ShieldCheck, Sparkles } from "lucide-react";
import { Link, useParams } from "wouter";

function toStringArray(value: unknown): string[] {
  let normalized = value;
  if (typeof value === "string") {
    try {
      normalized = JSON.parse(value);
    } catch {
      return [];
    }
  }
  return Array.isArray(normalized)
    ? normalized.filter((item): item is string => typeof item === "string" && item.trim().length > 0)
    : [];
}

export default function TeachingDetail() {
  const { slug } = useParams<{ slug: string }>();
  const teaching = trpc.member.teachings.bySlug.useQuery({ slug: slug ?? "" }, { enabled: Boolean(slug), retry: false });

  if (teaching.isLoading) {
    return <main className="portal-page"><Skeleton className="h-10 w-48" /><Skeleton className="mt-8 h-80 rounded-[2rem]" /><Skeleton className="mx-auto mt-10 h-[42rem] max-w-4xl rounded-[2rem]" /></main>;
  }

  if (teaching.error) {
    return <main className="portal-page"><QueryErrorState title="This teaching could not be opened" onRetry={() => void teaching.refetch()} /></main>;
  }

  if (!teaching.data) {
    return <main className="portal-page"><h1 className="font-serif text-4xl text-[#1e234c]">Teaching not found</h1><Button asChild className="brand-button mt-6"><Link href="/teachings">Return to teachings</Link></Button></main>;
  }

  const { teaching: item, category, assets } = teaching.data;
  const themes = toStringArray(item.keyThemes);
  const prompts = toStringArray(item.reflectionPrompts);
  const sensitivityNotes = toStringArray(item.sensitiveContentNotes);
  const sourceLabel = item.sourceType === "website" ? "SusanDrury.com Journal" : item.sourceType === "booklet" ? item.sourceTitle || "Elevate Your Body to Love" : item.sourceTitle || "Elevating Your Origins to Love";

  return (
    <main className="portal-page max-w-[1240px]">
      <Button asChild variant="ghost" className="-ml-3 rounded-full text-[#2d7d7d] hover:bg-[#f4ead0] hover:text-[#1e234c]"><Link href="/teachings"><ArrowLeft className="mr-2 size-4" /> All teachings</Link></Button>

      <header className="brand-hero mt-6 min-h-[25rem] rounded-[2.25rem]">
        {item.heroImageUrl ? <BunnyImage src={item.heroImageUrl} alt={`Illustration for ${item.title}`} loading="eager" fetchPriority="high" decoding="async" className="absolute inset-0 h-full w-full object-cover object-center opacity-75" /> : null}
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(21,25,56,0.98)_0%,rgba(30,35,76,0.88)_48%,rgba(30,35,76,0.38)_100%)]" />
        <div className="relative z-[2] flex min-h-[25rem] max-w-4xl flex-col justify-end px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
          <p className="brand-eyebrow">{category?.name || "Susan’s teaching"}</p>
          <div className="brand-gold-rule mt-5" />
          <h1 className="mt-6 font-serif text-4xl leading-[1.08] text-[#fdfaf5] sm:text-5xl lg:text-6xl">{item.title}</h1>
          {item.summary ? <p className="mt-6 max-w-3xl text-base leading-8 text-[#e8e4da] sm:text-lg">{item.summary}</p> : null}
          <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-3 text-[10px] font-bold tracking-[0.13em] text-[#ead79c] uppercase">
            <span className="inline-flex items-center gap-2"><Clock3 className="size-3.5" /> {item.readingMinutes ?? 4} min read</span>
            <span className="inline-flex items-center gap-2"><BookOpenText className="size-3.5" /> {sourceLabel}</span>
          </div>
        </div>
      </header>

      {themes.length ? (
        <div className="mt-6 flex flex-wrap gap-2" aria-label="Teaching themes">
          {themes.map(theme => <span key={theme} className="brand-chip px-4 py-2 text-[10px] font-bold tracking-[0.08em] uppercase">{theme}</span>)}
        </div>
      ) : null}

      {assets.length ? (
        <section className="mt-10 space-y-6" aria-label="Teaching media">
          {assets.map(({ asset }) => <MediaViewer key={asset.id} asset={asset} />)}
        </section>
      ) : null}

      <div className="mt-10 grid gap-7 lg:grid-cols-[minmax(0,1fr)_19rem] lg:items-start">
        <article className="reading-surface rounded-[2rem] px-6 py-9 sm:px-10 sm:py-12 lg:px-14">
          {sensitivityNotes.length ? (
            <aside className="mb-9 rounded-2xl border border-[#c9a84c]/45 bg-[#f8f0dc] p-5 text-sm leading-6 text-[#594a26]">
              <p className="flex items-center gap-2 font-bold text-[#77580f]"><HeartHandshake className="size-4" /> A gentle note before you begin</p>
              {sensitivityNotes.map(note => <p key={note} className="mt-2">{note}</p>)}
            </aside>
          ) : null}

          {item.body ? (
            <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:font-medium prose-headings:text-[#1e234c] prose-h2:mt-12 prose-h2:border-b prose-h2:border-[#c9a84c]/35 prose-h2:pb-3 prose-p:text-[#4f6067] prose-p:leading-8 prose-a:text-[#2d7d7d] prose-a:underline-offset-4 prose-blockquote:border-[#c9a84c] prose-blockquote:bg-[#f8f2e6] prose-blockquote:px-6 prose-blockquote:py-3 prose-blockquote:text-[#394b55]">
              <MarkdownContent>{item.body}</MarkdownContent>
            </div>
          ) : null}

          {item.medicalDisclaimer ? (
            <aside className="mt-10 rounded-2xl border border-[#b7cec8] bg-[#e8f1ee] p-5 text-sm leading-6 text-[#355a5b]">
              <p className="flex items-center gap-2 font-bold text-[#205f60]"><ShieldCheck className="size-4" /> Educational and reflective guidance</p>
              <p className="mt-2">This teaching offers spiritual and reflective perspectives. It is not medical diagnosis or treatment. Please seek qualified medical care for symptoms, urgent concerns, medication decisions, or treatment choices.</p>
            </aside>
          ) : null}
        </article>

        <aside className="space-y-5 lg:sticky lg:top-28">
          {prompts.length ? (
            <section className="brand-panel rounded-[1.75rem] p-6">
              <div className="grid size-11 place-items-center rounded-full border border-[#c9a84c]/50 bg-[#f4ead0] text-[#8a6819]"><Sparkles className="size-4" /></div>
              <p className="eyebrow mt-6">For reflection</p>
              <div className="brand-gold-rule mt-4" />
              <div className="mt-5 space-y-5">
                {prompts.map((prompt, index) => <p key={prompt} className="text-sm leading-6 text-[#4f6067]"><span className="mr-2 font-semibold text-[#c9a84c]">{String(index + 1).padStart(2, "0")}</span>{prompt}</p>)}
              </div>
            </section>
          ) : null}

          {item.practiceInvitation ? (
            <section className="rounded-[1.75rem] border border-[#2d7d7d]/30 bg-[#e7f0ec] p-6">
              <p className="eyebrow">Practice invitation</p>
              <p className="mt-4 text-sm leading-7 text-[#3d5d60]">{item.practiceInvitation}</p>
            </section>
          ) : null}

          <section className="rounded-[1.75rem] border border-[#c9a84c]/35 bg-[#1e234c] p-6 text-[#fdfaf5]">
            <p className="brand-eyebrow">Source</p>
            <p className="mt-4 font-serif text-xl leading-snug">{sourceLabel}</p>
            {item.sourceLocator ? <p className="mt-2 text-xs leading-5 text-[#d8d4ca]">{item.sourceLocator}</p> : null}
            {item.sourceUrl ? <a href={item.sourceUrl} target="_blank" rel="noreferrer" className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.13em] text-[#ead79c] uppercase hover:text-white">View original <ExternalLink className="size-3.5" /></a> : null}
          </section>
        </aside>
      </div>
    </main>
  );
}

import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { SUSAN_LOGO } from "@/lib/brandAssets";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BookOpenText, Clock3, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";

const PAGE_SIZE = 24;

export default function Teachings() {
  const [category, setCategory] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const categories = trpc.member.teachings.categories.useQuery();
  const teachings = trpc.member.teachings.list.useQuery(category ? { category } : undefined);

  useEffect(() => setVisibleCount(PAGE_SIZE), [category, search]);

  const filtered = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return teachings.data ?? [];
    return (teachings.data ?? []).filter(item => {
      const themes = Array.isArray(item.keyThemes) ? item.keyThemes.join(" ") : "";
      return [item.title, item.summary ?? "", item.categoryName ?? "", themes]
        .join(" ")
        .toLocaleLowerCase()
        .includes(query);
    });
  }, [search, teachings.data]);

  const visible = filtered.slice(0, visibleCount);

  return (
    <main className="portal-page">
      <header className="brand-hero rounded-[2.25rem] px-6 py-11 sm:px-10 sm:py-14 lg:px-14 lg:py-16">
        <img
          src={SUSAN_LOGO.hero}
          alt=""
          className="pointer-events-none absolute -right-4 top-1/2 z-[1] hidden h-[18rem] w-auto -translate-y-1/2 object-contain opacity-[0.12] md:block lg:right-10 lg:h-[23rem]"
        />
        <div className="relative z-[2] max-w-3xl">
          <p className="brand-eyebrow">The member journal</p>
          <div className="brand-gold-rule mt-5" />
          <h1 className="mt-6 font-serif text-4xl leading-[1.06] text-[#fdfaf5] sm:text-5xl lg:text-7xl">
            Wisdom &amp; Insight
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-[#e8e4da] sm:text-lg">
            Susan’s teachings on embodied wisdom, our origins, transformation, timeless practice, and the art of elevating life into love.
          </p>
          <div className="mt-8 flex flex-wrap gap-x-7 gap-y-3 text-xs tracking-[0.1em] text-[#ead79c] uppercase">
            <span>{teachings.data?.length ?? 287} teachings</span>
            <span>{categories.data?.length ?? 9} collections</span>
            <span>Private member library</span>
          </div>
        </div>
      </header>

      <section className="brand-panel relative z-10 mx-2 -mt-5 rounded-[1.75rem] p-4 sm:mx-6 sm:p-5 lg:mx-10">
        <div className="grid gap-4 lg:grid-cols-[minmax(16rem,25rem)_1fr] lg:items-center">
          <label className="relative block">
            <span className="sr-only">Search teachings</span>
            <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-[#2d7d7d]" />
            <Input
              value={search}
              onChange={event => setSearch(event.target.value)}
              placeholder="Search teachings, themes, or practices"
              className="h-12 rounded-full border-[#d7c9ad] bg-white pl-11 pr-4 text-[#26384b] shadow-none focus-visible:ring-[#c9a84c]"
            />
          </label>
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Filter teachings by collection">
            <button
              type="button"
              data-active={!category}
              onClick={() => setCategory(undefined)}
              className="brand-chip min-h-11 shrink-0 px-5 py-2.5 text-[10px] font-bold tracking-[0.12em] uppercase"
            >
              All teachings
            </button>
            {categories.data?.map(item => (
              <button
                type="button"
                key={item.id}
                data-active={category === item.slug}
                onClick={() => setCategory(item.slug)}
                className="brand-chip min-h-11 shrink-0 px-5 py-2.5 text-[10px] font-bold tracking-[0.1em] uppercase"
              >
                {item.name} <span className="ml-1 opacity-65">{item.itemCount}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      <section className="mt-10" aria-live="polite">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Explore the library</p>
            <h2 className="mt-3 font-serif text-3xl text-[#1e234c] sm:text-4xl">
              {category ? categories.data?.find(item => item.slug === category)?.name ?? "Selected collection" : "All teachings"}
            </h2>
          </div>
          {!teachings.isLoading ? <p className="text-sm text-[#607076]">Showing {Math.min(visible.length, filtered.length)} of {filtered.length}</p> : null}
        </div>

        {categories.error || teachings.error ? (
          <QueryErrorState
            title="The teachings library could not be loaded"
            onRetry={() => {
              void categories.refetch();
              void teachings.refetch();
            }}
          />
        ) : teachings.isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {[0, 1, 2, 3, 4, 5].map(item => <Skeleton key={item} className="h-[28rem] rounded-[1.75rem]" />)}
          </div>
        ) : visible.length ? (
          <>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map(item => (
                <Link
                  key={item.id}
                  href={`/teachings/${item.slug}`}
                  className="teaching-card group flex min-h-[27rem] flex-col rounded-[1.75rem] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[#c9a84c] hover:shadow-[0_24px_58px_rgba(30,35,76,0.14)] focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-2 focus-visible:outline-none"
                >
                  <div className="teaching-cover overflow-hidden rounded-t-[1.68rem]">
                    {item.heroImageUrl ? (
                      <img src={item.heroImageUrl} alt="" loading="lazy" className="h-full min-h-[11.5rem] w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]" />
                    ) : (
                      <div className="grid min-h-[11.5rem] place-items-center">
                        <img src={SUSAN_LOGO.medium} alt="" className="relative z-[1] h-20 w-auto opacity-35" />
                      </div>
                    )}
                    <div className="absolute inset-x-5 bottom-4 z-[2] flex items-end justify-between gap-3 text-[#fdfaf5]">
                      <p className="text-[9px] font-bold tracking-[0.2em] uppercase">{item.categoryName || "Susan’s teaching"}</p>
                      {item.featured ? <Badge className="border border-[#ead79c]/50 bg-[#1e234c]/75 text-[#f5e4aa] hover:bg-[#1e234c]/75">Featured</Badge> : null}
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col p-6">
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-semibold tracking-[0.1em] text-[#66767b] uppercase">
                      <span className="inline-flex items-center gap-1.5"><Clock3 className="size-3.5 text-[#2d7d7d]" /> {item.readingMinutes ?? 4} min</span>
                      <span>{item.sourceType === "website" ? "Journal" : item.sourceType === "booklet" ? "Body booklet" : "Book journey"}</span>
                    </div>
                    <h3 className="mt-4 font-serif text-2xl leading-snug text-[#1e234c]">{item.title}</h3>
                    <p className="mt-3 line-clamp-4 text-sm leading-6 text-[#607076]">{item.summary || "Open this teaching to receive Susan’s reflection."}</p>
                    <span className="mt-auto flex items-center gap-2 pt-6 text-[11px] font-bold tracking-[0.14em] text-[#2d7d7d] uppercase">
                      Read teaching <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
            {visibleCount < filtered.length ? (
              <div className="mt-10 flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setVisibleCount(count => count + PAGE_SIZE)}
                  className="h-12 rounded-full border-[#c9a84c] bg-[#fdfaf5] px-8 text-xs font-bold tracking-[0.14em] text-[#1e234c] uppercase hover:bg-[#1e234c] hover:text-[#fdfaf5]"
                >
                  Show more teachings
                </Button>
              </div>
            ) : null}
          </>
        ) : (
          <EmptyState
            eyebrow="The member journal"
            title={search ? "No teachings match your search" : "No teachings are published here yet"}
            description={search ? "Try a different word, theme, or collection." : "Published teachings will appear here automatically."}
            icon={search ? Search : BookOpenText}
            action={search ? <Button onClick={() => setSearch("")} className="brand-button">Clear search</Button> : undefined}
          />
        )}
      </section>

      <aside className="brand-panel mt-14 rounded-[1.75rem] p-6 sm:flex sm:items-center sm:justify-between sm:gap-8 sm:p-8">
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-full border border-[#c9a84c]/50 bg-[#f4ead0] text-[#8a6819]"><Sparkles className="size-5" /></div>
          <div>
            <p className="eyebrow">A living library</p>
            <h2 className="mt-2 font-serif text-2xl text-[#1e234c]">Return whenever you need a new doorway.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#607076]">Read slowly, notice what resonates, and let each teaching meet you differently as your own life changes.</p>
          </div>
        </div>
      </aside>
    </main>
  );
}

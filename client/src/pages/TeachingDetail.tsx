import { MediaViewer } from "@/components/MediaViewer";
import { MarkdownContent } from "@/components/MarkdownContent";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowLeft } from "lucide-react";
import { Link, useParams } from "wouter";

export default function TeachingDetail() {
  const { slug } = useParams<{ slug: string }>();
  const teaching = trpc.member.teachings.bySlug.useQuery({ slug: slug ?? "" }, { enabled: Boolean(slug), retry: false });

  if (teaching.isLoading) {
    return <main className="portal-page"><Skeleton className="h-10 w-48" /><Skeleton className="mt-8 h-28 max-w-3xl" /><Skeleton className="mt-10 aspect-video max-w-5xl rounded-[2rem]" /></main>;
  }

  if (teaching.error) {
    return <main className="portal-page"><QueryErrorState title="This teaching could not be opened" onRetry={() => void teaching.refetch()} /></main>;
  }

  if (!teaching.data) {
    return <main className="portal-page"><h1 className="font-serif text-4xl">Teaching not found</h1><Button asChild className="mt-6"><Link href="/teachings">Return to teachings</Link></Button></main>;
  }

  const { teaching: item, category, assets } = teaching.data;

  return (
    <main className="portal-page max-w-[1180px]">
      <Button asChild variant="ghost" className="-ml-3 text-[#2d7777]"><Link href="/teachings"><ArrowLeft className="mr-2 size-4" /> All teachings</Link></Button>

      <header className="mt-7 max-w-4xl">
        <p className="eyebrow">{category?.name || item.contentType}</p>
        <h1 className="mt-4 font-serif text-4xl leading-tight text-[#243f4d] sm:text-5xl lg:text-6xl">{item.title}</h1>
        {item.summary ? <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">{item.summary}</p> : null}
      </header>

      {assets.length ? (
        <section className="mt-10 space-y-6">
          {assets.map(({ asset }) => <MediaViewer key={asset.id} asset={asset} />)}
        </section>
      ) : null}

      {item.body ? (
        <article className="prose prose-lg prose-headings:font-serif prose-headings:text-[#243f4d] prose-p:text-[#58686d] prose-p:leading-8 prose-a:text-[#2d7777] mt-12 max-w-3xl">
          <MarkdownContent>{item.body}</MarkdownContent>
        </article>
      ) : null}
    </main>
  );
}

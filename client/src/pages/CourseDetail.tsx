import { EmptyState } from "@/components/EmptyState";
import { MarkdownContent } from "@/components/MarkdownContent";
import { MediaViewer } from "@/components/MediaViewer";
import { PortalHeroImage } from "@/components/PortalMedia";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { PORTAL_IMAGES } from "@/lib/portalImages";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check, CheckCircle2, Circle, Clock3, Loader2, Play } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";

export default function CourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [location] = useLocation();
  const utils = trpc.useUtils();
  const course = trpc.member.courses.bySlug.useQuery({ slug: slug ?? "" }, { enabled: Boolean(slug), retry: false });
  const requestedLesson = new URLSearchParams(window.location.search).get("lesson");
  const selected = course.data?.lessons.find(item => item.lesson.slug === requestedLesson) ?? course.data?.lessons[0] ?? null;

  const progressMutation = trpc.member.courses.updateProgress.useMutation({
    onSuccess: updated => {
      if (!slug) return;
      utils.member.courses.bySlug.setData({ slug }, updated);
      void utils.member.courses.list.invalidate();
      void utils.member.dashboard.invalidate();
    },
  });

  if (course.isLoading) {
    return <main className="portal-page"><Skeleton className="h-10 w-48" /><Skeleton className="mt-8 h-40 rounded-[2rem]" /><div className="mt-8 grid gap-6 lg:grid-cols-[320px_1fr]"><Skeleton className="h-96 rounded-[1.75rem]" /><Skeleton className="h-96 rounded-[1.75rem]" /></div></main>;
  }

  if (course.error) {
    return <main className="portal-page"><QueryErrorState title="This course could not be opened" onRetry={() => void course.refetch()} /></main>;
  }

  if (!course.data) {
    return <main className="portal-page"><h1 className="font-serif text-4xl">Course not found</h1><Button asChild className="mt-6"><Link href="/courses">Return to courses</Link></Button></main>;
  }

  const { course: item, sections, lessons, progress } = course.data;
  const unsectioned = lessons.filter(lesson => !lesson.lesson.sectionId);

  return (
    <main className="portal-page max-w-[1440px]">
      <Button asChild variant="ghost" className="-ml-3 rounded-full text-[#2d7d7d] hover:bg-[#f4ead0] hover:text-[#1e234c]"><Link href="/courses"><ArrowLeft className="mr-2 size-4" /> All courses</Link></Button>

      <header className="brand-hero mt-6 rounded-[2.25rem] px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
        <PortalHeroImage image={PORTAL_IMAGES.innerPeaceCourse} />
        <div className="relative z-[2] grid gap-9 lg:grid-cols-[1fr_340px] lg:items-end">
          <div>
            <p className="brand-eyebrow">Self-paced course</p>
            <div className="brand-gold-rule mt-5" />
            <h1 className="mt-6 font-serif text-3xl leading-tight text-[#fdfaf5] sm:text-4xl lg:text-5xl">{item.title}</h1>
            {item.summary ? <p className="mt-5 max-w-3xl leading-7 text-[#e8e4da]">{item.summary}</p> : null}
          </div>
          <div className="rounded-[1.4rem] border border-[#c9a84c]/45 bg-[#fdfaf5]/96 p-5 text-[#26384b]">
            <div className="flex items-center justify-between text-xs text-[#607076]"><span>{progress.completed} of {progress.total} lessons</span><span className="font-semibold text-[#205f60]">{progress.percent}%</span></div>
            <Progress aria-label={`${item.title} completion`} value={progress.percent} className="mt-3 h-2 bg-[#e5dccb] [&>div]:bg-[#c9a84c]" />
          </div>
        </div>
      </header>

      {lessons.length ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-[330px_minmax(0,1fr)] lg:items-start">
          <aside className="brand-panel rounded-[1.75rem] p-4 lg:sticky lg:top-28">
            <div className="px-3 pb-4 pt-2"><p className="eyebrow">Course path</p><p className="mt-2 text-sm text-muted-foreground">Choose a lesson and continue at your own pace.</p></div>
            <div className="space-y-4">
              {sections.map(section => {
                const sectionLessons = lessons.filter(entry => entry.lesson.sectionId === section.id);
                if (!sectionLessons.length) return null;
                return (
                  <div key={section.id}>
                    <p className="px-3 py-2 text-[10px] font-bold tracking-[0.16em] text-[#77580f] uppercase">{section.title}</p>
                    <div className="space-y-1">
                      {sectionLessons.map(entry => <LessonLink key={entry.lesson.id} courseSlug={item.slug} entry={entry} selected={selected?.lesson.id === entry.lesson.id} />)}
                    </div>
                  </div>
                );
              })}
              {unsectioned.length ? <div className="space-y-1">{unsectioned.map(entry => <LessonLink key={entry.lesson.id} courseSlug={item.slug} entry={entry} selected={selected?.lesson.id === entry.lesson.id} />)}</div> : null}
            </div>
          </aside>

          {selected ? (
            <article key={`${selected.lesson.id}-${location}`} className="reading-surface rounded-[1.75rem] p-5 sm:p-9">
              <div className="flex flex-wrap items-start justify-between gap-5">
                <div className="max-w-3xl">
                  <p className="eyebrow">Lesson</p>
                  <div className="brand-gold-rule mt-4" />
                  <h2 className="mt-5 font-serif text-3xl leading-tight text-[#1e234c] sm:text-4xl">{selected.lesson.title}</h2>
                  {selected.lesson.summary ? <p className="mt-4 leading-7 text-muted-foreground">{selected.lesson.summary}</p> : null}
                </div>
                {selected.progress?.status === "completed" ? <span className="flex items-center gap-2 rounded-full bg-[#e7f0ec] px-4 py-2 text-xs font-semibold text-[#246866]"><CheckCircle2 className="size-4" /> Completed</span> : null}
              </div>

              {selected.media ? <div className="mt-8"><MediaViewer asset={selected.media} /></div> : null}
              {selected.lesson.body ? <div className="prose prose-lg prose-headings:font-serif prose-headings:font-medium prose-headings:text-[#1e234c] prose-h2:border-b prose-h2:border-[#c9a84c]/35 prose-h2:pb-3 prose-p:text-[#4f6067] prose-p:leading-8 prose-a:text-[#2d7d7d] mt-9 max-w-3xl"><MarkdownContent>{selected.lesson.body}</MarkdownContent></div> : null}
              {!selected.media && !selected.lesson.body ? <div className="mt-8 rounded-2xl bg-[#f7f2e8] p-6 text-sm text-muted-foreground">Susan is preparing the content for this lesson.</div> : null}

              <div className="mt-10 flex flex-wrap items-center justify-between gap-4 border-t border-[#ebe5d9] pt-6">
                <span className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="size-4 text-[#2d7777]" /> {selected.lesson.estimatedMinutes ? `${selected.lesson.estimatedMinutes} minutes` : "Move at your own pace"}</span>
                <Button
                  disabled={progressMutation.isPending || selected.progress?.status === "completed"}
                  onClick={() => progressMutation.mutate({
                    lessonId: selected.lesson.id,
                    percentComplete: selected.progress ? 100 : 1,
                    lastPositionSeconds: selected.progress?.lastPositionSeconds ?? 0,
                    completed: Boolean(selected.progress),
                  })}
                  className="brand-button px-6 hover:bg-[#205f60]"
                >
                  {progressMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : selected.progress?.status === "completed" ? <><Check className="mr-2 size-4" /> Completed</> : selected.progress ? <><Check className="mr-2 size-4" /> Mark complete</> : <><Play className="mr-2 size-4" /> Start lesson</>}
                </Button>
              </div>
              {progressMutation.error ? (
                <div role="alert" className="mt-4 rounded-xl border border-[#b45a4d]/25 bg-[#fff8f4] px-4 py-3 text-sm text-[#823b32]">
                  We could not save your progress. Please try again; your previous progress is unchanged.
                </div>
              ) : null}
            </article>
          ) : null}
        </div>
      ) : (
        <div className="mt-8"><EmptyState eyebrow="Course preparation" title="Lessons are coming soon" description="The course is published, and Susan can now add and arrange its lessons from the administrator area." /></div>
      )}
    </main>
  );
}

function LessonLink({ courseSlug, entry, selected }: { courseSlug: string; entry: any; selected: boolean }) {
  const complete = entry.progress?.status === "completed";
  return (
    <Link href={`/courses/${courseSlug}?lesson=${entry.lesson.slug}`} className={cn("flex items-start gap-3 rounded-xl border px-3 py-3 text-sm transition-colors focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:outline-none", selected ? "border-[#c9a84c]/65 bg-[#1e234c] text-[#fdfaf5]" : "border-transparent text-[#4f5f66] hover:bg-[#f7f2e8]") }>
      {complete ? <CheckCircle2 className={cn("mt-0.5 size-4 shrink-0", selected ? "text-[#ead79c]" : "text-[#2d7d7d]")} /> : <Circle className={cn("mt-0.5 size-4 shrink-0", selected ? "text-[#ead79c]" : "text-[#9aa7a8]")} />}
      <span className="leading-5">{entry.lesson.title}</span>
    </Link>
  );
}

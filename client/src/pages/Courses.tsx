import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowRight, BookHeart, CheckCircle2, Clock3 } from "lucide-react";
import { Link } from "wouter";

export default function Courses() {
  const courses = trpc.member.courses.list.useQuery();

  return (
    <main className="portal-page">
      <header className="editorial-card grid gap-7 rounded-[2rem] px-5 py-9 sm:px-10 sm:py-12 lg:grid-cols-[1fr_220px] lg:items-center">
        <div>
          <p className="eyebrow">Learn at your own rhythm</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-[#243f4d] sm:text-5xl lg:text-6xl">Susan’s Courses</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">Move through each course in your own time. Your place and completion history are held here for your return.</p>
        </div>
        <div className="relative mx-auto grid size-36 place-items-center rounded-full border border-[#c9a84c]/55 bg-[#f7f1df] text-center shadow-[inset_0_0_0_13px_rgba(255,255,255,0.5)] sm:size-44 sm:shadow-[inset_0_0_0_16px_rgba(255,255,255,0.5)]">
          <BookHeart className="size-9 text-[#9b7a27] sm:size-11" />
          <span className="absolute bottom-6 text-[9px] font-bold tracking-[0.18em] text-[#77580f] uppercase sm:bottom-8 sm:text-[10px]">Guided learning</span>
        </div>
      </header>

      <section className="mt-10">
        {courses.error ? (
          <QueryErrorState title="Your courses could not be loaded" onRetry={() => void courses.refetch()} />
        ) : courses.isLoading ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {[0, 1, 2, 3].map(item => <Skeleton key={item} className="h-72 rounded-[1.75rem]" />)}
          </div>
        ) : courses.data?.length ? (
          <div className="grid gap-6 lg:grid-cols-2">
            {courses.data.map(course => (
              <Link key={course.id} href={`/courses/${course.slug}`} className="editorial-card group flex min-h-68 flex-col overflow-hidden rounded-[1.75rem] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[#c9a84c]/60 hover:shadow-[0_22px_52px_rgba(48,66,72,0.11)]">
                <div className="h-1.5 bg-gradient-to-r from-[#2f7772] via-[#c9a84c] to-[#b5d0c6]" />
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2"><Clock3 className="size-4 text-[#2d7777]" /> {course.estimatedMinutes ? `${course.estimatedMinutes} minutes` : "Self-paced"}</span>
                    {course.progress.percent === 100 ? <span className="flex items-center gap-1.5 font-semibold text-[#2d7777]"><CheckCircle2 className="size-4" /> Complete</span> : null}
                  </div>
                  <h2 className="mt-7 font-serif text-3xl leading-snug text-[#243f4d]">{course.title}</h2>
                  <p className="mt-4 line-clamp-3 text-sm leading-6 text-muted-foreground">{course.summary || course.description || "Open this course to explore its lessons."}</p>
                  <div className="mt-auto pt-8">
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span>{course.progress.completed} of {course.progress.total} lessons</span>
                      <span>{course.progress.percent}%</span>
                    </div>
                    <Progress value={course.progress.percent} className="mt-3 h-2 bg-[#ece5d8] [&>div]:bg-[#c9a84c]" />
                    <span className="mt-6 flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-[#2d7777] uppercase">Open course <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" /></span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState eyebrow="A place for deep learning" title="No courses are published yet" description="Susan can create courses, organize lessons, and publish them from the administrator area. Members will see every available course here without another setup step." />
        )}
      </section>
    </main>
  );
}

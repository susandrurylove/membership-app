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
      <header className="grid gap-8 rounded-[2rem] border border-[#d9d2c2] bg-white px-6 py-10 shadow-[0_22px_65px_rgba(23,32,68,0.08)] sm:px-10 sm:py-12 lg:grid-cols-[1fr_240px] lg:items-center">
        <div>
          <p className="eyebrow">Learn at your own rhythm</p>
          <h1 className="mt-4 font-serif text-5xl leading-tight text-[#172044] sm:text-6xl">Susan’s Courses</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-muted-foreground sm:text-lg">Move through each course in your own time. Your place and completion history are held here for your return.</p>
        </div>
        <div className="relative mx-auto grid size-44 place-items-center rounded-full border border-[#c9a84c]/55 bg-[#f7f1df] text-center shadow-[inset_0_0_0_16px_rgba(255,255,255,0.45)]">
          <BookHeart className="size-11 text-[#9b7a27]" />
          <span className="absolute bottom-8 text-[10px] font-bold tracking-[0.2em] text-[#8b6a19] uppercase">Guided learning</span>
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
              <Link key={course.id} href={`/courses/${course.slug}`} className="group flex min-h-72 flex-col overflow-hidden rounded-[1.75rem] border border-[#ddd5c5] bg-white shadow-[0_16px_45px_rgba(23,32,68,0.06)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[#c9a84c]/60 hover:shadow-[0_24px_55px_rgba(23,32,68,0.11)]">
                <div className="h-2 bg-gradient-to-r from-[#1f7371] via-[#c9a84c] to-[#0e1634]" />
                <div className="flex flex-1 flex-col p-6 sm:p-8">
                  <div className="flex items-center justify-between gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-2"><Clock3 className="size-4 text-[#2d7777]" /> {course.estimatedMinutes ? `${course.estimatedMinutes} minutes` : "Self-paced"}</span>
                    {course.progress.percent === 100 ? <span className="flex items-center gap-1.5 font-semibold text-[#2d7777]"><CheckCircle2 className="size-4" /> Complete</span> : null}
                  </div>
                  <h2 className="mt-7 font-serif text-3xl leading-snug text-[#172044]">{course.title}</h2>
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

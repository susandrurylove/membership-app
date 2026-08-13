import { useAuth } from "@/_core/hooks/useAuth";
import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  BookHeart,
  BookOpenText,
  CheckCircle2,
  Clock3,
  PlayCircle,
  Sparkles,
} from "lucide-react";
import { Link } from "wouter";

const quickLinks = [
  {
    href: "/teachings",
    title: "Susan’s Teachings",
    description: "Return to meditations, reflections, audio, video, and written wisdom.",
    icon: BookOpenText,
    accent: "bg-[#e7f0ec] text-[#246866]",
  },
  {
    href: "/courses",
    title: "Your Courses",
    description: "Continue step by step and keep your place across every lesson.",
    icon: BookHeart,
    accent: "bg-[#f4ead0] text-[#8b6a19]",
  },
  {
    href: "/apps",
    title: "Susan’s Apps",
    description: "Open Elevate To Love, Enlightened Body, and Tao Interactive.",
    icon: Sparkles,
    accent: "bg-[#ece8f4] text-[#5d4f7b]",
  },
];

function DashboardSkeleton() {
  return (
    <div className="portal-page space-y-8">
      <Skeleton className="h-72 rounded-[2rem]" />
      <div className="grid gap-5 md:grid-cols-3">
        {[0, 1, 2].map(item => <Skeleton key={item} className="h-52 rounded-[1.75rem]" />)}
      </div>
      <Skeleton className="h-72 rounded-[2rem]" />
    </div>
  );
}

export default function Home() {
  const { user } = useAuth();
  const dashboard = trpc.member.dashboard.useQuery();
  const firstName = user?.name?.trim().split(/\s+/)[0];

  if (dashboard.isLoading) return <DashboardSkeleton />;
  if (dashboard.error) {
    return (
      <main className="portal-page">
        <QueryErrorState
          title="Your dashboard could not be loaded"
          description="Please try again to reconnect to your recent activity and course progress."
          onRetry={() => void dashboard.refetch()}
        />
      </main>
    );
  }

  return (
    <main className="portal-page">
      <section className="relative overflow-hidden rounded-[2rem] bg-[#0e1634] px-6 py-10 text-[#f5edd6] shadow-[0_28px_80px_rgba(14,22,52,0.22)] sm:px-10 sm:py-12 xl:px-14">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_15%,rgba(201,168,76,0.28),transparent_28%),radial-gradient(circle_at_8%_95%,rgba(45,119,119,0.45),transparent_38%)]" />
        <div className="relative grid gap-10 lg:grid-cols-[1fr_300px] lg:items-end">
          <div>
            <p className="mb-5 text-[11px] font-bold tracking-[0.25em] text-[#c9a84c] uppercase">Your private sanctuary</p>
            <h1 className="max-w-3xl font-serif text-5xl leading-[1.08] sm:text-6xl">
              Welcome{firstName ? `, ${firstName}` : ""}.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-8 text-[#d6d8e2] sm:text-lg">
              A quiet place to deepen your practice, continue your learning, and return to Susan’s guidance whenever you need it.
            </p>
          </div>

          <div className="rounded-[1.5rem] border border-white/10 bg-white/7 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs tracking-[0.16em] text-[#aeb2c2] uppercase">Course journey</span>
              <span className="text-sm font-semibold text-[#c9a84c]">{dashboard.data?.progress.percent ?? 0}%</span>
            </div>
            <Progress value={dashboard.data?.progress.percent ?? 0} className="mt-4 h-2 bg-white/10 [&>div]:bg-[#c9a84c]" />
            <p className="mt-4 text-sm leading-6 text-[#d6d8e2]">
              {dashboard.data?.progress.completedLessons ?? 0} of {dashboard.data?.progress.totalLessons ?? 0} published lessons complete
            </p>
          </div>
        </div>
      </section>

      {dashboard.data?.continueLearning ? (
        <section className="mt-8 rounded-[1.75rem] border border-[#d9d2c2] bg-white p-6 shadow-[0_18px_50px_rgba(23,32,68,0.07)] sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e7f0ec] text-[#246866]">
              <PlayCircle className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#2d7777] uppercase">Continue learning</p>
              <h2 className="mt-2 font-serif text-2xl text-[#172044]">{dashboard.data.continueLearning.lessonTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{dashboard.data.continueLearning.courseTitle}</p>
            </div>
          </div>
          <Button asChild className="mt-5 rounded-full bg-[#0e1634] px-6 text-[#f5edd6] sm:mt-0">
            <Link href={`/courses/${dashboard.data.continueLearning.courseSlug}?lesson=${dashboard.data.continueLearning.lessonSlug}`}>
              Continue <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </section>
      ) : null}

      <section className="mt-12">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Continue your journey</p>
            <h2 className="mt-3 font-serif text-4xl text-[#172044]">Everything in one place</h2>
          </div>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {quickLinks.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group rounded-[1.75rem] border border-[#ddd5c5] bg-white p-6 shadow-[0_16px_45px_rgba(23,32,68,0.06)] transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[#c9a84c]/60 hover:shadow-[0_24px_55px_rgba(23,32,68,0.11)] sm:p-7"
              >
                <div className={`grid size-12 place-items-center rounded-2xl ${item.accent}`}>
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-8 font-serif text-2xl text-[#172044]">{item.title}</h3>
                <p className="mt-3 min-h-18 text-sm leading-6 text-muted-foreground">{item.description}</p>
                <span className="mt-6 flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-[#2d7777] uppercase">
                  Explore <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-14">
        <div className="mb-6">
          <p className="eyebrow">Your path</p>
          <h2 className="mt-3 font-serif text-4xl text-[#172044]">Recent activity</h2>
        </div>

        {dashboard.data?.recentActivity.length ? (
          <div className="overflow-hidden rounded-[1.75rem] border border-[#ddd5c5] bg-white shadow-[0_16px_45px_rgba(23,32,68,0.05)]">
            {dashboard.data.recentActivity.map((activity, index) => (
              <div key={activity.id} className={`flex items-center gap-4 px-5 py-5 sm:px-7 ${index ? "border-t border-[#ebe5d9]" : ""}`}>
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f4ead0] text-[#8b6a19]">
                  {activity.type === "lesson_completed" ? <CheckCircle2 className="size-4" /> : <Clock3 className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#172044]">{activity.titleSnapshot}</p>
                  <p className="mt-1 text-xs capitalize text-muted-foreground">{activity.type.replaceAll("_", " ")}</p>
                </div>
                <time className="hidden text-xs text-muted-foreground sm:block">{new Date(activity.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</time>
              </div>
            ))}
          </div>
        ) : (
          <EmptyState
            eyebrow="A fresh beginning"
            title="Your journey starts here"
            description="When you open a teaching, begin a lesson, or visit one of Susan’s apps, your recent activity will appear here."
          />
        )}
      </section>
    </main>
  );
}

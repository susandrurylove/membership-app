import { useAuth } from "@/_core/hooks/useAuth";
import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { SUSAN_LOGO } from "@/lib/brandAssets";
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
    accent: "bg-[#e7f1ed] text-[#2f7772]",
  },
  {
    href: "/courses",
    title: "Your Courses",
    description: "Continue step by step and keep your place across every lesson.",
    icon: BookHeart,
    accent: "bg-[#f5ead0] text-[#77580f]",
  },
  {
    href: "/apps",
    title: "Susan’s Apps",
    description: "Open Elevate To Love, Enlightened Body, and Tao Interactive.",
    icon: Sparkles,
    accent: "bg-[#efe9f2] text-[#6d5577]",
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
      <section className="brand-hero rounded-[2.25rem] px-5 py-10 sm:px-9 sm:py-12 lg:px-12 lg:py-14">
        <img src={SUSAN_LOGO.hero} alt="" className="pointer-events-none absolute right-7 top-1/2 z-[1] hidden h-52 w-auto -translate-y-1/2 object-contain opacity-[0.13] md:block lg:right-12 lg:h-64" />
        <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div className="relative z-[2]">
            <p className="brand-eyebrow">Your private sanctuary</p>
            <div className="brand-gold-rule mt-5" />
            <h1 className="mt-6 max-w-3xl font-serif text-4xl leading-[1.08] text-[#fdfaf5] sm:text-5xl lg:text-6xl">
              Welcome{firstName ? `, ${firstName}` : ""}.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#e8e4da] sm:text-lg sm:leading-8">
              A quiet place to deepen your practice, continue your learning, and return to Susan’s guidance whenever you need it.
            </p>
          </div>

          <div className="relative z-[2] rounded-[1.5rem] border border-[#c9a84c]/45 bg-[#fdfaf5]/96 p-5 shadow-[0_16px_42px_rgba(10,14,40,0.18)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold tracking-[0.15em] text-[#52666d] uppercase">Course journey</span>
              <span className="text-sm font-semibold text-[#205f60]">{dashboard.data?.progress.percent ?? 0}%</span>
            </div>
            <Progress aria-label="Overall course completion" value={dashboard.data?.progress.percent ?? 0} className="mt-4 h-2 bg-[#e8dfcf] [&>div]:bg-[#c9a84c]" />
            <p className="mt-4 text-sm leading-6 text-[#64747a]">
              {dashboard.data?.progress.completedLessons ?? 0} of {dashboard.data?.progress.totalLessons ?? 0} published lessons complete
            </p>
          </div>
        </div>
      </section>

      {dashboard.data?.continueLearning ? (
        <section className="editorial-card mt-7 rounded-[1.75rem] p-5 sm:flex sm:items-center sm:justify-between sm:gap-6 sm:p-7">
          <div className="flex items-start gap-4">
            <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-[#e7f1ed] text-[#2f7772]">
              <PlayCircle className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold tracking-[0.2em] text-[#2f7772] uppercase">Continue learning</p>
              <h2 className="mt-2 font-serif text-2xl text-[#243f4d]">{dashboard.data.continueLearning.lessonTitle}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{dashboard.data.continueLearning.courseTitle}</p>
            </div>
          </div>
          <Button asChild className="brand-button mt-5 w-full px-6 hover:bg-[#205f60] sm:mt-0 sm:w-auto">
            <Link href={`/courses/${dashboard.data.continueLearning.courseSlug}?lesson=${dashboard.data.continueLearning.lessonSlug}`}>
              Continue <ArrowRight className="ml-2 size-4" />
            </Link>
          </Button>
        </section>
      ) : null}

      <section className="mt-11">
        <div className="mb-6">
          <p className="eyebrow">Continue your journey</p>
          <h2 className="mt-3 font-serif text-3xl text-[#243f4d] sm:text-4xl">Everything in one place</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {quickLinks.map(item => {
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="editorial-card group rounded-[1.75rem] p-5 transition-[transform,box-shadow,border-color] duration-300 hover:-translate-y-1 hover:border-[#c9a84c]/60 hover:shadow-[0_22px_52px_rgba(48,66,72,0.11)] focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-2 focus-visible:outline-none sm:p-7"
              >
                <div className={`grid size-12 place-items-center rounded-2xl ${item.accent}`}>
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-7 font-serif text-2xl text-[#243f4d]">{item.title}</h3>
                <p className="mt-3 text-sm leading-6 text-muted-foreground md:min-h-18">{item.description}</p>
                <span className="mt-6 flex items-center gap-2 text-xs font-bold tracking-[0.14em] text-[#2f7772] uppercase">
                  Explore <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      <section className="mt-12">
        <div className="mb-6">
          <p className="eyebrow">Your path</p>
          <h2 className="mt-3 font-serif text-3xl text-[#243f4d] sm:text-4xl">Recent activity</h2>
        </div>

        {dashboard.data?.recentActivity.length ? (
          <div className="editorial-card overflow-hidden rounded-[1.75rem]">
            {dashboard.data.recentActivity.map((activity, index) => (
              <div key={activity.id} className={`flex items-center gap-4 px-5 py-5 sm:px-7 ${index ? "border-t border-[#ebe3d5]" : ""}`}>
                <div className="grid size-10 shrink-0 place-items-center rounded-full bg-[#f4ead0] text-[#77580f]">
                  {activity.type === "lesson_completed" ? <CheckCircle2 className="size-4" /> : <Clock3 className="size-4" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-[#243f4d]">{activity.titleSnapshot}</p>
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

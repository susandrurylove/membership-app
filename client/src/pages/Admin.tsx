import { QueryErrorState } from "@/components/QueryErrorState";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { trpc } from "@/lib/trpc";
import { BookOpenText, GraduationCap, ImageIcon, Sparkles, Users } from "lucide-react";
import { CoursesPanel } from "./admin/CoursesPanel";
import { MediaPanel } from "./admin/MediaPanel";
import { MembersPanel } from "./admin/MembersPanel";
import { TeachingsPanel } from "./admin/TeachingsPanel";

const metrics = [
  { key: "activeMembers", label: "Active members", icon: Users, accent: "bg-[#e7f0ec] text-[#246866]" },
  { key: "publishedTeachings", label: "Published teachings", icon: BookOpenText, accent: "bg-[#f4ead0] text-[#77580f]" },
  { key: "publishedCourses", label: "Published courses", icon: GraduationCap, accent: "bg-[#ece8f4] text-[#5d4f7b]" },
  { key: "mediaAssets", label: "Media files", icon: ImageIcon, accent: "bg-[#f4e5e9] text-[#8a435d]" },
] as const;

const adminTabs = ["overview", "members", "teachings", "courses", "media"] as const;

function OverviewPanel() {
  const overview = trpc.admin.overview.useQuery();
  if (overview.error) return <QueryErrorState title="Administration metrics could not be loaded" onRetry={() => void overview.refetch()} />;
  if (overview.isLoading) return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(item => <Skeleton key={item.key} className="h-40 rounded-[1.5rem]" />)}</div>;

  return (
    <div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map(item => {
          const Icon = item.icon;
          return (
            <div key={item.key} className="editorial-card rounded-[1.5rem] p-5">
              <div className={`grid size-10 place-items-center rounded-xl ${item.accent}`}><Icon className="size-4" /></div>
              <p className="mt-5 font-serif text-3xl text-[#243f4d] sm:text-4xl">{overview.data?.[item.key] ?? 0}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-7 rounded-[1.75rem] border border-[#d8c99f] bg-[#eef3e8] p-6 text-[#243f4d] shadow-[0_18px_50px_rgba(54,72,73,0.08)] sm:p-9">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-[#f2e3b9] text-[#77580f]"><Sparkles className="size-5" /></div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.22em] text-[#2f7772] uppercase">Susan’s studio</p>
            <h2 className="mt-3 font-serif text-2xl sm:text-3xl">Everything you publish flows directly to members</h2>
            <p className="mt-4 max-w-3xl leading-7 text-[#607176]">Use the tabs above to invite and manage clients, prepare teachings, organize course lessons, and upload media. Draft content remains private until you publish it.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const requestedTab = import.meta.env.DEV ? new URLSearchParams(window.location.search).get("tab") : null;
  const initialTab = adminTabs.includes(requestedTab as (typeof adminTabs)[number]) ? requestedTab! : "overview";
  const qaFocusedTab = import.meta.env.DEV ? new URLSearchParams(window.location.search).get("qa-focus-admin") : null;
  const tabClassName = (value: string) => `rounded-xl px-2 py-2.5 text-xs focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:ring-offset-2 sm:px-4 sm:text-sm ${qaFocusedTab === value ? "ring-2 ring-[#c9a84c] ring-offset-2" : ""}`;

  return (
    <main className="portal-page">
      <header className="max-w-4xl">
        <p className="eyebrow">Private administration</p>
        <h1 className="mt-3 font-serif text-4xl leading-tight text-[#243f4d] sm:text-5xl lg:text-6xl">Susan’s Studio</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">Manage member access, teachings, courses, lessons, and media without changing code.</p>
      </header>

      <Tabs
        defaultValue={initialTab}
        className="mt-9"
        onValueChange={value => {
          if (!import.meta.env.DEV) return;
          const url = new URL(window.location.href);
          url.searchParams.set("tab", value);
          url.searchParams.delete("dialog");
          window.history.replaceState(null, "", url);
        }}
      >
        <TabsList className="grid h-auto w-full grid-cols-3 gap-1 rounded-2xl border border-[#ddd3c0] bg-[#fffdf8] p-1.5 shadow-sm sm:grid-cols-5">
          <TabsTrigger value="overview" className={tabClassName("overview")}>Overview</TabsTrigger>
          <TabsTrigger value="members" className={tabClassName("members")}>Members</TabsTrigger>
          <TabsTrigger value="teachings" className={tabClassName("teachings")}>Teachings</TabsTrigger>
          <TabsTrigger value="courses" className={tabClassName("courses")}>Courses</TabsTrigger>
          <TabsTrigger value="media" className={tabClassName("media")}>Media</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-7"><OverviewPanel /></TabsContent>
        <TabsContent value="members" className="mt-7"><MembersPanel /></TabsContent>
        <TabsContent value="teachings" className="mt-7"><TeachingsPanel /></TabsContent>
        <TabsContent value="courses" className="mt-7"><CoursesPanel /></TabsContent>
        <TabsContent value="media" className="mt-7"><MediaPanel /></TabsContent>
      </Tabs>
    </main>
  );
}

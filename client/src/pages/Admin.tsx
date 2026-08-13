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
  { key: "publishedTeachings", label: "Published teachings", icon: BookOpenText, accent: "bg-[#f4ead0] text-[#8b6a19]" },
  { key: "publishedCourses", label: "Published courses", icon: GraduationCap, accent: "bg-[#ece8f4] text-[#5d4f7b]" },
  { key: "mediaAssets", label: "Media files", icon: ImageIcon, accent: "bg-[#f4e5e9] text-[#8a435d]" },
] as const;

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
            <div key={item.key} className="rounded-[1.5rem] border border-[#ddd5c5] bg-white p-5 shadow-[0_14px_40px_rgba(23,32,68,0.05)]">
              <div className={`grid size-10 place-items-center rounded-xl ${item.accent}`}><Icon className="size-4" /></div>
              <p className="mt-6 font-serif text-4xl text-[#172044]">{overview.data?.[item.key] ?? 0}</p>
              <p className="mt-2 text-sm text-muted-foreground">{item.label}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-7 rounded-[1.75rem] border border-[#c9a84c]/45 bg-[#0e1634] p-7 text-[#f5edd6] shadow-[0_20px_55px_rgba(14,22,52,0.16)] sm:p-9">
        <div className="flex items-start gap-4">
          <div className="grid size-12 shrink-0 place-items-center rounded-full bg-[#c9a84c] text-[#0e1634]"><Sparkles className="size-5" /></div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.22em] text-[#c9a84c] uppercase">Susan’s studio</p>
            <h2 className="mt-3 font-serif text-3xl">Everything you publish flows directly to members</h2>
            <p className="mt-4 max-w-3xl leading-7 text-[#d6d8e2]">Use the tabs above to invite and manage clients, prepare teachings, organize course lessons, and upload media. Draft content remains private until you publish it.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  return (
    <main className="portal-page">
      <header className="max-w-4xl">
        <p className="eyebrow">Private administration</p>
        <h1 className="mt-4 font-serif text-5xl leading-tight text-[#172044] sm:text-6xl">Susan’s Studio</h1>
        <p className="mt-5 max-w-3xl text-base leading-8 text-muted-foreground sm:text-lg">Manage member access, teachings, courses, lessons, and media without changing code.</p>
      </header>

      <Tabs defaultValue="overview" className="mt-9">
        <TabsList className="h-auto w-full justify-start gap-1 overflow-x-auto rounded-2xl border border-[#ddd5c5] bg-white p-1.5 shadow-sm">
          <TabsTrigger value="overview" className="shrink-0 rounded-xl px-4 py-2.5">Overview</TabsTrigger>
          <TabsTrigger value="members" className="shrink-0 rounded-xl px-4 py-2.5">Members</TabsTrigger>
          <TabsTrigger value="teachings" className="shrink-0 rounded-xl px-4 py-2.5">Teachings</TabsTrigger>
          <TabsTrigger value="courses" className="shrink-0 rounded-xl px-4 py-2.5">Courses</TabsTrigger>
          <TabsTrigger value="media" className="shrink-0 rounded-xl px-4 py-2.5">Media</TabsTrigger>
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


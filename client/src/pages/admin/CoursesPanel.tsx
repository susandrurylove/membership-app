import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, BookOpen, Layers3, Loader2, Pencil, Plus, Settings2 } from "lucide-react";
import { useState } from "react";

type PublicationStatus = "draft" | "published" | "archived";
type ContentType = "video" | "audio" | "image" | "text" | "mixed";

export function CoursesPanel() {
  const [createOpen, setCreateOpen] = useState(
    () => import.meta.env.DEV && new URLSearchParams(window.location.search).get("dialog") === "course"
  );
  const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null);
  const courses = trpc.admin.courses.list.useQuery();
  const media = trpc.admin.media.list.useQuery();

  if (selectedCourseId) {
    return <CourseEditor courseId={selectedCourseId} media={media.data || []} onBack={() => setSelectedCourseId(null)} />;
  }

  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow">Structured learning</p><h2 className="mt-2 font-serif text-3xl text-[#243f4d]">Courses</h2></div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogTrigger asChild><Button className="w-full rounded-full bg-[#2f7772] px-6 text-white hover:bg-[#245f5c] sm:w-auto"><Plus className="mr-2 size-4" /> New course</Button></DialogTrigger><CourseDialog media={media.data || []} onComplete={id => { setCreateOpen(false); setSelectedCourseId(id); }} /></Dialog>
      </div>

      <div className="mt-6">
        {courses.error || media.error ? <QueryErrorState title="Course administration could not be loaded" onRetry={() => { void courses.refetch(); void media.refetch(); }} /> : courses.isLoading ? <Skeleton className="h-80 rounded-[1.5rem]" /> : courses.data?.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {courses.data.map(row => (
              <article key={row.course.id} className="editorial-card rounded-[1.5rem] p-5 sm:p-6">
                <div className="flex flex-wrap items-center gap-2"><Badge className={row.course.status === "published" ? "bg-[#e7f0ec] text-[#246866] hover:bg-[#e7f0ec]" : row.course.status === "draft" ? "bg-[#f4ead0] text-[#8b6a19] hover:bg-[#f4ead0]" : "bg-[#eee] text-[#666] hover:bg-[#eee]"}>{row.course.status}</Badge><Badge variant="outline">{row.lessonCount} lessons</Badge></div>
                <h3 className="mt-5 font-serif text-3xl text-[#243f4d]">{row.course.title}</h3>
                <p className="mt-3 line-clamp-2 min-h-12 text-sm leading-6 text-muted-foreground">{row.course.summary || "No course introduction yet."}</p>
                <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap"><Button className="rounded-full bg-[#2f7772] text-white hover:bg-[#245f5c]" onClick={() => setSelectedCourseId(row.course.id)}><Settings2 className="mr-2 size-4" /> Manage lessons</Button><Dialog><DialogTrigger asChild><Button variant="outline" className="w-full rounded-full bg-white sm:w-auto"><Pencil className="mr-2 size-4" /> Edit course</Button></DialogTrigger><CourseDialog record={row.course} media={media.data || []} /></Dialog></div>
              </article>
            ))}
          </div>
        ) : <EmptyState eyebrow="Course studio" title="Create Susan’s first course" description="Create the course shell, then organize it into sections and lessons. Drafts remain visible only to administrators." />}
      </div>
    </section>
  );
}

function CourseDialog({ record, media, onComplete }: { record?: any; media: any[]; onComplete?: (id: number) => void }) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(record?.title || "");
  const [summary, setSummary] = useState(record?.summary || "");
  const [description, setDescription] = useState(record?.description || "");
  const [status, setStatus] = useState<PublicationStatus>(record?.status || "draft");
  const [minutes, setMinutes] = useState(record?.estimatedMinutes ? String(record.estimatedMinutes) : "");
  const [sortOrder, setSortOrder] = useState(String(record?.sortOrder || 0));
  const [coverAssetId, setCoverAssetId] = useState(record?.coverAssetId ? String(record.coverAssetId) : "none");
  const save = trpc.admin.courses.save.useMutation({ onSuccess: id => { void utils.admin.courses.list.invalidate(); void utils.admin.overview.invalidate(); void utils.member.courses.list.invalidate(); onComplete?.(id); } });

  return <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-[1.5rem] p-5 sm:p-6"><DialogHeader className="pr-6"><DialogTitle className="font-serif text-2xl sm:text-3xl">{record ? "Edit course" : "New course"}</DialogTitle><DialogDescription>Create the course overview here, then manage sections and lessons.</DialogDescription></DialogHeader><form className="mt-3 space-y-5" onSubmit={event => { event.preventDefault(); save.mutate({ id: record?.id, title, summary: summary || null, description: description || null, status, estimatedMinutes: minutes ? Number(minutes) : null, sortOrder: Number(sortOrder) || 0, coverAssetId: coverAssetId === "none" ? null : Number(coverAssetId) }); }}><div className="space-y-2"><Label htmlFor="course-title">Course title</Label><Input id="course-title" required value={title} onChange={event => setTitle(event.target.value)} /></div><div className="space-y-2"><Label>Short introduction</Label><Textarea rows={3} value={summary} onChange={event => setSummary(event.target.value)} /></div><div className="space-y-2"><Label>Full description</Label><Textarea rows={6} value={description} onChange={event => setDescription(event.target.value)} placeholder="Markdown is supported." /></div><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label>Status</Label><Select value={status} onValueChange={value => setStatus(value as PublicationStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Cover image</Label><Select value={coverAssetId} onValueChange={setCoverAssetId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No cover image</SelectItem>{media.filter(asset => asset.kind === "image").map(asset => <SelectItem key={asset.id} value={String(asset.id)}>{asset.originalName}</SelectItem>)}</SelectContent></Select></div></div><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label>Estimated minutes</Label><Input type="number" min="1" value={minutes} onChange={event => setMinutes(event.target.value)} /></div><div className="space-y-2"><Label>Display order</Label><Input type="number" min="0" value={sortOrder} onChange={event => setSortOrder(event.target.value)} /></div></div>{save.error ? <p role="alert" className="rounded-xl bg-[#fff8f4] p-3 text-sm text-[#823b32]">{save.error.message}</p> : null}<div className="flex justify-end"><Button disabled={save.isPending} className="w-full rounded-full bg-[#2f7772] px-7 text-white hover:bg-[#245f5c] sm:w-auto">{save.isPending ? <Loader2 className="size-4 animate-spin" /> : record ? "Save course" : "Create course"}</Button></div></form></DialogContent>;
}

function CourseEditor({ courseId, media, onBack }: { courseId: number; media: any[]; onBack: () => void }) {
  const detail = trpc.admin.courses.detail.useQuery({ courseId });
  const [sectionOpen, setSectionOpen] = useState(false);
  const [lessonOpen, setLessonOpen] = useState(false);

  if (detail.error) return <div><Button variant="ghost" onClick={onBack}><ArrowLeft className="mr-2 size-4" /> Back to courses</Button><div className="mt-5"><QueryErrorState title="The course editor could not be loaded" onRetry={() => void detail.refetch()} /></div></div>;
  if (detail.isLoading || !detail.data) return <Skeleton className="h-96 rounded-[1.5rem]" />;
  const { course, sections, lessons } = detail.data;
  const unsectioned = lessons.filter(lesson => !lesson.sectionId);

  return (
    <section>
      <Button variant="ghost" className="-ml-3" onClick={onBack}><ArrowLeft className="mr-2 size-4" /> Back to courses</Button>
      <div className="mt-4 flex flex-col gap-5 rounded-[1.75rem] border border-[#c9dbd4] bg-[#e5f0eb] p-5 text-[#243f4d] shadow-[0_16px_45px_rgba(48,66,72,0.07)] sm:p-7 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] font-bold tracking-[0.2em] text-[#2f7772] uppercase">Course editor</p><h2 className="mt-2 font-serif text-3xl sm:text-4xl">{course.title}</h2><p className="mt-2 text-sm text-[#627479]">{lessons.length} lessons · {sections.length} sections · {course.status}</p></div><div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap"><Dialog open={sectionOpen} onOpenChange={setSectionOpen}><DialogTrigger asChild><Button variant="outline" className="rounded-full border-[#b9cec6] bg-white text-[#2f7772]"><Layers3 className="mr-2 size-4" /> Add section</Button></DialogTrigger><SectionDialog courseId={courseId} onComplete={() => setSectionOpen(false)} /></Dialog><Dialog open={lessonOpen} onOpenChange={setLessonOpen}><DialogTrigger asChild><Button className="rounded-full bg-[#2f7772] text-white hover:bg-[#245f5c]"><Plus className="mr-2 size-4" /> Add lesson</Button></DialogTrigger><LessonDialog courseId={courseId} sections={sections} media={media} onComplete={() => setLessonOpen(false)} /></Dialog></div></div>

      <div className="mt-7 space-y-5">
        {sections.map(section => {
          const sectionLessons = lessons.filter(lesson => lesson.sectionId === section.id);
          return <article key={section.id} className="editorial-card rounded-[1.5rem] p-5"><div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-[10px] font-bold tracking-[0.18em] text-[#8b6a19] uppercase">Section {section.sortOrder + 1}</p><h3 className="mt-1 font-serif text-2xl text-[#243f4d]">{section.title}</h3></div><Dialog><DialogTrigger asChild><Button variant="ghost" size="sm"><Pencil className="mr-2 size-4" /> Edit section</Button></DialogTrigger><SectionDialog record={section} courseId={courseId} /></Dialog></div><div className="mt-4 space-y-2">{sectionLessons.length ? sectionLessons.map(lesson => <LessonRow key={lesson.id} lesson={lesson} courseId={courseId} sections={sections} media={media} />) : <p className="rounded-xl bg-[#f7f2e8] px-4 py-3 text-sm text-muted-foreground">No lessons in this section yet.</p>}</div></article>;
        })}
        {unsectioned.length ? <article className="editorial-card rounded-[1.5rem] p-5"><h3 className="font-serif text-2xl text-[#243f4d]">Unsectioned lessons</h3><div className="mt-4 space-y-2">{unsectioned.map(lesson => <LessonRow key={lesson.id} lesson={lesson} courseId={courseId} sections={sections} media={media} />)}</div></article> : null}
        {!sections.length && !lessons.length ? <EmptyState eyebrow="Course structure" title="Add the first section or lesson" description="Sections organize the course journey. Lessons can also remain unsectioned when a simpler course structure is appropriate." /> : null}
      </div>
    </section>
  );
}

function LessonRow({ lesson, courseId, sections, media }: { lesson: any; courseId: number; sections: any[]; media: any[] }) {
  return <div className="flex flex-col gap-3 rounded-xl border border-[#ebe5d9] px-4 py-3 sm:flex-row sm:items-center sm:justify-between"><div className="flex min-w-0 items-center gap-3"><div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#e7f0ec] text-[#246866]"><BookOpen className="size-4" /></div><div className="min-w-0"><p className="truncate font-medium text-[#243f4d]">{lesson.title}</p><p className="mt-0.5 text-xs text-muted-foreground capitalize">{lesson.contentType} · {lesson.status} · order {lesson.sortOrder}</p></div></div><Dialog><DialogTrigger asChild><Button variant="ghost" size="sm" className="self-start sm:self-auto"><Pencil className="mr-2 size-4" /> Edit</Button></DialogTrigger><LessonDialog record={lesson} courseId={courseId} sections={sections} media={media} /></Dialog></div>;
}

function SectionDialog({ record, courseId, onComplete }: { record?: any; courseId: number; onComplete?: () => void }) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(record?.title || "");
  const [description, setDescription] = useState(record?.description || "");
  const [sortOrder, setSortOrder] = useState(String(record?.sortOrder || 0));
  const save = trpc.admin.courses.saveSection.useMutation({ onSuccess: () => { void utils.admin.courses.detail.invalidate({ courseId }); onComplete?.(); } });
  return <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-lg overflow-y-auto rounded-[1.5rem] p-5 sm:p-6"><DialogHeader><DialogTitle className="font-serif text-3xl">{record ? "Edit section" : "New section"}</DialogTitle><DialogDescription>Sections group related lessons into a clear path.</DialogDescription></DialogHeader><form className="mt-3 space-y-5" onSubmit={event => { event.preventDefault(); save.mutate({ id: record?.id, courseId, title, description: description || null, sortOrder: Number(sortOrder) || 0 }); }}><div className="space-y-2"><Label>Title</Label><Input required value={title} onChange={event => setTitle(event.target.value)} /></div><div className="space-y-2"><Label>Description</Label><Textarea value={description} onChange={event => setDescription(event.target.value)} /></div><div className="space-y-2"><Label>Order</Label><Input type="number" min="0" value={sortOrder} onChange={event => setSortOrder(event.target.value)} /></div>{save.error ? <p className="text-sm text-[#823b32]">{save.error.message}</p> : null}<div className="flex justify-end"><Button disabled={save.isPending} className="w-full rounded-full bg-[#2f7772] px-6 text-white hover:bg-[#245f5c] sm:w-auto">{save.isPending ? <Loader2 className="size-4 animate-spin" /> : "Save section"}</Button></div></form></DialogContent>;
}

function LessonDialog({ record, courseId, sections, media, onComplete }: { record?: any; courseId: number; sections: any[]; media: any[]; onComplete?: () => void }) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(record?.title || "");
  const [summary, setSummary] = useState(record?.summary || "");
  const [body, setBody] = useState(record?.body || "");
  const [sectionId, setSectionId] = useState(record?.sectionId ? String(record.sectionId) : "none");
  const [contentType, setContentType] = useState<ContentType>(record?.contentType || "text");
  const [mediaAssetId, setMediaAssetId] = useState(record?.mediaAssetId ? String(record.mediaAssetId) : "none");
  const [status, setStatus] = useState<PublicationStatus>(record?.status || "draft");
  const [minutes, setMinutes] = useState(record?.estimatedMinutes ? String(record.estimatedMinutes) : "");
  const [sortOrder, setSortOrder] = useState(String(record?.sortOrder || 0));
  const save = trpc.admin.courses.saveLesson.useMutation({ onSuccess: () => { void utils.admin.courses.detail.invalidate({ courseId }); void utils.admin.courses.list.invalidate(); void utils.member.courses.list.invalidate(); onComplete?.(); } });
  return <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-[1.5rem] p-5 sm:p-6"><DialogHeader><DialogTitle className="font-serif text-3xl">{record ? "Edit lesson" : "New lesson"}</DialogTitle><DialogDescription>Attach uploaded media, add written guidance, and publish when ready.</DialogDescription></DialogHeader><form className="mt-3 space-y-5" onSubmit={event => { event.preventDefault(); save.mutate({ id: record?.id, courseId, sectionId: sectionId === "none" ? null : Number(sectionId), title, summary: summary || null, body: body || null, contentType, mediaAssetId: mediaAssetId === "none" ? null : Number(mediaAssetId), status, estimatedMinutes: minutes ? Number(minutes) : null, sortOrder: Number(sortOrder) || 0 }); }}><div className="space-y-2"><Label>Lesson title</Label><Input required value={title} onChange={event => setTitle(event.target.value)} /></div><div className="space-y-2"><Label>Short introduction</Label><Textarea rows={3} value={summary} onChange={event => setSummary(event.target.value)} /></div><div className="grid gap-5 sm:grid-cols-3"><div className="space-y-2"><Label>Section</Label><Select value={sectionId} onValueChange={setSectionId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No section</SelectItem>{sections.map(section => <SelectItem key={section.id} value={String(section.id)}>{section.title}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Format</Label><Select value={contentType} onValueChange={value => setContentType(value as ContentType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="text">Text</SelectItem><SelectItem value="image">Image</SelectItem><SelectItem value="audio">Audio</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="mixed">Mixed</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Status</Label><Select value={status} onValueChange={value => setStatus(value as PublicationStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div></div><div className="space-y-2"><Label>Media file</Label><Select value={mediaAssetId} onValueChange={setMediaAssetId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No media</SelectItem>{media.map(asset => <SelectItem key={asset.id} value={String(asset.id)}>{asset.originalName}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Written lesson</Label><Textarea rows={9} value={body} onChange={event => setBody(event.target.value)} placeholder="Markdown is supported." /></div><div className="grid gap-5 sm:grid-cols-2"><div className="space-y-2"><Label>Estimated minutes</Label><Input type="number" min="1" value={minutes} onChange={event => setMinutes(event.target.value)} /></div><div className="space-y-2"><Label>Order</Label><Input type="number" min="0" value={sortOrder} onChange={event => setSortOrder(event.target.value)} /></div></div>{save.error ? <p role="alert" className="rounded-xl bg-[#fff8f4] p-3 text-sm text-[#823b32]">{save.error.message}</p> : null}<div className="flex justify-end"><Button disabled={save.isPending} className="w-full rounded-full bg-[#2f7772] px-7 text-white hover:bg-[#245f5c] sm:w-auto">{save.isPending ? <Loader2 className="size-4 animate-spin" /> : "Save lesson"}</Button></div></form></DialogContent>;
}

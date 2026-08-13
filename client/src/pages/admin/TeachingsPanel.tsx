import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { trpc } from "@/lib/trpc";
import { FolderPlus, Loader2, Pencil, Plus } from "lucide-react";
import { useState } from "react";

type PublicationStatus = "draft" | "published" | "archived";
type ContentType = "video" | "audio" | "image" | "text" | "mixed";

export function TeachingsPanel() {
  const [createOpen, setCreateOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const teachings = trpc.admin.teachings.list.useQuery();
  const categories = trpc.admin.categories.list.useQuery();
  const media = trpc.admin.media.list.useQuery();

  const error = teachings.error || categories.error || media.error;
  return (
    <section>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="eyebrow">Library publishing</p><h2 className="mt-2 font-serif text-3xl text-[#172044]">Teachings</h2></div>
        <div className="flex flex-wrap gap-3">
          <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}><DialogTrigger asChild><Button variant="outline" className="rounded-full bg-white"><FolderPlus className="mr-2 size-4" /> New category</Button></DialogTrigger><CategoryDialog onComplete={() => setCategoryOpen(false)} /></Dialog>
          <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogTrigger asChild><Button className="rounded-full bg-[#0e1634] px-6 text-white"><Plus className="mr-2 size-4" /> New teaching</Button></DialogTrigger><TeachingDialog categories={categories.data || []} media={media.data || []} onComplete={() => setCreateOpen(false)} /></Dialog>
        </div>
      </div>

      <div className="mt-6">
        {error ? <QueryErrorState title="Teaching administration could not be loaded" onRetry={() => { void teachings.refetch(); void categories.refetch(); void media.refetch(); }} /> : teachings.isLoading ? <Skeleton className="h-80 rounded-[1.5rem]" /> : teachings.data?.length ? (
          <div className="space-y-3">
            {teachings.data.map(row => (
              <article key={row.teaching.id} className="flex flex-col gap-5 rounded-[1.5rem] border border-[#ddd5c5] bg-white p-5 shadow-[0_12px_35px_rgba(23,32,68,0.04)] sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge className={row.teaching.status === "published" ? "bg-[#e7f0ec] text-[#246866] hover:bg-[#e7f0ec]" : row.teaching.status === "draft" ? "bg-[#f4ead0] text-[#8b6a19] hover:bg-[#f4ead0]" : "bg-[#eee] text-[#666] hover:bg-[#eee]"}>{row.teaching.status}</Badge><Badge variant="outline" className="capitalize">{row.teaching.contentType}</Badge>{row.teaching.featured ? <Badge variant="outline" className="border-[#c9a84c] text-[#8b6a19]">Featured</Badge> : null}</div><h3 className="mt-3 truncate font-serif text-2xl text-[#172044]">{row.teaching.title}</h3><p className="mt-1 text-xs text-muted-foreground">{row.category?.name || "Uncategorized"} · Updated {new Date(row.teaching.updatedAt).toLocaleDateString()}</p></div>
                <Dialog><DialogTrigger asChild><Button variant="outline" className="shrink-0 rounded-full bg-white"><Pencil className="mr-2 size-4" /> Edit</Button></DialogTrigger><TeachingDialog record={row.teaching} categories={categories.data || []} media={media.data || []} /></Dialog>
              </article>
            ))}
          </div>
        ) : <EmptyState eyebrow="Teaching library" title="Create Susan’s first teaching" description="Add a written reflection or attach an uploaded image, audio file, or video. Keep it in draft until it is ready for members." />}
      </div>
    </section>
  );
}

function CategoryDialog({ onComplete }: { onComplete: () => void }) {
  const utils = trpc.useUtils();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const save = trpc.admin.categories.save.useMutation({ onSuccess: () => { void utils.admin.categories.list.invalidate(); void utils.member.teachings.categories.invalidate(); onComplete(); } });
  return <DialogContent className="max-w-lg rounded-[1.5rem]"><DialogHeader><DialogTitle className="font-serif text-3xl">New teaching category</DialogTitle><DialogDescription>Categories help members browse Susan’s library.</DialogDescription></DialogHeader><form className="mt-3 space-y-5" onSubmit={event => { event.preventDefault(); save.mutate({ name, description: description || null, sortOrder: 0 }); }}><div className="space-y-2"><Label htmlFor="category-name">Name</Label><Input id="category-name" required value={name} onChange={event => setName(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="category-description">Description</Label><Textarea id="category-description" value={description} onChange={event => setDescription(event.target.value)} /></div>{save.error ? <p role="alert" className="text-sm text-[#823b32]">{save.error.message}</p> : null}<div className="flex justify-end"><Button disabled={save.isPending} className="rounded-full bg-[#0e1634] px-6">{save.isPending ? <Loader2 className="size-4 animate-spin" /> : "Create category"}</Button></div></form></DialogContent>;
}

function TeachingDialog({ record, categories, media, onComplete }: { record?: any; categories: any[]; media: any[]; onComplete?: () => void }) {
  const utils = trpc.useUtils();
  const [title, setTitle] = useState(record?.title || "");
  const [summary, setSummary] = useState(record?.summary || "");
  const [body, setBody] = useState(record?.body || "");
  const [categoryId, setCategoryId] = useState(record?.categoryId ? String(record.categoryId) : "none");
  const [contentType, setContentType] = useState<ContentType>(record?.contentType || "text");
  const [status, setStatus] = useState<PublicationStatus>(record?.status || "draft");
  const [featured, setFeatured] = useState(Boolean(record?.featured));
  const [sortOrder, setSortOrder] = useState(String(record?.sortOrder || 0));
  const [mediaAssetId, setMediaAssetId] = useState("none");
  const save = trpc.admin.teachings.save.useMutation({
    onSuccess: () => {
      void utils.admin.teachings.list.invalidate();
      void utils.admin.overview.invalidate();
      void utils.member.teachings.list.invalidate();
      onComplete?.();
    },
  });

  return (
    <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto rounded-[1.5rem]">
      <DialogHeader><DialogTitle className="font-serif text-3xl">{record ? "Edit teaching" : "New teaching"}</DialogTitle><DialogDescription>Use Markdown for headings, emphasis, links, and lists in the written body.</DialogDescription></DialogHeader>
      <form className="mt-3 space-y-5" onSubmit={event => { event.preventDefault(); save.mutate({ id: record?.id, title, summary: summary || null, body: body || null, categoryId: categoryId === "none" ? null : Number(categoryId), contentType, status, featured, sortOrder: Number(sortOrder) || 0, mediaAssetId: mediaAssetId === "none" ? null : Number(mediaAssetId) }); }}>
        <div className="space-y-2"><Label htmlFor={`teaching-title-${record?.id || "new"}`}>Title</Label><Input id={`teaching-title-${record?.id || "new"}`} required value={title} onChange={event => setTitle(event.target.value)} /></div>
        <div className="space-y-2"><Label>Short introduction</Label><Textarea value={summary} onChange={event => setSummary(event.target.value)} rows={3} /></div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"><div className="space-y-2"><Label>Category</Label><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">No category</SelectItem>{categories.map(category => <SelectItem key={category.id} value={String(category.id)}>{category.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Format</Label><Select value={contentType} onValueChange={value => setContentType(value as ContentType)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="text">Text</SelectItem><SelectItem value="image">Image</SelectItem><SelectItem value="audio">Audio</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="mixed">Mixed</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Status</Label><Select value={status} onValueChange={value => setStatus(value as PublicationStatus)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Draft</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="archived">Archived</SelectItem></SelectContent></Select></div></div>
        <div className="space-y-2"><Label>Primary media</Label><Select value={mediaAssetId} onValueChange={setMediaAssetId}><SelectTrigger><SelectValue placeholder="Choose an uploaded file" /></SelectTrigger><SelectContent><SelectItem value="none">No new media</SelectItem>{media.map(asset => <SelectItem key={asset.id} value={String(asset.id)}>{asset.originalName}</SelectItem>)}</SelectContent></Select><p className="text-xs text-muted-foreground">Selecting “No new media” leaves an existing attachment unchanged while editing.</p></div>
        <div className="space-y-2"><Label>Written body</Label><Textarea value={body} onChange={event => setBody(event.target.value)} rows={10} placeholder="Write Susan’s teaching here…" /></div>
        <div className="grid gap-5 sm:grid-cols-[1fr_auto] sm:items-end"><div className="space-y-2"><Label>Display order</Label><Input type="number" min="0" value={sortOrder} onChange={event => setSortOrder(event.target.value)} /></div><label className="flex h-10 items-center gap-3 rounded-xl border border-[#ddd5c5] px-4"><Checkbox checked={featured} onCheckedChange={value => setFeatured(Boolean(value))} /><span className="text-sm">Feature this teaching</span></label></div>
        {save.error ? <p role="alert" className="rounded-xl bg-[#fff8f4] p-3 text-sm text-[#823b32]">{save.error.message}</p> : null}
        <div className="flex justify-end"><Button disabled={save.isPending} className="rounded-full bg-[#0e1634] px-7">{save.isPending ? <Loader2 className="size-4 animate-spin" /> : record ? "Save changes" : "Create teaching"}</Button></div>
      </form>
    </DialogContent>
  );
}

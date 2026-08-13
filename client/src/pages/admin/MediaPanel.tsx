import { EmptyState } from "@/components/EmptyState";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { File, FileAudio, FileVideo, ImageIcon, Loader2, UploadCloud } from "lucide-react";
import { useRef, useState } from "react";

const iconByKind = {
  video: FileVideo,
  audio: FileAudio,
  image: ImageIcon,
  document: File,
};

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MediaPanel() {
  const media = trpc.admin.media.list.useQuery();
  const utils = trpc.useUtils();
  const fileRef = useRef<HTMLInputElement>(null);
  const [altText, setAltText] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function uploadFile() {
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setUploadError("Choose a file first.");
      return;
    }
    setUploading(true);
    setUploadError(null);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("altText", altText);
    try {
      const response = await fetch("/api/admin/media/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(result.error || "The file could not be uploaded.");
      if (fileRef.current) fileRef.current.value = "";
      setAltText("");
      await utils.admin.media.list.invalidate();
      await utils.admin.overview.invalidate();
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : "The file could not be uploaded.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section>
      <div>
        <p className="eyebrow">Private object storage</p>
        <h2 className="mt-2 font-serif text-3xl text-[#172044]">Media library</h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">Upload an image, audio file, video, or PDF once, then attach it to a teaching or course lesson.</p>
      </div>

      <div className="mt-6 rounded-[1.5rem] border border-[#ddd5c5] bg-white p-6 shadow-[0_14px_40px_rgba(23,32,68,0.05)]">
        <div className="grid gap-5 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
          <div className="space-y-2"><Label htmlFor="media-file">File</Label><Input ref={fileRef} id="media-file" type="file" accept="video/mp4,video/webm,audio/mpeg,audio/mp4,audio/wav,image/jpeg,image/png,image/webp,image/gif,application/pdf" className="h-11 bg-white file:mr-3 file:font-semibold" /></div>
          <div className="space-y-2"><Label htmlFor="media-alt">Image description or media note</Label><Input id="media-alt" value={altText} onChange={event => setAltText(event.target.value)} placeholder="Describe the image for accessibility" /></div>
          <Button disabled={uploading} className="h-11 rounded-full bg-[#0e1634] px-6 text-white" onClick={() => void uploadFile()}>{uploading ? <Loader2 className="size-4 animate-spin" /> : <><UploadCloud className="mr-2 size-4" /> Upload</>}</Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">Maximum file size: 64 MB. Larger production videos should be uploaded directly to the configured S3-compatible bucket and registered through a future direct-upload workflow.</p>
        {uploadError ? <p role="alert" className="mt-4 rounded-xl bg-[#fff8f4] px-4 py-3 text-sm text-[#823b32]">{uploadError}</p> : null}
      </div>

      <div className="mt-7">
        {media.error ? <QueryErrorState title="The media library could not be loaded" onRetry={() => void media.refetch()} /> : media.isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{[0, 1, 2].map(item => <Skeleton key={item} className="h-32 rounded-[1.5rem]" />)}</div> : media.data?.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {media.data.map(asset => {
              const Icon = iconByKind[asset.kind];
              return (
                <article key={asset.id} className="rounded-[1.5rem] border border-[#ddd5c5] bg-white p-5 shadow-[0_12px_35px_rgba(23,32,68,0.04)]">
                  <div className="flex items-start gap-4"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-[#e7f0ec] text-[#246866]"><Icon className="size-5" /></div><div className="min-w-0"><p className="truncate font-medium text-[#172044]" title={asset.originalName}>{asset.originalName}</p><p className="mt-1 text-xs text-muted-foreground">{formatBytes(asset.byteSize)} · {new Date(asset.createdAt).toLocaleDateString()}</p></div></div>
                  <div className="mt-4 flex items-center justify-between"><Badge variant="outline" className="capitalize">{asset.kind}</Badge><span className="text-[10px] text-muted-foreground">ID {asset.id}</span></div>
                </article>
              );
            })}
          </div>
        ) : <EmptyState eyebrow="Media library" title="No files uploaded yet" description="Upload Susan’s first image, audio recording, video, or PDF. The file can then be selected while creating teachings and lessons." />}
      </div>
    </section>
  );
}

import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { FileAudio, FileVideo, ImageIcon } from "lucide-react";

type MediaAsset = {
  id: number;
  kind: "video" | "audio" | "image" | "document";
  originalName: string;
  mimeType: string;
  altText: string | null;
};

export function MediaViewer({ asset }: { asset: MediaAsset }) {
  const media = trpc.member.media.url.useQuery({ mediaId: asset.id }, { retry: false });

  if (media.isLoading) return <Skeleton className="aspect-video w-full rounded-[1.5rem]" />;
  if (media.error || !media.data) {
    return (
      <div role="alert" className="grid min-h-52 place-items-center rounded-[1.5rem] border border-dashed border-[#d7cfbd] bg-[#f7f2e8] p-6 text-center text-sm text-muted-foreground">
        <div>
          <p>This media file is temporarily unavailable.</p>
          <Button variant="outline" size="sm" className="mt-4 rounded-full bg-white" onClick={() => void media.refetch()}>Try again</Button>
        </div>
      </div>
    );
  }

  if (asset.kind === "video") {
    return (
      <div className="overflow-hidden rounded-[1.5rem] bg-[#0e1634] shadow-xl">
        <video controls preload="metadata" className="aspect-video w-full" src={media.data.url}>
          <track kind="captions" />
        </video>
      </div>
    );
  }

  if (asset.kind === "audio") {
    return (
      <div className="rounded-[1.5rem] border border-[#ddd5c5] bg-[#0e1634] p-6 text-[#f5edd6] shadow-xl sm:p-8">
        <div className="mb-6 flex items-center gap-4">
          <div className="grid size-12 place-items-center rounded-full bg-[#c9a84c] text-[#0e1634]"><FileAudio className="size-5" /></div>
          <div>
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#c9a84c] uppercase">Audio teaching</p>
            <p className="mt-1 text-sm text-[#d6d8e2]">{asset.originalName}</p>
          </div>
        </div>
        <audio controls preload="metadata" className="w-full" src={media.data.url} />
      </div>
    );
  }

  if (asset.kind === "image") {
    return (
      <figure className="overflow-hidden rounded-[1.5rem] border border-[#ddd5c5] bg-white shadow-xl">
        <img src={media.data.url} alt={asset.altText || "Teaching image"} className="h-auto w-full object-cover" />
      </figure>
    );
  }

  return (
    <a href={media.data.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 rounded-2xl border border-[#ddd5c5] bg-white p-5 text-[#172044] hover:border-[#c9a84c]">
      {asset.mimeType.startsWith("video/") ? <FileVideo className="size-5" /> : <ImageIcon className="size-5" />}
      Open {asset.originalName}
    </a>
  );
}

import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function QueryErrorState({
  title = "We could not open this area",
  description = "The connection was interrupted. Your account and progress are safe.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry: () => void;
}) {
  return (
    <div role="alert" className="rounded-[1.75rem] border border-[#b45a4d]/25 bg-[#fff8f4] px-6 py-10 text-center shadow-[0_16px_45px_rgba(23,32,68,0.05)]">
      <p className="text-[10px] font-bold tracking-[0.2em] text-[#9c493e] uppercase">Connection interrupted</p>
      <h2 className="mt-3 font-serif text-3xl text-[#243f4d]">{title}</h2>
      <p className="mx-auto mt-3 max-w-xl leading-7 text-muted-foreground">{description}</p>
      <Button variant="outline" className="mt-6 rounded-full border-[#9c493e]/35 bg-white text-[#823b32]" onClick={onRetry}>
        <RefreshCw className="mr-2 size-4" /> Try again
      </Button>
    </div>
  );
}

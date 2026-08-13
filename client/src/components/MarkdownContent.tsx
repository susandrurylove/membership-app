import { Skeleton } from "@/components/ui/skeleton";
import { lazy, Suspense } from "react";

const Streamdown = lazy(() =>
  import("streamdown").then(module => ({ default: module.Streamdown }))
);

export function MarkdownContent({ children }: { children: string }) {
  return (
    <Suspense fallback={<div className="space-y-3"><Skeleton className="h-5 w-full" /><Skeleton className="h-5 w-11/12" /><Skeleton className="h-5 w-4/5" /></div>}>
      <Streamdown>{children}</Streamdown>
    </Suspense>
  );
}


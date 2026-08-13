import { Sparkles } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-[2rem] border border-dashed border-[#c9a84c]/55 bg-[#fffdf8]/75 px-5 py-12 text-center shadow-[0_18px_55px_rgba(48,66,72,0.05)] sm:px-10 sm:py-14">
      <div className="mx-auto mb-6 grid size-14 place-items-center rounded-full border border-[#d5c078] bg-[#f4ead0] text-[#77580f] shadow-sm">
        <Sparkles className="size-5" />
      </div>
      <p className="mb-3 text-[11px] font-semibold tracking-[0.22em] text-[#2d7777] uppercase">{eyebrow}</p>
      <h2 className="font-serif text-3xl text-[#243f4d] sm:text-4xl">{title}</h2>
      <p className="mx-auto mt-4 max-w-xl leading-7 text-muted-foreground">{description}</p>
      {action ? <div className="mt-7">{action}</div> : null}
    </div>
  );
}

import { Sparkles, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  eyebrow,
  title,
  description,
  action,
  icon: Icon = Sparkles,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) {
  return (
    <div className="brand-panel relative overflow-hidden rounded-[2rem] px-5 py-12 text-center sm:px-10 sm:py-14">
      <div className="pointer-events-none absolute -right-12 -top-16 size-40 rounded-full border-[26px] border-[#c9a84c]/12" />
      <div className="relative mx-auto mb-6 grid size-14 place-items-center rounded-full border border-[#c9a84c]/55 bg-[#f4ead0] text-[#8a6819] shadow-sm">
        <Icon className="size-5" />
      </div>
      <p className="eyebrow">{eyebrow}</p>
      <div className="brand-gold-rule mx-auto mt-4" />
      <h2 className="mt-5 font-serif text-3xl text-[#1e234c] sm:text-4xl">{title}</h2>
      <p className="mx-auto mt-4 max-w-xl leading-7 text-[#607076]">{description}</p>
      {action ? <div className="mt-7">{action}</div> : null}
    </div>
  );
}

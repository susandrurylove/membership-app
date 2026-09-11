import { BunnyImage } from "@/components/BunnyImage";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { trpc } from "@/lib/trpc";
import { ArrowRight, Bell, CalendarDays, Mail, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

type ReminderFrequency = "daily" | "weekly";

export function DailyTeachingPromo() {
  const utils = trpc.useUtils();
  const current = trpc.member.dailyTeaching.current.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone || "America/Denver";

  useEffect(() => {
    if (current.data?.shouldPrompt) setDialogOpen(true);
  }, [current.data?.shouldPrompt]);

  const savePreference = trpc.member.dailyTeaching.savePreference.useMutation({
    onSuccess: async preference => {
      await utils.member.dailyTeaching.current.invalidate();
      await utils.member.dailyTeaching.preference.invalidate();
      setDialogOpen(false);
      toast.success(preference?.frequency === "weekly" ? "Weekly reminders are on." : "Daily reminders are on.");
    },
    onError: error => toast.error(error.message || "Your reminder preference could not be saved."),
  });
  const dismissPrompt = trpc.member.dailyTeaching.dismissPrompt.useMutation({
    onSuccess: async () => {
      await utils.member.dailyTeaching.current.invalidate();
      setDialogOpen(false);
    },
  });

  if (current.isLoading) return <Skeleton className="mt-7 h-[26rem] rounded-[2rem] sm:h-80" />;
  const teaching = current.data?.teaching;
  if (!teaching) return null;
  const frequency = current.data?.preference?.frequency;

  const chooseReminder = (choice: ReminderFrequency) => {
    savePreference.mutate({ frequency: choice, timezone, preferredHour: 8 });
  };

  return (
    <>
      <section className="editorial-card mt-7 overflow-hidden rounded-[2rem]" aria-labelledby="daily-teaching-title">
        <div className="grid min-h-[22rem] lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
          <div className="relative min-h-64 overflow-hidden lg:min-h-full">
            <BunnyImage
              src={teaching.imageUrl}
              alt={teaching.imageAlt}
              className="absolute inset-0 h-full w-full object-cover object-center"
              loading="eager"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#071b2a]/65 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-[#071b2a]/12" />
            <div className="absolute bottom-4 left-4 rounded-full border border-white/35 bg-[#071b2a]/75 px-3 py-1.5 text-[10px] font-bold tracking-[0.16em] text-white uppercase backdrop-blur-sm">
              Day {current.data?.sequence} of 365
            </div>
          </div>

          <div className="flex flex-col justify-center bg-[#fffdf7] p-6 sm:p-9 lg:p-11">
            <div className="flex items-center gap-2 text-[#8b6b25]">
              <Sparkles className="size-4" aria-hidden="true" />
              <p className="text-[11px] font-bold tracking-[0.19em] uppercase">Today’s Daily Teaching</p>
            </div>
            <h2 id="daily-teaching-title" className="mt-4 font-serif text-3xl leading-tight text-[#243f4d] sm:text-4xl">
              {teaching.title}
            </h2>
            <p className="mt-4 text-base leading-7 text-[#5b6b72]">{teaching.summary}</p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button asChild className="brand-button w-full sm:w-auto">
                <Link href={`/daily-teachings/${teaching.slug}`}>
                  Read today’s teaching <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Link>
              </Button>
              <Button
                type="button"
                variant="outline"
                className="w-full border-[#c9a84c]/65 bg-white text-[#294854] hover:bg-[#f7f1e7] sm:w-auto"
                onClick={() => setDialogOpen(true)}
              >
                <Bell className="mr-2 size-4" aria-hidden="true" />
                {frequency === "daily" ? "Daily reminders" : frequency === "weekly" ? "Weekly reminders" : "Choose reminders"}
              </Button>
            </div>
          </div>
        </div>
      </section>

      <Dialog open={dialogOpen} onOpenChange={open => {
        setDialogOpen(open);
        if (!open && current.data?.shouldPrompt && !dismissPrompt.isPending && !savePreference.isPending) {
          dismissPrompt.mutate();
        }
      }}>
        <DialogContent className="overflow-hidden border-[#d8c69e] bg-[#fffdf7] p-0 sm:max-w-xl sm:rounded-[1.75rem]">
          <div className="bg-[#0b2839] px-6 py-7 text-[#fffdf7] sm:px-8">
            <p className="text-[10px] font-bold tracking-[0.2em] text-[#d8bd72] uppercase">A gentle return</p>
            <DialogHeader className="mt-3 text-left">
              <DialogTitle className="font-serif text-3xl font-medium leading-tight">How often would you like a teaching?</DialogTitle>
              <DialogDescription className="mt-2 text-sm leading-6 text-[#e8e4da]">
                Susan can send one short reflection to your membership email. You can change this choice anytime.
              </DialogDescription>
            </DialogHeader>
          </div>
          <div className="grid gap-3 p-5 sm:grid-cols-2 sm:p-7">
            <button
              type="button"
              className="rounded-2xl border border-[#d8c69e] bg-white p-5 text-left transition hover:border-[#b79756] hover:bg-[#fbf6ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]"
              onClick={() => chooseReminder("daily")}
              disabled={savePreference.isPending}
            >
              <Mail className="size-5 text-[#2f7772]" aria-hidden="true" />
              <span className="mt-4 block font-serif text-2xl text-[#243f4d]">Daily</span>
              <span className="mt-2 block text-sm leading-6 text-[#64747a]">A fresh teaching each morning at 8:00 in your local timezone.</span>
            </button>
            <button
              type="button"
              className="rounded-2xl border border-[#d8c69e] bg-white p-5 text-left transition hover:border-[#b79756] hover:bg-[#fbf6ea] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c9a84c]"
              onClick={() => chooseReminder("weekly")}
              disabled={savePreference.isPending}
            >
              <CalendarDays className="size-5 text-[#8b6b25]" aria-hidden="true" />
              <span className="mt-4 block font-serif text-2xl text-[#243f4d]">Weekly</span>
              <span className="mt-2 block text-sm leading-6 text-[#64747a]">One calm weekly note, delivered at 8:00 in your local timezone.</span>
            </button>
          </div>
          <DialogFooter className="border-t border-[#ebe3d5] px-5 py-4 sm:px-7">
            <Button
              type="button"
              variant="ghost"
              className="text-[#5b6b72]"
              onClick={() => dismissPrompt.mutate()}
              disabled={dismissPrompt.isPending || savePreference.isPending}
            >
              Not now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

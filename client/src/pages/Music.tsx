import { PortalHeroImage } from "@/components/PortalMedia";
import { Button } from "@/components/ui/button";
import { HEALING_MUSIC_TRACKS, formatTrackDuration } from "@/lib/healingMusic";
import { PORTAL_IMAGES } from "@/lib/portalImages";
import { Clock3, Headphones, Heart, Music2, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";

function labelBodyKey(key: string) {
  return key.replaceAll("-", " ").replace(/\b\w/g, character => character.toUpperCase());
}

export default function Music() {
  const [selectedSlug, setSelectedSlug] = useState<string>(HEALING_MUSIC_TRACKS[0].slug);
  const audioRef = useRef<HTMLAudioElement>(null);
  const selected = HEALING_MUSIC_TRACKS.find(track => track.slug === selectedSlug) ?? HEALING_MUSIC_TRACKS[0];

  useEffect(() => {
    audioRef.current?.load();
  }, [selected.slug]);

  const selectAndPlay = (slug: string) => {
    setSelectedSlug(slug);
    window.setTimeout(() => void audioRef.current?.play().catch(() => undefined), 0);
  };

  return (
    <main className="portal-page max-w-[1240px]">
      <header className="brand-hero min-h-[24rem] rounded-[2.25rem] px-6 py-10 sm:px-10 sm:py-12 lg:px-14">
        <PortalHeroImage image={PORTAL_IMAGES.listeningHero} />
        <div className="relative z-[2] flex min-h-[19rem] max-w-3xl flex-col justify-end">
          <p className="brand-eyebrow">A companion for the body</p>
          <div className="brand-gold-rule mt-5" />
          <h1 className="mt-6 font-serif text-4xl leading-[1.08] text-[#fdfaf5] sm:text-5xl lg:text-6xl">Susan’s Healing Music</h1>
          <p className="mt-5 max-w-2xl text-base leading-8 text-[#e8e4da] sm:text-lg">
            Twenty-three gentle songs and meditations created to accompany reflection, rest, and loving attention to the body.
          </p>
        </div>
      </header>

      <section className="editorial-card relative z-10 mx-auto -mt-8 max-w-4xl rounded-[2rem] p-5 sm:p-7" aria-labelledby="now-playing-title">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="grid size-14 shrink-0 place-items-center rounded-full bg-[#e7f1ed] text-[#2f7772]">
            <Headphones className="size-6" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold tracking-[0.18em] text-[#8b6b25] uppercase">Now selected</p>
            <h2 id="now-playing-title" className="mt-1 truncate font-serif text-2xl text-[#243f4d] sm:text-3xl">{selected.title}</h2>
            <p className="mt-1 flex items-center gap-2 text-xs text-[#64747a]"><Clock3 className="size-3.5" aria-hidden="true" /> {formatTrackDuration(selected.durationSeconds)}</p>
          </div>
        </div>
        <audio ref={audioRef} key={selected.slug} controls preload="metadata" className="mt-6 w-full" aria-label={`Play ${selected.title} by Susan Drury`}>
          <source src={selected.webUrl} type="audio/mpeg" />
          Your browser does not support audio playback.
        </audio>
        <p className="mt-3 text-xs leading-5 text-[#59686e]">For reflective and educational use. Choose a comfortable volume and pause whenever your body asks for rest.</p>
      </section>

      <section className="mt-12" aria-labelledby="music-library-title">
        <div className="mb-6 flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="eyebrow">The complete collection</p>
            <h2 id="music-library-title" className="mt-3 font-serif text-3xl text-[#243f4d] sm:text-4xl">Choose what calls to you</h2>
          </div>
          <p className="text-sm text-[#64747a]">{HEALING_MUSIC_TRACKS.length} tracks</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          {HEALING_MUSIC_TRACKS.map(track => {
            const active = track.slug === selected.slug;
            return (
              <article key={track.slug} className={`editorial-card rounded-[1.5rem] p-5 transition ${active ? "border-[#c9a84c] bg-[#fffaf0] shadow-[0_16px_38px_rgba(48,66,72,0.10)]" : "hover:border-[#c9a84c]/60"}`}>
                <div className="flex items-start gap-4">
                  <div className={`grid size-11 shrink-0 place-items-center rounded-full ${active ? "bg-[#1e234c] text-[#f5e4aa]" : "bg-[#e7f1ed] text-[#2f7772]"}`}>
                    {active ? <Music2 className="size-4" aria-hidden="true" /> : <Heart className="size-4" aria-hidden="true" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-serif text-xl leading-snug text-[#243f4d]">{track.title}</h3>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {track.bodyKeys.map(key => (
                        <span key={key} className="brand-chip px-3 py-1 text-[9px] font-bold tracking-[0.08em] uppercase">{labelBodyKey(key)}</span>
                      ))}
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-[#59686e]">{formatTrackDuration(track.durationSeconds)}</span>
                </div>
                <Button
                  type="button"
                  variant={active ? "default" : "outline"}
                  className={active ? "brand-button mt-5 w-full" : "mt-5 w-full border-[#c9a84c]/55 bg-white text-[#294854] hover:bg-[#f7f1e7]"}
                  onClick={() => selectAndPlay(track.slug)}
                  aria-pressed={active}
                >
                  <Play className="mr-2 size-4" aria-hidden="true" /> {active ? "Selected" : "Listen"}
                </Button>
              </article>
            );
          })}
        </div>
      </section>
    </main>
  );
}

import { Button } from "@/components/ui/button";
import { SUSAN_LOGO } from "@/lib/brandAssets";
import { ArrowLeft, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#fdfaf5] px-5 py-10 text-[#26384b]">
      <div className="pointer-events-none absolute -right-28 -top-28 size-96 rounded-full border-[58px] border-[#c9a84c]/12" />
      <section className="brand-hero w-full max-w-3xl rounded-[2.25rem] px-6 py-12 text-center sm:px-12 sm:py-16">
        <img src={SUSAN_LOGO.hero} alt="" className="pointer-events-none absolute left-1/2 top-1/2 z-[1] h-72 w-auto -translate-x-1/2 -translate-y-1/2 opacity-[0.08]" />
        <div className="relative z-[2]">
          <p className="brand-eyebrow">A gentle redirect</p>
          <div className="brand-gold-rule mx-auto mt-5" />
          <p className="mt-7 font-serif text-7xl leading-none text-[#ead79c] sm:text-8xl">404</p>
          <h1 className="mt-5 font-serif text-4xl text-[#fdfaf5] sm:text-5xl">This path is not here</h1>
          <p className="mx-auto mt-5 max-w-xl text-base leading-8 text-[#e8e4da]">The page may have moved, or the link may no longer be available. Your member sanctuary is still here and ready for you.</p>
          <Button onClick={() => setLocation("/")} className="mt-8 h-12 rounded-full border border-[#c9a84c] bg-[#c9a84c] px-7 text-xs font-bold tracking-[0.13em] text-[#1e234c] uppercase hover:bg-[#ead79c]">
            <Home className="mr-2 size-4" /> Return home
          </Button>
          <button type="button" onClick={() => window.history.back()} className="mx-auto mt-5 flex items-center gap-2 text-xs font-semibold text-[#ead79c] hover:text-white focus-visible:ring-2 focus-visible:ring-[#c9a84c] focus-visible:outline-none">
            <ArrowLeft className="size-4" /> Go back
          </button>
        </div>
      </section>
    </main>
  );
}

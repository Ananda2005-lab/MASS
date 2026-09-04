"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FxBackground from "@/components/FxBackground";
import ModeCard, { ModeId } from "@/components/ModeCard";
import { BrandMark } from "@/components/BrandMark";
import { BACKGROUNDS } from "@/config/backgrounds";

const ROUTES: Record<ModeId, string> = {
  nova: "/instruction",
  forge: "/workspace",
};

export default function EntryPage() {
  const router = useRouter();
  const [leaving, setLeaving] = useState<ModeId | null>(null);

  function select(mode: ModeId) {
    if (leaving) return;
    setLeaving(mode);
  }

  // navigate after the exit animation
  useEffect(() => {
    if (!leaving) return;
    const id = setTimeout(() => router.push(ROUTES[leaving]), 520);
    return () => clearTimeout(id);
  }, [leaving, router]);

  // keyboard shortcuts: 1 = Nova, 2 = Forge
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "1") select("nova");
      if (e.key === "2") select("forge");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leaving]);

  return (
    <main className="relative z-10 flex min-h-screen flex-col">
      <FxBackground name={BACKGROUNDS.entry} />

      {/* exit transition overlay */}
      <div
        className={`pointer-events-none fixed inset-0 z-50 transition-opacity duration-500 ${
          leaving ? "opacity-100" : "opacity-0"
        }`}
        style={{
          background:
            leaving === "nova"
              ? "radial-gradient(circle at center, rgba(167,139,250,0.28), rgba(4,5,13,0.96) 70%)"
              : "radial-gradient(circle at center, rgba(56,189,248,0.26), rgba(4,5,13,0.96) 70%)",
          opacity: leaving ? 1 : 0,
        }}
      />

      {/* top bar */}
      <header className="flex items-center justify-between px-6 py-4 md:px-10">
        <div className="animate-fade-up flex items-center gap-2.5">
          <BrandMark className="h-8 w-8 animate-float" />
          <span className="animate-fade-up text-sm font-semibold tracking-[0.22em] text-ink-mid" style={{ animationDelay: "40ms" }}>RAG-V2</span>
        </div>
        <button className="animate-fade-up glass-soft px-3.5 py-1.5 text-xs text-ink-mid transition hover:text-ink-hi" style={{ animationDelay: "80ms" }}>
          ⚙ Settings
        </button>
      </header>

      {/* hero */}
      <section className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
        <div className="animate-glow-pulse text-xs tracking-[0.42em] text-accent-violet">
          AI AGENT PLATFORM
        </div>
        <h1 className="animate-fade-up text-4xl font-bold md:text-6xl" style={{ animationDelay: "80ms" }}>
          Your AI.{" "}
          <span
            className="brand-gradient animate-shimmer bg-[length:200%_auto]"
          >
            For everything.
          </span>
        </h1>
        <p className="animate-fade-up max-w-md text-sm leading-relaxed text-ink-mid" style={{ animationDelay: "160ms" }}>
          Do duniyaayein, ek intelligence — <span className="text-ink-hi">Nova</span> se baat karo,{" "}
          <span className="text-ink-hi">Forge</span> me kaam karwao.
        </p>
      </section>

      {/* mode cards */}
      <section className="flex flex-1 flex-wrap items-center justify-center gap-8 px-6 pb-20 pt-6">
        <div className="animate-fade-up" style={{ animationDelay: "240ms" }}>
          <ModeCard mode="nova" onSelect={select} />
        </div>
        <div className="animate-fade-up" style={{ animationDelay: "320ms" }}>
          <ModeCard mode="forge" onSelect={select} />
        </div>
      </section>

      {/* keyboard hint + footer */}
      <footer className="animate-fade-up flex items-center justify-between px-6 py-4 text-xs text-ink-low md:px-10" style={{ animationDelay: "500ms" }}>
        <span className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent-green" />
          backend disconnected (UI preview)
        </span>
        <span className="hidden items-center gap-2 md:flex">
          <kbd className="glass-soft px-2 py-0.5 text-[10px]">1</kbd> Nova
          <kbd className="glass-soft ml-2 px-2 py-0.5 text-[10px]">2</kbd> Forge
        </span>
        <span>v0.1</span>
      </footer>
    </main>
  );
}

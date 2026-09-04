import FxBackground from "@/components/FxBackground";
import { BACKGROUNDS } from "@/config/backgrounds";

export default function InstructionPage() {
  return (
    <main className="relative z-10 min-h-screen">
      <FxBackground name={BACKGROUNDS.instruction} />

      <header className="topbar-blur sticky top-0 z-10 flex items-center justify-between px-6 py-3.5">
        <div className="flex items-center gap-4">
          <a href="/" className="glass-soft px-3 py-1.5 text-xs text-ink-mid transition hover:text-ink-hi">
            ◀ Home
          </a>
          <span className="text-sm font-semibold tracking-wide">
            NOVA <span className="text-ink-low">· Intelligence</span>
          </span>
        </div>
        <span className="flex items-center gap-2 text-xs text-ink-low">
          <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent-amber" />
          idle
        </span>
      </header>

      <div className="flex min-h-[calc(100vh-56px)] items-center justify-center px-6">
        <div className="glass animate-fade-up flex flex-col items-center gap-3 px-10 py-14 text-center">
          <span className="text-4xl">⚡</span>
          <h1 className="text-xl font-semibold">JARVIS Core live hai</h1>
          <p className="max-w-sm text-sm text-ink-mid">
            Instruction mode ka pura layout Step 2 me banega — chat column,
            plan rail, live activity. Background already active.
          </p>
        </div>
      </div>
    </main>
  );
}

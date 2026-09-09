"use client";

// Sidebar shared primitives — clean Codex-ish base, premium accents.

export function Switch({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onChange}
      className={`relative h-4 w-7 shrink-0 rounded-full transition-all duration-fast ${
        on
          ? "bg-gradient-to-r from-accent-cyan to-accent-indigo shadow-[0_0_10px_rgba(56,189,248,0.35)]"
          : "bg-white/10"
      }`}
    >
      <span
        className={`absolute top-0.5 h-3 w-3 rounded-full bg-white shadow-sm2 transition-all duration-base ease-spring ${
          on ? "left-3.5" : "left-0.5"
        }`}
      />
    </button>
  );
}

export function StatusDot({ status }: { status: "idle" | "running" | "done" | "error" | "syncing" | "synced" }) {
  const cls =
    status === "running" || status === "syncing"
      ? "bg-accent-cyan animate-pulse-soft"
      : status === "done" || status === "synced"
        ? "bg-semantic-success"
        : status === "error"
          ? "bg-semantic-error"
          : "bg-white/25";
  return <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${cls}`} />;
}

export function GitDot({ git }: { git: string }) {
  if (!git) return null;
  return (
    <span
      className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${
        git === "add" ? "bg-semantic-success" : git === "mod" ? "bg-semantic-warning" : "bg-semantic-error"
      }`}
    />
  );
}

export function PanelTitle({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-1 pb-1.5 pt-3 font-display text-[10px] font-semibold uppercase tracking-[0.16em] text-slate2-muted">
      {children}
    </p>
  );
}

export function Empty({ icon, text, cta, onCta }: { icon: React.ReactNode; text: string; cta?: string; onCta?: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-4 py-8 text-center">
      <span className="text-slate2-muted opacity-60">{icon}</span>
      <p className="text-2xs leading-relaxed text-slate2-muted">{text}</p>
      {cta && (
        <button
          type="button"
          onClick={onCta}
          className="mt-1 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-2xs text-slate2-secondary transition hover:border-accent-cyan/40 hover:text-slate2-primary"
        >
          {cta}
        </button>
      )}
    </div>
  );
}

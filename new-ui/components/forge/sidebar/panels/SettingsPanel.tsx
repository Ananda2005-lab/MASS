"use client";

// Settings — identity cluster se khulta hai. Abhi minimal; baad mein expand hoga
// (50-bg picker, palette adapt, account…).

import { Waves, Lock, RotateCcw, Keyboard } from "lucide-react";
import { useForgeUI } from "@/lib/store/forge-ui";
import { PanelTitle } from "../ui";

const SHORTCUTS: [string, string][] = [
  ["Ctrl+B", "Sidebar collapse/expand"],
  ["Ctrl+1…6", "Sections"],
  ["Esc", "Panel band"],
];

export function SettingsPanel() {
  const resetLayout = useForgeUI((s) => s.resetLayout);
  const safetyMode = useForgeUI((s) => s.safetyMode);
  const setSafety = useForgeUI((s) => s.setSafety);

  return (
    <div className="panel-stagger">
      <PanelTitle>Appearance</PanelTitle>
      <div className="mx-2 flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-cyan/15 text-accent-cyan">
          <Waves size={13} />
        </span>
        <div className="flex-1">
          <p className="text-2xs font-medium text-slate2-primary">Deep Jellies</p>
          <p className="text-[10px] text-slate2-muted">Forge background</p>
        </div>
        <span className="flex items-center gap-1 rounded-full bg-white/[0.06] px-2 py-0.5 text-[9px] text-slate2-muted">
          <Lock size={9} /> locked
        </span>
      </div>

      <PanelTitle>Workspace</PanelTitle>
      {/* agent safety mode — wired */}
      <div className="mx-2 flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-amber/15 text-accent-amber">
          <Lock size={13} />
        </span>
        <div className="flex-1">
          <p className="text-2xs font-medium text-slate2-primary">Agent safety</p>
          <p className="text-[10px] text-slate2-muted">Auto-run tools, or ask first</p>
        </div>
        <div className="flex rounded-full border border-white/10 bg-white/[0.04] p-0.5">
          {(["auto", "ask"] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setSafety(m)}
              className={`rounded-full px-2.5 py-0.5 font-mono text-[9px] tracking-widest transition ${
                safetyMode === m
                  ? "bg-accent-cyan/20 text-accent-cyan"
                  : "text-slate2-muted hover:text-slate2-secondary"
              }`}
            >
              {m.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      <button
        type="button"
        onClick={resetLayout}
        className="mx-2 flex w-[calc(100%-16px)] items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-2 text-2xs text-slate2-secondary transition hover:border-accent-cyan/30 hover:text-slate2-primary hover-glow"
      >
        <RotateCcw size={12} /> Layout & sessions reset
      </button>

      <PanelTitle>Shortcuts</PanelTitle>
      <div className="mx-2 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-1">
        {SHORTCUTS.map(([k, v]) => (
          <div key={k} className="flex items-center justify-between py-1.5">
            <span className="text-2xs text-slate2-secondary">{v}</span>
            <kbd className="rounded border border-white/10 bg-white/[0.06] px-1.5 py-0.5 font-mono text-[10px] text-slate2-secondary">{k}</kbd>
          </div>
        ))}
      </div>

      <p className="flex items-center gap-1.5 px-3 pt-4 text-[10px] text-slate2-muted">
        <Keyboard size={11} /> Settings will expand later — 50-background picker + palette adapt.
      </p>
    </div>
  );
}

"use client";

// Top Navigation Bar (64px, fixed, z-50) — per FORGE spec Phase 2.
// Left: Home btn + FORGE gradient logo · Center: project name + breadcrumb · Right: status orb, bell, gear, avatar

import { useState } from "react";
import {
  Home,
  Bell,
  Settings,
  ChevronRight,
  Check,
  Moon,
  RotateCcw,
  Focus,
  Keyboard,
} from "lucide-react";
import { useForgeStore } from "@/lib/store/forge";
import { Badge } from "@/components/forge/ui";

export function StatusOrb() {
  const status = useForgeStore((s) => s.agentStatus);
  const setStatus = useForgeStore((s) => s.setAgentStatus);
  const next: Record<string, "idle" | "processing" | "active"> = {
    idle: "processing",
    processing: "active",
    active: "idle",
  };
  const meta = {
    idle: { label: "Idle", cls: "bg-semantic-error", ring: "ring-semantic-error/30", pulse: false },
    processing: { label: "Processing", cls: "bg-semantic-warning", ring: "ring-semantic-warning/30", pulse: true },
    active: { label: "Active", cls: "bg-semantic-success", ring: "ring-semantic-success/30", pulse: true },
  }[status];

  return (
    <button
      type="button"
      title={`Agent: ${meta.label}`}
      onClick={() => setStatus(next[status])}
      className="relative flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-base hover:scale-110 hover:shadow-glow-cyan"
    >
      <span className="relative flex h-2.5 w-2.5">
        {meta.pulse && (
          <span className={`absolute inline-flex h-full w-full rounded-full ${meta.cls} animate-pulse-ring`} />
        )}
        <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${meta.cls} ring-4 ${meta.ring}`} />
      </span>
      <span className="text-2xs uppercase tracking-widest text-slate2-secondary">{meta.label}</span>
    </button>
  );
}

function BellMenu() {
  const [open, setOpen] = useState(false);
  const alerts: { t: string; s: string; time: string }[] = [];
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-full p-2 transition-all duration-base hover:scale-110 hover:shadow-glow-cyan hover:text-slate2-primary text-slate2-secondary"
        aria-label="Notifications"
      >
        <Bell className="h-4.5 w-4.5" size={18} />
        {alerts.length > 0 && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-semantic-error" />
        )}
      </button>
      {open && (
        <div className="animate-scale-pop absolute right-0 top-12 z-50 w-72 rounded-lg border border-white/10 bg-bg-surface/95 p-2 shadow-lg2 backdrop-blur-2xl">
          <p className="px-2 py-1.5 text-2xs uppercase tracking-widest text-slate2-muted">Alerts</p>
          {alerts.length === 0 ? (
            <p className="px-2.5 py-4 text-center text-2xs text-slate2-muted">No alerts yet</p>
          ) : (
            alerts.map((a, i) => (
              <div key={i} className="rounded-md px-2.5 py-2 transition hover:bg-white/5">
                <div className="flex items-center justify-between">
                  <p className="text-xs2 text-slate2-primary">{a.t}</p>
                  <span className="text-2xs text-slate2-muted">{a.time}</span>
                </div>
                <p className="mt-0.5 text-2xs text-slate2-secondary">{a.s}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function SettingsMenu() {
  const [open, setOpen] = useState(false);
  const store = useForgeStore();
  const items = [
    { icon: <Moon size={15} />, label: "Theme", onClick: () => {} },
    { icon: <RotateCcw size={15} />, label: "Layout Reset", onClick: () => store.resetLayout() },
    { icon: <Focus size={15} />, label: "Zen Mode", onClick: () => store.toggleZen() },
    { icon: <Keyboard size={15} />, label: "Keyboard Shortcuts", onClick: () => {} },
  ];
  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-full p-2 text-slate2-secondary transition-all duration-base hover:scale-110 hover:shadow-glow-cyan hover:text-slate2-primary"
        aria-label="Quick settings"
      >
        <Settings size={18} />
      </button>
      {open && (
        <div className="animate-scale-pop absolute right-0 top-12 z-50 w-56 rounded-lg border border-white/10 bg-bg-surface/95 p-1.5 shadow-lg2 backdrop-blur-2xl">
          {items.map((it, i) => (
            <button
              key={i}
              type="button"
              onClick={() => {
                it.onClick();
                setOpen(false);
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-xs2 text-slate2-secondary transition hover:bg-white/5 hover:text-slate2-primary"
            >
              {it.icon}
              {it.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export function TopBar() {
  const projectName = useForgeStore((s) => s.projectName);
  const setProjectName = useForgeStore((s) => s.setProjectName);
  const [saved, setSaved] = useState(false);

  function onNameChange(v: string) {
    setProjectName(v);
    setSaved(false);
  }
  function onNameBlur() {
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  return (
    <header className="sticky top-0 z-50 flex h-16 shrink-0 items-center justify-between border-b border-white/[0.08] bg-slate-950/40 px-4 backdrop-blur-2xl">
      {/* Left */}
      <div className="flex items-center gap-3">
        <a
          href="/"
          title="Home"
          className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 text-slate2-secondary transition-all duration-base hover:scale-110 hover:shadow-glow-cyan hover:text-slate2-primary"
        >
          <Home size={17} />
        </a>
        <div className="leading-tight">
          <div className="bg-gradient-to-r from-accent-cyan to-accent-indigo bg-clip-text text-sm font-bold tracking-wide text-transparent">
            FORGE
          </div>
          <div className="text-[10px] uppercase tracking-[0.3em] text-slate2-muted">Workspace</div>
        </div>
      </div>

      {/* Center — project name + breadcrumb */}
      <div className="hidden flex-1 items-center justify-center gap-2 md:flex">
        <div className="flex items-center gap-1 rounded-md border border-white/10 bg-white/5 px-3 py-1.5 transition-all duration-fast focus-within:border-accent-cyan/50 focus-within:shadow-focus-input">
          <input
            value={projectName}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={onNameBlur}
            placeholder="Untitled Project"
            className="w-44 bg-transparent text-xs2 text-slate2-primary outline-none placeholder:text-slate2-muted"
          />
          {saved && <Check size={13} className="text-semantic-success" />}
        </div>
        <nav className="flex items-center gap-1 text-2xs text-slate2-muted">
          <button className="transition hover:text-slate2-primary">Project</button>
          <ChevronRight size={12} />
          <button className="transition hover:text-slate2-primary">Session 04</button>
          <ChevronRight size={12} />
          <span className="text-slate2-secondary">Task #12</span>
        </nav>
      </div>

      {/* Right */}
      <div className="flex items-center gap-1.5">
        <StatusOrb />
        <BellMenu />
        <SettingsMenu />
        <div className="relative ml-1 flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-accent-cyan/60 to-accent-indigo/60">
          <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-bg-void bg-semantic-success" />
          <span className="text-xs2 font-semibold text-bg-void">A</span>
        </div>
      </div>
    </header>
  );
}

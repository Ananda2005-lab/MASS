"use client";

// Command Palette (Ctrl/Cmd + K) — per FORGE spec Phase 10.
// Fuzzy-ish search across Files, Agents, Tools, Navigation, Panels, Settings.
// Arrow keys + Enter + Escape. Scale-pop animation.

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Home,
  LayoutDashboard,
  Search as SearchIcon,
  Monitor,
  Bot,
  Wrench,
  FileText,
  Settings,
  ChevronRight,
  Command,
} from "lucide-react";
import { useForgeStore } from "@/lib/store/forge";

interface PaletteItem {
  id: string;
  label: string;
  hint: string;
  category: string;
  icon: React.ReactNode;
  run: () => void;
}

export function CommandPalette({
  open,
  onClose,
  onOpenShortcuts,
}: {
  open: boolean;
  onClose: () => void;
  onOpenShortcuts: () => void;
}) {
  const router = useRouter();
  const store = useForgeStore();
  const [query, setQuery] = useState("");
  const [sel, setSel] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items = useMemo<PaletteItem[]>(() => {
    const nav: PaletteItem[] = [
      { id: "home", label: "Home (Entry)", hint: "Goto /", category: "Navigation", icon: <Home size={14} />, run: () => router.push("/") },
      { id: "nova", label: "Nova — Instruction Mode", hint: "Goto /instruction", category: "Navigation", icon: <SearchIcon size={14} />, run: () => router.push("/instruction") },
      { id: "forge", label: "Forge — Workspace", hint: "Goto /workspace", category: "Navigation", icon: <Monitor size={14} />, run: () => router.push("/workspace") },
    ];
    const panels: PaletteItem[] = [
      { id: "p-exec", label: "Panel: Execution Dashboard", hint: "Focus", category: "Panels", icon: <LayoutDashboard size={14} />, run: () => { /* focus via store */ } },
      { id: "p-research", label: "Panel: Research & Context", hint: "Focus", category: "Panels", icon: <Search size={14} />, run: () => {} },
      { id: "p-output", label: "Panel: Output Canvas", hint: "Focus", category: "Panels", icon: <Monitor size={14} />, run: () => {} },
      { id: "reset", label: "Reset Layout", hint: "Restore defaults", category: "Panels", icon: <LayoutDashboard size={14} />, run: () => store.resetLayout() },
    ];
    const agents: PaletteItem[] = ["CodeForge", "ResearchBot", "DocuMind", "DataWiz", "Reviewer"].map((a) => ({
      id: `a-${a}`, label: a, hint: "Switch agent", category: "Agents", icon: <Bot size={14} />, run: () => {},
    }));
    const tools: PaletteItem[] = ["WebSearch", "CodeExecutor", "FileManager", "GitHub", "TestRunner", "Database"].map((t) => ({
      id: `t-${t}`, label: t, hint: "Tool", category: "Tools", icon: <Wrench size={14} />, run: () => {},
    }));
    const files: PaletteItem[] = ["src/index.ts", "src/agent.ts", "scripts/analyze.py", "docs/api.md", "config/forge.json"].map((f) => ({
      id: `f-${f}`, label: f, hint: "Open file", category: "Files", icon: <FileText size={14} />, run: () => {},
    }));
    const settings: PaletteItem[] = [
      { id: "s-keys", label: "Keyboard Shortcuts", hint: "View all", category: "Settings", icon: <Settings size={14} />, run: onOpenShortcuts },
      { id: "s-theme", label: "Theme", hint: "Toggle", category: "Settings", icon: <Settings size={14} />, run: () => {} },
      { id: "s-zen", label: "Zen Mode", hint: "Ctrl+.", category: "Settings", icon: <Settings size={14} />, run: () => store.toggleZen() },
    ];
    return [...nav, ...panels, ...agents, ...tools, ...files, ...settings];
  }, [router, store, onOpenShortcuts]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (it) => it.label.toLowerCase().includes(q) || it.category.toLowerCase().includes(q)
    );
  }, [items, query]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSel(0);
  }, [query]);

  if (!open) return null;

  function exec(it: PaletteItem) {
    it.run();
    onClose();
  }

  function onKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel((s) => Math.min(filtered.length - 1, s + 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
    else if (e.key === "Enter") { e.preventDefault(); if (filtered[sel]) exec(filtered[sel]); }
    else if (e.key === "Escape") { e.preventDefault(); onClose(); }
  }

  // group by category preserving order
  const groups: { cat: string; items: PaletteItem[] }[] = [];
  for (const it of filtered) {
    const g = groups.find((x) => x.cat === it.category);
    if (g) g.items.push(it);
    else groups.push({ cat: it.category, items: [it] });
  }
  let idx = 0;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-black/50 pt-[15vh] backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-scale-pop w-[600px] max-w-[90vw] overflow-hidden rounded-lg border border-white/10 bg-bg-surface/95 shadow-lg2 backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKey}
      >
        {/* search */}
        <div className="flex items-center gap-2.5 border-b border-white/[0.08] px-4 py-3">
          <Search size={16} className="text-slate2-muted" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type a command, file, agent, tool…"
            className="flex-1 bg-transparent text-sm text-slate2-primary outline-none placeholder:text-slate2-muted"
          />
          <span className="flex items-center gap-1 rounded border border-white/10 px-1.5 py-0.5 text-2xs text-slate2-muted">
            <Command size={10} /> K
          </span>
        </div>

        {/* results */}
        <div className="max-h-[50vh] overflow-y-auto p-1.5">
          {groups.length === 0 && (
            <p className="py-8 text-center text-xs2 text-slate2-muted">No results for “{query}”</p>
          )}
          {groups.map((g) => (
            <div key={g.cat}>
              <p className="px-3 pb-1 pt-2 text-2xs uppercase tracking-widest text-slate2-muted">{g.cat}</p>
              {g.items.map((it) => {
                const current = idx++;
                return (
                  <button
                    key={it.id}
                    type="button"
                    onClick={() => exec(it)}
                    onMouseEnter={() => setSel(current)}
                    className={`flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-xs2 transition ${
                      current === sel ? "bg-white/8 text-slate2-primary" : "text-slate2-secondary"
                    }`}
                  >
                    <span className={current === sel ? "text-accent-cyan" : "text-slate2-muted"}>{it.icon}</span>
                    <span className="flex-1">{it.label}</span>
                    <span className="text-2xs text-slate2-muted">{it.hint}</span>
                    {current === sel && <ChevronRight size={12} className="text-accent-cyan" />}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
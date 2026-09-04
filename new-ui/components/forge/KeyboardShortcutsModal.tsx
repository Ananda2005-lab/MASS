"use client";

// Keyboard Shortcuts modal — per FORGE spec Phase 10 §5.
// Categorized list: Navigation, Panels, Agent, General. Searchable.

import { useMemo, useState } from "react";
import { Keyboard, X, Search } from "lucide-react";

const SHORTCUTS: { cat: string; items: { keys: string; label: string }[] }[] = [
  {
    cat: "Navigation",
    items: [
      { keys: "G / H", label: "Go to Home / Entry" },
      { keys: "G / N", label: "Go to Nova (Instruction)" },
      { keys: "G / F", label: "Go to Forge (Workspace)" },
    ],
  },
  {
    cat: "Panels",
    items: [
      { keys: "Ctrl + K", label: "Command Palette" },
      { keys: "Ctrl + B", label: "Toggle left sidebar" },
      { keys: "Ctrl + J", label: "Toggle right sidebar" },
      { keys: "Ctrl + T", label: "Toggle terminal panel" },
      { keys: "Ctrl + 1-5", label: "Switch workspace tabs" },
      { keys: "Ctrl + R", label: "Retry last action" },
    ],
  },
  {
    cat: "Agent",
    items: [
      { keys: "Ctrl + P", label: "Pause / Resume agent" },
      { keys: "Ctrl + Enter", label: "Send command" },
      { keys: "Ctrl + Shift + Enter", label: "Send with context clear" },
      { keys: "Ctrl + .", label: "Zen mode toggle" },
    ],
  },
  {
    cat: "General",
    items: [
      { keys: "?", label: "Show this shortcuts panel" },
      { keys: "Esc", label: "Close modals / exit zen" },
    ],
  },
];

export function KeyboardShortcutsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return SHORTCUTS;
    return SHORTCUTS.map((g) => ({
      ...g,
      items: g.items.filter(
        (i) => i.label.toLowerCase().includes(q) || i.keys.toLowerCase().includes(q)
      ),
    })).filter((g) => g.items.length > 0);
  }, [query]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[75] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="animate-scale-pop w-[520px] max-w-[90vw] overflow-hidden rounded-lg border border-white/10 bg-bg-surface/95 shadow-lg2 backdrop-blur-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/[0.08] px-4 py-3">
          <span className="flex items-center gap-2 text-sm font-medium text-slate2-primary">
            <Keyboard size={15} className="text-accent-cyan" /> Keyboard Shortcuts
          </span>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate2-muted transition hover:text-slate2-primary">
            <X size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 border-b border-white/[0.06] px-4 py-2">
          <Search size={13} className="text-slate2-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shortcuts…"
            className="flex-1 bg-transparent text-xs2 text-slate2-primary outline-none placeholder:text-slate2-muted"
          />
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-3">
          {filtered.length === 0 && (
            <p className="py-6 text-center text-xs2 text-slate2-muted">No shortcuts found.</p>
          )}
          {filtered.map((g) => (
            <div key={g.cat} className="mb-3">
              <p className="px-1 pb-1.5 text-2xs uppercase tracking-widest text-slate2-muted">{g.cat}</p>
              <div className="overflow-hidden rounded-md border border-white/[0.07]">
                {g.items.map((i, n) => (
                  <div
                    key={i.keys}
                    className={`flex items-center justify-between px-3 py-2 ${
                      n > 0 ? "border-t border-white/[0.05]" : ""
                    }`}
                  >
                    <span className="text-xs2 text-slate2-secondary">{i.label}</span>
                    <kbd className="rounded border border-white/15 bg-white/5 px-2 py-0.5 font-mono text-2xs text-slate2-primary">
                      {i.keys}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
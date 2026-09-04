"use client";

// Zen Mode overlay — per FORGE spec Phase 10 §4.
// When zenMode is on: floating chat input (center-bottom, glass pill) + Exit Zen button.
// Sidebars/bottom bar are already hidden by the workspace shell.

import { useState } from "react";
import { Send, Mic, Paperclip, X } from "lucide-react";
import { useForgeStore } from "@/lib/store/forge";

export function ZenOverlay() {
  const zen = useForgeStore((s) => s.zenMode);
  const toggleZen = useForgeStore((s) => s.toggleZen);
  const [input, setInput] = useState("");

  if (!zen) return null;

  return (
    <>
      {/* Exit Zen — floating top-right, auto-fades */}
      <button
        type="button"
        onClick={toggleZen}
        className="animate-fade-in fixed right-4 top-16 z-[65] flex items-center gap-1.5 rounded-full border border-white/15 bg-bg-surface/85 px-3 py-1.5 text-2xs text-slate2-secondary opacity-70 backdrop-blur-xl transition-all duration-base hover:opacity-100 hover:text-slate2-primary"
      >
        <X size={13} /> Exit Zen
      </button>

      {/* floating chat input — center-bottom glass pill */}
      <div className="fixed inset-x-0 bottom-5 z-[65] flex justify-center px-4">
        <div className="animate-slide-in flex w-full max-w-xl items-center gap-2 rounded-full border border-white/15 bg-bg-surface/85 px-4 py-2.5 shadow-glow-cyan backdrop-blur-2xl transition-all duration-base focus-within:border-accent-cyan/60">
          <button type="button" title="Attach" className="text-slate2-muted transition hover:text-slate2-primary">
            <Paperclip size={15} />
          </button>
          <button type="button" title="Voice" className="text-slate2-muted transition hover:text-slate2-primary">
            <Mic size={15} />
          </button>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Command the agent… (Esc to exit zen)"
            className="flex-1 bg-transparent text-xs2 text-slate2-primary outline-none placeholder:text-slate2-muted"
          />
          <button
            type="button"
            title="Send"
            className="rounded-full bg-gradient-to-r from-accent-cyan to-accent-indigo p-1.5 text-bg-void transition-all duration-base hover:scale-105 hover:shadow-glow-cyan active:scale-95"
          >
            <Send size={14} />
          </button>
        </div>
      </div>
    </>
  );
}
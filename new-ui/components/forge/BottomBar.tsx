"use client";

// Bottom Command Bar (56px, fixed) — FORGE spec Phase 9.
// Rich chat input: auto-resize, slash commands, attachments, voice (waveform),
// typing indicator, terminal slide-up, token counter.

import { useEffect, useRef, useState } from "react";
import {
  Terminal,
  RotateCcw,
  Focus,
  Paperclip,
  Mic,
  Send,
  ChevronUp,
  ChevronDown,
  Search,
  FileCode,
  File,
  Play,
  Bot,
  Eraser,
  HelpCircle,
  X,
  Command,
} from "lucide-react";
import { useForgeStore } from "@/lib/store/forge";
import { useTaskStore } from "@/lib/store/task";

// ---------------------------------------------------------------------------
// Slash commands (spec Phase 9 §2)
// ---------------------------------------------------------------------------
const COMMANDS = [
  { cmd: "/search", label: "Search the web", icon: <Search size={13} />, hint: "/search [query]" },
  { cmd: "/code", label: "Generate code", icon: <FileCode size={13} />, hint: "/code [language]" },
  { cmd: "/file", label: "Read / edit file", icon: <File size={13} />, hint: "/file [path]" },
  { cmd: "/run", label: "Execute command", icon: <Play size={13} />, hint: "/run [command]" },
  { cmd: "/agent", label: "Switch agent", icon: <Bot size={13} />, hint: "/agent [name]" },
  { cmd: "/clear", label: "Clear context", icon: <Eraser size={13} />, hint: "/clear" },
  { cmd: "/help", label: "All commands", icon: <HelpCircle size={13} />, hint: "/help" },
];

interface Attachment {
  name: string;
  size: string;
}

// ---------------------------------------------------------------------------
// Voice waveform (mock visualization)
// ---------------------------------------------------------------------------
function Waveform({ active }: { active: boolean }) {
  const bars = Array.from({ length: 20 }, (_, i) => i);
  return (
    <span className="flex items-end gap-0.5">
      {bars.map((b) => (
        <span
          key={b}
          className="w-[2px] rounded-full bg-accent-cyan"
          style={{
            height: active ? `${6 + ((b * 7) % 14)}px` : "4px",
            opacity: active ? 0.8 : 0.3,
            animation: active ? `voiceBar 0.9s ease-in-out ${(b % 5) * 0.12}s infinite alternate` : "none",
          }}
        />
      ))}
      <style>{`@keyframes voiceBar { from { transform: scaleY(0.3); } to { transform: scaleY(1.2); } }`}</style>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Terminal slide-up panel (spec Phase 9 §6)
// ---------------------------------------------------------------------------
function TerminalPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="absolute inset-x-0 bottom-14 z-40 flex h-64 flex-col border-t border-white/[0.08] bg-black/70 backdrop-blur-2xl">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-1.5">
        <span className="flex items-center gap-1.5 text-2xs uppercase tracking-widest text-slate2-secondary">
          <Terminal size={12} className="text-accent-cyan" /> Terminal
        </span>
        <div className="flex items-center gap-1">
          <span className="font-mono text-2xs text-slate2-muted">— / —</span>
          <button type="button" onClick={onClose} className="rounded p-1 text-slate2-muted transition hover:text-slate2-primary">
            <X size={14} />
          </button>
        </div>
      </div>
      <div className="flex flex-1 items-center justify-center p-3 font-mono text-2xs">
        <div className="text-center text-slate2-muted">
          <Terminal size={20} className="mx-auto mb-2 opacity-40" />
          <p>No command output yet</p>
          <p className="mt-1 text-[10px] text-slate2-muted/60">Agent execution logs will stream here.</p>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main Bottom Bar
// ---------------------------------------------------------------------------
export function BottomBar() {
  const store = useForgeStore();
  const [input, setInput] = useState("");
  const [showCmds, setShowCmds] = useState(false);
  const [cmdIndex, setCmdIndex] = useState(0);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [recording, setRecording] = useState(false);
  const [terminalOpen, setTerminalOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const taRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // auto-resize textarea (1 → 5 rows)
  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
  }, [input]);

  // slash command menu when input starts with "/"
  useEffect(() => {
    setShowCmds(input.startsWith("/") && input.length > 0);
    setCmdIndex(0);
  }, [input]);

  function runCommand(cmd: string) {
    if (cmd === "/clear") {
      setInput("");
      setAttachments([]);
    } else {
      setInput(`${cmd} `);
    }
    setShowCmds(false);
  }

  const submit = useTaskStore((s) => s.submit);
  const busy = useTaskStore((s) => s.busy);

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (showCmds) {
      if (e.key === "ArrowDown") { e.preventDefault(); setCmdIndex((i) => (i + 1) % COMMANDS.length); return; }
      if (e.key === "ArrowUp") { e.preventDefault(); setCmdIndex((i) => (i - 1 + COMMANDS.length) % COMMANDS.length); return; }
      if (e.key === "Enter") { e.preventDefault(); runCommand(COMMANDS[cmdIndex].cmd); return; }
      if (e.key === "Escape") { setShowCmds(false); return; }
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (input.trim() && !busy) {
        const cmd = input.trim();
        setInput("");
        setTyping(true);
        submit(cmd).finally(() => setTyping(false));
      }
    }
  }

  function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files) return;
    const list: Attachment[] = Array.from(files).map((f) => ({
      name: f.name,
      size: f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(f.size / 1024))} KB`,
    }));
    setAttachments((prev) => [...prev, ...list].slice(0, 5));
    if (fileRef.current) fileRef.current.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (!files) return;
    const list: Attachment[] = Array.from(files).map((f) => ({ name: f.name, size: `${Math.max(1, Math.round(f.size / 1024))} KB` }));
    setAttachments((prev) => [...prev, ...list].slice(0, 5));
  }

  const filteredCmds = COMMANDS.filter((c) => input === "/" || c.cmd.startsWith(input.toLowerCase()));

  return (
    <footer
      className="relative z-50 flex shrink-0 flex-col border-t border-white/[0.08] bg-slate-950/60 backdrop-blur-2xl"
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      {/* attachments row */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-1.5 px-4 pt-2">
          {attachments.map((a, i) => (
            <span key={i} className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-2xs text-slate2-secondary">
              <Paperclip size={11} className="text-accent-cyan" />
              {a.name}
              <span className="text-slate2-muted">{a.size}</span>
              <button type="button" onClick={() => setAttachments((p) => p.filter((_, j) => j !== i))} className="text-slate2-muted hover:text-semantic-error">
                <X size={11} />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* drag-drop overlay */}
      {dragOver && (
        <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center rounded border-2 border-dashed border-accent-cyan/60 bg-accent-cyan/5">
          <p className="text-xs2 text-accent-cyan">Drop files to attach…</p>
        </div>
      )}

      {/* slash command menu */}
      {showCmds && filteredCmds.length > 0 && (
        <div className="absolute bottom-full left-1/2 z-50 mb-1 w-72 -translate-x-1/2 overflow-hidden rounded-lg border border-white/10 bg-bg-surface/95 shadow-lg2 backdrop-blur-2xl">
          {filteredCmds.map((c, i) => (
            <button
              key={c.cmd}
              type="button"
              onMouseEnter={() => setCmdIndex(i)}
              onClick={() => runCommand(c.cmd)}
              className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-xs2 transition ${
                i === cmdIndex ? "bg-white/8 text-slate2-primary" : "text-slate2-secondary"
              }`}
            >
              <span className={i === cmdIndex ? "text-accent-cyan" : "text-slate2-muted"}>{c.icon}</span>
              <span className="flex-1">{c.label}</span>
              <span className="font-mono text-2xs text-slate2-muted">{c.hint}</span>
            </button>
          ))}
        </div>
      )}

      {/* typing indicator */}
      {typing && (
        <div className="flex items-center gap-2 px-6 pb-1.5 text-2xs text-slate2-muted">
          <span className="flex items-end gap-1">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent-cyan" style={{ animationDelay: "0ms" }} />
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent-cyan" style={{ animationDelay: "200ms" }} />
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-accent-cyan" style={{ animationDelay: "400ms" }} />
          </span>
          Agent is thinking…
        </div>
      )}

      {/* main bar row */}
      <div className="flex h-14 items-center gap-3 px-4">
        {/* Left — 15% */}
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Toggle Terminal"
            onClick={() => setTerminalOpen((v) => !v)}
            className={`rounded-md p-2 transition-all duration-base hover:scale-110 hover:shadow-glow-cyan ${
              terminalOpen ? "text-accent-cyan" : "text-slate2-secondary hover:text-slate2-primary"
            }`}
          >
            <Terminal size={16} />
          </button>
          <button
            type="button"
            title="Reset Layout"
            onClick={() => store.resetLayout()}
            className="rounded-md p-2 text-slate2-secondary transition-all duration-base hover:scale-110 hover:text-slate2-primary hover:shadow-glow-cyan"
          >
            <RotateCcw size={16} />
          </button>
          <button
            type="button"
            title="Zen Mode (Ctrl+.)"
            onClick={() => store.toggleZen()}
            className={`rounded-md p-2 transition-all duration-base hover:scale-110 hover:shadow-glow-cyan ${store.zenMode ? "text-accent-cyan" : "text-slate2-secondary hover:text-slate2-primary"}`}
          >
            <Focus size={16} />
          </button>
        </div>

        {/* Center — rich chat input */}
        <div
          className={`relative flex flex-1 items-center gap-2 rounded-full border bg-white/5 px-3 transition-all duration-base focus-within:border-accent-cyan/50 focus-within:shadow-[0_0_20px_rgba(56,189,248,0.15)] ${
            expanded ? "rounded-xl border-accent-cyan/40" : ""
          } ${recording ? "border-accent-cyan/60" : "border-white/10"}`}
        >
          <input ref={fileRef} type="file" multiple className="hidden" onChange={onFileSelected} />
          <button type="button" title="Attach file" onClick={() => fileRef.current?.click()} className="text-slate2-muted transition hover:text-slate2-primary">
            <Paperclip size={15} />
          </button>

          <button
            type="button"
            title={recording ? "Recording — release to send" : "Hold to record"}
            onPointerDown={() => setRecording(true)}
            onPointerUp={() => { setRecording(false); }}
            onPointerLeave={() => setRecording(false)}
            className={`flex items-center gap-1.5 rounded-full px-1.5 py-0.5 transition ${recording ? "text-accent-cyan" : "text-slate2-muted hover:text-slate2-primary"}`}
          >
            {recording ? <Waveform active /> : <Mic size={15} />}
          </button>

          <textarea
            ref={taRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            rows={1}
            placeholder="Command the agent… (⌘K for palette)"
            className="max-h-[120px] flex-1 resize-none bg-transparent py-1.5 text-xs2 text-slate2-primary outline-none placeholder:text-slate2-muted"
          />

          <button
            type="button"
            title="Send (Ctrl+Enter)"
            disabled={busy}
            onClick={() => {
              if (input.trim() && !busy) {
                const cmd = input.trim();
                setInput("");
                setTyping(true);
                submit(cmd).finally(() => setTyping(false));
              }
            }}
            className="rounded-full bg-gradient-to-r from-accent-cyan to-accent-indigo p-1.5 text-bg-void transition-all duration-base hover:scale-105 hover:shadow-glow-cyan active:scale-95 disabled:opacity-50"
          >
            <Send size={14} />
          </button>
          <button
            type="button"
            title="Expand composer"
            onClick={() => setExpanded((v) => !v)}
            className="text-slate2-muted transition hover:text-slate2-primary"
          >
            {expanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
          </button>
        </div>

        {/* Right — 15% */}
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-2xs text-slate2-secondary">
            <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-semantic-success" />
            Connected
          </span>
          <span className="hidden items-center gap-1.5 lg:flex">
            <span className="h-1 w-16 overflow-hidden rounded-full bg-white/10">
              <span className="block h-full w-[11%] rounded-full bg-gradient-to-r from-accent-cyan to-accent-indigo" />
            </span>
            <span className="font-mono text-2xs text-slate2-muted">14.2k / 128k</span>
          </span>
          <span className="hidden rounded border border-white/10 px-1.5 py-0.5 text-2xs text-slate2-muted sm:block">v0.1</span>
        </div>
      </div>

      {/* terminal slide-up */}
      {terminalOpen && <TerminalPanel onClose={() => setTerminalOpen(false)} />}
    </footer>
  );
}
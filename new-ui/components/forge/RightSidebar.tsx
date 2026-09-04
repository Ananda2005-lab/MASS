"use client";

// Forge — Right Sidebar: Agents panel (Codex-style).
// Agent cards: avatar, name, status, model badge, expandable details.

import { useState } from "react";
import { Plus, ChevronDown, Bot, Search, Code2, Bug, Pencil, ClipboardCheck, Database, FileText, Wrench, LayoutDashboard, Globe, Shield, Brain, Scale } from "lucide-react";

// Agents — mirror the backend's sub-agent roles
const AGENTS = [
  { id: "planner", name: "Planner", role: "Task decomposition & strategy", model: "auto", status: "active", color: "from-accent-cyan/70 to-accent-indigo/70", icon: <LayoutDashboard size={14} />, tools: ["plan.generate", "router.assign"] },
  { id: "researcher", name: "Researcher", role: "Web search & source gathering", model: "auto", status: "online", color: "from-accent-violet/70 to-accent-purple/70", icon: <Search size={14} />, tools: ["web.search", "web.fetch"] },
  { id: "analyst", name: "Analyst", role: "Data analysis & insights", model: "auto", status: "online", color: "from-accent-green/70 to-accent-cyan/70", icon: <Database size={14} />, tools: ["calculator.eval", "files.read"] },
  { id: "coder", name: "Coder", role: "Code generation & fixes", model: "auto", status: "idle", color: "from-accent-blue/70 to-accent-cyan/70", icon: <Code2 size={14} />, tools: ["code.run", "files.write"] },
  { id: "debugger", name: "Debugger", role: "Error diagnosis & fixes", model: "auto", status: "idle", color: "from-accent-amber/70 to-accent-red/70", icon: <Bug size={14} />, tools: ["code.run", "terminal.exec"] },
  { id: "writer", name: "Writer", role: "Content & documentation", model: "auto", status: "idle", color: "from-accent-purple/70 to-accent-indigo/70", icon: <Pencil size={14} />, tools: ["files.write"] },
  { id: "reviewer", name: "Reviewer", role: "Output verification & QA", model: "auto", status: "idle", color: "from-slate2-muted/70 to-slate2-secondary/70", icon: <ClipboardCheck size={14} />, tools: ["verifier.check"] },
  { id: "architect", name: "Architect", role: "System design & structure", model: "auto", status: "idle", color: "from-accent-indigo/70 to-accent-blue/70", icon: <Wrench size={14} />, tools: ["files.read", "code.run"] },
  { id: "data", name: "Data Scientist", role: "Stats, ML & modeling", model: "auto", status: "idle", color: "from-accent-green/70 to-accent-emerald/70", icon: <Brain size={14} />, tools: ["calculator.eval", "code.run"] },
  { id: "security", name: "Security Auditor", role: "Vulnerability scanning", model: "auto", status: "idle", color: "from-accent-red/70 to-accent-amber/70", icon: <Shield size={14} />, tools: ["code.scan"] },
  { id: "sysadmin", name: "SysAdmin", role: "Terminal & system ops", model: "auto", status: "idle", color: "from-accent-cyan/70 to-accent-slate/70", icon: <TerminalIcon size={14} />, tools: ["terminal.exec"] },
  { id: "browser", name: "Browser Agent", role: "Web interaction & capture", model: "auto", status: "idle", color: "from-accent-blue/70 to-accent-violet/70", icon: <Globe size={14} />, tools: ["browser.navigate", "browser.screenshot"] },
  { id: "copywriter", name: "Copywriter", role: "Marketing & messaging", model: "auto", status: "idle", color: "from-accent-pink/70 to-accent-purple/70", icon: <FileText size={14} />, tools: ["files.write"] },
  { id: "judge", name: "Judge", role: "Decision & quality scoring", model: "auto", status: "idle", color: "from-accent-amber/70 to-accent-yellow/70", icon: <Scale size={14} />, tools: ["verifier.score"] },
];

function TerminalIcon({ size }: { size?: number }) {
  return <span style={{ fontSize: size ?? 14 }}>⌘</span>;
}

const STATUS_META: Record<string, { label: string; dot: string; text: string }> = {
  active: { label: "Working", dot: "animate-pulse-soft bg-accent-cyan", text: "text-accent-cyan" },
  online: { label: "Online", dot: "bg-semantic-success", text: "text-semantic-success" },
  idle: { label: "Idle", dot: "bg-white/20", text: "text-slate2-muted" },
};

function AgentCard({ a }: { a: (typeof AGENTS)[number] }) {
  const [open, setOpen] = useState(false);
  const st = STATUS_META[a.status];
  return (
    <div
      className={`rounded-lg border transition-all duration-base ${
        a.status === "active"
          ? "border-accent-cyan/40 bg-accent-cyan/[0.06]"
          : "border-white/[0.08] bg-white/[0.02] hover:border-white/20"
      }`}
    >
      <button type="button" onClick={() => setOpen((v) => !v)} className="flex w-full items-center gap-2.5 p-2.5 text-left">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${a.color} text-slate2-primary`}>
          {a.icon}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-xs2 font-medium text-slate2-primary">{a.name}</span>
          <span className="block truncate text-[10px] text-slate2-muted">{a.role}</span>
        </span>
        <span className={`flex items-center gap-1 text-[10px] ${st.text}`}>
          <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
          {st.label}
        </span>
        <ChevronDown size={13} className={`shrink-0 text-slate2-muted transition-transform duration-base ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="animate-fade-in border-t border-white/[0.06] px-2.5 py-2">
          <p className="text-[10px] uppercase tracking-widest text-slate2-muted">Tools</p>
          <div className="mt-1 flex flex-wrap gap-1">
            {a.tools.map((t) => (
              <span key={t} className="rounded border border-white/10 bg-white/5 px-1.5 py-0.5 font-mono text-[9px] text-accent-indigo">
                {t}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function RightSidebar() {
  const [collapsed, setCollapsed] = useState(false);

  if (collapsed) {
    return (
      <aside className="flex w-12 shrink-0 flex-col items-center gap-1 border-l border-white/[0.08] bg-slate-950/60 py-2 backdrop-blur-xl">
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          title="Expand"
          className="rounded-md p-2 text-slate2-muted transition hover:bg-white/10 hover:text-slate2-primary"
        >
          <Bot size={16} />
        </button>
      </aside>
    );
  }

  return (
    <aside className="flex w-72 shrink-0 flex-col border-l border-white/[0.08] bg-slate-950/60 backdrop-blur-xl">
      {/* header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2.5">
        <div className="flex items-center gap-2">
          <Bot size={15} className="text-accent-cyan" />
          <span className="text-xs2 font-semibold text-slate2-primary">Agents</span>
          <span className="rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] text-slate2-secondary">{AGENTS.length}</span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            title="Add agent"
            className="rounded-md p-1.5 text-slate2-muted transition hover:bg-white/10 hover:text-slate2-primary"
          >
            <Plus size={15} />
          </button>
          <button
            type="button"
            title="Collapse"
            onClick={() => setCollapsed(true)}
            className="rounded-md p-1.5 text-slate2-muted transition hover:bg-white/10 hover:text-slate2-primary"
          >
            <ChevronDown size={15} className="-rotate-90" />
          </button>
        </div>
      </div>

      {/* agent list */}
      <div className="flex-1 space-y-1.5 overflow-y-auto p-2">
        {AGENTS.map((a) => (
          <AgentCard key={a.id} a={a} />
        ))}
      </div>
    </aside>
  );
}
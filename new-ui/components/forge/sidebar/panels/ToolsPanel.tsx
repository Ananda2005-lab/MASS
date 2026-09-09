"use client";

// Tools — LIVE registry from backend /system. Switches = REAL backend gating
// (POST /system/tools/{id}/enabled): disabled tools are refused by the ToolManager.

import { useEffect, useState } from "react";
import { Search, Globe, FileText, Terminal, Calculator, Wrench } from "lucide-react";
import { API } from "@/lib/api/client";
import { PanelTitle, Switch } from "../ui";

const GATED = new Set(["fs:write", "exec:sandbox", "exec:terminal", "network"]);

function catIcon(cat: string) {
  switch (cat) {
    case "search": return <Search size={12} />;
    case "browser": return <Globe size={12} />;
    case "files": return <FileText size={12} />;
    case "terminal": return <Terminal size={12} />;
    case "calculator": return <Calculator size={12} />;
    default: return <Wrench size={12} />;
  }
}

interface LiveTool { id: string; cat: string; perms: string[]; enabled: boolean; }

export function ToolsPanel() {
  const [tools, setTools] = useState<LiveTool[] | null>(null);

  const load = () =>
    API.system()
      .then((d: any) => setTools(d?.tools ?? []))
      .catch(() => setTools(null));

  useEffect(() => {
    let on = true;
    const tick = () =>
      API.system()
        .then((d: any) => on && setTools(d?.tools ?? []))
        .catch(() => on && setTools(null));
    tick();
    const t = setInterval(tick, 10_000);
    return () => { on = false; clearInterval(t); };
  }, []);

  async function toggle(id: string, next: boolean) {
    // optimistic
    setTools((ts) => (ts ?? []).map((t) => (t.id === id ? { ...t, enabled: next } : t)));
    try {
      await API.setToolEnabled(id, next);
    } catch {
      await load();
    }
  }

  if (tools === null) {
    return <p className="px-3 py-2 text-2xs text-slate2-muted">Backend offline — tools unavailable.</p>;
  }

  const cats = Array.from(new Set(tools.map((t) => t.cat))).sort();

  return (
    <div className="panel-stagger">
      {cats.map((cat) => (
        <div key={cat}>
          <PanelTitle>{cat}</PanelTitle>
          {tools
            .filter((t) => t.cat === cat)
            .map((t) => {
              const gated = (t.perms ?? []).some((p) => GATED.has(p));
              return (
                <div key={t.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-white/5 hover-glow">
                  <span className={`relative flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${t.enabled ? "bg-white/[0.07] text-slate2-secondary" : "bg-white/[0.03] text-slate2-muted"}`}>
                    {catIcon(cat)}
                  </span>
                  <p className={`min-w-0 flex-1 truncate font-mono text-[10px] ${t.enabled ? "text-slate2-primary" : "text-slate2-muted"}`}>
                    {t.id}
                  </p>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[9px] ${
                      gated ? "bg-semantic-warning/10 text-semantic-warning" : "bg-white/[0.06] text-slate2-muted"
                    }`}
                    title={(t.perms ?? []).join(", ") || "no special permission"}
                  >
                    {gated ? "ask" : "auto"}
                  </span>
                  <Switch on={t.enabled} onChange={() => toggle(t.id, !t.enabled)} />
                </div>
              );
            })}
        </div>
      ))}
      <p className="px-3 pt-2 text-[10px] leading-relaxed text-slate2-muted">
        Switches are live: a disabled tool is refused by the backend until re-enabled.
      </p>
    </div>
  );
}

"use client";

// Integrations — LIVE: LLM providers + MCP filesystem server from backend /system.
// No fake GitHub/Notion cards, no local toggles.

import { useEffect, useState } from "react";
import { Cpu, HardDrive } from "lucide-react";
import { API } from "@/lib/api/client";
import { PanelTitle } from "../ui";

export function IntegrationsPanel() {
  const [sys, setSys] = useState<any>(null);

  useEffect(() => {
    let on = true;
    const load = () =>
      API.system()
        .then((d) => on && setSys(d))
        .catch(() => on && setSys(null));
    load();
    const t = setInterval(load, 10_000);
    return () => { on = false; clearInterval(t); };
  }, []);

  const providers: string[] = sys?.providers ?? [];
  const mcpCount: number = (sys?.mcp_tools ?? []).length;

  return (
    <div className="panel-stagger p-2">
      <PanelTitle>LLM providers</PanelTitle>
      {providers.length === 0 ? (
        <p className="px-1 py-1 text-2xs text-slate2-muted">
          No providers configured — add API keys in backend .env (xkiro / b.ai / openrouter / groq / google).
        </p>
      ) : (
        providers.map((p) => (
          <div key={p} className="mb-1 flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-2">
            <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md ${p === "fake" ? "bg-white/[0.05] text-slate2-muted" : "bg-accent-cyan/15 text-accent-cyan"}`}>
              <Cpu size={13} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-2xs font-medium text-slate2-primary">{p}</p>
              <p className="truncate text-[10px] text-slate2-muted">
                {p === "fake" ? "Offline placeholder — keys pending" : "Connected · keys active"}
              </p>
            </div>
            <span className={`h-1.5 w-1.5 rounded-full ${p === "fake" ? "bg-white/25" : "bg-semantic-success"}`} />
          </div>
        ))
      )}

      <PanelTitle>MCP servers</PanelTitle>
      <div className="mb-1 flex items-center gap-2.5 rounded-lg border border-white/[0.06] bg-white/[0.03] px-2.5 py-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-accent-cyan/15 text-accent-cyan">
          <HardDrive size={13} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-2xs font-medium text-slate2-primary">filesystem</p>
          <p className="truncate text-[10px] text-slate2-muted">
            {mcpCount > 0 ? `Connected · ${mcpCount} tools` : "Not started"}
          </p>
        </div>
        <span className={`h-1.5 w-1.5 rounded-full ${mcpCount > 0 ? "bg-semantic-success" : "bg-white/25"}`} />
      </div>

      <p className="px-1 pt-2 text-[10px] leading-relaxed text-slate2-muted">
        Extra MCP servers: set AAP_MCP_SERVERS in backend .env — they appear here live.
      </p>
    </div>
  );
}

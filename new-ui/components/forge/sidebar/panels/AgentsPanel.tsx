"use client";

// Agents — LIVE roster: real backend roles (/system) + live status from task events
// (chat store bridge setAgentLive). No fake personas, no local toggles.

import { useEffect, useState } from "react";
import { Bot, Search, Code2, PenLine, Bug, Globe, ShieldCheck, FileText, FlaskConical } from "lucide-react";
import { API } from "@/lib/api/client";
import { useForgeUI } from "@/lib/store/forge-ui";
import { PanelTitle, StatusDot, Switch } from "../ui";

function roleIcon(role: string) {
  switch ((role ?? "").toLowerCase()) {
    case "research": return <Search size={12} />;
    case "coding": case "fix": return <Code2 size={12} />;
    case "writing": return <PenLine size={12} />;
    case "debug": case "testing": return <Bug size={12} />;
    case "browser": return <Globe size={12} />;
    case "file": case "deep_reading": return <FileText size={12} />;
    case "analysis": return <FlaskConical size={12} />;
    default: return <ShieldCheck size={12} />;
  }
}

export function AgentsPanel() {
  const agents = useForgeUI((s) => s.agents);
  const setRoles = useForgeUI((s) => s.setRoles);
  const [disabled, setDisabled] = useState<string[]>([]);

  useEffect(() => {
    let on = true;
    API.system()
      .then((d: any) => {
        if (!on) return;
        if (d?.roles) setRoles(d.roles);
        setDisabled(d?.disabled_roles ?? []);
      })
      .catch(() => {});
    return () => { on = false; };
  }, [setRoles]);

  async function toggleRole(role: string, next: boolean) {
    setDisabled((d) => (next ? d.filter((r) => r !== role) : [...d, role]));
    try {
      await API.setRoleEnabled(role, next);
    } catch {
      /* resync on next mount */
    }
  }

  const live = agents.filter((a) => a.status === "working" || a.status === "done");

  return (
    <div className="panel-stagger">
      <PanelTitle>Live · current task</PanelTitle>
      {live.length === 0 ? (
        <p className="px-3 py-2 text-2xs text-slate2-muted">No tasks running — send an instruction to start one.</p>
      ) : (
        live.map((a) => (
          <div key={a.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-white/5 hover-glow">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-accent-cyan/20 to-accent-indigo/20 text-accent-cyan">
              {roleIcon(a.role)}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-2xs font-medium capitalize text-slate2-primary">{a.role}</p>
              <p className="truncate text-[10px] text-slate2-muted">{a.action || "standby"}</p>
            </div>
            <StatusDot status={a.status === "working" ? "running" : "done"} />
          </div>
        ))
      )}

      <PanelTitle>Roles · registered in backend</PanelTitle>
      {agents.length === 0 ? (
        <p className="px-3 py-2 text-2xs text-slate2-muted">Loading roles…</p>
      ) : (
        agents.map((a) => {
          const enabled = !disabled.includes(a.role.toLowerCase());
          return (
            <div key={a.id} className="flex items-center gap-2 rounded-md px-2 py-1.5 transition hover:bg-white/5 hover-glow">
              <span className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md ${enabled ? "bg-white/[0.07] text-slate2-secondary" : "bg-white/[0.03] text-slate2-muted"}`}>
                {roleIcon(a.role)}
              </span>
              <span className={`flex-1 text-2xs capitalize ${enabled ? "text-slate2-primary" : "text-slate2-muted"}`}>{a.role}</span>
              <StatusDot status={a.status === "working" ? "running" : a.status === "done" ? "done" : "idle"} />
              <Switch on={enabled} onChange={() => toggleRole(a.role.toLowerCase(), enabled)} />
            </div>
          );
        })
      )}

      <p className="flex items-center gap-1.5 px-3 pt-3 text-[10px] leading-relaxed text-slate2-muted">
        <Bot size={11} /> Switches are live: disabled roles are remapped by the planner at plan time.
      </p>
    </div>
  );
}

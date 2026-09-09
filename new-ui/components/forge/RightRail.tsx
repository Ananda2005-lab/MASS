"use client";

// RIGHT — live inspector rail: active task, activity feed, approval history, provider health.
// Collapsible (toggle in TopBar area / own handle). Polls real backend. English-only UI.

import { useEffect, useMemo, useState } from "react";
import { PanelRightClose, PanelRightOpen } from "lucide-react";
import { API } from "@/lib/api/client";
import { useChat } from "@/lib/store/chat";
import { useForgeUI } from "@/lib/store/forge-ui";

export function RightRail() {
  const open = useForgeUI((s) => s.rightRail);
  const toggle = useForgeUI((s) => s.toggleRightRail);
  const threads = useChat((s) => s.threads);
  const activeSid = useForgeUI((s) => s.activeSessionId);

  const [sys, setSys] = useState<any>(null);
  const [approvals, setApprovals] = useState<any>(null);
  const [state, setState] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  const taskId = useMemo(() => {
    const msgs = threads[activeSid ?? ""] ?? [];
    return [...msgs].reverse().find((m) => m.role === "agent" && m.taskId)?.taskId ?? null;
  }, [threads, activeSid]);

  useEffect(() => {
    let on = true;
    const load = async () => {
      try {
        const [s, a] = await Promise.all([API.system(), API.listApprovals()]);
        if (!on) return;
        setSys(s);
        setApprovals(a);
      } catch {
        /* offline */
      }
      if (!taskId) return;
      try {
        const [st, ev] = await Promise.all([API.getTaskState(taskId), API.getEvents(taskId, 0)]);
        if (!on) return;
        setState(st);
        setEvents((ev.events ?? []).filter((e: any) => e.type !== "token").slice(-12).reverse());
      } catch {
        /* offline */
      }
    };
    load();
    const t = setInterval(load, 3000);
    return () => {
      on = false;
      clearInterval(t);
    };
  }, [taskId]);

  if (!open) {
    return (
      <button
        type="button"
        onClick={toggle}
        title="Open inspector"
        className="flex w-7 shrink-0 items-center justify-center border-l border-white/5 bg-slate-950/40 text-slate2-muted transition-colors hover:text-accent-cyan"
      >
        <PanelRightOpen size={14} />
      </button>
    );
  }

  const health: Record<string, any> = sys?.provider_health ?? {};

  return (
    <aside className="flex w-72 shrink-0 flex-col gap-3 overflow-y-auto border-l border-white/5 bg-slate-950/50 p-3 backdrop-blur-xl">
      <header className="flex items-center justify-between">
        <h2 className="font-mono text-[11px] tracking-[0.22em] text-slate2-secondary">INSPECTOR</h2>
        <button
          type="button"
          onClick={toggle}
          title="Collapse inspector"
          className="flex h-6 w-6 items-center justify-center rounded-md text-slate2-muted transition-colors hover:bg-white/10 hover:text-slate2-primary"
        >
          <PanelRightClose size={14} />
        </button>
      </header>

      {/* active task */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="mb-1 font-mono text-[10px] tracking-widest text-slate2-muted">ACTIVE TASK</p>
        {taskId ? (
          <>
            <p className="truncate text-[12px] font-medium text-slate2-primary" title={taskId}>
              {taskId.slice(0, 8)}… · {String(state?.status ?? "…").toUpperCase()}
            </p>
            <ul className="mt-2 space-y-1">
              {(state?.plan?.steps ?? []).map((s: any, i: number) => (
                <li key={i} className="flex items-center gap-1.5 text-[11px] text-slate2-secondary">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      s.status === "succeeded"
                        ? "bg-emerald-400"
                        : s.status === "failed"
                          ? "bg-rose-400"
                          : s.status === "running"
                            ? "animate-pulse bg-accent-cyan"
                            : "bg-slate2-secondary/50"
                    }`}
                  />
                  <span className="truncate">{s.goal}</span>
                </li>
              ))}
            </ul>
          </>
        ) : (
          <p className="text-[11px] text-slate2-muted">No task in this session yet.</p>
        )}
      </section>

      {/* live activity */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="mb-1.5 font-mono text-[10px] tracking-widest text-slate2-muted">LIVE ACTIVITY</p>
        {events.length === 0 ? (
          <p className="text-[11px] text-slate2-muted">Quiet for now.</p>
        ) : (
          <ul className="space-y-1">
            {events.map((e: any, i: number) => (
              <li key={i} className="truncate text-[11px] text-slate2-secondary">
                <span className="font-mono text-[9px] text-accent-cyan/80">{String(e.type).toUpperCase()}</span>{" "}
                {e.payload?.tool_id ?? e.payload?.goal ?? ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* approvals history */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="mb-1.5 font-mono text-[10px] tracking-widest text-slate2-muted">APPROVALS</p>
        {(approvals?.pending?.length ?? 0) > 0 && (
          <p className="mb-1 text-[11px] font-medium text-amber-300">
            {approvals.pending.length} waiting for decision
          </p>
        )}
        {(approvals?.history?.length ?? 0) === 0 ? (
          <p className="text-[11px] text-slate2-muted">None yet.</p>
        ) : (
          <ul className="space-y-1">
            {(approvals?.history ?? []).slice(0, 6).map((h: any) => (
              <li key={h.id} className="flex items-center gap-1.5 text-[11px] text-slate2-secondary">
                <span className={h.decision === "approved" ? "text-emerald-400" : "text-rose-400"}>
                  {h.decision === "approved" ? "✓" : "✕"}
                </span>
                <span className="truncate font-mono text-[10px]">{h.tool_id}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* provider health */}
      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <p className="mb-1.5 font-mono text-[10px] tracking-widest text-slate2-muted">PROVIDER HEALTH</p>
        {Object.keys(health).length === 0 ? (
          <p className="text-[11px] text-slate2-muted">No LLM calls yet (add keys to see stats).</p>
        ) : (
          <ul className="space-y-1.5">
            {Object.entries(health).map(([p, h]: [string, any]) => (
              <li key={p} className="text-[11px] text-slate2-secondary">
                <span className="font-mono text-[10px] text-slate2-primary">{p}</span> · {h.ok}/{h.calls} ok ·{" "}
                {h.latency_ms}ms
                {h.fail > 0 && <span className="text-rose-400"> · {h.fail} failed</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </aside>
  );
}

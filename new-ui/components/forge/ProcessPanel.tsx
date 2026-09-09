"use client";

// CENTER tab 2 — live task process: plan steps + real event feed (backend events endpoint).
// Polls getTaskState + getEvents for the active session's latest task. English-only UI.

import { useEffect, useMemo, useState } from "react";
import { API } from "@/lib/api/client";
import { useChat } from "@/lib/store/chat";
import { useForgeUI } from "@/lib/store/forge-ui";

const ICON: Record<string, string> = {
  step_started: "▶",
  step_completed: "✅",
  step_failed: "❌",
  tool_invoked: "🔧",
  tool_result: "📦",
  sub_agent_selected: "🤖",
  sub_agent_result: "🤖",
  approval_requested: "🔐",
  task_completed: "🏁",
  task_created: "🆕",
  plan_updated: "🗺",
  llm_called: "🧠",
  llm_result: "🧠",
};

function payloadDigest(e: any): string {
  const p = e.payload ?? {};
  if (p.tool_id) {
    const bits = [p.tool_id];
    if (p.status) bits.push(p.status);
    if (p.error_code) bits.push(p.error_code);
    if (p.role) bits.push(p.role);
    return bits.join(" · ");
  }
  if (p.goal) return String(p.goal).slice(0, 80);
  if (p.error) return String(p.error).slice(0, 80);
  const s = JSON.stringify(p);
  return s.length > 90 ? s.slice(0, 90) + "…" : s;
}

export function ProcessPanel() {
  const threads = useChat((s) => s.threads);
  const activeSid = useForgeUI((s) => s.activeSessionId);
  const taskId = useMemo(() => {
    const msgs = threads[activeSid ?? ""] ?? [];
    return [...msgs].reverse().find((m) => m.role === "agent" && m.taskId)?.taskId ?? null;
  }, [threads, activeSid]);

  const [state, setState] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);

  useEffect(() => {
    if (!taskId) {
      setState(null);
      setEvents([]);
      return;
    }
    let on = true;
    const load = async () => {
      try {
        const [st, ev] = await Promise.all([API.getTaskState(taskId), API.getEvents(taskId, 0)]);
        if (!on) return;
        setState(st);
        setEvents(ev.events ?? []);
      } catch {
        /* backend offline — keep last */
      }
    };
    load();
    const t = setInterval(load, 2000);
    return () => {
      on = false;
      clearInterval(t);
    };
  }, [taskId]);

  if (!taskId) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="font-mono text-[11px] tracking-[0.25em] text-slate2-muted">
          RUN A TASK TO SEE ITS LIVE PROCESS
        </p>
      </div>
    );
  }

  const steps: any[] = state?.plan?.steps ?? [];
  const feed = [...events].reverse().filter((e) => e.type !== "token").slice(0, 60);
  const tokenCount = events.filter((e) => e.type === "token").length;

  return (
    <div className="h-full overflow-y-auto px-4 py-4 md:px-8">
      <div className="mx-auto grid max-w-5xl items-start gap-4 lg:grid-cols-2">
        {/* plan / steps */}
        <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 backdrop-blur-xl">
          <header className="mb-3 flex items-center justify-between">
            <h2 className="font-mono text-[11px] tracking-[0.22em] text-slate2-secondary">PLAN</h2>
            <span className="rounded-full bg-white/5 px-2.5 py-0.5 font-mono text-[10px] tracking-widest text-accent-cyan ring-1 ring-white/10">
              {String(state?.status ?? "…").toUpperCase()} · {tokenCount} TOKENS
            </span>
          </header>
          {steps.length === 0 ? (
            <p className="text-[12px] text-slate2-muted">Planning…</p>
          ) : (
            <ul className="space-y-2.5">
              {steps.map((s: any, i: number) => (
                <li key={s.id ?? i} className="rounded-xl bg-white/[0.03] px-3 py-2.5 ring-1 ring-white/5">
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2 w-2 shrink-0 rounded-full ${
                        s.status === "succeeded"
                          ? "bg-emerald-400"
                          : s.status === "failed"
                            ? "bg-rose-400"
                            : s.status === "running"
                              ? "animate-pulse bg-accent-cyan"
                              : "bg-slate2-secondary/50"
                      }`}
                    />
                    <p className="min-w-0 flex-1 truncate text-[13px] font-medium text-slate2-primary">
                      {s.goal}
                    </p>
                    {s.assigned_agent && (
                      <span className="rounded-md bg-accent-indigo/20 px-1.5 py-0.5 font-mono text-[10px] text-indigo-300">
                        {s.assigned_agent}
                      </span>
                    )}
                  </div>
                  {(s.tool_ids ?? []).length > 0 && (
                    <p className="mt-1 truncate pl-4 font-mono text-[10px] text-slate2-muted">
                      tools: {(s.tool_ids as string[]).join(", ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* event feed */}
        <section className="rounded-2xl border border-white/10 bg-slate-950/60 p-4 backdrop-blur-xl">
          <header className="mb-3">
            <h2 className="font-mono text-[11px] tracking-[0.22em] text-slate2-secondary">EVENT FEED</h2>
          </header>
          {feed.length === 0 ? (
            <p className="text-[12px] text-slate2-muted">No events yet.</p>
          ) : (
            <ul className="max-h-[60vh] space-y-1.5 overflow-y-auto pr-1">
              {feed.map((e: any, i: number) => (
                <li key={i} className="flex items-start gap-2 rounded-lg bg-white/[0.03] px-2.5 py-1.5 ring-1 ring-white/5">
                  <span className="mt-px shrink-0 text-[12px]">{ICON[e.type] ?? "•"}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] tracking-wider text-accent-cyan/90">
                      {String(e.type).toUpperCase()} <span className="text-slate2-muted">#{e.seq}</span>
                    </p>
                    <p className="truncate text-[11px] text-slate2-secondary">{payloadDigest(e)}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

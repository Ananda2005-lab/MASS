"use client";

// Panel A — Execution Dashboard (real data from task store).
// Shows live task steps + final result once the backend completes.

import { useTaskStore } from "@/lib/store/task";
import { PanelEmptyState } from "@/components/forge/PanelEmptyState";
import { LayoutDashboard, CheckCircle2, XCircle, Loader2, Sparkles } from "lucide-react";

const STEP_ICON: Record<string, React.ReactNode> = {
  done: <CheckCircle2 size={13} className="text-semantic-success" />,
  error: <XCircle size={13} className="text-semantic-error" />,
  processing: <Loader2 size={13} className="animate-spin text-accent-cyan" />,
  pending: <span className="h-2 w-2 rounded-full border border-white/25" />,
};

export function ExecutionDashboard() {
  const phase = useTaskStore((s) => s.phase);
  const steps = useTaskStore((s) => s.steps);
  const finalResult = useTaskStore((s) => s.finalResult);
  const error = useTaskStore((s) => s.error);
  const lastInstruction = useTaskStore((s) => s.lastInstruction);
  const busy = useTaskStore((s) => s.busy);

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto p-3">
        {phase === "idle" ? (
          <PanelEmptyState
            icon={<LayoutDashboard size={18} />}
            title="Waiting for your instruction"
            hint="Neeche command bar me likho aur Enter dabao — agent real LLM se kaam karega, progress yahan live dikhega."
          />
        ) : (
          <div className="space-y-3">
            {/* status header */}
            <div className="flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
              <span className={`h-2 w-2 rounded-full ${phase === "error" ? "bg-semantic-error" : "animate-pulse-soft bg-accent-cyan"}`} />
              <span className="text-xs2 font-medium capitalize text-slate2-primary">
                {phase === "planning" ? "Planning…" : phase === "executing" ? "Executing…" : phase === "completed" ? "Completed" : "Error"}
              </span>
              {busy && <Loader2 size={13} className="ml-auto animate-spin text-accent-cyan" />}
            </div>

            {/* instruction */}
            {lastInstruction && (
              <div className="rounded-lg border border-accent-violet/20 bg-accent-violet/[0.06] px-3 py-2">
                <p className="text-2xs uppercase tracking-widest text-accent-violet">Your instruction</p>
                <p className="mt-1 text-xs2 leading-relaxed text-slate2-primary">{lastInstruction}</p>
              </div>
            )}

            {/* steps */}
            {steps.length > 0 && (
              <div>
                <p className="mb-1.5 text-2xs uppercase tracking-widest text-slate2-muted">Plan steps</p>
                <div className="space-y-1.5">
                  {steps.map((s, i) => (
                    <div key={s.id ?? i} className="flex items-center gap-2.5 rounded-md border border-white/[0.06] bg-white/[0.02] px-3 py-2">
                      <span className="shrink-0">{STEP_ICON[s.status] ?? STEP_ICON.pending}</span>
                      <span className={`flex-1 text-xs2 ${s.status === "done" ? "text-slate2-primary" : s.status === "processing" ? "text-accent-cyan" : "text-slate2-secondary"}`}>
                        {s.label}
                      </span>
                      {s.agent && <span className="rounded-full border border-white/10 px-1.5 py-0.5 text-[9px] text-slate2-muted">{s.agent}</span>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* final result */}
            {finalResult && (
              <div className="rounded-lg border border-semantic-success/25 bg-semantic-success/[0.05] px-3 py-3">
                <p className="flex items-center gap-1.5 text-2xs uppercase tracking-widest text-semantic-success">
                  <Sparkles size={12} /> Final result
                </p>
                <p className="mt-1.5 whitespace-pre-wrap text-xs2 leading-relaxed text-slate2-primary">{finalResult}</p>
              </div>
            )}

            {/* error */}
            {error && (
              <div className="rounded-lg border border-semantic-error/25 bg-semantic-error/[0.05] px-3 py-2">
                <p className="text-2xs uppercase tracking-widest text-semantic-error">Error</p>
                <p className="mt-1 text-xs2 text-slate2-secondary">{error}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
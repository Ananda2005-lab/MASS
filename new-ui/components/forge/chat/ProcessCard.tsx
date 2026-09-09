"use client";

// Live task process card — Swiggy-tracking style step list, collapsible.

import { useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { StepUI } from "@/lib/store/chat";

function StepIcon({ status }: { status: StepUI["status"] }) {
  if (status === "succeeded")
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-green/20 text-accent-green">
        <Check size={10} strokeWidth={3} />
      </span>
    );
  if (status === "failed")
    return (
      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-accent-red/20 text-accent-red">
        <X size={10} strokeWidth={3} />
      </span>
    );
  if (status === "running")
    return (
      <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-[1.5px] border-accent-cyan/30 border-t-accent-cyan" />
    );
  return <span className="mx-[5px] h-1.5 w-1.5 shrink-0 rounded-full bg-slate2-muted/50" />;
}

export function ProcessCard({
  steps,
  status,
}: {
  steps: StepUI[];
  status: "thinking" | "running" | "done" | "error";
}) {
  const [open, setOpen] = useState(true);
  const live = status === "running" || status === "thinking";
  const doneCount = steps.filter((s) => s.status === "succeeded").length;

  return (
    <div className="mt-2 overflow-hidden rounded-xl border border-white/10 bg-white/[0.05]">
      {/* header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition hover:bg-white/[0.04]"
      >
        <span className="font-mono text-[10px] tracking-[0.25em] text-slate2-primary/80">PROCESS</span>
        {live ? (
          <span className="flex items-center gap-1.5 rounded-full bg-accent-cyan/15 px-2 py-0.5 font-mono text-[10px] tracking-widest text-accent-cyan">
            <span className="h-1 w-1 animate-pulse rounded-full bg-accent-cyan" />
            RUNNING
          </span>
        ) : status === "error" ? (
          <span className="rounded-full bg-accent-red/15 px-2 py-0.5 font-mono text-[10px] tracking-widest text-accent-red">
            FAILED
          </span>
        ) : (
          <span className="rounded-full bg-accent-green/15 px-2 py-0.5 font-mono text-[10px] tracking-widest text-accent-green">
            DONE {doneCount}/{steps.length || doneCount}
          </span>
        )}
        <ChevronDown
          size={13}
          className={`ml-auto text-slate2-muted transition-transform duration-fast ${open ? "" : "-rotate-90"}`}
        />
      </button>

      {/* steps */}
      {open && (
        <div className="space-y-1.5 border-t border-white/[0.06] px-3 py-2.5">
          {steps.length === 0 && (
            <p className="font-mono text-[11px] tracking-wider text-slate2-primary/70">
              {live ? "BUILDING PLAN…" : "NO STEPS"}
            </p>
          )}
          {steps.map((s) => (
            <div key={s.id} className="flex items-start gap-2">
              <div className="mt-0.5">
                <StepIcon status={s.status} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium leading-snug text-slate2-primary">{s.goal}</p>
                <p className="mt-0.5 flex flex-wrap items-center gap-1">
                  {s.agent && (
                    <span className="rounded bg-accent-indigo/20 px-1.5 py-px font-mono text-[10px] tracking-wider text-accent-indigo">
                      {s.agent}
                    </span>
                  )}
                  {s.tools.slice(0, 3).map((t) => (
                    <span
                      key={t}
                      className="rounded bg-white/[0.08] px-1.5 py-px font-mono text-[10px] tracking-wider text-slate2-primary/80"
                    >
                      {t}
                    </span>
                  ))}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

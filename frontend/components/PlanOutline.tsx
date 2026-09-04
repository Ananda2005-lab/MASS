"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { VerificationBadge } from "@/components/VerificationBadge";
import type { Plan, Step } from "@/lib/types";

export interface PlanOutlineProps {
  plan: Plan | null;
}

/** Mode A: expandable plan outline with steps + verification points. */
export function PlanOutline({ plan }: PlanOutlineProps) {
  const [open, setOpen] = React.useState<Record<string, boolean>>({});

  if (!plan) {
    return (
      <p className="text-sm text-muted-foreground">No plan yet.</p>
    );
  }

  function toggle(id: string) {
    setOpen((o) => ({ ...o, [id]: !o[id] }));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-muted-foreground">
          Strategy: {plan.strategy ?? "sequential"}
        </span>
        <span className="text-xs text-muted-foreground">
          {plan.steps.length} steps · {plan.verification_points.length} verification points
        </span>
      </div>

      <ol className="flex flex-col gap-1">
        {plan.steps.map((step, idx) => (
          <StepRow
            key={step.id}
            step={step}
            index={idx}
            open={Boolean(open[step.id])}
            onToggle={() => toggle(step.id)}
          />
        ))}
      </ol>

      {plan.verification_points.length > 0 && (
        <div className="mt-1 rounded-md border border-border p-2">
          <p className="text-xs font-semibold">Verification points</p>
          <ul className="ml-4 list-disc text-xs text-muted-foreground">
            {plan.verification_points.map((vp) => (
              <li key={vp}>{vp}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function StepRow({
  step,
  index,
  open,
  onToggle,
}: {
  step: Step;
  index: number;
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <li className="rounded-md border border-border">
      <button
        className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm"
        onClick={onToggle}
      >
        <span className="text-muted-foreground">{index + 1}.</span>
        <span className="flex-1">{step.goal}</span>
        <VerificationBadge status={step.status ?? "pending"} />
      </button>
      {open && (
        <div className="border-t border-border px-3 py-2 text-xs text-muted-foreground">
          <div>Agent: {step.assigned_agent ?? "—"}</div>
          <div>Tools: {step.tool_ids.join(", ") || "—"}</div>
          <div>Depends on: {step.depends_on.join(", ") || "—"}</div>
          {step.result && (
            <div className="mt-1">Result: {step.result.summary || step.result.status}</div>
          )}
        </div>
      )}
    </li>
  );
}

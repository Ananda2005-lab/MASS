"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import type { Constraint, ConstraintKind } from "@/lib/types";

export interface InstructionInputProps {
  onSubmit: (raw: string, constraints: Constraint[]) => void;
  disabled?: boolean;
}

const CONSTRAINT_KINDS: ConstraintKind[] = [
  "model",
  "sub_agent",
  "tool",
  "order",
  "scope",
  "permission",
];

/** Mode A: natural-language instruction + constraint chips. */
export function InstructionInput({ onSubmit, disabled }: InstructionInputProps) {
  const [text, setText] = React.useState("");
  const [chips, setChips] = React.useState<Constraint[]>([]);
  const [chipKind, setChipKind] = React.useState<ConstraintKind>("model");
  const [chipValue, setChipValue] = React.useState("");

  function addChip() {
    if (!chipValue.trim()) return;
    setChips((c) => [...c, { kind: chipKind, value: chipValue.trim() }]);
    setChipValue("");
  }

  function submit() {
    if (!text.trim()) return;
    onSubmit(text.trim(), chips);
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-border p-4">
      <textarea
        className="min-h-[88px] w-full resize-y rounded-md border border-border bg-background p-2 text-sm"
        placeholder="Describe the task you want the agent to perform autonomously…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
      />

      <div className="flex flex-wrap items-center gap-2">
        <select
          className="h-9 rounded-md border border-border bg-background px-2 text-sm"
          value={chipKind}
          onChange={(e) => setChipKind(e.target.value as ConstraintKind)}
        >
          {CONSTRAINT_KINDS.map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </select>
        <input
          className="h-9 flex-1 rounded-md border border-border bg-background px-2 text-sm"
          placeholder="constraint value (e.g. gpt-4o, research-agent)"
          value={chipValue}
          onChange={(e) => setChipValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addChip()}
        />
        <Button size="sm" variant="outline" onClick={addChip} disabled={disabled}>
          Add
        </Button>
      </div>

      {chips.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {chips.map((c, i) => (
            <span
              key={`${c.kind}-${c.value}-${i}`}
              className="rounded-full bg-muted px-3 py-1 text-xs"
            >
              {c.kind}: {c.value}
              <button
                className="ml-2 text-muted-foreground"
                onClick={() => setChips((arr) => arr.filter((_, idx) => idx !== i))}
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={submit} disabled={disabled || !text.trim()}>
          Run autonomously
        </Button>
      </div>
    </div>
  );
}

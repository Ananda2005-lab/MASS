"use client";

import * as React from "react";
import { ApiClient } from "@/lib/api";
import { RealtimeClient } from "@/lib/realtime";
import { useInstructionStore } from "@/store/instructionStore";
import { InstructionInput } from "@/components/InstructionInput";
import { PlanOutline } from "@/components/PlanOutline";
import { ActivityStream } from "@/components/ActivityStream";
import { ResultPanel } from "@/components/ResultPanel";
import { ControlBar } from "@/components/ControlBar";
import { Panel } from "@/components/Panel";
import type { Constraint } from "@/lib/types";

/**
 * MODE A — Instruction (autonomous pipeline view).
 * Distinct from Workspace: task-driven pipeline (plan → steps → sub-agents/tools → verify → result).
 * Not a plain chatbot.
 */
export default function InstructionPage() {
  const api = React.useMemo(() => new ApiClient(), []);
  const rt = React.useMemo(() => new RealtimeClient(), []);
  const { taskId, plan, events, result, status, setTask, applyEvent, reset } =
    useInstructionStore();

  const [pendingTicket, setPendingTicket] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!taskId) return;
    const unsub = rt.subscribe(taskId, (e) => {
      applyEvent(e);
      if (e.type === "permission_requested") {
        setPendingTicket(String((e.payload as Record<string, unknown>).ticket ?? ""));
      }
    });
    rt.connect(taskId);
    return () => {
      unsub();
      rt.close();
    };
  }, [taskId, rt, applyEvent]);

  async function handleSubmit(raw: string, constraints: Constraint[]) {
    reset();
    const task = await api.postInstruction({ raw, mode: "instruction", constraints });
    setTask(task);
  }

  function handleInterrupt() {
    if (taskId) rt.sendCommand({ type: "interrupt", task_id: taskId });
  }
  function handleResume() {
    if (taskId) rt.sendCommand({ type: "resume", task_id: taskId });
  }
  function handleApprove(ticket: string) {
    if (taskId) {
      void api.approve(taskId, { ticket, allowed: true });
      setPendingTicket(null);
    }
  }

  return (
    <main className="mx-auto flex max-w-4xl flex-col gap-4 p-6">
      <header>
        <h1 className="text-xl font-bold">Instruction Mode</h1>
        <p className="text-sm text-muted-foreground">
          Autonomous pipeline: the agent plans, delegates to sub-agents/tools, verifies, and returns a result.
        </p>
      </header>

      <InstructionInput onSubmit={handleSubmit} disabled={Boolean(taskId)} />

      <ControlBar
        status={status}
        taskId={taskId}
        onInterrupt={handleInterrupt}
        onResume={handleResume}
        onApprove={handleApprove}
        pendingTicket={pendingTicket}
      />

      <Panel title="Plan">
        <PlanOutline plan={plan} />
      </Panel>

      <Panel title="Live Activity (sub-agents · tools · verification)">
        <ActivityStream events={events} taskId={taskId} />
      </Panel>

      <ResultPanel result={result} status={status} />
    </main>
  );
}

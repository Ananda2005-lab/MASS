"use client";

import * as React from "react";
import { ApiClient } from "@/lib/api";
import { RealtimeClient } from "@/lib/realtime";
import { useWorkspaceStore, type PanelName } from "@/store/workspaceStore";
import { Panel } from "@/components/Panel";
import { ActivityStream } from "@/components/ActivityStream";
import { PlanOutline } from "@/components/PlanOutline";
import { ResultPanel } from "@/components/ResultPanel";
import { ControlBar } from "@/components/ControlBar";
import { Button } from "@/components/ui/button";
import type { Constraint } from "@/lib/types";

/**
 * MODE B — Workspace (adaptive multi-panel general task environment).
 * Distinct from Instruction: panels show/hide based on task type/events.
 * NOT a coding IDE — a general interactive environment.
 */
export default function WorkspacePage() {
  const api = React.useMemo(() => new ApiClient(), []);
  const rt = React.useMemo(() => new RealtimeClient(), []);
  const { panels, taskState, taskType, applyEvent, setPanel, setTask, reset } =
    useWorkspaceStore();

  const [pendingTicket, setPendingTicket] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!taskState?.id) return;
    const unsub = rt.subscribe(taskState.id, (e) => {
      applyEvent(e);
      if (e.type === "permission_requested") {
        setPendingTicket(String((e.payload as Record<string, unknown>).ticket ?? ""));
      }
    });
    rt.connect(taskState.id);
    return () => {
      unsub();
      rt.close();
    };
  }, [taskState?.id, rt, applyEvent]);

  async function handleSubmit(raw: string, constraints: Constraint[]) {
    reset();
    const task = await api.postInstruction({ raw, mode: "workspace", constraints });
    setTask(task);
  }

  return (
    <main className="mx-auto flex flex-col gap-4 p-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">Workspace Mode</h1>
          <p className="text-sm text-muted-foreground">
            Adaptive environment — panels appear as the task needs them. Task: {taskType ?? "—"}
          </p>
        </div>
        <Button size="sm" variant="outline" onClick={() => handleSubmit("Start a workspace task", [])}>
          New task
        </Button>
      </header>

      <ControlBar
        status={taskState?.status ?? null}
        taskId={taskState?.id ?? null}
        onInterrupt={() => taskState?.id && rt.sendCommand({ type: "interrupt", task_id: taskState.id })}
        onResume={() => taskState?.id && rt.sendCommand({ type: "resume", task_id: taskState.id })}
        onApprove={(t) => taskState?.id && api.approve(taskState.id, { ticket: t, allowed: true }).then(() => setPendingTicket(null))}
        pendingTicket={pendingTicket}
      />

      <div className="grid grid-cols-12 gap-3">
        {panels.Files && (
          <Panel title="Files" className="col-span-4">
            <p className="text-sm text-muted-foreground">Files relevant to this task.</p>
          </Panel>
        )}
        {panels.Research && (
          <Panel title="Research" className="col-span-4">
            <p className="text-sm text-muted-foreground">Research findings.</p>
          </Panel>
        )}
        {panels.Analysis && (
          <Panel title="Analysis" className="col-span-4">
            <p className="text-sm text-muted-foreground">Analysis output.</p>
          </Panel>
        )}
        {panels.Tools && (
          <Panel title="Tools" className="col-span-3">
            <p className="text-sm text-muted-foreground">Tool catalog & invocations.</p>
          </Panel>
        )}
        {panels.Browser && (
          <Panel title="Browser" className="col-span-5">
            <p className="text-sm text-muted-foreground">Browser agent activity.</p>
          </Panel>
        )}
        {panels.Execution && (
          <Panel title="Execution" className="col-span-4">
            <p className="text-sm text-muted-foreground">Execution / terminal output.</p>
          </Panel>
        )}
        {panels.AgentActivity && (
          <Panel title="Agent Activity" className="col-span-5">
            <ActivityStream events={[]} taskId={taskState?.id ?? null} />
          </Panel>
        )}
        {panels.Results && (
          <Panel title="Results" className="col-span-4">
            <ResultPanel result={taskState?.final_result ?? null} status={taskState?.status ?? null} />
          </Panel>
        )}
        {panels.TaskState && (
          <Panel title="Task State" className="col-span-3">
            <PlanOutline plan={taskState?.plan ?? null} />
          </Panel>
        )}
        {panels.Chat && (
          <Panel title="Chat" className="col-span-4">
            <p className="text-sm text-muted-foreground">Conversation with the agent.</p>
            <button
              className="mt-2 text-xs underline"
              onClick={() => handleSubmit("Continue in workspace", [])}
            >
              Send message
            </button>
          </Panel>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Visible panels:{" "}
        {(Object.keys(panels) as PanelName[])
          .filter((p) => panels[p])
          .join(", ") || "none"}
      </p>
    </main>
  );
}

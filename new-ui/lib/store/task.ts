"use client";

// Live task store — submits instructions to the backend and polls until done.
// submit() resolves with the final result text (or null on failure).

import { create } from "zustand";
import { API } from "@/lib/api/client";

export type TaskPhase = "idle" | "planning" | "executing" | "completed" | "failed" | "error";

export interface LiveStep {
  id: string;
  label: string;
  agent: string;
  status: "pending" | "processing" | "done" | "error";
  result?: string;
}

interface TaskState {
  phase: TaskPhase;
  taskId: string | null;
  lastInstruction: string;
  steps: LiveStep[];
  finalResult: string | null;
  error: string | null;
  busy: boolean;
  submit: (raw: string) => Promise<string | null>;
  reset: () => void;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export const useTaskStore = create<TaskState>((set) => ({
  phase: "idle",
  taskId: null,
  lastInstruction: "",
  steps: [],
  finalResult: null,
  error: null,
  busy: false,

  submit: async (raw: string) => {
    set({ busy: true, lastInstruction: raw, finalResult: null, error: null, steps: [], phase: "planning", taskId: null });
    try {
      const res = await API.submitInstruction(raw);
      const taskId = res.task_id;
      set({ taskId });

      // poll until the task reaches a terminal state
      for (let i = 0; i < 150; i++) {
        await sleep(1500);
        try {
          const state = await API.getTaskState(taskId);
          const task = await API.getTask(taskId);
          const steps: LiveStep[] = (state.plan?.steps ?? []).map((s: any) => ({
            id: s.id,
            label: s.goal || s.label || s.role || "step",
            agent: s.assigned_agent || s.agent_role || "",
            status:
              s.status === "done" || s.status === "completed"
                ? "done"
                : s.status === "error" || s.status === "failed"
                ? "error"
                : "pending",
          }));
          const phase = state.status as TaskPhase;
          const finalResult: string | null = task.final_result?.summary || null;
          set({ phase, steps, finalResult });

          if (phase === "completed" || phase === "failed" || phase === "error") {
            set({ busy: false });
            return finalResult;
          }
        } catch {
          // transient fetch error — keep polling
        }
      }
      set({ phase: "error", error: "Task timeout (250s)", busy: false });
      return null;
    } catch (e: any) {
      set({ phase: "error", error: String(e?.message || e), busy: false });
      return null;
    }
  },

  reset: () =>
    set({
      phase: "idle",
      taskId: null,
      lastInstruction: "",
      steps: [],
      finalResult: null,
      error: null,
      busy: false,
    }),
}));
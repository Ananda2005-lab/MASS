import { create } from "zustand";
import type { Event, Plan, Result, Task, TaskStatus } from "@/lib/types";

/**
 * Instruction-mode store (spec §19 / 21.6).
 * Store updates are pure reducers of Event objects — no business logic.
 */
interface InstructionState {
  taskId: string | null;
  plan: Plan | null;
  events: Event[];
  result: Result | null;
  status: TaskStatus | null;
  setTask: (task: Task) => void;
  applyEvent: (event: Event) => void;
  reset: () => void;
}

function patchStep(
  plan: Plan | null,
  stepId: string | null | undefined,
  patch: Partial<import("@/lib/types").Step>
): Plan | null {
  if (!plan || !stepId) return plan;
  return {
    ...plan,
    steps: plan.steps.map((s) =>
      s.id === stepId ? { ...s, ...patch } : s
    ),
  };
}

export const useInstructionStore = create<InstructionState>((set) => ({
  taskId: null,
  plan: null,
  events: [],
  result: null,
  status: null,

  setTask: (task) =>
    set({
      taskId: task.id,
      plan: task.plan,
      status: task.status ?? null,
      result: task.final_result ?? null,
    }),

  applyEvent: (event) =>
    set((state) => {
      const events = [...state.events, event];
      let plan = state.plan;
      let status = state.status;
      let result = state.result;

      switch (event.type) {
        case "plan_updated": {
          const next = event.payload.plan as Plan | undefined;
          if (next) plan = next;
          break;
        }
        case "step_started": {
          status = "executing";
          plan = patchStep(plan, event.step_id, { status: "running" });
          break;
        }
        case "step_completed": {
          const stepResult = event.payload.result as Result | undefined;
          plan = patchStep(plan, event.step_id, {
            status: "succeeded",
            result: stepResult ?? null,
          });
          break;
        }
        case "step_failed": {
          plan = patchStep(plan, event.step_id, { status: "failed" });
          break;
        }
        case "verification_started": {
          plan = patchStep(plan, event.step_id, { status: "verifying" });
          break;
        }
        case "verification_result": {
          const ok = Boolean(event.payload.ok);
          plan = patchStep(plan, event.step_id, {
            status: ok ? "succeeded" : "failed",
          });
          break;
        }
        case "task_completed": {
          status = "completed";
          const fr = event.payload.result as Result | undefined;
          if (fr) result = fr;
          break;
        }
        case "task_failed": {
          status = "failed";
          break;
        }
        case "task_paused": {
          status = "paused";
          break;
        }
        case "task_resumed": {
          status = "executing";
          break;
        }
        default:
          break;
      }

      return { events, plan, status, result };
    }),

  reset: () =>
    set({ taskId: null, plan: null, events: [], result: null, status: null }),
}));

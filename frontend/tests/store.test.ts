import { describe, it, expect, beforeEach } from "vitest";
import { useInstructionStore } from "../store/instructionStore";
import type { Event, Plan, Step, Task } from "../lib/types";

function makePlan(): Plan {
  const step: Step = {
    id: "step-1",
    goal: "Do the thing",
    tool_ids: [],
    input_refs: [],
    depends_on: [],
    status: "pending",
  };
  return {
    id: "plan-1",
    steps: [step],
    edges: [],
    strategy: "sequential",
    verification_points: ["vp-1"],
  };
}

function makeTask(): Task {
  return {
    id: "task-1",
    conversation_id: "conv-1",
    user_id: "user-1",
    intent: { raw: "x", goal: "x", constraints: [], classification: "unknown" },
    plan: makePlan(),
    status: "created",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    metadata: {},
  };
}

describe("instructionStore.applyEvent", () => {
  beforeEach(() => {
    useInstructionStore.getState().reset();
    useInstructionStore.getState().setTask(makeTask());
  });

  it("marks the step as succeeded on step_completed and appends the event", () => {
    const evt: Event = {
      id: "evt-2",
      type: "step_completed",
      task_id: "task-1",
      step_id: "step-1",
      actor: "agent",
      payload: { ok: true },
      seq: 2,
    };

    useInstructionStore.getState().applyEvent(evt);

    const state = useInstructionStore.getState();
    expect(state.events).toHaveLength(1);
    expect(state.events[0].id).toBe("evt-2");
    const step = state.plan?.steps.find((s) => s.id === "step-1");
    expect(step?.status).toBe("succeeded");
  });

  it("does not mutate unrelated steps", () => {
    useInstructionStore.getState().applyEvent({
      id: "evt-3",
      type: "step_completed",
      task_id: "task-1",
      step_id: "step-1",
      payload: {},
    });
    const step = useInstructionStore.getState().plan?.steps.find((s) => s.id === "step-1");
    expect(step?.status).toBe("succeeded");
  });
});

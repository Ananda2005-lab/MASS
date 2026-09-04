import { describe, it, expect } from "vitest";
import type { Event, EventType, EventActor } from "../lib/types";

/**
 * Structural check that a sample Event matches the Event envelope shape
 * defined in lib/types.ts (mirrors backend/app/core/event.py).
 */
describe("Event type shape", () => {
  const sample: Event = {
    id: "evt-1",
    type: "step_completed" as EventType,
    task_id: "task-1",
    step_id: "step-1",
    actor: "agent" as EventActor,
    timestamp: "2026-01-01T00:00:00Z",
    payload: { ok: true },
    seq: 1,
  };

  it("has required string fields id, type, task_id", () => {
    expect(typeof sample.id).toBe("string");
    expect(typeof sample.type).toBe("string");
    expect(typeof sample.task_id).toBe("string");
  });

  it("has payload as an object", () => {
    expect(typeof sample.payload).toBe("object");
    expect(sample.payload).not.toBeNull();
  });

  it("accepts known event types", () => {
    const types: EventType[] = [
      "task_created",
      "plan_updated",
      "step_started",
      "step_completed",
      "verification_result",
      "task_completed",
    ];
    for (const t of types) {
      expect(() => {
        const e: Event = { id: "x", type: t, task_id: "t", payload: {} };
        return e;
      }).not.toThrow();
    }
  });
});

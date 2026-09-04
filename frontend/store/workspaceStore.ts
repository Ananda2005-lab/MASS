import { create } from "zustand";
import type { Event, Task, TaskType } from "@/lib/types";

/** Panel names available in Workspace mode (spec §20 / 21.6). */
export type PanelName =
  | "Files"
  | "Research"
  | "Results"
  | "Analysis"
  | "Tools"
  | "AgentActivity"
  | "Browser"
  | "Execution"
  | "TaskState"
  | "Chat";

/**
 * Workspace-mode store (spec §20 / 21.6).
 * Panels show/hide adaptively based on task type and incoming events.
 * Pure reducer of events — no business logic.
 */
interface WorkspaceState {
  panels: Record<PanelName, boolean>;
  taskState: Task | null;
  taskType: TaskType | null;
  applyEvent: (event: Event) => void;
  setPanel: (name: PanelName, visible: boolean) => void;
  setTask: (task: Task) => void;
  reset: () => void;
}

const ALL_PANELS: PanelName[] = [
  "Files",
  "Research",
  "Results",
  "Analysis",
  "Tools",
  "AgentActivity",
  "Browser",
  "Execution",
  "TaskState",
  "Chat",
];

function emptyPanels(): Record<PanelName, boolean> {
  return ALL_PANELS.reduce(
    (acc, p) => ({ ...acc, [p]: false }),
    {} as Record<PanelName, boolean>
  );
}

/** Map a task type to the panels it should reveal. */
function panelsForTaskType(type: TaskType): Partial<Record<PanelName, boolean>> {
  switch (type) {
    case "research":
      return { Research: true, AgentActivity: true, Results: true, TaskState: true, Chat: true };
    case "analysis":
      return { Analysis: true, AgentActivity: true, Results: true, TaskState: true, Chat: true };
    case "code":
    case "debug":
    case "fix":
    case "test":
    case "review":
      return {
        Files: true,
        Execution: true,
        AgentActivity: true,
        Results: true,
        TaskState: true,
        Chat: true,
      };
    case "write":
      return { Results: true, AgentActivity: true, TaskState: true, Chat: true };
    case "browser":
      return { Browser: true, AgentActivity: true, Results: true, TaskState: true, Chat: true };
    case "file":
      return { Files: true, AgentActivity: true, TaskState: true, Chat: true };
    case "verify":
    case "security":
      return { AgentActivity: true, Results: true, TaskState: true, Chat: true };
    case "mixed":
      return {
        Files: true,
        Research: true,
        Results: true,
        Analysis: true,
        Tools: true,
        AgentActivity: true,
        Browser: true,
        Execution: true,
        TaskState: true,
        Chat: true,
      };
    default:
      return { TaskState: true, AgentActivity: true, Chat: true };
  }
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  panels: emptyPanels(),
  taskState: null,
  taskType: null,

  setTask: (task) =>
    set((state) => ({
      taskState: task,
      taskType: task.intent.classification,
      panels: { ...state.panels, ...panelsForTaskType(task.intent.classification) },
    })),

  applyEvent: (event) =>
    set((state) => {
      const panels = { ...state.panels };
      // Reveal panels dynamically as work happens.
      switch (event.type) {
        case "tool_invoked": {
          const cat = String(event.payload.category ?? "");
          if (cat === "browser") panels.Browser = true;
          if (cat === "files") panels.Files = true;
          panels.Tools = true;
          panels.AgentActivity = true;
          break;
        }
        case "sub_agent_selected": {
          const role = String(event.payload.role ?? "");
          if (role === "research") panels.Research = true;
          if (role === "analysis") panels.Analysis = true;
          panels.AgentActivity = true;
          break;
        }
        case "step_completed":
        case "sub_agent_result":
        case "tool_result":
          panels.Results = true;
          break;
        case "task_completed":
        case "task_failed":
          panels.TaskState = true;
          break;
        default:
          break;
      }
      return { panels };
    }),

  setPanel: (name, visible) =>
    set((state) => ({ panels: { ...state.panels, [name]: visible } })),

  reset: () => set({ panels: emptyPanels(), taskState: null, taskType: null }),
}));

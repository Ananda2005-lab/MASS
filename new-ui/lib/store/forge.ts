"use client";

// Forge global UI state (zustand).
import { create } from "zustand";

export type AgentStatus = "idle" | "processing" | "active";

interface ForgeState {
  // layout
  leftOpen: boolean;
  rightOpen: boolean;
  bottomOpen: boolean;
  leftCollapsed: boolean; // icon-only mode
  rightCollapsed: boolean;
  leftWidth: number;
  rightWidth: number;
  activeLeftSection: string | null;
  activeRightSection: string | null;
  zenMode: boolean;
  // agent
  agentStatus: AgentStatus;
  projectName: string;
  // panels (shared with PanelGrid — controlled from RightSidebar)
  panelVisibility: Record<string, boolean>;
  maximizedPanel: string | null;
  togglePanel: (id: string) => void;
  setMaximizedPanel: (id: string | null) => void;
  // actions
  toggleLeft: () => void;
  toggleRight: () => void;
  toggleBottom: () => void;
  toggleLeftCollapse: () => void;
  toggleRightCollapse: () => void;
  setLeftWidth: (w: number) => void;
  setRightWidth: (w: number) => void;
  setActiveLeftSection: (id: string | null) => void;
  setActiveRightSection: (id: string | null) => void;
  toggleZen: () => void;
  setAgentStatus: (s: AgentStatus) => void;
  setProjectName: (n: string) => void;
  resetLayout: () => void;
}

const DEFAULTS = {
  leftWidth: 260,
  rightWidth: 300,
};

export const useForgeStore = create<ForgeState>((set) => ({
  leftOpen: true,
  rightOpen: true,
  bottomOpen: true,
  leftCollapsed: false,
  rightCollapsed: false,
  leftWidth: DEFAULTS.leftWidth,
  rightWidth: DEFAULTS.rightWidth,
  activeLeftSection: "explorer",
  activeRightSection: "config",
  zenMode: false,
  agentStatus: "idle",
  projectName: "Untitled Project",
  panelVisibility: { execution: true, research: true, output: true },
  maximizedPanel: null,

  togglePanel: (id) =>
    set((s) => ({
      panelVisibility: { ...s.panelVisibility, [id]: !(s.panelVisibility[id] ?? true) },
      maximizedPanel: s.maximizedPanel === id ? null : s.maximizedPanel,
    })),
  setMaximizedPanel: (id) => set({ maximizedPanel: id }),

  toggleLeft: () => set((s) => ({ leftOpen: !s.leftOpen })),
  toggleRight: () => set((s) => ({ rightOpen: !s.rightOpen })),
  toggleBottom: () => set((s) => ({ bottomOpen: !s.bottomOpen })),
  toggleLeftCollapse: () => set((s) => ({ leftCollapsed: !s.leftCollapsed })),
  toggleRightCollapse: () => set((s) => ({ rightCollapsed: !s.rightCollapsed })),
  setLeftWidth: (w) => set({ leftWidth: Math.max(200, Math.min(400, w)) }),
  setRightWidth: (w) => set({ rightWidth: Math.max(240, Math.min(380, w)) }),
  setActiveLeftSection: (id) => set({ activeLeftSection: id }),
  setActiveRightSection: (id) => set({ activeRightSection: id }),
  toggleZen: () => set((s) => ({ zenMode: !s.zenMode })),
  setAgentStatus: (st) => set({ agentStatus: st }),
  setProjectName: (n) => set({ projectName: n }),
  resetLayout: () =>
    set({
      leftOpen: true,
      rightOpen: true,
      bottomOpen: true,
      leftCollapsed: false,
      rightCollapsed: false,
      leftWidth: DEFAULTS.leftWidth,
      rightWidth: DEFAULTS.rightWidth,
      activeLeftSection: "explorer",
      activeRightSection: "config",
      zenMode: false,
      panelVisibility: { execution: true, research: true, output: true },
      maximizedPanel: null,
    }),
}));

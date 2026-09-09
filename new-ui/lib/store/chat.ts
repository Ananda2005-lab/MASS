"use client";

// Forge chat store — per-session threads + live task process (real backend).
// Har session ki apni chat history. Polling-based (no WS/SSE). LS persistence.

import { create } from "zustand";
import { API } from "@/lib/api/client";
import { useForgeUI } from "@/lib/store/forge-ui";

export type StepStatus = "pending" | "running" | "succeeded" | "failed";

export interface StepUI {
  id: string;
  goal: string;
  agent?: string;
  tools: string[];
  status: StepStatus;
}

export interface ChatMsg {
  id: string;
  sid?: string;
  role: "user" | "agent";
  text: string;
  ts: number;
  status?: "thinking" | "running" | "done" | "error";
  steps?: StepUI[];
  artifacts?: string[];
  taskId?: string;
  image?: string;
  instruction?: string;
  error?: string;
}

interface ChatState {
  threads: Record<string, ChatMsg[]>;
  hydrated: boolean;
  hydrate: () => void;
  clear: () => void;
  dropThread: (sid: string) => void;
  send: (text: string, image?: string | null) => void;
  retry: (agentMsgId: string) => void;
  _update: (sid: string, id: string, patch: Partial<ChatMsg>) => void;
}

const LS_KEY = "forge-chat-v2";
const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

function save(threads: Record<string, ChatMsg[]>) {
  try {
    localStorage.setItem(LS_KEY, JSON.stringify({ threads }));
  } catch {
    /* storage full/blocked */
  }
}

function mapSteps(plan: any): StepUI[] {
  return (plan?.steps ?? []).map((s: any) => ({
    id: s.id,
    goal: s.goal ?? "step",
    agent: s.assigned_agent,
    tools: s.tool_ids ?? [],
    status:
      s.status === "succeeded"
        ? "succeeded"
        : s.status === "failed"
          ? "failed"
          : s.status === "running"
            ? "running"
            : "pending",
  }));
}

async function run(
  sid: string,
  agentMsgId: string,
  instruction: string,
  update: (sid: string, id: string, patch: Partial<ChatMsg>) => void,
  image?: string | null,
) {
  const fu = () => useForgeUI.getState();
  try {
    const sub = await API.submitInstruction(instruction, "default-user", image ?? null);
    update(sid, agentMsgId, { taskId: sub.task_id, status: "running" });
    fu().setSessionStatusById(sid, "running");

    // poll state until terminal
    let lastSeq = 0;
    let streamBuf = "";
    for (;;) {
      await new Promise((r) => setTimeout(r, 1500));
      const st = await API.getTaskState(sub.task_id);
      const steps = mapSteps(st.plan);
      if (steps.length) {
        update(sid, agentMsgId, { steps, status: "running" });
        // sidebar bridge — live agents
        for (const s of steps) {
          if (!s.agent) continue;
          if (s.status === "running" || s.status === "pending")
            fu().setAgentLive(s.agent, "working", `Working on: ${s.goal}`);
          else if (s.status === "succeeded")
            fu().setAgentLive(s.agent, "done", `Finished: ${s.goal}`);
        }
      }
      // token stream — live typing into the bubble (best effort)
      try {
        const evs = await API.getEvents(sub.task_id, lastSeq);
        for (const e of evs.events ?? []) {
          if (e.seq > lastSeq) lastSeq = e.seq;
          if (e.type === "token" && e.payload?.text) streamBuf += e.payload.text;
        }
        if (streamBuf) update(sid, agentMsgId, { status: "running", text: streamBuf });
      } catch {
        /* events are best effort — state polling continues */
      }
      if (st.status === "completed" || st.status === "failed" || st.status === "done") break;
    }

    const res = await API.getTaskResults(sub.task_id);
    const finalText: string =
      res?.final?.summary ??
      (res?.results ?? []).map((r: any) => r.summary).filter(Boolean).join("\n\n") ??
      "Done.";
    const arts: string[] = (res?.results ?? [])
      .flatMap((r: any) => (r.artifacts ?? []).map((a: any) => (typeof a === "string" ? a : a?.name ?? a?.path)))
      .filter(Boolean);
    const failed = res?.final?.status === "failed";
    update(sid, agentMsgId, {
      status: failed ? "error" : "done",
      text: finalText,
      artifacts: arts,
      error: failed ? "Task failed" : undefined,
    });
    fu().setSessionStatusById(sid, failed ? "error" : "done");
  } catch (e: any) {
    update(sid, agentMsgId, {
      status: "error",
      error: String(e?.message ?? e ?? "Backend unreachable"),
    });
    fu().setSessionStatusById(sid, "error");
  }
}

export const useChat = create<ChatState>((set, get) => ({
  threads: {},
  hydrated: false,

  hydrate() {
    if (get().hydrated || typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        const threads: Record<string, ChatMsg[]> = d?.threads ?? {};
        // adhoore tasks ko error pe close karo
        for (const k of Object.keys(threads)) {
          threads[k] = threads[k].map((m) =>
            m.role === "agent" && (m.status === "thinking" || m.status === "running")
              ? { ...m, status: "error" as const, error: "Interrupted — use retry" }
              : m,
          );
        }
        set({ threads, hydrated: true });
        return;
      }
    } catch {
      /* corrupt storage — fresh */
    }
    set({ hydrated: true });
  },

  clear() {
    set({ threads: {} });
    try {
      localStorage.removeItem(LS_KEY);
    } catch {
      /* ignore */
    }
  },

  dropThread(sid) {
    set((s) => {
      const threads = { ...s.threads };
      delete threads[sid];
      save(threads);
      return { threads };
    });
  },

  _update(sid, id, patch) {
    set((s) => ({
      threads: {
        ...s.threads,
        [sid]: (s.threads[sid] ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)),
      },
    }));
    save(get().threads);
  },

  send(text, image) {
    const body = text.trim();
    if (!body && !image) return;
    const fu = useForgeUI.getState();
    let sid = fu.activeSessionId;
    if (!sid) sid = fu.newSession();

    // pehla message → session title = instruction (short)
    const th = get().threads[sid] ?? [];
    if (th.length === 0) {
      const title = body.length > 42 ? body.slice(0, 42) + "…" : body;
      fu.renameSession(fu.activeProjectId, sid, title);
    }

    const userMsg: ChatMsg = { id: uid(), sid, role: "user", text: body || "(image attached)", ts: Date.now(), ...(image ? { image } : {}) };
    const agentMsg: ChatMsg = {
      id: uid(),
      sid,
      role: "agent",
      text: "",
      ts: Date.now(),
      status: "thinking",
      steps: [],
      instruction: body,
    };
    set((s) => ({ threads: { ...s.threads, [sid]: [...(s.threads[sid] ?? []), userMsg, agentMsg] } }));
    save(get().threads);
    void run(sid, agentMsg.id, body, get()._update, image ?? null);
  },

  retry(agentMsgId) {
    const st = get();
    let sid: string | null = null;
    let msg: ChatMsg | undefined;
    for (const [k, arr] of Object.entries(st.threads)) {
      const m = arr.find((x) => x.id === agentMsgId);
      if (m) {
        sid = k;
        msg = m;
        break;
      }
    }
    if (!sid || !msg?.instruction) return;
    st._update(sid, agentMsgId, { status: "thinking", steps: [], text: "", error: undefined, ts: Date.now() });
    void run(sid, agentMsgId, msg.instruction, st._update);
  },
}));

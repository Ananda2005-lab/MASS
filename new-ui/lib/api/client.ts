// Backend API client — single point of configuration for the backend URL.
// Same-origin "/be" prefix: Next.js dev server ise backend (port 8200) pe proxy
// karta hai (next.config.js rewrites). Local + live-preview dono pe same path —
// browser kabhi localhost ya cross-origin call nahi karta.
const BASE_URL = "/be";

export const API = {
  async health(): Promise<boolean> {
    try {
      const r = await fetch(`${BASE_URL}/health`);
      return r.ok;
    } catch {
      return false;
    }
  },

  async submitInstruction(
    raw: string,
    userId = "default-user",
    image?: string | null,
  ): Promise<{ task_id: string; conversation_id: string; status: string }> {
    const r = await fetch(`${BASE_URL}/instruction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw, user_id: userId, ...(image ? { image } : {}) }),
    });
    if (!r.ok) throw new Error(`submit failed: ${r.status}`);
    return r.json();
  },

  async system(): Promise<{
    safety_mode: string;
    sandbox_scope: string;
    providers: string[];
    project_path: string | null;
    mcp_tools: string[];
  }> {
    const r = await fetch(`${BASE_URL}/system`);
    if (!r.ok) throw new Error(`system failed: ${r.status}`);
    return r.json();
  },

  async setSafety(mode: string): Promise<{ ok: boolean; safety_mode?: string }> {
    const r = await fetch(`${BASE_URL}/system/safety`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mode }),
    });
    if (!r.ok) throw new Error(`safety failed: ${r.status}`);
    return r.json();
  },

  async attachProject(path: string): Promise<{ ok: boolean; tools: number; project_path: string | null }> {
    const r = await fetch(`${BASE_URL}/project`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path }),
    });
    if (!r.ok) throw new Error(`project failed: ${r.status}`);
    return r.json();
  },

  async uploadProject(
    name: string,
    files: { path: string; b64: string }[],
  ): Promise<{ ok: boolean; written: number; tools: number; project_path: string | null }> {
    const r = await fetch(`${BASE_URL}/project/upload`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, files }),
    });
    if (!r.ok) throw new Error(`upload failed: ${r.status}`);
    return r.json();
  },

  async getTask(taskId: string): Promise<any> {
    const r = await fetch(`${BASE_URL}/tasks/${taskId}`);
    if (!r.ok) throw new Error(`fetch task failed: ${r.status}`);
    return r.json();
  },

  async getTaskState(taskId: string): Promise<{ task_id: string; status: string; plan: any }> {
    const r = await fetch(`${BASE_URL}/tasks/${taskId}/state`);
    if (!r.ok) throw new Error(`fetch state failed: ${r.status}`);
    return r.json();
  },

  async getTaskResults(taskId: string): Promise<{ results: any[]; final: any }> {
    const r = await fetch(`${BASE_URL}/tasks/${taskId}/results`);
    if (!r.ok) throw new Error(`fetch results failed: ${r.status}`);
    return r.json();
  },

  async projectTree(): Promise<{ project_path: string | null; tree: any[] }> {
    const r = await fetch(`${BASE_URL}/project/tree`);
    if (!r.ok) throw new Error(`tree failed: ${r.status}`);
    return r.json();
  },

  async setToolEnabled(toolId: string, enabled: boolean): Promise<void> {
    const r = await fetch(`${BASE_URL}/system/tools/${encodeURIComponent(toolId)}/enabled`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (!r.ok) throw new Error(`tool toggle failed: ${r.status}`);
  },

  async setRoleEnabled(role: string, enabled: boolean): Promise<void> {
    const r = await fetch(`${BASE_URL}/system/roles/${encodeURIComponent(role)}/enabled`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled }),
    });
    if (!r.ok) throw new Error(`role toggle failed: ${r.status}`);
  },

  async projectFile(path: string): Promise<{ ok: boolean; content?: string; error?: string }> {
    const r = await fetch(`${BASE_URL}/project/file?path=${encodeURIComponent(path)}`);
    if (!r.ok) throw new Error(`file read failed: ${r.status}`);
    return r.json();
  },

  async getEvents(
    taskId: string,
    sinceSeq = 0,
  ): Promise<{ events: { seq: number; type: string; payload: any }[] }> {
    const r = await fetch(`${BASE_URL}/tasks/${taskId}/events?since_seq=${sinceSeq}`);
    if (!r.ok) throw new Error(`events failed: ${r.status}`);
    return r.json();
  },

  async listApprovals(): Promise<{
    pending: { id: string; tool_id: string; args: any; caller: string }[];
  }> {
    const r = await fetch(`${BASE_URL}/approvals`);
    if (!r.ok) throw new Error(`approvals failed: ${r.status}`);
    return r.json();
  },

  async decideApproval(id: string, approved: boolean): Promise<void> {
    const r = await fetch(`${BASE_URL}/approvals/${id}/decision`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ approved }),
    });
    if (!r.ok) throw new Error(`decision failed: ${r.status}`);
  },
};

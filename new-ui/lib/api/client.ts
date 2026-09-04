// Backend API client — single point of configuration for the backend URL.
// Update BASE_URL when the backend address changes.

const BASE_URL = "http://localhost:8200";

export const API = {
  async health(): Promise<boolean> {
    try {
      const r = await fetch(`${BASE_URL}/health`);
      return r.ok;
    } catch {
      return false;
    }
  },

  async submitInstruction(raw: string, userId = "default-user"): Promise<{ task_id: string; conversation_id: string; status: string }> {
    const r = await fetch(`${BASE_URL}/instruction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ raw, user_id: userId }),
    });
    if (!r.ok) throw new Error(`submit failed: ${r.status}`);
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
};
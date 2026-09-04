import type {
  Event,
  Plan,
  PostInstructionBody,
  PermissionResolveBody,
  Result,
  Task,
  TaskStatus,
  Tool,
} from "./types";

/**
 * HTTP client for the backend API (spec §15 / 21.2).
 * No provider keys are sent; only the auth token header is used when present.
 */
export class ApiClient {
  private readonly baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl =
      baseUrl ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
  }

  private async request<T>(
    path: string,
    init?: RequestInit
  ): Promise<T> {
    const res = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    });
    if (!res.ok) {
      throw new Error(`API ${path} failed: ${res.status} ${res.statusText}`);
    }
    return (await res.json()) as T;
  }

  /** Submit a natural-language instruction; returns the created Task. */
  postInstruction(body: PostInstructionBody): Promise<Task> {
    return this.request<Task>("/instruction", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  /** Fetch full task state (plan, status, steps). */
  getTaskState(taskId: string): Promise<Task> {
    return this.request<Task>(`/tasks/${encodeURIComponent(taskId)}`);
  }

  /** Fetch results for a task. */
  getResults(taskId: string): Promise<Result[]> {
    return this.request<Result[]>(`/tasks/${encodeURIComponent(taskId)}/results`);
  }

  /** Resolve a permission request (approve/deny). */
  approve(taskId: string, ticket: PermissionResolveBody): Promise<unknown> {
    return this.request(
      `/tasks/${encodeURIComponent(taskId)}/approve`,
      { method: "POST", body: JSON.stringify(ticket) }
    );
  }

  /** List available tools (metadata only). */
  getTools(): Promise<Tool[]> {
    return this.request<Tool[]>("/tools");
  }
}

export type { TaskStatus, Plan, Event };

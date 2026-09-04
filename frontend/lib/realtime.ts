import type { Event } from "./types";

type EventHandler = (event: Event) => void;

interface RealtimeOptions {
  wsUrl?: string;
  sseUrl?: string;
  authToken?: string | null;
}

/**
 * Real-time client (spec §14 / 21.5).
 * Primary transport: WebSocket. Fallback: Server-Sent Events (read-only).
 * Emits parsed Event objects to subscribers. Store updates are pure
 * functions of events (no business logic here).
 */
export class RealtimeClient {
  private readonly wsUrl: string;
  private readonly sseUrl: string;
  private readonly authToken: string | null;
  private ws: WebSocket | null = null;
  private es: EventSource | null = null;
  private connected = false;
  private readonly handlers: Map<string, Set<EventHandler>> = new Map();
  private readonly wildcard: Set<EventHandler> = new Set();

  constructor(opts: RealtimeOptions = {}) {
    this.wsUrl =
      opts.wsUrl ?? process.env.NEXT_PUBLIC_WS_URL ?? "ws://localhost:8000/ws";
    this.sseUrl =
      opts.sseUrl ?? `${this.baseWsToHttp()}/events`;
    this.authToken = opts.authToken ?? null;
  }

  private baseWsToHttp(): string {
    const base =
      process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
    return base.replace(/\/$/, "");
  }

  /** Subscribe to events for a task (or "*" for all). Returns unsubscribe fn. */
  subscribe(taskId: string, handler: EventHandler): () => void {
    if (taskId === "*") {
      this.wildcard.add(handler);
      return () => this.wildcard.delete(handler);
    }
    let set = this.handlers.get(taskId);
    if (!set) {
      set = new Set();
      this.handlers.set(taskId, set);
    }
    set.add(handler);
    return () => {
      set?.delete(handler);
    };
  }

  /** Open the connection for a task. Tries WS, then falls back to SSE. */
  connect(taskId: string): void {
    this.close();
    const wsUrl = `${this.wsUrl}?task_id=${encodeURIComponent(taskId)}`;
    try {
      this.ws = new WebSocket(wsUrl);
    } catch {
      this.fallbackToSse(taskId);
      return;
    }

    this.ws.onopen = () => {
      this.connected = true;
      if (this.authToken) {
        this.ws?.send(JSON.stringify({ type: "auth", token: this.authToken }));
      }
    };

    this.ws.onmessage = (msg) => {
      const event = this.parse(msg.data);
      if (event) this.dispatch(event);
    };

    this.ws.onerror = () => {
      if (!this.connected) this.fallbackToSse(taskId);
    };

    this.ws.onclose = () => {
      this.connected = false;
      // If the socket closed before ever opening, fall back.
      if (this.ws && !this.connected) this.fallbackToSse(taskId);
    };
  }

  private fallbackToSse(taskId: string): void {
    const url = `${this.sseUrl}?task_id=${encodeURIComponent(taskId)}`;
    this.es = new EventSource(url);
    this.es.onmessage = (msg) => {
      const event = this.parse(msg.data);
      if (event) this.dispatch(event);
    };
    this.es.onerror = () => {
      // SSE has no write path; nothing further to do but keep connection.
    };
  }

  /** Send a command to the backend (WebSocket only). */
  sendCommand(cmd: unknown): void {
    if (this.ws && this.connected) {
      this.ws.send(typeof cmd === "string" ? cmd : JSON.stringify(cmd));
    }
  }

  private parse(data: unknown): Event | null {
    if (typeof data !== "string") return null;
    try {
      return JSON.parse(data) as Event;
    } catch {
      return null;
    }
  }

  private dispatch(event: Event): void {
    const byTask = this.handlers.get(event.task_id);
    byTask?.forEach((h) => h(event));
    this.wildcard.forEach((h) => h(event));
  }

  close(): void {
    this.ws?.close();
    this.ws = null;
    this.es?.close();
    this.es = null;
    this.connected = false;
  }
}

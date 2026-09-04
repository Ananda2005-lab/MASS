/**
 * TypeScript mirror of backend core contracts (backend/app/core/*.py).
 * Field names are kept identical to prevent contract drift (implementation/04 + 21.2).
 * Enums are modeled as closed string-literal union types.
 */

// ---------------------------------------------------------------------------
// task.py
// ---------------------------------------------------------------------------

export type TaskType =
  | "research"
  | "analysis"
  | "code"
  | "write"
  | "debug"
  | "fix"
  | "review"
  | "test"
  | "browser"
  | "file"
  | "verify"
  | "security"
  | "mixed"
  | "unknown";

export type TaskStatus =
  | "created"
  | "planning"
  | "executing"
  | "verifying"
  | "paused"
  | "failed"
  | "completed";

export type StepStatus =
  | "pending"
  | "running"
  | "succeeded"
  | "failed"
  | "verifying"
  | "awaiting_permission";

export type RefKind = "result" | "artifact" | "memory" | "context";

export type ResultStatus = "success" | "partial" | "failure";

export type ConstraintKind =
  | "model"
  | "sub_agent"
  | "tool"
  | "order"
  | "scope"
  | "permission";

export type DependencyKind = "blocks" | "feeds";

export type PlanStrategy = "sequential" | "parallel" | "mixed";

export type ErrorSource = "llm" | "tool" | "agent" | "system" | "provider";

export interface Ref {
  kind: RefKind;
  id: string;
}

export interface Artifact {
  id: string;
  type: string; // text|file|image|data|link|code|other
  name: string;
  ref: string;
  size?: number | null;
  mime?: string | null;
  created_at: string;
}

export interface ErrorInfo {
  code: string;
  message: string;
  source: ErrorSource;
  retryable?: boolean;
  details?: Record<string, unknown> | null;
}

export interface Result {
  id: string;
  step_id: string;
  status: ResultStatus;
  artifacts: Artifact[];
  summary?: string;
  metrics: Record<string, unknown>;
  error?: ErrorInfo | null;
}

export interface Constraint {
  kind: ConstraintKind;
  value: string;
  enforced?: boolean;
}

export interface TaskIntent {
  raw: string;
  goal: string;
  constraints: Constraint[];
  mode?: string; // instruction|workspace
  classification: TaskType;
}

export interface Dependency {
  from_step: string;
  to_step: string;
  kind?: DependencyKind;
}

export interface Step {
  id: string;
  goal: string;
  assigned_agent?: string | null;
  tool_ids: string[];
  input_refs: Ref[];
  status?: StepStatus;
  result?: Result | null;
  retry_count?: number;
  depends_on: string[];
}

export interface Plan {
  id: string;
  steps: Step[];
  edges: Dependency[];
  strategy?: PlanStrategy;
  verification_points: string[];
  created_by?: string;
  version?: number;
}

export interface Task {
  id: string;
  conversation_id: string;
  user_id: string;
  intent: TaskIntent;
  plan: Plan;
  status?: TaskStatus;
  current_step_id?: string | null;
  created_at: string;
  updated_at: string;
  final_result?: Result | null;
  metadata: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// tool.py
// ---------------------------------------------------------------------------

export type ToolCategory =
  | "web"
  | "search"
  | "files"
  | "code"
  | "terminal"
  | "browser"
  | "calculator"
  | "custom";

export type ExecutionKind = "sync" | "async" | "streaming";

export type ErrorHandling = "retry" | "fail" | "fallback";

export type ToolResultStatus =
  | "success"
  | "failure"
  | "permission_denied"
  | "timeout";

export interface Permission {
  name: string; // e.g. fs:write, exec:sandbox, network
  description?: string;
}

export interface ToolMetadata {
  name: string;
  description: string;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  permissions: Permission[];
  execution?: ExecutionKind;
  error_handling?: ErrorHandling;
  category?: ToolCategory;
  cost_class?: string; // cheap|moderate|expensive
}

export interface Tool {
  id: string;
  metadata: ToolMetadata;
  impl_kind?: string; // native|mcp
  endpoint?: string | null;
  handler_ref?: string;
}

export interface ToolInvocation {
  id: string;
  tool_id: string;
  params: Record<string, unknown>;
  context_refs: Ref[];
  permission_ticket?: string | null;
  caller?: string; // step_id or user_id
  timeout_ms?: number;
}

export interface ToolResult {
  id: string;
  invocation_id: string;
  status: ToolResultStatus;
  output: Record<string, unknown>;
  artifacts: unknown[];
  error?: Record<string, unknown> | null;
  duration_ms?: number;
}

// ---------------------------------------------------------------------------
// sub_agent.py
// ---------------------------------------------------------------------------

export type SubAgentRole =
  | "research"
  | "deep_reading"
  | "analysis"
  | "planning"
  | "coding"
  | "writing"
  | "debug"
  | "fix"
  | "review"
  | "testing"
  | "browser"
  | "file"
  | "verification"
  | "security";

export interface SubAgentContract {
  role: SubAgentRole;
  input_schema: Record<string, unknown>;
  output_schema: Record<string, unknown>;
  capabilities: string[]; // allowed tool ids
  model_preferences: string[];
  max_retries?: number;
  verification_aware?: boolean;
  fallback_role?: SubAgentRole | null;
}

export interface SubAgentContext {
  task_id: string;
  step_id: string;
  goal: string;
  inputs: Ref[];
  memory: Record<string, unknown>; // ContextBundle as dict
  tools: unknown[];
  model_hint?: string | null;
  constraints: unknown[];
}

export interface SubAgentResult {
  role: SubAgentRole;
  status: ResultStatus;
  output: Record<string, unknown>;
  rationale?: string; // REQUIRED contextual reasoning
  artifacts: unknown[];
  verification?: Record<string, unknown> | null;
  error?: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// llm.py
// ---------------------------------------------------------------------------

export type LLMCapability =
  | "chat"
  | "completion"
  | "embedding"
  | "vision"
  | "function";

export interface Message {
  role: string; // system|user|assistant|tool
  content: unknown;
  name?: string | null;
}

export interface Usage {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost_units?: number;
}

export interface LLMRequest {
  id: string;
  provider?: string | null;
  model?: string | null;
  credential_profile?: string | null;
  messages: Message[];
  params: Record<string, unknown>;
  capability?: LLMCapability;
  context_refs: unknown[];
  trace_id?: string | null;
}

export interface LLMResponse {
  id: string;
  provider?: string | null;
  model?: string | null;
  profile?: string | null;
  content?: unknown;
  usage: Usage;
  latency_ms?: number;
  status?: string; // success|failure|filtered
  error?: Record<string, unknown> | null;
}

// ---------------------------------------------------------------------------
// event.py
// ---------------------------------------------------------------------------

export type EventType =
  | "task_created"
  | "plan_updated"
  | "step_started"
  | "step_completed"
  | "step_failed"
  | "tool_invoked"
  | "tool_result"
  | "llm_called"
  | "llm_result"
  | "sub_agent_selected"
  | "sub_agent_result"
  | "verification_started"
  | "verification_result"
  | "permission_requested"
  | "permission_resolved"
  | "task_paused"
  | "task_resumed"
  | "task_completed"
  | "task_failed"
  | "error"
  | "info";

export type EventActor = "system" | "user" | "agent" | "tool" | "llm";

export interface Event {
  id: string;
  type: EventType;
  task_id: string;
  step_id?: string | null;
  actor?: EventActor;
  timestamp?: string;
  payload: Record<string, unknown>;
  seq?: number;
}

// ---------------------------------------------------------------------------
// context.py
// ---------------------------------------------------------------------------

export type ContextLayerKind =
  | "conversation"
  | "task_state"
  | "result"
  | "memory"
  | "instruction"
  | "tool_result"
  | "agent_state";

export interface ContextLayer {
  id: string;
  kind: ContextLayerKind;
  source_ref: Ref;
  content_ref: string;
  tokens?: number;
  importance?: number;
  created_at?: string;
}

export interface ContextBundle {
  layers: ContextLayer[];
  assembled_at?: string;
  token_estimate?: number;
  compressed?: boolean;
}

// ---------------------------------------------------------------------------
// API body shape for POST /instruction
// ---------------------------------------------------------------------------

export interface PostInstructionBody {
  raw: string;
  mode?: "instruction" | "workspace";
  constraints?: Constraint[];
}

export interface PermissionResolveBody {
  ticket: string;
  allowed: boolean;
}

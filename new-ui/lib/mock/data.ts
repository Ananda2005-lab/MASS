// ─────────────────────────────────────────────────────────────────────────────
// MOCK DATA — placeholder for real API calls.
// Har function/component jo ye import karta hai woh MOCK hai.
// Jab backend wire hoga, to is file ko real API module se replace karna hai.
// ─────────────────────────────────────────────────────────────────────────────

// ---- Execution Dashboard ----
export interface MockStep {
  id: number; label: string; status: "pending" | "processing" | "done" | "error";
  detail: string; toolCalls?: string[]; children?: { label: string; status: string }[]; duration?: string;
}
export const MOCK_STEPS: MockStep[] = [
  { id: 1, label: "Understanding request", status: "done", detail: "User wants a multi-agent architecture review of the codebase.", duration: "1.2s" },
  { id: 2, label: "Planning execution strategy", status: "done", detail: "Chose sequential strategy with 3 phases: research → analyze → report.", toolCalls: ["planner.generate_plan", "router.assign_agents"], duration: "2.4s" },
  { id: 3, label: "Researching sources", status: "processing", detail: "Searching web + knowledge base for multi-agent patterns…", toolCalls: ["web.search", "kb.retrieve"], children: [{ label: "Query: multi-agent orchestration patterns", status: "done" }, { label: "Query: communication protocols", status: "processing" }] },
  { id: 4, label: "Analyzing architecture docs", status: "pending", detail: "Reading 18 architecture documents…" },
  { id: 5, label: "Running code scans", status: "pending", detail: "Static analysis on backend + frontend…" },
  { id: 6, label: "Generating report", status: "pending", detail: "Compiling findings into structured report…" },
  { id: 7, label: "Verifying output", status: "pending", detail: "Cross-checking report against sources…" },
  { id: 8, label: "Presenting result", status: "pending", detail: "Delivering final summary to user…" },
];

export interface MockHistoryItem { time: string; action: string; dur: string; status: "ok" | "err" | "user"; }
export const MOCK_HISTORY: MockHistoryItem[] = [
  { time: "10:23:14", action: "planner.generate_plan", dur: "1.2s", status: "ok" },
  { time: "10:23:16", action: "web.search", dur: "3.4s", status: "ok" },
  { time: "10:23:20", action: "kb.retrieve", dur: "1.8s", status: "ok" },
  { time: "10:23:25", action: "fs.write — report.md", dur: "0.9s", status: "err" },
  { time: "10:23:30", action: "user_override: skip write", dur: "—", status: "user" },
  { time: "10:23:32", action: "llm_call — research-agent", dur: "6.1s", status: "ok" },
];

export const MOCK_LOGS: string[] = [
  "[10:23:14] planner: plan generated (3 phases)",
  "[10:23:16] tool: web.search → 12 results",
  "[10:23:18] agent: research-agent → llm_call",
  "[10:23:20] tool: kb.retrieve → 5 chunks",
  "[10:23:25] tool: fs.write → PERMISSION REQUIRED",
];

// ---- Research Panel ----
export interface MockSearchResult { id: number; title: string; url: string; snippet: string; score: number; source: "Web" | "KB" | "Internal"; pinned?: boolean; }
export const MOCK_SEARCH_RESULTS: MockSearchResult[] = [
  { id: 1, title: "Multi-Agent Systems: A Survey", url: "arxiv.org/abs/2402.01655", snippet: "Comprehensive review of multi-agent orchestration patterns, communication protocols, and evaluation frameworks for LLM-based agent systems.", score: 96, source: "Web" },
  { id: 2, title: "AutoGen: Enabling Next-Gen LLM Applications", url: "microsoft.github.io/autogen", snippet: "Framework for multi-agent conversations with customizable agents and automated chat, supporting tool use and human-in-the-loop workflows.", score: 91, source: "Web" },
  { id: 3, title: "Architecture Docs — Orchestrator Design", url: "internal://docs/arch/orchestrator", snippet: "Internal design for step execution, retry logic, and fallback strategies in the RAG-V2 orchestrator module.", score: 88, source: "Internal" },
  { id: 4, title: "RAG-V2 Knowledge Base — Agent Contracts", url: "kb://agents/contracts", snippet: "14 sub-agent role definitions with capabilities, allowed tools, and failure fallback rules.", score: 85, source: "KB" },
  { id: 5, title: "CrewAI: Framework for Orchestrating Role-Playing Agents", url: "github.com/crewAIInc/crewAI", snippet: "Role-based agent collaboration with task delegation, sequential and hierarchical processes.", score: 82, source: "Web" },
  { id: 6, title: "LangGraph: Stateful Agent Workflows", url: "langchain-ai.github.io/langgraph", snippet: "Low-level orchestration with graphs, cycles, and persistent state for complex agent flows.", score: 79, source: "Web" },
  { id: 7, title: "LLM Router Design — Weighted Selection", url: "internal://docs/llm/gateway", snippet: "Internal gateway router using weighted model scoring across latency, cost, and capability.", score: 76, source: "Internal" },
  { id: 8, title: "Verification Strategies for Agent Output", url: "aclanthology.org/2024.emnlp", snippet: "Self-consistency and tool-grounding techniques for verifying LLM-generated outputs.", score: 71, source: "Web" },
  { id: 9, title: "Realtime Event Bus Spec — WebSocket/SSE", url: "kb://realtime/events", snippet: "Event schemas for step_started, tool_invoked, and llm_call pushed over WebSocket and SSE.", score: 64, source: "KB" },
  { id: 10, title: "Task Planning with Constraint Propagation", url: "internal://docs/planner", snippet: "How the planner decomposes instructions into steps with constraint chips (model, tools, scope).", score: 58, source: "Internal" },
];

export interface MockRagChunk { id: number; doc: string; section: string; text: string; score: number; term: string; }
export const MOCK_RAG_CHUNKS: MockRagChunk[] = [
  { id: 1, doc: "Architecture Overview", section: "§ 2.3", text: "The system routes all model calls through a central LLM Gateway, ensuring agents never access providers directly.", score: 92, term: "LLM Gateway" },
  { id: 2, doc: "Architecture Overview", section: "§ 4.1", text: "Permission checks wrap every tool invocation, with per-role allowlists and human approval for sensitive actions.", score: 89, term: "permission" },
  { id: 3, doc: "Agent Contracts", section: "§ 1.5", text: "Each sub-agent declares capabilities, allowed tools, and a fallback agent used when it fails.", score: 86, term: "fallback" },
  { id: 4, doc: "Orchestrator Design", section: "§ 3.2", text: "The orchestrator executes steps sequentially by default, with a retry budget of 2 before re-planning.", score: 84, term: "retry" },
  { id: 5, doc: "LLM Router", section: "§ 2.1", text: "Weighted scoring balances latency, cost, and capability across registered model providers.", score: 78, term: "weighted" },
  { id: 6, doc: "Realtime Spec", section: "§ 1.2", text: "Events stream over both WebSocket and SSE, with step_started emitted before every step.", score: 74, term: "step_started" },
  { id: 7, doc: "Planner Design", section: "§ 2.4", text: "Constraint chips constrain model, tool set, and execution scope for each instruction.", score: 66, term: "constraint" },
  { id: 8, doc: "Verification Guide", section: "§ 5.0", text: "Output is cross-checked against source material and tool results before acceptance.", score: 61, term: "verification" },
];

export interface MockPinnedItem { id: number; content: string; source: string; time: string; }
export const MOCK_PINNED: MockPinnedItem[] = [
  { id: 1, content: "LLM Gateway is the single routing point — agents never call providers directly.", source: "Architecture Overview", time: "10:24" },
  { id: 2, content: "Retry budget: 2 attempts before orchestrator re-plans the step.", source: "Orchestrator Design", time: "10:25" },
  { id: 3, content: "Permission allowlists wrap every tool call; sensitive actions need approval.", source: "Architecture Overview", time: "10:26" },
  { id: 4, content: "Step events emit over WebSocket AND SSE for live UI updates.", source: "Realtime Spec", time: "10:27" },
];

// ---- Output Canvas ----
export interface LogLine { time: string; type: "info" | "agent" | "warn" | "err" | "ok"; text: string; }
export const MOCK_TERMINAL_LOGS: LogLine[] = (() => {
  const seq: [LogLine["type"], string][] = [
    ["info", "Starting FORGE session · workspace=rag-v2"],
    ["info", "Loading project config: config/forge.json"],
    ["ok", "✓ Config loaded (12 keys)"],
    ["agent", "agent:main → planner:generate_plan"],
    ["info", "Plan: 3 phases · strategy=sequential"],
    ["agent", "agent:research → web.search(query='multi-agent orchestration')"],
    ["warn", "⚠ web.search: 2 results filtered by relevance threshold"],
    ["ok", "✓ 12 sources retrieved in 3.4s"],
    ["agent", "agent:research → kb.retrieve(top_k=5)"],
    ["info", "KB chunks: 5 · similarity 0.88 avg"],
    ["agent", "agent:analysis → code.scan(path='backend/')"],
    ["err", "✕ fs.write failed: permission required (report.md)"],
    ["warn", "⚠ awaiting human approval for fs:write"],
    ["ok", "✓ Approval granted by user"],
    ["agent", "agent:writing → artifact.generate(report.md)"],
    ["info", "artifact: report.md · 24KB · 3 sections"],
    ["agent", "agent:review → verifier.crosscheck(sources)"],
    ["ok", "✓ Verification passed (2/2 checks)"],
    ["info", "Session stats: 19 events · 41s · 128k tokens budget 14.2k used"],
  ];
  let t = 36840000;
  return Array.from({ length: 55 }, (_, i) => {
    const [type, text] = seq[i % seq.length];
    t += 1200 + ((i * 37) % 4000);
    const h = Math.floor(t / 3600000);
    const m = Math.floor((t % 3600000) / 60000);
    const s = Math.floor((t % 60000) / 1000);
    const ms = t % 1000;
    return { time: `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(ms).padStart(3, "0")}`, type, text: `${text} #${i + 1}` };
  });
})();

export const MOCK_SAMPLE_FILES: Record<string, { lang: string; code: string; diff?: "add" | "del" }> = {
  "src/index.ts": { lang: "typescript", code: `import { ForgeAgent } from "./agent";\nimport { createGateway } from "./gateway";\n\nconst gateway = createGateway({\n  providers: ["gpt-4o", "claude-3.5", "llama-3"],\n  strategy: "weighted",\n});\n\nconst agent = new ForgeAgent(gateway);\nagent.on("step", (s) => console.log("→", s.label));\nagent.run("Analyze the codebase architecture");\n`, diff: "add" },
  "src/agent.ts": { lang: "typescript", code: `export class ForgeAgent {\n  constructor(gateway) {\n    this.gateway = gateway;\n    this.plan = [];\n  }\n  async run(instruction) {\n    this.plan = await this.gateway.plan(instruction);\n    for (const step of this.plan) {\n      await this.execute(step);\n    }\n  }\n}\n` },
  "scripts/analyze.py": { lang: "python", code: `"""Static analysis over the backend package."""\nimport ast\nfrom pathlib import Path\n\ndef analyze(root: Path) -> dict:\n    report = {"files": 0, "functions": 0, "issues": []}\n    for f in root.rglob("*.py"):\n        report["files"] += 1\n        tree = ast.parse(f.read_text())\n        report["functions"] += len([n for n in ast.walk(tree) if isinstance(n, ast.FunctionDef)])\n    return report\n\nif __name__ == "__main__":\n    print(analyze(Path("backend")))\n`, diff: "del" },
};

export const MOCK_HTML_ARTIFACT = `<!doctype html><html><head><style>body { font-family: system-ui; background: #0f172a; color: #e2e8f0; padding: 24px; } .card { background: #1e293b; border-radius: 12px; padding: 20px; max-width: 360px; } h1 { margin: 0 0 8px; font-size: 18px; color: #38bdf8; } .metric { display: flex; justify-content: space-between; margin-top: 10px; font-size: 14px; }</style></head><body><div class="card"><h1>Agent Report — Dashboard</h1><p style="margin:0;font-size:12px;color:#94a3b8">RAG-V2 · architecture review</p><div class="metric"><span>Complexity</span><b>Medium</b></div><div class="metric"><span>Coverage</span><b>82%</b></div><div class="metric"><span>Issues</span><b style="color:#fbbf24">2 warnings</b></div></div></body></html>`;
export const MOCK_SVG_ARTIFACT = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="120" viewBox="0 0 320 120"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#38bdf8"/><stop offset="1" stop-color="#818cf8"/></linearGradient></defs><rect x="10" y="10" width="300" height="100" rx="16" fill="none" stroke="url(#g)" stroke-width="2"/><text x="160" y="58" text-anchor="middle" font-family="monospace" font-size="20" fill="url(#g)" font-weight="bold">FORGE</text><text x="160" y="86" text-anchor="middle" font-family="system-ui" font-size="11" fill="#94a3b8">Agent Command Center</text></svg>`;
export const MOCK_MARKDOWN_ARTIFACT = `# Architecture Review — RAG-V2\n\n## Findings\n- **Orchestrator** handles step execution with retry (budget: 2)\n- **LLM Gateway** routes all model calls with weighted scoring\n- **14 sub-agents** each declare capabilities + fallbacks\n\n## Recommendation\nMove to hierarchical orchestration for better parallel branch support.`;

export const MOCK_DATA_ROWS = Array.from({ length: 50 }, (_, i) => ({
  id: i + 1, action: ["web.search", "kb.retrieve", "llm_call", "fs.write", "code.scan"][i % 5],
  agent: ["research", "analysis", "writing", "review"][i % 4], latency_ms: 400 + ((i * 137) % 3600),
  status: i % 9 === 0 ? "error" : i % 7 === 0 ? "warn" : "ok",
}));

export interface MockCanvasNode { id: number; x: number; y: number; text: string; color: string; }
export const MOCK_CANVAS_NODES: MockCanvasNode[] = [
  { id: 1, x: 220, y: 130, text: "AI Agent\nArchitecture", color: "from-accent-cyan/30 to-accent-indigo/30" },
  { id: 2, x: 60, y: 60, text: "Planner", color: "from-accent-violet/30 to-accent-purple/30" },
  { id: 3, x: 380, y: 50, text: "Orchestrator", color: "from-accent-blue/30 to-accent-cyan/30" },
  { id: 4, x: 40, y: 210, text: "14 sub-agents", color: "from-accent-green/30 to-accent-cyan/30" },
  { id: 5, x: 400, y: 220, text: "LLM Gateway", color: "from-accent-amber/30 to-accent-orange/30" },
  { id: 6, x: 220, y: 280, text: "Verifier", color: "from-accent-purple/30 to-accent-indigo/30" },
];

// ---- Left Sidebar ----
export const MOCK_FILE_TREE: Record<string, string[]> = {
  "src/": ["index.ts", "app.tsx", "utils.ts", "components/"],
  "docs/": ["api.md", "architecture.md"],
  "tests/": ["test_runtime.py", "test_tools.py"],
  "config/": ["config.ts", "routing.ts"],
};

export const MOCK_AGENTS = [
  { name: "CodeForge", model: "GPT-4o", status: "active", grad: "from-accent-cyan/60 to-accent-indigo/60" },
  { name: "ResearchBot", model: "Claude 3.5", status: "idle", grad: "from-accent-violet/60 to-accent-purple/60" },
  { name: "DocuMind", model: "Llama 3", status: "idle", grad: "from-accent-amber/60 to-accent-orange/60" },
  { name: "DataWiz", model: "GPT-4o", status: "idle", grad: "from-accent-green/60 to-accent-cyan/60" },
  { name: "Reviewer", model: "Claude 3.5", status: "idle", grad: "from-slate2-muted to-slate2-secondary" },
];

export const MOCK_TOOLS = [
  { icon: "🌐", name: "WebSearch", cat: "Web", on: true },
  { icon: "💻", name: "CodeExecutor", cat: "Code", on: true },
  { icon: "📄", name: "FileManager", cat: "File", on: true },
  { icon: "🗄️", name: "Database", cat: "Database", on: false },
  { icon: "⚙️", name: "GitHub", cat: "Custom", on: true },
  { icon: "🧪", name: "TestRunner", cat: "Code", on: false },
];

export const MOCK_SOURCES = [
  { icon: "🔗", name: "Docs Portal", docs: 42, status: "ok" },
  { icon: "📕", name: "API Reference", docs: 18, status: "ok" },
  { icon: "🗃️", name: "Design System", docs: 7, status: "sync" },
];

export const MOCK_INTEGRATIONS = [
  { name: "GitHub", icon: "🐙", connected: true },
  { name: "Slack", icon: "💬", connected: true },
  { name: "Notion", icon: "📝", connected: true },
  { name: "Google Drive", icon: "☁️", connected: false },
];

// ---- Right Sidebar ----
export const MOCK_MODELS = ["GPT-4o", "Claude 3.5", "Llama 3", "Gemini 1.5"];

export const MOCK_ACTIVE_TOOLS = [
  { icon: "🌐", name: "WebSearch", on: true, live: true },
  { icon: "💻", name: "CodeExecutor", on: true, live: false },
  { icon: "📄", name: "FileManager", on: true, live: false },
  { icon: "🧪", name: "TestRunner", on: false, live: false },
  { icon: "🐙", name: "GitHub", on: true, live: false },
];

export const MOCK_VARS = [
  { k: "project_root", v: "/rag-v2", type: "string" },
  { k: "max_retries", v: "3", type: "number" },
  { k: "session_config", v: '{mode:"forge"}', type: "json" },
  { k: "default_model", v: "gpt-4o", type: "string" },
];

export const MOCK_QUEUE = [
  { id: "T-101", name: "Research codebase", pri: "P1", agent: "ResearchBot", status: "running", eta: "2m" },
  { id: "T-102", name: "Analyze architecture", pri: "P2", agent: "DataWiz", status: "running", eta: "4m" },
  { id: "T-103", name: "Generate report", pri: "P3", agent: "DocuMind", status: "queued", eta: "8m" },
  { id: "T-104", name: "Review output", pri: "P4", agent: "Reviewer", status: "queued", eta: "10m" },
  { id: "T-099", name: "Cleanup temp files", pri: "P3", agent: "CodeForge", status: "done", eta: "—" },
  { id: "T-098", name: "Fetch API docs", pri: "P2", agent: "ResearchBot", status: "failed", eta: "—" },
];

// ---- Bottom Bar ----
export const MOCK_TERMINAL_LINES: { t: string; txt: string }[] = [
  { t: "info", txt: "FORGE terminal session — 10:14:00" },
  { t: "ok", txt: "✓ config loaded (12 keys)" },
  { t: "agent", txt: "> python -m pytest tests/ -q" },
  { t: "ok", txt: "66 passed in 5.15s" },
  { t: "agent", txt: "> npm run build" },
  { t: "ok", txt: "✓ Compiled successfully" },
  { t: "warn", txt: "⚠ 2 deprecation warnings" },
  { t: "agent", txt: "> docker compose up -d" },
  { t: "ok", txt: "Container rag-backend started" },
  { t: "agent", txt: "> curl localhost:8000/health" },
  { t: "ok", txt: '{"ok": true, "status": "healthy"}' },
  { t: "info", txt: "— awaiting command —" },
];
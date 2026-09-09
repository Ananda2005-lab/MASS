"""Runtime container: wires all locked components (implementation/03 module boundaries).

Single composition root. API/realtime call into this; runtime never imports them.
"""
from __future__ import annotations

from app.core.task import Task, TaskStatus
from app.core.event import EventActor
from app.gateway.bootstrap import build_default_gateway
from app.gateway.gateway import LLMGateway
from app.log import get_logger
from app.persistence.engine import init_models
from app.persistence.repos import (
    EventRepo,
    MemoryRepo,
    ResultRepo,
    StepRepo,
    TaskRepo,
)
from app.runtime.executor import Executor
from app.runtime.main_agent import MainAgent
from app.runtime.orchestrator import Orchestrator
from app.runtime.planner import Planner
from app.runtime.managers.memory_manager import create_memory_manager
from app.runtime.managers.sub_agent_manager import create_sub_agent_manager
from app.runtime.managers.tool_manager import create_tool_manager
from app.security.secrets import env_secret_resolver
from app.state.event_bus import EventBus
from app.state.task_state import TaskStateStore
from app.verification.verifier import Verifier

logger = get_logger("runtime")


class Runtime:
    def __init__(
        self,
        main_agent: MainAgent,
        orchestrator: Orchestrator,
        state: TaskStateStore,
        event_bus: EventBus,
        gateway: LLMGateway,
        tool_manager,
        memory_manager,
        sub_agent_manager,
    ) -> None:
        self.main_agent = main_agent
        self.orchestrator = orchestrator
        self.state = state
        self.event_bus = event_bus
        self.gateway = gateway
        self.tool_manager = tool_manager
        self.memory_manager = memory_manager
        self.sub_agent_manager = sub_agent_manager
        self.project_path: str | None = None

    async def attach_project(self, path: str) -> int:
        """Attach a folder as the MCP 'project' filesystem server (Claude/Codex
        style). Returns how many tools got registered; 0 = server unavailable."""
        import os

        from app.runtime.managers.tool_manager import attach_mcp_server

        cfg = {
            "name": "project",
            "command": "npx",
            "args": ["-y", "@modelcontextprotocol/server-filesystem", os.path.abspath(path)],
        }
        n = await attach_mcp_server(self.tool_manager, cfg)
        if n:
            self.project_path = path
        return n

    async def submit_instruction(
        self, raw: str, conversation_id: str, user_id: str, mode: str = "instruction", image: str | None = None
    ) -> Task:
        task = await self.main_agent.create_task(raw, conversation_id, user_id, mode, image=image)
        await self.state.save(task)
        await self.state.transition(task, TaskStatus.PLANNING, EventActor.SYSTEM)
        return task

    async def run_task(self, task: Task) -> Task:
        return await self.orchestrator.execute(task)

    async def get_task(self, task_id: str) -> Task | None:
        return await self.state.load(task_id)


async def build_runtime() -> Runtime:
    await init_models()
    task_repo, step_repo = TaskRepo(), StepRepo()
    event_repo, memory_repo = EventRepo(), MemoryRepo()
    event_bus = EventBus(event_repo)
    state = TaskStateStore(task_repo, event_bus)

    gateway = build_default_gateway()
    gateway.credential_resolver = env_secret_resolver  # resolve secrets at call time only

    tool_manager = create_tool_manager()
    from app.runtime.managers.tool_manager import attach_mcp_tools

    await attach_mcp_tools(tool_manager)  # MCP servers (AAP_MCP_SERVERS) → real tools
    memory_manager = create_memory_manager(memory_repo, gateway)
    sub_agent_manager = create_sub_agent_manager(gateway, tool_manager, memory_manager, event_bus)

    planner = Planner(gateway)
    main_agent = MainAgent(planner)
    verifier = Verifier(gateway)
    executor = Executor(sub_agent_manager, memory_manager, event_bus, verifier)
    orchestrator = Orchestrator(state, executor, verifier, planner, task_repo, step_repo, event_bus)

    logger.info("runtime_built")
    return Runtime(main_agent, orchestrator, state, event_bus, gateway, tool_manager, memory_manager, sub_agent_manager)

"""T6 — All 14 sub-agent roles comply with SubAgentContract (decision 04 / 08)."""
import pytest
from app.core.sub_agent import SubAgentRole, SubAgentResult, ResultStatus
from app.runtime.sub_agents import ROLE_HANDLERS, CONTRACTS
from app.runtime.managers.sub_agent_manager import SubAgentManager


ALL_ROLES = list(SubAgentRole)


def test_fourteen_roles_registered():
    assert set(ROLE_HANDLERS.keys()) == set(ALL_ROLES)
    assert len(CONTRACTS) == 14


@pytest.mark.asyncio
async def test_every_role_returns_contract_compliant_result(runtime):
    sam: SubAgentManager = runtime.sub_agent_manager
    for role in ALL_ROLES:
        ctx = __import__("app.core.sub_agent", fromlist=["SubAgentContext"]).SubAgentContext(
            task_id="t", step_id="s", goal=f"goal for {role.value}", inputs=[], memory={}, tools=[]
        )
        res: SubAgentResult = await sam.run_sub_agent(role, ctx)
        assert res.role == role
        assert res.status == ResultStatus.SUCCESS, f"{role} failed: {res.error}"
        assert res.rationale.strip() != "", f"{role} missing rationale (Phase 1 §8)"
        # output must be a dict
        assert isinstance(res.output, dict)


def test_coding_is_only_general_coding_role():
    # general-purpose coding is confined to the coding role, not every sub-agent
    coding_contract = CONTRACTS[SubAgentRole.CODING]
    assert coding_contract.role == SubAgentRole.CODING
    # Only the CODING role should advertise code execution in its contract capabilities.
    coding_cap_count = sum(1 for c in CONTRACTS.values() if "code.run" in c.capabilities)
    assert coding_cap_count == 1, f"code.run should appear in exactly one role, found {coding_cap_count}"


@pytest.mark.asyncio
async def test_fallback_role_used_on_handler_exception(runtime):
    sam = runtime.sub_agent_manager
    from app.core.sub_agent import SubAgentContext
    ctx = SubAgentContext(task_id="t", step_id="s", goal="g", inputs=[], memory={}, tools=[])
    # force a handler error by monkeypatching the research handler
    original = ROLE_HANDLERS[SubAgentRole.RESEARCH]
    async def boom(*a, **k):
        raise RuntimeError("injected")
    ROLE_HANDLERS[SubAgentRole.RESEARCH] = boom
    try:
        res = await sam.run_sub_agent(SubAgentRole.RESEARCH, ctx)
        # must not raise; returns FAILURE (or fallback) with rationale present
        assert res.rationale != ""
    finally:
        ROLE_HANDLERS[SubAgentRole.RESEARCH] = original

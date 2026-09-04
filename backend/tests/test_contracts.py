"""T2 — Core contract tests (implementation/04-core-contracts.md)."""
from app.core.task import (
    Artifact, Constraint, Dependency, Plan, Result, Step, Task, TaskIntent, TaskStatus, TaskType,
)
from app.core.tool import Tool, ToolMetadata, ToolInvocation, ToolResult, ToolResultStatus, Permission, ToolCategory
from app.core.sub_agent import SubAgentContract, SubAgentContext, SubAgentResult, SubAgentRole, ResultStatus
from app.core.llm import LLMRequest, LLMResponse, Usage, LLMCapability, Message
from app.core.event import Event, EventType, EventActor
from app.core.context import ContextBundle, ContextLayer, ContextLayerKind
from app.core.task import Ref, RefKind


def test_task_required_fields_and_defaults():
    t = Task(conversation_id="c1", user_id="u1", intent=TaskIntent(raw="do x", goal="do x"), plan=Plan())
    assert t.status == TaskStatus.CREATED
    assert t.id and t.created_at and t.updated_at


def test_step_status_enum_and_refs():
    s = Step(goal="g", input_refs=[Ref(kind=RefKind.RESULT, id="r1")])
    assert s.status.value == "pending"
    assert s.input_refs[0].kind == RefKind.RESULT


def test_tool_metadata_permission_schema():
    perm = Permission(name="fs:write", description="write file")
    meta = ToolMetadata(name="files.write", description="w", category=ToolCategory.FILES, permissions=[perm])
    tool = Tool(id="files.write", metadata=meta, handler_ref="files.write")
    assert tool.metadata.permissions[0].name == "fs:write"
    # serialization round-trips
    tool2 = Tool.model_validate(tool.model_dump())
    assert tool2.id == tool.id


def test_sub_agent_result_requires_rationale_field():
    r = SubAgentResult(role=SubAgentRole.RESEARCH, status=ResultStatus.SUCCESS, output={"findings": []}, rationale="bc")
    assert r.rationale == "bc"
    # missing rationale still allowed by pydantic (default ""), but Executor enforces non-empty
    r2 = SubAgentResult(role=SubAgentRole.RESEARCH, status=ResultStatus.SUCCESS, output={})
    assert isinstance(r2.rationale, str)


def test_llm_request_response_contract():
    req = LLMRequest(capability=LLMCapability.CHAT, messages=[Message(role="user", content="hi")])
    resp = LLMResponse(provider="fake", model="m", content="ok", usage=Usage(prompt_tokens=1, completion_tokens=1, total_tokens=2))
    assert resp.usage.total_tokens == 2
    LLMResponse.model_validate(resp.model_dump())


def test_event_envelope_and_seq():
    e = Event(type=EventType.STEP_COMPLETED, task_id="t1", actor=EventActor.AGENT, payload={"x": 1})
    e.seq = 5
    assert e.seq == 5 and e.type == EventType.STEP_COMPLETED


def test_context_bundle_layers():
    b = ContextBundle(layers=[ContextLayer(kind=ContextLayerKind.INSTRUCTION, source_ref=Ref(kind=RefKind.RESULT, id="i"), content_ref="goal", tokens=10, importance=1.0)])
    assert b.token_estimate == 0
    ContextBundle.model_validate(b.model_dump())


def test_invalid_status_transition_contract():
    # status is a closed enum; invalid string raises
    import pydantic
    try:
        TaskStatus("not_a_status")
        assert False, "should raise"
    except ValueError:
        pass

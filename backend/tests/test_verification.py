"""T5 — Per-category verification (decision 03) + bounded recovery loop."""
import pytest
from app.core.sub_agent import SubAgentResult, SubAgentRole, ResultStatus
from app.core.task import TaskType, Result, ResultStatus as RS
from app.verification.verifier import Verifier


def _res(role=SubAgentRole.RESEARCH, out=None, rationale="because", status=ResultStatus.SUCCESS):
    return SubAgentResult(role=role, status=status, output=out or {}, rationale=rationale)


def test_research_requires_sources_or_findings():
    v = Verifier()
    # research requires at least one of 'sources'/'findings'; neither present -> fail
    r = v.verify_sub_agent(_res(out={"text": "x"}), TaskType.RESEARCH)
    assert not r.passed
    r2 = v.verify_sub_agent(_res(out={"findings": []}), TaskType.RESEARCH)
    assert r2.passed
    r3 = v.verify_sub_agent(_res(out={"sources": ["a"]}), TaskType.RESEARCH)
    assert r3.passed


def test_code_requires_code_output():
    v = Verifier()
    assert not v.verify_sub_agent(_res(role=SubAgentRole.CODING, out={"text": "x"}), TaskType.CODE).passed
    assert v.verify_sub_agent(_res(role=SubAgentRole.CODING, out={"code": "x"}), TaskType.CODE).passed


def test_missing_rationale_fails():
    v = Verifier()
    assert not v.verify_sub_agent(_res(rationale=""), TaskType.ANALYSIS).passed


def test_failure_status_fails():
    v = Verifier()
    assert not v.verify_sub_agent(_res(status=ResultStatus.FAILURE), TaskType.WRITE).passed


def test_verify_result_on_core_result():
    v = Verifier()
    res = Result(step_id="s", status=RS.SUCCESS, summary="hello")
    # core Result verification only checks status; category checks use SubAgentResult at exec time
    assert v.verify_result(res, TaskType.WRITE).passed

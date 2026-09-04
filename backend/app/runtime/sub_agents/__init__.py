"""Sub-agent runtime package.

Exposes the locked registry of role handlers and their contracts. Handlers are
invoked ONLY through `SubAgentManager`; they never self-delegate to other roles.
"""
from __future__ import annotations

from app.core.sub_agent import SubAgentContract, SubAgentRole
from app.runtime.sub_agents.roles import (
    CONTRACTS,
    analysis_run,
    browser_run,
    coding_run,
    debug_run,
    deep_reading_run,
    file_run,
    fix_run,
    planning_run,
    research_run,
    review_run,
    security_run,
    testing_run,
    verification_run,
    writing_run,
)

ROLE_HANDLERS: dict[SubAgentRole, callable] = {
    SubAgentRole.RESEARCH: research_run,
    SubAgentRole.DEEP_READING: deep_reading_run,
    SubAgentRole.ANALYSIS: analysis_run,
    SubAgentRole.PLANNING: planning_run,
    SubAgentRole.CODING: coding_run,
    SubAgentRole.WRITING: writing_run,
    SubAgentRole.DEBUG: debug_run,
    SubAgentRole.FIX: fix_run,
    SubAgentRole.REVIEW: review_run,
    SubAgentRole.TESTING: testing_run,
    SubAgentRole.BROWSER: browser_run,
    SubAgentRole.FILE: file_run,
    SubAgentRole.VERIFICATION: verification_run,
    SubAgentRole.SECURITY: security_run,
}

__all__ = ["ROLE_HANDLERS", "CONTRACTS", "SubAgentRole", "SubAgentContract"]

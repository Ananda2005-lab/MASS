"""Browser navigation tool backed by Playwright.

Spec: implementation/11-tool-mcp.md 11.3 (BROWSER). Gracefully degrades: if the
`playwright` package is not installed it returns a SUCCESS result with a stub
observation so downstream flows continue to work without a browser. If Playwright
is available it launches headless chromium, navigates to params['url'], and returns
the page title plus a body snippet. Any failure is surfaced as ToolExecutionError.
"""
from __future__ import annotations

from app.core.tool import Tool, ToolInvocation, ToolResult, ToolResultStatus
from app.exceptions import ToolExecutionError
from app.log import get_logger

logger = get_logger("tools.native.browser")


async def navigate(invocation: ToolInvocation, tool: Tool) -> ToolResult:
    url = invocation.params.get("url")
    if not isinstance(url, str) or not url.strip():
        raise ToolExecutionError("missing or empty 'url' param")

    try:
        from playwright.async_api import async_playwright
    except ImportError:
        logger.warning("playwright_unavailable", falling_back_to_stub=True)
        return ToolResult(
            invocation_id=invocation.id,
            status=ToolResultStatus.SUCCESS,
            output={"observation": "[browser stub: playwright not installed]"},
        )

    timeout = invocation.timeout_ms or 30_000
    try:
        async with async_playwright() as pwright:
            browser = await pwright.chromium.launch()
            try:
                page = await browser.new_page()
                await page.goto(url, timeout=timeout)
                title = await page.title()
                body = await page.content()
                snippet = body[:2000]
            finally:
                await browser.close()
    except Exception as exc:  # noqa: BLE001 - surfaced as tool error
        raise ToolExecutionError(f"browser navigation failed: {exc}", retryable=False)

    return ToolResult(
        invocation_id=invocation.id,
        status=ToolResultStatus.SUCCESS,
        output={"title": title, "body_snippet": snippet, "url": url},
    )

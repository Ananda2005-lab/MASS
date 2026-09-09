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


async def browser_act(invocation: ToolInvocation, tool: Tool) -> ToolResult:
    """Full browser automation: one session, ordered actions.

    params: {url?, actions: [{action: goto|click|type|select|wait|extract|screenshot,
             selector?, text?}]}. Returns title, final url, per-action observations
    and a body-text snippet so the agent can see the effect of its actions.
    """
    import os
    import uuid

    url = str(invocation.params.get("url") or "").strip()
    actions = invocation.params.get("actions") or []
    if isinstance(actions, dict):
        actions = [actions]
    if not url and not actions:
        raise ToolExecutionError("provide 'url' and/or 'actions'", retryable=False)

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
    observations: list[str] = []
    try:
        async with async_playwright() as pwright:
            browser = await pwright.chromium.launch()
            try:
                page = await browser.new_page()
                page.set_default_timeout(min(int(timeout), 15_000))
                if url:
                    await page.goto(url)
                    observations.append(f"goto {url} -> {await page.title()}")
                for a in actions[:10]:
                    act = str(a.get("action") or "").lower()
                    sel = str(a.get("selector") or "")
                    text = str(a.get("text") or "")
                    if act == "goto":
                        await page.goto(sel or text)
                        observations.append(f"goto {sel or text}")
                    elif act == "click":
                        await page.click(sel)
                        observations.append(f"clicked {sel}")
                    elif act == "type":
                        await page.fill(sel, text)
                        observations.append(f"typed into {sel}: {text[:60]}")
                    elif act == "select":
                        await page.select_option(sel, text)
                        observations.append(f"selected {text} in {sel}")
                    elif act == "wait":
                        await page.wait_for_selector(sel, timeout=10_000)
                        observations.append(f"waited for {sel}")
                    elif act == "extract":
                        t = await page.inner_text(sel or "body")
                        observations.append(f"extract[{sel or 'body'}]: {t[:1500]}")
                    elif act == "screenshot":
                        os.makedirs("./sandbox", exist_ok=True)
                        path = os.path.join("./sandbox", f"shot-{uuid.uuid4().hex[:8]}.png")
                        await page.screenshot(path=path)
                        observations.append(f"screenshot saved: {path}")
                    else:
                        observations.append(f"unknown action skipped: {act}")
                final_url = page.url
                title = await page.title()
                body = (await page.inner_text("body"))[:4000]
            finally:
                await browser.close()
    except Exception as exc:  # noqa: BLE001 - surfaced as tool error
        raise ToolExecutionError(f"browser action failed: {exc}", retryable=False)

    return ToolResult(
        invocation_id=invocation.id,
        status=ToolResultStatus.SUCCESS,
        output={
            "title": title,
            "url": final_url,
            "observations": observations,
            "text": body,
        },
    )

"""Web tools: keyless search + page fetch.

- `search.query`: DuckDuckGo HTML endpoint (no API key required).
- `web.fetch`: fetches a URL and returns cleaned readable text.

Both degrade to structured FAILURE results on network errors; never crash.
"""
from __future__ import annotations

import html as _html
import re
from urllib.parse import parse_qs, urlparse

import httpx

from app.core.tool import Tool, ToolInvocation, ToolResult, ToolResultStatus
from app.log import get_logger

logger = get_logger("tools.native.web")

_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 "
        "(KHTML, like Gecko) Chrome/124.0 Safari/537.36"
    )
}


def _clean(s: str) -> str:
    s = re.sub(r"<[^>]+>", "", s)
    return _html.unescape(s).strip()


def _unwrap(u: str) -> str:
    """DuckDuckGo wraps results in /l/?uddg=<real-url> — extract the real one."""
    if "uddg=" in u:
        try:
            q = parse_qs(urlparse(u if u.startswith("http") else "https:" + u).query)
            if q.get("uddg"):
                return q["uddg"][0]
        except Exception:  # noqa: BLE001
            pass
    return u


async def search_query(invocation: ToolInvocation, tool: Tool) -> ToolResult:
    query = str(invocation.params.get("query") or "").strip()
    if not query:
        return ToolResult(
            invocation_id=invocation.id,
            status=ToolResultStatus.FAILURE,
            error={"code": "bad_params", "message": "missing 'query' param"},
        )
    max_results = min(int(invocation.params.get("max_results") or 5), 10)
    try:
        async with httpx.AsyncClient(headers=_HEADERS, follow_redirects=True, timeout=20.0) as client:
            resp = await client.get("https://html.duckduckgo.com/html/", params={"q": query})
            resp.raise_for_status()
            page = resp.text
        titles = re.findall(r'class="result__a"[^>]*>(.*?)</a>', page, re.S)
        urls = re.findall(r'class="result__a"[^>]*href="([^"]+)"', page)
        snippets = re.findall(r'class="result__snippet"[^>]*>(.*?)</a>', page, re.S)
        results = []
        for i in range(min(max_results, len(titles))):
            results.append(
                {
                    "title": _clean(titles[i])[:160],
                    "url": _unwrap(urls[i]) if i < len(urls) else "",
                    "snippet": _clean(snippets[i])[:280] if i < len(snippets) else "",
                }
            )
        logger.info("web_search_ok", query=query, hits=len(results))
        return ToolResult(
            invocation_id=invocation.id,
            status=ToolResultStatus.SUCCESS,
            output={"query": query, "results": results},
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("web_search_failed", query=query, error=str(exc))
        return ToolResult(
            invocation_id=invocation.id,
            status=ToolResultStatus.FAILURE,
            error={"code": "web_error", "message": str(exc)[:200]},
        )


async def fetch_page(invocation: ToolInvocation, tool: Tool) -> ToolResult:
    url = str(invocation.params.get("url") or "").strip()
    if not url.startswith(("http://", "https://")):
        return ToolResult(
            invocation_id=invocation.id,
            status=ToolResultStatus.FAILURE,
            error={"code": "bad_params", "message": "'url' must start with http(s)://"},
        )
    max_chars = int(invocation.params.get("max_chars") or 6000)
    try:
        async with httpx.AsyncClient(headers=_HEADERS, follow_redirects=True, timeout=20.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            page = resp.text
        title_m = re.search(r"<title[^>]*>(.*?)</title>", page, re.S | re.I)
        page = re.sub(r"(?is)<(script|style|noscript)[^>]*>.*?</\1>", " ", page)
        text = re.sub(r"<[^>]+>", " ", page)
        text = re.sub(r"\s+", " ", _html.unescape(text)).strip()
        return ToolResult(
            invocation_id=invocation.id,
            status=ToolResultStatus.SUCCESS,
            output={
                "url": url,
                "title": _clean(title_m.group(1))[:160] if title_m else "",
                "text": text[:max_chars],
            },
        )
    except Exception as exc:  # noqa: BLE001
        logger.warning("web_fetch_failed", url=url, error=str(exc))
        return ToolResult(
            invocation_id=invocation.id,
            status=ToolResultStatus.FAILURE,
            error={"code": "web_error", "message": str(exc)[:200]},
        )

"""Native tool package: definitions + handler registry.

Exports:
- `NATIVE_HANDLERS`: mapping handler_ref -> async handler (invocation, tool) -> ToolResult.
- `build_native_tools()`: returns the native Tool definitions (with ToolMetadata).
- individual handler callables (read_file, list_files, write_file, eval_expression,
  exec_command, navigate) for reuse/testing.
"""
from __future__ import annotations

from app.core.tool import (
    Tool,
    ToolMetadata,
    ToolCategory,
    ExecutionKind,
    ErrorHandling,
    Permission,
)

from app.tools.native.files import read_file, list_files, write_file
from app.tools.native.calculator import eval_expression
from app.tools.native.terminal import exec_command
from app.tools.native.browser import navigate


NATIVE_HANDLERS: dict[str, callable] = {
    "files.read": read_file,
    "files.list": list_files,
    "files.write": write_file,
    "calculator.eval": eval_expression,
    "terminal.exec": exec_command,
    "browser.navigate": navigate,
}


def build_native_tools() -> list[Tool]:
    """Construct the default native tool definitions with proper ToolMetadata."""
    return [
        Tool(
            id="files.read",
            handler_ref="files.read",
            impl_kind="native",
            metadata=ToolMetadata(
                name="Read File",
                description="Read a text file from the sandbox directory.",
                category=ToolCategory.FILES,
                execution=ExecutionKind.ASYNC,
                error_handling=ErrorHandling.FAIL,
                permissions=[Permission(name="fs:read", description="Read files in the sandbox")],
                input_schema={
                    "type": "object",
                    "properties": {"path": {"type": "string"}},
                    "required": ["path"],
                },
                output_schema={
                    "type": "object",
                    "properties": {"content": {"type": "string"}},
                },
            ),
        ),
        Tool(
            id="files.list",
            handler_ref="files.list",
            impl_kind="native",
            metadata=ToolMetadata(
                name="List Files",
                description="List the contents of the sandbox directory.",
                category=ToolCategory.FILES,
                execution=ExecutionKind.ASYNC,
                error_handling=ErrorHandling.FAIL,
                permissions=[Permission(name="fs:read", description="Read files in the sandbox")],
                input_schema={"type": "object", "properties": {}},
                output_schema={
                    "type": "object",
                    "properties": {"entries": {"type": "array"}},
                },
            ),
        ),
        Tool(
            id="files.write",
            handler_ref="files.write",
            impl_kind="native",
            metadata=ToolMetadata(
                name="Write File",
                description="Write a text file into the sandbox directory (destructive).",
                category=ToolCategory.FILES,
                execution=ExecutionKind.ASYNC,
                error_handling=ErrorHandling.FAIL,
                permissions=[Permission(name="fs:write", description="Write files in the sandbox")],
                input_schema={
                    "type": "object",
                    "properties": {
                        "path": {"type": "string"},
                        "content": {"type": "string"},
                    },
                    "required": ["path"],
                },
                output_schema={
                    "type": "object",
                    "properties": {"written": {"type": "boolean"}},
                },
            ),
        ),
        Tool(
            id="calculator.eval",
            handler_ref="calculator.eval",
            impl_kind="native",
            metadata=ToolMetadata(
                name="Calculator",
                description="Safely evaluate a restricted arithmetic expression.",
                category=ToolCategory.CALCULATOR,
                execution=ExecutionKind.ASYNC,
                error_handling=ErrorHandling.FAIL,
                permissions=[],
                input_schema={
                    "type": "object",
                    "properties": {"expression": {"type": "string"}},
                    "required": ["expression"],
                },
                output_schema={
                    "type": "object",
                    "properties": {"result": {"type": ["number", "integer"]}},
                },
            ),
        ),
        Tool(
            id="terminal.exec",
            handler_ref="terminal.exec",
            impl_kind="native",
            metadata=ToolMetadata(
                name="Terminal",
                description="Execute a shell command inside the sandbox cwd (destructive).",
                category=ToolCategory.TERMINAL,
                execution=ExecutionKind.ASYNC,
                error_handling=ErrorHandling.RETRY,
                permissions=[Permission(name="exec:terminal", description="Run terminal commands")],
                input_schema={
                    "type": "object",
                    "properties": {"cmd": {"type": "string"}},
                    "required": ["cmd"],
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "stdout": {"type": "string"},
                        "stderr": {"type": "string"},
                        "returncode": {"type": "integer"},
                    },
                },
            ),
        ),
        Tool(
            id="browser.navigate",
            handler_ref="browser.navigate",
            impl_kind="native",
            metadata=ToolMetadata(
                name="Browser Navigate",
                description="Navigate to a URL and return title/body snippet (network).",
                category=ToolCategory.BROWSER,
                execution=ExecutionKind.ASYNC,
                error_handling=ErrorHandling.FALLBACK,
                permissions=[Permission(name="network", description="Outbound network access")],
                input_schema={
                    "type": "object",
                    "properties": {"url": {"type": "string"}},
                    "required": ["url"],
                },
                output_schema={
                    "type": "object",
                    "properties": {
                        "title": {"type": "string"},
                        "body_snippet": {"type": "string"},
                    },
                },
            ),
        ),
    ]


__all__ = [
    "NATIVE_HANDLERS",
    "build_native_tools",
    "read_file",
    "list_files",
    "write_file",
    "eval_expression",
    "exec_command",
    "navigate",
]

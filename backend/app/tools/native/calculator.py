"""Safe arithmetic calculator tool.

Spec: implementation/11-tool-mcp.md 11.3 (CALCULATOR). Evaluates an arithmetic
expression using the `ast` module only. The AST is walked and ONLY numeric
constants and arithmetic operators are permitted; any Name/Call/Attribute/other
node raises ToolExecutionError.
"""
from __future__ import annotations

import ast

from app.core.tool import Tool, ToolInvocation, ToolResult, ToolResultStatus
from app.exceptions import ToolExecutionError
from app.log import get_logger

logger = get_logger("tools.native.calculator")

_ALLOWED_BINOPS = (
    ast.Add,
    ast.Sub,
    ast.Mult,
    ast.Div,
    ast.FloorDiv,
    ast.Mod,
    ast.Pow,
)
_ALLOWED_UNARYOPS = (ast.UAdd, ast.USub)


def _apply_binop(op: ast.AST, left: float, right: float) -> float:
    if isinstance(op, ast.Add):
        return left + right
    if isinstance(op, ast.Sub):
        return left - right
    if isinstance(op, ast.Mult):
        return left * right
    if isinstance(op, ast.Div):
        return left / right
    if isinstance(op, ast.FloorDiv):
        return left // right
    if isinstance(op, ast.Mod):
        return left % right
    if isinstance(op, ast.Pow):
        return left**right
    raise ToolExecutionError("disallowed binary operator")


def _eval_node(node: ast.AST) -> float:
    if isinstance(node, ast.Constant):
        if isinstance(node.value, bool) or not isinstance(node.value, (int, float)):
            raise ToolExecutionError("only numeric constants are allowed")
        return float(node.value)
    if isinstance(node, ast.Num):  # legacy representation
        return float(node.n)
    if isinstance(node, ast.BinOp):
        if not isinstance(node.op, _ALLOWED_BINOPS):
            raise ToolExecutionError("disallowed binary operator")
        return _apply_binop(node.op, _eval_node(node.left), _eval_node(node.right))
    if isinstance(node, ast.UnaryOp):
        if not isinstance(node.op, _ALLOWED_UNARYOPS):
            raise ToolExecutionError("disallowed unary operator")
        operand = _eval_node(node.operand)
        return +operand if isinstance(node.op, ast.UAdd) else -operand
    raise ToolExecutionError("disallowed expression element")


async def eval_expression(invocation: ToolInvocation, tool: Tool) -> ToolResult:
    expr = invocation.params.get("expression")
    if not isinstance(expr, str) or not expr.strip():
        raise ToolExecutionError("missing or empty 'expression' param")
    try:
        tree = ast.parse(expr, mode="eval")
    except SyntaxError as exc:
        raise ToolExecutionError(f"invalid syntax: {exc}")
    try:
        value = _eval_node(tree.body)
    except ZeroDivisionError:
        raise ToolExecutionError("division by zero", retryable=False)
    result_value = int(value) if float(value).is_integer() else value
    return ToolResult(
        invocation_id=invocation.id,
        status=ToolResultStatus.SUCCESS,
        output={"result": result_value},
    )

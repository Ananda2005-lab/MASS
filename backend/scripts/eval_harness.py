"""Eval harness — quality-engineering #9.

Runs a fixed suite of tasks through the FULL runtime (fake or real gateway)
and scores: completion, step success, final-answer substance, latency.

Usage: PYTHONPATH=. .venv/bin/python scripts/eval_harness.py
"""
from __future__ import annotations

import asyncio
import time

from app.runtime.runtime import build_runtime

TASKS = [
    "research the electric vehicle market trends",
    "write a blog post about remote work culture",
    "fix the login bug in the auth module",
    "implement a stack data structure in python",
    "test the payment retry logic",
    "analyze quarterly sales data for anomalies",
]


async def main() -> int:
    rt = await build_runtime()
    print(f"{'task':<44} {'status':<10} {'steps':<6} {'final_len':<9} {'time':<7} score")
    print("-" * 92)
    total = 0
    for t in TASKS:
        started = time.time()
        task = await rt.submit_instruction(t, "eval-conv", "eval-user")
        done = await rt.run_task(task)
        dt = time.time() - started

        ok = done.status.value == "completed"
        steps_ok = bool(done.plan.steps) and all(
            s.status.value == "succeeded" for s in done.plan.steps
        )
        final_len = len((done.final_result.summary or "") if done.final_result else "")
        score = (1 if ok else 0) + (1 if steps_ok else 0) + (1 if final_len > 80 else 0)
        total += score
        print(
            f"{t[:42]:<44} {done.status.value:<10} {str(steps_ok):<6} "
            f"{final_len:<9} {dt:<7.1f} {score}/3"
        )
    max_score = 3 * len(TASKS)
    print("-" * 92)
    print(f"TOTAL: {total}/{max_score}")
    return 0 if total == max_score else 1


if __name__ == "__main__":
    raise SystemExit(asyncio.run(main()))

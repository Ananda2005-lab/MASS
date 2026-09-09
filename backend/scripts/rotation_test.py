"""Proof: multi-key rotation + failover. Simulates gateway behavior with 5 keys
of one provider and asserts (1) load spreads across keys, (2) a cooled-down key
is skipped, (3) an exhausted key is excluded. Exit 1 on any failure.
"""
from __future__ import annotations

import os
import sys
from collections import Counter

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.llm import (  # noqa: E402
    CredentialProfile,
    LLMCapability,
    LLMRequest,
    Message,
    Model,
    Provider,
    QuotaState,
)
from app.gateway.adapters.fake import FakeProviderAdapter  # noqa: E402
from app.gateway.health_quota import CandidateStateStore  # noqa: E402
from app.gateway.provider import ProviderRegistry  # noqa: E402
from app.gateway.router import Router  # noqa: E402

KEYS = 5
LIMIT = 1000.0


def build() -> tuple[Router, CandidateStateStore]:
    reg = ProviderRegistry()
    prov = Provider(id="t", name="t", kind="llm", adapter_ref="t", capabilities=[LLMCapability.CHAT])
    reg.register(prov, FakeProviderAdapter())
    model = Model(
        id="t-m",
        provider_id="t",
        name="m",
        capability_tags=[LLMCapability.CHAT],
        context_window=128_000,
        cost_unit=1.0,
        tier="standard",
    )
    profiles = {
        f"t-{i}": CredentialProfile(
            id=f"t-{i}",
            provider_id="t",
            key_ref=f"t-{i}",
            quota=QuotaState(used=0.0, limit=LIMIT, window="daily"),
            rate_limit=60,
            allowed_models=["t-m"],
            terms_scope="standard",
        )
        for i in range(1, KEYS + 1)
    }
    state = CandidateStateStore()
    return Router(reg, {"t-m": model}, profiles, state), state


def simulate(router: Router, state: CandidateStateStore, n: int) -> list[str]:
    """Mimic gateway.complete: pick top, record health, consume quota."""
    req = LLMRequest(messages=[Message(role="user", content="x")])
    seq: list[str] = []
    for _ in range(n):
        top = router.ranked(req)[0]
        seq.append(top.profile.id)
        state.health_for(top.provider.id, top.model.id, top.profile.id).record(120.0, True)
        state.quota_for(top.profile.id, LIMIT).consume(50.0)
    return seq


def main() -> int:
    fails = 0
    router, state = build()

    # 1) Load spreads across all keys
    seq = simulate(router, state, 10)
    dist = Counter(seq)
    print(f"pick sequence: {seq}")
    print(f"distribution : {dict(sorted(dist.items()))}")
    if len(dist) >= KEYS:
        print(f"PASS rotation: all {KEYS} keys used in 10 calls")
    else:
        print(f"FAIL rotation: only {len(dist)} keys used")
        fails += 1

    # 2) Cooled-down key is skipped
    router2, state2 = build()
    req = LLMRequest(messages=[Message(role="user", content="x")])
    first = router2.ranked(req)[0].profile.id
    state2.cooldown_for("t", "t-m", first).trigger(30, "simulated 429")
    second = router2.ranked(req)[0].profile.id
    print(f"cooled-down: {first} -> next pick: {second}")
    if second != first:
        print("PASS failover: cooled key skipped")
    else:
        print("FAIL failover: cooled key still selected")
        fails += 1

    # 3) Exhausted key is excluded entirely
    router3, state3 = build()
    state3.quota_for("t-1", LIMIT).consume(LIMIT)  # burn key 1 out
    eligible_ids = [c.profile.id for c in router3.ranked(req)]
    print(f"eligible after exhaustion: {eligible_ids}")
    if "t-1" not in eligible_ids and len(eligible_ids) == KEYS - 1:
        print("PASS quota filter: exhausted key excluded")
    else:
        print("FAIL quota filter")
        fails += 1

    print(f"\nROTATION TEST: {'ALL PASS' if fails == 0 else f'{fails} FAIL'}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())

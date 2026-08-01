"""Checks on the shared Gemini call wrapper.

Every AI feature routes through `generate`, so its retry and give-up behaviour decides
whether a rate limit shows up as a brief pause or as a wrong score written to the database.
"""
import asyncio

import pytest

from app.core import gemini
from app.core.gemini import AIUnavailable, _retry_delay, _status_code, generate


class FakeError(Exception):
    def __init__(self, message, code=None):
        super().__init__(message)
        if code is not None:
            self.code = code


class FakeResponse:
    def __init__(self, text):
        self.text = text


def _patch_call(monkeypatch, side_effects):
    """Drive `generate` with a scripted sequence of results, and skip real sleeping."""
    calls = {"n": 0}

    async def fake_call(**_kwargs):
        i = calls["n"]
        calls["n"] += 1
        outcome = side_effects[min(i, len(side_effects) - 1)]
        if isinstance(outcome, Exception):
            raise outcome
        return outcome

    async def no_sleep(_seconds):
        return None

    monkeypatch.setattr(gemini.gemini_client.aio.models, "generate_content", fake_call)
    monkeypatch.setattr(asyncio, "sleep", no_sleep)
    return calls


# ─── Status and delay parsing ─────────────────────────────────────────────────

def test_status_code_read_from_attribute_and_message():
    assert _status_code(FakeError("boom", code=429)) == 429
    assert _status_code(FakeError("503 UNAVAILABLE. service is down")) == 503
    assert _status_code(FakeError("something entirely unrelated")) is None


def test_retry_delay_parsed_from_google_quota_error():
    err = FakeError("RESOURCE_EXHAUSTED {'retryDelay': '49s'}")
    assert _retry_delay(err) == 49.0
    assert _retry_delay(FakeError("no delay here")) is None


# ─── Retry behaviour ──────────────────────────────────────────────────────────

def test_transient_failure_is_retried_then_succeeds(monkeypatch):
    calls = _patch_call(monkeypatch, [FakeError("503 UNAVAILABLE"), FakeResponse("recovered")])
    result = asyncio.run(generate("prompt"))
    assert result.text == "recovered"
    assert calls["n"] == 2


def test_gives_up_after_the_attempt_budget(monkeypatch):
    calls = _patch_call(monkeypatch, [FakeError("500 INTERNAL")])
    with pytest.raises(AIUnavailable):
        asyncio.run(generate("prompt", attempts=3))
    assert calls["n"] == 3


def test_non_retryable_error_fails_immediately(monkeypatch):
    calls = _patch_call(monkeypatch, [FakeError("400 INVALID_ARGUMENT")])
    with pytest.raises(AIUnavailable):
        asyncio.run(generate("prompt", attempts=3))
    assert calls["n"] == 1, "a bad request must not be retried"


def test_long_quota_wait_gives_up_instead_of_blocking(monkeypatch):
    # Google asks for ~49s on free-tier quota errors; holding an HTTP request open that
    # long is worse than telling the user to retry, so we stop after the first attempt.
    calls = _patch_call(monkeypatch, [FakeError("429 RESOURCE_EXHAUSTED {'retryDelay': '49s'}")])
    with pytest.raises(AIUnavailable):
        asyncio.run(generate("prompt", attempts=3))
    assert calls["n"] == 1


def test_short_quota_wait_is_honoured(monkeypatch):
    calls = _patch_call(
        monkeypatch,
        [FakeError("429 RESOURCE_EXHAUSTED {'retryDelay': '2s'}"), FakeResponse("ok")],
    )
    assert asyncio.run(generate("prompt")).text == "ok"
    assert calls["n"] == 2


def test_empty_response_is_treated_as_unavailable(monkeypatch):
    # A safety-blocked or empty candidate has no text. Callers do `response.text.strip()`,
    # so letting it through would raise AttributeError deep inside a feature.
    _patch_call(monkeypatch, [FakeResponse("")])
    with pytest.raises(AIUnavailable):
        asyncio.run(generate("prompt"))

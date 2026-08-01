"""Checks on the pure scoring logic behind revision, readiness, and note indexing.

These are the calculations the product's recommendations rest on, so they get a
test that fails loudly if the formulas or thresholds drift.
"""
import math

import pytest

from app.core.rag import chunk_text
from app.models.user import UserRegister
from app.routes.readiness import get_exam_prediction, get_subject_status
from app.routes.revision import (
    calculate_retention,
    calculate_stability,
    get_risk_level,
    next_revision_date,
)


# ─── Ebbinghaus retention ─────────────────────────────────────────────────────

def test_retention_is_full_before_any_time_passes():
    assert calculate_retention(0, stability=5.0) == 100.0
    assert calculate_retention(-1, stability=5.0) == 100.0


def test_retention_decays_exponentially_with_elapsed_days():
    stability = 7.0
    # R = 100 * e^(-t/S): one stability period of elapsed time leaves ~36.8%.
    assert calculate_retention(stability, stability) == pytest.approx(
        100 * math.exp(-1), abs=0.1
    )
    # Monotonically decreasing, and clamped into [0, 100].
    scores = [calculate_retention(t, stability) for t in (1, 5, 20, 100)]
    assert scores == sorted(scores, reverse=True)
    assert all(0.0 <= s <= 100.0 for s in scores)


def test_stability_grows_with_revisions_and_with_quiz_score():
    # More revisions => memory holds longer.
    assert calculate_stability(0, 70.0) < calculate_stability(3, 70.0)
    # Higher scores => memory holds longer at the same revision count.
    assert calculate_stability(2, 30.0) < calculate_stability(2, 90.0)
    # The table saturates rather than indexing out of range.
    assert calculate_stability(99, 80.0) == calculate_stability(5, 80.0)


def test_risk_levels_match_their_retention_bands():
    assert get_risk_level(50.0) == "High"
    assert get_risk_level(50.1) == "Medium"
    assert get_risk_level(75.0) == "Medium"
    assert get_risk_level(75.1) == "Low"


def test_next_revision_is_always_in_the_future_and_urgent_when_decayed():
    from datetime import datetime, timezone

    now = datetime.now(timezone.utc)
    healthy = next_revision_date(stability=30.0, current_retention=98.0)
    decayed = next_revision_date(stability=30.0, current_retention=40.0)
    assert healthy > now
    # A topic already below the 75% threshold gets pulled forward to tomorrow.
    assert (decayed - now).days < (healthy - now).days
    assert (decayed - now).total_seconds() > 0


# ─── Readiness banding ────────────────────────────────────────────────────────

def test_exam_prediction_bands_cover_the_full_range():
    assert get_exam_prediction(100).get("status") == "Ready"
    assert get_exam_prediction(81).get("status") == "Ready"
    assert get_exam_prediction(80).get("status") == "Good"
    assert get_exam_prediction(61).get("status") == "Good"
    assert get_exam_prediction(60).get("status") == "Moderate"
    assert get_exam_prediction(41).get("status") == "Moderate"
    assert get_exam_prediction(40).get("status") == "High Risk"
    assert get_exam_prediction(0).get("status") == "High Risk"


def test_subject_status_bands_align_with_overall_prediction():
    assert get_subject_status(81) == "Ready"
    assert get_subject_status(61) == "Good"
    assert get_subject_status(41) == "Needs Improvement"
    assert get_subject_status(40) == "High Risk"


# ─── Note chunking ────────────────────────────────────────────────────────────

def test_chunking_returns_nothing_for_empty_input():
    assert chunk_text("") == []
    assert chunk_text("   \n  ") == []


def test_chunking_splits_long_text_and_keeps_chunks_within_size():
    text = ". ".join(f"Sentence number {i} about databases" for i in range(400))
    chunks = chunk_text(text, chunk_size=200, chunk_overlap=40)
    assert len(chunks) > 1
    assert all(c.strip() == c and c for c in chunks)
    # Overlap must not exceed the chunk size, or splitting cannot terminate.
    with pytest.raises(ValueError):
        chunk_text(text, chunk_size=100, chunk_overlap=100)


# ─── Password policy (reset-password reuses this validator directly) ──────────

@pytest.mark.parametrize("bad", ["Sh0rt!", "alllowercase1!", "ALLUPPERCASE1!", "NoDigits!!", "NoSpecial123"])
def test_weak_passwords_are_rejected(bad):
    with pytest.raises(ValueError):
        UserRegister.validate_password(bad)


def test_strong_password_is_accepted():
    assert UserRegister.validate_password("Str0ng&Pass") == "Str0ng&Pass"

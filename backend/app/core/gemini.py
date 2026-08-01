import asyncio
import logging
import re

from google import genai
from google.genai import types

from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialise the Gemini client once globally at startup
gemini_client = genai.Client(api_key=settings.GEMINI_API_KEY)


class AIUnavailable(Exception):
    """Gemini could not be reached after retrying.

    Raised so callers can tell "the model is temporarily unavailable" apart from a bug,
    and refuse to persist a result that would otherwise look like a genuine low score.
    """


# Transient failures worth retrying: 429 is the per-minute quota (the free tier allows
# very few requests per minute), 500/502/503/504 are Google-side blips.
_RETRYABLE = (429, 500, 502, 503, 504)

# Never block an HTTP request for a whole quota window. Google's 429 often asks for a
# ~50s wait, which is far longer than a user will hold a page open, so past this we give
# up and report unavailability instead of hanging.
_MAX_SLEEP_SECONDS = 8.0


def _status_code(err: Exception) -> int | None:
    code = getattr(err, "code", None) or getattr(err, "status_code", None)
    if isinstance(code, int):
        return code
    match = re.search(r"\b(429|500|502|503|504)\b", str(err))
    return int(match.group(1)) if match else None


def _retry_delay(err: Exception) -> float | None:
    """Honour the retryDelay Google returns on quota errors, when it is short enough."""
    match = re.search(r"'?retryDelay'?:\s*'?(\d+(?:\.\d+)?)s", str(err))
    return float(match.group(1)) if match else None


async def generate(
    contents: str,
    config: types.GenerateContentConfig | None = None,
    model: str | None = None,
    attempts: int = 3,
):
    """Generate content, retrying transient Gemini failures with backoff.

    Every Gemini call in the app routes through here so that rate limits and outages are
    handled in one place rather than degrading silently at nine separate call sites.
    """
    last_error: Exception | None = None

    for attempt in range(1, attempts + 1):
        try:
            response = await gemini_client.aio.models.generate_content(
                model=model or settings.GEMINI_MODEL,
                contents=contents,
                config=config,
            )
            # A blocked or empty candidate yields no text; treat it as a failure here so
            # callers never have to guard against response.text being None.
            if not getattr(response, "text", None):
                raise AIUnavailable("Gemini returned an empty response.")
            return response
        except AIUnavailable:
            raise
        except Exception as err:  # noqa: BLE001 - the SDK raises varied error types
            last_error = err
            code = _status_code(err)
            if code not in _RETRYABLE or attempt == attempts:
                break

            delay = _retry_delay(err) or (2.0 ** (attempt - 1))
            if delay > _MAX_SLEEP_SECONDS:
                logger.warning(
                    f"Gemini asked for a {delay:.0f}s wait (status {code}); "
                    "giving up rather than blocking the request."
                )
                break

            logger.warning(
                f"Gemini call failed with {code}, retrying in {delay:.1f}s "
                f"(attempt {attempt}/{attempts})."
            )
            await asyncio.sleep(delay)

    logger.error(f"Gemini call failed after {attempts} attempt(s): {last_error}")
    raise AIUnavailable(str(last_error)) from last_error

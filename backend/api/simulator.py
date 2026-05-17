import os
import uuid
from datetime import datetime
from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

try:
    from google.api_core.exceptions import ResourceExhausted as _QuotaError
except ImportError:
    _QuotaError = None

# Cached at first call so list_models() is not hit on every request.
_resolved_model_name: str | None = None


def _resolve_model_name(genai) -> str:
    """Return the name of the best available flash model, queried once and cached."""
    global _resolved_model_name
    if _resolved_model_name:
        return _resolved_model_name

    try:
        candidates = [
            m.name for m in genai.list_models()
            if "flash" in m.name.lower()
            and "generateContent" in m.supported_generation_methods
        ]
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"Could not query Gemini model list: {e}")

    if not candidates:
        raise HTTPException(
            status_code=503,
            detail="No suitable Gemini flash model is available for this API key.",
        )

    # Prefer non-preview models for stability; fall back to any flash if needed.
    stable = [m for m in candidates if "preview" not in m.lower()]
    _resolved_model_name = stable[0] if stable else candidates[0]
    return _resolved_model_name


def _gemini_http_exception(e: Exception) -> HTTPException:
    """Map a Gemini SDK exception to a clean FastAPI HTTPException."""
    global _resolved_model_name
    if _QuotaError and isinstance(e, _QuotaError):
        return HTTPException(
            status_code=429,
            detail="The AI service is currently rate-limited or quota has been exceeded. Please wait a minute and try again.",
        )
    err_str = str(e)
    if "429" in err_str or "quota" in err_str.lower() or "resource has been exhausted" in err_str.lower():
        return HTTPException(
            status_code=429,
            detail="The AI service is currently rate-limited or quota has been exceeded. Please wait a minute and try again.",
        )
    if "404" in err_str or "no longer available" in err_str.lower():
        _resolved_model_name = None  # Force re-discovery on the next request.
        return HTTPException(
            status_code=503,
            detail="The AI model is no longer available. The system will auto-select a replacement on your next request — please try again.",
        )
    return HTTPException(status_code=502, detail=f"Gemini API error: {e}")

router = APIRouter(prefix="/api/simulator", tags=["simulator"])

# In-memory session store: session_id -> {"chat": ChatSession, "started_at": str}
# Sessions are intentionally ephemeral — lost on backend restart, which is
# acceptable for a demo/training tool. No DB dependency needed here.
_sessions: dict[str, Any] = {}

_SYSTEM_INSTRUCTION = """
You are a strict but helpful Senior NOC Manager conducting a live incident response drill.

Your behavior is governed by these rules:

PHASE 1 — SCENARIO:
When the drill begins, present ONE realistic NOC/SOC incident. Include:
- The affected service or system (be specific: hostnames, service names, ports)
- Observable symptoms: error messages, metric spikes, alert excerpts, log lines
- Incident timestamp and perceived severity (P1/P2/P3)
- Any known context that a real operator would have at that moment
Keep the scenario under 150 words. Be technical and precise. Do not offer hints.

PHASE 2 — EVALUATION:
After the operator submits their mitigation plan, evaluate it using this exact format:

SCORE: XX/100

STRENGTHS:
- [specific things they did correctly]

GAPS:
- [critical steps they missed, did out of order, or got wrong]

RECOMMENDATIONS:
- [professional advice for how to improve]

Additional rules:
- Be strict. Do not award high scores for vague or incomplete answers.
- Scenarios must reflect real-world NOC/SOC situations: service downtime, DB lock contention,
  network partition, suspected DDoS, disk exhaustion, TLS certificate expiry, lateral movement,
  high CPU/memory, DNS failure, authentication service outage, etc.
- Assume the operator has standard NOC tooling and terminal access.
- Never break character. You are always the Senior NOC Manager.
- Do not offer unsolicited hints or partial answers during Phase 1.
""".strip()


class RespondRequest(BaseModel):
    session_id: str
    message: str


def _build_model():
    """Configure and return a Gemini GenerativeModel. Raises 503 if not ready."""
    try:
        import google.generativeai as genai
    except ImportError:
        raise HTTPException(
            status_code=503,
            detail="google-generativeai is not installed in this environment.",
        )

    api_key = os.getenv("GEMINI_API_KEY", "")
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="GEMINI_API_KEY is not configured on this server.",
        )

    genai.configure(api_key=api_key)
    model_name = _resolve_model_name(genai)
    return genai.GenerativeModel(
        model_name=model_name,
        system_instruction=_SYSTEM_INSTRUCTION,
    )


@router.post("/start")
def start_session():
    """Begin a new drill. Gemini presents a random NOC/SOC incident scenario."""
    model = _build_model()

    try:
        chat = model.start_chat()
        response = chat.send_message(
            "START DRILL. Present a new random NOC/SOC incident scenario now."
        )
    except Exception as e:
        raise _gemini_http_exception(e) from e

    session_id = str(uuid.uuid4())
    _sessions[session_id] = {
        "chat": chat,
        "started_at": datetime.utcnow().isoformat(),
    }

    return {
        "session_id": session_id,
        "scenario_message": response.text,
    }


@router.post("/respond")
def respond_to_scenario(req: RespondRequest):
    """Submit the operator's mitigation steps. Gemini evaluates and returns a score."""
    entry = _sessions.get(req.session_id)
    if not entry:
        raise HTTPException(
            status_code=404,
            detail="Session not found or expired. Start a new drill.",
        )

    if not req.message.strip():
        raise HTTPException(status_code=422, detail="Response cannot be empty.")

    chat = entry["chat"]

    try:
        response = chat.send_message(req.message)
    except Exception as e:
        raise _gemini_http_exception(e) from e

    return {"reply": response.text}


@router.delete("/session/{session_id}")
def end_session(session_id: str):
    """Explicitly discard a session to free memory after the drill is complete."""
    if session_id not in _sessions:
        raise HTTPException(status_code=404, detail="Session not found.")
    del _sessions[session_id]
    return {"detail": "Session ended."}

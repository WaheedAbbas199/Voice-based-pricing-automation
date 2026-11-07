"""Google Gemini integration: transcribes the audio and extracts order details in one call."""
import json, logging, re
from .config import settings

log = logging.getLogger("voxprice.ai")
FIELDS = ["product", "category", "quantity", "unit", "location", "customer", "requirements", "delivery", "notes", "discount"]
MIME = {"wav": "audio/wav", "mp3": "audio/mp3", "ogg": "audio/ogg", "oga": "audio/ogg", "flac": "audio/flac", "aac": "audio/aac",
        "m4a": "audio/mp4", "mp4": "audio/mp4", "webm": "audio/webm"}


class AIError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status, self.message = status, message


def _client():
    if not settings.GEMINI_API_KEY:
        raise AIError(503, "Gemini is not configured. Add GEMINI_API_KEY to the .env file and restart main.py.")
    try:
        from google import genai
    except ImportError:
        raise AIError(500, "The google-genai package is not installed. Run: pip install -r requirements.txt")
    return genai.Client(api_key=settings.GEMINI_API_KEY)


def _friendly(e: Exception) -> AIError:
    t = str(e).lower()
    log.error("Gemini call failed: %s", e)
    if "429" in t or "quota" in t or "resource_exhausted" in t:
        return AIError(429, "The Gemini quota was exceeded. Try again in a minute or check your Google AI plan.")
    if "api key" in t or "api_key" in t or "401" in t or "403" in t or "permission" in t:
        return AIError(502, "Gemini rejected the API key. Check GEMINI_API_KEY in the .env file.")
    if "not found" in t or "404" in t:
        return AIError(502, "The configured Gemini model was not found. Change the model name in CMS → AI (Gemini).")
    return AIError(502, "The Gemini request failed. See the server console for details.")


def _num(v, default=0.0):
    try:
        return float(re.sub(r"[^\d.\-]", "", str(v))) if not isinstance(v, (int, float)) else float(v)
    except Exception:
        return default


def _clean(raw: str) -> dict:
    raw = raw.strip()
    raw = re.sub(r"^```(?:json)?\s*|\s*```$", "", raw, flags=re.I)
    try:
        data = json.loads(raw)
    except Exception:
        m = re.search(r"\{.*\}", raw, re.S)
        if not m:
            raise AIError(502, "The AI returned an unreadable answer. Please try again.")
        try:
            data = json.loads(m.group(0))
        except Exception:
            raise AIError(502, "The AI returned an unreadable answer. Please try again.")
    ex, conf = data.get("extracted") or {}, data.get("confidence") or {}
    out = {k: ex.get(k, "") for k in FIELDS}
    out["quantity"], out["discount"] = _num(out["quantity"]), max(0.0, min(100.0, _num(out["discount"])))
    for k in FIELDS:
        if k not in ("quantity", "discount"):
            out[k] = str(out[k] or "")[:500]
    c = {k: max(0.0, min(1.0, _num(conf.get(k), 0.5))) for k in FIELDS if k != "discount"}
    return {"transcript": str(data.get("transcript", ""))[:5000], "extracted": out, "confidence": c}


def extract(audio: bytes, filename: str, catalog_names: list[str], cfg: dict) -> dict:
    client = _client()
    from google.genai import types
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "wav"
    mime = MIME.get(ext, "audio/wav")
    prompt = (cfg.get("prompt") or "").replace("{catalog}", ", ".join(catalog_names) or "(empty)")
    try:
        resp = client.models.generate_content(
            model=cfg.get("model") or settings.GEMINI_MODEL,
            contents=[prompt, types.Part.from_bytes(data=audio, mime_type=mime)],
            config=types.GenerateContentConfig(response_mime_type="application/json",
                                               temperature=float(cfg.get("temperature", 0.1))))
        text = resp.text or ""
    except AIError:
        raise
    except Exception as e:
        raise _friendly(e)
    if not text.strip():
        raise AIError(502, "Gemini returned an empty answer. The audio may be silent or too short.")
    return _clean(text)


def ping(cfg: dict) -> str:
    client = _client()
    try:
        r = client.models.generate_content(model=cfg.get("model") or settings.GEMINI_MODEL, contents="Reply with the single word: OK")
        return (r.text or "").strip()[:80]
    except Exception as e:
        raise _friendly(e)

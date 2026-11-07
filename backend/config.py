"""Settings loaded from environment variables / the .env file in the project root."""
import os, secrets
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
FRONTEND_DIR = ROOT / "frontend"
DATA_DIR = ROOT / "data"
UPLOAD_DIR = DATA_DIR / "uploads"


def load_env(path: Path = ROOT / ".env") -> None:
    """Tiny .env reader (no extra dependency). Real environment variables win over the file."""
    if not path.exists():
        return
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        k, v = line.split("=", 1)
        v = v.strip().strip('"').strip("'")
        os.environ.setdefault(k.strip(), v)


load_env()


def _secret() -> str:
    if os.getenv("SECRET_KEY"):
        return os.environ["SECRET_KEY"]
    f = DATA_DIR / ".secret_key"          # generated once so sessions survive restarts
    DATA_DIR.mkdir(exist_ok=True)
    if not f.exists():
        f.write_text(secrets.token_hex(32))
        try:
            f.chmod(0o600)
        except OSError:
            pass
    return f.read_text().strip()


def _db_url() -> str:
    url = os.getenv("DATABASE_URL", "postgresql+psycopg://voxprice:voxprice@localhost:5432/voxprice")
    if url.startswith("postgres://"):
        url = "postgresql://" + url[len("postgres://"):]
    if url.startswith("postgresql://"):
        url = "postgresql+psycopg://" + url[len("postgresql://"):]
    return url


class Settings:
    DATABASE_URL = _db_url()
    SECRET_KEY = _secret()
    HOST = os.getenv("HOST", "127.0.0.1")
    PORT = int(os.getenv("PORT", "8000"))
    GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
    GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
    ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@example.com").lower()
    ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "ChangeMe123!")
    SEED_DEMO_DATA = os.getenv("SEED_DEMO_DATA", "true").lower() in ("1", "true", "yes")
    COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() in ("1", "true", "yes")
    SESSION_HOURS = int(os.getenv("SESSION_HOURS", "12"))
    REMEMBER_DAYS = int(os.getenv("REMEMBER_DAYS", "30"))
    PUBLIC_URL = os.getenv("PUBLIC_URL", "").rstrip("/")
    SMTP_HOST = os.getenv("SMTP_HOST", "")
    SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
    SMTP_USER = os.getenv("SMTP_USER", "")
    SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
    SMTP_FROM = os.getenv("SMTP_FROM", "no-reply@voxprice.local")


settings = Settings()

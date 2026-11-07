"""Password hashing (scrypt), signed session tokens (HMAC-SHA256) and a tiny login rate limiter. Stdlib only."""
import base64, hashlib, hmac, json, os, time
from collections import defaultdict, deque


def hash_password(pw: str) -> str:
    salt = os.urandom(16)
    h = hashlib.scrypt(pw.encode(), salt=salt, n=2 ** 14, r=8, p=1, dklen=32)
    return "scrypt$" + base64.b64encode(salt).decode() + "$" + base64.b64encode(h).decode()


def verify_password(pw: str, stored: str) -> bool:
    try:
        _, s, h = stored.split("$")
        salt, want = base64.b64decode(s), base64.b64decode(h)
        got = hashlib.scrypt(pw.encode(), salt=salt, n=2 ** 14, r=8, p=1, dklen=32)
        return hmac.compare_digest(got, want)
    except Exception:
        return False


def _b64(b: bytes) -> str:
    return base64.urlsafe_b64encode(b).rstrip(b"=").decode()


def _unb64(s: str) -> bytes:
    return base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))


def make_token(secret: str, payload: dict, ttl_seconds: int) -> str:
    body = dict(payload, exp=int(time.time()) + ttl_seconds)
    raw = _b64(json.dumps(body, separators=(",", ":")).encode())
    sig = _b64(hmac.new(secret.encode(), raw.encode(), hashlib.sha256).digest())
    return raw + "." + sig


def read_token(secret: str, token: str):
    """Returns the payload dict, or None if the token is forged/expired."""
    try:
        raw, sig = token.split(".")
        good = _b64(hmac.new(secret.encode(), raw.encode(), hashlib.sha256).digest())
        if not hmac.compare_digest(sig, good):
            return None
        body = json.loads(_unb64(raw))
        return body if body.get("exp", 0) > time.time() else None
    except Exception:
        return None


def hash_token(t: str) -> str:
    return hashlib.sha256(t.encode()).hexdigest()


class RateLimiter:
    """Allow `limit` hits per `window` seconds per key (in-memory, per process)."""
    def __init__(self, limit: int, window: int):
        self.limit, self.window, self.hits = limit, window, defaultdict(deque)

    def blocked(self, key: str) -> bool:
        q, now = self.hits[key], time.time()
        while q and q[0] < now - self.window:
            q.popleft()
        return len(q) >= self.limit

    def hit(self, key: str) -> None:
        self.hits[key].append(time.time())

    def clear(self, key: str) -> None:
        self.hits.pop(key, None)

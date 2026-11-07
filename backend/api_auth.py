import logging, re, secrets, smtplib
from datetime import datetime, timedelta
from email.message import EmailMessage
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from . import serializers as S
from .config import settings
from .db import get_db
from .deps import COOKIE, audit, current_user, flags, sysconfig
from .models import ResetToken, User
from .schemas import ChangePwIn, ForgotIn, LoginIn, ProfileIn, RegisterIn, ResetIn
from .security import RateLimiter, hash_password, hash_token, make_token, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])
log = logging.getLogger("voxprice.auth")
login_limit, forgot_limit = RateLimiter(8, 900), RateLimiter(5, 900)


def _policy(pw: str):
    if len(pw) < 8 or not re.search(r"[A-Za-z]", pw) or not re.search(r"\d", pw):
        raise HTTPException(422, "Use 8+ characters with letters and a number.")


def _start(resp: Response, u: User, remember: bool):
    ttl = settings.REMEMBER_DAYS * 86400 if remember else settings.SESSION_HOURS * 3600
    resp.set_cookie(COOKIE, make_token(settings.SECRET_KEY, {"uid": u.id}, ttl), httponly=True, samesite="lax",
                    secure=settings.COOKIE_SECURE, max_age=ttl if remember else None, path="/")


def _ip(r: Request) -> str:
    return r.client.host if r.client else "?"


@router.post("/register")
def register(b: RegisterIn, resp: Response, db: Session = Depends(get_db)):
    if not (flags(db).get("allowSignups", True) and sysconfig(db).get("allowSignups", True)):
        raise HTTPException(403, "New sign-ups are currently disabled.")
    _policy(b.password)
    email = b.email.strip().lower()
    if db.scalar(select(User).where(func.lower(User.email) == email)):
        raise HTTPException(409, "An account with this email already exists.")
    u = User(name=b.name.strip(), email=email, password_hash=hash_password(b.password), role="Agent", last_active=datetime.utcnow())
    db.add(u); db.commit()
    audit(db, u.name, "Registered a new account")
    _start(resp, u, False)
    return {"user": S.user(u)}


@router.post("/login")
def login(b: LoginIn, request: Request, resp: Response, db: Session = Depends(get_db)):
    email, key = b.email.strip().lower(), _ip(request) + "|" + b.email.strip().lower()
    if login_limit.blocked(key):
        raise HTTPException(429, "Too many attempts. Try again in a few minutes.")
    u = db.scalar(select(User).where(func.lower(User.email) == email))
    if not u or not verify_password(b.password, u.password_hash):
        login_limit.hit(key)
        audit(db, email, "Failed login attempt", "warning")
        raise HTTPException(401, "Incorrect email or password.")
    if u.status != "Active":
        raise HTTPException(403, "This account has been deactivated. Contact an administrator.")
    login_limit.clear(key)
    u.last_active = datetime.utcnow(); db.commit()
    _start(resp, u, b.remember)
    return {"user": S.user(u)}


@router.post("/logout")
def logout(resp: Response):
    resp.delete_cookie(COOKIE, path="/")
    return {"ok": True}


@router.get("/me")
def me(u: User = Depends(current_user), db: Session = Depends(get_db)):
    u.last_active = datetime.utcnow(); db.commit()
    return {"user": S.user(u)}


def _send_mail(to: str, subject: str, body: str) -> bool:
    if not settings.SMTP_HOST:
        return False
    m = EmailMessage(); m["From"], m["To"], m["Subject"] = settings.SMTP_FROM, to, subject; m.set_content(body)
    with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=15) as s:
        s.starttls()
        if settings.SMTP_USER:
            s.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
        s.send_message(m)
    return True


@router.post("/forgot")
def forgot(b: ForgotIn, request: Request, db: Session = Depends(get_db)):
    ip = _ip(request)
    if forgot_limit.blocked(ip):
        raise HTTPException(429, "Too many requests. Try again later.")
    forgot_limit.hit(ip)
    u = db.scalar(select(User).where(func.lower(User.email) == b.email.strip().lower()))
    if u and u.status == "Active":                      # same response either way: no account enumeration
        tok = secrets.token_urlsafe(32)
        db.add(ResetToken(user_id=u.id, token_hash=hash_token(tok), expires_at=datetime.utcnow() + timedelta(hours=1))); db.commit()
        base = settings.PUBLIC_URL or str(request.base_url).rstrip("/")
        link = f"{base}/reset-password.html?token={tok}"
        try:
            sent = _send_mail(u.email, "Reset your VoxPrice password", f"Open this link within 1 hour to choose a new password:\n\n{link}\n\nIf you did not ask for this, ignore this email.")
        except Exception as e:                           # SMTP problems must not reveal whether the account exists
            log.error("Could not send reset email: %s", e); sent = False
        if not sent:
            print(f"\n[VoxPrice] Password reset link for {u.email} (SMTP not configured):\n  {link}\n", flush=True)
    return {"ok": True}


@router.post("/reset")
def reset(b: ResetIn, db: Session = Depends(get_db)):
    _policy(b.password)
    t = db.scalar(select(ResetToken).where(ResetToken.token_hash == hash_token(b.token)))
    if not t or t.used or t.expires_at < datetime.utcnow():
        raise HTTPException(400, "This reset link is invalid or has expired. Request a new one.")
    u = db.get(User, t.user_id)
    u.password_hash = hash_password(b.password); t.used = True; db.commit()
    audit(db, u.name, "Password reset via email link")
    return {"ok": True}


@router.post("/change-password")
def change_password(b: ChangePwIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    if not verify_password(b.current, u.password_hash):
        raise HTTPException(400, "Your current password is incorrect.")
    _policy(b.new)
    u.password_hash = hash_password(b.new); db.commit()
    audit(db, u.name, "Changed own password")
    return {"ok": True}


@router.put("/profile")
def profile(b: ProfileIn, u: User = Depends(current_user), db: Session = Depends(get_db)):
    email = b.email.strip().lower()
    other = db.scalar(select(User).where(func.lower(User.email) == email, User.id != u.id))
    if other:
        raise HTTPException(409, "Another account already uses this email.")
    u.name, u.email = b.name.strip(), email; db.commit()
    return {"user": S.user(u)}

"""Shared FastAPI dependencies: sessions, role checks, settings helpers, activity/audit logging."""
from datetime import datetime
from fastapi import Depends, HTTPException, Request
from sqlalchemy import select
from sqlalchemy.orm import Session
from .config import settings
from .db import get_db
from .models import Activity, AuditLog, ErrorLog, Setting, User
from .security import read_token
from . import defaults

COOKIE = "vp_session"


def get_setting(db: Session, key: str, default=None):
    row = db.get(Setting, key)
    base = default if default is not None else {}
    return {**base, **row.value} if row and isinstance(row.value, dict) and isinstance(base, dict) else (row.value if row else base)


def set_setting(db: Session, key: str, value: dict):
    row = db.get(Setting, key)
    if row:
        row.value = value
    else:
        db.add(Setting(key=key, value=value))
    db.commit()


def sysconfig(db):
    return get_setting(db, "sysconfig", defaults.SYSCONFIG)


def flags(db):
    return get_setting(db, "flags", defaults.FLAGS)


def current_user(request: Request, db: Session = Depends(get_db)) -> User:
    tok = request.cookies.get(COOKIE)
    data = read_token(settings.SECRET_KEY, tok) if tok else None
    u = db.get(User, data["uid"]) if data else None
    if not u or u.status != "Active":
        raise HTTPException(401, "Please log in.")
    return u


def _role(*roles, write=False):
    def dep(u: User = Depends(current_user), db: Session = Depends(get_db)) -> User:
        if u.role not in roles:
            raise HTTPException(403, "You do not have permission to do that.")
        if write and u.role != "Admin" and sysconfig(db).get("maintenance"):
            raise HTTPException(503, "The system is in maintenance mode. Changes are temporarily disabled.")
        return u
    return dep


writer = _role("Admin", "Manager", "Agent", write=True)     # create / edit
manager = _role("Admin", "Manager", write=True)             # delete
admin = _role("Admin")                                      # admin console + CMS


def log_activity(db: Session, icon: str, text: str):
    db.add(Activity(icon=icon, text=text[:400]))
    db.commit()


def audit(db: Session, who: str, action: str, level: str = "info"):
    db.add(AuditLog(user=who, action=action[:400], level=level))
    db.commit()


def track_error(db: Session, code: str, message: str):
    e = db.scalar(select(ErrorLog).where(ErrorLog.code == code))
    if e:
        e.count += 1
        e.resolved = False
        e.message = message[:400]
    else:
        db.add(ErrorLog(code=code, message=message[:400], count=1))
    db.commit()

"""Administrator-only endpoints: users, product catalog, error log, system configuration."""
import re, secrets
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, func, select
from sqlalchemy.orm import Session
from . import serializers as S
from .db import get_db
from .deps import admin, audit, set_setting
from .models import AuditLog, ErrorLog, Product, User
from .schemas import ConfigIn, ErrorPatch, ProductIn, ProductPatch, UserCreate, UserPatch
from .security import hash_password

router = APIRouter(prefix="/admin", tags=["admin"])


def _uid(s):
    return int(re.sub(r"\D", "", str(s)) or 0)


def _active_admins(db):
    return db.scalar(select(func.count(User.id)).where(User.role == "Admin", User.status == "Active")) or 0


@router.get("/users")
def users(u: User = Depends(admin), db: Session = Depends(get_db)):
    return [S.user(x) for x in db.scalars(select(User).order_by(User.id))]


@router.post("/users")
def create_user(b: UserCreate, u: User = Depends(admin), db: Session = Depends(get_db)):
    email = b.email.strip().lower()
    if db.scalar(select(User).where(func.lower(User.email) == email)):
        raise HTTPException(409, "A user with this email already exists.")
    temp = secrets.token_urlsafe(9) + "a1"
    nu = User(name=b.name.strip(), email=email, role=b.role, password_hash=hash_password(temp)); db.add(nu); db.commit()
    audit(db, u.name, f"Created user {email} ({b.role})")
    return {"user": S.user(nu), "tempPassword": temp}      # shown once to the admin


@router.put("/users/{uid}")
def update_user(uid: str, b: UserPatch, u: User = Depends(admin), db: Session = Depends(get_db)):
    t = db.get(User, _uid(uid))
    if not t:
        raise HTTPException(404, "User not found.")
    p = b.model_dump(exclude_unset=True)
    demoting = t.role == "Admin" and (p.get("role", "Admin") != "Admin" or p.get("status", "Active") != "Active")
    if demoting and (t.id == u.id or _active_admins(db) <= 1):
        raise HTTPException(400, "You cannot remove the last active administrator (or your own admin access).")
    for k, v in p.items():
        setattr(t, k, v)
    db.commit()
    audit(db, u.name, f"Updated user {t.email}: " + ", ".join(f"{k}={v}" for k, v in p.items()))
    return S.user(t)


@router.get("/logs")
def logs(u: User = Depends(admin), db: Session = Depends(get_db)):
    return [S.audit(x) for x in db.scalars(select(AuditLog).order_by(desc(AuditLog.id)).limit(200))]


# ---- catalog (all products, including hidden) ----
@router.get("/catalog")
def catalog(u: User = Depends(admin), db: Session = Depends(get_db)):
    return [S.product(p) for p in db.scalars(select(Product).order_by(Product.id))]


@router.post("/catalog")
def add_product(b: ProductIn, u: User = Depends(admin), db: Session = Depends(get_db)):
    if db.scalar(select(Product).where(func.lower(Product.name) == b.name.strip().lower())):
        raise HTTPException(409, "A product with this name already exists.")
    p = Product(**b.model_dump()); db.add(p); db.commit(); audit(db, u.name, f"Added product {p.name}")
    return S.product(p)


@router.put("/catalog/{pid}")
def edit_product(pid: str, b: ProductPatch, u: User = Depends(admin), db: Session = Depends(get_db)):
    p = db.get(Product, _uid(pid))
    if not p:
        raise HTTPException(404, "Product not found.")
    d = b.model_dump(exclude_unset=True)
    if "name" in d and db.scalar(select(Product).where(func.lower(Product.name) == d["name"].strip().lower(), Product.id != p.id)):
        raise HTTPException(409, "A product with this name already exists.")
    for k, v in d.items():
        setattr(p, k, v)
    db.commit(); audit(db, u.name, f"Updated product {p.name}")
    return S.product(p)


@router.delete("/catalog/{pid}")
def del_product(pid: str, u: User = Depends(admin), db: Session = Depends(get_db)):
    p = db.get(Product, _uid(pid))
    if p:
        db.delete(p); db.commit(); audit(db, u.name, f"Deleted product {p.name}")
    return {"ok": True}


@router.put("/errors/{eid}")
def resolve_error(eid: int, b: ErrorPatch, u: User = Depends(admin), db: Session = Depends(get_db)):
    e = db.get(ErrorLog, eid)
    if not e:
        raise HTTPException(404, "Not found.")
    e.resolved = b.resolved; db.commit()
    return S.error(e)


@router.put("/config")
def save_config(b: ConfigIn, u: User = Depends(admin), db: Session = Depends(get_db)):
    set_setting(db, "sysconfig", b.model_dump()); audit(db, u.name, "System settings updated")
    return b.model_dump()

"""Customers, quotations, pricing history, calculator, audio processing, bootstrap and analytics."""
import re, uuid
from datetime import date, timedelta
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy import desc, func, select, update
from sqlalchemy.orm import Session
from . import ai, defaults, serializers as S
from .config import UPLOAD_DIR
from .db import get_db
from .deps import admin, audit, current_user, flags, get_setting, log_activity, manager, sysconfig, track_error, writer
from .models import Activity, AudioRequest, AuditLog, Customer, ErrorLog, History, Product, Quote, User
from .pricing import calc_totals
from .schemas import (CalcIn, CustomerIn, CustomerPatch, HistoryIn, HistoryPatch, QuoteIn, QuotePatch, TranscribeIn)

router = APIRouter(tags=["core"])
KEYMAP = {"unitPrice": "unit_price"}


def _apply(row, patch: dict):
    for k, v in patch.items():
        if k in ("customerId", "validUntil"):
            continue
        setattr(row, KEYMAP.get(k, k), v)
    row.total = calc_totals(qty=row.qty, unitPrice=row.unit_price, discount=row.discount, tax=row.tax, delivery=row.delivery, extra=row.extra)["total"]


def _customer(db, cid):
    n = S.from_id("C", cid)
    return db.get(Customer, n) if n else None


def audio_stats(db: Session):
    total = db.scalar(select(func.count(AudioRequest.id))) or 0
    ok = db.scalar(select(func.count(AudioRequest.id)).where(AudioRequest.status == "processed")) or 0
    bad = db.scalar(select(func.count(AudioRequest.id)).where(AudioRequest.status == "failed")) or 0
    mins = db.scalar(select(func.coalesce(func.sum(AudioRequest.duration), 0.0))) or 0
    return {"total": total, "success": ok, "failed": bad, "minutes": round(mins / 60)}


def _lists(db):
    return {"customers": [S.customer(c) for c in db.scalars(select(Customer).order_by(desc(Customer.id)))],
            "quotes": [S.quote(q) for q in db.scalars(select(Quote).order_by(desc(Quote.id)).limit(2000))],
            "history": [S.history(h) for h in db.scalars(select(History).order_by(desc(History.id)).limit(5000))]}


@router.get("/health")
def health():
    return {"ok": True}


@router.get("/bootstrap")
def bootstrap(u: User = Depends(current_user), db: Session = Depends(get_db)):
    d = {"user": S.user(u), "site": get_setting(db, "site", defaults.SITE), "flags": flags(db), "sysconfig": sysconfig(db),
         "catalog": [S.product(p) for p in db.scalars(select(Product).where(Product.active.is_(True)).order_by(Product.id))],
         "activity": [S.activity(a) for a in db.scalars(select(Activity).order_by(desc(Activity.id)).limit(40))],
         "audio": audio_stats(db), **_lists(db), "users": [], "logs": [], "errors": []}
    if u.role == "Admin":
        d["users"] = [S.user(x) for x in db.scalars(select(User).order_by(User.id))]
        d["logs"] = [S.audit(x) for x in db.scalars(select(AuditLog).order_by(desc(AuditLog.id)).limit(200))]
        d["errors"] = [S.error(x) for x in db.scalars(select(ErrorLog).order_by(ErrorLog.id))]
    return d


@router.get("/analytics")
def analytics(u: User = Depends(current_user), db: Session = Depends(get_db)):
    l = _lists(db)
    return {"history": l["history"], "quotes": l["quotes"], "customers": l["customers"], "audio": audio_stats(db)}


@router.post("/pricing/calculate")
def calculate(b: CalcIn, u: User = Depends(current_user)):
    return calc_totals(**b.model_dump())


# ---------------- history ----------------
@router.get("/pricing/history")
def list_history(u: User = Depends(current_user), db: Session = Depends(get_db)):
    return _lists(db)["history"]


@router.post("/pricing/history")
def add_history(b: HistoryIn, u: User = Depends(writer), db: Session = Depends(get_db)):
    c = _customer(db, b.customerId)
    h = History(customer=c.name if c else b.customer, customer_id=c.id if c else None, category=b.category, status=b.status, source=b.source, user_id=u.id,
                product=b.product, unit=b.unit, qty=b.qty, unit_price=b.unitPrice, discount=b.discount, tax=b.tax, delivery=b.delivery, extra=b.extra, date=date.today())
    _apply(h, {}); db.add(h); db.commit()
    log_activity(db, "calc", f"Price calculated: {h.product} × {h.qty:g}")
    return S.history(h)


@router.put("/pricing/history/{hid}")
def edit_history(hid: str, b: HistoryPatch, u: User = Depends(writer), db: Session = Depends(get_db)):
    h = db.get(History, S.from_id("H", hid) or 0)
    if not h:
        raise HTTPException(404, "Record not found.")
    if h.status == "Completed" and u.role != "Admin":
        raise HTTPException(403, "Completed records can only be edited by an administrator.")
    _apply(h, b.model_dump(exclude_unset=True)); db.commit()
    return S.history(h)


@router.delete("/pricing/history/{hid}")
def del_history(hid: str, u: User = Depends(manager), db: Session = Depends(get_db)):
    h = db.get(History, S.from_id("H", hid) or 0)
    if h:
        db.delete(h); db.commit(); audit(db, u.name, f"Deleted calculation {hid}")
    return {"ok": True}


# ---------------- quotations ----------------
@router.get("/quotations")
def list_quotes(u: User = Depends(current_user), db: Session = Depends(get_db)):
    return _lists(db)["quotes"]


@router.post("/quotations")
def add_quote(b: QuoteIn, u: User = Depends(writer), db: Session = Depends(get_db)):
    c = _customer(db, b.customerId)
    q = Quote(customer_id=c.id if c else None, customer=c.name if c else b.customer, company=c.company if c else b.company, status=b.status, notes=b.notes,
              date=date.today(), valid_until=S.parse_date(b.validUntil, date.today() + timedelta(days=14)), product=b.product, unit=b.unit, qty=b.qty,
              unit_price=b.unitPrice, discount=b.discount, tax=b.tax, delivery=b.delivery, extra=b.extra)
    _apply(q, {}); db.add(q); db.commit()
    log_activity(db, "file", f"Quotation {S.to_id('Q', q.id)} created for {q.customer or 'a customer'}")
    return S.quote(q)


@router.put("/quotations/{qid}")
def edit_quote(qid: str, b: QuotePatch, u: User = Depends(writer), db: Session = Depends(get_db)):
    q = db.get(Quote, S.from_id("Q", qid) or 0)
    if not q:
        raise HTTPException(404, "Quotation not found.")
    p = b.model_dump(exclude_unset=True)
    if "customerId" in p:
        c = _customer(db, p["customerId"])
        q.customer_id, q.customer, q.company = (c.id, c.name, c.company) if c else (None, q.customer, q.company)
    if "validUntil" in p:
        q.valid_until = S.parse_date(p["validUntil"], q.valid_until)
    _apply(q, p); db.commit()
    if p.get("status"):
        log_activity(db, "check" if p["status"] == "Approved" else "file", f"Quotation {qid} marked {p['status']}")
    return S.quote(q)


@router.delete("/quotations/{qid}")
def del_quote(qid: str, u: User = Depends(manager), db: Session = Depends(get_db)):
    q = db.get(Quote, S.from_id("Q", qid) or 0)
    if q:
        db.delete(q); db.commit(); audit(db, u.name, f"Deleted quotation {qid}")
    return {"ok": True}


# ---------------- customers ----------------
@router.get("/customers")
def list_customers(u: User = Depends(current_user), db: Session = Depends(get_db)):
    return _lists(db)["customers"]


def _dupe(db, email, skip=None):
    if not email:
        return
    q = select(Customer).where(func.lower(Customer.email) == email.lower())
    if skip:
        q = q.where(Customer.id != skip)
    if db.scalar(q):
        raise HTTPException(409, "A customer with this email already exists.")


@router.post("/customers")
def add_customer(b: CustomerIn, u: User = Depends(writer), db: Session = Depends(get_db)):
    _dupe(db, b.email)
    c = Customer(**b.model_dump()); db.add(c); db.commit()
    log_activity(db, "users", f"New customer added: {c.name}")
    return S.customer(c)


@router.put("/customers/{cid}")
def edit_customer(cid: str, b: CustomerPatch, u: User = Depends(writer), db: Session = Depends(get_db)):
    c = _customer(db, cid)
    if not c:
        raise HTTPException(404, "Customer not found.")
    p = b.model_dump(exclude_unset=True)
    _dupe(db, p.get("email"), c.id)
    for k, v in p.items():
        setattr(c, k, v)
    db.commit()
    return S.customer(c)


@router.delete("/customers/{cid}")
def del_customer(cid: str, u: User = Depends(manager), db: Session = Depends(get_db)):
    c = _customer(db, cid)
    if c:
        db.execute(update(Quote).where(Quote.customer_id == c.id).values(customer_id=None))
        db.execute(update(History).where(History.customer_id == c.id).values(customer_id=None))
        db.delete(c); db.commit(); audit(db, u.name, f"Deleted customer {c.name}")
    return {"ok": True}


# ---------------- audio ----------------
EXT = {"wav", "mp3", "ogg", "oga", "flac", "aac", "m4a", "mp4", "webm"}


@router.post("/audio/upload")
def upload_audio(audio: UploadFile = File(...), duration: float = Form(0), u: User = Depends(writer), db: Session = Depends(get_db)):
    cfg = sysconfig(db)
    name = (audio.filename or "recording.wav")[:300]
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext not in EXT:
        raise HTTPException(415, "Unsupported audio type. Use WAV, MP3, OGG, FLAC, AAC, M4A or WebM.")
    limit = int(cfg.get("maxAudioMB", 15)) * 1048576
    data = audio.file.read(limit + 1)
    if not data:
        raise HTTPException(400, "The audio file is empty.")
    if len(data) > limit:
        raise HTTPException(413, f"The file is larger than the {cfg.get('maxAudioMB', 15)} MB limit.")
    if duration > int(cfg.get("maxSeconds", 300)) + 5:
        raise HTTPException(413, f"Recordings can be at most {cfg.get('maxSeconds', 300)} seconds long.")
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    fname = f"{uuid.uuid4().hex}.{ext}"
    (UPLOAD_DIR / fname).write_bytes(data)
    row = AudioRequest(user_id=u.id, filename=name, path=fname, mime=audio.content_type or "", size=len(data), duration=max(0.0, duration))
    db.add(row); db.commit()
    return {"audioId": str(row.id), "size": len(data)}


@router.post("/audio/transcribe")
def transcribe(b: TranscribeIn, u: User = Depends(writer), db: Session = Depends(get_db)):
    row = db.get(AudioRequest, int(re.sub(r"\D", "", str(b.audioId)) or 0))
    if not row or (row.user_id != u.id and u.role != "Admin"):
        raise HTTPException(404, "Audio not found. Upload it again.")
    path = UPLOAD_DIR / (row.path or "-")
    if not path.exists():
        raise HTTPException(410, "The audio file is no longer stored. Record it again.")
    cfg = {"model": None, "temperature": 0.1, "prompt": defaults.DEFAULT_PROMPT, **get_setting(db, "ai", {})}
    names = [p.name for p in db.scalars(select(Product).where(Product.active.is_(True)))]
    try:
        res = ai.extract(path.read_bytes(), row.path, names, cfg)
    except ai.AIError as e:
        row.status, row.error = "failed", e.message[:500]; db.commit()
        track_error(db, f"AI_{e.status}", e.message)
        audit(db, u.name, f"Audio processing failed: {e.message}", "error")
        raise HTTPException(e.status, e.message)
    row.transcript, row.extracted, row.confidence, row.status, row.error = res["transcript"], res["extracted"], res["confidence"], "processed", ""
    u.requests += 1; db.commit()
    log_activity(db, "mic", f"Voice request processed ({res['extracted'].get('product') or 'unknown product'})")
    return {**res, "mock": False}

"""Row -> JSON shapes expected by the frontend (camelCase, prefixed string ids)."""
import re
from datetime import date, datetime

OFF = {"C": 100, "Q": 2000, "H": 1000}


def iso(d) -> str:
    return d.isoformat()[:10] if d else ""


def to_id(prefix: str, n: int) -> str:
    return f"{prefix}-{OFF[prefix] + n}"


def from_id(prefix: str, s) -> int | None:
    """'Q-2005' -> 5.  Returns None when empty / malformed."""
    digits = re.sub(r"\D", "", str(s or ""))
    if not digits:
        return None
    n = int(digits) - OFF[prefix]
    return n if n > 0 else None


def parse_date(s, default=None):
    try:
        return date.fromisoformat(str(s)[:10])
    except Exception:
        return default


def customer(c):
    return {"id": to_id("C", c.id), "name": c.name, "company": c.company, "email": c.email,
            "phone": c.phone, "address": c.address, "createdAt": iso(c.created_at)}


def _line(r):
    return {"product": r.product, "unit": r.unit, "qty": r.qty, "unitPrice": r.unit_price, "discount": r.discount,
            "tax": r.tax, "delivery": r.delivery, "extra": r.extra, "total": r.total}


def quote(q):
    return {"id": to_id("Q", q.id), "customerId": to_id("C", q.customer_id) if q.customer_id else "",
            "customer": q.customer, "company": q.company, "status": q.status, "notes": q.notes,
            "date": iso(q.date), "validUntil": iso(q.valid_until), **_line(q)}


def history(h):
    return {"id": to_id("H", h.id), "date": iso(h.date), "customer": h.customer,
            "customerId": to_id("C", h.customer_id) if h.customer_id else "", "category": h.category,
            "status": h.status, "source": h.source, **_line(h)}


def user(u):
    return {"id": f"U-{u.id}", "name": u.name, "email": u.email, "role": u.role, "status": u.status,
            "lastActive": iso(u.last_active), "requests": u.requests}


def product(p):
    return {"id": p.id, "name": p.name, "category": p.category, "unit": p.unit, "price": p.price, "active": p.active}


def activity(a):
    return {"id": a.id, "icon": a.icon, "text": a.text, "time": iso(a.time)}


def audit(l):
    t = l.time if isinstance(l.time, datetime) else datetime.utcnow()
    return {"id": l.id, "time": t.strftime("%Y-%m-%d %H:%M"), "user": l.user, "action": l.action, "level": l.level}


def error(e):
    return {"id": e.id, "code": e.code, "message": e.message, "count": e.count, "resolved": e.resolved}

"""CMS: public landing-page content + admin editing of texts, collections, theme, AI prompt and feature flags."""
import colorsys, re
from fastapi import APIRouter, Depends, HTTPException, Response
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.orm import Session
from . import ai, defaults
from .db import get_db
from .deps import admin, audit, flags, get_setting, set_setting
from .models import CmsItem, User

router = APIRouter(prefix="/cms", tags=["cms"])
KINDS = {  # field -> kind (s=text, n=number, b=bool); anything not listed is dropped
    "features": {"icon": "s", "title": "s", "text": "s"}, "steps": {"title": "s", "text": "s"}, "benefits": {"icon": "s", "title": "s", "text": "s"},
    "stats": {"value": "s", "label": "s"}, "plans": {"name": "s", "monthly": "n", "yearly": "n", "features": "s", "cta": "s", "featured": "b"},
    "testimonials": {"quote": "s", "name": "s", "role": "s"}, "faqs": {"question": "s", "answer": "s"}}
SITE_KEYS = {"brandName", "heroBadge", "heroLine1", "heroLine2", "heroLead", "primaryCta", "secondaryCta", "featuresHeading", "featuresSub", "howHeading", "howSub",
             "benefitsHeading", "pricingHeading", "pricingSub", "testimonialsHeading", "faqHeading", "ctaHeading", "ctaText", "ctaButton", "footerTagline", "copyright"}
FONTS = ["Sora", "Manrope", "Inter", "Poppins", "DM Sans", "Space Grotesk", "Plus Jakarta Sans", "Outfit", "Lora", "Merriweather"]
HEX = re.compile(r"^#[0-9a-fA-F]{6}$")


def _clean(coll: str, data: dict) -> dict:
    out = {}
    for k, kind in KINDS[coll].items():
        v = data.get(k)
        if kind == "n":
            try:
                out[k] = max(0.0, min(1e7, float(v)))
                out[k] = int(out[k]) if out[k].is_integer() else out[k]
            except (TypeError, ValueError):
                out[k] = 0
        elif kind == "b":
            out[k] = bool(v)
        else:
            out[k] = str(v or "").strip()[:2000]
    return out


def _item(i: CmsItem):
    return {"id": i.id, "data": i.data, "visible": i.visible, "position": i.position}


def _collections(db, only_visible):
    q = select(CmsItem).order_by(CmsItem.position, CmsItem.id)
    if only_visible:
        q = q.where(CmsItem.visible.is_(True))
    out = {k: [] for k in KINDS}
    for i in db.scalars(q):
        if i.collection in out:
            out[i.collection].append(_item(i))
    return out


@router.get("/site")
def site(db: Session = Depends(get_db)):
    return {"site": get_setting(db, "site", defaults.SITE), "flags": flags(db), "collections": _collections(db, True)}


def theme_css(t: dict) -> str:
    t = {**defaults.THEME, **t}
    col = lambda k: t[k] if HEX.match(str(t.get(k, ""))) else defaults.THEME[k]
    num = lambda k: max(0, min(40, int(t.get(k, defaults.THEME[k]))))
    font = lambda k: t[k] if t.get(k) in FONTS else defaults.THEME[k]
    p = col("primary"); r, g, b = (int(p[i:i + 2], 16) / 255 for i in (1, 3, 5))
    h, l, s = colorsys.rgb_to_hls(r, g, b); r2, g2, b2 = colorsys.hls_to_rgb(h, min(0.8, l + 0.12), s)
    light = "#%02x%02x%02x" % (round(r2 * 255), round(g2 * 255), round(b2 * 255))
    fd, fb = font("fontDisplay"), font("fontBody")
    imp = "@import url('https://fonts.googleapis.com/css2?family=%s:wght@600;700;800&family=%s:wght@400;500;600;700;800&display=swap');\n" % (fd.replace(" ", "+"), fb.replace(" ", "+"))
    return (imp + ":root{--primary-color:%s;--secondary-color:%s;--accent-color:%s;--border-radius:%dpx;--button-radius:%dpx;--font-display:'%s','Segoe UI',system-ui,sans-serif;--font-body:'%s','Segoe UI',system-ui,sans-serif}\n"
            "[data-theme=\"dark\"]{--primary-color:%s}\n") % (p, col("secondary"), col("accent"), num("radius"), num("buttonRadius"), fd, fb, light)


@router.get("/theme.css")
def theme(db: Session = Depends(get_db)):
    return Response(theme_css(get_setting(db, "theme", defaults.THEME)), media_type="text/css", headers={"Cache-Control": "no-cache"})


# ------------------------- admin -------------------------
@router.get("/admin/all")
def admin_all(u: User = Depends(admin), db: Session = Depends(get_db)):
    return {"site": get_setting(db, "site", defaults.SITE), "theme": get_setting(db, "theme", defaults.THEME), "flags": flags(db),
            "ai": {"model": None, "temperature": 0.1, "prompt": defaults.DEFAULT_PROMPT, **get_setting(db, "ai", {})}, "collections": _collections(db, False)}


@router.put("/admin/settings/{key}")
def save_settings(key: str, body: dict, u: User = Depends(admin), db: Session = Depends(get_db)):
    if key == "site":
        val = {k: str(v)[:2000] for k, v in body.items() if k in SITE_KEYS}
    elif key == "theme":
        val = {"primary": body.get("primary"), "secondary": body.get("secondary"), "accent": body.get("accent"), "radius": body.get("radius", 16),
               "buttonRadius": body.get("buttonRadius", 12), "fontDisplay": body.get("fontDisplay"), "fontBody": body.get("fontBody")}
        for k in ("primary", "secondary", "accent"):
            if not HEX.match(str(val[k] or "")):
                raise HTTPException(422, "Colours must look like #635BFF.")
        for k in ("fontDisplay", "fontBody"):
            if val[k] not in FONTS:
                raise HTTPException(422, "Choose a font from the list.")
        for k in ("radius", "buttonRadius"):
            try:
                val[k] = max(0, min(40, int(val[k])))
            except (TypeError, ValueError):
                raise HTTPException(422, "Radius must be a number from 0 to 40.")
    elif key == "ai":
        try:
            temp = max(0.0, min(1.0, float(body.get("temperature", 0.1))))
        except (TypeError, ValueError):
            raise HTTPException(422, "Temperature must be a number between 0 and 1.")
        prompt = str(body.get("prompt", ""))[:8000]
        if "{catalog}" not in prompt:
            raise HTTPException(422, "The prompt must contain {catalog} so the product list can be inserted.")
        val = {"model": re.sub(r"[^\w.\-]", "", str(body.get("model", "")))[:80] or None, "temperature": temp, "prompt": prompt}
    elif key == "flags":
        val = {k: bool(body.get(k, True)) for k in defaults.FLAGS}
    else:
        raise HTTPException(404, "Unknown settings group.")
    set_setting(db, key, val); audit(db, u.name, f"CMS: updated {key} settings")
    return val


@router.post("/admin/items/{coll}")
def add_item(coll: str, body: dict, u: User = Depends(admin), db: Session = Depends(get_db)):
    if coll not in KINDS:
        raise HTTPException(404, "Unknown collection.")
    pos = (db.scalar(select(func.max(CmsItem.position)).where(CmsItem.collection == coll)) or 0) + 1
    i = CmsItem(collection=coll, data=_clean(coll, body.get("data") or {}), position=pos, visible=bool(body.get("visible", True)))
    db.add(i); db.commit(); audit(db, u.name, f"CMS: added item to {coll}")
    return _item(i)


@router.put("/admin/items/{iid}")
def edit_item(iid: int, body: dict, u: User = Depends(admin), db: Session = Depends(get_db)):
    i = db.get(CmsItem, iid)
    if not i:
        raise HTTPException(404, "Item not found.")
    if "data" in body:
        i.data = _clean(i.collection, body["data"] or {})
    if "visible" in body:
        i.visible = bool(body["visible"])
    db.commit(); audit(db, u.name, f"CMS: edited item in {i.collection}")
    return _item(i)


@router.delete("/admin/items/{iid}")
def del_item(iid: int, u: User = Depends(admin), db: Session = Depends(get_db)):
    i = db.get(CmsItem, iid)
    if i:
        db.delete(i); db.commit(); audit(db, u.name, f"CMS: deleted item from {i.collection}")
    return {"ok": True}


class Reorder(BaseModel):
    ids: list[int]


@router.post("/admin/items/{coll}/reorder")
def reorder(coll: str, b: Reorder, u: User = Depends(admin), db: Session = Depends(get_db)):
    if coll not in KINDS:
        raise HTTPException(404, "Unknown collection.")
    rows = {i.id: i for i in db.scalars(select(CmsItem).where(CmsItem.collection == coll))}
    for pos, iid in enumerate(b.ids, 1):
        if iid in rows:
            rows[iid].position = pos
    db.commit()
    return {"ok": True}


@router.post("/admin/ai/test")
def test_ai(u: User = Depends(admin), db: Session = Depends(get_db)):
    cfg = {"model": None, **get_setting(db, "ai", {})}
    try:
        return {"reply": ai.ping(cfg)}
    except ai.AIError as e:
        raise HTTPException(e.status, e.message)

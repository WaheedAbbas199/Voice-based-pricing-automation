"""Create tables and insert first-run data (admin account, catalog, CMS content, optional demo records)."""
import logging, random
from datetime import date, datetime, timedelta
from sqlalchemy import func, select
from . import defaults
from .config import UPLOAD_DIR, settings
from .db import Base, SessionLocal, engine
from .deps import get_setting, set_setting
from .models import Activity, AuditLog, CmsItem, Customer, ErrorLog, History, Product, Quote, Setting, User
from .pricing import calc_totals
from .security import hash_password

log = logging.getLogger("voxprice.seed")


def _flag(db, key) -> bool:
    return db.get(Setting, key) is not None


def init_db():
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        for key, val in (("sysconfig", defaults.SYSCONFIG), ("theme", defaults.THEME), ("flags", defaults.FLAGS), ("site", defaults.SITE),
                         ("ai", {"model": settings.GEMINI_MODEL, "temperature": 0.1, "prompt": defaults.DEFAULT_PROMPT})):
            if not _flag(db, key):
                set_setting(db, key, val)
        if not db.scalar(select(func.count(Product.id))) and not _flag(db, "seeded_products"):
            db.add_all([Product(name=n, category=c, unit=u, price=p) for n, c, u, p in defaults.PRODUCTS]); set_setting(db, "seeded_products", {"v": 1})
        if not _flag(db, "seeded_cms"):                      # only once: deleting items later never brings them back
            db.add_all([CmsItem(collection=c, position=i + 1, data=d) for c, i, d in defaults.cms_rows()]); set_setting(db, "seeded_cms", {"v": 1})
        if not db.scalar(select(func.count(User.id)).where(User.role == "Admin")):
            db.add(User(name="Administrator", email=settings.ADMIN_EMAIL, password_hash=hash_password(settings.ADMIN_PASSWORD), role="Admin"))
            db.add(AuditLog(user="System", action=f"Created first administrator {settings.ADMIN_EMAIL}", level="info"))
            log.warning("Created admin account %s — change the password after the first login.", settings.ADMIN_EMAIL)
        db.commit()
        if settings.SEED_DEMO_DATA and not _flag(db, "seeded_demo"):
            _demo(db); set_setting(db, "seeded_demo", {"v": 1})
    _cleanup_old_audio()


def _demo(db):
    rnd = random.Random(42)
    people = [("Ali Hassan", "BuildRight Traders", "Lahore"), ("Sara Khan", "Greenfield Farms", "Multan"), ("Omar Farooq", "Northwind Offices", "Karachi"),
              ("Hina Malik", "Zain Constructions", "Islamabad"), ("Bilal Ahmed", "Crescent Textiles", "Faisalabad"), ("Ayesha Noor", "Sunrise Retail", "Lahore"),
              ("Usman Tariq", "Apex Electronics", "Rawalpindi"), ("Maria Siddiqui", "Indus Foods", "Karachi")]
    today = date.today()
    cust = [Customer(name=n, company=c, email=n.lower().replace(" ", ".") + "@" + "".join(ch for ch in c.lower() if ch.isalpha()) + ".example",
                     phone=f"+92 300 {1000000 + i * 137913}"[:16], address=f"Plot {12 + i * 7}, Main Boulevard, {city}", created_at=today - timedelta(days=120 - i * 13))
            for i, (n, c, city) in enumerate(people)]
    db.add_all(cust); db.commit()
    prods = list(db.scalars(select(Product)))
    if not prods:
        return
    for i in range(26):
        p, c = rnd.choice(prods), rnd.choice(cust)
        qty = max(1, round(rnd.random() * (300 if p.price < 20 else 60 if p.price < 200 else 8)))
        line = dict(qty=qty, unitPrice=p.price, discount=rnd.choice([0, 0, 5, 10]), tax=8, delivery=rnd.randint(0, 8) * 10, extra=0)
        db.add(History(date=today - timedelta(days=int(i * 6.4 + rnd.random() * 3)), customer=c.name, customer_id=c.id, product=p.name, category=p.category, unit=p.unit,
                       status=rnd.choice(["Completed", "Completed", "Completed", "Pending", "Failed"]), source=rnd.choice(["voice", "manual"]),
                       qty=qty, unit_price=p.price, discount=line["discount"], tax=8, delivery=line["delivery"], extra=0, total=calc_totals(**line)["total"]))
    for i in range(10):
        p, c = rnd.choice(prods), cust[i % len(cust)]
        qty = max(1, round(rnd.random() * (200 if p.price < 20 else 40)))
        line = dict(qty=qty, unitPrice=p.price, discount=[0, 5, 10][i % 3], tax=8, delivery=30 + i * 5, extra=0)
        db.add(Quote(customer_id=c.id, customer=c.name, company=c.company, product=p.name, unit=p.unit, date=today - timedelta(days=i * 5 + 1), valid_until=today + timedelta(days=14 - i * 5),
                     status=["Draft", "Pending", "Sent", "Approved", "Rejected", "Approved", "Sent", "Pending"][i % 8], qty=qty, unit_price=p.price, discount=line["discount"], tax=8,
                     delivery=line["delivery"], extra=0, total=calc_totals(**line)["total"]))
    for icon, text in [("mic", "Voice request processed for Ali Hassan"), ("file", "Quotation Q-2003 sent to Omar Farooq"), ("calc", "Price calculated: Solar Panel 550W × 12"),
                       ("users", "New customer added: Maria Siddiqui"), ("check", "Quotation Q-2004 approved")]:
        db.add(Activity(icon=icon, text=text, time=datetime.utcnow() - timedelta(hours=rnd.randint(1, 90))))
    db.add(ErrorLog(code="AUDIO_422", message="Unsupported audio format", count=7, resolved=False))
    db.add(ErrorLog(code="PRICE_404", message="Product not found in catalog", count=5, resolved=True))
    db.commit()
    log.info("Demo data inserted (set SEED_DEMO_DATA=false to skip it on a fresh database).")


def _cleanup_old_audio():
    """Delete stored audio files older than the configured retention (autoDeleteDays; 0 = keep forever)."""
    from .models import AudioRequest
    with SessionLocal() as db:
        days = int(get_setting(db, "sysconfig", defaults.SYSCONFIG).get("autoDeleteDays", 30))
        if days <= 0:
            return
        old = db.scalars(select(AudioRequest).where(AudioRequest.created_at < datetime.utcnow() - timedelta(days=days), AudioRequest.path.is_not(None)))
        for a in old:
            try:
                (UPLOAD_DIR / a.path).unlink(missing_ok=True)
            except OSError:
                pass
            a.path = None
        db.commit()

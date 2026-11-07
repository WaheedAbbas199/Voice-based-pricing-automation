"""Authoritative price maths (the browser shows a live preview with the same formula)."""

def r2(n: float) -> float:
    return round(float(n) + 1e-9, 2)


def calc_totals(qty=0, unitPrice=0, discount=0, tax=0, delivery=0, extra=0, **_):
    qty, up, disc, tax, dl, ex = (float(x or 0) for x in (qty, unitPrice, discount, tax, delivery, extra))
    subtotal = qty * up
    d_amt = subtotal * disc / 100
    taxable = subtotal - d_amt
    t_amt = taxable * tax / 100
    return {"subtotal": r2(subtotal), "discountAmount": r2(d_amt), "taxAmount": r2(t_amt),
            "delivery": r2(dl), "extra": r2(ex), "total": r2(taxable + t_amt + dl + ex)}

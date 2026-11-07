/* Shared helpers: DOM, formatting, storage, icons, pricing math, CSV. */
window.VP = window.VP || {};
(function(){
  VP.$ = function(s, r){ return (r || document).querySelector(s); };
  VP.$$ = function(s, r){ return Array.from((r || document).querySelectorAll(s)); };
  VP.esc = function(v){ return String(v == null ? '' : v).replace(/[&<>"']/g, function(c){ return { '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]; }); };
  VP.uid = function(p){ return (p || 'id') + '_' + Math.random().toString(36).slice(2, 9); };
  VP.debounce = function(fn, ms){ var t; return function(){ var a = arguments, c = this; clearTimeout(t); t = setTimeout(function(){ fn.apply(c, a); }, ms || 200); }; };
  VP.sleep = function(ms){ return new Promise(function(r){ setTimeout(r, ms); }); };
  VP.root = function(){ return document.body.dataset.root || ''; };
  VP.reducedMotion = function(){ return matchMedia('(prefers-reduced-motion: reduce)').matches; };

  /* storage (safe) */
  VP.store = {
    get: function(k, d){ try{ var v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); }catch(e){ return d; } },
    set: function(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} return v; },
    del: function(k){ try{ localStorage.removeItem(k); }catch(e){} }
  };

  /* settings + formatting */
  VP.settings = function(){ return Object.assign({ currency:'USD', defaultTax:8, defaultDiscount:0, defaultDelivery:0, company:'', notify:{ email:true, quote:true, failed:true, weekly:false } }, VP.store.get('vp_settings', {})); };
  VP.money = function(n, cur){ try{ return new Intl.NumberFormat(undefined, { style:'currency', currency: cur || VP.settings().currency }).format(Number(n) || 0); }catch(e){ return (Number(n)||0).toFixed(2); } };
  VP.num = function(n){ return new Intl.NumberFormat().format(Number(n) || 0); };
  VP.date = function(d){ var x = new Date(d); return isNaN(x) ? '—' : x.toLocaleDateString(undefined, { year:'numeric', month:'short', day:'numeric' }); };
  VP.daysAgo = function(n){ var d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10); };
  VP.initials = function(name){ return String(name || '?').split(/\s+/).slice(0, 2).map(function(w){ return w[0]; }).join('').toUpperCase(); };
  VP.round2 = function(n){ return Math.round((Number(n) + Number.EPSILON) * 100) / 100; };

  /* pricing math — single source of truth */
  VP.calcTotals = function(o){
    var qty = +o.qty || 0, up = +o.unitPrice || 0, disc = +o.discount || 0, tax = +o.tax || 0, del = +o.delivery || 0, ex = +o.extra || 0;
    var subtotal = qty * up, discountAmount = subtotal * disc / 100, taxable = subtotal - discountAmount, taxAmount = taxable * tax / 100;
    return { subtotal: VP.round2(subtotal), discountAmount: VP.round2(discountAmount), taxAmount: VP.round2(taxAmount), delivery: VP.round2(del), extra: VP.round2(ex), total: VP.round2(taxable + taxAmount + del + ex) };
  };

  /* icons (24px stroke set) */
  var P = {
    mic:'<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v4M8 22h8"/>',
    dashboard:'<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    calc:'<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 18h.01M12 18h.01M16 18h.01"/>',
    history:'<path d="M3 12a9 9 0 1 0 3-6.7L3 8"/><path d="M3 3v5h5M12 7v5l3 2"/>',
    file:'<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>',
    users:'<circle cx="9" cy="8" r="4"/><path d="M2 21a7 7 0 0 1 14 0M17 4a4 4 0 0 1 0 8M22 21a7 7 0 0 0-5-6.7"/>',
    chart:'<path d="M3 3v18h18"/><path d="M7 15l4-4 3 3 5-6"/>',
    settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    logout:'<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/>',
    search:'<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
    bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M10 21a2 2 0 0 0 4 0"/>',
    sun:'<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
    moon:'<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>',
    menu:'<path d="M3 6h18M3 12h18M3 18h18"/>', plus:'<path d="M12 5v14M5 12h14"/>',
    edit:'<path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>',
    trash:'<path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v6M14 11v6"/>',
    eye:'<path d="M2 12s4-8 10-8 10 8 10 8-4 8-10 8S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff:'<path d="M17.9 17.9A10 10 0 0 1 12 20C6 20 2 12 2 12a18 18 0 0 1 5.1-5.9M9.9 4.2A9 9 0 0 1 12 4c6 0 10 8 10 8a18 18 0 0 1-2.2 3.2M1 1l22 22"/>',
    download:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3"/>',
    upload:'<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/>',
    check:'<path d="M20 6L9 17l-5-5"/>', x:'<path d="M18 6L6 18M6 6l12 12"/>',
    play:'<path d="M7 4l13 8-13 8z"/>', pause:'<path d="M8 5v14M16 5v14"/>', stop:'<rect x="5" y="5" width="14" height="14" rx="2"/>',
    refresh:'<path d="M21 12a9 9 0 1 1-3-6.7L21 8M21 3v5h-5"/>',
    shield:'<path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z"/>', zap:'<path d="M13 2L3 14h8l-1 8 10-12h-8z"/>',
    dollar:'<path d="M12 2v20M17 6H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    mail:'<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
    phone:'<path d="M22 17v3a2 2 0 0 1-2.2 2A19 19 0 0 1 2 4.2 2 2 0 0 1 4 2h3l2 5-2.5 1.5a14 14 0 0 0 7 7L15 13l5 2z"/>',
    building:'<rect x="4" y="2" width="16" height="20" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 22v-5h6v5"/>',
    pin:'<path d="M12 22s7-6 7-12a7 7 0 0 0-14 0c0 6 7 12 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    user:'<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>', lock:'<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>',
    alert:'<path d="M12 3L2 20h20z"/><path d="M12 10v4M12 17h.01"/>', activity:'<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>',
    server:'<rect x="3" y="3" width="18" height="7" rx="2"/><rect x="3" y="14" width="18" height="7" rx="2"/><path d="M7 6.5h.01M7 17.5h.01"/>',
    card:'<rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>', chevron:'<path d="M9 6l6 6-6 6"/>',
    panel:'<rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/>', layers:'<path d="M12 2l10 5-10 5L2 7zM2 17l10 5 10-5M2 12l10 5 10-5"/>',
    sort:'<path d="M7 15l5 5 5-5M7 9l5-5 5 5"/>', copy:'<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    sparkle:'<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z"/>', globe:'<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'
  };
  VP.icon = function(n, cls){ return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (P[n] || '') + '</svg>'; };

  /* statuses */
  VP.badge = function(text, kind){ return '<span class="badge badge-' + (kind || 'muted') + '">' + VP.esc(text) + '</span>'; };
  VP.statusKind = function(s){ return { Completed:'success', Approved:'success', Active:'success', Sent:'info', Pending:'warning', Draft:'muted', Failed:'danger', Rejected:'danger', Inactive:'danger' }[s] || 'muted'; };

  /* files */
  VP.download = function(name, content, type){ var b = new Blob([content], { type: type || 'text/plain' }), u = URL.createObjectURL(b), a = document.createElement('a'); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(function(){ URL.revokeObjectURL(u); }, 1000); };
  VP.toCSV = function(rows, cols){
    var q = function(v){ v = String(v == null ? '' : v); if(/^[=+\-@]/.test(v)) v = "'" + v; return '"' + v.replace(/"/g, '""') + '"'; }; // neutralise CSV formula injection
    return [cols.map(function(c){ return q(c.label); }).join(',')].concat(rows.map(function(r){ return cols.map(function(c){ return q(typeof c.value === 'function' ? c.value(r) : r[c.key]); }).join(','); })).join('\r\n');
  };

  /* validation */
  VP.valid = { email: function(v){ return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v); }, req: function(v){ return String(v || '').trim().length > 0; } };

  /* animated counters */
  VP.counter = function(el, to, o){
    o = o || {}; var dur = VP.reducedMotion() ? 0 : (o.duration || 1300), t0 = performance.now(), fmt = o.format || function(v){ return VP.num(Math.round(v)); };
    (function step(t){ var p = dur ? Math.min((t - t0) / dur, 1) : 1, e = 1 - Math.pow(1 - p, 3); el.textContent = fmt(to * e); if(p < 1) requestAnimationFrame(step); })(t0);
  };
})();

/* month buckets for charts: last n months incl. current */
VP.lastMonths = function(n){ var out = [], d = new Date(); d.setDate(1); for(var i = n - 1; i >= 0; i--){ var x = new Date(d.getFullYear(), d.getMonth() - i, 1); out.push({ key:x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0'), label:x.toLocaleDateString(undefined, { month:'short' }) }); } return out; };
VP.monthKey = function(date){ return String(date).slice(0, 7); };

/* tabs: <div class="tabs"><button class="tab" data-tab="a">…</button></div> + <div class="tab-panel" data-panel="a"> */
VP.initTabs = function(root){
  root = root || document; var tabs = VP.$$('.tab[data-tab]', root), panels = VP.$$('.tab-panel[data-panel]', root);
  function show(id){ tabs.forEach(function(t){ var on = t.dataset.tab === id; t.classList.toggle('active', on); t.setAttribute('aria-selected', on); }); panels.forEach(function(p){ p.classList.toggle('active', p.dataset.panel === id); }); }
  tabs.forEach(function(t){ t.setAttribute('role', 'tab'); t.addEventListener('click', function(){ show(t.dataset.tab); history.replaceState(null, '', '#' + t.dataset.tab); }); });
  var h = location.hash.slice(1); show(tabs.some(function(t){ return t.dataset.tab === h; }) ? h : tabs[0].dataset.tab);
};

/* <span data-icon="mic"></span> -> inline SVG (keeps static HTML readable) */
VP.hydrateIcons = function(root){ VP.$$('[data-icon]', root).forEach(function(e){ if(!e.firstChild) e.innerHTML = VP.icon(e.dataset.icon); }); };
document.addEventListener('DOMContentLoaded', function(){ VP.hydrateIcons(); });

/* App shell: sidebar, topbar, search, notifications, auth guard, reveal + counters, page transitions. */
window.VP = window.VP || {};
VP.app = (function(){
  var app = { BRAND:'VoxPrice' };
  var NAV = [
    { id:'dashboard', label:'Dashboard', icon:'dashboard' }, { id:'voice-assistant', label:'Voice Assistant', icon:'mic' },
    { id:'pricing-calculator', label:'Pricing Calculator', icon:'calc' }, { id:'pricing-history', label:'Pricing History', icon:'history' },
    { id:'quotations', label:'Quotations', icon:'file' }, { id:'customers', label:'Customers', icon:'users' },
    { id:'analytics', label:'Analytics', icon:'chart' }, { id:'settings', label:'Settings', icon:'settings' }
  ];
  var page = document.body.dataset.page, session = function(){ return VP.store.get('vp_session', null); };
  function isAdmin(){ var s = session(); return !!s && s.role === 'Admin'; }

  async function logout(){ if(VP.api && !VP.api.isMock){ try{ await VP.api.auth.logout(); }catch(e){} } VP.store.del('vp_session'); location.href = VP.root() + 'login.html'; }
  function guard(){
    if(!session()){ location.replace(VP.root() + 'login.html'); return false; }
    if((page === 'admin' || page === 'cms') && !isAdmin()){
      // UI-only gate. Real authorization MUST be enforced by the backend.
      document.getElementById('content').innerHTML = '<div class="card empty" style="max-width:520px;margin:4rem auto">' + VP.icon('lock') + '<h2>Admin access required</h2><p style="margin:.6rem auto 1.2rem">Sign in with an administrator account to open this console.</p><a class="btn btn-primary" href="dashboard.html">Back to dashboard</a></div>';
      return 'denied';
    }
    return true;
  }

  function sidebar(){
    var el = document.getElementById('sidebar'); if(!el) return;
    var items = NAV.map(function(n){ return '<a class="nav-item' + (n.id === page ? ' active' : '') + '" href="' + n.id + '.html" title="' + n.label + '"' + (n.id === page ? ' aria-current="page"' : '') + '>' + VP.icon(n.icon) + '<span class="nav-label">' + n.label + '</span></a>'; }).join('');
    if(isAdmin()) items += '<div class="nav-section">Administration</div><a class="nav-item' + (page === 'admin' ? ' active' : '') + '" href="admin.html" title="Admin console">' + VP.icon('shield') + '<span class="nav-label">Admin console</span></a><a class="nav-item' + (page === 'cms' ? ' active' : '') + '" href="cms.html" title="Content &amp; settings (CMS)">' + VP.icon('layers') + '<span class="nav-label">CMS</span></a>';
    el.innerHTML = '<a class="brand" href="dashboard.html"><span class="brand-mark">' + VP.icon('mic') + '</span><span class="brand-text">' + VP.esc(app.BRAND) + '</span></a><nav class="nav-list" aria-label="Main navigation">' + items + '</nav>' +
      '<div class="sidebar-footer"><button class="nav-item collapse-btn" type="button" id="collapse-btn" title="Collapse sidebar">' + VP.icon('panel') + '<span class="nav-label">Collapse</span></button><button class="nav-item" type="button" id="logout-btn" title="Log out">' + VP.icon('logout') + '<span class="nav-label">Logout</span></button></div>';
    var bd = document.createElement('div'); bd.className = 'sidebar-backdrop'; bd.addEventListener('click', function(){ document.body.classList.remove('sidebar-open'); }); document.querySelector('.app-shell').appendChild(bd);
    if(VP.store.get('vp_sidebar_collapsed', false)) document.body.classList.add('sidebar-collapsed');
    el.querySelector('#collapse-btn').addEventListener('click', function(){ var c = document.body.classList.toggle('sidebar-collapsed'); VP.store.set('vp_sidebar_collapsed', c); setTimeout(function(){ window.dispatchEvent(new Event('resize')); }, 350); });
    el.querySelector('#logout-btn').addEventListener('click', logout);
    el.addEventListener('click', function(e){ if(e.target.closest('a')) document.body.classList.remove('sidebar-open'); });
  }

  function topbar(){
    var el = document.getElementById('topbar'); if(!el) return; var s = session() || { name:'Guest', role:'' };
    var acts = VP.data.list('activity').slice(0, 5), read = VP.store.get('vp_notif_read', []), unread = acts.filter(function(a){ return read.indexOf(a.id) < 0; }).length;
    el.innerHTML = '<button class="btn btn-ghost btn-icon menu-btn" type="button" id="menu-btn" aria-label="Open menu">' + VP.icon('menu') + '</button>' +
      '<div class="search"><label class="sr-only" for="gsearch">Search</label>' + VP.icon('search') + '<input id="gsearch" class="input" type="search" placeholder="Search pages, customers, quotations…" autocomplete="off"><div class="search-results" id="gresults" role="listbox"></div></div>' +
      '<div class="topbar-actions">' + (page === 'admin' ? '<span class="admin-chip">ADMIN</span>' : '') +
      '<button class="btn btn-ghost btn-icon" type="button" data-theme-toggle aria-label="Toggle dark or light mode"><span class="only-dark">' + VP.icon('sun') + '</span><span class="only-light">' + VP.icon('moon') + '</span></button>' +
      '<div class="dropdown" id="notif-dd"><button class="btn btn-ghost btn-icon" type="button" style="position:relative" aria-label="Notifications" aria-haspopup="true">' + VP.icon('bell') + (unread ? '<span class="notif-dot" id="notif-count">' + unread + '</span>' : '') + '</button><div class="dropdown-menu" style="min-width:320px"><div class="head row between"><b>Notifications</b><button class="btn btn-ghost btn-sm" type="button" id="mark-read">Mark all read</button></div>' +
        acts.map(function(a){ return '<div class="notif-item' + (read.indexOf(a.id) < 0 ? ' unread' : '') + '"><span class="activity-dot">' + VP.icon(a.icon) + '</span><div>' + VP.esc(a.text) + '<div class="xs muted">' + VP.date(a.time) + '</div></div></div>'; }).join('') + '</div></div>' +
      '<div class="dropdown" id="user-dd"><button class="user-btn" type="button" aria-haspopup="true"><span class="avatar">' + VP.esc(VP.initials(s.name)) + '</span><span class="meta"><b>' + VP.esc(s.name) + '</b><span>' + VP.esc(s.role) + '</span></span></button><div class="dropdown-menu"><div class="head"><b>' + VP.esc(s.name) + '</b><div class="xs muted">' + VP.esc(s.email || '') + '</div></div><a class="dropdown-item" href="profile.html">' + VP.icon('user') + 'My profile</a><a class="dropdown-item" href="settings.html">' + VP.icon('settings') + 'Settings</a><button class="dropdown-item" type="button" id="um-logout">' + VP.icon('logout') + 'Log out</button></div></div></div>';
    el.querySelector('#menu-btn').addEventListener('click', function(){ document.body.classList.toggle('sidebar-open'); });
    el.querySelector('#um-logout').addEventListener('click', logout);
    el.querySelector('#mark-read').addEventListener('click', function(){ VP.store.set('vp_notif_read', VP.data.list('activity').map(function(a){ return a.id; })); var c = document.getElementById('notif-count'); if(c) c.remove(); VP.$$('.notif-item.unread').forEach(function(n){ n.classList.remove('unread'); }); });
    VP.$$('.dropdown > button', el).forEach(function(b){ b.addEventListener('click', function(e){ e.stopPropagation(); var d = b.parentElement, o = d.classList.contains('open'); VP.$$('.dropdown.open').forEach(function(x){ x.classList.remove('open'); }); if(!o) d.classList.add('open'); b.setAttribute('aria-expanded', !o); }); });
    document.addEventListener('click', function(e){ if(!e.target.closest('.dropdown')) VP.$$('.dropdown.open').forEach(function(x){ x.classList.remove('open'); }); });
    search(el.querySelector('#gsearch'), el.querySelector('#gresults'));
  }

  function search(input, box){
    function build(q){
      q = q.trim().toLowerCase(); if(!q){ box.classList.remove('open'); return; }
      var groups = [
        { t:'Pages', items:NAV.concat([{ id:'profile', label:'Profile', icon:'user' }]).filter(function(n){ return n.label.toLowerCase().indexOf(q) >= 0; }).map(function(n){ return { href:n.id + '.html', icon:n.icon, label:n.label }; }) },
        { t:'Customers', items:VP.data.list('customers').filter(function(c){ return (c.name + c.company + c.email).toLowerCase().indexOf(q) >= 0; }).slice(0, 4).map(function(c){ return { href:'customers.html?q=' + encodeURIComponent(c.name), icon:'user', label:c.name + ' — ' + c.company }; }) },
        { t:'Quotations', items:VP.data.list('quotes').filter(function(x){ return (x.id + x.customer + x.product).toLowerCase().indexOf(q) >= 0; }).slice(0, 4).map(function(x){ return { href:'quotations.html?q=' + encodeURIComponent(x.id), icon:'file', label:x.id + ' · ' + x.customer }; }) }
      ].filter(function(g){ return g.items.length; });
      box.innerHTML = groups.length ? groups.map(function(g){ return '<div class="group">' + g.t + '</div>' + g.items.map(function(i){ return '<a href="' + i.href + '">' + VP.icon(i.icon) + VP.esc(i.label) + '</a>'; }).join(''); }).join('') : '<div class="group">No results for “' + VP.esc(q) + '”</div>';
      box.classList.add('open');
    }
    input.addEventListener('input', VP.debounce(function(){ build(input.value); }, 120));
    input.addEventListener('keydown', function(e){ if(e.key === 'Enter'){ var a = box.querySelector('a'); if(a) location.href = a.getAttribute('href'); } if(e.key === 'Escape'){ box.classList.remove('open'); input.blur(); } });
    document.addEventListener('click', function(e){ if(!e.target.closest('.search')) box.classList.remove('open'); });
  }

  function reveal(root){
    var els = VP.$$('[data-reveal]:not(.is-in)', root); if(!('IntersectionObserver' in window)){ els.forEach(function(e){ e.classList.add('is-in'); }); return; }
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('is-in'); io.unobserve(e.target); } }); }, { threshold:.12, rootMargin:'0px 0px -40px 0px' });
    els.forEach(function(e){ io.observe(e); });
  }
  function counters(root){
    var els = VP.$$('[data-count]:not([data-counted])', root);
    var run = function(el){ el.dataset.counted = 1; var to = parseFloat(el.dataset.count), pre = el.dataset.prefix || '', suf = el.dataset.suffix || '', dec = +el.dataset.decimals || 0, money = el.dataset.format === 'money';
      VP.counter(el, to, { format:function(v){ return money ? VP.money(v) : pre + (dec ? v.toFixed(dec) : VP.num(Math.round(v))) + suf; } }); };
    if(!('IntersectionObserver' in window)){ els.forEach(run); return; }
    var io = new IntersectionObserver(function(es){ es.forEach(function(e){ if(e.isIntersecting){ run(e.target); io.unobserve(e.target); } }); }, { threshold:.4 });
    els.forEach(function(e){ io.observe(e); });
  }
  function transitions(){
    document.addEventListener('click', function(e){
      var a = e.target.closest('a[href]'); if(!a || a.target || e.metaKey || e.ctrlKey || e.shiftKey || VP.reducedMotion()) return;
      var h = a.getAttribute('href'); if(!h || h[0] === '#' || /^(https?:|mailto:|tel:)/.test(h) || a.hasAttribute('download')) return;
      e.preventDefault(); document.body.classList.add('page-leaving'); setTimeout(function(){ location.href = h; }, 170);
    });
    window.addEventListener('pageshow', function(e){ if(e.persisted) document.body.classList.remove('page-leaving'); });
  }
  /* turn skeletons on, then run render() after ms */
  function skeleton(els, ms, done){ els.forEach(function(e){ e.classList.add('skeleton'); }); setTimeout(function(){ els.forEach(function(e){ e.classList.remove('skeleton'); }); if(done) done(); }, VP.reducedMotion() ? 0 : ms); }

  function ready(fn){ if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', fn); else fn(); }
  function banner(){
    var cfg = VP.data.list('sysconfig'), c = document.getElementById('content'); if(!cfg || !cfg.maintenance || !c) return;
    var n = document.createElement('div'); n.className = 'notice'; n.style.marginBottom = 'var(--space-4)'; n.innerHTML = VP.icon('alert') + '<span>' + (isAdmin() ? '<b>Maintenance mode is ON.</b> Only administrators can make changes.' : '<b>Maintenance mode.</b> You can view data, but changes are temporarily disabled.') + '</span>'; c.prepend(n);
  }
  ready(async function(){
    transitions();
    if(document.body.classList.contains('app')){
      if(!session()){ location.replace(VP.root() + 'login.html'); return; }
      if(!VP.api.isMock){   // backend mode: verify the cookie session, then load server data into the VP.data cache
        try{ var me = await VP.api.auth.me(); VP.store.set('vp_session', Object.assign({}, session(), me.user)); await VP.data.sync(); }
        catch(e){ if(e.status === 401){ VP.store.del('vp_session'); location.replace(VP.root() + 'login.html'); return; } VP.toast(e.message, 'error', 8000); }
        var st = VP.data.site(); if(st.brandName) app.BRAND = st.brandName;
      }
      var g = guard(); if(g === false) return; sidebar(); topbar(); banner();
      if(page === 'admin' || page === 'cms') document.body.classList.add('admin-page'); if(g === 'denied') return;
    }
    reveal(document); counters(document);
    document.dispatchEvent(new CustomEvent('vp:ready'));
  });
  return Object.assign(app, { reveal:reveal, counters:counters, skeleton:skeleton, session:session, isAdmin:isAdmin, logout:logout, ready:function(fn){ document.addEventListener('vp:ready', fn, { once:true }); } });
})();

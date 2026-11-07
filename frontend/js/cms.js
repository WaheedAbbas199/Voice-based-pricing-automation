/* CMS client.
   Part 1: renders CMS content on the public landing page (public endpoint, falls back to built-in defaults).
   Part 2: the admin CMS page (add / edit / delete / reorder / hide content, theme, AI prompt, feature flags). */
window.VP = window.VP || {};
VP.cms = (function(){
  var esc = function(s){ return VP.esc(s); };
  var ICONS = ['mic', 'sparkle', 'edit', 'calc', 'file', 'chart', 'clock', 'shield', 'users', 'zap', 'dollar', 'card', 'layers', 'globe', 'lock', 'activity', 'server', 'building', 'mail', 'phone', 'pin', 'check', 'bell', 'search'];

  /* ---------- Part 1: landing renderers ---------- */
  var R = {
    features: function(d, i){ return '<article class="card feature hover-lift" data-reveal style="--i:' + i + '"><span class="stat-icon">' + VP.icon(d.icon || 'sparkle') + '</span><h3>' + esc(d.title) + '</h3><p>' + esc(d.text) + '</p></article>'; },
    steps: function(d, i){ return '<div class="step" data-reveal style="--i:' + i + '"><h3>' + esc(d.title) + '</h3><p>' + esc(d.text) + '</p></div>'; },
    benefits: function(d){ return '<li><span class="stat-icon">' + VP.icon(d.icon || 'check') + '</span><div><h3>' + esc(d.title) + '</h3><p>' + esc(d.text) + '</p></div></li>'; },
    stats: function(d){ var n = parseFloat(d.value); return '<div class="card"><b' + (isNaN(n) ? '>' + esc(d.value) : ' data-count="' + n + '">0') + '</b><span class="muted small">' + esc(d.label) + '</span></div>'; },
    plans: function(d, i){ var li = String(d.features || '').split('\n').filter(Boolean).map(function(x){ return '<li>' + VP.icon('check') + '<span>' + esc(x) + '</span></li>'; }).join('');
      return '<div class="card plan-card hover-lift' + (d.featured ? ' featured' : '') + '" data-reveal style="--i:' + i + '">' + (d.featured ? '<span class="ribbon">Most popular</span>' : '') + '<h3>' + esc(d.name) + '</h3><div class="price">$<span data-m="' + esc(d.monthly) + '" data-y="' + esc(d.yearly) + '">' + esc(d.monthly) + '</span> <small data-per>/month</small></div><ul>' + li + '</ul><a class="btn ' + (d.featured ? 'btn-primary' : 'btn-secondary') + ' btn-block" href="register.html">' + esc(d.cta || 'Start free trial') + '</a></div>'; },
    testimonials: function(d, i){ return '<figure class="card quote-card" data-reveal style="--i:' + i + '"><blockquote><p>“' + esc(d.quote) + '”</p></blockquote><figcaption class="row"><span class="avatar">' + esc(String(d.name || '?')[0]) + '</span><div><b>' + esc(d.name) + '</b><div class="muted xs">' + esc(d.role) + '</div></div></figcaption></figure>'; },
    faqs: function(d, i){ return '<details data-reveal style="--i:' + i + '"><summary>' + esc(d.question) + '</summary><p>' + esc(d.answer) + '</p></details>'; }
  };
  var TARGET = { features:'cms-features', steps:'cms-steps', benefits:'cms-benefits', stats:'cms-stats', plans:'cms-plans', testimonials:'cms-testimonials', faqs:'cms-faq' };
  var FLAG_SECTION = { showFeatures:'features', showHow:'how', showBenefits:'benefits', showPricing:'pricing', showTestimonials:'testimonials', showFaq:'faq', showCta:'cta' };

  function applySite(d){
    var site = d.site || {}; VP.$$('[data-cms]').forEach(function(el){ var v = site[el.dataset.cms]; if(v !== undefined && v !== null && v !== '') el.textContent = v; });
    if(site.brandName) document.title = site.brandName + ' — Voice-based pricing automation';
    var cols = d.collections || {};
    Object.keys(TARGET).forEach(function(k){
      var box = document.getElementById(TARGET[k]); if(!box || !Array.isArray(cols[k])) return;
      if(!cols[k].length){ if(k !== 'stats') box.hidden = true; return; }
      box.hidden = false; box.innerHTML = cols[k].map(function(it, i){ return R[k](it.data, i); }).join('');
    });
    var fl = d.flags || {};
    Object.keys(FLAG_SECTION).forEach(function(f){ if(fl[f] === false){ var s = document.getElementById(FLAG_SECTION[f]); if(s) s.hidden = true; VP.$$('.nav-links a[href="#' + FLAG_SECTION[f] + '"]').forEach(function(a){ a.hidden = true; }); } });
    VP.app.reveal(document); VP.app.counters(document);
    var tg = document.getElementById('billing'); if(tg) tg.dispatchEvent(new Event('change'));
  }
  function initLanding(){
    if(!document.getElementById('cms-features')) return;
    fetch('/api/cms/site', { credentials:'same-origin' }).then(function(r){ return r.ok ? r.json() : Promise.reject(); }).then(applySite).catch(function(){ /* static mode: keep built-in defaults */ });
  }

  /* ---------- Part 2: admin CMS page ---------- */
  var COLL = {
    features:{ label:'Features', hint:'Cards in the “Features” section.', fields:[['icon', 'Icon', 'icon'], ['title', 'Title'], ['text', 'Description', 'textarea']], name:function(d){ return d.title; }, sub:function(d){ return d.text; } },
    steps:{ label:'How it works', hint:'Numbered steps (numbering is automatic).', fields:[['title', 'Title'], ['text', 'Description', 'textarea']], name:function(d){ return d.title; }, sub:function(d){ return d.text; } },
    benefits:{ label:'Benefits', hint:'Benefit list on the left of the Benefits section.', fields:[['icon', 'Icon', 'icon'], ['title', 'Title'], ['text', 'Description', 'textarea']], name:function(d){ return d.title; }, sub:function(d){ return d.text; } },
    stats:{ label:'Stat boxes', hint:'Big numbers next to the benefits. A numeric value counts up.', fields:[['value', 'Value (e.g. 14)'], ['label', 'Label']], name:function(d){ return d.value + ' — ' + d.label; } },
    plans:{ label:'Pricing plans', hint:'Prices are in USD per month. One plan per line in “Features”.', fields:[['name', 'Plan name'], ['monthly', 'Monthly price', 'number'], ['yearly', 'Price per month when billed yearly', 'number'], ['features', 'Features (one per line)', 'textarea'], ['cta', 'Button text'], ['featured', 'Highlight as “Most popular”', 'check']], name:function(d){ return d.name + ' — $' + d.monthly; }, sub:function(d){ return String(d.features || '').split('\n').join(' · '); } },
    testimonials:{ label:'Testimonials', hint:'Customer quotes.', fields:[['quote', 'Quote', 'textarea'], ['name', 'Name'], ['role', 'Role / company']], name:function(d){ return d.name; }, sub:function(d){ return d.quote; } },
    faqs:{ label:'FAQ', hint:'Questions and answers.', fields:[['question', 'Question'], ['answer', 'Answer', 'textarea']], name:function(d){ return d.question; }, sub:function(d){ return d.answer; } }
  };
  var PRODUCT = { label:'Products', hint:'The price catalog used by the voice assistant and the calculator.', fields:[['name', 'Product name'], ['category', 'Category'], ['unit', 'Unit (bag, piece, ton…)'], ['price', 'Unit price', 'number'], ['active', 'Available for pricing', 'check']] };
  var SITE_FIELDS = [['brandName', 'Brand name'], ['heroBadge', 'Hero badge text'], ['heroLine1', 'Hero title — line 1'], ['heroLine2', 'Hero title — line 2 (gradient)'], ['heroLead', 'Hero description', 'textarea'], ['primaryCta', 'Primary button'], ['secondaryCta', 'Secondary button'],
    ['featuresHeading', 'Features heading'], ['featuresSub', 'Features subtitle'], ['howHeading', 'How it works heading'], ['howSub', 'How it works subtitle'], ['benefitsHeading', 'Benefits heading'], ['pricingHeading', 'Pricing heading'], ['pricingSub', 'Pricing subtitle'],
    ['testimonialsHeading', 'Testimonials heading'], ['faqHeading', 'FAQ heading'], ['ctaHeading', 'Call-to-action heading'], ['ctaText', 'Call-to-action text'], ['ctaButton', 'Call-to-action button'], ['footerTagline', 'Footer tagline'], ['copyright', 'Copyright text']];
  var FONTS = ['Sora', 'Manrope', 'Inter', 'Poppins', 'DM Sans', 'Space Grotesk', 'Plus Jakarta Sans', 'Outfit', 'Lora', 'Merriweather'];
  var THEME_DEFAULT = { primary:'#635BFF', secondary:'#8B5CF6', accent:'#06B6D4', radius:16, buttonRadius:12, fontDisplay:'Sora', fontBody:'Manrope' };
  var FLAGS = [['showFeatures', 'Show Features section'], ['showHow', 'Show How it works section'], ['showBenefits', 'Show Benefits section'], ['showPricing', 'Show Pricing section'], ['showTestimonials', 'Show Testimonials section'], ['showFaq', 'Show FAQ section'], ['showCta', 'Show final call-to-action'], ['allowSignups', 'Allow new sign-ups'], ['enableRecording', 'Voice assistant: allow microphone recording'], ['enableUpload', 'Voice assistant: allow audio file upload']];

  function initAdmin(){
    var root = VP.$('#cms-root'); if(!root) return;
    if(VP.api.isMock){ root.innerHTML = '<div class="notice">' + VP.icon('alert') + '<span>The CMS stores content in the database, so it needs the backend. Start the project with <code>python main.py</code>, then open this page again.</span></div>'; return; }
    var all = null;
    var TABS = [['site', 'Site texts']].concat(Object.keys(COLL).map(function(k){ return [k, COLL[k].label]; })).concat([['products', 'Products'], ['theme', 'Theme & fonts'], ['ai', 'AI (Gemini)'], ['flags', 'Features on/off']]);
    root.innerHTML = '<div class="tabs" role="tablist" style="margin-bottom:var(--space-5)">' + TABS.map(function(t){ return '<button class="tab" data-tab="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '</div>' + TABS.map(function(t){ return '<div class="tab-panel" data-panel="' + t[0] + '"></div>'; }).join('');
    VP.initTabs(root);
    var panel = function(k){ return VP.$('[data-panel="' + k + '"]', root); };

    async function load(){ try{ all = await VP.api.cms.adminAll(); all.products = await VP.api.cms.catalog(); }catch(e){ VP.toast(e.message, 'error'); return; } renderAll(); }
    function renderAll(){ site(); Object.keys(COLL).forEach(list); products(); theme(); ai(); flags(); }

    /* generic form modal */
    function formModal(conf, data, onSave, title){
      var b = document.createElement('div'), d = data || {};
      b.innerHTML = '<form class="stack" novalidate>' + conf.fields.map(function(f){ var k = f[0], t = f[2] || 'text', v = d[k] == null ? '' : d[k];
        if(t === 'check') return '<label class="check"><input type="checkbox" name="' + k + '"' + (d[k] ? ' checked' : '') + '><span>' + f[1] + '</span></label>';
        var inp = t === 'textarea' ? '<textarea class="textarea" name="' + k + '" rows="3">' + esc(v) + '</textarea>' : t === 'icon' ? '<select class="select" name="' + k + '">' + ICONS.map(function(i){ return '<option' + (i === (v || ICONS[0]) ? ' selected' : '') + '>' + i + '</option>'; }).join('') + '</select>' : '<input class="input" name="' + k + '" type="' + (t === 'number' ? 'number' : 'text') + '"' + (t === 'number' ? ' min="0" step="any"' : '') + ' value="' + esc(v) + '">';
        return '<div class="field"><label>' + f[1] + '</label>' + inp + '</div>'; }).join('') + '</form>';
      VP.modal.open({ title:title, body:b, actions:[{ label:'Cancel', kind:'secondary' }, { label:'Save', onClick:async function(){ var fm = b.querySelector('form'), out = {}; conf.fields.forEach(function(f){ var el = fm.elements[f[0]], t = f[2]; out[f[0]] = t === 'check' ? el.checked : t === 'number' ? (parseFloat(el.value) || 0) : el.value.trim(); });
        try{ await onSave(out); }catch(e){ VP.toast(e.message, 'error'); return false; } } }] });
    }
    function rowHtml(name, sub, extra){ return '<div class="cms-item"><div class="grow"><b>' + esc(name) + '</b>' + (sub ? '<div class="muted xs cms-sub">' + esc(sub) + '</div>' : '') + '</div>' + extra + '</div>'; }
    var btn = function(a, id, ic, label){ return '<button class="btn btn-ghost btn-icon btn-sm" type="button" data-a="' + a + '" data-id="' + id + '" title="' + label + '" aria-label="' + label + '">' + VP.icon(ic) + '</button>'; };

    function site(){
      var s = all.site || {}, p = panel('site'); p.innerHTML = '<div class="card"><div class="card-head"><h3>Landing page texts</h3><button class="btn btn-primary btn-sm" id="save-site" type="button">Save texts</button></div><p class="muted small" style="margin-bottom:var(--space-4)">Leave a field empty to use the built-in default text.</p><div class="form-grid">' + SITE_FIELDS.map(function(f){ var full = f[2] === 'textarea'; return '<div class="field' + (full ? ' full' : '') + '"><label>' + f[1] + '</label>' + (full ? '<textarea class="textarea" data-k="' + f[0] + '" rows="3">' + esc(s[f[0]] || '') + '</textarea>' : '<input class="input" data-k="' + f[0] + '" value="' + esc(s[f[0]] || '') + '">') + '</div>'; }).join('') + '</div></div>';
      VP.$('#save-site', p).onclick = async function(){ var o = {}; VP.$$('[data-k]', p).forEach(function(i){ o[i.dataset.k] = i.value.trim(); }); try{ await VP.api.cms.saveSettings('site', o); all.site = o; VP.toast('Site texts saved. Reload the landing page to see them.', 'success'); }catch(e){ VP.toast(e.message, 'error'); } };
    }
    function list(k){
      var c = COLL[k], items = all.collections[k] || [], p = panel(k);
      p.innerHTML = '<div class="card"><div class="card-head"><div><h3>' + c.label + '</h3><div class="muted small">' + c.hint + '</div></div><button class="btn btn-primary btn-sm" data-a="add" type="button">' + VP.icon('plus') + 'Add</button></div><div class="cms-list">' + (items.length ? items.map(function(it, i){
        return rowHtml(c.name(it.data), c.sub ? c.sub(it.data) : '', '<label class="switch" title="Visible on the site"><input type="checkbox" data-a="vis" data-id="' + it.id + '"' + (it.visible ? ' checked' : '') + ' aria-label="Visible"><span></span></label>' + btn('up', it.id, 'chevron', 'Move up').replace('<svg', '<svg style="transform:rotate(-90deg)"') + btn('down', it.id, 'chevron', 'Move down').replace('<svg', '<svg style="transform:rotate(90deg)"') + btn('edit', it.id, 'edit', 'Edit') + btn('del', it.id, 'trash', 'Delete')); }).join('') : '<div class="empty">Nothing here yet. Add the first item.</div>') + '</div></div>';
      p.onclick = async function(e){
        var a = e.target.closest('[data-a]'); if(!a || a.dataset.a === 'vis') return; var id = +a.dataset.id, it = items.find(function(x){ return x.id === id; });
        try{
          if(a.dataset.a === 'add') return formModal(c, null, async function(d){ await VP.api.cms.addItem(k, { data:d, visible:true }); VP.toast('Added.', 'success'); await load(); }, 'Add — ' + c.label);
          if(a.dataset.a === 'edit') return formModal(c, it.data, async function(d){ await VP.api.cms.updateItem(id, { data:d }); VP.toast('Saved.', 'success'); await load(); }, 'Edit');
          if(a.dataset.a === 'del'){ if(!await VP.confirm('Delete “' + c.name(it.data) + '” from the site?')) return; await VP.api.cms.deleteItem(id); VP.toast('Deleted.', 'success'); return load(); }
          if(a.dataset.a === 'up' || a.dataset.a === 'down'){ var i = items.indexOf(it), j = a.dataset.a === 'up' ? i - 1 : i + 1; if(j < 0 || j >= items.length) return; var ids = items.map(function(x){ return x.id; }); ids.splice(j, 0, ids.splice(i, 1)[0]); await VP.api.cms.reorder(k, ids); return load(); }
        }catch(err){ VP.toast(err.message, 'error'); }
      };
      p.onchange = async function(e){ var a = e.target.closest('[data-a="vis"]'); if(!a) return; try{ await VP.api.cms.updateItem(+a.dataset.id, { visible:a.checked }); VP.toast(a.checked ? 'Visible on the site.' : 'Hidden from the site.', 'success', 1800); }catch(err){ VP.toast(err.message, 'error'); a.checked = !a.checked; } };
    }
    function products(){
      var p = panel('products'), items = all.products || [];
      p.innerHTML = '<div class="card"><div class="card-head"><div><h3>Products</h3><div class="muted small">' + PRODUCT.hint + '</div></div><button class="btn btn-primary btn-sm" data-a="add" type="button">' + VP.icon('plus') + 'Add product</button></div><div class="cms-list">' + items.map(function(it){ return rowHtml(it.name, it.category + ' · ' + VP.money(it.price) + ' per ' + it.unit + (it.active === false ? ' · hidden' : ''), btn('edit', it.id, 'edit', 'Edit') + btn('del', it.id, 'trash', 'Delete')); }).join('') + '</div></div>';
      p.onclick = async function(e){ var a = e.target.closest('[data-a]'); if(!a) return; var it = items.find(function(x){ return String(x.id) === a.dataset.id; });
        try{
          if(a.dataset.a === 'add') return formModal(PRODUCT, { active:true }, async function(d){ await VP.api.create('catalog', d); VP.toast('Product added.', 'success'); await load(); }, 'Add product');
          if(a.dataset.a === 'edit') return formModal(PRODUCT, it, async function(d){ await VP.api.update('catalog', it.id, d); VP.toast('Product saved.', 'success'); await load(); }, 'Edit product');
          if(a.dataset.a === 'del'){ if(!await VP.confirm('Delete product “' + it.name + '”? Past calculations keep their product name.')) return; await VP.api.remove('catalog', it.id); VP.toast('Product deleted.', 'success'); load(); }
        }catch(err){ VP.toast(err.message, 'error'); } };
    }
    function theme(){
      var t = Object.assign({}, THEME_DEFAULT, all.theme || {}), p = panel('theme'), fontSel = function(k){ return '<select class="select" data-t="' + k + '">' + FONTS.map(function(f){ return '<option' + (f === t[k] ? ' selected' : '') + '>' + f + '</option>'; }).join('') + '</select>'; };
      p.innerHTML = '<div class="card" style="max-width:760px"><div class="card-head"><h3>Theme &amp; fonts</h3><div class="row"><button class="btn btn-secondary btn-sm" id="theme-reset" type="button">Reset to default</button><button class="btn btn-primary btn-sm" id="theme-save" type="button">Save theme</button></div></div><p class="muted small" style="margin-bottom:var(--space-4)">Changes preview instantly on this page and apply to every page after saving.</p><div class="form-grid">' +
        [['primary', 'Primary colour'], ['secondary', 'Secondary colour'], ['accent', 'Accent colour']].map(function(c){ return '<div class="field"><label>' + c[1] + '</label><input class="input" type="color" data-t="' + c[0] + '" value="' + t[c[0]] + '" style="padding:.25rem;height:44px"></div>'; }).join('') +
        '<div class="field"><label>Card corner radius (px)</label><input class="input" type="number" min="0" max="40" data-t="radius" value="' + t.radius + '"></div><div class="field"><label>Button corner radius (px)</label><input class="input" type="number" min="0" max="40" data-t="buttonRadius" value="' + t.buttonRadius + '"></div><div class="field"><label>Heading font</label>' + fontSel('fontDisplay') + '</div><div class="field"><label>Body font</label>' + fontSel('fontBody') + '</div></div></div>';
      var read = function(){ var o = {}; VP.$$('[data-t]', p).forEach(function(i){ o[i.dataset.t] = i.type === 'number' ? (parseInt(i.value, 10) || 0) : i.value; }); return o; };
      var preview = function(o){ var r = document.documentElement.style; r.setProperty('--primary-color', o.primary); r.setProperty('--secondary-color', o.secondary); r.setProperty('--accent-color', o.accent); r.setProperty('--border-radius', o.radius + 'px'); r.setProperty('--button-radius', o.buttonRadius + 'px'); r.setProperty('--font-display', "'" + o.fontDisplay + "',system-ui,sans-serif"); r.setProperty('--font-body', "'" + o.fontBody + "',system-ui,sans-serif"); };
      p.oninput = p.onchange = function(){ preview(read()); };
      VP.$('#theme-save', p).onclick = async function(){ try{ await VP.api.cms.saveSettings('theme', read()); VP.toast('Theme saved. It now applies to every page.', 'success'); }catch(e){ VP.toast(e.message, 'error'); } };
      VP.$('#theme-reset', p).onclick = async function(){ try{ await VP.api.cms.saveSettings('theme', THEME_DEFAULT); VP.toast('Theme reset.', 'success'); setTimeout(function(){ location.reload(); }, 500); }catch(e){ VP.toast(e.message, 'error'); } };
    }
    function ai(){
      var a = all.ai || {}, p = panel('ai');
      p.innerHTML = '<div class="card" style="max-width:860px"><div class="card-head"><h3>AI settings (Google Gemini)</h3><div class="row"><button class="btn btn-secondary btn-sm" id="ai-test" type="button">' + VP.icon('zap') + 'Test connection</button><button class="btn btn-primary btn-sm" id="ai-save" type="button">Save AI settings</button></div></div><p class="muted small" style="margin-bottom:var(--space-4)">The API key is set on the server in the <code>.env</code> file (<code>GEMINI_API_KEY</code>) and is never sent to the browser.</p><div class="form-grid"><div class="field"><label>Model</label><input class="input" data-a="model" value="' + esc(a.model || '') + '" placeholder="gemini-2.5-flash"></div><div class="field"><label>Temperature (0–1)</label><input class="input" type="number" min="0" max="1" step="0.1" data-a="temperature" value="' + esc(a.temperature == null ? 0.1 : a.temperature) + '"></div><div class="field full"><label>Extraction prompt</label><textarea class="textarea" rows="14" data-a="prompt" style="font-family:var(--font-mono);font-size:.82rem">' + esc(a.prompt || '') + '</textarea><span class="field-hint">Use <code>{catalog}</code> where the list of product names should be inserted. The model must return JSON with <code>transcript</code>, <code>extracted</code> and <code>confidence</code>.</span></div></div></div>';
      VP.$('#ai-save', p).onclick = async function(){ var o = {}; VP.$$('[data-a]', p).forEach(function(i){ o[i.dataset.a] = i.type === 'number' ? parseFloat(i.value) : i.value; }); try{ await VP.api.cms.saveSettings('ai', o); VP.toast('AI settings saved.', 'success'); }catch(e){ VP.toast(e.message, 'error'); } };
      VP.$('#ai-test', p).onclick = async function(){ var b = this; b.classList.add('is-loading'); try{ var r = await VP.api.cms.testAI(); VP.toast('Gemini replied: ' + r.reply, 'success', 5000); }catch(e){ VP.toast(e.message, 'error', 8000); } finally{ b.classList.remove('is-loading'); } };
    }
    function flags(){
      var f = all.flags || {}, p = panel('flags');
      p.innerHTML = '<div class="card" style="max-width:720px"><div class="card-head"><h3>Features on / off</h3></div>' + FLAGS.map(function(x){ return '<div class="setting-row"><b>' + x[1] + '</b><label class="switch"><input type="checkbox" data-f="' + x[0] + '"' + (f[x[0]] !== false ? ' checked' : '') + ' aria-label="' + x[1] + '"><span></span></label></div>'; }).join('') + '</div>';
      p.onchange = async function(e){ var i = e.target.closest('[data-f]'); if(!i) return; var o = {}; VP.$$('[data-f]', p).forEach(function(x){ o[x.dataset.f] = x.checked; }); try{ await VP.api.cms.saveSettings('flags', o); all.flags = o; VP.toast('Saved.', 'success', 1500); }catch(err){ VP.toast(err.message, 'error'); i.checked = !i.checked; } };
    }
    load();
  }
  VP.app.ready(initAdmin);
  return { initLanding:initLanding, applySite:applySite };
})();

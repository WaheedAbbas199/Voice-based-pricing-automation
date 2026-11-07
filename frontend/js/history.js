/* Pricing history: search, filters, sort, view/edit/delete, CSV export. */
VP.app.ready(function(){
  var root = VP.$('#history-table'); if(!root) return; var rows = [], q = {}; var $ = VP.$;
  var cols = [
    { key:'id', label:'ID', render:function(r){ return '<span class="mono">' + r.id + '</span>'; } }, { key:'date', label:'Date', render:function(r){ return VP.date(r.date); } },
    { key:'customer', label:'Customer' }, { key:'product', label:'Product' }, { key:'qty', label:'Qty', render:function(r){ return VP.num(r.qty) + ' <span class="muted xs">' + VP.esc(r.unit || '') + '</span>'; } },
    { key:'total', label:'Total', render:function(r){ return '<b>' + VP.money(r.total) + '</b>'; } }, { key:'source', label:'Source', render:function(r){ return VP.badge(r.source === 'voice' ? 'Voice' : 'Manual', r.source === 'voice' ? 'info' : 'muted'); } },
    { key:'status', label:'Status', render:function(r){ return VP.badge(r.status, VP.statusKind(r.status)); } }
  ];
  var table = new VP.DataTable({ el:root, columns:cols, sortKey:'date', sortDir:-1, pageSize:8, actions:[
    { id:'view', icon:'eye', label:'View details' }, { id:'edit', icon:'edit', label:'Edit', when:function(r){ return r.status !== 'Completed' || VP.app.isAdmin(); } }, { id:'del', icon:'trash', label:'Delete' } ],
    onAction:function(a, r){ if(a === 'view') view(r); if(a === 'edit') edit(r); if(a === 'del') del(r); } });

  function filtered(){ return rows.filter(function(r){
    if(q.s && (r.id + r.customer + r.product + r.status).toLowerCase().indexOf(q.s) < 0) return false; if(q.from && r.date < q.from) return false; if(q.to && r.date > q.to) return false;
    if(q.customer && r.customer !== q.customer) return false; if(q.product && r.product !== q.product) return false; if(q.status && r.status !== q.status) return false; return true; }); }
  function apply(){ var f = filtered(); table.setRows(f); $('#count').textContent = f.length + ' of ' + rows.length + ' records'; }
  function opts(sel, key){ var u = Array.from(new Set(rows.map(function(r){ return r[key]; }))).sort(); sel.innerHTML = sel.options[0].outerHTML + u.map(function(v){ return '<option>' + VP.esc(v) + '</option>'; }).join(''); }
  async function load(){ root.innerHTML = '<div class="skeleton" style="height:320px"></div>'; try{ rows = await VP.api.history(); }catch(e){ root.innerHTML = '<div class="empty">' + VP.icon('alert') + '<p style="margin:auto">' + VP.esc(e.message) + '</p><button class="btn btn-secondary" id="retry">Try again</button></div>'; $('#retry').onclick = load; return; } opts($('#f-customer'), 'customer'); opts($('#f-product'), 'product'); apply(); }

  $('#f-search').addEventListener('input', VP.debounce(function(){ q.s = this.value.trim().toLowerCase(); apply(); }, 150));
  [['f-from', 'from'], ['f-to', 'to'], ['f-customer', 'customer'], ['f-product', 'product'], ['f-status', 'status']].forEach(function(p){ $('#' + p[0]).addEventListener('change', function(){ q[p[1]] = this.value; apply(); }); });
  $('#f-clear').addEventListener('click', function(){ q = {}; VP.$$('.toolbar input,.toolbar select').forEach(function(i){ i.value = ''; }); apply(); });
  $('#btn-export').addEventListener('click', function(){ var list = table.getRows(); if(!list.length) return VP.toast('Nothing to export.', 'warning'); VP.download('pricing-history-' + new Date().toISOString().slice(0, 10) + '.csv', VP.toCSV(list, [{ label:'ID', key:'id' }, { label:'Date', key:'date' }, { label:'Customer', key:'customer' }, { label:'Product', key:'product' }, { label:'Quantity', key:'qty' }, { label:'Unit price', key:'unitPrice' }, { label:'Discount %', key:'discount' }, { label:'Tax %', key:'tax' }, { label:'Delivery', key:'delivery' }, { label:'Total', key:'total' }, { label:'Status', key:'status' }, { label:'Source', key:'source' }]), 'text/csv;charset=utf-8'); VP.toast('Exported ' + list.length + ' records.', 'success'); });

  function view(r){ var t = VP.calcTotals(r); VP.modal.open({ title:'Calculation ' + r.id, body:'<dl class="kv"><dt>Date</dt><dd>' + VP.date(r.date) + '</dd><dt>Customer</dt><dd>' + VP.esc(r.customer) + '</dd><dt>Product</dt><dd>' + VP.esc(r.product) + '</dd><dt>Quantity</dt><dd>' + r.qty + ' ' + VP.esc(r.unit || '') + '</dd><dt>Unit price</dt><dd>' + VP.money(r.unitPrice) + '</dd><dt>Status</dt><dd>' + VP.badge(r.status, VP.statusKind(r.status)) + '</dd></dl><div class="divider"></div>' + [['Subtotal', t.subtotal], ['Discount (' + r.discount + '%)', -t.discountAmount], ['Tax (' + r.tax + '%)', t.taxAmount], ['Delivery', t.delivery], ['Additional', t.extra]].map(function(x){ return '<div class="summary-line"><span>' + x[0] + '</span><span>' + VP.money(x[1]) + '</span></div>'; }).join('') + '<div class="summary-total"><span>Final total</span><strong>' + VP.money(t.total) + '</strong></div>' }); }
  function edit(r){
    var b = document.createElement('div'); b.innerHTML = '<form class="form-grid" novalidate>' + [['qty', 'Quantity'], ['unitPrice', 'Unit price'], ['discount', 'Discount %'], ['tax', 'Tax %'], ['delivery', 'Delivery'], ['extra', 'Additional']].map(function(f){ return '<div class="field"><label>' + f[1] + '</label><input class="input" type="number" min="0" step="any" name="' + f[0] + '" value="' + (r[f[0]] || 0) + '"><span class="field-error"></span></div>'; }).join('') + '<div class="field full"><label>Status</label><select class="select" name="status">' + ['Completed', 'Pending', 'Failed'].map(function(s){ return '<option' + (s === r.status ? ' selected' : '') + '>' + s + '</option>'; }).join('') + '</select></div></form>';
    VP.modal.open({ title:'Edit ' + r.id, body:b, actions:[{ label:'Cancel', kind:'secondary' }, { label:'Save changes', onClick:async function(m, btn){ var fm = b.querySelector('form'), v = {}, bad = false; ['qty', 'unitPrice', 'discount', 'tax', 'delivery', 'extra'].forEach(function(n){ var i = fm.elements[n], x = parseFloat(i.value); v[n] = x; var ok = x >= 0 && (n !== 'qty' || x > 0) && ((n !== 'discount' && n !== 'tax') || x <= 100); i.closest('.field').classList.toggle('has-error', !ok); i.closest('.field').querySelector('.field-error').textContent = ok ? '' : 'Invalid value'; if(!ok) bad = true; }); if(bad) return false;
      v.status = fm.elements.status.value; v.total = VP.calcTotals(v).total; btn.classList.add('is-loading'); try{ await VP.api.update('history', r.id, v); VP.toast('Record updated.', 'success'); await load(); }catch(e){ VP.toast(e.message, 'error'); return false; } } }] });
  }
  async function del(r){ if(!await VP.confirm('Delete calculation ' + r.id + ' for ' + r.customer + '? This cannot be undone.')) return; try{ await VP.api.remove('history', r.id); VP.toast('Record deleted.', 'success'); load(); }catch(e){ VP.toast(e.message, 'error'); } }
  load();
});

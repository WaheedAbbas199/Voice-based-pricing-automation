/* Customer management: add/edit/delete, profile with history + quotations. */
VP.app.ready(function(){
  var root = VP.$('#customer-table'); if(!root) return; var rows = [], q = {}, $ = VP.$;
  var table = new VP.DataTable({ el:root, columns:[
    { key:'name', label:'Customer', render:function(r){ return '<div class="cell-user"><span class="avatar">' + VP.esc(VP.initials(r.name)) + '</span><div><b>' + VP.esc(r.name) + '</b><span class="muted xs">' + r.id + '</span></div></div>'; } },
    { key:'company', label:'Company' }, { key:'email', label:'Email', render:function(r){ return '<a href="mailto:' + VP.esc(r.email) + '">' + VP.esc(r.email) + '</a>'; } }, { key:'phone', label:'Phone' },
    { key:'quotes', label:'Quotes', sortValue:function(r){ return count(r); }, render:function(r){ return count(r); } },
    { key:'createdAt', label:'Added', render:function(r){ return VP.date(r.createdAt); } } ], sortKey:'createdAt', sortDir:-1, pageSize:8,
    actions:[{ id:'view', icon:'eye', label:'Profile' }, { id:'edit', icon:'edit', label:'Edit' }, { id:'del', icon:'trash', label:'Delete' }],
    onAction:function(a, r){ if(a === 'view') profile(r); if(a === 'edit') form(r); if(a === 'del') del(r); } });
  function count(c){ return VP.data.list('quotes').filter(function(x){ return x.customerId === c.id; }).length; }
  function apply(){ var f = rows.filter(function(r){ return (!q.s || (r.name + r.company + r.email + r.phone + r.address).toLowerCase().indexOf(q.s) >= 0) && (!q.company || r.company === q.company); }); table.setRows(f); $('#count').textContent = f.length + ' customers'; }
  async function load(){ root.innerHTML = '<div class="skeleton" style="height:320px"></div>'; try{ rows = await VP.api.getCustomers(); }catch(e){ root.innerHTML = '<div class="empty">' + VP.icon('alert') + '<p style="margin:auto">' + VP.esc(e.message) + '</p></div>'; return; } var sel = $('#f-company'); sel.innerHTML = '<option value="">All companies</option>' + Array.from(new Set(rows.map(function(r){ return r.company; }))).sort().map(function(c){ return '<option>' + VP.esc(c) + '</option>'; }).join(''); apply(); }
  $('#f-search').addEventListener('input', VP.debounce(function(){ q.s = this.value.trim().toLowerCase(); apply(); }, 150)); $('#f-company').addEventListener('change', function(){ q.company = this.value; apply(); });
  var pre = new URLSearchParams(location.search).get('q'); if(pre){ $('#f-search').value = pre; q.s = pre.toLowerCase(); }
  $('#btn-new').addEventListener('click', function(){ form(null); });

  function profile(c){
    var hist = VP.data.list('history').filter(function(h){ return h.customerId === c.id || h.customer === c.name; }), qs = VP.data.list('quotes').filter(function(x){ return x.customerId === c.id; });
    var list = function(a, f, empty){ return a.length ? a.slice(0, 6).map(f).join('') : '<p class="muted small">' + empty + '</p>'; };
    VP.modal.open({ title:'Customer profile', large:true, actions:[{ label:'Close', kind:'secondary' }, { label:'Edit customer', onClick:function(){ setTimeout(function(){ form(c); }, 250); } }], body:'<div class="row" style="margin-bottom:1rem"><span class="avatar" style="width:56px;height:56px;font-size:1.1rem">' + VP.esc(VP.initials(c.name)) + '</span><div><h3>' + VP.esc(c.name) + '</h3><span class="muted small">' + VP.esc(c.company) + '</span></div></div><dl class="kv"><dt>' + VP.icon('mail') + '</dt><dd>' + VP.esc(c.email) + '</dd><dt>' + VP.icon('phone') + '</dt><dd>' + VP.esc(c.phone || '—') + '</dd><dt>' + VP.icon('pin') + '</dt><dd>' + VP.esc(c.address || '—') + '</dd></dl><div class="divider"></div><div class="grid grid-2"><div><h3 style="margin-bottom:.6rem">Pricing history</h3>' + list(hist, function(h){ return '<div class="list-item"><div class="grow small"><b>' + VP.esc(h.product) + '</b><div class="muted xs">' + VP.date(h.date) + '</div></div><b>' + VP.money(h.total) + '</b></div>'; }, 'No calculations yet.') + '</div><div><h3 style="margin-bottom:.6rem">Previous quotations</h3>' + list(qs, function(x){ return '<div class="list-item"><div class="grow small"><b>' + x.id + '</b><div class="muted xs">' + VP.esc(x.product) + '</div></div>' + VP.badge(x.status, VP.statusKind(x.status)) + '</div>'; }, 'No quotations yet.') + '</div></div>' });
  }
  function form(c){
    var d = c || { name:'', company:'', email:'', phone:'', address:'' }, b = document.createElement('div'), f = function(n, l, t, full){ return '<div class="field' + (full ? ' full' : '') + '"><label>' + l + '</label><input class="input" name="' + n + '" type="' + (t || 'text') + '" value="' + VP.esc(d[n]) + '"><span class="field-error"></span></div>'; };
    b.innerHTML = '<form class="form-grid" novalidate>' + f('name', 'Full name') + f('company', 'Company') + f('email', 'Email', 'email') + f('phone', 'Phone', 'tel') + f('address', 'Address', 'text', 1) + '</form>';
    VP.modal.open({ title:c ? 'Edit customer' : 'Add customer', body:b, actions:[{ label:'Cancel', kind:'secondary' }, { label:c ? 'Save changes' : 'Add customer', onClick:async function(m, btn){
      var fm = b.querySelector('form'), v = {}, bad = {}; ['name', 'company', 'email', 'phone', 'address'].forEach(function(n){ v[n] = fm.elements[n].value.trim(); });
      if(v.name.length < 2) bad.name = 'Enter a name.'; if(!VP.valid.email(v.email)) bad.email = 'Enter a valid email.'; if(v.phone && !/^[+\d][\d\s()-]{6,}$/.test(v.phone)) bad.phone = 'Enter a valid phone number.';
      if(!bad.email && rows.some(function(r){ return r.email.toLowerCase() === v.email.toLowerCase() && (!c || r.id !== c.id); })) bad.email = 'A customer with this email already exists.';
      ['name', 'company', 'email', 'phone', 'address'].forEach(function(n){ var fl = fm.elements[n].closest('.field'); fl.classList.toggle('has-error', !!bad[n]); fl.querySelector('.field-error').textContent = bad[n] || ''; }); if(Object.keys(bad).length) return false;
      btn.classList.add('is-loading'); try{ if(c) await VP.api.update('customers', c.id, v); else await VP.api.createCustomer(v); VP.toast(c ? 'Customer updated.' : 'Customer added.', 'success'); load(); }catch(e){ VP.toast(e.message, 'error'); return false; } } }] });
  }
  async function del(c){ var n = count(c); if(!await VP.confirm('Delete ' + c.name + '?' + (n ? ' They have ' + n + ' quotation(s) that will keep their name but lose the link.' : ''))) return; try{ await VP.api.remove('customers', c.id); VP.toast('Customer deleted.', 'success'); load(); }catch(e){ VP.toast(e.message, 'error'); } }
  load();
});

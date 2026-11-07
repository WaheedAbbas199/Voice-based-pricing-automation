/* Pricing calculator page. Live preview uses VP.calcTotals; "Calculate price" goes through VP.api. */
VP.app.ready(function(){
  var form = VP.$('#calc-form'); if(!form) return; var S = VP.settings(), cfg = VP.data.list('sysconfig'), last = null, dirty = true;
  var f = function(n){ return form.elements[n]; }, el = function(id){ return document.getElementById(id); };
  var dl = VP.data.catalog().map(function(c){ return '<option value="' + VP.esc(c.name) + '">'; }).join(''); el('catalog-list').innerHTML = dl;
  f('customer').innerHTML = '<option value="">Walk-in / no customer</option>' + VP.data.list('customers').map(function(c){ return '<option value="' + VP.esc(c.name) + '" data-id="' + c.id + '">' + VP.esc(c.name + ' — ' + c.company) + '</option>'; }).join('');
  function defaults(){ form.reset(); f('tax').value = S.defaultTax; f('discount').value = S.defaultDiscount; f('delivery').value = S.defaultDelivery; f('extra').value = 0; f('quantity').value = 1; }
  function values(){ return { product:f('product').value.trim(), qty:parseFloat(f('quantity').value), unitPrice:parseFloat(f('unitPrice').value), discount:parseFloat(f('discount').value) || 0, tax:parseFloat(f('tax').value) || 0, delivery:parseFloat(f('delivery').value) || 0, extra:parseFloat(f('extra').value) || 0, customer:f('customer').value }; }
  function validate(){
    var v = values(), e = {};
    if(!v.product) e.product = 'Choose or type a product.'; if(!(v.qty > 0)) e.quantity = 'Quantity must be above 0.'; if(!(v.unitPrice >= 0)) e.unitPrice = 'Enter a unit price (0 or more).';
    if(v.discount < 0 || v.discount > cfg.maxDiscount) e.discount = 'Discount must be 0–' + cfg.maxDiscount + '%.'; if(v.tax < 0 || v.tax > 100) e.tax = 'Tax must be 0–100%.'; if(v.delivery < 0) e.delivery = 'Cannot be negative.'; if(v.extra < 0) e.extra = 'Cannot be negative.';
    ['product', 'quantity', 'unitPrice', 'discount', 'tax', 'delivery', 'extra'].forEach(function(n){ var fl = f(n).closest('.field'); fl.classList.toggle('has-error', !!e[n]); fl.querySelector('.field-error').textContent = e[n] || ''; });
    return { v:v, ok:!Object.keys(e).length };
  }
  function paint(t){ var map = { subtotal:t.subtotal, discount:-t.discountAmount, tax:t.taxAmount, delivery:t.delivery, extra:t.extra }; Object.keys(map).forEach(function(k){ el('sum-' + k).textContent = VP.money(map[k]); }); var tot = el('sum-total'); tot.textContent = VP.money(t.total); tot.classList.remove('bump'); void tot.offsetWidth; tot.classList.add('bump'); }
  function live(){ dirty = true; last = null; el('btn-save').disabled = el('btn-quote').disabled = true; el('calc-state').textContent = 'Live preview — press Calculate price to confirm'; var v = values(); paint(VP.calcTotals({ qty:isNaN(v.qty) ? 0 : v.qty, unitPrice:isNaN(v.unitPrice) ? 0 : v.unitPrice, discount:v.discount, tax:v.tax, delivery:v.delivery, extra:v.extra })); }
  form.addEventListener('input', VP.debounce(live, 80));
  f('product').addEventListener('change', function(){ var c = VP.data.catalog().find(function(x){ return x.name.toLowerCase() === f('product').value.trim().toLowerCase(); }); if(c){ f('unitPrice').value = c.price; el('unit-hint').textContent = 'per ' + c.unit + ' · from catalog'; live(); } else el('unit-hint').textContent = 'Custom item — enter the unit price'; });

  form.addEventListener('submit', async function(e){
    e.preventDefault(); var r = validate(); if(!r.ok) return VP.toast('Please fix the highlighted fields.', 'warning');
    var b = el('btn-calc'); b.classList.add('is-loading');
    try{ var t = await VP.api.calculate(r.v); last = { v:r.v, t:t }; dirty = false; paint(t); el('btn-save').disabled = el('btn-quote').disabled = false; el('calc-state').textContent = 'Calculated ' + new Date().toLocaleTimeString(); VP.toast('Price calculated.', 'success', 2200); }
    catch(x){ VP.toast(x.message, 'error'); } finally{ b.classList.remove('is-loading'); }
  });
  el('btn-reset').addEventListener('click', function(){ defaults(); validate(); live(); el('unit-hint').textContent = ''; VP.toast('Calculator reset.', 'info', 1800); });
  function rec(){ var c = VP.data.catalog().find(function(x){ return x.name === last.v.product; }) || {}; var opt = f('customer').selectedOptions[0]; return { product:last.v.product, category:c.category || 'Custom', unit:c.unit || 'unit', qty:last.v.qty, unitPrice:last.v.unitPrice, discount:last.v.discount, tax:last.v.tax, delivery:last.v.delivery, extra:last.v.extra, total:last.t.total, customer:last.v.customer || 'Walk-in', customerId:opt && opt.dataset.id || '', source:'manual', status:'Completed' }; }
  el('btn-save').addEventListener('click', async function(){ if(!last) return; var b = this; b.classList.add('is-loading'); try{ await VP.api.saveCalculation(rec()); VP.toast('Calculation saved to pricing history.', 'success'); }catch(x){ VP.toast(x.message, 'error'); } finally{ b.classList.remove('is-loading'); } });
  el('btn-quote').addEventListener('click', async function(){ if(!last) return; var b = this, r = rec(), c = VP.data.find('customers', r.customerId) || {}; b.classList.add('is-loading'); try{ var q = await VP.api.createQuotation(Object.assign({}, r, { company:c.company || '', notes:'' })); VP.toast('Quotation ' + q.id + ' created as Draft.', 'success'); }catch(x){ VP.toast(x.message, 'error'); } finally{ b.classList.remove('is-loading'); } });

  defaults(); var h = VP.store.get('vp_handoff', null); if(h){ VP.store.del('vp_handoff'); f('product').value = h.product || ''; f('quantity').value = h.qty || 1; f('unitPrice').value = h.unitPrice || ''; f('discount').value = h.discount || 0; if(h.customer) f('customer').value = (VP.data.list('customers').find(function(c){ return c.name === h.customer; }) || {}).name || ''; VP.toast('Values imported from Voice Assistant.', 'info'); }
  live();
});

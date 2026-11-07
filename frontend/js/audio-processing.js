/* Processing pipeline + editable extraction form.
   In demo mode (USE_MOCK) the transcript/extraction are SAMPLE data from api.js — the UI labels this clearly. */
window.VP = window.VP || {};
VP.AudioProcessing = (function(){
  var STAGES = ['Audio received', 'Transcribing audio', 'Understanding requirements', 'Extracting product details', 'Retrieving pricing', 'Calculating total', 'Saving results'];
  var FIELDS = [
    { k:'product', label:'Product name', type:'text', list:true }, { k:'category', label:'Product category', type:'text' },
    { k:'quantity', label:'Quantity', type:'number' }, { k:'unit', label:'Unit', type:'text' },
    { k:'unitPrice', label:'Unit price', type:'number', hint:'Filled from the catalog — editable' }, { k:'discount', label:'Discount %', type:'number' },
    { k:'location', label:'Location', type:'text' }, { k:'customer', label:'Customer name', type:'text' },
    { k:'requirements', label:'Customer requirements', type:'textarea', full:true }, { k:'delivery', label:'Delivery requirements', type:'text', full:true },
    { k:'notes', label:'Additional notes', type:'textarea', full:true }
  ];
  function renderStages(el){ el.innerHTML = STAGES.map(function(s, i){ return '<li class="stage" data-i="' + i + '"><span class="dot">' + VP.icon('check') + '</span><span>' + s + '</span><time></time></li>'; }).join(''); }
  function setStage(el, i, st, note){ var li = el.querySelector('[data-i="' + i + '"]'); if(!li) return; li.className = 'stage ' + st; var t = li.querySelector('time'); if(note) t.textContent = note; }
  function resetStages(el){ VP.$$('.stage', el).forEach(function(l){ l.className = 'stage'; l.querySelector('time').textContent = ''; }); }

  function confClass(v){ return v >= .85 ? '' : v >= .65 ? 'mid' : 'low'; }
  function renderForm(el, ex, conf){
    conf = conf || {};
    var catalog = VP.data.catalog(); var m = match(ex.product); if(m && !ex.unitPrice){ ex.unitPrice = m.price; }
    el.innerHTML = '<datalist id="catalog-list">' + catalog.map(function(c){ return '<option value="' + VP.esc(c.name) + '">'; }).join('') + '</datalist><div class="form-grid">' + FIELDS.map(function(f){
      var v = ex[f.k] == null ? '' : ex[f.k], c = conf[f.k], id = 'x_' + f.k;
      var inp = f.type === 'textarea' ? '<textarea class="textarea" id="' + id + '" name="' + f.k + '" rows="2">' + VP.esc(v) + '</textarea>' : '<input class="input" id="' + id + '" name="' + f.k + '" type="' + f.type + '" value="' + VP.esc(v) + '"' + (f.type === 'number' ? ' min="0" step="any"' : '') + (f.list ? ' list="catalog-list"' : '') + '>';
      return '<div class="ext-field field' + (f.full ? ' full' : '') + '"><div class="head"><label for="' + id + '">' + f.label + '</label>' + (c != null ? '<span class="conf ' + confClass(c) + '" style="--v:' + Math.round(c * 100) + '%" title="Model confidence">' + Math.round(c * 100) + '%<i></i></span>' : '') + '</div>' + inp + (f.hint ? '<span class="field-hint">' + f.hint + '</span>' : '') + '<span class="field-error"></span></div>';
    }).join('') + '</div>';
    var prod = el.querySelector('[name=product]'); prod.addEventListener('change', function(){ var mm = match(prod.value); if(mm){ el.querySelector('[name=unitPrice]').value = mm.price; el.querySelector('[name=unit]').value = mm.unit; el.querySelector('[name=category]').value = mm.category; } });
  }
  function match(name){ name = String(name || '').trim().toLowerCase(); if(!name) return null; var cat = VP.data.catalog(); return cat.find(function(c){ return c.name.toLowerCase() === name; }) || cat.find(function(c){ return c.name.toLowerCase().indexOf(name) >= 0 || name.indexOf(c.name.toLowerCase().split(' ')[0]) === 0; }) || null; }
  function readForm(el){
    var o = {}; FIELDS.forEach(function(f){ var i = el.querySelector('[name=' + f.k + ']'); o[f.k] = f.type === 'number' ? (i.value === '' ? '' : parseFloat(i.value)) : i.value.trim(); });
    var errs = {}; if(!o.product) errs.product = 'Product is required.'; if(!(o.quantity > 0)) errs.quantity = 'Enter a quantity above 0.'; if(o.unitPrice !== '' && !(o.unitPrice >= 0)) errs.unitPrice = 'Price cannot be negative.'; if(o.discount !== '' && (o.discount < 0 || o.discount > 100)) errs.discount = 'Use 0–100.';
    FIELDS.forEach(function(f){ var fl = el.querySelector('[name=' + f.k + ']').closest('.field'); fl.classList.toggle('has-error', !!errs[f.k]); fl.querySelector('.field-error').textContent = errs[f.k] || ''; });
    return { values:o, valid:!Object.keys(errs).length };
  }

  /* Phase 1: upload + transcribe + extract (stages 0–3) */
  async function analyse(blob, name, ui, duration){
    resetStages(ui.stages); setStage(ui.stages, 0, 'done', (blob.size / 1024).toFixed(0) + ' KB');
    setStage(ui.stages, 1, 'active'); var up = await VP.api.uploadAudio(blob, name, duration); var tr = await VP.api.transcribe(up.audioId, blob); setStage(ui.stages, 1, 'done');
    ui.onTranscript(tr); setStage(ui.stages, 2, 'active'); await VP.sleep(VP.api.isMock ? 600 : 0); setStage(ui.stages, 2, 'done');
    setStage(ui.stages, 3, 'active'); await VP.sleep(VP.api.isMock ? 600 : 0); setStage(ui.stages, 3, 'done');
    return tr;
  }
  /* Phase 2: pricing (stages 4–5) */
  async function price(values, ui){
    var s = VP.settings(); setStage(ui.stages, 4, 'active'); await VP.sleep(VP.api.isMock ? 450 : 0);
    var unitPrice = values.unitPrice, m = match(values.product); if(unitPrice === '' || unitPrice == null){ if(m) unitPrice = m.price; }
    if(unitPrice === '' || unitPrice == null){ setStage(ui.stages, 4, 'error', 'Not in catalog'); throw new Error('“' + values.product + '” is not in the price catalog. Enter a unit price manually.'); }
    setStage(ui.stages, 4, 'done'); setStage(ui.stages, 5, 'active');
    var payload = { qty:values.quantity, unitPrice:unitPrice, discount:values.discount || s.defaultDiscount, tax:s.defaultTax, delivery:s.defaultDelivery, extra:0 };
    var totals = await VP.api.calculate(payload); setStage(ui.stages, 5, 'done');
    return { payload:payload, totals:totals, unitPrice:unitPrice, catalogItem:m };
  }
  return { STAGES:STAGES, renderStages:renderStages, setStage:setStage, resetStages:resetStages, renderForm:renderForm, readForm:readForm, analyse:analyse, price:price, match:match };
})();

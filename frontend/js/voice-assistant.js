/* Voice Assistant page controller: recording UI, upload, preview, pipeline, result actions. */
VP.app.ready(function(){
  var $ = VP.$, rec$ = $('#recorder'); if(!rec$) return;
  var AP = VP.AudioProcessing, btn = { mic:$('#mic-btn'), pause:$('#btn-pause'), stop:$('#btn-stop'), redo:$('#btn-rerecord'), process:$('#btn-process') };
  var timer = $('#timer'), status = $('#rec-status'), err = $('#va-error'), prevBox = $('#preview'), audioEl = $('#audio-el'), meta = $('#audio-meta'), drop = $('#drop'), file = $('#file');
  var cur = null /* {blob,url,duration,name,source} */, busy = false, extracted = null, result = null;
  var wave = new VP.Waveform($('#wave'), { reduced:VP.reducedMotion() }); wave.start();
  var FL = VP.data.flags(); if(FL.enableUpload === false) drop.hidden = true; if(FL.enableRecording === false){ btn.mic.disabled = true; btn.redo.hidden = true; }
  AP.renderStages($('#stages')); if($('#demo-notice')) $('#demo-notice').hidden = !VP.api.isMock;
  var fmt = function(s){ s = Math.floor(s); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); };
  var showErr = function(m){ err.textContent = m || ''; err.classList.toggle('show', !!m); if(m) VP.toast(m, 'error', 6000); };

  var R = new VP.AudioRecorder({
    onTick:function(s){ timer.textContent = fmt(s); var max = VP.data.list('sysconfig').maxSeconds; if(s >= max){ R.stop(); VP.toast('Maximum recording length reached.', 'warning'); } },
    onAnalyser:function(a){ wave.attach(a); },
    onState:function(s){
      rec$.classList.toggle('is-recording', s === 'recording'); rec$.classList.toggle('is-paused', s === 'paused');
      status.querySelector('span').textContent = { idle:'Ready to record', recording:'Recording…', paused:'Paused', stopping:'Finishing…' }[s] || '';
      btn.pause.hidden = btn.stop.hidden = !(s === 'recording' || s === 'paused'); btn.pause.innerHTML = s === 'paused' ? VP.icon('play') + 'Resume' : VP.icon('pause') + 'Pause';
      btn.mic.setAttribute('aria-label', s === 'recording' || s === 'paused' ? 'Stop recording' : 'Start recording'); drop.hidden = !FL.enableUpload || (s !== 'idle' && s !== 'stopping');
    },
    onError:function(m, code){ showErr(m); timer.textContent = '00:00'; },
    onStop:function(r){ setAudio({ blob:r.blob, url:r.url, duration:r.duration, name:'recording.' + (r.mime.indexOf('mp4') > -1 ? 'm4a' : r.mime.indexOf('ogg') > -1 ? 'ogg' : 'webm'), source:'recording' }); }
  });
  if(!R.supported()){ btn.mic.disabled = true; showErr('Recording is not supported in this browser (or the page is not served over HTTPS/localhost). You can still upload an audio file.'); }
  if(!R.canPause()) btn.pause.remove();

  function clearAudio(){ if(cur && cur.url) URL.revokeObjectURL(cur.url); cur = null; extracted = null; result = null; prevBox.hidden = true; audioEl.removeAttribute('src'); audioEl.load(); timer.textContent = '00:00'; btn.process.disabled = true; ['#blk-transcript', '#blk-extract', '#blk-result'].forEach(function(s){ $(s).classList.remove('show'); }); AP.resetStages($('#stages')); showErr(''); }
  function setAudio(a){ clearAudio(); cur = a; audioEl.src = a.url; prevBox.hidden = false; meta.textContent = (a.source === 'upload' ? 'Uploaded file: ' : 'Recording: ') + a.name + ' · ' + fmt(a.duration || 0) + ' · ' + (a.blob.size / 1024).toFixed(0) + ' KB'; timer.textContent = fmt(a.duration || 0); btn.process.disabled = false; AP.setStage($('#stages'), 0, 'done', 'Ready'); }

  btn.mic.addEventListener('click', function(){ var s = R.getState(); if(s === 'idle'){ showErr(''); if(cur) clearAudio(); R.start(); } else if(s === 'recording' || s === 'paused') R.stop(); });
  btn.pause.addEventListener('click', function(){ R.getState() === 'paused' ? R.resume() : R.pause(); });
  btn.stop.addEventListener('click', function(){ R.stop(); });
  btn.redo.addEventListener('click', function(){ clearAudio(); R.start(); });

  /* upload */
  var EXT = /\.(mp3|wav|m4a|webm|ogg|oga|aac|flac|mp4)$/i;
  function handleFile(f){
    showErr(''); if(!f) return; var max = VP.data.list('sysconfig').maxAudioMB * 1048576;
    if(!(f.type.indexOf('audio/') === 0 || f.type === 'video/webm' || f.type === 'video/mp4' || EXT.test(f.name))) return showErr('Unsupported file type. Use MP3, WAV, M4A, OGG, AAC, FLAC or WebM.');
    if(f.size === 0) return showErr('That file is empty.'); if(f.size > max) return showErr('File is too large. The limit is ' + (max / 1048576) + ' MB.');
    var url = URL.createObjectURL(f), probe = new Audio(); probe.preload = 'metadata';
    probe.onloadedmetadata = function(){ setAudio({ blob:f, url:url, duration:isFinite(probe.duration) ? probe.duration : 0, name:f.name, source:'upload' }); };
    probe.onerror = function(){ URL.revokeObjectURL(url); showErr('This file could not be read as audio. It may be corrupted.'); }; probe.src = url;
  }
  drop.addEventListener('click', function(){ file.click(); }); drop.addEventListener('keydown', function(e){ if(e.key === 'Enter' || e.key === ' '){ e.preventDefault(); file.click(); } });
  file.addEventListener('change', function(){ handleFile(file.files[0]); file.value = ''; });
  ['dragenter', 'dragover'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.add('drag'); }); });
  ['dragleave', 'drop'].forEach(function(ev){ drop.addEventListener(ev, function(e){ e.preventDefault(); drop.classList.remove('drag'); }); });
  drop.addEventListener('drop', function(e){ handleFile(e.dataTransfer.files[0]); });

  function bumpStats(ok){ if(!VP.api.isMock) return; var a = VP.data.list('audio'); a.total++; ok ? a.success++ : a.failed++; VP.data.save('audio', a); }

  /* pipeline */
  btn.process.addEventListener('click', async function(){
    if(!cur || busy) return; busy = true; btn.process.classList.add('is-loading'); showErr(''); extracted = null; result = null; $('#blk-result').classList.remove('show');
    try{
      var tr = await AP.analyse(cur.blob, cur.name, { stages:$('#stages'), onTranscript:function(t){
        var box = $('#transcript'); box.classList.remove('empty-t'); box.textContent = t.transcript; $('#demo-flag').hidden = !t.mock; $('#blk-transcript').classList.add('show'); } }, cur.duration);
      extracted = tr.extracted; AP.renderForm($('#extract-form'), Object.assign({}, tr.extracted), tr.confidence); $('#blk-extract').classList.add('show'); $('#blk-extract').scrollIntoView({ behavior:VP.reducedMotion() ? 'auto' : 'smooth', block:'nearest' }); bumpStats(true);
    }catch(e){ showErr(e.message || 'Processing failed.'); bumpStats(false); }
    finally{ busy = false; btn.process.classList.remove('is-loading'); }
  });

  $('#btn-calc').addEventListener('click', async function(){
    var b = this, f = AP.readForm($('#extract-form')); if(!f.valid) return VP.toast('Fix the highlighted fields first.', 'warning');
    b.classList.add('is-loading'); try{
      result = await AP.price(f.values, { stages:$('#stages') }); result.values = f.values;
      var t = result.totals; $('#res-total').textContent = VP.money(t.total); $('#res-lines').innerHTML = [['Subtotal', t.subtotal], ['Discount', -t.discountAmount], ['Tax', t.taxAmount], ['Delivery', t.delivery]].map(function(r){ return '<div class="summary-line" style="border-color:rgba(255,255,255,.25)"><span>' + r[0] + '</span><span>' + VP.money(r[1]) + '</span></div>'; }).join('');
      $('#res-title').textContent = f.values.quantity + ' × ' + f.values.product + (f.values.customer ? ' for ' + f.values.customer : ''); $('#blk-result').classList.add('show'); $('#blk-result').scrollIntoView({ behavior:VP.reducedMotion() ? 'auto' : 'smooth', block:'nearest' });
    }catch(e){ showErr(e.message); }
    finally{ b.classList.remove('is-loading'); }
  });
  function record(){ var v = result.values, p = result.payload, t = result.totals; return { product:v.product, category:v.category || (result.catalogItem && result.catalogItem.category) || '', qty:v.quantity, unit:v.unit, unitPrice:p.unitPrice, discount:p.discount, tax:p.tax, delivery:p.delivery, extra:0, total:t.total, customer:v.customer || 'Walk-in', source:'voice', status:'Completed' }; }
  $('#btn-save').addEventListener('click', async function(){ if(!result) return; var b = this; b.classList.add('is-loading'); AP.setStage($('#stages'), 6, 'active');
    try{ await VP.api.saveCalculation(record()); AP.setStage($('#stages'), 6, 'done', VP.api.isMock ? 'Saved in this browser' : 'Saved'); VP.toast(VP.api.isMock ? 'Saved to pricing history (demo storage in this browser).' : 'Saved to pricing history.', 'success'); }
    catch(e){ AP.setStage($('#stages'), 6, 'error'); VP.toast(e.message, 'error'); } finally{ b.classList.remove('is-loading'); } });
  $('#btn-quote').addEventListener('click', async function(){ if(!result) return; var b = this, r = record(), c = VP.data.list('customers').find(function(x){ return x.name.toLowerCase() === r.customer.toLowerCase(); }); b.classList.add('is-loading');
    try{ var q = await VP.api.createQuotation(Object.assign({}, r, { customerId:c ? c.id : '', company:c ? c.company : '', notes:result.values.notes || '' })); VP.toast('Quotation ' + q.id + ' created as Draft.', 'success'); }catch(e){ VP.toast(e.message, 'error'); } finally{ b.classList.remove('is-loading'); } });
  $('#btn-open-calc').addEventListener('click', function(){ if(!result) return; VP.store.set('vp_handoff', { product:result.values.product, qty:result.values.quantity, unitPrice:result.payload.unitPrice, discount:result.payload.discount, customer:result.values.customer }); location.href = 'pricing-calculator.html'; });

  /* cleanup: release mic + object URLs when leaving */
  addEventListener('pagehide', function(){ R.destroy(); wave.destroy(); if(cur && cur.url) URL.revokeObjectURL(cur.url); });
  document.addEventListener('visibilitychange', function(){ if(document.hidden && R.getState() === 'recording') R.pause(); });
});

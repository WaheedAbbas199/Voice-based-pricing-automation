/* Real microphone recording via getUserMedia + MediaRecorder + AudioContext/AnalyserNode.
   Usage: var r = new VP.AudioRecorder({ onTick, onState, onError, onStop }); r.start(); r.pause(); r.resume(); r.stop(); r.destroy(); */
window.VP = window.VP || {};
VP.AudioRecorder = function(o){
  o = o || {}; var self = this, stream, rec, chunks = [], ctx, analyser, src, tick, seg = 0, accum = 0, state = 'idle', mime = '';
  var emit = function(n, a, b){ if(o[n]) o[n](a, b); };
  function setState(s){ state = s; emit('onState', s); }
  self.supported = function(){ return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia && window.MediaRecorder); };
  self.getState = function(){ return state; };
  self.getAnalyser = function(){ return analyser; };
  function elapsed(){ return accum + (state === 'recording' ? (performance.now() - seg) / 1000 : 0); }
  function pickMime(){ var c = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']; for(var i = 0; i < c.length; i++) if(MediaRecorder.isTypeSupported && MediaRecorder.isTypeSupported(c[i])) return c[i]; return ''; }
  function fail(code, msg){ cleanup(); setState('idle'); emit('onError', msg, code); }
  function cleanup(){
    clearInterval(tick); tick = null;
    if(stream){ stream.getTracks().forEach(function(t){ t.stop(); }); stream = null; }
    if(src){ try{ src.disconnect(); }catch(e){} src = null; }
    if(ctx && ctx.state !== 'closed'){ ctx.close().catch(function(){}); } ctx = null; analyser = null; emit('onAnalyser', null);
  }
  self.start = async function(){
    if(state !== 'idle') return;
    if(!self.supported()) return fail('unsupported', window.isSecureContext === false ? 'Microphone access needs HTTPS or localhost. Open this app from a secure address.' : 'This browser does not support audio recording. Upload an audio file instead.');
    try{ stream = await navigator.mediaDevices.getUserMedia({ audio:{ echoCancellation:true, noiseSuppression:true } }); }
    catch(e){
      var m = { NotAllowedError:['denied', 'Microphone permission was denied. Allow microphone access in your browser’s site settings and try again.'], PermissionDeniedError:['denied', 'Microphone permission was denied. Allow microphone access in your browser’s site settings.'], NotFoundError:['nomic', 'No microphone found. Connect one, or upload an audio file instead.'], DevicesNotFoundError:['nomic', 'No microphone found. Connect one, or upload an audio file instead.'], NotReadableError:['busy', 'The microphone is in use by another app. Close it and try again.'] }[e.name] || ['error', 'Could not start recording: ' + (e.message || e.name)];
      return fail(m[0], m[1]);
    }
    try{
      var AC = window.AudioContext || window.webkitAudioContext; ctx = new AC(); if(ctx.state === 'suspended') await ctx.resume();
      analyser = ctx.createAnalyser(); analyser.fftSize = 1024; analyser.smoothingTimeConstant = .82; src = ctx.createMediaStreamSource(stream); src.connect(analyser); emit('onAnalyser', analyser);
      mime = pickMime(); chunks = []; rec = new MediaRecorder(stream, mime ? { mimeType:mime } : undefined);
      rec.ondataavailable = function(e){ if(e.data && e.data.size) chunks.push(e.data); };
      rec.onerror = function(e){ fail('error', 'Recording error: ' + ((e.error && e.error.message) || 'unknown')); };
      rec.onstop = function(){
        var dur = elapsed(); var blob = new Blob(chunks, { type: rec.mimeType || mime || 'audio/webm' }); chunks = []; cleanup(); setState('idle');
        if(!blob.size || dur < .6) return emit('onError', 'The recording was empty or too short. Hold the mic closer and record at least a second.', 'empty');
        emit('onStop', { blob:blob, url:URL.createObjectURL(blob), duration:dur, mime:blob.type });
      };
      accum = 0; seg = performance.now(); rec.start(250); setState('recording');
      tick = setInterval(function(){ emit('onTick', elapsed()); }, 100);
    }catch(e){ fail('error', 'Could not start recording: ' + (e.message || e.name)); }
  };
  self.pause = function(){ if(rec && rec.state === 'recording' && typeof rec.pause === 'function'){ accum += (performance.now() - seg) / 1000; rec.pause(); setState('paused'); } };
  self.resume = function(){ if(rec && rec.state === 'paused'){ seg = performance.now(); rec.resume(); setState('recording'); } };
  self.canPause = function(){ return !!(window.MediaRecorder && MediaRecorder.prototype.pause); };
  self.stop = function(){ if(rec && rec.state !== 'inactive'){ if(state === 'recording') accum += (performance.now() - seg) / 1000; var s = state; state = 'stopping'; try{ rec.stop(); }catch(e){ fail('error', 'Could not stop recording.'); } } };
  self.destroy = function(){ if(rec && rec.state !== 'inactive'){ rec.onstop = null; try{ rec.stop(); }catch(e){} } cleanup(); chunks = []; state = 'idle'; };
};

/* Convert any browser-decodable audio blob to 16 kHz mono PCM WAV (accepted by Gemini and most speech APIs). */
VP.toWav = async function(blob){
  var AC = window.AudioContext || window.webkitAudioContext, OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext, ctx = new AC();
  var buf = await blob.arrayBuffer(); var dec = await new Promise(function(res, rej){ ctx.decodeAudioData(buf, res, rej); }); ctx.close();
  var rate = 16000, off = new OAC(1, Math.max(1, Math.ceil(dec.duration * rate)), rate), src = off.createBufferSource(); src.buffer = dec; src.connect(off.destination); src.start();
  var pcm = (await off.startRendering()).getChannelData(0), v = new DataView(new ArrayBuffer(44 + pcm.length * 2)), w = function(o, s){ for(var i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
  w(0, 'RIFF'); v.setUint32(4, 36 + pcm.length * 2, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, pcm.length * 2, true);
  for(var i = 0; i < pcm.length; i++){ var s = Math.max(-1, Math.min(1, pcm[i])); v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7FFF, true); }
  return new Blob([v], { type:'audio/wav' });
};

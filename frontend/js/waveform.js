/* Canvas waveform. Live mode reads a real AnalyserNode; idle mode is a quiet baseline (clearly not audio). */
window.VP = window.VP || {};
VP.Waveform = function(canvas, o){
  o = o || {}; var g = canvas.getContext('2d'), an = null, data = null, raf = 0, w = 0, h = 0, dpr = 1, prev = [], colors = {}, t0 = 0;
  function readColors(){ var cs = getComputedStyle(document.documentElement); colors.a = cs.getPropertyValue('--primary-color').trim() || '#635BFF'; colors.b = cs.getPropertyValue('--accent-color').trim() || '#06B6D4'; colors.idle = cs.getPropertyValue('--border-color').trim() || '#ccc'; }
  function size(){ var r = canvas.getBoundingClientRect(); dpr = window.devicePixelRatio || 1; w = r.width; h = r.height; canvas.width = Math.max(1, w * dpr); canvas.height = Math.max(1, h * dpr); g.setTransform(dpr, 0, 0, dpr, 0, 0); }
  function draw(ts){
    raf = requestAnimationFrame(draw); g.clearRect(0, 0, w, h); var gap = 4, bw = 4, n = Math.max(12, Math.floor(w / (bw + gap))), mid = h / 2, gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, colors.a); gr.addColorStop(1, colors.b);
    if(an){ an.getByteFrequencyData(data); }
    for(var i = 0; i < n; i++){
      var v;
      if(an){ var bin = Math.floor(Math.pow(i / n, 1.5) * data.length * .55); v = data[bin] / 255; v = Math.pow(v, 1.4); }
      else { v = o.reduced ? .04 : .04 + .03 * Math.sin(ts / 600 + i * .35); }
      prev[i] = (prev[i] || 0) * .6 + v * .4; var bh = Math.max(3, prev[i] * h * .9), x = i * (bw + gap) + (w - n * (bw + gap) + gap) / 2;
      g.fillStyle = an ? gr : colors.idle; g.beginPath(); (g.roundRect ? g.roundRect(x, mid - bh / 2, bw, bh, 3) : g.rect(x, mid - bh / 2, bw, bh)); g.fill();
    }
  }
  var ro = window.ResizeObserver ? new ResizeObserver(size) : null; if(ro) ro.observe(canvas); else addEventListener('resize', size);
  var onTheme = function(){ readColors(); }; document.addEventListener('themechange', onTheme);
  readColors(); size();
  return {
    attach:function(a){ an = a; data = a ? new Uint8Array(a.frequencyBinCount) : null; },
    start:function(){ if(!raf){ if(VP.reducedMotion() && !an){ draw(0); cancelAnimationFrame(raf); raf = 0; } raf = requestAnimationFrame(draw); } },
    stop:function(){ cancelAnimationFrame(raf); raf = 0; },
    destroy:function(){ cancelAnimationFrame(raf); raf = 0; if(ro) ro.disconnect(); document.removeEventListener('themechange', onTheme); }
  };
};

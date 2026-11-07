/* Dependency-free SVG charts. Colours come from CSS variables, so themes just work. */
window.VP = window.VP || {};
VP.charts = (function(){
  var NS = 'http://www.w3.org/2000/svg';
  function nice(max){ if(max <= 0) return 1; var p = Math.pow(10, Math.floor(Math.log10(max))), n = max / p; return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p; }
  function compact(v){ return v >= 1e6 ? (v / 1e6).toFixed(1) + 'M' : v >= 1e3 ? (v / 1e3).toFixed(v >= 1e4 ? 0 : 1) + 'k' : String(Math.round(v)); }
  function frame(w, h, label){ return '<svg class="chart" viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="' + VP.esc(label || 'chart') + '">'; }
  function grid(w, h, pad, max, fmt){ var s = ''; for(var i = 0; i <= 4; i++){ var y = pad.t + (h - pad.t - pad.b) * i / 4; s += '<line class="grid-line" x1="' + pad.l + '" x2="' + (w - pad.r) + '" y1="' + y + '" y2="' + y + '"/><text x="' + (pad.l - 8) + '" y="' + (y + 4) + '" text-anchor="end">' + (fmt || compact)(max * (4 - i) / 4) + '</text>'; } return s; }
  function smooth(p){ var d = 'M' + p[0][0] + ',' + p[0][1]; for(var i = 1; i < p.length; i++){ var cx = (p[i - 1][0] + p[i][0]) / 2; d += ' C' + cx + ',' + p[i - 1][1] + ' ' + cx + ',' + p[i][1] + ' ' + p[i][0] + ',' + p[i][1]; } return d; }

  /* bar(el, labels, [{name,values,color}]) */
  function bar(el, labels, series, o){
    o = o || {}; var w = 640, h = o.height || 260, pad = { l:44, r:10, t:12, b:28 }, max = nice(Math.max.apply(null, [1].concat.apply([], series.map(function(s){ return s.values; })))), iw = w - pad.l - pad.r, ih = h - pad.t - pad.b, gw = iw / labels.length, bw = Math.min(34, gw / (series.length + 1));
    var s = frame(w, h, o.label) + grid(w, h, pad, max, o.fmt);
    labels.forEach(function(l, i){
      series.forEach(function(se, j){ var v = se.values[i] || 0, bh = ih * v / max, x = pad.l + gw * i + (gw - bw * series.length) / 2 + bw * j; s += '<rect class="chart-bar" style="--i:' + i + '" x="' + x + '" y="' + (pad.t + ih - bh) + '" width="' + (bw - 3) + '" height="' + bh + '" rx="5" fill="' + (se.color || 'var(--chart-' + (j + 1) + ')') + '"><title>' + VP.esc(l + ': ' + (o.fmt || compact)(v)) + '</title></rect>'; });
      s += '<text x="' + (pad.l + gw * i + gw / 2) + '" y="' + (h - 8) + '" text-anchor="middle">' + VP.esc(l) + '</text>';
    });
    el.innerHTML = s + '</svg>' + legend(series);
  }
  /* line(el, labels, series) — smooth area/line */
  function line(el, labels, series, o){
    o = o || {}; var w = 640, h = o.height || 260, pad = { l:44, r:14, t:14, b:28 }, max = nice(Math.max.apply(null, [1].concat.apply([], series.map(function(s){ return s.values; })))), iw = w - pad.l - pad.r, ih = h - pad.t - pad.b;
    var s = frame(w, h, o.label) + '<defs>' + series.map(function(se, j){ return '<linearGradient id="ag' + j + el.id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + (se.color || 'var(--chart-' + (j + 1) + ')') + '" stop-opacity=".28"/><stop offset="1" stop-color="' + (se.color || 'var(--chart-' + (j + 1) + ')') + '" stop-opacity="0"/></linearGradient>'; }).join('') + '</defs>' + grid(w, h, pad, max, o.fmt);
    series.forEach(function(se, j){
      var pts = se.values.map(function(v, i){ return [pad.l + (labels.length > 1 ? iw * i / (labels.length - 1) : iw / 2), pad.t + ih - ih * v / max]; }), d = smooth(pts), c = se.color || 'var(--chart-' + (j + 1) + ')';
      s += '<path class="chart-area" d="' + d + ' L' + pts[pts.length - 1][0] + ',' + (pad.t + ih) + ' L' + pts[0][0] + ',' + (pad.t + ih) + 'Z" fill="url(#ag' + j + el.id + ')"/><path class="chart-line" style="--len:1400" d="' + d + '" fill="none" stroke="' + c + '" stroke-width="3" stroke-linecap="round"/>';
      pts.forEach(function(p, i){ s += '<circle class="chart-dot" style="--i:' + i + '" cx="' + p[0] + '" cy="' + p[1] + '" r="4.5" fill="var(--surface-color)" stroke="' + c + '" stroke-width="2.5"><title>' + VP.esc(labels[i] + ': ' + (o.fmt || compact)(se.values[i])) + '</title></circle>'; });
    });
    labels.forEach(function(l, i){ s += '<text x="' + (pad.l + (labels.length > 1 ? iw * i / (labels.length - 1) : iw / 2)) + '" y="' + (h - 8) + '" text-anchor="middle">' + VP.esc(l) + '</text>'; });
    el.innerHTML = s + '</svg>' + legend(series);
  }
  /* donut(el, [{label,value,color}], centerText) */
  function donut(el, items, center, o){
    var total = items.reduce(function(a, i){ return a + i.value; }, 0) || 1, r = 62, C = 2 * Math.PI * r, off = 0, s = frame(160, 160, (o && o.label) || 'donut chart') + '<circle cx="80" cy="80" r="' + r + '" fill="none" stroke="var(--surface-2)" stroke-width="20"/>';
    items.forEach(function(it, i){ var len = C * it.value / total; s += '<circle cx="80" cy="80" r="' + r + '" fill="none" stroke="' + (it.color || 'var(--chart-' + (i + 1) + ')') + '" stroke-width="20" stroke-dasharray="' + len + ' ' + (C - len) + '" stroke-dashoffset="' + (-off) + '" transform="rotate(-90 80 80)"><title>' + VP.esc(it.label + ': ' + it.value) + '</title></circle>'; off += len; });
    s += '<text class="donut-center" x="80" y="86" text-anchor="middle">' + VP.esc(center || '') + '</text></svg>';
    el.innerHTML = '<div class="donut-wrap"><div style="width:150px">' + s + '</div>' + legend(items.map(function(it, i){ return { name:it.label + ' (' + it.value + ')', color:it.color || 'var(--chart-' + (i + 1) + ')' }; })) + '</div>';
  }
  /* hbars(el, [{label,value}]) — ranked list */
  function hbars(el, items, fmt){
    var max = Math.max.apply(null, [1].concat(items.map(function(i){ return i.value; })));
    el.innerHTML = items.map(function(it, i){ return '<div class="hbar"><span>' + VP.esc(it.label) + '</span><div class="track"><i class="chart-hbar" style="--i:' + i + ';width:' + (it.value / max * 100) + '%"></i></div><b>' + (fmt ? fmt(it.value) : it.value) + '</b></div>'; }).join('');
  }
  function legend(series){ return series.length > 1 || series[0].color ? '<div class="legend">' + series.map(function(se, j){ return '<span><i style="background:' + (se.color || 'var(--chart-' + (j + 1) + ')') + '"></i>' + VP.esc(se.name || '') + '</span>'; }).join('') + '</div>' : ''; }
  return { bar:bar, line:line, donut:donut, hbars:hbars, compact:compact };
})();

/* Analytics: revenue, trends, products, customers, audio stats. */
VP.app.ready(function(){
  var $ = VP.$; if(!$('#an-kpis')) return; var range = 6, data;
  async function load(){ try{ data = await VP.api.getAnalytics(); }catch(e){ VP.toast(e.message, 'error'); return; } draw(); }
  function draw(){
    var h = data.history, qs = data.quotes, au = data.audio, months = VP.lastMonths(range), labels = months.map(function(m){ return m.label; });
    var done = h.filter(function(x){ return x.status === 'Completed'; }), revenue = done.reduce(function(a, x){ return a + x.total; }, 0), rate = au.total ? Math.round(au.success / au.total * 100) : 0;
    var K = [{ l:'Total calculations', v:h.length, i:'calc' }, { l:'Revenue (completed)', v:revenue, i:'dollar', m:true }, { l:'Average order value', v:done.length ? revenue / done.length : 0, i:'chart', m:true }, { l:'Audio success rate', v:rate, i:'mic', s:'%' }];
    $('#an-kpis').innerHTML = K.map(function(k, i){ return '<div class="card stat-card" data-reveal style="--i:' + i + '"><span class="stat-icon">' + VP.icon(k.i) + '</span><div class="stat-value" data-count="' + k.v + '"' + (k.m ? ' data-format="money"' : '') + (k.s ? ' data-suffix="' + k.s + '"' : '') + '>0</div><div class="stat-label">' + k.l + '</div></div>'; }).join(''); VP.app.reveal($('#an-kpis')); VP.app.counters($('#an-kpis'));
    var rev = months.map(function(m){ return done.filter(function(x){ return VP.monthKey(x.date) === m.key; }).reduce(function(a, x){ return a + x.total; }, 0); });
    VP.charts.line($('#c-rev'), labels, [{ name:'Revenue', values:rev }], { fmt:function(v){ return VP.money(v).replace(/\.00$/, ''); }, label:'Revenue overview' });
    VP.charts.bar($('#c-trend'), labels, [{ name:'Calculations', values:months.map(function(m){ return h.filter(function(x){ return VP.monthKey(x.date) === m.key; }).length; }) }, { name:'Quotations', values:months.map(function(m){ return qs.filter(function(x){ return VP.monthKey(x.date) === m.key; }).length; }) }], { label:'Monthly pricing trends' });
    var by = function(arr, key, val){ var m = {}; arr.forEach(function(x){ m[x[key]] = (m[x[key]] || 0) + val(x); }); return Object.keys(m).map(function(k){ return { label:k, value:m[k] }; }).sort(function(a, b){ return b.value - a.value; }).slice(0, 6); };
    VP.charts.hbars($('#c-products'), by(h, 'product', function(){ return 1; }), function(v){ return v + ' requests'; });
    VP.charts.hbars($('#c-customers'), by(done, 'customer', function(x){ return x.total; }), function(v){ return VP.money(v).replace(/\.00$/, ''); });
    VP.charts.donut($('#c-audio'), [{ label:'Processed', value:au.success, color:'var(--success-color)' }, { label:'Failed', value:au.failed, color:'var(--danger-color)' }], rate + '%', { label:'Audio processing success' });
    var c = { Completed:0, Pending:0, Failed:0 }; h.forEach(function(x){ c[x.status] = (c[x.status] || 0) + 1; });
    VP.charts.donut($('#c-req'), [{ label:'Successful', value:c.Completed, color:'var(--success-color)' }, { label:'Pending', value:c.Pending, color:'var(--warning-color)' }, { label:'Failed', value:c.Failed, color:'var(--danger-color)' }], String(h.length), { label:'Request outcomes' });
    $('#a-minutes').textContent = VP.num(au.minutes) + ' min'; $('#a-total').textContent = VP.num(au.total);
  }
  $('#range').addEventListener('change', function(){ range = +this.value; draw(); });
  load();
});

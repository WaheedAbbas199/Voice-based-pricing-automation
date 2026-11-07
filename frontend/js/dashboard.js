/* Dashboard: stats, charts, recent lists. */
VP.app.ready(function(){
  var $ = VP.$; if(!$('#stats')) return;
  var skel = VP.$$('.stat-value, #recent-calcs, #recent-quotes, #recent-customers, #activity');
  VP.app.skeleton(skel, 650, render);
  async function render(){
    var d = await VP.api.getAnalytics(), h = d.history, qs = d.quotes, cs = d.customers, au = d.audio;
    var now = Date.now(), inRange = function(date, a, b){ var t = new Date(date).getTime(); return t >= now - b * 864e5 && t < now - a * 864e5; };
    var trend = function(list, f){ var cur = list.filter(function(x){ return inRange(f(x), 0, 30); }).length, prev = list.filter(function(x){ return inRange(f(x), 30, 60); }).length; if(!prev) return ''; var p = Math.round((cur - prev) / prev * 100); return '<span class="trend ' + (p >= 0 ? 'up' : 'down') + '">' + (p >= 0 ? '▲ ' : '▼ ') + Math.abs(p) + '% vs prior 30 days</span>'; };
    var revenue = h.filter(function(x){ return x.status === 'Completed'; }).reduce(function(a, x){ return a + x.total; }, 0), pending = h.filter(function(x){ return x.status === 'Pending'; }).length + qs.filter(function(x){ return x.status === 'Pending'; }).length;
    var S = [
      { l:'Total audio requests', v:au.total, i:'mic' }, { l:'Total calculations', v:h.length, i:'calc', t:trend(h, function(x){ return x.date; }) }, { l:'Total quotations', v:qs.length, i:'file', t:trend(qs, function(x){ return x.date; }) },
      { l:'Total customers', v:cs.length, i:'users', t:trend(cs, function(x){ return x.createdAt; }) }, { l:'Total revenue', v:revenue, i:'dollar', money:true }, { l:'Pending requests', v:pending, i:'clock' } ];
    $('#stats').innerHTML = S.map(function(s, k){ return '<div class="card stat-card hover-lift" data-reveal style="--i:' + k + '"><div class="row between"><span class="stat-icon">' + VP.icon(s.i) + '</span>' + (s.t || '') + '</div><div class="stat-value" data-count="' + s.v + '"' + (s.money ? ' data-format="money"' : '') + '>0</div><div class="stat-label">' + s.l + '</div></div>'; }).join('');
    VP.app.reveal($('#stats')); VP.app.counters($('#stats'));

    var months = VP.lastMonths(6), rev = months.map(function(m){ return h.filter(function(x){ return x.status === 'Completed' && VP.monthKey(x.date) === m.key; }).reduce(function(a, x){ return a + x.total; }, 0); });
    VP.charts.line($('#chart-rev'), months.map(function(m){ return m.label; }), [{ name:'Revenue', values:rev }], { fmt:function(v){ return VP.money(v).replace(/\.00$/, ''); }, label:'Monthly revenue' });
    var done = h.filter(function(x){ return x.status === 'Completed'; }).length, pend = h.filter(function(x){ return x.status === 'Pending'; }).length, fail = h.filter(function(x){ return x.status === 'Failed'; }).length;
    VP.charts.donut($('#chart-status'), [{ label:'Completed', value:done, color:'var(--success-color)' }, { label:'Pending', value:pend, color:'var(--warning-color)' }, { label:'Failed', value:fail, color:'var(--danger-color)' }], String(h.length), { label:'Processing status' });
    $('#recent-calcs').innerHTML = h.slice().sort(function(a, b){ return b.date.localeCompare(a.date); }).slice(0, 5).map(function(x){ return '<div class="list-item"><div class="grow small"><b>' + VP.esc(x.product) + '</b><div class="muted xs">' + VP.esc(x.customer) + ' · ' + VP.date(x.date) + '</div></div><div class="right small"><b>' + VP.money(x.total) + '</b><div>' + VP.badge(x.status, VP.statusKind(x.status)) + '</div></div></div>'; }).join('');
    $('#recent-quotes').innerHTML = qs.slice(0, 4).map(function(x){ return '<div class="list-item"><span class="activity-dot">' + VP.icon('file') + '</span><div class="grow small"><b>' + x.id + ' · ' + VP.esc(x.customer) + '</b><div class="muted xs">' + VP.money(x.total) + '</div></div>' + VP.badge(x.status, VP.statusKind(x.status)) + '</div>'; }).join('');
    $('#recent-customers').innerHTML = cs.slice(0, 4).map(function(c){ return '<div class="list-item"><span class="avatar">' + VP.esc(VP.initials(c.name)) + '</span><div class="grow small"><b>' + VP.esc(c.name) + '</b><div class="muted xs">' + VP.esc(c.company) + '</div></div></div>'; }).join('');
    $('#activity').innerHTML = VP.data.list('activity').slice(0, 6).map(function(a){ return '<div class="list-item"><span class="activity-dot">' + VP.icon(a.icon) + '</span><div class="grow small">' + VP.esc(a.text) + '<div class="muted xs">' + VP.date(a.time) + '</div></div></div>'; }).join('');
  }
});

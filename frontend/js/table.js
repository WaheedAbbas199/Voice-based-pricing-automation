/* Reusable data table: sorting, pagination, row actions, empty state. Mobile layout handled in CSS via data-label. */
window.VP = window.VP || {};
VP.DataTable = function(o){
  var el = o.el, cols = o.columns, size = o.pageSize || 8, rows = [], sort = { key:o.sortKey || null, dir:o.sortDir || -1 }, page = 1;
  function val(r, c){ return c.sortValue ? c.sortValue(r) : r[c.key]; }
  function sorted(){ if(!sort.key) return rows.slice(); var c = cols.find(function(x){ return x.key === sort.key; }); if(!c) return rows.slice();
    return rows.slice().sort(function(a, b){ var x = val(a, c), y = val(b, c); if(typeof x === 'number' && typeof y === 'number') return (x - y) * sort.dir; return String(x == null ? '' : x).localeCompare(String(y == null ? '' : y), undefined, { numeric:true }) * sort.dir; }); }
  function render(){
    var all = sorted(), pages = Math.max(1, Math.ceil(all.length / size)); page = Math.min(page, pages); var view = all.slice((page - 1) * size, page * size);
    if(!all.length){ el.innerHTML = '<div class="empty">' + VP.icon('search') + '<p style="margin:auto">' + VP.esc(o.empty || 'No records match your filters.') + '</p></div>'; return; }
    var h = '<div class="table-wrap"><table class="dt"><thead><tr>' + cols.map(function(c){ var s = sort.key === c.key ? (sort.dir > 0 ? 'ascending' : 'descending') : 'none'; return '<th scope="col"' + (c.sortable !== false ? ' aria-sort="' + s + '"' : '') + '>' + (c.sortable !== false ? '<button type="button" data-sort="' + c.key + '">' + VP.esc(c.label) + VP.icon('sort', 'sort') + '</button>' : VP.esc(c.label)) + '</th>'; }).join('') + (o.actions ? '<th scope="col"><span class="sr-only">Actions</span></th>' : '') + '</tr></thead><tbody>';
    view.forEach(function(r, i){
      h += '<tr style="--i:' + i + '">' + cols.map(function(c){ return '<td data-label="' + VP.esc(c.label) + '">' + (c.render ? c.render(r) : VP.esc(r[c.key])) + '</td>'; }).join('');
      if(o.actions) h += '<td class="actions-cell"><div class="actions">' + o.actions.filter(function(a){ return !a.when || a.when(r); }).map(function(a){ return '<button type="button" class="btn btn-ghost btn-icon btn-sm" data-act="' + a.id + '" data-id="' + VP.esc(r.id) + '" title="' + VP.esc(a.label) + '" aria-label="' + VP.esc(a.label) + '">' + VP.icon(a.icon) + '</button>'; }).join('') + '</div></td>';
      h += '</tr>';
    });
    h += '</tbody></table></div><div class="dt-foot"><span>Showing ' + ((page - 1) * size + 1) + '–' + Math.min(page * size, all.length) + ' of ' + all.length + '</span><div class="pager">' + '<button type="button" data-page="' + (page - 1) + '" ' + (page === 1 ? 'disabled' : '') + ' aria-label="Previous page">‹</button>';
    for(var p = 1; p <= pages; p++) if(pages <= 7 || Math.abs(p - page) <= 1 || p === 1 || p === pages) h += '<button type="button" data-page="' + p + '" class="' + (p === page ? 'active' : '') + '"' + (p === page ? ' aria-current="page"' : '') + '>' + p + '</button>'; else if(Math.abs(p - page) === 2) h += '<button type="button" disabled>…</button>';
    el.innerHTML = h + '<button type="button" data-page="' + (page + 1) + '" ' + (page === pages ? 'disabled' : '') + ' aria-label="Next page">›</button></div></div>';
  }
  el.addEventListener('click', function(e){
    var s = e.target.closest('[data-sort]'), p = e.target.closest('[data-page]'), a = e.target.closest('[data-act]');
    if(s){ var k = s.dataset.sort; sort = { key:k, dir: sort.key === k ? -sort.dir : 1 }; render(); }
    else if(p && !p.disabled){ page = +p.dataset.page; render(); }
    else if(a && o.onAction){ o.onAction(a.dataset.act, rows.find(function(r){ return String(r.id) === a.dataset.id; })); }
  });
  render();
  return { setRows:function(r){ rows = r; page = 1; render(); }, refresh:render, getRows:function(){ return sorted(); } };
};

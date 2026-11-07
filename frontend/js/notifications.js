/* Toasts, modals, confirm dialogs. */
window.VP = window.VP || {};
(function(){
  function root(){ var r = document.getElementById('toast-root'); if(!r){ r = document.createElement('div'); r.id = 'toast-root'; r.setAttribute('aria-live', 'polite'); document.body.appendChild(r); } return r; }
  VP.toast = function(msg, type, ms){
    type = type || 'info'; var t = document.createElement('div'); t.className = 'toast ' + type; t.setAttribute('role', type === 'error' ? 'alert' : 'status');
    t.innerHTML = VP.icon({ success:'check', error:'alert', warning:'alert', info:'sparkle' }[type] || 'sparkle') + '<div>' + VP.esc(msg) + '</div>';
    root().appendChild(t);
    var close = function(){ t.classList.add('out'); setTimeout(function(){ t.remove(); }, 300); };
    setTimeout(close, ms || 4000); t.addEventListener('click', close);
  };

  var openModals = [];
  VP.modal = {
    open: function(o){
      var last = document.activeElement, b = document.createElement('div'); b.className = 'modal-backdrop';
      b.innerHTML = '<div class="modal ' + (o.large ? 'modal-lg' : '') + '" role="dialog" aria-modal="true" aria-label="' + VP.esc(o.title) + '"><div class="modal-head"><h3>' + VP.esc(o.title) + '</h3><button class="btn btn-ghost btn-icon btn-sm" data-close aria-label="Close">' + VP.icon('x') + '</button></div><div class="modal-body"></div>' + (o.footer === false ? '' : '<div class="modal-foot"></div>') + '</div>';
      var body = b.querySelector('.modal-body'); if(typeof o.body === 'string') body.innerHTML = o.body; else if(o.body) body.appendChild(o.body);
      var foot = b.querySelector('.modal-foot');
      if(foot) (o.actions || [{ label:'Close', kind:'secondary', close:true }]).forEach(function(a){
        var btn = document.createElement('button'); btn.type = 'button'; btn.className = 'btn btn-' + (a.kind || 'primary'); btn.textContent = a.label;
        btn.addEventListener('click', async function(){ var r = a.onClick ? await a.onClick(b, btn) : undefined; if(btn.isConnected) btn.classList.remove('is-loading'); if(a.close !== false && r !== false) close(); }); foot.appendChild(btn);
      });
      function close(){ if(b.dataset.closed) return; b.dataset.closed = 1; b.classList.add('closing'); openModals = openModals.filter(function(m){ return m !== b; }); setTimeout(function(){ b.remove(); if(last && last.focus) last.focus(); if(o.onClose) o.onClose(); }, 200); }
      b.addEventListener('click', function(e){ if(e.target === b || e.target.closest('[data-close]')) close(); });
      b._close = close; openModals.push(b); document.body.appendChild(b);
      var f = b.querySelector('input,select,textarea,.modal-foot .btn-primary,button'); if(f) setTimeout(function(){ f.focus(); }, 60);
      return b;
    },
    closeAll: function(){ openModals.slice().forEach(function(m){ m._close(); }); }
  };
  document.addEventListener('keydown', function(e){ if(e.key === 'Escape' && openModals.length) openModals[openModals.length - 1]._close(); });

  VP.confirm = function(message, o){
    o = o || {};
    return new Promise(function(res){
      var done = false, fin = function(v){ if(!done){ done = true; res(v); } };
      VP.modal.open({ title: o.title || 'Are you sure?', body: '<p>' + VP.esc(message) + '</p>', onClose: function(){ fin(false); },
        actions: [{ label:'Cancel', kind:'secondary', onClick: function(){ fin(false); } }, { label: o.confirm || 'Delete', kind: o.kind || 'danger', onClick: function(){ fin(true); } }] });
    });
  };
})();

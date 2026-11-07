/* Centralised API service. UI code never calls fetch() directly — it calls VP.api.*.
   USE_MOCK=true  -> simulated responses from VP.data (localStorage, clearly flagged mock:true).
   USE_MOCK=false -> real HTTP calls to the FastAPI backend (cookie session, CSRF header). */
window.VP = window.VP || {};
VP.api = (function(){
  var env = window.__ENV__ || {}, BASE = (env.API_BASE_URL || '/api').replace(/\/$/, ''), MOCK = env.USE_MOCK !== false;
  var RES = { quotes:'quotations', history:'pricing/history', customers:'customers', users:'admin/users', catalog:'admin/catalog', errors:'admin/errors' };

  async function http(method, path, body, isForm){
    var opts = { method:method, credentials:'same-origin', headers:{ Accept:'application/json', 'X-Requested-With':'VoxPrice' } };
    if(body !== undefined && body !== null){ if(isForm) opts.body = body; else { opts.headers['Content-Type'] = 'application/json'; opts.body = JSON.stringify(body); } }
    var res; try{ res = await fetch(BASE + path, opts); }catch(e){ throw new Error('Cannot reach the server. Is `python main.py` running?'); }
    var data = null; try{ data = await res.json(); }catch(e){}
    if(!res.ok){
      var msg = data && (data.detail || data.message || data.error); if(Array.isArray(msg)) msg = msg.map(function(m){ return m.msg; }).join(', ');
      var err = new Error(msg || 'Request failed (' + res.status + ')'); err.status = res.status;
      if(res.status === 401 && document.body && document.body.classList.contains('app') && path.indexOf('/auth/') !== 0){ VP.store.del('vp_session'); location.replace(VP.root() + 'login.html'); }
      throw err;
    }
    return data;
  }
  var lag = function(){ return VP.sleep(350 + Math.random() * 450); };

  var samples = [
    { t:'I need two hundred fifty bags of Portland cement for Ali Hassan from BuildRight Traders, delivered to Lahore. It is urgent, we need it by Friday, and he asked for a ten percent discount.',
      x:{ product:'Portland Cement 50kg', category:'Construction', quantity:250, unit:'bag', location:'Lahore', customer:'Ali Hassan', requirements:'Bulk order, 10% discount requested', delivery:'Urgent — needed by Friday', notes:'Company: BuildRight Traders', discount:10 }, c:{ product:.96, category:.91, quantity:.98, unit:.9, location:.94, customer:.97, requirements:.78, delivery:.83, notes:.7 } },
    { t:'Please quote twelve solar panels, five fifty watt, for Sara Khan at Greenfield Farms in Multan. The site is rural so delivery needs a truck.',
      x:{ product:'Solar Panel 550W', category:'Energy', quantity:12, unit:'piece', location:'Multan', customer:'Sara Khan', requirements:'550W panels', delivery:'Truck delivery to rural site', notes:'Company: Greenfield Farms', discount:5 }, c:{ product:.93, category:.88, quantity:.97, unit:.85, location:.92, customer:.95, requirements:.74, delivery:.8, notes:.68 } },
    { t:'Add forty ergonomic office chairs for Northwind Offices in Karachi, delivery within two weeks, and offer net thirty payment terms.',
      x:{ product:'Office Chair Ergonomic', category:'Furniture', quantity:40, unit:'piece', location:'Karachi', customer:'Omar Farooq', requirements:'Ergonomic model', delivery:'Within two weeks', notes:'Net 30 payment terms; company: Northwind Offices', discount:0 }, c:{ product:.95, category:.9, quantity:.96, unit:.88, location:.93, customer:.55, requirements:.7, delivery:.85, notes:.8 } }
  ];

  var mockApi = {
    uploadAudio: async function(blob, name){ await lag(); return { audioId:VP.uid('aud'), size:blob.size, name:name, mock:true }; },
    transcribe: async function(audioId, blob){ await lag(); var s = samples[(blob && blob.size ? blob.size : 0) % samples.length]; return { transcript:s.t, extracted:s.x, confidence:s.c, mock:true }; },
    calculate: async function(p){ await VP.sleep(250); return VP.calcTotals(p); },
    history: async function(){ await VP.sleep(200); return VP.data.list('history'); },
    saveCalculation: async function(rec){ await VP.sleep(250); var item = VP.data.add('history', Object.assign({ date:new Date().toISOString().slice(0, 10), status:'Completed' }, rec), 'H-'); VP.data.log('Price calculated: ' + rec.product + ' × ' + rec.qty, 'calc'); return item; },
    createQuotation: async function(q){ await VP.sleep(300); var item = VP.data.add('quotes', Object.assign({ date:new Date().toISOString().slice(0, 10), validUntil:VP.daysAgo(-14), status:'Draft' }, q), 'Q-'); VP.data.log('Quotation ' + item.id + ' created for ' + q.customer, 'file'); return item; },
    getQuotations: async function(){ await VP.sleep(200); return VP.data.list('quotes'); },
    createCustomer: async function(c){ await VP.sleep(250); var item = VP.data.add('customers', Object.assign({ createdAt:new Date().toISOString().slice(0, 10) }, c), 'C-'); VP.data.log('New customer added: ' + c.name, 'users'); return item; },
    getCustomers: async function(){ await VP.sleep(200); return VP.data.list('customers'); },
    update: async function(res, id, patch){ await VP.sleep(200); return VP.data.update(res, id, patch); },
    remove: async function(res, id){ await VP.sleep(200); VP.data.remove(res, id); return { ok:true }; },
    create: async function(res, item){ await VP.sleep(200); return VP.data.add(res, item, { users:'U-', catalog:'p' }[res] || 'X-'); },
    saveConfig: async function(cfg){ await VP.sleep(200); return VP.data.save('sysconfig', cfg); },
    getAnalytics: async function(){ await VP.sleep(250); return { history:VP.data.list('history'), quotes:VP.data.list('quotes'), customers:VP.data.list('customers'), audio:VP.data.list('audio') }; },
    bootstrap: async function(){ return {}; },
    cms: null
  };

  /* every successful write refreshes the VP.data cache so all pages see server truth */
  async function mut(p){ var r = await p; try{ await VP.data.sync(); }catch(e){} return r; }
  var real = {
    uploadAudio: async function(blob, name, duration){
      var b = blob, n = name || 'recording.webm';
      if(/webm|mp4|m4a/i.test((blob.type || '') + n) && VP.toWav){ try{ b = await VP.toWav(blob); n = n.replace(/\.[^.]+$/, '') + '.wav'; }catch(e){ /* upload original; server will try it as-is */ } }
      var f = new FormData(); f.append('audio', b, n); f.append('duration', String(Math.round(duration || 0))); return http('POST', '/audio/upload', f, true);
    },
    transcribe: function(audioId){ return mut(http('POST', '/audio/transcribe', { audioId:audioId })); },
    calculate: function(p){ return http('POST', '/pricing/calculate', p); },
    history: async function(){ await VP.data.sync(); return VP.data.list('history'); },
    saveCalculation: function(r){ return mut(http('POST', '/pricing/history', r)); },
    createQuotation: function(q){ return mut(http('POST', '/quotations', q)); },
    getQuotations: async function(){ await VP.data.sync(); return VP.data.list('quotes'); },
    createCustomer: function(c){ return mut(http('POST', '/customers', c)); },
    getCustomers: async function(){ await VP.data.sync(); return VP.data.list('customers'); },
    update: function(res, id, patch){ return mut(http('PUT', '/' + RES[res] + '/' + encodeURIComponent(id), patch)); },
    remove: function(res, id){ return mut(http('DELETE', '/' + RES[res] + '/' + encodeURIComponent(id))); },
    create: function(res, item){ return mut(http('POST', '/' + RES[res], item)); },
    saveConfig: function(cfg){ return mut(http('PUT', '/admin/config', cfg)); },
    getAnalytics: function(){ return http('GET', '/analytics'); },
    bootstrap: function(){ return http('GET', '/bootstrap'); },
    auth: {
      login: function(b){ return http('POST', '/auth/login', b); }, register: function(b){ return http('POST', '/auth/register', b); },
      logout: function(){ return http('POST', '/auth/logout', {}); }, me: function(){ return http('GET', '/auth/me'); },
      forgot: function(b){ return http('POST', '/auth/forgot', b); }, reset: function(b){ return http('POST', '/auth/reset', b); },
      changePassword: function(b){ return http('POST', '/auth/change-password', b); }, updateProfile: function(b){ return http('PUT', '/auth/profile', b); }
    },
    cms: {
      site: function(){ return http('GET', '/cms/site'); }, adminAll: function(){ return http('GET', '/cms/admin/all'); },
      saveSettings: function(key, val){ return http('PUT', '/cms/admin/settings/' + key, val); },
      addItem: function(coll, data){ return http('POST', '/cms/admin/items/' + coll, data); }, updateItem: function(id, data){ return http('PUT', '/cms/admin/items/' + id, data); },
      deleteItem: function(id){ return http('DELETE', '/cms/admin/items/' + id); }, reorder: function(coll, ids){ return http('POST', '/cms/admin/items/' + coll + '/reorder', { ids:ids }); },
      catalog: function(){ return http('GET', '/admin/catalog'); },
      testAI: function(){ return http('POST', '/cms/admin/ai/test', {}); }
    }
  };
  var api = MOCK ? mockApi : real; api.isMock = MOCK; api.base = BASE; return api;
})();

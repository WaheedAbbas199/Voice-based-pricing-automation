/* Demo data layer (localStorage). Real data comes from the backend once USE_MOCK=false. */
window.VP = window.VP || {};
VP.data = (function(){
  var REAL = !!(window.__ENV__ && window.__ENV__.USE_MOCK === false), cache = {};
  var catalog = [
    { id:'p1', name:'Portland Cement 50kg', category:'Construction', unit:'bag', price:9.5 },
    { id:'p2', name:'Steel Rebar 12mm', category:'Construction', unit:'ton', price:720 },
    { id:'p3', name:'Red Clay Bricks', category:'Construction', unit:'1000 pcs', price:210 },
    { id:'p4', name:'Industrial LED Panel 60W', category:'Electrical', unit:'piece', price:38 },
    { id:'p5', name:'Solar Panel 550W', category:'Energy', unit:'piece', price:185 },
    { id:'p6', name:'Office Chair Ergonomic', category:'Furniture', unit:'piece', price:145 },
    { id:'p7', name:'A4 Copy Paper', category:'Stationery', unit:'ream', price:5.2 },
    { id:'p8', name:'Cooking Oil 5L', category:'Food', unit:'carton', price:31 },
    { id:'p9', name:'Cotton Fabric Roll', category:'Textile', unit:'roll', price:64 },
    { id:'p10', name:'Business Laptop 15"', category:'Electronics', unit:'piece', price:820 }
  ];
  function rng(seed){ var s = seed; return function(){ s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }
  var names = [['Ali Hassan','BuildRight Traders','Lahore'],['Sara Khan','Greenfield Farms','Multan'],['Omar Farooq','Northwind Offices','Karachi'],['Hina Malik','Zain Constructions','Islamabad'],['Bilal Ahmed','Crescent Textiles','Faisalabad'],['Ayesha Noor','Sunrise Retail','Lahore'],['Usman Tariq','Apex Electronics','Rawalpindi'],['Maria Siddiqui','Indus Foods','Karachi']];
  var seeds = {
    catalog: function(){ return catalog; },
    customers: function(){ return names.map(function(n, i){ return { id:'C-' + (101 + i), name:n[0], company:n[1], email:n[0].toLowerCase().replace(' ', '.') + '@' + n[1].toLowerCase().replace(/[^a-z]/g, '') + '.example', phone:'+92 300 ' + (1000000 + i * 137913).toString().slice(0, 7), address:'Plot ' + (12 + i * 7) + ', Main Boulevard, ' + n[2], createdAt:VP.daysAgo(120 - i * 13) }; }); },
    history: function(){
      var r = rng(42), cs = seeds.customers(), st = ['Completed','Completed','Completed','Pending','Failed'], out = [];
      for(var i = 0; i < 26; i++){
        var p = catalog[Math.floor(r() * catalog.length)], c = cs[Math.floor(r() * cs.length)], qty = Math.max(1, Math.round(r() * (p.price < 20 ? 300 : p.price < 200 ? 60 : 8)));
        var o = { qty:qty, unitPrice:p.price, discount:[0,0,5,10][Math.floor(r() * 4)], tax:8, delivery:Math.round(r() * 8) * 10, extra:0 };
        out.push(Object.assign({ id:'H-' + (1001 + i), date:VP.daysAgo(Math.floor(i * 6.4 + r() * 3)), customer:c.name, customerId:c.id, product:p.name, category:p.category, unit:p.unit, status:st[Math.floor(r() * st.length)], source:r() > .45 ? 'voice' : 'manual' }, o, { total:VP.calcTotals(o).total }));
      }
      return out;
    },
    quotes: function(){
      var r = rng(7), cs = seeds.customers(), st = ['Draft','Pending','Sent','Approved','Rejected','Approved','Sent','Pending'], out = [];
      for(var i = 0; i < 10; i++){
        var p = catalog[Math.floor(r() * catalog.length)], c = cs[i % cs.length], qty = Math.max(1, Math.round(r() * (p.price < 20 ? 200 : 40)));
        var o = { qty:qty, unitPrice:p.price, discount:[0,5,10][i % 3], tax:8, delivery:30 + i * 5, extra:0 };
        out.push(Object.assign({ id:'Q-' + (2001 + i), customerId:c.id, customer:c.name, company:c.company, product:p.name, unit:p.unit, date:VP.daysAgo(i * 5 + 1), validUntil:VP.daysAgo(i * 5 - 14), status:st[i % st.length], notes:'' }, o, { total:VP.calcTotals(o).total }));
      }
      return out;
    },
    activity: function(){ return [
      { id:1, icon:'mic', text:'Voice request processed for Ali Hassan', time:VP.daysAgo(0) },
      { id:2, icon:'file', text:'Quotation Q-2003 sent to Omar Farooq', time:VP.daysAgo(0) },
      { id:3, icon:'calc', text:'Price calculated: Solar Panel 550W × 12', time:VP.daysAgo(1) },
      { id:4, icon:'users', text:'New customer added: Maria Siddiqui', time:VP.daysAgo(2) },
      { id:5, icon:'alert', text:'Audio upload failed: unsupported format', time:VP.daysAgo(3) },
      { id:6, icon:'check', text:'Quotation Q-2004 approved', time:VP.daysAgo(4) }]; },
    users: function(){ var roles = ['Admin','Manager','Agent','Agent','Viewer','Agent','Manager','Viewer']; return ['Hamza Raza','Fatima Zahra','Ali Hassan','Sara Khan','Omar Farooq','Hina Malik','Bilal Ahmed','Ayesha Noor'].map(function(n, i){ return { id:'U-' + (1 + i), name:n, email:n.toLowerCase().replace(' ', '.') + '@demo.example', role:roles[i], status:i === 6 ? 'Inactive' : 'Active', lastActive:VP.daysAgo(i % 5), requests:30 + i * 17 }; }); },
    logs: function(){ var a = [['Hamza Raza','Updated pricing configuration','info'],['System','Nightly backup completed','info'],['Sara Khan','Exported pricing history CSV','info'],['System','Transcription latency above threshold','warning'],['Omar Farooq','Failed login (3 attempts)','warning'],['Hina Malik','Deleted quotation Q-1998','info'],['System','Audio upload rejected: file too large','error'],['Hamza Raza','Deactivated user Bilal Ahmed','info']]; return a.map(function(x, i){ return { id:i + 1, time:VP.daysAgo(Math.floor(i / 2)) + ' ' + (9 + i) + ':' + (10 + i * 4) , user:x[0], action:x[1], level:x[2] }; }); },
    errors: function(){ return [{ id:1, code:'AUDIO_422', message:'Unsupported audio format', count:7, resolved:false },{ id:2, code:'STT_TIMEOUT', message:'Transcription timed out', count:3, resolved:false },{ id:3, code:'PRICE_404', message:'Product not found in catalog', count:5, resolved:true },{ id:4, code:'AUTH_401', message:'Session expired', count:12, resolved:true }]; },
    audio: function(){ return { total:142, success:131, failed:11, minutes:318 }; },
    sysconfig: function(){ return { maxAudioMB:25, maxSeconds:300, allowSignups:true, maintenance:false, autoDeleteDays:30, maxDiscount:25 }; }
  };
  function key(n){ return 'vp_' + n; }
  function list(n){ if(REAL) return cache[n] !== undefined ? cache[n] : (n === 'sysconfig' || n === 'audio' ? {} : []); var v = VP.store.get(key(n)); if(v == null){ v = seeds[n](); VP.store.set(key(n), v); } return v; }
  function save(n, v){ return VP.store.set(key(n), v); }
  function nextId(prefix, arr){ var m = arr.reduce(function(a, x){ var n = parseInt(String(x.id).replace(/\D/g, ''), 10) || 0; return Math.max(a, n); }, 0); return prefix + (m + 1); }
  var D = {
    catalog: function(){ return list('catalog'); }, list: list, save: save,
    find: function(n, id){ return list(n).find(function(x){ return x.id === id; }); },
    add: function(n, item, prefix){ var a = list(n); if(!item.id) item.id = nextId(prefix || 'X-', a); a.unshift(item); save(n, a); return item; },
    update: function(n, id, patch){ var a = list(n), i = a.findIndex(function(x){ return x.id === id; }); if(i < 0) return null; a[i] = Object.assign({}, a[i], patch); save(n, a); return a[i]; },
    remove: function(n, id){ save(n, list(n).filter(function(x){ return x.id !== id; })); },
    log: function(text, icon){ var a = list('activity'); a.unshift({ id:Date.now(), icon:icon || 'activity', text:text, time:new Date().toISOString().slice(0, 10) }); save('activity', a.slice(0, 40)); },
    reset: function(){ Object.keys(seeds).concat(['settings','notif_read']).forEach(function(n){ VP.store.del(key(n)); }); }
  };
  /* Backend mode: data lives on the server. VP.data becomes a read cache that sync() refills from /api/bootstrap. */
  D.real = REAL;
  D.sync = async function(){ if(!REAL) return; var d = await VP.api.bootstrap(); Object.keys(d).forEach(function(k){ cache[k] = d[k]; }); };
  D.flags = function(){ return Object.assign({ showFeatures:true, showHow:true, showBenefits:true, showPricing:true, showTestimonials:true, showFaq:true, showCta:true, allowSignups:true, enableUpload:true, enableRecording:true }, REAL ? (cache.flags || {}) : {}); };
  D.site = function(){ return REAL ? (cache.site || {}) : {}; };
  if(REAL){ D.add = D.update = D.remove = D.log = D.save = function(){ return null; }; D.reset = function(){}; }
  return D;
})();
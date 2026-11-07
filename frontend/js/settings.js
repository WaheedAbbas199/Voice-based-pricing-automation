/* Settings + Profile pages. */
VP.app.ready(function(){
  var $ = VP.$, S = VP.settings();
  var root = $('#settings-root');
  if(root){
    VP.initTabs(root); var cur = $('#set-currency'); cur.value = S.currency; $('#set-tax').value = S.defaultTax; $('#set-disc').value = S.defaultDiscount; $('#set-del').value = S.defaultDelivery;
    VP.$$('[data-n]').forEach(function(i){ i.checked = !!S.notify[i.dataset.n]; });
    $('#theme-sel').value = VP.theme.get(); $('#theme-sel').addEventListener('change', function(){ VP.theme.set(this.value, true); });
    document.addEventListener('themechange', function(e){ $('#theme-sel').value = e.detail; });
    $('#save-general').addEventListener('click', function(){ var t = +$('#set-tax').value, d = +$('#set-disc').value, dl = +$('#set-del').value; if(!(t >= 0 && t <= 100 && d >= 0 && d <= 100 && dl >= 0)) return VP.toast('Tax and discount must be 0–100 and delivery 0 or more.', 'warning');
      S = Object.assign(S, { currency:cur.value, defaultTax:t, defaultDiscount:d, defaultDelivery:dl }); VP.store.set('vp_settings', S); VP.toast('Preferences saved.', 'success'); });
    $('#save-notify').addEventListener('click', function(){ VP.$$('[data-n]').forEach(function(i){ S.notify[i.dataset.n] = i.checked; }); VP.store.set('vp_settings', S); VP.toast('Notification settings saved.', 'success'); });
    $('#api-base').textContent = VP.api.base; $('#api-mode').innerHTML = VP.api.isMock ? VP.badge('Demo mode — local sample data', 'demo') : VP.badge('Live — connected to API', 'success');
    if(!VP.api.isMock) $('#btn-reset-data').closest('.setting-row').hidden = true;
    $('#btn-reset-data').addEventListener('click', async function(){ if(!await VP.confirm('Reset all demo data (customers, quotations, history, settings) to the original samples?', { confirm:'Reset data' })) return; VP.data.reset(); VP.toast('Demo data reset.', 'success'); setTimeout(function(){ location.reload(); }, 600); });
    $('#btn-export-all').addEventListener('click', function(){ VP.download('voxprice-export.json', JSON.stringify({ customers:VP.data.list('customers'), quotes:VP.data.list('quotes'), history:VP.data.list('history') }, null, 2), 'application/json'); VP.toast('Export downloaded.', 'success'); });
  }
  var prof = $('#profile-root');
  if(prof){
    var s = VP.app.session(), f = $('#profile-form'), pr = VP.store.get('vp_profile', {});
    $('#pf-avatar').textContent = VP.initials(s.name); $('#pf-name-h').textContent = s.name; $('#pf-role').textContent = s.role; f.name.value = s.name; f.email.value = s.email || ''; f.company.value = pr.company || S.company || ''; f.phone.value = pr.phone || '';
    f.addEventListener('submit', async function(e){ e.preventDefault(); var n = f.name.value.trim(), em = f.email.value.trim(), bad = false;
      [[f.name, n.length < 2 ? 'Enter your name.' : ''], [f.email, VP.valid.email(em) ? '' : 'Enter a valid email.']].forEach(function(p){ var fl = p[0].closest('.field'); fl.classList.toggle('has-error', !!p[1]); fl.querySelector('.field-error').textContent = p[1]; if(p[1]) bad = true; }); if(bad) return;
      try{ if(!VP.api.isMock){ var rr = await VP.api.auth.updateProfile({ name:n, email:em }); n = rr.user.name; em = rr.user.email; } }catch(err){ return VP.toast(err.message, 'error'); }
      s.name = n; s.email = em; VP.store.set('vp_session', s); VP.store.set('vp_profile', { company:f.company.value.trim(), phone:f.phone.value.trim() }); VP.toast('Profile updated.', 'success'); setTimeout(function(){ location.reload(); }, 500); });
    var pw = $('#pw-form'); pw.addEventListener('submit', async function(e){ e.preventDefault(); var a = pw.current.value, n = pw.next.value, c = pw.confirm.value, err = {}; if(!a) err.current = 'Enter your current password.'; if(n.length < 8 || !/\d/.test(n) || !/[A-Za-z]/.test(n)) err.next = 'Use 8+ characters with letters and a number.'; if(n !== c) err.confirm = 'Passwords do not match.';
      ['current', 'next', 'confirm'].forEach(function(k){ var fl = pw[k].closest('.field'); fl.classList.toggle('has-error', !!err[k]); fl.querySelector('.field-error').textContent = err[k] || ''; }); if(Object.keys(err).length) return;
      var b = pw.querySelector('button[type=submit]'); b.classList.add('is-loading');
      try{ if(VP.api.isMock){ await VP.sleep(800); pw.reset(); VP.toast('Demo mode: password rules checked, but nothing was changed because no server is connected.', 'info', 6000); } else { await VP.api.auth.changePassword({ current:a, new:n }); pw.reset(); VP.toast('Password changed.', 'success'); } }
      catch(err){ VP.toast(err.message, 'error'); } finally{ b.classList.remove('is-loading'); } });
    var h = VP.data.list('history'); $('#pf-calcs').textContent = h.length; $('#pf-quotes').textContent = VP.data.list('quotes').length;
  }
});

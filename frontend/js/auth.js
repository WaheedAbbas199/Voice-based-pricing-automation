/* Login / register / forgot / reset.
   Backend mode (USE_MOCK:false): real calls via VP.api.auth — httpOnly cookie session, server-side validation.
   Demo mode: nothing is verified by a server; no passwords are stored. */
window.VP = window.VP || {};
VP.auth = (function(){
  function field(input, msg){ var f = input.closest('.field'); f.classList.toggle('has-error', !!msg); f.querySelector('.field-error').textContent = msg || ''; input.setAttribute('aria-invalid', !!msg); return !msg; }
  function alertBox(form, type, msg){ var a = form.querySelector('.alert'); a.className = 'alert ' + type + (msg ? ' show' : ''); a.textContent = msg || ''; }
  function loading(btn, on){ btn.classList.toggle('is-loading', on); btn.disabled = on; }
  function strength(v){ var s = 0; if(v.length >= 8) s++; if(/[A-Z]/.test(v) && /[a-z]/.test(v)) s++; if(/\d/.test(v)) s++; if(/[^A-Za-z0-9]/.test(v)) s++; return s; }
  function startSession(name, email, role){ VP.store.set('vp_session', { name:name, email:email, role:role || (/admin/i.test(email) ? 'Admin' : 'Manager'), since:Date.now() }); }
  function pretty(email){ return email.split('@')[0].replace(/[._-]+/g, ' ').replace(/\b\w/g, function(c){ return c.toUpperCase(); }); }
  var real = function(){ return !!(VP.api && !VP.api.isMock); };
  function bindPassToggles(){ VP.$$('.toggle-pass').forEach(function(b){ b.innerHTML = VP.icon('eye'); b.addEventListener('click', function(){ var i = b.parentElement.querySelector('input'), show = i.type === 'password'; i.type = show ? 'text' : 'password'; b.innerHTML = VP.icon(show ? 'eyeOff' : 'eye'); b.setAttribute('aria-label', show ? 'Hide password' : 'Show password'); }); }); }
  function goApp(){ location.href = 'pages/dashboard.html'; }

  function init(){
    bindPassToggles();
    VP.$$('.auth-wave').forEach(function(m){ for(var i = 0; i < 28; i++) m.insertAdjacentHTML('beforeend', '<i style="--i:' + i + '"></i>'); });
    if(real()) VP.$$('.notice').forEach(function(n){ n.hidden = true; });          // hide the "demo mode" hint when a real backend is used
    var login = VP.$('#login-form'), reg = VP.$('#register-form'), forgot = VP.$('#forgot-form'), reset = VP.$('#reset-form');
    if(login){
      var email = login.elements.email, pass = login.elements.password, rem = VP.store.get('vp_remember', ''); if(rem){ email.value = rem; login.elements.remember.checked = true; }
      login.addEventListener('submit', async function(e){
        e.preventDefault(); alertBox(login, '', '');
        var ok = field(email, VP.valid.email(email.value.trim()) ? '' : 'Enter a valid email address.') & field(pass, pass.value.length >= 8 ? '' : 'Password must be at least 8 characters.');
        if(!ok) return; var btn = login.querySelector('button[type=submit]'); loading(btn, true);
        try{
          if(real()){ var r = await VP.api.auth.login({ email:email.value.trim(), password:pass.value, remember:login.elements.remember.checked }); startSession(r.user.name, r.user.email, r.user.role); }
          else { await VP.sleep(900); var reged = VP.store.get('vp_registered', []).find(function(u){ return u.email === email.value.trim().toLowerCase(); }); startSession(reged ? reged.name : pretty(email.value.trim()), email.value.trim().toLowerCase()); }
          if(login.elements.remember.checked) VP.store.set('vp_remember', email.value.trim()); else VP.store.del('vp_remember');
          goApp();
        }catch(err){ loading(btn, false); alertBox(login, 'error', err.message); }
      });
    }
    if(reg){
      var rp = reg.elements.password, meter = VP.$('.strength', reg);
      rp.addEventListener('input', function(){ meter.dataset.s = strength(rp.value); });
      reg.addEventListener('submit', async function(e){
        e.preventDefault(); alertBox(reg, '', ''); var E = reg.elements;
        var ok = [field(E.name, E.name.value.trim().length >= 2 ? '' : 'Enter your full name.'), field(E.email, VP.valid.email(E.email.value.trim()) ? '' : 'Enter a valid email address.'), field(rp, strength(rp.value) >= 3 ? '' : 'Use 8+ characters with upper/lower case and a number.'), field(E.confirm, E.confirm.value === rp.value && rp.value ? '' : 'Passwords do not match.'), field(E.terms, E.terms.checked ? '' : 'Accept the terms to continue.')].every(Boolean);
        if(!ok) return; var btn = reg.querySelector('button[type=submit]'); loading(btn, true); var em = E.email.value.trim().toLowerCase();
        try{
          if(real()){ var r = await VP.api.auth.register({ name:E.name.value.trim(), email:em, password:rp.value }); startSession(r.user.name, r.user.email, r.user.role); }
          else { await VP.sleep(1000); var list = VP.store.get('vp_registered', []); list.push({ name:E.name.value.trim(), email:em }); VP.store.set('vp_registered', list); startSession(E.name.value.trim(), em); }
          goApp();
        }catch(err){ loading(btn, false); alertBox(reg, 'error', err.message); }
      });
    }
    if(forgot){
      forgot.addEventListener('submit', async function(e){
        e.preventDefault(); alertBox(forgot, '', ''); var em = forgot.elements.email;
        if(!field(em, VP.valid.email(em.value.trim()) ? '' : 'Enter the email you registered with.')) return;
        var btn = forgot.querySelector('button[type=submit]'); loading(btn, true);
        try{
          if(real()){ await VP.api.auth.forgot({ email:em.value.trim() }); alertBox(forgot, 'success', 'If an account exists for ' + em.value.trim() + ', a reset link has been sent. (If email is not configured on the server, the link is printed in the server console.)'); }
          else { await VP.sleep(900); alertBox(forgot, 'success', 'Demo mode: no email was actually sent. With the backend running, a reset link would be sent to ' + em.value.trim() + '.'); }
        }catch(err){ alertBox(forgot, 'error', err.message); } finally{ loading(btn, false); }
      });
    }
    if(reset){
      var token = new URLSearchParams(location.search).get('token') || '';
      if(!token || !real()) alertBox(reset, 'error', real() ? 'This reset link is missing its token. Request a new one.' : 'Password reset needs the backend (python main.py).');
      reset.addEventListener('submit', async function(e){
        e.preventDefault(); alertBox(reset, '', ''); var E = reset.elements;
        var ok = field(E.password, strength(E.password.value) >= 3 ? '' : 'Use 8+ characters with upper/lower case and a number.') & field(E.confirm, E.confirm.value === E.password.value ? '' : 'Passwords do not match.');
        if(!ok || !token) return; var btn = reset.querySelector('button[type=submit]'); loading(btn, true);
        try{ await VP.api.auth.reset({ token:token, password:E.password.value }); alertBox(reset, 'success', 'Password updated. Redirecting to log in…'); setTimeout(function(){ location.href = 'login.html'; }, 1500); }
        catch(err){ loading(btn, false); alertBox(reset, 'error', err.message); }
      });
    }
  }
  document.addEventListener('DOMContentLoaded', init);
  return {};
})();

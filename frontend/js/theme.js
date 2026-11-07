/* Theme (dark/light). Loaded in <head> so the theme applies before first paint. */
window.VP = window.VP || {};
(function(){
  var root = document.documentElement, KEY = 'vp_theme';
  root.classList.add('js');
  function get(){ try{ var t = localStorage.getItem(KEY); if(t) return t; }catch(e){} return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'; }
  function set(t, animate){
    if(animate){ root.classList.add('theme-anim'); setTimeout(function(){ root.classList.remove('theme-anim'); }, 450); }
    root.dataset.theme = t;
    try{ localStorage.setItem(KEY, t); }catch(e){}
    document.dispatchEvent(new CustomEvent('themechange', { detail: t }));
  }
  root.dataset.theme = get();
  VP.theme = { get: function(){ return root.dataset.theme; }, set: set, toggle: function(){ set(root.dataset.theme === 'dark' ? 'light' : 'dark', true); } };
  document.addEventListener('click', function(e){ if(e.target.closest('[data-theme-toggle]')) VP.theme.toggle(); });
})();

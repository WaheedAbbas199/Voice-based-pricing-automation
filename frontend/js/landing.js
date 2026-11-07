/* Landing page: nav state, parallax, particles, pricing toggle. Hero visuals are pure CSS 3D. */
(function(){
  document.addEventListener('DOMContentLoaded', function(){
    var nav = VP.$('.nav'), scene = VP.$('#hero-scene'), hero = VP.$('.hero'), reduce = VP.reducedMotion();
    var onScroll = function(){ nav.classList.toggle('scrolled', scrollY > 12); if(!reduce && hero){ hero.style.setProperty('--sy', scrollY); var pv = VP.$('.preview'); if(pv) pv.style.setProperty('--py', Math.min(scrollY * -.05, 0) + 'px'); } };
    onScroll(); addEventListener('scroll', onScroll, { passive:true });
    VP.$('.nav-toggle').addEventListener('click', function(){ var o = nav.classList.toggle('open'); this.setAttribute('aria-expanded', o); });
    VP.$$('.nav-links a').forEach(function(a){ a.addEventListener('click', function(){ nav.classList.remove('open'); }); });
    // wave bars, mini waves, particles (generated to keep HTML clean)
    var wf = VP.$('.wave-floor'); if(wf) for(var i = 0; i < 26; i++) wf.insertAdjacentHTML('beforeend', '<i style="--i:' + i + '"></i>');
    VP.$$('.mini-wave').forEach(function(m){ for(var i = 0; i < 12; i++) m.insertAdjacentHTML('beforeend', '<i style="--i:' + i + '"></i>'); });
    VP.$$('.auth-wave').forEach(function(m){ for(var i = 0; i < 28; i++) m.insertAdjacentHTML('beforeend', '<i style="--i:' + i + '"></i>'); });
    var pc = VP.$('.particles'); if(pc && !reduce) for(var p = 0; p < 30; p++){ var s = document.createElement('span'), sz = 2 + Math.random() * 5; s.className = 'particle'; s.style.cssText = 'left:' + Math.random() * 100 + '%;top:' + (30 + Math.random() * 70) + '%;width:' + sz + 'px;height:' + sz + 'px;animation-duration:' + (7 + Math.random() * 10) + 's;animation-delay:' + (-Math.random() * 12) + 's;--dx:' + (Math.random() * 80 - 40) + 'px'; pc.appendChild(s); }
    // mouse parallax (fine pointers only)
    if(scene && !reduce && matchMedia('(pointer:fine)').matches){
      var st = VP.$('.stage3d'), raf; hero.addEventListener('mousemove', function(e){ if(raf) return; raf = requestAnimationFrame(function(){ raf = 0; var r = scene.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5; st.style.setProperty('--ry', (-16 + x * 24) + 'deg'); st.style.setProperty('--rx', (10 - y * 18) + 'deg'); }); });
      hero.addEventListener('mouseleave', function(){ st.style.setProperty('--ry', '-16deg'); st.style.setProperty('--rx', '10deg'); });
    }
    // billing toggle
    var tg = VP.$('#billing'); if(tg) tg.addEventListener('change', function(){ VP.$$('[data-m]').forEach(function(e){ e.textContent = tg.checked ? e.dataset.y : e.dataset.m; }); VP.$$('[data-per]').forEach(function(e){ e.textContent = tg.checked ? '/mo, billed yearly' : '/month'; }); });
    VP.$$('.year').forEach(function(y){ y.textContent = new Date().getFullYear(); });
  });
})();
document.addEventListener('DOMContentLoaded', function(){ if(window.VP && VP.cms) VP.cms.initLanding(); });

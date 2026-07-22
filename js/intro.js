// ============================================================================
// INTRO FLOW (first_run overlay) — faithful vanilla port of the Claude Design
// export "Emma App Flow.dc.html". Every color, size, easing, and timing below
// is copied from the export, not interpreted.
//
// Splash (bg #F1EFE6, ~4.2s, tap to skip):
//   two drifting gold glow blobs; the gold dot pops big at center, then
//   shrinks while it travels right as the "emma speak" wordmark reveals
//   left-to-right beneath it; the dot lands as the final period and gives a
//   settle bounce with a soft two-partial marimba note at 2.05s.
// Onboarding (bg #F3F0E8 — the app background, so Safari chrome matches):
//   3 progress dashes (gold center), emmaspeak logo, "Pra começar, me conta:",
//   serif headline, 4 goal rows (Viagem pre-selected, cream #FCF3DC + gold
//   border when selected), name field with person icon, gold "Continuar →"
//   solid #EDB111, "Pular por enquanto" below.
//
// Production wiring (not in the design export):
//   name → streetway_user_name · goal → streetway_goal · done flag →
//   streetway_intro_done · after Continuar, opens the matching path detail on
//   mobile via home2's openPathDetail. Tile crops replicate the design tool's
//   image-slot math (cover base × s, center offset x/y in frame-%) using the
//   exact values from intro-assets/slots.json.
// Preview: ?intro=preview or window.INTRO_FORCE — always runs, never saves.
// ============================================================================
(function(){
  'use strict';

  var DONE_KEY = 'streetway_intro_done';
  var NAME_KEY = 'streetway_user_name';
  var GOAL_KEY = 'streetway_goal';
  var ASSETS   = 'intro-assets/';

  var preview = !!window.INTRO_FORCE || /[?&]intro=preview/.test(location.search);
  try{ if(!preview && localStorage.getItem(DONE_KEY)) return; }catch(e){}

  // Goal rows — labels, hints, tile colors, slot crops: verbatim from the export.
  var GOALS = [
    { key:'zero',     label:'Come\u00e7ar do zero',            hint:'Aprenda o essencial e comece a falar.',
      path:'starter',          tileBg:'#4B8FD7', img:'goal-tile-zero.webp',
      s:1.2310339123497342, x:-2.937121031527405,  y:0.11379771985973264 },
    { key:'viagem',   label:'Viajar com confian\u00e7a',       hint:'Do aeroporto ao restaurante, saiba o que dizer.',
      path:'travel-english',   tileBg:'#38A598', img:'goal-tile-viagem.webp',
      s:1.119022106936133,  x:-2.1228514455783185, y:-8.940821362271848 },
    { key:'trabalho', label:'Crescer no trabalho',             hint:'Comunique-se melhor e abra novas portas.',
      path:'business-english', tileBg:'#8659B5', img:'goal-tile-trabalho.webp',
      s:1.149083154225666,  x:-1.5574743834630096, y:-8.320222950070097 },
    { key:'conversa', label:'Conversar com confian\u00e7a',    hint:'Crie conex\u00f5es e fale sem travar.',
      path:'conversation',     tileBg:'#EDB111', img:'goal-tile-conversa.webp',
      s:1.2086744989270037, x:-2.193956628181482,  y:-9.019218486421927 }
  ];

  // ---- Fonts ----------------------------------------------------------------
  (function fonts(){
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Source+Serif+4:opsz,wght@8..60,700&display=swap';
    document.head.appendChild(l);
  })();

  // ---- CSS — keyframes are copied verbatim from the export ------------------
  var CSS = ''
  + '@keyframes es-pop{0%{transform:scale(0)}62%{transform:scale(4.35)}100%{transform:scale(3.8)}}'
  + '@keyframes es-shrink{from{transform:scale(3.8)}to{transform:scale(1)}}'
  + '@keyframes es-travel{to{transform:translate(0px,0px)}}'
  + '@keyframes es-reveal{from{clip-path:inset(-12% 50% -12% 50%)}to{clip-path:inset(-12% -3% -12% 0)}}'
  + '@keyframes es-settle{0%{transform:scale(1)}45%{transform:scale(1.4)}100%{transform:scale(1)}}'
  + '@keyframes es-drift{from{transform:translate(-60px,0) scale(1)}to{transform:translate(330px,50px) scale(1.2)}}'
  + '@keyframes es-drift2{from{transform:translate(60px,0) scale(1.1)}to{transform:translate(-340px,-60px) scale(0.9)}}'
  + '@keyframes em-rise{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}'

  + '#introRoot{position:fixed;inset:0;z-index:9999;background:#F3F0E8;'
  +   'font-family:"Plus Jakarta Sans",system-ui,sans-serif;color:#2B2620;'
  +   '-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;}'
  + '#introRoot,#introRoot *{box-sizing:border-box;}'
  + '#introRoot.intro-out{transition:opacity .45s ease;opacity:0;pointer-events:none;}'

  /* ---------- SPLASH (cover layer) ---------- */
  + '#introRoot .es-splash{position:absolute;inset:0;z-index:2;background:#F1EFE6;cursor:pointer;'
  +   'user-select:none;-webkit-user-select:none;overflow:hidden;'
  +   'transition:opacity .7s ease,visibility .7s;opacity:1;visibility:visible;}'
  + '#introRoot .es-splash.off{opacity:0;visibility:hidden;pointer-events:none;}'
  + '#introRoot .es-blob{position:absolute;border-radius:50%;filter:blur(24px);'
  +   'background:radial-gradient(circle,rgba(246,183,40,0.55) 0%,rgba(246,183,40,0) 70%);}'
  + '#introRoot .es-blob.b1{left:-160px;top:-60px;width:360px;height:360px;opacity:.55;'
  +   'animation:es-drift 19s ease-in-out infinite alternate;}'
  + '#introRoot .es-blob.b2{left:240px;top:600px;width:320px;height:320px;opacity:.45;'
  +   'animation:es-drift2 24s ease-in-out infinite alternate;}'
  + '#introRoot .es-lockup{position:absolute;left:50%;top:48%;width:300px;height:53.5px;'
  +   'transform:translate(-50%,-50%);}'
  + '#introRoot .es-word{position:absolute;inset:0;clip-path:inset(-12% 50% -12% 50%);'
  +   'animation:es-reveal 1.15s cubic-bezier(0.76,0,0.24,1) 0.85s forwards;}'
  + '#introRoot .es-word img{width:300px;height:53.5px;display:block;-webkit-user-drag:none;}'
  + '#introRoot .es-dot{position:absolute;left:300.65px;top:35.75px;width:7.1px;height:7.1px;'
  +   'transform:translate(-154.2px,-12.55px);'
  +   'animation:es-travel 1.15s cubic-bezier(0.76,0,0.24,1) 0.85s forwards;}'
  + '#introRoot .es-dot i{display:block;width:100%;height:100%;border-radius:50%;background:#F6B728;'
  +   'transform:scale(0);'
  +   'animation:es-pop 0.7s cubic-bezier(0.34,1.4,0.64,1) forwards,'
  +   'es-shrink 1.15s cubic-bezier(0.76,0,0.24,1) 0.85s forwards,'
  +   'es-settle 0.45s cubic-bezier(0.34,1.56,0.64,1) 2.05s forwards;}'

  /* ---------- ONBOARDING ---------- */
  + '#introRoot .em-onb{position:absolute;inset:0;display:flex;flex-direction:column;background:#F3F0E8;'
  +   'padding:calc(16px + env(safe-area-inset-top)) 26px calc(20px + env(safe-area-inset-bottom));'
  +   'opacity:0;transition:opacity .6s ease .15s;overflow-y:auto;'
  +   '-webkit-overflow-scrolling:touch;overscroll-behavior:none;}'
  + '#introRoot .em-onb.on{opacity:1;}'
  + '#introRoot .em-onb-inner{max-width:430px;width:100%;margin:0 auto;display:flex;flex-direction:column;'
  +   'min-height:100%;}'
  + '#introRoot .em-logo{display:flex;justify-content:center;margin-top:12px;}'
  + '#introRoot .em-logo img{height:26px;width:auto;display:block;}'
  + '#introRoot .em-rise{animation:em-rise 0.7s cubic-bezier(0.22,1,0.36,1) 0.2s both;}'
  + '#introRoot .em-lead{margin:26px 0 0;font-size:16px;color:rgba(43,38,32,.6);}'
  + '#introRoot .em-h1{font-family:"Source Serif 4",Georgia,serif;font-size:30px;line-height:1.1;'
  +   'font-weight:700;letter-spacing:-.01em;margin:2px 0 0;}'
  + '#introRoot .em-goals{display:flex;flex-direction:column;gap:12px;margin-top:20px;}'
  + '#introRoot .em-goal{background:#FFFFFF;border:1.5px solid #EDE6D5;border-radius:20px;'
  +   'padding:15px 16px;cursor:pointer;display:flex;align-items:center;gap:14px;'
  +   'transition:background .15s,border-color .15s;box-shadow:0 1px 2px rgba(43,38,32,.04);'
  +   'width:100%;text-align:left;font-family:inherit;color:#2B2620;}'
  + '#introRoot .em-goal:active{transform:scale(.985);}'
  + '#introRoot .em-goal.sel{background:#FCF3DC;border-color:#EDB111;}'
  + '#introRoot .em-tile{width:56px;height:56px;border-radius:16px;flex:none;overflow:hidden;position:relative;}'
  + '#introRoot .em-tile img{position:absolute;max-width:none;transform:translate(-50%,-50%);'
  +   '-webkit-user-drag:none;}'
  + '#introRoot .em-goal-txt{flex:1;display:flex;flex-direction:column;gap:2px;min-width:0;}'
  + '#introRoot .em-goal-lb{font-weight:700;font-size:16.5px;letter-spacing:-.01em;}'
  + '#introRoot .em-goal-hint{font-size:13px;color:rgba(43,38,32,.5);}'
  + '#introRoot .em-check{width:26px;height:26px;border-radius:50%;background:transparent;'
  +   'border:1.5px solid #DDD4BF;display:flex;align-items:center;justify-content:center;'
  +   'color:#fff;font-size:12px;font-weight:800;flex:none;transition:background .15s;}'
  + '#introRoot .em-goal.sel .em-check{background:#EDB111;border-color:#EDB111;}'
  + '#introRoot .em-spacer{flex:1;min-height:18px;}'
  + '#introRoot .em-name-lb{margin:0 0 8px;font-size:14px;color:rgba(43,38,32,.6);}'
  + '#introRoot .em-name-row{display:flex;align-items:center;background:#fff;border:1.5px solid #E9E1CF;'
  +   'border-radius:16px;padding:0 16px;}'
  + '#introRoot .em-name-row input{border:none;background:transparent;padding:15px 0;font-size:17px;'
  +   'font-weight:600;outline:none;color:#2B2620;flex:1;font-family:"Plus Jakarta Sans",system-ui,sans-serif;min-width:0;}'
  + '#introRoot .em-name-row input::placeholder{color:#C0B8A6;}'
  + '#introRoot .em-cta{background:#EDB111;color:#3A3006;border:0;border-radius:999px;padding:17px 0;'
  +   'text-align:center;font-weight:700;font-size:17px;cursor:pointer;margin-top:16px;'
  +   'box-shadow:0 4px 12px rgba(237,177,17,.35);transition:background .2s;'
  +   'font-family:inherit;width:100%;}'
  + '#introRoot .em-cta:active{transform:scale(.98);}'
  + '#introRoot .em-skip{text-align:center;font-size:13.5px;color:rgba(43,38,32,.5);margin-top:12px;'
  +   'cursor:pointer;background:none;border:0;font-family:inherit;width:100%;padding:4px 0;}'
  
  ;

  // ---- DOM ------------------------------------------------------------------
  function h(html){ var d=document.createElement('div'); d.innerHTML=html; return d.firstElementChild; }

  var style = document.createElement('style');
  style.textContent = CSS;

  var root = h('<div id="introRoot"></div>');

  var goalsHTML = GOALS.map(function(g){
    return '<button type="button" class="em-goal' + (g.key==='viagem'?' sel':'') + '"'
      + ' data-goal="' + g.key + '" data-path="' + g.path + '">'
      + '<span class="em-tile" style="background:' + g.tileBg + '">'
      +   '<img src="' + ASSETS + g.img + '" alt="" data-s="' + g.s + '" data-x="' + g.x + '" data-y="' + g.y + '">'
      + '</span>'
      + '<span class="em-goal-txt"><span class="em-goal-lb">' + g.label + '</span>'
      +   '<span class="em-goal-hint">' + g.hint + '</span></span>'
      + '<span class="em-check">' + (g.key==='viagem'?'\u2713':'') + '</span>'
      + '</button>';
  }).join('');

  var onb = h(
    '<div class="em-onb"><div class="em-onb-inner">'
    + '<div class="em-logo"><img src="' + ASSETS + 'emmaspeak-logo.png" alt="emmaspeak"></div>'
    + '<div class="em-rise-wrap">'
    +   '<p class="em-lead">Pra come\u00e7ar, me conta:</p>'
    +   '<h1 class="em-h1">o que voc\u00ea quer com o ingl\u00eas?</h1>'
    +   '<div class="em-goals">' + goalsHTML + '</div>'
    + '</div>'
    + '<div class="em-spacer"></div>'
    + '<p class="em-name-lb">Como posso te chamar?</p>'
    + '<div class="em-name-row">'
    +   '<input type="text" maxlength="24" autocomplete="given-name" placeholder="Seu primeiro nome">'
    +   '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B0A78F" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21a7 7 0 0 0-14 0M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"></path></svg>'
    + '</div>'
    + '<button type="button" class="em-cta">Continuar \u2192</button>'
    + '<button type="button" class="em-skip">Pular por enquanto</button>'
    + '</div></div>');

  var splash = h(
    '<div class="es-splash">'
    + '<div class="es-blob b1"></div><div class="es-blob b2"></div>'
    + '<div class="es-lockup">'
    +   '<div class="es-word"><img src="' + ASSETS + 'wordmark-emma-yellow.png" alt="emma speak" draggable="false"></div>'
    +   '<div class="es-dot"><i></i></div>'
    + '</div>'
    + '</div>');

  root.appendChild(onb);
  root.appendChild(splash);

  // ---- Tile crop: same math as the design tool's image-slot ----------------
  // cover base = max(frameW/imgW, frameH/imgH); k = base*s;
  // width  = imgW*k/frameW %, height = imgH*k/frameH %;
  // left = (50+x)%, top = (50+y)%, img is translate(-50%,-50%).
  function applySlot(img){
    function go(){
      var frame = img.parentNode;
      var iw = img.naturalWidth, ih = img.naturalHeight;
      var fw = frame.clientWidth || 56, fh = frame.clientHeight || 56;
      if(!iw || !ih) return;
      var s = parseFloat(img.dataset.s), x = parseFloat(img.dataset.x), y = parseFloat(img.dataset.y);
      var base = Math.max(fw/iw, fh/ih);
      var k = base * s;
      img.style.width  = (iw*k/fw*100) + '%';
      img.style.height = (ih*k/fh*100) + '%';
      img.style.left   = (50+x) + '%';
      img.style.top    = (50+y) + '%';
    }
    if(img.complete && img.naturalWidth) go(); else img.onload = go;
  }

  // ---- Marimba note — exact tone() from the export --------------------------
  var actx = null;
  function tone(ac, p){
    var o = ac.createOscillator(), g = ac.createGain();
    o.type = p.type || 'sine';
    o.frequency.setValueAtTime(p.f0, p.at);
    g.gain.setValueAtTime(0.0001, p.at);
    g.gain.exponentialRampToValueAtTime(p.vol, p.at + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, p.at + p.dur);
    o.connect(g); g.connect(ac.destination);
    o.start(p.at); o.stop(p.at + p.dur + 0.05);
  }
  function playSplashSound(){
    try{
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if(actx.state === 'suspended') actx.resume();
      if(actx.state !== 'running') return; // iOS pre-gesture: silent, as designed
      var n = actx.currentTime;
      tone(actx, { f0:523.25, at:n + 2.05, dur:0.35, vol:0.05 });
      tone(actx, { f0:1046.5, at:n + 2.05, dur:0.18, vol:0.02 });
    }catch(e){}
  }

  // ---- Flow -----------------------------------------------------------------
  var splashTimer = null;
  function toOnboarding(){
    clearTimeout(splashTimer);
    if(splash.classList.contains('off')) return;
    splash.classList.add('off');
    onb.classList.add('on');
    paintDoc('#F3F0E8');
    onb.querySelector('.em-rise-wrap').classList.add('em-rise');
    setTimeout(function(){ if(splash.parentNode) splash.parentNode.removeChild(splash); }, 800);
  }
  splash.addEventListener('click', toOnboarding);

  // Tint the page itself while the intro is up — iOS paints safe areas and
  // overscroll with the DOCUMENT background, not the overlay's. No theme-color
  // meta: Safari samples the page bg directly and matches better on its own.
  var prevBg = null;
  function paintDoc(color){
    if(prevBg === null){
      prevBg = { html: document.documentElement.style.background,
                 body: document.body.style.background };
    }
    document.documentElement.style.background = color;
    document.body.style.background = color;
  }
  function unpaintDoc(){
    if(prevBg === null) return;
    document.documentElement.style.background = prevBg.html;
    document.body.style.background = prevBg.body;
  }

  function mount(){
    document.head.appendChild(style);
    document.body.appendChild(root);
    paintDoc('#F1EFE6');
    onb.querySelectorAll('.em-tile img').forEach(applySlot);
    playSplashSound();
    splashTimer = setTimeout(toOnboarding, 4200);
  }

  // ---- Onboarding wiring ----------------------------------------------------
  var selected = { goal:'viagem', path:'travel-english' }; // pre-selected, as designed
  var cta = onb.querySelector('.em-cta');
  var nameInput = onb.querySelector('.em-name-row input');

  onb.querySelectorAll('.em-goal').forEach(function(btn){
    btn.addEventListener('click', function(){
      onb.querySelectorAll('.em-goal').forEach(function(b){
        b.classList.remove('sel');
        b.querySelector('.em-check').textContent = '';
      });
      btn.classList.add('sel');
      btn.querySelector('.em-check').textContent = '\u2713';
      selected = { goal: btn.dataset.goal, path: btn.dataset.path };
    });
  });

  nameInput.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){ nameInput.blur(); cta.click(); }
  });

  function closeOverlay(){
    unpaintDoc();
    root.classList.add('intro-out');
    setTimeout(function(){
      if(root.parentNode) root.parentNode.removeChild(root);
      if(style.parentNode) style.parentNode.removeChild(style);
    }, 500);
  }

  cta.addEventListener('click', function(){
    if(!preview){
      try{
        localStorage.setItem(DONE_KEY, '1');
        var nm = (nameInput.value || '').trim().split(/\s+/)[0];
        if(nm) localStorage.setItem(NAME_KEY, nm.charAt(0).toUpperCase() + nm.slice(1));
        localStorage.setItem(GOAL_KEY, selected.path);
      }catch(e){}
    }
    closeOverlay();
    // Route: open the chosen path on mobile once home2 is ready.
    if(window.innerWidth < 1024){
      var key = selected.path, tries = 0;
      (function attempt(){
        if(typeof window.openPathDetail === 'function'){
          try{ window.openPathDetail(key); }catch(e){}
          return;
        }
        if(++tries < 30) setTimeout(attempt, 250);
      })();
    }
  });

  onb.querySelector('.em-skip').addEventListener('click', function(){
    if(!preview){ try{ localStorage.setItem(DONE_KEY, '1'); }catch(e){} }
    closeOverlay();
  });

  // ---- Go -------------------------------------------------------------------
  if(document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();

// ============================================================================
// INTRO FLOW (first_run overlay) — vanilla port of the Design-tool export.
// Splash: dark stage with drifting gold glow, wordmark center-reveal, gold dot
//         pops → travels → settles as the period, soft marimba at landing,
//         ~4.2s total, tap anywhere to skip.
// Screen 2: progress dashes, serif headline, four illustrated goal rows
//         (intro-assets/*.webp cropped with slots.json values), name field,
//         gold CTA. "Pular" always visible.
// Wiring: name → streetway_user_name · goal → streetway_goal ·
//         done flag → streetway_intro_done · after CTA, opens the matching
//         path detail on mobile (openPathDetail from home2, when available).
// Self-contained: injects its own CSS + DOM. No other file is touched.
// Preview mode: add ?intro=preview to the URL (or set window.INTRO_FORCE)
//         to run the flow even after it was completed; preview never saves.
// ============================================================================
(function(){
  'use strict';

  var DONE_KEY = 'streetway_intro_done';
  var NAME_KEY = 'streetway_user_name';
  var GOAL_KEY = 'streetway_goal';
  var ASSETS   = 'intro-assets/';

  var preview = !!window.INTRO_FORCE ||
                /[?&]intro=preview/.test(location.search);

  // Already onboarded → do nothing (unless previewing).
  try{
    if(!preview && localStorage.getItem(DONE_KEY)) return;
  }catch(e){ /* storage blocked — still show once */ }

  // Goal rows: label, path key in the app, tile art + slots.json crop values,
  // and the tile's brand color (selection ring / fallback bg).
  var GOALS = [
    { id:'zero',     label:'Come\u00e7ar do zero', sub:'Primeiros passos, sem pressa',
      path:'starter',          color:'#4B8FD7',
      img:'goal-tile-zero.webp',     s:1.2310339123497342, x:-2.937121031527405,  y:0.11379771985973264 },
    { id:'viagem',   label:'Viagem',            sub:'Aeroporto, hotel, restaurante',
      path:'travel-english',   color:'#38A598',
      img:'goal-tile-viagem.webp',   s:1.119022106936133,  x:-2.1228514455783185, y:-8.940821362271848 },
    { id:'trabalho', label:'Trabalho',          sub:'Reuni\u00f5es, e-mails, carreira',
      path:'business-english', color:'#8659B5',
      img:'goal-tile-trabalho.webp', s:1.149083154225666,  x:-1.5574743834630096, y:-8.320222950070097 },
    { id:'conversa', label:'Conversa\u00e7\u00e3o', sub:'Falar com confian\u00e7a no dia a dia',
      path:'conversation',     color:'#EDB111',
      img:'goal-tile-conversa.webp', s:1.2086744989270037, x:-2.193956628181482,  y:-9.019218486421927 }
  ];

  // ---- Fonts (Bricolage Grotesque + Source Serif 4) -------------------------
  (function fonts(){
    var l = document.createElement('link');
    l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400;12..96,500;12..96,600;12..96,700&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400;1,8..60,600&display=swap';
    document.head.appendChild(l);
  })();

  // ---- CSS ------------------------------------------------------------------
  var CSS = ''
  + '#introRoot{position:fixed;inset:0;z-index:9999;font-family:"Bricolage Grotesque",-apple-system,sans-serif;'
  +   '-webkit-font-smoothing:antialiased;-webkit-tap-highlight-color:transparent;}'
  + '#introRoot,#introRoot *{box-sizing:border-box;margin:0;padding:0;}'
  + '#introRoot.intro-out{transition:opacity .45s ease;opacity:0;pointer-events:none;}'

  /* ---------- SPLASH ---------- */
  + '.in-splash{position:absolute;inset:0;background:#0B0B0C;overflow:hidden;display:flex;'
  +   'align-items:center;justify-content:center;cursor:pointer;}'
  + '.in-splash.sp-out{transition:opacity .5s ease;opacity:0;pointer-events:none;}'
  + '.in-blob{position:absolute;border-radius:50%;filter:blur(60px);opacity:.22;will-change:transform;}'
  + '.in-blob.b1{width:52vmax;height:52vmax;left:-18vmax;top:-16vmax;'
  +   'background:radial-gradient(circle,#E0A21C 0%,rgba(224,162,28,0) 68%);animation:inDrift1 11s ease-in-out infinite alternate;}'
  + '.in-blob.b2{width:44vmax;height:44vmax;right:-16vmax;bottom:-14vmax;'
  +   'background:radial-gradient(circle,#B8860B 0%,rgba(184,134,11,0) 66%);animation:inDrift2 13s ease-in-out infinite alternate;}'
  + '.in-blob.b3{width:30vmax;height:30vmax;left:30%;bottom:-18vmax;opacity:.14;'
  +   'background:radial-gradient(circle,#E6B31E 0%,rgba(230,179,30,0) 70%);animation:inDrift3 9s ease-in-out infinite alternate;}'
  + '@keyframes inDrift1{from{transform:translate(0,0) scale(1);}to{transform:translate(7vmax,5vmax) scale(1.12);}}'
  + '@keyframes inDrift2{from{transform:translate(0,0) scale(1.08);}to{transform:translate(-6vmax,-5vmax) scale(.96);}}'
  + '@keyframes inDrift3{from{transform:translate(0,0);}to{transform:translate(-5vmax,-6vmax);}}'

  + '.in-stage{position:relative;display:flex;align-items:center;justify-content:center;}'
  + '.in-wordmark{display:block;width:min(58vw,300px);height:auto;'
  +   'clip-path:inset(0 50% 0 50%);opacity:0;'
  +   'filter:drop-shadow(0 0 26px rgba(224,162,28,.25));}'
  + '.in-splash.sp-go .in-wordmark{animation:inReveal 1.25s cubic-bezier(.22,.9,.24,1) .45s forwards;}'
  + '@keyframes inReveal{0%{clip-path:inset(0 50% 0 50%);opacity:0;}'
  +   '18%{opacity:1;}100%{clip-path:inset(0 0 0 0);opacity:1;}}'

  /* the traveling gold dot — pops above center, arcs right, settles as the period */
  + '.in-dot{position:absolute;width:12px;height:12px;border-radius:50%;background:#E6B31E;'
  +   'left:50%;top:50%;opacity:0;box-shadow:0 0 14px rgba(230,179,30,.8);will-change:transform;}'
  + '.in-splash.sp-go .in-dot{animation:inDot 1.35s cubic-bezier(.3,.7,.35,1) 1.5s forwards;}'
  + '@keyframes inDot{'
  +   '0%{opacity:0;transform:translate(-50%,-50%) scale(.2);}'
  +   '14%{opacity:1;transform:translate(-50%,calc(-50% - 58px)) scale(1.35);}'
  +   '30%{transform:translate(-50%,calc(-50% - 66px)) scale(1.1);}'
  +   '62%{transform:translate(calc(-50% + var(--dotX)),calc(-50% - 40px)) scale(1);}'
  +   '84%{transform:translate(calc(-50% + var(--dotX)),calc(-50% + var(--dotY) - 2px)) scale(1);}'
  +   '92%{transform:translate(calc(-50% + var(--dotX)),calc(-50% + var(--dotY))) scale(1.25,.75);}'
  +   '100%{transform:translate(calc(-50% + var(--dotX)),calc(-50% + var(--dotY))) scale(1);}}'
  + '.in-skip{position:absolute;left:0;right:0;bottom:calc(30px + env(safe-area-inset-bottom));'
  +   'text-align:center;color:rgba(255,255,255,.34);font-size:13px;letter-spacing:.06em;'
  +   'opacity:0;animation:inFadeIn .8s ease 2.4s forwards;}'
  + '@keyframes inFadeIn{to{opacity:1;}}'

  /* ---------- OBJECTIVE SCREEN ---------- */
  + '.in-obj{position:absolute;inset:0;background:#F3F0E8;overflow-y:auto;'
  +   '-webkit-overflow-scrolling:touch;opacity:0;pointer-events:none;transition:opacity .5s ease;}'
  + '.in-obj.ob-on{opacity:1;pointer-events:auto;}'
  + '.in-obj-inner{max-width:430px;margin:0 auto;padding:calc(18px + env(safe-area-inset-top)) 22px calc(28px + env(safe-area-inset-bottom));min-height:100%;'
  +   'display:flex;flex-direction:column;}'
  + '.in-topbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:26px;}'
  + '.in-dashes{display:flex;gap:6px;}'
  + '.in-dash{width:26px;height:4px;border-radius:2px;background:#E4DECB;}'
  + '.in-dash.on{background:#E0A21C;}'
  + '.in-pular{font-size:14px;font-weight:600;color:#9A9384;background:none;border:0;cursor:pointer;'
  +   'padding:6px 2px;font-family:inherit;}'
  + '.in-h1{font-family:"Source Serif 4",Georgia,serif;font-weight:600;color:#1C1A15;'
  +   'font-size:31px;line-height:1.18;letter-spacing:-.01em;margin-bottom:6px;}'
  + '.in-h1 em{font-style:italic;color:#B8860B;}'
  + '.in-sub{font-size:15px;color:#8B8574;margin-bottom:22px;}'

  + '.in-goals{display:flex;flex-direction:column;gap:12px;margin-bottom:24px;}'
  + '.in-goal{display:flex;align-items:center;gap:14px;background:#FFFFFF;border:1.5px solid #EDE7D6;'
  +   'border-radius:18px;padding:10px 14px 10px 10px;cursor:pointer;text-align:left;width:100%;'
  +   'font-family:inherit;transition:border-color .18s ease,box-shadow .18s ease,transform .12s ease;'
  +   'box-shadow:0 1px 2px rgba(60,50,20,.04);}'
  + '.in-goal:active{transform:scale(.985);}'
  + '.in-goal.sel{border-color:var(--gcolor);box-shadow:0 0 0 3px color-mix(in srgb,var(--gcolor) 18%,transparent),0 2px 8px rgba(60,50,20,.07);}'
  + '.in-tile{width:62px;height:62px;border-radius:14px;overflow:hidden;flex:0 0 62px;'
  +   'background:var(--gcolor);position:relative;}'
  + '.in-tile img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;'
  +   'transform:translate(var(--tx),var(--ty)) scale(var(--ts));transform-origin:center;}'
  + '.in-goal-txt{flex:1;min-width:0;}'
  + '.in-goal-title{font-size:16.5px;font-weight:700;color:#22201A;}'
  + '.in-goal-sub{font-size:12.5px;color:#98917F;margin-top:2px;}'
  + '.in-check{width:22px;height:22px;border-radius:50%;border:1.5px solid #E4DECB;flex:0 0 22px;'
  +   'display:flex;align-items:center;justify-content:center;transition:all .18s ease;}'
  + '.in-goal.sel .in-check{background:var(--gcolor);border-color:var(--gcolor);}'
  + '.in-check svg{width:12px;height:12px;opacity:0;transition:opacity .18s ease;}'
  + '.in-goal.sel .in-check svg{opacity:1;}'

  + '.in-name-lb{font-size:14px;font-weight:600;color:#4A453A;margin-bottom:8px;}'
  + '.in-name{width:100%;background:#FFFFFF;border:1.5px solid #EDE7D6;border-radius:16px;'
  +   'padding:15px 16px;font-size:16px;font-family:inherit;color:#22201A;outline:none;'
  +   'transition:border-color .18s ease;margin-bottom:22px;}'
  + '.in-name::placeholder{color:#B7B0A0;}'
  + '.in-name:focus{border-color:#E0A21C;}'

  + '.in-cta{margin-top:auto;width:100%;background:#E0A21C;color:#FFFFFF;border:0;border-radius:999px;'
  +   'padding:17px;font-size:17px;font-weight:700;font-family:inherit;cursor:pointer;'
  +   'box-shadow:0 6px 18px rgba(224,162,28,.32);transition:opacity .2s ease,transform .12s ease;}'
  + '.in-cta:active{transform:scale(.98);}'
  + '.in-cta[disabled]{opacity:.42;box-shadow:none;cursor:default;}'
  ;

  // ---- DOM ------------------------------------------------------------------
  function h(html){ var d=document.createElement('div'); d.innerHTML=html; return d.firstElementChild; }

  var style = document.createElement('style');
  style.textContent = CSS;

  var root = h('<div id="introRoot"></div>');

  var splash = h(
    '<div class="in-splash">'
    + '<div class="in-blob b1"></div><div class="in-blob b2"></div><div class="in-blob b3"></div>'
    + '<div class="in-stage">'
    +   '<img class="in-wordmark" src="' + ASSETS + 'wordmark-emma-yellow.png" alt="emma" draggable="false">'
    +   '<div class="in-dot"></div>'
    + '</div>'
    + '<div class="in-skip">toque para pular</div>'
    + '</div>');

  var goalsHTML = GOALS.map(function(g){
    return '<button type="button" class="in-goal" data-goal="' + g.id + '" data-path="' + g.path + '"'
      + ' style="--gcolor:' + g.color + '">'
      + '<span class="in-tile"><img src="' + ASSETS + g.img + '" alt="" draggable="false"'
      +   ' style="--ts:' + g.s + ';--tx:' + g.x + '%;--ty:' + g.y + '%"></span>'
      + '<span class="in-goal-txt"><span class="in-goal-title">' + g.label + '</span>'
      +   '<span class="in-goal-sub" style="display:block">' + g.sub + '</span></span>'
      + '<span class="in-check"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3.4"'
      +   ' stroke-linecap="round" stroke-linejoin="round"><path d="M4 12.5 10 18.5 20 6"/></svg></span>'
      + '</button>';
  }).join('');

  var obj = h(
    '<div class="in-obj"><div class="in-obj-inner">'
    + '<div class="in-topbar">'
    +   '<div class="in-dashes"><div class="in-dash on"></div><div class="in-dash"></div></div>'
    +   '<button type="button" class="in-pular">Pular</button>'
    + '</div>'
    + '<div class="in-h1">o que voc\u00ea quer<br>com o <em>ingl\u00eas</em>?</div>'
    + '<div class="in-sub">A Emma monta seu caminho a partir daqui.</div>'
    + '<div class="in-goals">' + goalsHTML + '</div>'
    + '<div class="in-name-lb">Qual seu nome?</div>'
    + '<input class="in-name" type="text" maxlength="24" autocomplete="given-name" placeholder="Seu primeiro nome">'
    + '<button type="button" class="in-cta" disabled>Come\u00e7ar</button>'
    + '</div></div>');

  root.appendChild(splash);
  root.appendChild(obj);

  function mount(){
    document.head.appendChild(style);
    document.body.appendChild(root);
    // position the dot's landing point once the wordmark has a size
    var wm = splash.querySelector('.in-wordmark');
    function place(){
      var w = wm.getBoundingClientRect().width || 260;
      var hgt = w * (166/931); // wordmark aspect
      var dot = splash.querySelector('.in-dot');
      dot.style.setProperty('--dotX', (w/2 + 14) + 'px'); // just past the "a"
      dot.style.setProperty('--dotY', (hgt/2 - 7) + 'px'); // on the baseline
      splash.classList.add('sp-go');
    }
    if(wm.complete) place(); else { wm.onload = place; setTimeout(place, 900); }
  }

  // ---- Marimba note (WebAudio, no asset) ------------------------------------
  var actx = null;
  function marimba(){
    try{
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if(actx.state === 'suspended'){ actx.resume().catch(function(){}); }
      var t = actx.currentTime;
      var out = actx.createGain();
      out.gain.setValueAtTime(0.0001, t);
      out.gain.exponentialRampToValueAtTime(0.5, t + 0.012);
      out.gain.exponentialRampToValueAtTime(0.0001, t + 1.0);
      out.connect(actx.destination);
      [[523.25, .5, 'sine', 1.0], [1046.5, .16, 'sine', .55], [2093, .05, 'triangle', .22]]
      .forEach(function(p){
        var o = actx.createOscillator(), g = actx.createGain();
        o.type = p[2]; o.frequency.value = p[0];
        g.gain.setValueAtTime(p[1], t);
        g.gain.exponentialRampToValueAtTime(0.0001, t + p[3]);
        o.connect(g); g.connect(out);
        o.start(t); o.stop(t + p[3] + .05);
      });
    }catch(e){ /* iOS pre-gesture: silent, by design */ }
  }

  // ---- Flow -----------------------------------------------------------------
  var timers = [];
  function later(fn, ms){ timers.push(setTimeout(fn, ms)); }
  function clearTimers(){ timers.forEach(clearTimeout); timers = []; }

  function toObjective(){
    clearTimers();
    if(splash.classList.contains('sp-out')) return;
    splash.classList.add('sp-out');
    obj.classList.add('ob-on');
    later(function(){ if(splash.parentNode) splash.parentNode.removeChild(splash); }, 600);
  }

  splash.addEventListener('click', function(){
    marimba(); // a tap unlocks audio; give the note on skip too
    toObjective();
  });

  // Splash timeline: reveal .45–1.7s, dot 1.5–2.85s (marimba at landing ~2.6s),
  // hold, then hand over at ~4.2s.
  later(marimba, 2600);
  later(toObjective, 4200);

  // ---- Objective screen wiring ---------------------------------------------
  var selected = null;
  var cta = obj.querySelector('.in-cta');
  var nameInput = obj.querySelector('.in-name');

  obj.querySelectorAll('.in-goal').forEach(function(btn){
    btn.addEventListener('click', function(){
      obj.querySelectorAll('.in-goal').forEach(function(b){ b.classList.remove('sel'); });
      btn.classList.add('sel');
      selected = { goal: btn.dataset.goal, path: btn.dataset.path };
      cta.disabled = false;
    });
  });

  nameInput.addEventListener('keydown', function(e){
    if(e.key === 'Enter'){ nameInput.blur(); if(!cta.disabled) cta.click(); }
  });

  function finish(save){
    if(save && !preview){
      try{
        localStorage.setItem(DONE_KEY, '1');
        var nm = (nameInput.value || '').trim().split(/\s+/)[0];
        if(nm) localStorage.setItem(NAME_KEY, nm.charAt(0).toUpperCase() + nm.slice(1));
        if(selected) localStorage.setItem(GOAL_KEY, selected.path);
      }catch(e){}
    }
    if(preview){
      try{ localStorage.setItem(DONE_KEY, localStorage.getItem(DONE_KEY) || ''); }catch(e){}
    }
    root.classList.add('intro-out');
    setTimeout(function(){
      if(root.parentNode) root.parentNode.removeChild(root);
      if(style.parentNode) style.parentNode.removeChild(style);
    }, 500);
    // Route: open the chosen path on mobile once home2 is ready.
    if(save && selected && window.innerWidth < 1024){
      var key = selected.path, tries = 0;
      (function attempt(){
        if(typeof window.openPathDetail === 'function'){
          try{ window.openPathDetail(key); }catch(e){}
          return;
        }
        if(++tries < 30) setTimeout(attempt, 250); // wait up to ~7.5s for home2
      })();
    }
  }

  obj.querySelector('.in-pular').addEventListener('click', function(){
    if(!preview){ try{ localStorage.setItem(DONE_KEY, '1'); }catch(e){} }
    finish(false);
  });
  cta.addEventListener('click', function(){ finish(true); });

  // ---- Go -------------------------------------------------------------------
  if(document.body) mount();
  else document.addEventListener('DOMContentLoaded', mount);
})();

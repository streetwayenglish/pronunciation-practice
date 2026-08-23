// ============================================================================
// BEGINNER MODULE — additive glue. Adds a "Beginner" path (video-based lesson
// player) to Street Way English WITHOUT modifying any existing file.
//
// Load order: AFTER curriculum.js / home.js / paths-ui.js (it patches their
// globals at runtime) and BEFORE init.js (so the picker renders with Beginner
// already present). In index.html, add the <script> tag right before init.js.
//
// The player itself is the self-contained "beginner-player.html", mounted in a
// same-origin <iframe> (#beginnerFrame) inside the #beginnerPlayer layer — so
// none of its CSS/JS can collide with the app. The player reports back via
// postMessage: {source:'swb-beginner', type:'unit-complete'|'close'|'ready'}.
// ============================================================================
(function(){
  'use strict';

  // Path to the production player file (sits next to index.html, same origin)
  var PLAYER_URL = 'beginner-player.html';

  // 20 unit titles — must match lesson_timestamps.json in the player build.
  var BEGINNER_TITLES = [
    "Greetings & Survival Phrases",
    "To Be: Introduction",
    "To Be + Location, Subject Pronouns",
    "Present Continuous",
    "To Be: Short Answers, Possessive Adjectives",
    "To Be: Yes/No, Adjectives, Weather",
    "Prepositions of Location, Family",
    "There Is/There Are + Directions",
    "This/That/These/Those, Shopping",
    "Numbers, Money, Time",
    "Simple Present (Routines)",
    "Simple Present: Negatives & Questions",
    "Object Pronouns, Have/Has, Adverbs of Frequency",
    "Simple Present vs. Continuous, Feelings",
    "Food & Restaurants",
    "Can, Have to (Ability, Jobs, Invitations)",
    "Future: Going to, Want to",
    "Past Tense: Regular & Intro Irregular",
    "Past Tense: Questions & More Irregular Verbs",
    "To Be: Past Tense"
  ];

  var SWBeginner = window.SWBeginner = { _unit: 1 };

  // ── 1. Register Beginner as the FIRST path ───────────────────────────────
  function registerPath(){
    if(typeof CURRICULUM === 'undefined') return;
    if(CURRICULUM['Beginner']) return;
    var units = BEGINNER_TITLES.map(function(t, i){
      return { unit: i + 1, title: t, objective: '', expressions: [] };
    });
    // Rebuild the object so Beginner is the first key (desktop sidebar reads
    // Object.keys order; this puts it above Conversation).
    var reordered = { 'Beginner': units };
    for(var k in CURRICULUM){
      if(CURRICULUM.hasOwnProperty(k)) reordered[k] = CURRICULUM[k];
    }
    CURRICULUM = reordered;

    // Mobile Paths list order + desktop sidebar category label.
    try{ if(typeof mhPathOrder !== 'undefined' && mhPathOrder.indexOf('Beginner') < 0) mhPathOrder.unshift('Beginner'); }catch(e){}
    try{ if(typeof SW_CATEGORIES !== 'undefined') SW_CATEGORIES['Beginner'] = 'Beginner'; }catch(e){}
  }

  function isBeginner(topic){ return topic === 'Beginner'; }

  // ── 2. Branch the launch seams (wrap, don't replace) ─────────────────────
  function patchLaunchers(){
    // Desktop: unit-row clicks + CTA -> swStart(unitNum)
    if(typeof swStart === 'function'){
      var _swStart = swStart;
      window.swStart = swStart = function(unitNum){
        var t = (typeof swState !== 'undefined' && swState) ? swState.topic : null;
        if(isBeginner(t)){
          if(!unitNum){ try{ unitNum = (getProgress('Beginner').unit) || 1; }catch(e){ unitNum = 1; } }
          return SWBeginner.openUnit(unitNum);
        }
        return _swStart.apply(this, arguments);
      };
    }

    // Mobile Today "Begin"
    if(typeof mhBegin === 'function'){
      var _mhBegin = mhBegin;
      window.mhBegin = mhBegin = function(){
        if(isBeginner(currentPath())){
          var u = 1; try{ u = (getProgress('Beginner').unit) || 1; }catch(e){}
          return SWBeginner.openUnit(u);
        }
        return _mhBegin.apply(this, arguments);
      };
    }

    // Mobile "View all units" / featured card -> curriculum overlay
    if(typeof mhOpenUnits === 'function'){
      var _mhOpenUnits = mhOpenUnits;
      window.mhOpenUnits = mhOpenUnits = function(){
        if(isBeginner(currentPath())){ return openBeginnerMap(); }
        return _mhOpenUnits.apply(this, arguments);
      };
    }

    // Legacy desktop .pa-list (not shown in current design, guarded anyway)
    if(typeof selectAndStart === 'function'){
      var _selectAndStart = selectAndStart;
      window.selectAndStart = selectAndStart = function(topicName){
        if(isBeginner(topicName)){ return openBeginnerMap(); }
        return _selectAndStart.apply(this, arguments);
      };
    }
  }

  function currentPath(){
    try{ if(typeof mhGetCurrentPath === 'function') return mhGetCurrentPath(); }catch(e){}
    return (typeof window._lastTopic !== 'undefined') ? window._lastTopic : null;
  }

  // Show the Beginner unit picker (reuses the app's existing overlay) and open
  // the chosen unit in the player.
  // Warm the browser cache with the unit's first lesson video so the player's
  // "Começar" screen paints its frame instantly instead of waiting on R2.
  var VID_BASE = 'https://pub-1112a80e0e81459f8c4ea5c4c62428c2.r2.dev';
  // Custom hero-frame times from the player config. Warming these exact byte
  // ranges (via a hidden seek) makes the "Começar" frame appear instantly.
  var THUMB_TIMES = {'1-b':'last','3-b':7.8958,'4-b':2.0625,'5-b':0.2708,'6-a':1.8958,'17-a':'last','20-b':1.8958};
  function _warmVideo(url, thumbKey){
    var pv = document.createElement('video');
    pv.preload = 'auto'; pv.muted = true; pv.src = url;
    var t = THUMB_TIMES[thumbKey];
    if(t !== undefined){
      pv.addEventListener('loadedmetadata', function(){
        try{
          var tg = (t === 'last') ? Math.max(0, pv.duration - 0.05) : t;
          pv.currentTime = tg; // forces the browser to fetch these bytes into cache
        }catch(e){}
      });
    }
    pv.load();
    return pv;
  }
  function _preloadUnitVideo(n){
    try{
      n = parseInt(n,10) || 1;
      if(window._bpPreloadUnit === n) return; // already warming this unit
      window._bpPreloadUnit = n;
      var nn = (n<10?'0':'')+n;
      var ia = new Image(); ia.src = VID_BASE + '/lesson-' + nn + '-a.jpg';
      var ib = new Image(); ib.src = VID_BASE + '/lesson-' + nn + '-b.jpg';
      window._bpPreload = [
        ia, ib, // hero posters — tiny, paint the Começar screen instantly
        _warmVideo(VID_BASE + '/lesson-' + nn + '-a.mp4', n + '-a'),
        _warmVideo(VID_BASE + '/lesson-' + nn + '-b.mp4', n + '-b')
      ]; // keep references so they aren't GC'd mid-load
    }catch(e){}
  }

  function openBeginnerMap(){
    window._lastTopic = 'Beginner';
    window._emmaTopic = 'Beginner';
    try{
      var u = 1;
      if(typeof getProgress === 'function'){ var pr = getProgress('Beginner'); if(pr && pr.unit) u = pr.unit; }
      _preloadUnitVideo(u);
    }catch(e){}
    if(typeof showCurriculumProgress === 'function'){
      showCurriculumProgress('Beginner', function(){
        SWBeginner.openUnit(window._cpSelectedUnit || 1);
      });
    }
  }

  // ── 3. Open / close the player iframe ────────────────────────────────────
  function hideAppLayers(){
    ['swDesktop','topicPage','mobileHome','mhNameScreen'].forEach(function(id){
      var e = document.getElementById(id); if(e) e.style.display = 'none';
    });
    var main = document.querySelector('.main'); if(main) main.style.display = 'none';
    var hdr  = document.querySelector('.hdr');  if(hdr)  hdr.style.display  = 'none';
    var cp = document.getElementById('cpOverlay'); if(cp) cp.remove();
    var h2 = document.getElementById('home2Layer'); if(h2) h2.style.display = 'none';
  }

  SWBeginner.openUnit = function(n, part){
    n = n || 1;
    _preloadUnitVideo(n);
    SWBeginner._unit = n;
    window._lastTopic = 'Beginner';
    window._emmaTopic = 'Beginner';
    if(typeof swState !== 'undefined' && swState) swState.topic = 'Beginner';
    var layer = document.getElementById('beginnerPlayer');
    var frame = document.getElementById('beginnerFrame');
    if(!layer || !frame){ Log.w('[Beginner] #beginnerPlayer / #beginnerFrame missing in index.html'); return; }
    document.body.classList.remove('show-topics');
    hideAppLayers();
    // Reveal first, then set src — iOS won't load an iframe that was hidden
    // when its src was assigned. Cache-bust forces a fresh load each open.
    layer.style.display = 'block';
    var p = parseInt(part, 10);
    var frag = '#u=' + n + ((p >= 1 && p <= 3) ? '&p=' + p : '');
    var url = PLAYER_URL + '?t=' + Date.now() + frag;
    requestAnimationFrame(function(){ frame.src = url; });
  };

  SWBeginner.close = function(){
    var layer = document.getElementById('beginnerPlayer');
    var frame = document.getElementById('beginnerFrame');
    if(layer) layer.style.display = 'none';
    if(frame) frame.src = 'about:blank';
    window._lastTopic = 'Beginner';
    window._emmaTopic = 'Beginner';
    if(typeof swState !== 'undefined' && swState) swState.topic = 'Beginner';
    // Clean up the legacy overlay if it's lingering, then return to the home.
    var cp = document.getElementById('cpOverlay'); if(cp) cp.remove();
    // The new home IS the unit map now, and it keeps its place while hidden —
    // so just reveal it again (showTopicPage -> showHome2 on mobile). No old
    // "Choose your unit" overlay.
    if(typeof showTopicPage === 'function') showTopicPage();
  };

  // ── 4. Listen for the player's messages ──────────────────────────────────
  window.addEventListener('message', function(e){
    var d = e.data;
    if(!d || d.source !== 'swb-beginner') return;
    if(d.type === 'unit-complete'){
      var n = parseInt(d.unit, 10) || SWBeginner._unit || 1;
      try{
        var p = getProgress('Beginner');
        if((p.unit || 1) <= n){          // only advance the frontier, never regress
          p.unit = Math.min(20, n + 1);
          p.expressionIndex = 0;
          saveProgress('Beginner', p);
        }
      }catch(err){}
      SWBeginner.close();
    } else if(d.type === 'close'){
      SWBeginner.close();
    }
    // d.type === 'ready' -> player loaded; nothing required.
  });

  // ── boot ─────────────────────────────────────────────────────────────────
  registerPath();
  patchLaunchers();
})();

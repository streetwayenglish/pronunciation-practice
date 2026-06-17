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
  function openBeginnerMap(){
    window._lastTopic = 'Beginner';
    window._emmaTopic = 'Beginner';
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

  SWBeginner.openUnit = function(n){
    n = n || 1;
    SWBeginner._unit = n;
    window._lastTopic = 'Beginner';
    window._emmaTopic = 'Beginner';
    if(typeof swState !== 'undefined' && swState) swState.topic = 'Beginner';
    var layer = document.getElementById('beginnerPlayer');
    var frame = document.getElementById('beginnerFrame');
    if(!layer || !frame){ console.warn('[Beginner] #beginnerPlayer / #beginnerFrame missing in index.html'); return; }
    document.body.classList.remove('show-topics');
    hideAppLayers();
    // Cache-bust query forces a fresh load each open so #u= re-navigates.
    frame.src = PLAYER_URL + '?t=' + Date.now() + '#u=' + n;
    layer.style.display = 'block';
  };

  SWBeginner.close = function(){
    var layer = document.getElementById('beginnerPlayer');
    var frame = document.getElementById('beginnerFrame');
    if(layer) layer.style.display = 'none';
    if(frame) frame.src = 'about:blank';
    // Return to the Beginner unit map.
    window._lastTopic = 'Beginner';
    window._emmaTopic = 'Beginner';
    if(typeof swState !== 'undefined' && swState) swState.topic = 'Beginner';
    if(typeof showTopicPage === 'function') showTopicPage();
    // On mobile, showTopicPage lands on Today — reopen the unit overlay so the
    // student is literally back on the unit map (desktop already shows it).
    if(window.innerWidth < 1024){ openBeginnerMap(); }
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

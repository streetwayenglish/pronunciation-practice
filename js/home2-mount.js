// ============================================================================
// HOME2 MOUNT (no-iframe). On mobile (<1024px) the app's home becomes the new
// design. It is injected DIRECTLY into the page (not an iframe, so no server
// framing header or iOS frame quirk can blank it), with all of its CSS scoped
// under #h2root via the browser's own CSS engine — so its styles can't leak
// into the app and the app's styles are kept out. The look stays intact.
//
// Source of truth is still home2.html (fetched at runtime), so you keep editing
// that one file. Desktop (>=1024px) is untouched.
//
// Load AFTER home.js (wraps showTopicPage) and before init.js.
// Uses the existing <div id="home2Layer"> as the container (its iframe child is
// discarded). No change to index.html required.
// ============================================================================
(function(){
  'use strict';
  var FILE = 'home2.html';
  var built = false, building = null;

  function layerEl(){ return document.getElementById('home2Layer'); }

  // ---- CSS scoping using the browser's parser (correct, not regex) ----------
  function scopeCSS(css, scope){
    try{
      var sheet = new CSSStyleSheet();
      sheet.replaceSync(css);
      return walk(sheet.cssRules);
    }catch(e){
      console.warn('[home2] CSS scope fallback', e);
      return basicScope(css, scope);
    }
    function walk(rules){
      var out = '';
      for(var i=0;i<rules.length;i++){
        var r = rules[i];
        if(r.selectorText !== undefined){
          out += pfx(r.selectorText) + '{' + r.style.cssText + '}';
        } else if(r.media){
          out += '@media ' + r.media.mediaText + '{' + walk(r.cssRules) + '}';
        } else if(r.cssRules && r.conditionText !== undefined){
          out += '@supports ' + r.conditionText + '{' + walk(r.cssRules) + '}';
        } else {
          out += r.cssText;
        }
      }
      return out;
    }
    function pfx(sel){
      return sel.split(',').map(function(s){
        s = s.trim();
        if(!s) return s;
        if(s.indexOf(scope) === 0) return s;
        if(s === ':root' || s === 'html' || s === 'body') return scope;
        var m = s.match(/^(?:html|body)([.:#\[ >~+].*)$/);
        if(m) return scope + m[1];
        return scope + ' ' + s;
      }).join(',');
    }
  }
  function basicScope(css, scope){
    return css.replace(/(^|\})([^{}@]+)\{/g, function(_, a, sel){
      var s = sel.split(',').map(function(x){
        x = x.trim(); if(!x) return x;
        if(x === 'body' || x === 'html' || x === ':root') return scope;
        return scope + ' ' + x;
      }).join(',');
      return a + s + '{';
    });
  }

  // ---- Build the home once --------------------------------------------------
  function build(){
    if(built) return Promise.resolve();
    if(building) return building;
    var host = layerEl();
    if(!host) return Promise.reject(new Error('home2Layer missing'));
    building = fetch(FILE).then(function(r){ return r.text(); }).then(function(txt){
      var doc = new DOMParser().parseFromString(txt, 'text/html');

      doc.querySelectorAll('link[rel="stylesheet"]').forEach(function(l){
        var href = l.getAttribute('href'); if(!href) return;
        if(!document.querySelector('link[data-h2="1"][href="'+href+'"]')){
          var nl = document.createElement('link');
          nl.rel = 'stylesheet'; nl.href = href; nl.setAttribute('data-h2','1');
          document.head.appendChild(nl);
        }
      });

      var rawCSS = '';
      doc.querySelectorAll('style').forEach(function(s){ rawCSS += '\n' + s.textContent; });
      var st = document.getElementById('h2root-style') || document.createElement('style');
      st.id = 'h2root-style';
      st.textContent = scopeCSS(rawCSS, '#h2root');
      document.head.appendChild(st);

      var b = doc.body;
      var scripts = [];
      b.querySelectorAll('script').forEach(function(s){ scripts.push(s.textContent); s.remove(); });
      host.innerHTML = '';
      var root = document.createElement('div');
      root.id = 'h2root';
      root.innerHTML = b.innerHTML;
      host.appendChild(root);

      var code = scripts.join('\n');
      code = 'var H2=document.getElementById("h2root");\n' +
             code.replace(/document\.body/g, 'H2')
                 .replace(/document\.querySelectorAll/g, 'H2.querySelectorAll')
                 .replace(/document\.querySelector/g, 'H2.querySelector');
      var sc = document.createElement('script');
      sc.textContent = code;
      document.body.appendChild(sc);

      built = true;
    });
    return building;
  }

  function sizeRoot(){
    var r = document.getElementById('h2root');
    if(r){
      r.style.position = 'relative';
      r.style.width = '100%';
      r.style.height = '100vh';
      r.style.height = '100dvh';
      r.style.overflow = 'hidden';
    }
  }
  // ---- Content wiring: Beginner accordion + topic launches ------------------
  var UNITS = [{"n":1,"t":"Hello & First Words","g":"Greetings & Survival Phrases","l":["Meeting someone","When you don't understand","About You + Review"]},{"n":2,"t":"Talking About Yourself","g":"To Be: Introduction","l":["Introducing yourself","Where are you from?","About You + Review"]},{"n":3,"t":"Where Things Are","g":"To Be + Location, Subject Pronouns","l":["Looking for your things","Where's the room?","Grammar + Review"]},{"n":4,"t":"Right Now","g":"Present Continuous","l":["What are you doing?","Busy at home","About You + Review"]},{"n":5,"t":"Yes, No & What's Mine","g":"To Be: Short Answers, Possessive Adjectives","l":["Is this yours?","Whose is it?","Grammar + Review"]},{"n":6,"t":"How's the Weather?","g":"To Be: Yes/No, Adjectives, Weather","l":["A rainy morning","Checking in","Grammar + Review"]},{"n":7,"t":"Family & Where Things Are","g":"Prepositions of Location, Family","l":["Family photos","Where's the key?","Review"]},{"n":8,"t":"Finding Your Way","g":"There Is/There Are + Directions","l":["Exploring the street","Asking for directions","Grammar + Review"]},{"n":9,"t":"Let's Go Shopping","g":"This/That/These/Those, Shopping","l":["At the shop","This or that?","Grammar + Review"]},{"n":10,"t":"Numbers, Money & Time","g":"Numbers, Money, Time","l":["Ordering & paying","What time is it?","Review"]},{"n":11,"t":"Daily Routines","g":"Simple Present (Routines)","l":["Your morning","Everyday habits","About You + Review"]},{"n":12,"t":"Likes & Dislikes","g":"Simple Present: Negatives & Questions","l":["Talking about hobbies","Do you...?","Grammar + Review"]},{"n":13,"t":"Him, Her & How Often","g":"Object Pronouns, Have/Has, Adverbs of Frequency","l":["Talking about work","Showing a photo","Review"]},{"n":14,"t":"How Are You Feeling?","g":"Simple Present vs. Continuous, Feelings","l":["Tired at work","First-day nerves","About You + Review"]},{"n":15,"t":"Eating Out","g":"Food & Restaurants","l":["At the restaurant","Ordering coffee","Grammar + Review"]},{"n":16,"t":"Can You? I Have To","g":"Can, Have to (Ability, Jobs, Invitations)","l":["The job interview","Can you help?","Grammar + Review"]},{"n":17,"t":"Plans & Dreams","g":"Future: Going to, Want to","l":["Planning a trip","What do you want to do?","About You + Review"]},{"n":18,"t":"Talking About the Past","g":"Past Tense: Regular & Intro Irregular","l":["At the doctor","What happened?","Grammar + Review"]},{"n":19,"t":"What Did You Do?","g":"Past Tense: Questions & More Irregular Verbs","l":["Running late","How was your weekend?","Grammar + Review"]},{"n":20,"t":"Back Then","g":"To Be: Past Tense","l":["Old school days","Grandpa's story","Grammar + Review"]}];

  // home2 data-path -> CURRICULUM key (for the 5 topic paths)
  var TOPIC_MAP = {
    'conversation':'Conversation',
    'business-english':'Business English',
    'travel-english':'Travel English',
    'job-interview':'Job Interview',
    'bible':'The Bible in English'
  };

  function esc(s){ return String(s).replace(/[&<>"]/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]; }); }

  function unitHTML(u){
    var lessons = u.l.map(function(name, i){
      return '<div class="lesson u-lesson" data-unit="'+u.n+'" data-part="'+(i+1)+'">'+
               '<div class="lesson-num">'+(i+1)+'</div>'+
               '<div class="lesson-info"><div class="lesson-name">'+esc(name)+'</div></div>'+
             '</div>';
    }).join('');
    return '<div class="level u-acc" data-unit="'+u.n+'">'+
             '<div class="level-header u-acc-head">'+
               '<div class="u-acc-icon">'+u.n+'</div>'+
               '<div class="level-content" style="min-width:0">'+
                 '<div class="level-name">Unit '+u.n+' · '+esc(u.t)+'</div>'+
                 '<div class="level-desc">'+esc(u.g)+'</div>'+
               '</div>'+
               '<span class="u-acc-now"></span>'+
               '<svg class="u-acc-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'+
             '</div>'+
             '<div class="lessons">'+lessons+'</div>'+
           '</div>';
  }

  function injectAccordionCSS(){
    if(document.getElementById('h2root-accordion')) return;
    var css =
      '#h2root .level.u-acc{display:block;background:#fff;border-radius:16px;padding:2px 12px;margin-bottom:9px;box-shadow:0 4px 12px -7px rgba(0,0,0,.12);cursor:pointer;}'+
      '#h2root .level.u-acc .u-acc-head{display:flex;align-items:center;gap:12px;padding:11px 2px;}'+
      '#h2root .level.u-acc .level-content{flex:1;min-width:0;}'+
      '#h2root .level.u-acc .level-name{font-size:14.5px;}'+
      '#h2root .u-acc-icon{width:30px;height:30px;flex-shrink:0;border-radius:50%;background:#f1ebde;color:#8a7d63;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;}'+
      '#h2root .u-acc-chev{flex-shrink:0;color:#c2b69c;transition:transform .2s;}'+
      '#h2root .level.u-acc.expanded .u-acc-chev{transform:rotate(90deg);}'+
      // unit states
      '#h2root .level.u-acc.done{background:rgba(255,255,255,.66);}'+
      '#h2root .level.u-acc.done .u-acc-icon{background:#E8F5E4;color:#5BA84D;}'+
      '#h2root .level.u-acc.done .level-name{color:#7a6f5d;}'+
      '#h2root .level.u-acc.current .u-acc-icon{background:#EBAA1C;color:#2a2208;}'+
      '#h2root .level.u-acc.current .level-name{color:#0a0a0a;font-weight:800;}'+
      '#h2root .level.u-acc.locked{background:rgba(255,255,255,.5);box-shadow:none;}'+
      '#h2root .level.u-acc.locked .u-acc-icon{background:#f1ebde;color:#c2b49a;}'+
      '#h2root .level.u-acc.locked .level-name{color:#a89c80;}'+
      '#h2root .level.u-acc.locked .level-desc{color:#bcae92;}'+
      '#h2root .u-acc-icon svg{width:15px;height:15px;}'+
      '#h2root .u-acc-now{font-size:9.5px;font-weight:800;letter-spacing:.07em;color:#C8901A;flex-shrink:0;}'+
      // lesson states
      '#h2root .u-lesson.done .lesson-num{background:#E8F5E4;color:#5BA84D;}'+
      '#h2root .u-lesson.done .lesson-num svg{width:13px;height:13px;}'+
      '#h2root .u-lesson.done .lesson-name{color:#8a7d63;}'+
      '#h2root .u-lesson.current .lesson-num{background:#1f1b17;color:#fff;}'+
      '#h2root .u-lesson.current .lesson-name{font-weight:700;}'+
      // summary line
      '#h2root .u-summary{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#a89c80;padding:0 4px 12px;}'+
      '#h2root .level.u-acc .lessons{display:none;padding:0 2px 8px;}'+
      '#h2root .level.u-acc.expanded .lessons{display:flex;}'+
      '#h2root .u-lesson{cursor:pointer;}'+
      '#h2root .t-lvl-status{font-size:11px;font-weight:800;color:#b0a388;flex-shrink:0;letter-spacing:.02em;}'+
      '#h2root .level.u-acc.t-level.current .t-lvl-status{color:#C8901A;}'+
      '#h2root .level.u-acc.t-level.done .t-lvl-status{color:#5BA84D;}'+
      '#h2root .u-tlesson.locked .lesson-name{color:#a89c80;}'+
      '#h2root .u-tlesson.locked .lesson-meta{color:#bcae92;}';
    var st = document.createElement('style');
    st.id = 'h2root-accordion';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function launchTopic(key){
    // Set the app's current path + topic globals (warmup reads window._emmaTopic).
    try{ if(typeof window.mhSetCurrentPath === 'function') mhSetCurrentPath(key); }catch(e){}
    window._lastTopic = key;
    window._emmaTopic = key;
    try{ window.emmaTopic = key; }catch(e){}
    // Hide the new home so warmup/Emma (rendered in .main) isn't covered by it.
    var hl = document.getElementById('home2Layer'); if(hl) hl.style.display = 'none';
    document.body.classList.remove('show-topics');
    ['topicPage','mobileHome','swDesktop'].forEach(function(id){
      var e = document.getElementById(id); if(e) e.style.display = 'none';
    });
    var hdr  = document.querySelector('.hdr');  if(hdr)  hdr.style.display  = '';
    var main = document.querySelector('.main'); if(main) main.style.display = '';
    // Straight to warmup -> Emma (mirrors mhBegin; no curriculum picker).
    try{ if(typeof window._wuGo === 'function') return window._wuGo(); }catch(e){}
    try{ if(typeof window.switchMode === 'function') return switchMode('emma'); }catch(e){}
    console.warn('[home2] no warmup/emma launcher for', key);
  }

  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var LOCK  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';
  var STACK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="12 3 3 7.5 12 12 21 7.5 12 3"/><polyline points="3 16.5 12 21 21 16.5"/><polyline points="3 12 12 16.5 21 12"/></svg>';

  function currentUnit(){
    try{ var p = window.getProgress && getProgress('Beginner'); if(p && p.unit) return Math.min(20, Math.max(1, p.unit|0)); }catch(e){}
    return 1;
  }
  function partDone(u, p){
    try{ return localStorage.getItem('swp_' + u + '_' + p) === '1'; }catch(e){ return false; }
  }

  var autoExpanded = false;
  function refreshBeginnerStates(){
    var R = document.getElementById('h2root'); if(!R) return;
    var starter = R.querySelector('.detail-screen[data-path="starter"]'); if(!starter) return;
    var cur = currentUnit();
    starter.querySelectorAll('.level.u-acc').forEach(function(lv){
      var n = parseInt(lv.getAttribute('data-unit'), 10);
      lv.classList.remove('done','current','locked');
      var icon = lv.querySelector('.u-acc-icon');
      var now  = lv.querySelector('.u-acc-now');
      if(n < cur){ lv.classList.add('done'); if(icon) icon.innerHTML = CHECK; if(now) now.textContent = ''; }
      else if(n === cur){ lv.classList.add('current'); if(icon) icon.textContent = String(n); if(now) now.textContent = 'NOW'; }
      else { lv.classList.add('locked'); if(icon) icon.innerHTML = LOCK; if(now) now.textContent = ''; }

      // lessons within this unit
      var pendingMarked = false;
      lv.querySelectorAll('.u-lesson').forEach(function(ls){
        var p = parseInt(ls.getAttribute('data-part'), 10);
        var numEl = ls.querySelector('.lesson-num');
        ls.classList.remove('done','current');
        if(partDone(n, p)){
          ls.classList.add('done'); if(numEl) numEl.innerHTML = CHECK;
        } else {
          if(numEl) numEl.textContent = String(p);
          // first not-done lesson in the current unit = the active one
          if(n === cur && !pendingMarked){ ls.classList.add('current'); pendingMarked = true; }
        }
      });
    });

    var sum = starter.querySelector('#uSummary');
    if(sum) sum.textContent = (cur - 1) + ' of 20 complete';

    // auto-expand the current unit once
    if(!autoExpanded){
      var cl = starter.querySelector('.level.u-acc[data-unit="' + cur + '"]');
      if(cl) cl.classList.add('expanded');
      autoExpanded = true;
    }
  }

  // ---- Topic paths: 4 Levels x 5 lessons, from real CURRICULUM -------------
  function topicLevelsHTML(topicKey, units){
    var per = Math.ceil(units.length / 4) || 1;
    var html = '';
    for(var L = 0; L < 4; L++){
      var slice = units.slice(L * per, (L + 1) * per);
      if(!slice.length) continue;
      var first = slice[0].unit, last = slice[slice.length - 1].unit;
      var lessons = slice.map(function(u){
        var t = u.title || ('Unit ' + u.unit);
        var g = u.grammar || u.objective || '';
        return '<div class="lesson u-lesson u-tlesson" data-topic="' + esc(topicKey) + '" data-unit="' + u.unit + '">'+
                 '<div class="lesson-num">' + u.unit + '</div>'+
                 '<div class="lesson-info"><div class="lesson-name">' + esc(t) + '</div>' +
                   (g ? '<div class="lesson-meta">' + esc(g) + '</div>' : '') + '</div>'+
               '</div>';
      }).join('');
      html += '<div class="level u-acc t-level" data-topic="' + esc(topicKey) + '" data-level="' + L + '" data-first="' + first + '" data-last="' + last + '">'+
                '<div class="level-header u-acc-head">'+
                  '<div class="u-acc-icon"></div>'+
                  '<div class="level-content" style="min-width:0">'+
                    '<div class="level-name">Level ' + (L + 1) + '</div>'+
                    '<div class="level-desc">Units ' + first + '\u2013' + last + '</div>'+
                  '</div>'+
                  '<span class="u-acc-now"></span>'+
                  '<span class="t-lvl-status"></span>'+
                  '<svg class="u-acc-chev" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>'+
                '</div>'+
                '<div class="lessons">' + lessons + '</div>'+
              '</div>';
    }
    return html;
  }

  function launchTopicUnit(topicKey, unitNum){
    try{ recordActivity(); }catch(e){}
    try{ minLaunch(); }catch(e){}
    try{ if(typeof swState !== 'undefined' && swState){ swState.topic = topicKey; } }catch(e){}
    try{ if(typeof window.mhSetCurrentPath === 'function') mhSetCurrentPath(topicKey); }catch(e){}
    window._lastTopic = topicKey;
    window._emmaTopic = topicKey;
    try{ window.emmaTopic = topicKey; }catch(e){}
    var hl = document.getElementById('home2Layer'); if(hl) hl.style.display = 'none';
    // swStart sets the unit, saves progress, and goes to warmup -> Emma.
    if(typeof window.swStart === 'function'){ window.swStart(unitNum); return; }
    launchTopic(topicKey); // fallback: continue current unit
  }

  function refreshTopicStates(){
    var R = document.getElementById('h2root'); if(!R) return;
    Object.keys(TOPIC_MAP).forEach(function(pk){
      var ck = TOPIC_MAP[pk];
      var ds = R.querySelector('.detail-screen[data-path="' + pk + '"]'); if(!ds) return;
      var cur = 1, total = 0;
      try{ var p = window.getProgress && getProgress(ck); cur = (p && p.unit) || 1; }catch(e){}
      try{ total = (window.CURRICULUM && CURRICULUM[ck]) ? CURRICULUM[ck].length : 0; }catch(e){}

      ds.querySelectorAll('.t-level').forEach(function(lv){
        var L = parseInt(lv.getAttribute('data-level'), 10);
        var first = parseInt(lv.getAttribute('data-first'), 10);
        var last  = parseInt(lv.getAttribute('data-last'), 10);
        lv.classList.remove('done','current','locked');
        var icon = lv.querySelector('.u-acc-icon');
        var now  = lv.querySelector('.u-acc-now');
        var st   = lv.querySelector('.t-lvl-status');
        if(last < cur){ lv.classList.add('done'); if(icon) icon.innerHTML = CHECK; if(now) now.textContent = ''; }
        else if(first <= cur && cur <= last){ lv.classList.add('current'); if(icon) icon.innerHTML = STACK; if(now) now.textContent = 'NOW'; }
        else { lv.classList.add('locked'); if(icon) icon.innerHTML = LOCK; if(now) now.textContent = ''; }

        var doneCount = 0, size = 0;
        lv.querySelectorAll('.u-tlesson').forEach(function(ls){
          size++;
          var n = parseInt(ls.getAttribute('data-unit'), 10);
          var numEl = ls.querySelector('.lesson-num');
          ls.classList.remove('done','current','locked');
          if(n < cur){ ls.classList.add('done'); if(numEl) numEl.innerHTML = CHECK; doneCount++; }
          else if(n === cur){ ls.classList.add('current'); if(numEl) numEl.textContent = String(n); }
          else { ls.classList.add('locked'); if(numEl) numEl.textContent = String(n); }
        });
        if(st) st.textContent = doneCount + '/' + size;

        // auto-expand the current level once
        if(lv.classList.contains('current') && !lv.getAttribute('data-ax')){
          lv.classList.add('expanded'); lv.setAttribute('data-ax', '1');
        }
      });

      var sum = ds.querySelector('[data-topic-sum="' + pk + '"]');
      if(sum) sum.textContent = (cur - 1) + (total ? ' of ' + total : '') + ' complete';
    });
  }

  // home2 data-path -> CURRICULUM key, including starter -> Beginner
  var PATH_TO_CURRIC = {
    'starter':'Beginner',
    'conversation':'Conversation',
    'business-english':'Business English',
    'travel-english':'Travel English',
    'job-interview':'Job Interview',
    'bible':'The Bible in English'
  };
  function pathPct(curricKey){
    try{
      var p = window.getProgress && getProgress(curricKey);
      var unit = (p && p.unit) || 1;
      var total = (window.CURRICULUM && CURRICULUM[curricKey] && CURRICULUM[curricKey].length)
                  ? CURRICULUM[curricKey].length : (curricKey === 'Beginner' ? 20 : 0);
      if(!total) return null;
      return Math.max(0, Math.min(100, Math.round((unit - 1) / total * 100)));
    }catch(e){ return null; }
  }
  // ---- Streak + units-done (real metrics) -----------------------------------
  function _dstr(d){ return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function _today(){ return _dstr(new Date()); }
  function _yesterday(){ var d = new Date(); d.setDate(d.getDate() - 1); return _dstr(d); }
  function recordActivity(){
    try{
      var today = _today();
      var last = localStorage.getItem('streetway_streak_date');
      var count = parseInt(localStorage.getItem('streetway_streak') || '0', 10) || 0;
      if(last === today) return;             // already counted today
      if(last === _yesterday()) count += 1;  // consecutive day
      else count = 1;                        // first day / streak restarted
      localStorage.setItem('streetway_streak', String(count));
      localStorage.setItem('streetway_streak_date', today);
    }catch(e){}
  }
  function displayStreak(){
    try{
      var last = localStorage.getItem('streetway_streak_date');
      var count = parseInt(localStorage.getItem('streetway_streak') || '0', 10) || 0;
      if(!last) return 0;
      if(last === _today() || last === _yesterday()) return count;  // still alive
      return 0;                                                     // broken
    }catch(e){ return 0; }
  }
  function totalUnitsDone(){  // completed UNITS (Today screen "Units done"): topic units + Starter units
    var t = 0, hasBeg = false;
    try{ for(var k in CURRICULUM){ if(k === 'Beginner') hasBeg = true; t += Math.max(0, (getProgress(k).unit || 1) - 1); } }catch(e){}
    try{ if(!hasBeg) t += Math.max(0, (getProgress('Beginner').unit || 1) - 1); }catch(e){}  // only if not already in CURRICULUM
    return t;
  }
  function _starterLessonsDone(){  // Starter inner lessons: 3 parts/unit, persisted by the player as swp_<unit>_<part>
    var n = 0;
    for(var u = 1; u <= 20; u++){ for(var p = 1; p <= 3; p++){
      try{ if(localStorage.getItem('swp_' + u + '_' + p) === '1') n++; }catch(e){}
    } }
    return n;
  }
  function totalLessonsDone(){  // Activity "Lessons": one per topic unit + each completed Starter inner lesson
    var t = 0;
    try{ for(var k in CURRICULUM){ if(k === 'Beginner') continue; t += Math.max(0, (getProgress(k).unit || 1) - 1); } }catch(e){}
    try{ t += _starterLessonsDone(); }catch(e){}
    return t;
  }

  // ---- Active minutes today: counts only while a lesson is open AND visible --
  var _minSession = false, _minStart = null;
  function _minGet(){
    try{ var raw = localStorage.getItem('streetway_mins'); if(raw){ var o = JSON.parse(raw); if(o.d === _today()) return o.s || 0; } }catch(e){}
    return 0;
  }
  function _minAdd(secs){
    try{ localStorage.setItem('streetway_mins', JSON.stringify({ d:_today(), s:(_minGet() + secs) })); }catch(e){}
    try{ var L = _logGet(); var t = _today(); L[t] = (L[t] || 0) + secs; localStorage.setItem('streetway_mins_log', JSON.stringify(L)); }catch(e){}
  }
  // Per-day minute log (powers the weekly chart; starts empty, fills over time)
  function _logGet(){ try{ var raw = localStorage.getItem('streetway_mins_log'); return raw ? JSON.parse(raw) : {}; }catch(e){ return {}; } }
  function _weekDays(){ // current week, Mon..Sun, as date strings
    var now = new Date(); var dow = (now.getDay() + 6) % 7; // Mon=0
    var mon = new Date(now); mon.setDate(now.getDate() - dow);
    var arr = []; for(var i=0;i<7;i++){ var d = new Date(mon); d.setDate(mon.getDate() + i); arr.push(_dstr(d)); } return arr;
  }
  function _prevWeekDays(){ var now = new Date(); now.setDate(now.getDate() - 7); var dow = (now.getDay()+6)%7; var mon = new Date(now); mon.setDate(now.getDate()-dow); var arr=[]; for(var i=0;i<7;i++){ var d=new Date(mon); d.setDate(mon.getDate()+i); arr.push(_dstr(d)); } return arr; }
  function _dayMins(ds){ var L = _logGet(); return Math.floor((L[ds] || 0) / 60); }
  function _weekMinutes(){ var L = _logGet(), s = 0; _weekDays().forEach(function(d){ s += (L[d] || 0); }); return Math.floor(s/60); }
  function _prevWeekMinutes(){ var L = _logGet(), s = 0; _prevWeekDays().forEach(function(d){ s += (L[d] || 0); }); return Math.floor(s/60); }
  function _daysActive(){ var L = _logGet(), n = 0; _weekDays().forEach(function(d){ if((L[d] || 0) >= 30) n++; }); return n; }
  function _allTimeMinutes(){ var L = _logGet(), s = 0; for(var k in L){ if(L.hasOwnProperty(k)) s += L[k]; } return Math.floor(s/60); }
  function _fmtHM(m){ m = Math.max(0, m|0); var h = Math.floor(m/60), mm = m%60; if(h && mm) return h+'h '+mm+'m'; if(h) return h+'h'; return mm+'m'; }
  // Weekly accuracy: one score (0-100) per finished session (chat or lesson), averaged over the week
  function _accGet(){ try{ var raw = localStorage.getItem('streetway_acc_log'); return raw ? JSON.parse(raw) : {}; }catch(e){ return {}; } }
  function _accAdd(score){
    try{
      score = Math.max(0, Math.min(100, Number(score) || 0));
      var L = _accGet(), t = _today();
      if(!L[t]) L[t] = { sum:0, n:0 };
      L[t].sum += score; L[t].n += 1;
      localStorage.setItem('streetway_acc_log', JSON.stringify(L));
    }catch(e){}
  }
  function _weekAccuracy(){ // avg session score this week, or null if no sessions yet
    var L = _accGet(), sum = 0, n = 0;
    _weekDays().forEach(function(d){ if(L[d]){ sum += L[d].sum; n += L[d].n; } });
    return n > 0 ? Math.round(sum / n) : null;
  }
  function minBank(){
    if(_minStart){
      var el = (Date.now() - _minStart) / 1000;
      if(el > 0 && el < 7200) _minAdd(el);  // ignore absurd intervals
      _minStart = null;
    }
  }
  function minLaunch(){ minBank(); _minSession = true; if(document.visibilityState === 'visible') _minStart = Date.now(); }
  function minEnd(){ minBank(); _minSession = false; }
  function minutesToday(){ return Math.floor(_minGet() / 60); }
  document.addEventListener('visibilitychange', function(){
    if(document.hidden) minBank();                                   // pause + bank
    else if(_minSession && !_minStart) _minStart = Date.now();       // resume
  });
  window.addEventListener('pagehide', minBank);

  // Expose tracking so other modules (warm-up, etc.) can count toward time + streak
  window.SWTrack = { day: recordActivity, start: minLaunch, stop: minEnd, acc: _accAdd };

  // ---- Activity screen: real data where it exists, honest empty states ------
  function _setRing(circle, r, pct){
    if(!circle) return;
    var C = 2 * Math.PI * r;
    circle.setAttribute('stroke-dasharray', C.toFixed(2));
    circle.setAttribute('stroke-dashoffset', (C * (1 - Math.max(0,Math.min(100,pct))/100)).toFixed(2));
  }
  function updateActivity(R){
    R = R || document.getElementById('h2root'); if(!R) return;
    var A = R.querySelector('.page-activity'); if(!A) return;

    var GOAL = _dailyGoal() * 7; // weekly minute goal = the student's daily goal x7
    var wk = _weekMinutes(), days = _daysActive(), lessons = totalLessonsDone(), allMin = _allTimeMinutes();
    var PKEYS = ['Beginner','Conversation','Travel English','Business English','Job Interview','The Bible in English'];
    var pcts = PKEYS.map(function(k){ var v = pathPct(k); return v == null ? 0 : v; });
    var timePct = Math.min(100, Math.round(wk / GOAL * 100));
    var daysPct = Math.round(days / 7 * 100);
    var wacc = _weekAccuracy(); // null until the first session this week
    var hasProgress = (wk > 0 || lessons > 0 || pcts.some(function(p){ return p > 0; }));

    // Weekly time + sub
    try{ var wb = A.querySelector('.week-big'); if(wb) wb.textContent = _fmtHM(wk); }catch(e){}
    try{
      var tr = A.querySelector('.week-trend'), lw = _prevWeekMinutes();
      if(tr){ if(lw > 0){ tr.style.display=''; var node=tr.childNodes[tr.childNodes.length-1]; if(node) node.textContent = Math.abs(Math.round((wk-lw)/lw*100)) + '%'; } else tr.style.display='none'; }
    }catch(e){}
    try{ var ws = A.querySelector('.week-sub'); if(ws) ws.innerHTML = '<b>' + days + (days===1?' day':' days') + ' active</b> &middot; this week'; }catch(e){}

    // Rings: Time (real) / Accuracy (real, or faded empty) / Days (real)
    try{
      var fills = A.querySelectorAll('.rings-svg circle[stroke-linecap="round"]');
      _setRing(fills[0], 80, timePct); _setRing(fills[1], 60, wacc == null ? 0 : wacc); _setRing(fills[2], 40, daysPct);
    }catch(e){}
    try{
      var rv = A.querySelectorAll('.ring-legend .rl-val');
      if(rv[0]) rv[0].innerHTML = timePct + '<small>%</small>';
      if(rv[1]){
        if(wacc == null){ rv[1].innerHTML = '0<small>%</small>'; rv[1].style.opacity = '.35'; }
        else { rv[1].innerHTML = wacc + '<small>%</small>'; rv[1].style.opacity = ''; }
      }
      if(rv[2]) rv[2].innerHTML = days + '<small>/7</small>';
    }catch(e){}

    // Daily bars (Mon..Sun aligned to the labels), real from the log
    try{
      var cols = A.querySelectorAll('.chart .bar-col'), wd = _weekDays(), today = _today();
      var maxm = 1; wd.forEach(function(d){ maxm = Math.max(maxm, _dayMins(d)); });
      var peakM = 0, peakDay = '', NAMES = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
      for(var i=0; i<cols.length && i<7; i++){
        var ds = wd[i], m = _dayMins(ds), col = cols[i], fill = col.querySelector('.bar-fill');
        col.classList.remove('active','today','future');
        var oldtag = col.querySelector('.bar-tag'); if(oldtag) oldtag.remove();
        var future = (ds > today);
        col.classList.add(ds === today ? 'today' : (future ? 'future' : 'active'));
        if(ds === today && m > 0){ var area = col.querySelector('.bar-area'); if(area){ var tg = document.createElement('span'); tg.className = 'bar-tag'; tg.textContent = 'Today'; area.insertBefore(tg, area.firstChild); } }
        if(fill) fill.style.height = (m > 0 ? Math.max(8, Math.round(m/maxm*100)) : 0) + '%';
        if(m > peakM){ peakM = m; peakDay = NAMES[i]; }
      }
      var pk = A.querySelector('.week-bars-label span'); if(pk) pk.innerHTML = peakM > 0 ? ('Peak: <b>' + peakDay + ', ' + peakM + 'm</b>') : 'Daily minutes';
    }catch(e){}

    // Skill snapshot: removed from the product — hide the whole card
    try{ var skills = A.querySelector('.skills-card'); if(skills) skills.style.display = 'none'; }catch(e){}

    // All-time: hours (accumulating) / lessons (real — one per completed unit, Starter or topic)
    try{
      var at = A.querySelectorAll('.alltime .at-cell .at-val');
      if(at[0]) at[0].innerHTML = Math.floor(allMin/60) + '<span>h</span>';
      if(at[1]) at[1].textContent = String(lessons);
    }catch(e){}

    // Path progress (real)
    try{
      var rows = A.querySelectorAll('.paths-card .p-row');
      for(var r2=0; r2<rows.length && r2<6; r2++){
        var pc = pcts[r2], bar = rows[r2].querySelector('.p-bar i'), tag = rows[r2].querySelector('.p-pct, .p-done');
        if(bar) bar.style.width = pc + '%';
        if(tag){ if(pc >= 100){ tag.textContent = 'Complete'; tag.className = 'p-done'; } else { tag.textContent = pc + '%'; tag.className = 'p-pct'; } }
      }
    }catch(e){}

    // First-week welcome line when the screen is empty
    try{
      var existing = A.querySelector('.act-firstweek');
      if(!hasProgress){
        if(!existing){
          var hd = A.querySelector('.headline');
          var fw = document.createElement('div'); fw.className = 'act-firstweek';
          fw.style.cssText = 'font-size:14px;color:#a89f8e;margin:-6px 0 14px;font-weight:500;';
          fw.textContent = 'Your first week starts now \u2014 this fills in as you practice.';
          if(hd && hd.parentNode) hd.parentNode.insertBefore(fw, hd.nextSibling);
        }
      } else if(existing){ existing.remove(); }
    }catch(e){}
  }

  // ===== "You" tab: profile, photo, daily goal, support, reset =====
  var YOU_SUPPORT_EMAIL = 'contato@emmaspeak.com.br'; // TODO: set your real support email
  var YOU_PRIVACY_URL = '';  // TODO: set your privacy-policy URL
  var YOU_TERMS_URL   = '';  // TODO: set your terms URL

  function _esc(s){ return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  function _userName(){ try{ return localStorage.getItem('streetway_user_name') || ''; }catch(e){ return ''; } }
  function _userPhoto(){ try{ return localStorage.getItem('streetway_user_photo') || ''; }catch(e){ return ''; } }
  function _dailyGoal(){ try{ var v = parseInt(localStorage.getItem('streetway_daily_goal'),10); return v > 0 ? v : 15; }catch(e){ return 15; } }
  function _initials(name){ name = (name||'').trim(); if(!name) return '\uD83D\uDE42'; var p = name.split(/\s+/); return ((p[0].charAt(0)||'') + (p.length>1 ? p[p.length-1].charAt(0) : '')).toUpperCase(); }
  function _joined(){
    try{
      var j = localStorage.getItem('streetway_joined');
      if(!j){ j = new Date().toISOString(); localStorage.setItem('streetway_joined', j); }
      return new Date(j).toLocaleDateString('en-US', { month:'long', year:'numeric' });
    }catch(e){ return ''; }
  }

  function setupYou(R){
    R = R || document.getElementById('h2root'); if(!R) return;
    var Y = R.querySelector('.page-you'); if(!Y) return;
    var name = _userName();
    try{ var h = Y.querySelector('#you-hello'); if(h) h.textContent = name ? ('Hello, ' + name.split(/\s+/)[0]) : 'Hello,'; }catch(e){}
    try{ var nm = Y.querySelector('#you-name'); if(nm) nm.textContent = name || 'Add your name'; }catch(e){}
    try{
      var av = Y.querySelector('#you-avatar'), photo = _userPhoto();
      if(av){
        if(photo){ av.textContent=''; av.style.backgroundImage='url('+photo+')'; av.style.backgroundSize='cover'; av.style.backgroundPosition='center'; }
        else { av.style.backgroundImage=''; av.textContent=_initials(name); }
      }
    }catch(e){}
    try{ var sub = Y.querySelector('#you-sub'); if(sub){ var jd=_joined(); sub.innerHTML = 'Portuguese' + (jd ? (' &middot; Joined ' + jd) : ''); } }catch(e){}
    try{ var gv = Y.querySelector('#you-goal-val'); if(gv) gv.textContent = _dailyGoal() + ' minutes'; }catch(e){}
    try{
      var st = Y.querySelector('#you-streak');
      if(st){
        var cur = 0; try{ cur = (typeof displayStreak === 'function' ? displayStreak() : 0) || 0; }catch(e){}
        var best = _bestStreak(cur);
        if(cur > 0){ st.style.cssText = 'font-size:12.5px;font-weight:700;color:#C79527;margin-bottom:12px;letter-spacing:-.01em;'; st.textContent = '\uD83D\uDD25 ' + cur + '-day streak' + (best > cur ? ('  \u00b7  best ' + best) : ''); }
        else { st.style.display = 'none'; }
      }
    }catch(e){}
    try{ var rmv = Y.querySelector('#you-reminder-val'); if(rmv){ var rg = _reminderGet(); rmv.textContent = (rg.on && rg.time) ? _fmtTime(rg.time) : 'Off'; } }catch(e){}

    if(Y._youWired) return; Y._youWired = true;
    try{ var ed = Y.querySelector('#you-edit'); if(ed) ed.addEventListener('click', _youEditSheet); }catch(e){}
    try{ var pa = Y.querySelector('#you-avatar'); if(pa) pa.addEventListener('click', _youEditSheet); }catch(e){}
    try{ var gr = Y.querySelector('#you-goal-row'); if(gr) gr.addEventListener('click', _youGoalSheet); }catch(e){}
    try{ var hp = Y.querySelector('#you-help'); if(hp) hp.addEventListener('click', function(){ try{ window.location.href = 'mailto:' + YOU_SUPPORT_EMAIL; }catch(e){} }); }catch(e){}
    try{ var pv = Y.querySelector('#you-privacy'); if(pv) pv.addEventListener('click', function(){ if(YOU_PRIVACY_URL){ try{ window.open(YOU_PRIVACY_URL,'_blank'); }catch(e){} } }); }catch(e){}
    try{ var tm = Y.querySelector('#you-terms'); if(tm) tm.addEventListener('click', function(){ if(YOU_TERMS_URL){ try{ window.open(YOU_TERMS_URL,'_blank'); }catch(e){} } }); }catch(e){}
    try{ var rmr = Y.querySelector('#you-reminder-row'); if(rmr) rmr.addEventListener('click', _youReminderSheet); }catch(e){}
    try{ var rs = Y.querySelector('#you-reset'); if(rs) rs.addEventListener('click', _youSignOut); }catch(e){}
  }

  function _youSheet(innerHTML){
    var root = document.getElementById('h2root') || document.body;
    var ov = document.createElement('div');
    ov.style.cssText = 'position:fixed;inset:0;z-index:200;background:rgba(20,16,10,.42);display:flex;align-items:flex-end;justify-content:center;font-family:Inter,system-ui,sans-serif;';
    var sheet = document.createElement('div');
    sheet.style.cssText = 'width:100%;max-width:520px;background:#FBF9F3;border-radius:22px 22px 0 0;padding:22px 22px calc(22px + env(safe-area-inset-bottom));box-shadow:0 -12px 44px rgba(0,0,0,.22);';
    sheet.innerHTML = innerHTML;
    ov.appendChild(sheet);
    ov.addEventListener('click', function(e){ if(e.target === ov) ov.remove(); });
    root.appendChild(ov);
    return { ov: ov, sheet: sheet, close: function(){ ov.remove(); } };
  }

  function _youResizePhoto(file, cb){
    try{
      var reader = new FileReader();
      reader.onload = function(){
        var img = new Image();
        img.onload = function(){
          try{
            var size = 256, c = document.createElement('canvas'); c.width = size; c.height = size;
            var ctx = c.getContext('2d');
            var sd = Math.min(img.width, img.height), sx = (img.width - sd)/2, sy = (img.height - sd)/2;
            ctx.drawImage(img, sx, sy, sd, sd, 0, 0, size, size);
            cb(c.toDataURL('image/jpeg', 0.82));
          }catch(e){}
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    }catch(e){}
  }

  function _youEditSheet(){
    var name = _userName(), photo = _userPhoto();
    var avInner = photo ? '' : _initials(name);
    var avStyle = photo ? ('background-image:url('+photo+');background-size:cover;background-position:center;') : 'background:#0a0a0a;color:#fff;';
    var s = _youSheet(
      '<div style="font-size:19px;font-weight:800;color:#0a0a0a;letter-spacing:-.02em;margin-bottom:18px;">Edit profile</div>'
      + '<div style="display:flex;flex-direction:column;align-items:center;gap:9px;margin-bottom:18px;">'
      +   '<div id="ysAvatar" style="width:84px;height:84px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:28px;font-weight:800;overflow:hidden;cursor:pointer;'+avStyle+'">'+avInner+'</div>'
      +   '<button id="ysPhotoBtn" style="background:none;border:none;color:#C79527;font-weight:700;font-size:13px;cursor:pointer;padding:4px;">Change photo</button>'
      +   '<input type="file" id="ysPhoto" accept="image/*" style="display:none;">'
      + '</div>'
      + '<div style="font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#a89f8e;margin-bottom:7px;">Your name</div>'
      + '<input type="text" id="ysName" value="'+_esc(name)+'" placeholder="Your name" autocomplete="off" autocapitalize="words" style="width:100%;box-sizing:border-box;padding:13px 15px;border:1.5px solid #e7e0d2;border-radius:13px;font-size:16px;font-family:inherit;color:#0a0a0a;background:#fff;outline:none;margin-bottom:20px;">'
      + '<div style="display:flex;gap:10px;">'
      +   '<button id="ysCancel" style="flex:1;padding:14px;border:none;border-radius:13px;background:#efe9dc;color:#6a6052;font-weight:700;font-size:15px;cursor:pointer;">Cancel</button>'
      +   '<button id="ysSave" style="flex:1.4;padding:14px;border:none;border-radius:13px;background:#E0A21C;color:#1a1206;font-weight:800;font-size:15px;cursor:pointer;">Save</button>'
      + '</div>'
    );
    var pending = null, fileInp = s.sheet.querySelector('#ysPhoto');
    function pick(){ try{ fileInp.click(); }catch(e){} }
    s.sheet.querySelector('#ysPhotoBtn').addEventListener('click', pick);
    s.sheet.querySelector('#ysAvatar').addEventListener('click', pick);
    fileInp.addEventListener('change', function(){
      var f = fileInp.files && fileInp.files[0]; if(!f) return;
      _youResizePhoto(f, function(dataUrl){
        pending = dataUrl;
        var a = s.sheet.querySelector('#ysAvatar');
        a.textContent=''; a.style.backgroundImage='url('+dataUrl+')'; a.style.backgroundSize='cover'; a.style.backgroundPosition='center';
      });
    });
    s.sheet.querySelector('#ysCancel').addEventListener('click', s.close);
    s.sheet.querySelector('#ysSave').addEventListener('click', function(){
      try{
        var v = (s.sheet.querySelector('#ysName').value || '').trim();
        if(v) localStorage.setItem('streetway_user_name', v);
        if(pending) localStorage.setItem('streetway_user_photo', pending);
      }catch(e){}
      s.close();
      try{ setupYou(); }catch(e){}
    });
  }

  function _youGoalSheet(){
    var cur = _dailyGoal(), opts = [5,10,15,20,30,45];
    var rows = opts.map(function(m){
      var on = (m === cur);
      return '<button class="ysg" data-m="'+m+'" style="display:flex;justify-content:space-between;align-items:center;width:100%;box-sizing:border-box;padding:15px 16px;border-radius:13px;margin-bottom:8px;background:'+(on?'#FBF3DE':'#fff')+';border:1.5px solid '+(on?'#E0A21C':'#ece5d6')+';font-family:inherit;font-size:15px;font-weight:'+(on?'800':'600')+';color:#0a0a0a;cursor:pointer;">'
        + '<span>'+m+' minutes a day</span>'
        + (on ? '<span style="color:#E0A21C;font-size:17px;line-height:1;">&#10003;</span>' : '')
        + '</button>';
    }).join('');
    var s = _youSheet(
      '<div style="font-size:19px;font-weight:800;color:#0a0a0a;letter-spacing:-.02em;margin-bottom:6px;">Daily goal</div>'
      + '<div style="font-size:13px;color:#8a8073;margin-bottom:18px;line-height:1.45;">How many minutes a day are you aiming for? This sets your weekly Time ring on Activity.</div>'
      + rows
    );
    Array.prototype.forEach.call(s.sheet.querySelectorAll('.ysg'), function(b){
      b.addEventListener('click', function(){
        try{ localStorage.setItem('streetway_daily_goal', b.getAttribute('data-m')); }catch(e){}
        s.close();
        try{ setupYou(); }catch(e){}
        try{ updateActivity(); }catch(e){}
      });
    });
  }

  function _bestStreak(cur){ try{ var b = parseInt(localStorage.getItem('streetway_best_streak'),10) || 0; if((cur||0) > b){ b = cur; localStorage.setItem('streetway_best_streak', String(b)); } return b; }catch(e){ return cur || 0; } }
  function _reminderGet(){ try{ var raw = localStorage.getItem('streetway_reminder'); return raw ? JSON.parse(raw) : { on:false, time:'19:00' }; }catch(e){ return { on:false, time:'19:00' }; } }
  function _fmtTime(t){ try{ var p = String(t).split(':'), h = parseInt(p[0],10), m = p[1]; var ap = h >= 12 ? 'PM' : 'AM'; var h12 = h % 12; if(h12 === 0) h12 = 12; return h12 + ':' + m + ' ' + ap; }catch(e){ return t; } }

  function _youReminderSheet(){
    var r = _reminderGet();
    var s = _youSheet(
      '<div style="font-size:19px;font-weight:800;color:#0a0a0a;letter-spacing:-.02em;margin-bottom:6px;">Daily reminder</div>'
      + '<div style="font-size:13px;color:#8a8073;margin-bottom:14px;line-height:1.45;">Pick a time to be nudged to practice. Reminders notify you in the installed Emma Speak app.</div>'
      + '<div style="display:flex;align-items:center;justify-content:space-between;padding:12px 0;">'
      +   '<span style="font-size:15px;font-weight:600;color:#0a0a0a;">Remind me daily</span>'
      +   '<span id="yrTrack" style="position:relative;display:inline-block;width:50px;height:30px;border-radius:30px;background:'+(r.on?'#E0A21C':'#d9d2c4')+';transition:.2s;cursor:pointer;"><span id="yrKnob" style="position:absolute;top:3px;left:'+(r.on?'23px':'3px')+';width:24px;height:24px;border-radius:50%;background:#fff;transition:.2s;box-shadow:0 1px 3px rgba(0,0,0,.2);"></span></span>'
      + '</div>'
      + '<div id="yrTimeWrap" style="display:'+(r.on?'flex':'none')+';align-items:center;justify-content:space-between;padding:12px 0;border-top:1px solid #eee7d8;">'
      +   '<span style="font-size:15px;font-weight:600;color:#0a0a0a;">Time</span>'
      +   '<input type="time" id="yrTime" value="'+(r.time||'19:00')+'" style="font-size:16px;font-family:inherit;padding:8px 12px;border:1.5px solid #e7e0d2;border-radius:11px;background:#fff;color:#0a0a0a;">'
      + '</div>'
      + '<button id="yrSave" style="width:100%;margin-top:18px;padding:14px;border:none;border-radius:13px;background:#E0A21C;color:#1a1206;font-weight:800;font-size:15px;cursor:pointer;">Save</button>'
    );
    var on = !!r.on;
    function sync(){ s.sheet.querySelector('#yrTrack').style.background = on ? '#E0A21C' : '#d9d2c4'; s.sheet.querySelector('#yrKnob').style.left = on ? '23px' : '3px'; s.sheet.querySelector('#yrTimeWrap').style.display = on ? 'flex' : 'none'; }
    s.sheet.querySelector('#yrTrack').addEventListener('click', function(){ on = !on; sync(); });
    s.sheet.querySelector('#yrSave').addEventListener('click', function(){
      try{ localStorage.setItem('streetway_reminder', JSON.stringify({ on: on, time: (s.sheet.querySelector('#yrTime').value || '19:00') })); }catch(e){}
      s.close(); try{ setupYou(); }catch(e){}
    });
  }

  function _youSignOut(){
    var s = _youSheet(
      '<div style="font-size:19px;font-weight:800;color:#0a0a0a;letter-spacing:-.02em;margin-bottom:10px;">Sign out</div>'
      + '<div style="font-size:14px;color:#6a6052;line-height:1.5;margin-bottom:20px;">Accounts and sign-in are coming soon. For now your name and progress are saved on this device \u2014 no sign-in needed, nothing to sign out of yet.</div>'
      + '<button id="ysoOk" style="width:100%;padding:14px;border:none;border-radius:13px;background:#efe9dc;color:#3a352c;font-weight:700;font-size:15px;cursor:pointer;">Got it</button>'
    );
    s.sheet.querySelector('#ysoOk').addEventListener('click', s.close);
  }

  function refreshDetailHeaders(){
    var R = document.getElementById('h2root'); if(!R) return;
    Object.keys(PATH_TO_CURRIC).forEach(function(pk){
      var ck = PATH_TO_CURRIC[pk];
      var ds = R.querySelector('.detail-screen[data-path="' + pk + '"]'); if(!ds) return;
      var cur = 1, total = 20;
      if(ck === 'Beginner'){ cur = currentUnit(); total = 20; }
      else {
        try{ var p = window.getProgress && getProgress(ck); cur = (p && p.unit) || 1; }catch(e){}
        try{ total = (window.CURRICULUM && CURRICULUM[ck] && CURRICULUM[ck].length) ? CURRICULUM[ck].length : 20; }catch(e){}
      }
      var done = Math.max(0, cur - 1);
      var pct = Math.round(done / total * 100);
      var meta = ds.querySelector('.pc-meta');
      if(meta) meta.innerHTML = '<strong>' + done + ' of ' + total + ' lessons</strong> \u00B7 ' + pct + '% complete';
      var fill = ds.querySelector('.pc-bar-fill');
      if(fill) fill.style.width = pct + '%';
    });
  }

  function refreshTodayAndPaths(){
    var R = document.getElementById('h2root'); if(!R) return;

    // Path cards -> live progress fill
    R.querySelectorAll('.card[data-path]').forEach(function(card){
      var ck = PATH_TO_CURRIC[card.getAttribute('data-path')]; if(!ck) return;
      var pct = pathPct(ck); if(pct == null) return;
      var fill = card.querySelector('.card-fill'); if(fill) fill.style.width = pct + '%';
    });

    // Today hero -> follows the path the student is currently on
    var CURRIC_TO_PATH = {
      'Beginner':'starter','Conversation':'conversation','Business English':'business-english',
      'Travel English':'travel-english','Job Interview':'job-interview','The Bible in English':'bible'
    };
    var key = 'Beginner';
    try{
      if(typeof mhGetCurrentPath === 'function'){ var mp = mhGetCurrentPath(); if(mp && CURRIC_TO_PATH[mp]) key = mp; }
      else if(window._lastTopic && CURRIC_TO_PATH[window._lastTopic]) key = window._lastTopic;
    }catch(e){}
    var slug = CURRIC_TO_PATH[key] || 'starter';

    // hero image: topics -> their warm-up Emma photo; Starter -> paper plane
    var EMMA_VAR = {
      'Conversation':'--emma-conversation','Business English':'--emma-business',
      'Travel English':'--emma-travel','Job Interview':'--emma-interview',
      'The Bible in English':'--emma-bible'
    };
    var EMMA_POS = {
      'Conversation':'center 25%','Business English':'center 5%',
      'Travel English':'center top','Job Interview':'center 5%',
      'The Bible in English':'center 18%'
    };
    var hero = R.querySelector('.t-hero');
    if(hero){
      if(key === 'Beginner'){
        // centered, smaller paper plane on the path's colour
        var pp = R.querySelector('.detail-screen[data-path="starter"] .pc-photo');
        var planeImg = pp ? getComputedStyle(pp).backgroundImage : 'none';
        var sd = R.querySelector('.detail-screen[data-path="starter"]');
        var col = sd ? getComputedStyle(sd).getPropertyValue('--path-color').trim() : '';
        if(planeImg && planeImg !== 'none') hero.style.backgroundImage = planeImg;
        hero.style.backgroundRepeat = 'no-repeat';
        hero.style.backgroundSize = '43%';
        hero.style.backgroundPosition = 'center 42%';
        hero.style.backgroundColor = col || '#3164D4';
      } else {
        var vn = EMMA_VAR[key];
        var raw = vn ? getComputedStyle(document.documentElement).getPropertyValue(vn).trim() : '';
        if(raw){
          hero.style.backgroundImage = raw;
          hero.style.backgroundRepeat = 'no-repeat';
          hero.style.backgroundSize = 'cover';
          hero.style.backgroundPosition = EMMA_POS[key] || 'center top';
          hero.style.backgroundColor = '';
        }
      }
    }

    // hero text + continue, per active path
    var hcur, htotal, htitle, hname, hlaunch;
    if(key === 'Beginner'){
      hcur = currentUnit(); htotal = 20;
      htitle = (UNITS[hcur - 1] || UNITS[0]).t; hname = 'BEGINNER';
      hlaunch = function(){
        var part = 1; for(var p = 1; p <= 3; p++){ if(!partDone(hcur, p)){ part = p; break; } }
        try{ recordActivity(); }catch(e){}
        try{ minLaunch(); }catch(e){}
        try{ if(window.mhSetCurrentPath) mhSetCurrentPath('Beginner'); }catch(e){}
        if(window.SWBeginner && SWBeginner.openUnit) SWBeginner.openUnit(hcur, part);
      };
    } else {
      var units = (window.CURRICULUM && CURRICULUM[key]) ? CURRICULUM[key] : [];
      htotal = units.length || 20;
      try{ var pr = window.getProgress && getProgress(key); hcur = (pr && pr.unit) || 1; }catch(e){ hcur = 1; }
      htitle = (units[hcur - 1] || units[0] || {}).title || ('Unit ' + hcur);
      hname = key.toUpperCase();
      hlaunch = function(){ launchTopicUnit(key, hcur); };
    }
    var eg = R.querySelector('.t-eyebrow .g'), ew = R.querySelector('.t-eyebrow .w');
    if(eg) eg.textContent = hname;
    if(ew) ew.textContent = ' \u00B7 UNIT ' + hcur;
    var title = R.querySelector('.t-title'); if(title) title.textContent = htitle;
    var pct = Math.round((hcur - 1) / htotal * 100);
    var fill = R.querySelector('.t-prog > i'); if(fill) fill.style.width = pct + '%';
    var lbl = R.querySelector('.t-prog-lbl'); if(lbl) lbl.innerHTML = '<b>' + pct + '%</b> \u00B7 Unit ' + hcur + ' of ' + htotal;
    var cont = R.querySelector('.t-continue'); if(cont) cont.onclick = hlaunch;

    // Stats: streak (real) + units-done (real). Minutes -> "Min today".
    try{
      var stats = R.querySelectorAll('.page-today .t-stat');
      if(stats[0]){ var sv = stats[0].querySelector('.t-stat-val'); if(sv) sv.textContent = String(displayStreak()); }
      if(stats[1]){
        var mv = stats[1].querySelector('.t-stat-val'); if(mv) mv.textContent = String(minutesToday());
        var ml = stats[1].querySelector('.t-stat-lbl'); if(ml) ml.textContent = 'Min today';
      }
      if(stats[2]){
        var uv = stats[2].querySelector('.t-stat-val'); if(uv) uv.textContent = String(totalUnitsDone());
        var ul = stats[2].querySelector('.t-stat-lbl'); if(ul) ul.textContent = 'Units done';
      }
    }catch(e){}
    try{ updateActivity(R); }catch(e){}
    try{ setupYou(R); }catch(e){}
  }

  var wired = false;
  function wireContent(){
    if(wired) return;
    var R = document.getElementById('h2root'); if(!R) return;
    injectAccordionCSS();

    // --- Beginner (starter): build the accordion from data ---
    var starter = R.querySelector('.detail-screen[data-path="starter"]');
    if(starter){
      var levels = starter.querySelector('.levels');
      if(levels){
        levels.innerHTML = '<div class="u-summary" id="uSummary"></div>' + UNITS.map(unitHTML).join('');
        // expand/collapse a unit
        levels.querySelectorAll('.u-acc-head').forEach(function(head){
          head.addEventListener('click', function(){
            head.parentNode.classList.toggle('expanded');
          });
        });
        // tap a lesson -> open that exact part
        levels.querySelectorAll('.u-lesson').forEach(function(ls){
          ls.addEventListener('click', function(ev){
            ev.stopPropagation();
            var u = parseInt(ls.getAttribute('data-unit'), 10);
            var p = parseInt(ls.getAttribute('data-part'), 10);
            try{ recordActivity(); }catch(e){}
            try{ minLaunch(); }catch(e){}
            try{ if(window.mhSetCurrentPath) mhSetCurrentPath('Beginner'); }catch(e){}
            if(window.SWBeginner && SWBeginner.openUnit) SWBeginner.openUnit(u, p);
          });
        });
      }
    }

    // --- 5 topic paths: build unit list from the real CURRICULUM data ---
    Object.keys(TOPIC_MAP).forEach(function(pk){
      var ds = R.querySelector('.detail-screen[data-path="' + pk + '"]');
      if(!ds) return;
      var ck = TOPIC_MAP[pk];
      var units = (window.CURRICULUM && CURRICULUM[ck]) ? CURRICULUM[ck] : null;
      var levels = ds.querySelector('.levels');
      if(levels && units && units.length){
        levels.innerHTML = '<div class="u-summary" data-topic-sum="' + pk + '"></div>' +
          topicLevelsHTML(ck, units);
        // expand/collapse a Level
        levels.querySelectorAll('.t-level .u-acc-head').forEach(function(head){
          head.addEventListener('click', function(){ head.parentNode.classList.toggle('expanded'); });
        });
        // tap a lesson -> launch that unit
        levels.querySelectorAll('.u-tlesson').forEach(function(ls){
          ls.addEventListener('click', function(ev){
            ev.stopPropagation();
            launchTopicUnit(ck, parseInt(ls.getAttribute('data-unit'), 10));
          });
        });
      } else {
        // CURRICULUM unavailable — fall back to launching the topic's current unit
        ds.addEventListener('click', function(ev){
          if(ev.target.closest('.d-back-btn, .d-back, .back, [data-back]')) return;
          launchTopic(ck);
        });
        ds.style.cursor = 'pointer';
      }
    });

    wired = true;
  }

  function showHome2(){
    var host = layerEl(); if(!host) return;
    try{ minEnd(); }catch(e){}
    // Lift to <body> so no transformed/contained ancestor interferes with the
    // fixed layer, then give it a real height in viewport units (can't collapse).
    if(host.parentNode !== document.body) document.body.appendChild(host);
    host.style.display  = 'block';
    host.style.position = 'fixed';
    host.style.left = '0'; host.style.top = '0';
    host.style.right = '0'; host.style.bottom = '0';
    host.style.width  = '100vw';
    host.style.height = '100vh';
    host.style.height = '100dvh';
    host.style.zIndex = '50';
    host.style.background = '#F3F0E8';
    build().then(function(){ sizeRoot(); wireContent(); refreshBeginnerStates(); refreshTopicStates(); refreshDetailHeaders(); refreshTodayAndPaths(); }).catch(function(e){ console.warn('[home2] build failed', e); });
  }
  function hideHome2(){ var host = layerEl(); if(host) host.style.display = 'none'; }
  window.SWHome2 = { show: showHome2, hide: hideHome2 };

  if(typeof window.showTopicPage === 'function'){
    var _showTopicPage = window.showTopicPage;
    window.showTopicPage = function(){
      if(window.innerWidth >= 1024){
        hideHome2();
        return _showTopicPage.apply(this, arguments);
      }
      document.body.classList.add('show-topics');
      var hdr=document.querySelector('.hdr');  if(hdr)  hdr.style.display='none';
      var main=document.querySelector('.main'); if(main) main.style.display='none';
      ['topicPage','swDesktop','mobileHome'].forEach(function(id){
        var e=document.getElementById(id); if(e) e.style.display='none';
      });
      showHome2();
    };
  }

  window.addEventListener('message', function(e){
    var d=e.data; if(!d || d.source!=='home2') return;
  });
})();

/* ═══════════ Bíblia em resumo — 66 book summaries (read + listen) ═══════════ */
(function(){
  var DATA=null, AUDIO=null, curBtn=null, raf=0;

  function el(tag, css, html){ var d=document.createElement(tag); if(css)d.style.cssText=css; if(html!=null)d.innerHTML=html; return d; }
  function esc(s){ return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;'); }

  // ── Entry card on the Bible path detail (locked design from the Cowork chat) ──
  function injectCard(){
    var ds=document.querySelector('#h2root .detail-screen[data-path="bible"]'); if(!ds) return;
    if(ds.querySelector('.bible-sum-card')) return;
    var pc=ds.querySelector('.path-card'); if(!pc) return;
    var card=el('div','margin:14px 16px 2px;');
    card.className='bible-sum-card';
    card.innerHTML=
      '<div style="background:#F7F3E8;border:2px solid #E8963C;border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:12px;cursor:pointer;">'+
        '<div style="width:40px;height:40px;border-radius:10px;background:#FAEEDA;display:flex;align-items:center;justify-content:center;flex-shrink:0;">'+
          '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#854F0B" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 18v-6a9 9 0 0 1 18 0v6"/><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"/></svg>'+
        '</div>'+
        '<div style="flex:1;min-width:0;">'+
          '<p style="margin:0;font-size:14px;font-weight:600;color:#2C2C2A;">B\u00edblia em resumo</p>'+
          '<p style="margin:2px 0 0;font-size:12px;color:#5F5E5A;line-height:1.4;">Pratique ingl\u00eas lendo e ouvindo os 66 livros da B\u00edblia</p>'+
        '</div>'+
        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#888780" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>'+
      '</div>';
    card.firstChild.addEventListener('click', openList);
    pc.insertAdjacentElement('afterend', card);
  }

  function load(cb){
    if(DATA){ cb(); return; }
    fetch('bible-summaries.json').then(function(r){return r.json();}).then(function(j){ DATA=j; cb(); })
      .catch(function(){ alert('N\u00e3o foi poss\u00edvel carregar os resumos. Verifique sua conex\u00e3o.'); });
  }

  // ── Screen scaffolding (full-screen overlays) ──
  function screen(id){
    var old=document.getElementById(id); if(old) old.remove();
    var sc=el('div','position:fixed;inset:0;z-index:99990;background:#faf9f7;display:flex;flex-direction:column;overflow:hidden;font-family:Inter,-apple-system,sans-serif;');
    sc.id=id;
    document.body.appendChild(sc);
    return sc;
  }
  function header(title, onBack){
    var h=el('div','display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top,0px) + 12px) 12px 10px;flex-shrink:0;background:#faf9f7;border-bottom:1px solid rgba(0,0,0,.06);');
    var b=el('button','width:38px;height:38px;border-radius:50%;background:transparent;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;',
      '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#0a0a0a" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>');
    b.onclick=onBack;
    h.appendChild(b);
    h.appendChild(el('div','font-size:16px;font-weight:700;color:#0a0a0a;letter-spacing:-.01em;',esc(title)));
    return h;
  }

  // ── Book list ──
  function openList(){
    load(function(){
      var sc=screen('bibleListScreen');
      sc.appendChild(header('B\u00edblia em resumo', function(){ sc.remove(); }));
      var body=el('div','flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:6px 16px calc(env(safe-area-inset-bottom,0px) + 28px);');
      function section(label, from, to){
        body.appendChild(el('div','font-size:11px;font-weight:700;letter-spacing:.16em;color:#8a8073;margin:20px 2px 8px;', label));
        var wrap=el('div','background:#fff;border:1px solid #ece8e0;border-radius:16px;overflow:hidden;');
        DATA.books.filter(function(b){return b.n>=from&&b.n<=to;}).forEach(function(b,i,arr){
          var row=el('div','display:flex;align-items:center;gap:12px;padding:13px 14px;cursor:pointer;'+(i<arr.length-1?'border-bottom:1px solid #f2efe9;':''));
          row.innerHTML=
            '<div style="width:26px;font-size:12px;font-weight:700;color:#c2b49a;font-variant-numeric:tabular-nums;flex-shrink:0;">'+b.n+'</div>'+
            '<div style="flex:1;min-width:0;">'+
              '<div style="font-size:15px;font-weight:600;color:#0a0a0a;">'+esc(b.en)+'</div>'+
              '<div style="font-size:12px;color:#8a8073;margin-top:1px;">'+esc(b.pt)+'</div>'+
            '</div>'+
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#c9c3b5" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;"><polyline points="9 18 15 12 9 6"/></svg>';
          row.addEventListener('click', function(){ openBook(b); });
          wrap.appendChild(row);
        });
        body.appendChild(wrap);
      }
      section('ANTIGO TESTAMENTO', 1, 39);
      section('NOVO TESTAMENTO', 40, 66);
      sc.appendChild(body);
    });
  }

  // ── Book detail: audio player + text ──
  var _posKey=null, _lastSave=0;
  function savePos(force){
    if(!AUDIO||!_posKey) return;
    var now=Date.now();
    if(!force && now-_lastSave<3000) return;
    _lastSave=now;
    try{
      if(AUDIO.duration && AUDIO.currentTime>5 && AUDIO.currentTime<AUDIO.duration-8){
        localStorage.setItem(_posKey, String(Math.floor(AUDIO.currentTime)));
      }
    }catch(e){}
  }
  function stopAudio(){
    savePos(true);
    if(AUDIO){ try{AUDIO.pause();}catch(e){} }
    if(raf) cancelAnimationFrame(raf);
    curBtn=null;
  }
  function fmt(t){ t=Math.max(0,Math.floor(t||0)); return Math.floor(t/60)+':'+('0'+t%60).slice(-2); }

  function openBook(b){
    var sc=screen('bibleBookScreen');
    sc.appendChild(header(b.en, function(){ stopAudio(); sc.remove(); }));
    var body=el('div','flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;padding:4px 20px calc(env(safe-area-inset-bottom,0px) + 40px);');

    body.appendChild(el('div','font-size:13px;color:#8a8073;margin:14px 2px 0;', esc(b.pt)+' \u00b7 '+(b.t==='AT'?'Antigo':'Novo')+' Testamento'));

    // player card
    var stick=el('div','position:sticky;top:0;z-index:4;background:#faf9f7;padding:10px 0 8px;margin:2px 0 0;');
    var pc=el('div','background:#fff;border:1px solid #ece8e0;border-radius:16px;padding:14px 16px;display:flex;align-items:center;gap:14px;box-shadow:0 4px 14px -8px rgba(0,0,0,.18);');
    var play=el('button','width:52px;height:52px;border-radius:50%;background:#81953C;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;',
      '<svg id="bPlayIco" width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M8 5.5 L19 12 L8 18.5 Z"/></svg>');
    var right=el('div','flex:1;min-width:0;');
    var barWrap=el('div','padding:12px 0;margin:-12px 0;cursor:pointer;touch-action:none;');
    var bar=el('div','height:5px;border-radius:3px;background:#efece4;position:relative;');
    var fill=el('div','position:absolute;left:0;top:0;bottom:0;width:0;border-radius:3px;background:#81953C;');
    bar.appendChild(fill);
    barWrap.appendChild(bar);
    var times=el('div','display:flex;justify-content:space-between;font-size:11px;color:#a89c80;margin-top:7px;font-variant-numeric:tabular-nums;','<span id="bT0">0:00</span><span id="bT1">\u2013:\u2013\u2013</span>');
    right.appendChild(barWrap); right.appendChild(times);
    pc.appendChild(play); pc.appendChild(right);
    stick.appendChild(pc);
    body.appendChild(stick);

    var note=el('div','display:none;font-size:12px;color:#a89c80;margin:0 2px 4px;','\u00c1udio em breve para este livro.');
    body.appendChild(note);

    // text — per-paragraph play + tappable words
    var totalW=0, cumW=[];
    b.paras.forEach(function(p){ cumW.push(totalW); totalW+=(p.match(/\S+/g)||[]).length; });
    var paraEls=[];
    b.paras.forEach(function(p, pi){
      var row=el('div','display:flex;gap:10px;margin:18px 0;align-items:flex-start;');
      var pb=el('button','flex-shrink:0;width:24px;height:24px;margin-top:4px;border-radius:50%;border:1.5px solid #d8d2c4;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;padding:0;',
        '<svg width="9" height="9" viewBox="0 0 24 24" fill="#a89c80"><path d="M7 4.5 L20 12 L7 19.5 Z"/></svg>');
      pb.setAttribute('aria-label','Ouvir deste par\u00e1grafo');
      pb.addEventListener('click', function(){ seekPara(pi); });
      var html=esc(p).split(/(\s+)/).map(function(tk){
        return /\S/.test(tk) ? '<span class="bw" style="cursor:pointer;">'+tk+'</span>' : tk;
      }).join('');
      var para=el('p','flex:1;font-size:17px;line-height:1.75;color:#2a2620;margin:0;padding:2px 8px;border-radius:10px;transition:background .3s;', html);
      row.appendChild(pb); row.appendChild(para);
      body.appendChild(row);
      paraEls.push(para);
    });
    function paraTime(i){
      if(b.times && b.times[i]!=null) return b.times[i];
      return AUDIO.duration ? (cumW[i]/totalW)*AUDIO.duration : 0;
    }
    function activePara(){
      if(!AUDIO.duration) return -1;
      var t=AUDIO.currentTime;
      for(var i=paraEls.length-1;i>=0;i--){ if(t>=paraTime(i)-0.5) return i; }
      return 0;
    }
    var _hl=-1;
    function highlight(){
      var a=AUDIO.paused?-1:activePara();
      if(a===_hl) return;
      if(_hl>=0&&paraEls[_hl]) paraEls[_hl].style.background='transparent';
      if(a>=0&&paraEls[a]) paraEls[a].style.background='rgba(129,149,60,.09)';
      _hl=a;
    }
    sc.appendChild(body);
    wireTranslate(sc, body);
    // restore reading position
    try{
      var sp=parseInt(localStorage.getItem('bible_scroll_'+b.file)||'0',10);
      if(sp>100) requestAnimationFrame(function(){ body.scrollTop=sp; });
    }catch(e){}
    var _st=0;
    body.addEventListener('scroll', function(){
      var now=Date.now(); if(now-_st<1500) return; _st=now;
      try{ localStorage.setItem('bible_scroll_'+b.file, String(Math.floor(body.scrollTop))); }catch(e){}
    });

    // wire audio (with resume)
    stopAudio();
    if(!AUDIO){ AUDIO=new Audio(); AUDIO.preload='metadata'; }
    AUDIO.src=DATA.audio_base + b.file + '.mp3';
    _posKey='bible_pos_'+b.file;
    var resume=0; try{ resume=parseInt(localStorage.getItem(_posKey)||'0',10)||0; }catch(e){}
    var ico=play.querySelector('#bPlayIco');
    var t0=times.querySelector('#bT0'), t1=times.querySelector('#bT1');
    AUDIO.onloadedmetadata=function(){
      t1.textContent=fmt(AUDIO.duration);
      if(resume>5 && resume<AUDIO.duration-8){
        try{ AUDIO.currentTime=resume; }catch(e){}
        fill.style.width=(resume/AUDIO.duration*100)+'%'; t0.textContent=fmt(resume);
      }
    };
    AUDIO.onerror=function(){ pc.style.display='none'; note.style.display='block'; };
    AUDIO.onended=function(){
      ico.innerHTML='<path d="M8 5.5 L19 12 L8 18.5 Z"/>';
      try{ localStorage.removeItem(_posKey); }catch(e){}
    };
    AUDIO.onpause=function(){ savePos(true); };
    var scrubbing=false;
    function tick(){
      if(AUDIO.duration && !scrubbing){ fill.style.width=(AUDIO.currentTime/AUDIO.duration*100)+'%'; t0.textContent=fmt(AUDIO.currentTime); savePos(); }
      try{ highlight(); }catch(e){}
      if(!AUDIO.paused) raf=requestAnimationFrame(tick);
    }
    function seekPara(pi){
      function go(){
        try{ AUDIO.currentTime=paraTime(pi); }catch(e){}
        resume=0; savePos(true);
        if(AUDIO.paused){ AUDIO.play(); ico.innerHTML='<rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/>'; tick(); }
      }
      if(AUDIO.duration){ go(); }
      else {
        var h=function(){ AUDIO.removeEventListener('loadedmetadata',h); go(); };
        AUDIO.addEventListener('loadedmetadata',h);
        try{ AUDIO.load(); }catch(e){}
      }
    }
    window._bibleSeekPara=seekPara; // referenced by paragraph buttons defined above
    
    play.onclick=function(){
      if(AUDIO.paused){
        if(resume>5 && AUDIO.currentTime<1 && (!AUDIO.duration || resume<AUDIO.duration-8)){ try{ AUDIO.currentTime=resume; }catch(e){} }
        resume=0;
        AUDIO.play(); ico.innerHTML='<rect x="6" y="5" width="4" height="14" rx="1.2"/><rect x="14" y="5" width="4" height="14" rx="1.2"/>'; tick(); }
      else { AUDIO.pause(); ico.innerHTML='<path d="M8 5.5 L19 12 L8 18.5 Z"/>'; }
    };
    function pctOf(ev){
      var r=bar.getBoundingClientRect();
      var x=(ev.touches&&ev.touches[0]?ev.touches[0].clientX:ev.clientX);
      return Math.max(0,Math.min(1,(x-r.left)/r.width));
    }
    var scrubPct=0;
    function scrubMove(ev){
      if(!scrubbing||!AUDIO.duration) return;
      scrubPct=pctOf(ev);
      fill.style.width=(scrubPct*100)+'%';
      t0.textContent=fmt(scrubPct*AUDIO.duration);
      ev.preventDefault&&ev.preventDefault();
    }
    function scrubEnd(){
      if(!scrubbing) return;
      scrubbing=false;
      if(AUDIO.duration){ try{ AUDIO.currentTime=scrubPct*AUDIO.duration; }catch(e){} resume=0; savePos(true); }
      document.removeEventListener('pointermove',scrubMove);
      document.removeEventListener('pointerup',scrubEnd);
    }
    barWrap.addEventListener('pointerdown', function(ev){
      if(!AUDIO.duration) return;
      scrubbing=true; scrubMove(ev);
      document.addEventListener('pointermove',scrubMove,{passive:false});
      document.addEventListener('pointerup',scrubEnd);
    });
  }

  // ── Tap-to-translate (MyMemory, free; cached per device) ──
  var _trCache=null;
  function trCache(){
    if(_trCache) return _trCache;
    try{ _trCache=JSON.parse(localStorage.getItem('bible_tr_cache')||'{}'); }catch(e){ _trCache={}; }
    // purge any poisoned entries from past quota warnings
    var dirty=false;
    for(var k in _trCache){ if(/MYMEMORY|USAGELIMITS/i.test(_trCache[k])){ delete _trCache[k]; dirty=true; } }
    if(dirty) trSave();
    return _trCache;
  }
  function trSave(){ try{ localStorage.setItem('bible_tr_cache', JSON.stringify(_trCache)); }catch(e){} }
  function translate(q, cb){
    q=q.trim().replace(/^[^A-Za-z']+|[^A-Za-z']+$/g,'');
    if(!q){ cb(null); return; }
    var key=q.toLowerCase();
    var c=trCache();
    if(c[key]){ cb(c[key]); return; }
    fetch('https://api.mymemory.translated.net/get?q='+encodeURIComponent(q)+'&langpair=en|pt-BR&de=contato@streetwayenglish.com')
      .then(function(r){return r.json();})
      .then(function(j){
        var t=j&&j.responseData&&j.responseData.translatedText||null;
        if(t && /MYMEMORY|USAGELIMITS/i.test(t)){ cb('__QUOTA__'); return; }
        if(t){ c[key]=t; trSave(); }
        cb(t);
      }).catch(function(){ cb(null); });
  }
  function wireTranslate(sc, body){
    // chip pinned above the safe area
    var chip=el('div','position:absolute;left:16px;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 18px);background:#0a0a0a;color:#fff;border-radius:14px;padding:12px 16px;font-size:14px;line-height:1.45;display:none;z-index:5;box-shadow:0 8px 30px rgba(0,0,0,.25);');
    chip.addEventListener('click',function(){ chip.style.display='none'; });
    sc.appendChild(chip);
    function show(q, t){
      chip.innerHTML='<span style="color:#EBC06A;font-weight:700;">'+esc(q)+'</span>'+
        '<span style="opacity:.55;margin:0 8px;">\u2192</span>'+esc(t)+
        '<span style="display:block;font-size:11px;opacity:.45;margin-top:4px;">toque para fechar</span>';
      chip.style.display='block';
    }
    function lookup(q){
      if(!q) return;
      chip.innerHTML='<span style="opacity:.6;">Traduzindo\u2026</span>'; chip.style.display='block';
      translate(q, function(t){
        if(t==='__QUOTA__'){ chip.innerHTML='<span style="opacity:.7;">Limite di\u00e1rio de tradu\u00e7\u00e3o atingido neste aparelho \u2014 volta amanh\u00e3. 😉</span>'; return; }
        if(t){ show(q,t); } else { chip.innerHTML='<span style="opacity:.6;">Sem tradu\u00e7\u00e3o agora \u2014 tente de novo.</span>'; }
      });
    }
    function lookupCtx(q, sent){
      if(!q) return;
      chip.innerHTML='<span style="opacity:.6;">Traduzindo\u2026</span>'; chip.style.display='block';
      translate(q, function(t){
        if(t==='__QUOTA__'){ chip.innerHTML='<span style="opacity:.7;">Limite di\u00e1rio de tradu\u00e7\u00e3o atingido neste aparelho \u2014 volta amanh\u00e3. 😉</span>'; return; }
        if(!t){ chip.innerHTML='<span style="opacity:.6;">Sem tradu\u00e7\u00e3o agora \u2014 tente de novo.</span>'; return; }
        show(q,t);
        // sentence context only on demand (saves ~30x translation quota)
        if(sent && sent.split(/\s+/).length>2 && sent.length<420){
          var ctxEl=el('div','margin-top:8px;padding-top:8px;border-top:1px solid rgba(255,255,255,.14);font-size:12.5px;line-height:1.5;',
            '<span style="color:#EBC06A;font-weight:700;cursor:pointer;">Ver no contexto \u2192</span>');
          ctxEl.addEventListener('click', function(ev){
            ev.stopPropagation();
            ctxEl.innerHTML='<span style="opacity:.55;">Traduzindo a frase\u2026</span>';
            translate(sent, function(ts){
              if(ts && ts!=='__QUOTA__'){ ctxEl.innerHTML='<span style="opacity:.55;">No contexto: </span><span style="opacity:.9;">'+esc(ts)+'</span>'; }
              else if(ts==='__QUOTA__'){ ctxEl.innerHTML='<span style="opacity:.55;">Limite di\u00e1rio atingido.</span>'; }
              else { ctxEl.innerHTML='<span style="opacity:.55;">Sem tradu\u00e7\u00e3o agora.</span>'; }
            });
          });
          chip.appendChild(ctxEl);
        }
      });
    }
    // single word tap -> translate word + its sentence (context)
    body.addEventListener('click', function(ev){
      var w=ev.target.closest&&ev.target.closest('.bw'); if(!w) return;
      var sel=window.getSelection&&window.getSelection();
      if(sel&&String(sel).trim().split(/\s+/).length>1) return; // a phrase is selected; button handles it
      var para=w.closest('p');
      var sent='';
      if(para){
        var full=para.textContent, word=w.textContent;
        // locate the tapped word's sentence
        var idx=0, node=para.firstChild, acc='';
        var sents=full.match(/[^.!?]+[.!?]+["']?|[^.!?]+$/g)||[full];
        // find which sentence contains this exact span occurrence
        var upto=0, target=-1;
        var spans=para.querySelectorAll('.bw');
        for(var i2=0;i2<spans.length;i2++){ if(spans[i2]===w){ target=i2; break; } }
        var count=0, pos=0;
        for(var si=0; si<sents.length; si++){
          var wordsIn=(sents[si].match(/\S+/g)||[]).length;
          if(target<count+wordsIn){ sent=sents[si].trim(); break; }
          count+=wordsIn;
        }
        if(!sent) sent=sents[0].trim();
      }
      lookupCtx(w.textContent, sent);
    });
    // phrase selection -> floating button
    var selBtn=el('button','position:absolute;right:16px;bottom:calc(env(safe-area-inset-bottom,0px) + 84px);background:#81953C;color:#fff;border:none;border-radius:22px;padding:11px 18px;font-size:13.5px;font-weight:700;font-family:inherit;display:none;z-index:5;box-shadow:0 6px 20px rgba(0,0,0,.2);cursor:pointer;','Traduzir sele\u00e7\u00e3o');
    sc.appendChild(selBtn);
    document.addEventListener('selectionchange', function(){
      if(!document.body.contains(sc)) return;
      var sel=window.getSelection&&window.getSelection();
      var txt=sel?String(sel).trim():'';
      var inside=txt && sel.anchorNode && body.contains(sel.anchorNode);
      selBtn.style.display=(inside && txt.split(/\s+/).length>1 && txt.length<200)?'block':'none';
      if(inside) selBtn._q=txt;
    });
    selBtn.addEventListener('click', function(){ lookup(selBtn._q||''); selBtn.style.display='none'; });
  }

  // ── Mount: wait for the bible detail screen to exist, inject once ──
  var tries=0;
  var iv=setInterval(function(){
    tries++;
    injectCard();
    if(document.querySelector('#h2root .bible-sum-card') || tries>120){ clearInterval(iv); }
  }, 500);
})();

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
      '#h2root .u-lesson{cursor:pointer;}';
    var st = document.createElement('style');
    st.id = 'h2root-accordion';
    st.textContent = css;
    document.head.appendChild(st);
  }

  function launchTopic(key){
    window._lastTopic = key; window._emmaTopic = key;
    try{ if(typeof swState !== 'undefined' && swState) swState.topic = key; }catch(e){}
    try{ if(typeof window.selectAndStart === 'function'){ window.selectAndStart(key); return; } }catch(e){}
    try{ if(typeof window.mhBegin === 'function'){ window.mhBegin(); return; } }catch(e){}
    console.warn('[home2] no topic launcher available for', key);
  }

  var CHECK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  var LOCK  = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>';

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
    var cur = currentUnit();
    R.querySelectorAll('.level.u-acc').forEach(function(lv){
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

    var sum = R.querySelector('#uSummary');
    if(sum) sum.textContent = (cur - 1) + ' of 20 complete';

    // auto-expand the current unit once
    if(!autoExpanded){
      var cl = R.querySelector('.level.u-acc[data-unit="' + cur + '"]');
      if(cl) cl.classList.add('expanded');
      autoExpanded = true;
    }
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
            if(window.SWBeginner && SWBeginner.openUnit) SWBeginner.openUnit(u, p);
          });
        });
      }
    }

    // --- 5 topic paths: any tap (except Back) launches that topic's Emma ---
    Object.keys(TOPIC_MAP).forEach(function(pk){
      var ds = R.querySelector('.detail-screen[data-path="'+pk+'"]');
      if(!ds) return;
      ds.addEventListener('click', function(ev){
        if(ev.target.closest('.d-back-btn, .d-back, .back, [data-back]')) return;
        launchTopic(TOPIC_MAP[pk]);
      });
      ds.style.cursor = 'pointer';
    });

    wired = true;
  }

  function showHome2(){
    var host = layerEl(); if(!host) return;
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
    build().then(function(){ sizeRoot(); wireContent(); refreshBeginnerStates(); }).catch(function(e){ console.warn('[home2] build failed', e); });
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

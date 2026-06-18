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

  function showHome2(){
    var host = layerEl(); if(!host) return;
    host.style.display = 'block';
    build().catch(function(e){ console.warn('[home2] build failed', e); });
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

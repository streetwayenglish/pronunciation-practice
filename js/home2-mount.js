// ============================================================================
// HOME2 MOUNT — additive. On mobile (<1024px) the app's home becomes the new
// design (home2.html) shown in an isolated iframe, so its CSS can't collide
// with the app and the look stays pixel-perfect. Desktop (>=1024px) is left
// exactly as it was (sw-desktop). No existing file is modified.
//
// Load AFTER home.js (it wraps showTopicPage) and before init.js.
// Requires in index.html:
//   <div id="home2Layer"><iframe id="home2Frame"></iframe></div>
//
// Launch wiring (Continue / lesson taps -> real flows) and live progress data
// are added in the next stage; the message listener below is the seam for it.
// ============================================================================
(function(){
  'use strict';
  var PLAYER = 'home2.html';
  function L(){ return document.getElementById('home2Layer'); }
  function F(){ return document.getElementById('home2Frame'); }

  function showHome2(){
    var layer=L(), frame=F();
    if(!layer || !frame){ console.warn('[home2] #home2Layer / #home2Frame missing'); return; }
    // Reveal FIRST. iOS Safari will not load an iframe whose container was
    // display:none at the moment src was set, and never retries — so set src
    // only after the layer is visible.
    layer.style.display='block';
    requestAnimationFrame(function(){
      if(frame.getAttribute('src') !== PLAYER) frame.setAttribute('src', PLAYER);
    });
  }
  function hideHome2(){ var layer=L(); if(layer) layer.style.display='none'; }
  window.SWHome2 = { show:showHome2, hide:hideHome2 };

  // Wrap showTopicPage: mobile -> new home iframe; desktop -> original.
  if(typeof window.showTopicPage === 'function'){
    var _showTopicPage = window.showTopicPage;
    window.showTopicPage = function(){
      if(window.innerWidth >= 1024){
        hideHome2();
        return _showTopicPage.apply(this, arguments);
      }
      // mobile: present the new home instead of #mobileHome
      document.body.classList.add('show-topics');
      var hdr=document.querySelector('.hdr');  if(hdr)  hdr.style.display='none';
      var main=document.querySelector('.main'); if(main) main.style.display='none';
      ['topicPage','swDesktop','mobileHome'].forEach(function(id){
        var e=document.getElementById(id); if(e) e.style.display='none';
      });
      showHome2();
    };
  }

  // Seam for the next stage: the home iframe will postMessage launch intents.
  window.addEventListener('message', function(e){
    var d=e.data; if(!d || d.source!=='home2') return;
    // d.type === 'launch' { path, unit, part } -> route to SWBeginner / Emma flow.
    // Wired in the data stage.
  });
})();

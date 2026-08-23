// ============================================================================
// LOGGER — leveled logging, gated by a runtime flag.
//
// Log.d/Log.i (debug/info — the verbose "user tapped X" / "service call Y"
// trail) are silent by default and only print once debug mode is turned on,
// so a normal user's console stays clean. Log.w/Log.e always print (and use
// console.warn/console.error) since those matter even if you forgot to flip
// the flag, and are the ones a real error tracker would also want to see.
//
// Turn on:  localStorage.setItem('debug','1')  then reload
// Turn off: localStorage.removeItem('debug')   then reload
// ============================================================================
(function(){
  var on = null;
  function isOn(){
    if(on===null){
      try{ on = localStorage.getItem('debug')==='1'; }catch(e){ on = false; }
    }
    return on;
  }
  function d(){ if(isOn()) console.log.apply(console, arguments); }
  function i(){ if(isOn()) console.info.apply(console, arguments); }
  function w(){ console.warn.apply(console, arguments); }
  function e(){ console.error.apply(console, arguments); }
  window.Log = {d:d, i:i, w:w, e:e};
})();

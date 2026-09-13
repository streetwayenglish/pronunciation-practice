// ============================================================================
// LOGGER — leveled logging.
//
// Debug/info logs are always enabled while diagnosing the native app.
// ============================================================================
(function(){
  function d(){ console.log.apply(console, arguments); }
  function i(){ console.info.apply(console, arguments); }
  function w(){ console.warn.apply(console, arguments); }
  function e(){ console.error.apply(console, arguments); }
  window.Log = {d:d, i:i, w:w, e:e};
})();

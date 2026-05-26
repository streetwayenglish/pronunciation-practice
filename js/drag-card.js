// ============================================================================
// drag-card.js — Manual drag-to-shift gesture for the Emma chat
// ----------------------------------------------------------------------------
// Lets users nudge the entire .emma-card up or down by dragging the .emma-footer
// (the black dock around the mic). Useful when iOS status bar / Dynamic Island
// clips the top nav, or when the home indicator covers the mic.
//
// • Tap on a button (mic, ?, End) → button tap (unchanged behavior)
// • Drag on dock dead space → card translates with finger
// • Limits: +120px down, -40px up, with iOS-style rubber band past the limits
// • Release: snaps back from rubber zone to the hard limit
// • Double-tap dock dead space → reset to original position
// • Mobile only (viewport ≤ 600px)
// ============================================================================

(function(){
  var MAX_DOWN = 120;
  var MAX_UP   = -40;
  var RUBBER   = 0.3;

  var card = null;
  var lastCard = null;
  var startY = 0;
  var startTranslate = 0;
  var currentTranslate = 0;
  var isDragging = false;
  var lastTapTime = 0;
  var lastTouchY = 0;

  function withRubberBand(raw){
    if (raw > MAX_DOWN) return MAX_DOWN + (raw - MAX_DOWN) * RUBBER;
    if (raw < MAX_UP)   return MAX_UP   + (raw - MAX_UP)   * RUBBER;
    return raw;
  }
  function clampToLimits(v){
    return Math.max(MAX_UP, Math.min(MAX_DOWN, v));
  }
  function isButton(el){
    return el && (el.tagName === 'BUTTON' || (el.closest && el.closest('button')));
  }
  function applyTransform(v){
    if (!card) return;
    card.style.transform = (v === 0) ? '' : 'translateY(' + v + 'px)';
  }
  function setSmoothTransition(on){
    if (!card) return;
    card.style.transition = on ? 'transform 0.2s ease-out' : 'none';
  }

  function onTouchMove(e){
    if (!isDragging) return;
    lastTouchY = e.touches[0].clientY;
    var raw = startTranslate + (lastTouchY - startY);
    applyTransform(withRubberBand(raw));
    e.preventDefault();
  }
  function onTouchEnd(){
    if (!isDragging) return;
    isDragging = false;
    setSmoothTransition(true);
    var raw = startTranslate + (lastTouchY - startY);
    currentTranslate = clampToLimits(raw);
    applyTransform(currentTranslate);
    document.removeEventListener('touchmove', onTouchMove);
    document.removeEventListener('touchend', onTouchEnd);
    document.removeEventListener('touchcancel', onTouchEnd);
  }

  document.addEventListener('touchstart', function(e){
    // Mobile only — desktop chat layout is different, drag would feel wrong
    if (window.innerWidth > 600) return;

    var footer = e.target.closest && e.target.closest('.emma-footer');
    if (!footer) return;
    if (isButton(e.target)) return;

    var foundCard = footer.closest('.emma-card');
    if (!foundCard) return;

    // If the DOM card changed (e.g. user navigated away and came back),
    // reset our internal state so the drag starts from a fresh 0.
    if (foundCard !== lastCard) {
      currentTranslate = 0;
      lastCard = foundCard;
    }
    card = foundCard;

    // Double-tap to reset
    var now = Date.now();
    if (now - lastTapTime < 350) {
      currentTranslate = 0;
      setSmoothTransition(true);
      applyTransform(0);
      lastTapTime = 0;
      return;
    }
    lastTapTime = now;

    startY = e.touches[0].clientY;
    lastTouchY = startY;
    startTranslate = currentTranslate;
    isDragging = true;
    setSmoothTransition(false);

    document.addEventListener('touchmove', onTouchMove, { passive: false });
    document.addEventListener('touchend', onTouchEnd, { passive: true });
    document.addEventListener('touchcancel', onTouchEnd, { passive: true });
  }, { passive: true });
})();

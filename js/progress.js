// ============================================================================
// PROGRESS — getProgress/saveProgress/advanceProgress + level names
// ============================================================================
var DEV_UNLOCK_ALL = false;

function getProgress(topic) {
  if(DEV_UNLOCK_ALL) return { unit: 1, expressionIndex: 0, sessionsThisUnit: 0 };
  try {
    var key = 'emma_progress_' + topic.replace(/\s+/g,'_');
    var saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch(e) {}
  return { unit: 1, expressionIndex: 0, sessionsThisUnit: 0 };
}

// DEV: jump to any unit for testing
function devGoToUnit(topic, unitNum){
  var progress = { unit: unitNum, expressionIndex: 0, sessionsThisUnit: 0 };
  saveProgress(topic, progress);
  console.log('Dev: jumped to unit ' + unitNum + ' for ' + topic);
}

function saveProgress(topic, progress) {
  try {
    var key = 'emma_progress_' + topic.replace(/\s+/g,'_');
    localStorage.setItem(key, JSON.stringify(progress));
  } catch(e) {}
}

function getCurrentUnit(topic) {
  var progress = getProgress(topic);
  var units = CURRICULUM[topic];
  if (!units) return null;
  var unitIndex = Math.min(progress.unit - 1, units.length - 1);
  return units[unitIndex];
}

function getExpressionsForSession(topic) {
  var progress = getProgress(topic);
  var unit = getCurrentUnit(topic);
  if (!unit) return [];
  var start = progress.expressionIndex;
  // Return 3 expressions from current position (wrap if needed)
  var exprs = [];
  for (var i = 0; i < 3; i++) {
    var idx = (start + i) % unit.expressions.length;
    exprs.push(unit.expressions[idx]);
  }
  return exprs;
}

function advanceProgress(topic, expressionsTaught) {
  var progress = getProgress(topic);
  var unit = getCurrentUnit(topic);
  if (!unit) return;

  progress.expressionIndex = (progress.expressionIndex + expressionsTaught) % unit.expressions.length;
  progress.sessionsThisUnit = (progress.sessionsThisUnit || 0) + 1;

  // Advance to next unit when all expressions have been taught
  if (progress.expressionIndex === 0) {
    progress.unit = Math.min(progress.unit + 1, CURRICULUM[topic].length);
    progress.sessionsThisUnit = 0;
  }

  saveProgress(topic, progress);
}


// ── CONTEXT IMAGES ───────────────────────────────────────────────────────────
// Show a small contextual image when Emma introduces a concrete expression
// Only for concrete nouns/objects, only when relevant, never blocks conversation

var _imageCache = {};





// ── CURRICULUM PROGRESS PANEL ────────────────────────────────────────────────

var LEVEL_NAMES = {
  'Conversation':     ['Finding Your Voice','Speaking With Clarity','Speaking With Depth','Speaking With Confidence'],
  'Business English': ['Professional Foundations','Communication Skills','Advanced Professional English','Executive English'],
  'Travel English':   ['Getting There','Getting Around','Going Deeper','Like a Local'],
  'Job Interview':    ['Interview Foundations','Core Interview Skills','Advanced Techniques','Interview Mastery'],
  'The Bible in English': ['In the Beginning','The Promised King','The Life of Jesus','The Living Church'],
};

var UNITS_PER_LEVEL = 5; // Conversation has 5 per level; Bible/Travel have varied but ~5

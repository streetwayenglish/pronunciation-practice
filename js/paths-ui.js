// ============================================================================
// PATHS UI — desktop sidebar picker + curriculum progress modal
// ============================================================================

// ── STREETWAY DESKTOP ────────────────────────────────────────────────
// Full-page picker shown on viewports >= 1024px (replaces the modal on
// desktop). Reads from CURRICULUM and getProgress, writes via saveProgress
// and switchMode('emma') — same mechanism as selectAndStart/cpStart.

var SW_CATEGORIES = {
  "Conversation": "Foundation",
  "Business English": "Professional",
  "Travel English": "Lifestyle",
  "Job Interview": "Career",
  "The Bible in English": "Faith"
};

var SW_LEVEL_NAMES_DEFAULT = ['Finding Your Voice','Speaking With Clarity','Natural Flow','Fluent & Confident'];

var swState = { topic: null, level: 0, selectedUnit: 1 };

function swPathProgress(topic){
  var units = CURRICULUM[topic];
  if(!units || !units.length) return {done:0,total:0,pct:0,started:false};
  var p = getProgress(topic);
  var current = p.unit || 1;
  var done = Math.max(0, current - 1);
  var total = units.length;
  var pct = total > 0 ? Math.round((done/total)*100) : 0;
  return {done:done,total:total,pct:pct,started:done>0};
}

function swInit(){
  var paths = Object.keys(CURRICULUM);
  if(!swState.topic || !CURRICULUM[swState.topic]){
    swState.topic = window._lastTopic && CURRICULUM[window._lastTopic] ? window._lastTopic : paths[0];
  }
  var units = CURRICULUM[swState.topic];
  if(!units) return;
  var progress = getProgress(swState.topic);
  var currentUnit = progress.unit || 1;
  var unitsPerLevel = Math.ceil(units.length / 4);
  swState.level = Math.min(3, Math.max(0, Math.floor((currentUnit - 1) / unitsPerLevel)));
  swState.selectedUnit = currentUnit;
  swRenderSidebar();
  swRenderMain();
}

function swRenderSidebar(){
  var paths = Object.keys(CURRICULUM);
  var romans = ['i','ii','iii','iv','v','vi','vii','viii'];
  var html = '';
  for(var i = 0; i < paths.length; i++){
    var p = paths[i];
    var prog = swPathProgress(p);
    var cat = SW_CATEGORIES[p] || 'Path';
    var isActive = p === swState.topic;
    var progText = prog.started ? (prog.done + ' of ' + prog.total + ' units \u00B7 ' + prog.pct + '%') : 'Not started';
    var safe = p.replace(/'/g, "\\'");
    html += '<button class="sw-path-item' + (isActive ? ' sw-active' : '') + '" onclick="swSelectPath(\'' + safe + '\')">' +
      '<span class="sw-path-num">' + romans[i] + '.</span>' +
      '<div class="sw-path-body">' +
        '<span class="sw-path-tag">' + cat + '</span>' +
        '<span class="sw-path-name">' + p + '</span>' +
        '<span class="sw-path-progress">' + progText + '</span>' +
      '</div>' +
    '</button>';
  }
  var el = document.getElementById('swPathList');
  if(el) el.innerHTML = html;
}

function swRenderMain(){
  var topic = swState.topic;
  var units = CURRICULUM[topic];
  if(!units) return;
  var progress = getProgress(topic);
  var currentUnit = progress.unit || 1;
  var doneCount = currentUnit - 1;
  var total = units.length;
  var pct = Math.round((doneCount / total) * 100);
  var levelNames = (window.LEVEL_NAMES && window.LEVEL_NAMES[topic]) || SW_LEVEL_NAMES_DEFAULT;
  var unitsPerLevel = Math.ceil(total / 4);

  // Topbar
  var eyebrow = document.getElementById('swTopicEyebrow');
  if(eyebrow) eyebrow.textContent = topic;
  var progNum = document.getElementById('swProgNum');
  if(progNum) progNum.innerHTML = doneCount + '<span class="sw-progress-slash">/' + total + '</span>';
  var progFill = document.getElementById('swProgFill');
  if(progFill) progFill.style.width = pct + '%';
  var progPct = document.getElementById('swProgPct');
  if(progPct) progPct.textContent = pct + '%';

  // Level tabs
  var tabsHtml = '';
  for(var l = 0; l < 4; l++){
    tabsHtml += '<button class="sw-tab' + (l === swState.level ? ' sw-on' : '') + '" onclick="swSelectLevel(' + l + ')">Level ' + (l + 1) + '</button>';
  }
  var tabsEl = document.getElementById('swTabs');
  if(tabsEl) tabsEl.innerHTML = tabsHtml;

  // Level name
  var lvlEl = document.getElementById('swLevelName');
  if(lvlEl) lvlEl.textContent = (levelNames[swState.level] || ('Level ' + (swState.level + 1))).toUpperCase();

  // Units in this level
  var lvlStart = swState.level * unitsPerLevel;
  var lvlEnd = Math.min(lvlStart + unitsPerLevel, total);
  var unitsHtml = '';
  for(var u = lvlStart; u < lvlEnd; u++){
    var unit = units[u];
    var unitNum = u + 1;
    var isDone = unitNum < currentUnit;
    var isCurrent = unitNum === currentUnit;
    var isSelected = unitNum === currentUnit;
    var dotCls = isDone ? 'sw-dot-done' : isCurrent ? 'sw-dot-cur' : 'sw-dot-up';
    var icon = isDone
      ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>'
      : isCurrent
        ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>'
        : unitNum;
    var nameCls = isDone ? 'sw-done' : isCurrent ? 'sw-cur' : 'sw-up';
    var exCount = ((unit.expressions) || []).length || 5;
    var metaText = isDone ? 'Completed' : isCurrent ? 'In progress' : (exCount + ' exercises');
    var metaCls = isCurrent ? 'sw-umeta sw-cur' : 'sw-umeta';
    unitsHtml +=
      '<div class="sw-urow' + (isSelected ? ' sw-selected' : '') + '" onclick="swStart(' + unitNum + ')">' +
        '<div class="sw-dot ' + dotCls + '">' + icon + '</div>' +
        '<div class="sw-uinfo">' +
          '<div class="sw-uname ' + nameCls + '">' + unit.title + '</div>' +
          '<div class="' + metaCls + '">' + metaText + '</div>' +
        '</div>' +
        '<div class="sw-uarrow">\u2192</div>' +
      '</div>';
  }
  var unitsEl = document.getElementById('swUnits');
  if(unitsEl) unitsEl.innerHTML = unitsHtml;

  swUpdateCta();
}

function swUpdateCta(){
  var topic = swState.topic;
  var units = CURRICULUM[topic];
  if(!units) return;
  var progress = getProgress(topic);
  var currentUnit = progress.unit || 1;
  var unit = units[currentUnit - 1];
  if(!unit) return;
  var lbl = document.getElementById('swCtaLabel');
  if(lbl) lbl.textContent = 'Continue \u00B7 Unit ' + currentUnit + ' \u00B7 ' + unit.title;
}

function swSelectPath(topic){
  console.log('[ui] swSelectPath -> "'+topic+'"');
  if(!CURRICULUM[topic]) return;
  swState.topic = topic;
  var progress = getProgress(topic);
  var currentUnit = progress.unit || 1;
  var unitsPerLevel = Math.ceil(CURRICULUM[topic].length / 4);
  swState.level = Math.min(3, Math.max(0, Math.floor((currentUnit - 1) / unitsPerLevel)));
  swState.selectedUnit = currentUnit;
  swRenderSidebar();
  swRenderMain();
}

function swSelectLevel(lvl){
  swState.level = lvl;
  swRenderMain();
}

function swSelectUnit(unitNum){
  // Kept for backwards compatibility — clicking a unit now starts it.
  swStart(unitNum);
}

function swStart(unitNum){
  var topic = swState.topic;
  if(!topic || !CURRICULUM[topic]) return;
  if(!unitNum){
    var p = getProgress(topic);
    unitNum = p.unit || 1;
  }
  console.log('[ui] swStart topic="'+topic+'" unit='+unitNum);
  swState.selectedUnit = unitNum;
  var progress = getProgress(topic);
  progress.unit = unitNum;
  progress.expressionIndex = 0;
  saveProgress(topic, progress);
  window._lastTopic = topic;
  window._emmaTopic = topic;
  try { emmaTopic = topic; } catch(e) {}
  document.body.classList.remove('show-topics');
  var swd = document.getElementById('swDesktop');
  if(swd) swd.style.display = 'none';
  var tp = document.getElementById('topicPage');
  if(tp) tp.style.display = 'none';
  var main = document.querySelector('.main');
  if(main) main.style.display = '';
  window._wuGo ? window._wuGo() : switchMode('emma');
}

function showCurriculumProgress(topic, onStart){
  var units = CURRICULUM[topic];
  if(!units){ onStart(); return; }

  var progress = getProgress(topic);
  var currentUnit = progress.unit || 1;
  var totalUnits = units.length;
  var doneCount = currentUnit - 1;
  var levelNames = (window.LEVEL_NAMES && window.LEVEL_NAMES[topic]) || ['Finding Your Voice','Speaking With Clarity','Natural Flow','Fluent & Confident'];
  var unitsPerLevel = Math.ceil(totalUnits / 4);
  var currentLevel = Math.min(3, Math.max(0, Math.floor((currentUnit - 1) / unitsPerLevel)));

  // ── Gold-underline tabs ──
  var segmentedHtml = '<div class="cp-segmented-wrap"><div class="cp-segmented">';
  for(var l=0; l<4; l++){
    segmentedHtml += '<button class="cp-seg-pill'+(l===currentLevel?' active':'')+'" onclick="cpSwitchLevel('+l+')">Level '+(l+1)+'</button>';
  }
  segmentedHtml += '</div></div>';

  // ── Level panes (only active visible) ──
  var levelsHtml = '<div class="cp-levels-wrap">';
  for(var lvl=0; lvl<4; lvl++){
    var lvlStart = lvl * unitsPerLevel;
    var lvlEnd = Math.min(lvlStart + unitsPerLevel, totalUnits);
    levelsHtml += '<div class="cp-level-pane'+(lvl===currentLevel?' active':'')+'" data-level="'+lvl+'">';
    levelsHtml += '<div class="cp-level-subtitle">'+(levelNames[lvl]||'Level '+(lvl+1))+'</div>';
    for(var u=lvlStart; u<lvlEnd; u++){
      var unit = units[u];
      var unitNum = u + 1;
      var isDone = unitNum < currentUnit;
      var isCurrent = unitNum === currentUnit;
      var cls = 'cp-unit' + (isDone?' done':isCurrent?' current':'');
      var statusInner;
      if(isDone){
        statusInner = '<svg width="10" height="10" viewBox="0 0 24 24" fill="#fff"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>';
      } else {
        statusInner = unitNum;
      }
      var tag = isCurrent ? '<span class="cp-unit-now">NOW</span>' : '';
      levelsHtml +=
        '<div class="'+cls+'" onclick="cpSelectUnit('+unitNum+')" data-unit="'+unitNum+'">'+
          '<div class="cp-unit-status">'+statusInner+'</div>'+
          '<div class="cp-unit-title">'+unit.title+'</div>'+
          tag+
        '</div>';
    }
    levelsHtml += '</div>';
  }
  levelsHtml += '</div>';

  var overlay = document.createElement('div');
  overlay.className = 'cp-overlay';
  overlay.id = 'cpOverlay';
  // Tap outside the panel to close
  overlay.onclick = function(e){ if(e.target === overlay) cpClose(); };

  overlay.innerHTML =
    '<div class="cp-panel">'+
      '<div class="cp-drag-row"><div class="cp-drag-pill"></div></div>'+
      '<div class="cp-header">'+
        '<div class="cp-header-left">'+
          '<div class="cp-topic-label">'+topic+'</div>'+
          '<div class="cp-topic-name">Choose your unit</div>'+
        '</div>'+
        '<div class="cp-header-right">'+
          '<div class="cp-count">'+doneCount+'<span class="cp-count-slash">/'+totalUnits+'</span></div>'+
          '<div class="cp-count-label">Done</div>'+
        '</div>'+
      '</div>'+
      segmentedHtml+
      levelsHtml+
      '<div class="cp-footer">'+
        '<button class="cp-start-btn" id="cpStartBtn" onclick="cpStart()">Continue \u2192 Unit '+currentUnit+'</button>'+
      '</div>'+
    '</div>';

  document.body.appendChild(overlay);
  window._cpOnStart = onStart;
  window._cpSelectedUnit = currentUnit;
  window._cpTopic = topic;
}
// Switch the visible level pane when a segmented pill is tapped
function cpSwitchLevel(lvl){
  var pills = document.querySelectorAll('.cp-seg-pill');
  for(var i=0;i<pills.length;i++){
    if(i===lvl) pills[i].classList.add('active');
    else pills[i].classList.remove('active');
  }
  var panes = document.querySelectorAll('.cp-level-pane');
  for(var j=0;j<panes.length;j++){
    if(parseInt(panes[j].dataset.level,10)===lvl) panes[j].classList.add('active');
    else panes[j].classList.remove('active');
  }
}

// Switch path from the desktop sidebar — re-renders the picker with the new topic
function cpSwitchPath(newTopic){
  if(newTopic === window._cpTopic) return;
  var onStart = window._cpOnStart;
  cpClose();
  window._emmaTopic = newTopic;
  window._lastTopic = newTopic;
  showCurriculumProgress(newTopic, onStart);
}
function toRoman(n){
  var r=['i','ii','iii','iv','v','vi','vii','viii','ix','x','xi','xii','xiii','xiv','xv','xvi','xvii','xviii','xix','xx'];
  return r[n-1]||n;
}

function cpSelectUnit(unitNum){
  console.log('[ui] cpSelectUnit -> '+unitNum);
  window._cpSelectedUnit = unitNum;
  var units = CURRICULUM[window._emmaTopic];
  if(!units) return;
  var unit = units[unitNum-1];
  if(!unit) return;
  var btn = document.getElementById('cpStartBtn');
  if(btn) btn.textContent = 'Continue → Unit '+unitNum;
  document.querySelectorAll('.cp-unit').forEach(function(el){
    el.classList.remove('current');
    el.style.opacity = '0.5';
  });
  document.querySelectorAll('[data-unit="'+unitNum+'"]').forEach(function(el){
    el.classList.add('current');
    el.style.opacity = '1';
  });
}

function cpStart(){
  console.log('[tap] cpStartBtn (Continue) topic="'+window._emmaTopic+'" unit='+window._cpSelectedUnit);
  // Override progress to selected unit if different
  var topic = window._emmaTopic;
  if(window._cpSelectedUnit){
    var progress = getProgress(topic);
    progress.unit = window._cpSelectedUnit;
    progress.expressionIndex = 0;
    saveProgress(topic, progress);
  }
  cpClose();
  if(window._cpOnStart) window._cpOnStart();
}

function cpClose(){
  var overlay = document.getElementById('cpOverlay');
  if(overlay) overlay.remove();
}

// ── DEV: test exercises without a conversation ────────────────────────────────
window.testExercises=function(){
  window._lastReport={
    headline:'Test Session',score:'B',summary:'Test mode.',
    mistakes:[{title:'Test mistake',detail:'Example detail.'}],
    improvements:[{title:'Test area',detail:'Example advice.'}],
    positive:'Good effort!',
    exercises:[
      {question:'Choose the correct form: "She ___ to work every day."',options:['go','goes','going','gone'],answer:1,tip:'"She" is third person singular, so we add -s: goes.'},
      {question:'Which sentence is correct?',options:['I have went there.','I have gone there.','I went there yesterday.','I going there.'],answer:2,tip:'Use simple past (went) for finished actions with a time reference like "yesterday".'},
      {question:'Complete: "How long ___ you been studying English?"',options:['have','has','did','do'],answer:0,tip:'Use "have" with "you" in present perfect questions.'},
      {question:'Choose the right preposition: "I am good ___ English."',options:['in','at','on','with'],answer:1,tip:'"Good at" is the correct collocation for skills.'},
      {question:'Which is the correct question form?',options:['What you do on weekends?','What do you do on weekends?','What you doing on weekends?','What does you do on weekends?'],answer:1,tip:'Questions need auxiliary "do/does": What do you do...?'}
    ]
  };
  window._lastHistory=[
    {role:'assistant',content:'Hi! How has your day been so far?'},
    {role:'user',content:'My day not be good.'},
    {role:'assistant',content:'Oh no, sorry to hear that! What happened?'}
  ];
  window._lastTopic='Test conversation';
  downloadExercises();
};
// Run window.testExercises() in the browser console to test

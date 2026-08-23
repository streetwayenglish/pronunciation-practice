// ============================================================================
// HOME — topic selection page + mobile home navigation
// ============================================================================

// ── TOPIC SELECTION ─────────────────────────────────────────────────────────
var _selectedTopic = null;

function showTopicPage(){
  document.body.classList.add('show-topics');
  document.body.classList.remove('tab-conversation');
  // Clear area
  var area = document.getElementById('area');
  if(area) area.innerHTML = '';
  // Remove nav bar
  var navBar = document.querySelector('.emma-nav-bar');
  if(navBar) navBar.remove();
  // Force hide hdr and main
  var hdr = document.querySelector('.hdr');
  var main = document.querySelector('.main');
  if(hdr) hdr.style.display = 'none';
  if(main) main.style.display = 'none';
  // Viewport-aware routing:
  //   ≥1024px → sw-desktop full-page layout
  //   <1024px → new mobile home (Today/Paths/Activity/You)
  var tp = document.getElementById('topicPage');
  var swd = document.getElementById('swDesktop');
  var mh = document.getElementById('mobileHome');
  if(window.innerWidth >= 1024){
    if(tp) tp.style.display = 'none';
    if(mh) mh.style.display = 'none';
    if(swd){
      swd.style.display = 'grid';
      if(typeof swInit === 'function') swInit();
    }
  } else {
    if(tp) tp.style.display = 'none';
    if(swd) swd.style.display = 'none';
    if(mh){
      mh.style.display = 'flex';
      if(typeof mhInit === 'function') mhInit();
    }
  }
}

// ═════════ MOBILE HOME ═════════════════════════════════════════════
// Today / Paths / Activity / You tab system. Replaces the old 5-card
// topic-page on viewports <1024px. Desktop continues to use sw-desktop.

var mhPathOrder = ['Conversation','Business English','Travel English','Job Interview','The Bible in English'];

function mhGetCurrentPath(){
  var stored = localStorage.getItem('streetway_current_path');
  if(stored && CURRICULUM[stored]) return stored;
  // Default: first path with progress, else Conversation
  for(var i=0;i<mhPathOrder.length;i++){
    var p = mhPathOrder[i];
    if(CURRICULUM[p] && getProgress(p).unit > 1) return p;
  }
  return 'Conversation';
}

function mhSetCurrentPath(name){
  if(!CURRICULUM[name]) return;
  try{ localStorage.setItem('streetway_current_path', name); }catch(e){}
}

function mhGetTotalUnitsDone(){
  var total = 0;
  for(var p in CURRICULUM){
    total += Math.max(0, (getProgress(p).unit || 1) - 1);
  }
  return total;
}

function mhGetStreak(){
  try{ return parseInt(localStorage.getItem('streetway_streak') || '12', 10); }catch(e){ return 12; }
}

function mhGetIssueNumber(){
  try{
    var n = parseInt(localStorage.getItem('streetway_issue_num') || '12', 10);
    return ('00' + n).slice(-3);
  }catch(e){ return '012'; }
}

function mhFormatDate(d){
  d = d || new Date();
  var days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  return days[d.getDay()] + ', ' + months[d.getMonth()] + ' ' + d.getDate();
}

function mhSplitTitle(title){
  // Split a 2+ word title across two lines for editorial effect.
  // Single words get italicized whole.
  var parts = title.split(' ');
  if(parts.length === 1){
    return '<em>' + title + '.</em>';
  }
  var mid = Math.ceil(parts.length / 2);
  return parts.slice(0,mid).join(' ') + '<br><em>' + parts.slice(mid).join(' ') + '.</em>';
}

function mhShowNameScreenIfNeeded(){
  var hasName = localStorage.getItem('streetway_user_name');
  var skipped = localStorage.getItem('streetway_skip_name');
  if(hasName || skipped) return;
  var sc = document.getElementById('mhNameScreen');
  if(!sc) return;
  sc.classList.add('active');
  setTimeout(function(){
    var inp = document.getElementById('mhNameInput');
    if(inp) inp.focus();
  }, 250);
}
function mhSaveName(){
  var inp = document.getElementById('mhNameInput');
  var name = (inp && inp.value || '').trim();
  if(name){
    localStorage.setItem('streetway_user_name', name);
  } else {
    localStorage.setItem('streetway_skip_name', '1');
  }
  mhDismissNameScreen();
}
function mhSkipName(){
  localStorage.setItem('streetway_skip_name', '1');
  mhDismissNameScreen();
}
function mhDismissNameScreen(){
  var sc = document.getElementById('mhNameScreen');
  if(sc) sc.classList.remove('active');
  if(typeof mhRenderToday === 'function') mhRenderToday();
  if(typeof mhRenderPaths === 'function') mhRenderPaths();
}

function mhPathSlug(name){
  var m={'Conversation':'conversation','Business English':'business','Travel English':'travel','Job Interview':'interview','The Bible in English':'bible'};
  return m[name] || 'conversation';
}
function mhSetActiveEmma(path){
  if(!path) return;
  var slug = mhPathSlug(path);
  document.documentElement.style.setProperty('--emma-active','var(--emma-'+slug+')');
}

function mhRenderToday(){
  var path = mhGetCurrentPath();
  mhSetActiveEmma(path);
  var units = CURRICULUM[path];
  if(!units){ return; }
  var progress = getProgress(path);
  var curUnit = Math.min(progress.unit || 1, units.length);
  var unit = units[curUnit - 1] || units[0];
  var issue = mhGetIssueNumber();
  var date = mhFormatDate();
  var streak = mhGetStreak();
  var done = mhGetTotalUnitsDone();

  var html =
    '<div class="mh-hero">'+
      '<div class="mh-hero-top">'+
        '<div class="mh-brand">Street Way English</div>'+
        '<div class="mh-issue">Issue ' + issue + ' · ' + date + '</div>'+
      '</div>'+
      '<div class="mh-hero-photo"></div>'+
      '<div class="mh-hero-body">'+
        '<div class="mh-hero-tag">Today\'s <em>session</em></div>'+
        '<div class="mh-hero-headline">' + mhSplitTitle(unit.title) + '</div>'+
        '<div class="mh-hero-rule"></div>'+
        '<div class="mh-hero-desc">' + (unit.objective || '') + '</div>'+
        '<div class="mh-hero-bottom">'+
          '<div class="mh-hero-meta">Unit ' + ('00'+curUnit).slice(-2) + ' \u00b7 5 min</div>'+
          '<button class="mh-begin" onclick="mhBegin()"><span>Begin</span><span class="arr">\u2192</span></button>'+
        '</div>'+
        '<a class="mh-units-link" onclick="mhOpenUnits()">View all ' + units.length + ' units<span class="arr">\u2192</span></a>'+
      '</div>'+
    '</div>'+
    '<div class="mh-below">'+
      '<div class="mh-section-label">This week</div>'+
      '<div class="mh-stats">'+
        '<div class="mh-stat"><div class="mh-stat-val">' + streak + '</div><div class="mh-stat-lbl">Day streak</div></div>'+
        '<div class="mh-stat"><div class="mh-stat-val">45<span class="small">m</span></div><div class="mh-stat-lbl">Practiced</div></div>'+
        '<div class="mh-stat"><div class="mh-stat-val">' + done + '</div><div class="mh-stat-lbl">Units done</div></div>'+
      '</div>'+
      '<div class="mh-browse"><a onclick="mhSwitchTab(\'paths\')"><span>Explore the full library</span><span class="arr">\u2192</span></a></div>'+
    '</div>';

  var el = document.getElementById('mhTodayContent');
  if(el) el.innerHTML = html;
}

function mhRenderPaths(){
  var current = mhGetCurrentPath();
  var romans = ['I','II','III','IV','V'];

  var outcomes = {
    'Conversation': 'Small talk, stories, opinions.',
    'Business English': 'Lead meetings, write emails, present.',
    'Travel English': 'Airports, hotels, locals — without anxiety.',
    'Job Interview': 'Land the role you want.',
    'The Bible in English': 'Read scripture with comprehension.'
  };

  var itemsHtml = '';

  for(var i = 0; i < mhPathOrder.length; i++){
    var path = mhPathOrder[i];
    if(!CURRICULUM[path]) continue;
    var isActive = (path === current);

    if(isActive){
      // ─── Expanded card ─────────────────────────────────────
      var progress = getProgress(path);
      var totalUnits = CURRICULUM[path].length;
      var curUnit = progress.unit || 1;
      var eyebrow, btnText;
      if(curUnit > 1){
        eyebrow = 'Continue here';
        btnText = 'Continue';
      } else {
        eyebrow = 'Begin here';
        btnText = 'Start';
      }

      // Italicize last word of the name
      var nameHtml;
      if(path.indexOf(' ') >= 0){
        var parts = path.split(' ');
        parts[parts.length - 1] = '<em>' + parts[parts.length - 1] + '</em>';
        nameHtml = parts.join(' ');
      } else {
        nameHtml = '<em>' + path + '</em>';
      }

      itemsHtml +=
        '<div class="mh-paths-feat" onclick="mhOpenUnits()">' +
          '<div class="mh-paths-feat-chevron">\u203a</div>' +
          '<div class="mh-paths-feat-top">' +
            '<div class="mh-paths-feat-photo"></div>' +
            '<div class="mh-paths-feat-meta-stack">' +
              '<div class="mh-paths-feat-eyebrow">' +
                '<span class="mh-paths-feat-roman">' + romans[i] + '.</span>' +
                '<span>' + eyebrow + '</span>' +
              '</div>' +
              '<div class="mh-paths-feat-name">' + nameHtml + '</div>' +
            '</div>' +
          '</div>' +
          '<div class="mh-paths-feat-row">' +
            '<span class="mh-paths-feat-fmeta">' + totalUnits + ' units \u00b7 5 min each</span>' +
            '<button class="mh-paths-feat-btn" onclick="event.stopPropagation();mhSelectPath(\'' + path.replace(/'/g,"\\'") + '\');">' +
              '<span>' + btnText + '</span>' +
              '<span class="mh-paths-feat-btn-arr">\u2192</span>' +
            '</button>' +
          '</div>' +
        '</div>';
    } else {
      // ─── Compact row ───────────────────────────────────────
      var outcome = outcomes[path] || '';
      itemsHtml +=
        '<div class="mh-paths-mini-row" onclick="mhPickPath(\'' + path.replace(/'/g,"\\'") + '\')">' +
          '<div class="mh-paths-mini-num">' + romans[i] + '</div>' +
          '<div>' +
            '<div class="mh-paths-mini-name">' + path + '</div>' +
            '<div class="mh-paths-mini-outcome">' + outcome + '</div>' +
          '</div>' +
          '<div class="mh-paths-mini-arr">\u2192</div>' +
        '</div>';
    }
  }

  var html =
    '<div class="mh-paths-top">' +
      '<span>Street Way</span>' +
      '<span>' + mhGreeting() + '</span>' +
    '</div>' +
    '<div class="mh-paths-hero">' +
      '<div class="mh-paths-title">Pick your<br><em>first path.</em></div>' +
    '</div>' +
    '<div class="mh-paths-list">' + itemsHtml + '</div>';

  var el = document.getElementById('mhPathsContent');
  if(el) el.innerHTML = html;
}

function mhPickPath(name){
  // Promote-only: switches the featured path on Paths tab, but stays there
  mhSetCurrentPath(name);
  mhSetActiveEmma(name);
  mhRenderPaths();
}
function mhGreeting(){
  var n = localStorage.getItem('streetway_user_name');
  return n ? ('Hello, ' + n + '.') : mhFormatDate();
}

function mhSelectPath(name){
  mhSetCurrentPath(name);
  mhSetActiveEmma(name);
  mhRenderToday();
  mhSwitchTab('today');
}

function mhSwitchTab(tab){
  Log.d('[ui] home tab -> '+tab);
  var screens = document.querySelectorAll('.mh-screen');
  for(var i=0;i<screens.length;i++) screens[i].classList.remove('active');
  var capped = tab.charAt(0).toUpperCase() + tab.slice(1);
  var screen = document.getElementById('mh' + capped + 'Screen');
  if(screen) screen.classList.add('active');
  var tabs = document.querySelectorAll('.mh-tab');
  for(var j=0;j<tabs.length;j++) tabs[j].classList.remove('active');
  var activeTab = document.querySelector('.mh-tab[data-mh-tab="' + tab + '"]');
  if(activeTab) activeTab.classList.add('active');
  var sc = document.getElementById('mhScreens');
  if(sc) sc.scrollTop = 0;
}

function mhBegin(){
  // Goes straight to warmup. The Today cover already committed to this unit
  // so we honor that — no intermediate picker.
  var path = mhGetCurrentPath();
  window._lastTopic = path;
  window._emmaTopic = path;
  emmaTopic = path;
  document.body.classList.remove('show-topics');
  var tp = document.getElementById('topicPage');
  if(tp) tp.style.display = 'none';
  var mh = document.getElementById('mobileHome');
  if(mh) mh.style.display = 'none';
  var hdr = document.querySelector('.hdr');
  if(hdr) hdr.style.display = '';
  var main = document.querySelector('.main');
  if(main) main.style.display = '';
  window._wuGo ? window._wuGo() : switchMode('emma');
}

function mhOpenUnits(){
  // Opens the curriculum roll-up WITHOUT pre-showing .main, so the chat
  // can't leak behind it. .main is only shown once a unit is actually picked.
  var path = mhGetCurrentPath();
  window._lastTopic = path;
  window._emmaTopic = path;
  emmaTopic = path;
  showCurriculumProgress(path, function(){
    document.body.classList.remove('show-topics');
    var tp = document.getElementById('topicPage');
    if(tp) tp.style.display = 'none';
    var mh = document.getElementById('mobileHome');
    if(mh) mh.style.display = 'none';
    var hdr = document.querySelector('.hdr');
    if(hdr) hdr.style.display = '';
    var main = document.querySelector('.main');
    if(main) main.style.display = '';
    window._wuGo ? window._wuGo() : switchMode('emma');
  });
}

function mhInit(){
  // Safety net: force-hide .main and .hdr while on mobile home, in case any
  // other code path (e.g., returning from chat) left them visible.
  var main = document.querySelector('.main');
  if(main) main.style.display = 'none';
  var hdr = document.querySelector('.hdr');
  if(hdr) hdr.style.display = 'none';
  mhSetActiveEmma(mhGetCurrentPath());
  mhRenderToday();
  mhRenderPaths();
  mhSwitchTab('today');
  // Show name capture screen on first launch if needed
  mhShowNameScreenIfNeeded();
}


function selectAndStart(topicName){
  Log.d('[ui] track selected -> "'+topicName+'"');
  window._lastTopic = topicName;
  window._emmaTopic = topicName;
  emmaTopic = topicName;
  document.body.classList.remove('show-topics');
  // Hide topic page directly
  var tp = document.getElementById('topicPage');
  if(tp) tp.style.display = 'none';
  // Show main
  var main = document.querySelector('.main');
  if(main) main.style.display = '';
  showCurriculumProgress(topicName, function(){
    window._wuGo ? window._wuGo() : switchMode('emma');
  });
}

function selectTopic(topicName, mode){
  _selectedTopic = topicName;
  window._lastTopic = topicName;
  // Highlight selected item
  var items = document.querySelectorAll('.tp-item');
  items.forEach(function(el){ el.style.opacity = '0.4'; });
  event.currentTarget.style.opacity = '1';
  // Show CTA
  var cta = document.getElementById('tp-cta-btn');
  cta.classList.add('visible');
  cta.textContent = 'Start ' + topicName + ' →';
  // Update left panel
  document.querySelector('.tp-headline').innerHTML = 'Your<br><em>' + topicName.toLowerCase() + '</em>';
}

function startSelectedTopic(){
  if(!_selectedTopic) return;
  document.body.classList.remove('show-topics');
  // Reset item opacities
  var items = document.querySelectorAll('.tp-item');
  items.forEach(function(el){ el.style.opacity = '1'; });
  window._wuGo ? window._wuGo() : switchMode('emma');
}


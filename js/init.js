// ============================================================================
// INIT — boot: teacher-query check, mic permission, startup, resize listener
// MUST load last so all referenced functions are defined.
// ============================================================================

if(window.location.search.indexOf('teacher')!==-1)showTeacherLogin();

// Check mic permission on load and show banner if denied
if(navigator.permissions&&navigator.permissions.query){
  navigator.permissions.query({name:'microphone'}).then(function(p){
    if(p.state==='denied'){
      var b=document.getElementById('micBanner');
      if(b)b.classList.add('show');
    }
    p.onchange=function(){
      var b=document.getElementById('micBanner');
      if(b){
        if(p.state==='denied')b.classList.add('show');
        else b.classList.remove('show');
      }
    };
  }).catch(function(){});
}

// Pronunciation fetch disabled — available at separate URL
// MC fetch disabled — available at separate URL
// Show topic selection page on load
appMode='emma';
showTopicPage();
// Don't call render() — it shows the pronunciation card
// renderEmma() will be called when student selects a topic

function showSuggestionOnboarding(){
  var hb=document.getElementById('emmaHintBtn');if(!hb)return;
  hb.classList.remove('glow-white');void hb.offsetWidth;hb.classList.add('glow-white');
  var existing=document.getElementById('_sugLabel');if(existing)existing.remove();
  // Briefly hide the "tap to speak" caption so the tooltip doesn't overlap it.
  var st=document.getElementById('emmaStatus');
  if(st){st.style.transition='opacity .25s ease';st.style.opacity='0';}
  // Styling lives in conversation.css (body.tab-conversation .pron-onboard-label) — Option B.
  var rect=hb.getBoundingClientRect();
  var micBtn=document.getElementById('emmaMicBtn');
  var refTop=micBtn?micBtn.getBoundingClientRect().top:rect.top;
  var lbl=document.createElement('div');
  lbl.id='_sugLabel';lbl.className='pron-onboard-label';
  lbl.textContent='Sugestão de resposta';
  lbl.style.cssText='bottom:'+(window.innerHeight-refTop+6)+'px;left:'+rect.left+'px;animation:sugFadeIn 5s ease forwards;';
  document.body.appendChild(lbl);
  setTimeout(function(){if(lbl.parentNode)lbl.remove();if(st)st.style.opacity='';},5200);
  setTimeout(function(){hb.classList.remove('glow-white');},3500);
}
// Re-evaluate which path-selection layout to show when the viewport
// crosses the 1024px desktop threshold.
window.addEventListener('resize', function(){
  if(document.body.classList.contains('show-topics')){
    if(typeof showTopicPage === 'function') showTopicPage();
  }
});


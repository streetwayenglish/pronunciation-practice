// ============================================================================
// WARMUP — pre-session warm-up module (self-contained IIFE)
// ============================================================================
// ════════════════════════════════════════════════════════════════════════
// WARMUP MODULE
// ════════════════════════════════════════════════════════════════════════
;(function(){

var WU_R2 = 'https://pub-6854c22656e84873836dc1d4ca2ff6ae.r2.dev';

// Exact phrases from heygen_batch_files.txt — all 500
var WU_PHRASES = {
  conv:[
    ['Nice to meet you.','Where are you from?','What do you do?','It\'s a pleasure to meet you.','How did you end up here?'],
    ['How\'s it going?','How was your weekend?','What have you been up to?','It\'s been a while.','Nice weather today, isn\'t it?'],
    ['How was your day?','It\'s been a long day.','Nothing much, just the usual.','You\'ll never guess what happened.','I\'m exhausted.'],
    ['I think that...','In my opinion...','Honestly, I\'d say...','I\'m not sure, but...','The way I see it...'],
    ['What do you mean by that?','Could you tell me more?','Why do you think that?','How did that make you feel?','What was that like?'],
    ['I completely agree.','I see your point.','I\'m not so sure about that.','That\'s a good point.','I have to disagree.'],
    ['Let me tell you what happened.','So this one time...','You won\'t believe this.','Long story short...','And then...'],
    ['She\'s really kind.','It\'s an amazing place.','He\'s the kind of person who...','It reminds me of...','You\'d love it there.'],
    ['Sorry, what did you say?','What I meant was...','Could you say that again?','Let me explain.','I think there\'s been a misunderstanding.'],
    ['Thank you, that means a lot.','You look great.','That\'s really kind of you.','I appreciate that.','You\'re too kind.'],
    ['When I was younger...','I used to...','Looking back...','That was years ago.','If I could go back...'],
    ['I hope to...','One day I want to...','I\'m planning to...','In a few years...','I can\'t wait to...'],
    ['It depends on...','On the one hand... on the other...','That\'s an interesting idea.','Have you ever thought about...?','What if...?'],
    ['You\'re kidding!','That\'s hilarious.','I can\'t believe it.','No way!','That made my day.'],
    ['I\'m really happy about that.','It made me feel...','I was so surprised.','I\'m a bit nervous.','Honestly, I\'m grateful.'],
    ['Can I add something?','Sorry to interrupt, but...','What do you think?','Going back to what you said...','Before we move on...'],
    ['Have you considered...?','What if we tried...?','Here\'s why I think it works.','Just hear me out.','Let\'s give it a chance.'],
    ['Can we talk?','I want to be honest with you.','I see where you\'re coming from.','Let\'s find a solution.','I appreciate you bringing this up.'],
    ['Where I\'m from...','In my culture...','It\'s a tradition to...','We usually...','It depends on the family.'],
    ['It was great talking to you.','Let\'s stay in touch.','Take care.','Thanks for the conversation.','I really enjoyed this.'],
  ],
  biz:[
    ['Nice to meet you.','It\'s a pleasure to meet you.','What do you do?','I work in...','How long have you been with the company?'],
    ['How\'s your week going?','Did you have a good weekend?','How\'s everything on your end?','Have you been busy lately?','How\'s the team doing?'],
    ['I hope this email finds you well.','Thank you for getting back to me.','Please let me know if you have any questions.','I\'m following up on...','Looking forward to hearing from you.'],
    ['Are you free on Tuesday?','What time works for you?','Let\'s set up a meeting.','Could we reschedule?','I\'ll send you a calendar invite.'],
    ['Sorry I\'m a bit late.','Could you hear me okay?','I\'d like to add something here.','Just to make sure I understand...','Thanks for having me.'],
    ['Let\'s get started.','Today we\'ll be covering...','Let\'s hear from everyone.','Let\'s move on to the next point.','Any questions before we wrap up?'],
    ['Thank you all for joining today.','I\'d like to walk you through...','As you can see on this slide...','Let me give you a quick overview.','I\'d be happy to take any questions.'],
    ['What did you have in mind?','Could we meet in the middle?','I see your point, but...','Is there any flexibility on that?','Let\'s see what we can do.'],
    ['I really appreciate your work on this.','One thing to consider is...','Could you give me some feedback?','Thanks, that\'s really helpful.','I\'ll take that on board.'],
    ['I understand your concern.','Let\'s see how we can fix this.','I\'m sorry to hear that.','What would you like me to do?','Let me look into this and get back to you.'],
    ['I have an idea I\'d like to share.','Imagine if we could...','Here\'s why I think this works.','The biggest benefit is...','What do you think?'],
    ['How do you know the host?','What brings you here today?','Do you have a card?','Let\'s stay in touch.','It was great meeting you.'],
    ['Could you tell me more about that?','I want to make sure I\'m respectful.','How do you usually do this in your culture?','Please correct me if I get something wrong.','I appreciate you explaining that to me.'],
    ['Here\'s a quick update.','We\'re on track.','We\'re a bit behind schedule.','The main blocker is...','Next steps are...'],
    ['Please find the report attached.','The key findings are...','Based on the data...','Our recommendation is...','Happy to discuss any of this further.'],
    ['I trust your judgment.','Let me know what support you need.','How can I help?','Great work, everyone.','Let\'s regroup tomorrow.'],
    ['Could I get your input on something?','I wanted to keep you in the loop.','I have a recommendation.','What are your priorities right now?','When you have a moment, could we chat?'],
    ['Thank you for letting me know.','We\'re taking this seriously.','Here\'s what we\'re doing about it.','I\'ll have an update for you soon.','I appreciate your patience.'],
    ['Thank you for the offer.','I\'d like to discuss the compensation.','Based on my research, I was expecting...','Is there room for flexibility?','I\'m excited about this opportunity.'],
    ['Let me walk you through the proposal.','The opportunity is significant.','Here\'s the business case.','The expected return is...','What\'s holding us back?'],
  ],
  travel:[
    ['Where do I check in?','Could I see your passport, please?','Just one bag to check.','What\'s the gate number?','Is the flight on time?'],
    ['What\'s the purpose of your visit?','I\'m here for vacation.','How long will you be staying?','Just two weeks.','I\'m staying at a hotel.'],
    ['Where\'s the nearest metro?','How do I get to the city center?','How much is a taxi to downtown?','Could you call me a cab?','Is it walking distance?'],
    ['I have a reservation under...','Is breakfast included?','What time is check-out?','Could I get an extra towel?','Is there Wi-Fi in the room?'],
    ['Could I see the menu, please?','What do you recommend?','I\'ll have the...','Could we get the check, please?','Is service included?'],
    ['How much is this?','Do you have this in another size?','I\'m just looking, thanks.','Do you take credit cards?','Could I have a receipt?'],
    ['There\'s a problem with...','Could you help me?','I\'d like to speak to a manager.','What\'s the best way to fix this?','I appreciate your help.'],
    ['Where are you from?','How long have you been traveling?','What have you seen so far?','Want to grab a drink?','Let\'s exchange contact info.'],
    ['What are the must-see places?','How much is the ticket?','What time does it open?','Is photography allowed?','Could you take our picture?'],
    ['I need a doctor.','Where\'s the nearest pharmacy?','I\'m allergic to...','Could you call an ambulance?','I don\'t feel well.'],
    ['Which line goes to...?','How much is a ticket?','Does this train stop at...?','Where do I get off?','Is this the right platform?'],
    ['I have a reservation.','What\'s included in the insurance?','Where do I return the car?','Is the GPS included?','Could you show me how it works?'],
    ['Is it okay to take photos?','How should I greet people?','What\'s the custom here?','Am I supposed to tip?','I want to be respectful.'],
    ['I\'m looking for a place to stay.','How much is the rent?','Is it furnished?','Are utilities included?','Can I see the place?'],
    ['Is there reliable Wi-Fi?','Where\'s a good place to work?','Do you have any quiet spots?','What\'s the password?','Could I use this seat?'],
    ['What\'s there to do tonight?','Is there a cover charge?','What time does it close?','Could I get a drink?','Where\'s a good place to go out?'],
    ['What do you love about living here?','What\'s the best thing about this place?','What do tourists usually miss?','How has it changed over the years?','What\'s your favorite local tradition?'],
    ['I think I\'m lost.','I missed my flight.','My bag is missing.','Could you help me, please?','What should I do now?'],
    ['It was incredible.','I\'d definitely recommend it.','The people were so welcoming.','I can\'t wait to come back.','It changed my perspective.'],
    ['Could you help me with directions?','What time is check-in?','I\'d like to order, please.','Do you accept credit cards?','Thank you so much for your help.'],
  ],
  interview:[
    ['Thank you for having me today.','It\'s a pleasure to meet you.','Let me give you a quick overview of my background.','I\'m currently working as...','I\'m excited about this opportunity.'],
    ['In my current role, I...','Before that, I worked at...','My biggest achievement was...','I led a project where...','I learned a lot from that experience.'],
    ['I\'m particularly strong at...','I have hands-on experience with...','I\'ve been working with that for years.','I\'d say my main strength is...','I\'m always looking to learn more.'],
    ['I really admire what your company does.','I\'ve followed your recent work on...','I read about your latest project.','Your mission really resonates with me.','What I love about this company is...'],
    ['What does success look like in this role?','What are the biggest challenges right now?','Could you tell me more about the team?','What\'s the culture like here?','What are the next steps?'],
    ['Let me give you some context.','The challenge was...','My approach was to...','What I did specifically was...','The result was...'],
    ['One area I\'m working on is...','I used to struggle with...','I\'ve been actively improving by...','I\'m not afraid to ask for help.','I see it as a growth area.'],
    ['Could you share the budget for this role?','Based on my experience, I was expecting...','Is there flexibility on the offer?','I\'m excited about the role.','Could we discuss the full package?'],
    ['That\'s a great question.','Let me think about that for a moment.','Could you tell me more about what you\'re looking for?','I want to be honest with you.','I appreciate you asking.'],
    ['Can you hear me okay?','Sorry, my connection is unstable.','Could you repeat that?','Thanks for being flexible.','It was great speaking with you.'],
    ['My leadership style is...','I focus on building strong teams.','I believe in empowering people.','I lead by example.','I make decisions based on data and impact.'],
    ['Let me make sure I understand the question.','I\'d like to start by structuring my approach.','First, I\'d want to know...','My hypothesis is...','Let me walk you through my thinking.'],
    ['Let me think through this out loud.','My first approach would be...','I\'d want to consider...','Could I ask a clarifying question?','There\'s a trade-off here.'],
    ['Thank you all for having me.','That\'s a great question.','Building on what was said earlier...','I\'d love to hear what you think.','Thank you for your time today.'],
    ['Could you help me understand the context?','I want to make sure I\'m being respectful.','Please correct me if I misunderstand.','I\'m excited to work with a diverse team.','Thank you for the opportunity.'],
    ['My priority would be...','The biggest opportunity I see is...','I\'d start by listening.','My first 90 days would focus on...','I think long-term.'],
    ['Thank you for considering me.','Could I get some feedback?','What could I have done differently?','I\'d love to stay in touch.','Please keep me in mind for future roles.'],
    ['I\'m thrilled to accept the offer.','I\'d like to take some time to consider.','Could I have a few days to decide?','After much thought, I\'ve decided to decline.','Thank you for the opportunity.'],
    ['Thank you for your time today.','I really enjoyed our conversation.','I\'m even more excited about the role.','Please let me know if you need anything else.','Looking forward to hearing from you.'],
    ['Thank you for the opportunity.','Let me tell you a bit about myself.','Could you tell me more about the role?','I have a few questions of my own.','I look forward to next steps.'],
  ],
  bible:[
    ['In the beginning, God created the heavens and the earth.','God saw that it was good.','On the seventh day, God rested.','We are made in his image.','What does creation mean to you?'],
    ['They were tempted by the serpent.','Sin entered the world.','They were cast out of the garden.','There are consequences to our choices.','But there is still hope.'],
    ['Noah found favor with God.','He was a righteous man.','It rained for forty days and forty nights.','The rainbow is a sign of God\'s promise.','Faith requires obedience.'],
    ['Abraham trusted God.','He left everything behind.','God made a promise to him.','His faith was tested.','What does faith mean to you?'],
    ['Let my people go.','God called Moses from the burning bush.','He led them out of slavery.','They crossed the Red Sea.','It is a story of freedom.'],
    ['He was just a young shepherd.','He trusted in God.','Sometimes the smallest can win.','What\'s your Goliath?','Faith over fear.'],
    ['He was a man after God\'s own heart.','He made mistakes too.','He sought forgiveness.','He was deeply human.','We can all relate to David.'],
    ['He asked God for wisdom.','God gave him much more.','Wisdom is more valuable than gold.','What would you ask for?','True wisdom comes from God.'],
    ['The prophets spoke for God.','They were often misunderstood.','They called for justice.','Their words still echo today.','What can we learn from them?'],
    ['He stood firm in his faith.','He prayed three times a day.','God protected him in the lions\' den.','Sometimes faith costs us.','What would you risk for your beliefs?'],
    ['Unto us a child is born.','He was born in a manger.','The shepherds came to see him.','His name shall be called Emmanuel.','What does Christmas mean to you?'],
    ['He preached the good news.','He called his disciples.','Follow me, he said.','He healed the sick.','His ministry transformed lives.'],
    ['Love your neighbor as yourself.','Forgive as you have been forgiven.','Blessed are the meek.','Do unto others as you would have them do unto you.','His words still guide us today.'],
    ['He turned water into wine.','He walked on water.','He raised Lazarus from the dead.','He showed God\'s power.','What miracle stands out to you?'],
    ['He broke bread with his disciples.','Do this in remembrance of me.','One of you will betray me.','He prayed in the garden.','What does this moment mean to you?'],
    ['He died for our sins.','It is finished.','On the third day, he rose again.','He is risen indeed.','This is the heart of the gospel.'],
    ['They were filled with the Holy Spirit.','They spoke in many languages.','The church was born.','They lived in community.','The good news spread quickly.'],
    ['He was changed completely.','He met Christ on the road.','He traveled the known world.','He suffered for the gospel.','His letters guide us still.'],
    ['Faith, hope, and love.','The greatest of these is love.','We are saved by grace through faith.','It is a gift, not earned.','What do these words mean to you?'],
    ['My faith journey began...','What I believe is...','God has been faithful.','I have learned that...','My hope is...'],
  ],
};

// Topic prefix map
var WU_PREFIX = {
  'Conversation':'conv', 'Business English':'biz',
  'Travel English':'travel', 'Job Interview':'interview',
  'The Bible in English':'bible'
};

// Build 5 phrase objects for a topic + unit number (1-based)
// Uses exact phrases from heygen_batch_files.txt
function _wuBuildPhrases(topic, unitNum){
  var prefix  = WU_PREFIX[topic] || 'conv';
  var table   = WU_PHRASES[prefix] || WU_PHRASES.conv;
  var uIdx    = Math.min(Math.max(0, (unitNum||1)-1), table.length-1);
  var phrases = table[uIdx];
  var u       = String(uIdx+1).padStart(2,'0');
  return phrases.map(function(en, i){
    // Derive stem from first 3 words of the exact phrase
    var slug = en.toLowerCase().replace(/[^a-z0-9\s]/g,'').trim().split(/\s+/).slice(0,3).join('-');
    return {
      stem: prefix+'_u'+u+'_'+String(i+1).padStart(2,'0')+'_'+slug,
      en:   en,
      pt:   ''
    };
  });
}

// ─── Bridge to Emma chat ────────────────────────────────────────────────────
// Expose the practiced phrases for the current topic+unit so emma.js can
// inject them into Emma's system prompt. Returns just the English strings
// (the chat doesn't need stems or pt translations).
window.getWarmupPhrases = function(topic, unitNum){
  var prefix = WU_PREFIX[topic] || 'conv';
  var table = WU_PHRASES[prefix] || WU_PHRASES.conv;
  var uIdx = Math.min(Math.max(0, (unitNum||1)-1), table.length-1);
  return (table[uIdx] || []).slice();
};

// State
var _wuPhrases=[], _wuIdx=0, _wuState='idle';
var _wuAudio=null, _wuMr=null, _wuChunks=[], _wuRec=false, _wuSR=null, _wuMatchedWords=[];
var _wuMime='', _wuScore=0, _wuTimeout=null;
var _wuOnDone=null;

// ─── Public API ─────────────────────────────────────────────────────────────

window.showWarmup = function(onDone){
  _wuOnDone = onDone || function(){};
  var topic = window._emmaTopic || 'Conversation';
  // Use student's current unit for this topic (falls back to 1)
  var unitNum = 1;
  try { var p=(typeof getProgress==='function')?getProgress(topic):null; if(p&&p.unit) unitNum=p.unit; } catch(e){}
  _wuPhrases = _wuBuildPhrases(topic, unitNum);
  _wuIdx = 0;
  window._wuFront = null; window._wuBack = null; // reset video rotation
  // Reset opacity for fresh session
  var _va=document.getElementById('wuVidA'), _vb=document.getElementById('wuVidB');
  if(_va) _va.style.opacity='1';
  if(_vb) _vb.style.opacity='0';
  var _m=document.getElementById('warmupModal');
  _m.classList.add('wu-open');
  _m.style.display='flex';
  _m.style.flexDirection='column';
  try{ if(window.SWTrack){ SWTrack.day(); SWTrack.start(); } }catch(e){}
  _wuLoad(0);
};

// Called from every entry point (replaces bare switchMode('emma'))
window._wuGo = function(){
  showWarmup(function(){ switchMode('emma'); });
};

window.wuClose = function(){
  try{ if(window.SWTrack) SWTrack.stop(); }catch(e){}
  _wuCleanup();
  var _m=document.getElementById('warmupModal');
  _m.classList.remove('wu-open');
  _m.style.display='none';
  if(_wuOnDone){ var cb=_wuOnDone; _wuOnDone=null; cb(); }
};

window.wuHearAgain = function(){
  var vid = window._wuFront || document.getElementById('wuVidA');
  if(!vid) return;
  // In phase 2 echo, just replay without touching the state machine
  if(_wuIdx>=5 && _wuPhase2[_wuIdx-5] && _wuPhase2[_wuIdx-5].type==='echo'){
    vid.currentTime=0; vid.onended=null;
    var pr=vid.play(); if(pr&&pr.catch) pr.catch(function(){});
    return;
  }
  vid.currentTime=0;
  _wuPlayAudio();
};

window.wuMainTap = function(){
  if(_wuState==='idle')        { _wuPlayAudio(); }
  else if(_wuState==='playing'){ _wuStopAudio(); if(_wuIdx<5) _wuGoListen(); }
  else if(_wuState==='listening'){ _wuStopRec(); }
  else if(_wuState==='perfect'){ _wuNext(); }
  else if(_wuState==='retry')  { _wuGoListen(); }
  else if(_wuState==='gap')    { _wuCheckGap(); }
  else if(_wuState==='gap-done'){ _wuNext(); }
  else if(_wuState==='echo')   { _wuCheckEcho(); }
  else if(_wuState==='echo-done'){ _wuNext(); }
};

window.wuSkipOne = function(){
  _wuCleanup();
  _wuNext();
};

window.wuGoBack = function(){
  if(_wuIdx <= 0) return;
  _wuCleanup();
  _wuLoad(_wuIdx - 1);
};

// ─── Internal ───────────────────────────────────────────────────────────────

// Phase 2 activity config: type + which phrase to reuse
var _wuPhase2=[
  {type:'gap',  pi:0},
  {type:'echo', pi:1},
  {type:'gap',  pi:2},
  {type:'echo', pi:3},
  {type:'gap',  pi:4}
];
var _wuBlankWord='';

function _wuLoad(idx){
  _wuIdx = idx;
  var total = 10; // 5 pronunciation + 5 retention
  if(idx>=10){ wuClose(); return; }

  // Phase 2 — delegate entirely
  if(idx>=5){
    var act=_wuPhase2[idx-5];
    var fill=document.getElementById('wuProgFill');
    var ctr=document.getElementById('wuCounter');
    if(fill) fill.style.width=Math.round((idx/total)*100)+'%';
    if(ctr)  ctr.textContent=(idx+1)+' / '+total;
    if(act.type==='gap')  { _wuLoadGap(act.pi); }
    else                  { _wuLoadEcho(act.pi); }
    return;
  }

  var p = _wuPhrases[idx];
  if(!p){ wuClose(); return; }

  // Progress
  var fill = document.getElementById('wuProgFill');
  var ctr  = document.getElementById('wuCounter');
  if(fill) fill.style.width = Math.round((idx/total)*100)+'%';
  if(ctr)  ctr.textContent  = (idx+1)+' / '+total;

  // Phrase text
  var enEl = document.getElementById('wuEn');
  var ptEl = document.getElementById('wuPt');
  if(enEl){ enEl.innerHTML=''; enEl.textContent = '"'+p.en+'"'; }
  if(ptEl) ptEl.textContent = p.pt || '';
  // Fetch Portuguese translation if not cached
  if(!window._wuPtCache) window._wuPtCache = {};
  if(ptEl && p.en){
    if(window._wuPtCache[p.en]){
      ptEl.textContent = window._wuPtCache[p.en];
    } else {
      fetch(W+'/emma-chat',{method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({system:'Translate the English sentence to Brazilian Portuguese. Reply with ONLY the translation, no quotes, no explanation.',
          messages:[{role:'user',content:p.en}],topic:'wu_translate',max_tokens:80})})
        .then(function(r){return r.json();})
        .then(function(d){
          var pt=(d.response||d.content||d.text||'').trim();
          if(pt){ window._wuPtCache[p.en]=pt; var el=document.getElementById('wuPt'); if(el) el.textContent=pt; }
        }).catch(function(){});
    }
  }

  // Crossfade between two video elements:
  // _wuFront = currently visible (opacity 1), _wuBack = preloading (opacity 0)
  var vidA = document.getElementById('wuVidA');
  var vidB = document.getElementById('wuVidB');
  if(!window._wuFront){ window._wuFront=vidA; window._wuBack=vidB; }
  var front = window._wuFront, back = window._wuBack;

  function _wuCrossfadeTo(incoming, outgoing){
    // incoming is preloaded — fade it in, fade out is already showing
    incoming.style.opacity='1';
    outgoing.style.opacity='0';
    window._wuFront=incoming; window._wuBack=outgoing;
    // After transition completes, reset outgoing to load next phrase
    setTimeout(function(){
      outgoing.pause(); outgoing.onended=null;
      var nextP=_wuPhrases[_wuIdx+1];
      if(nextP && outgoing.dataset.wuStem!==nextP.stem){
        outgoing.src=WU_R2+'/warmups/video/'+nextP.stem+'.mp4';
        outgoing.dataset.wuStem=nextP.stem;
        outgoing.preload='auto';
        outgoing.load();
      }
    }, 350);
  }

  if(back.dataset.wuStem===p.stem && back.readyState>=2){
    // Back is preloaded — crossfade to it instantly
    _wuCrossfadeTo(back, front);
  } else {
    // First load, or back not ready — load onto front (no crossfade possible)
    front.pause(); front.onended=null;
    front.src=WU_R2+'/warmups/video/'+p.stem+'.mp4';
    front.dataset.wuStem=p.stem;
    front.preload='auto';
    front.load();
    // Preload next onto back immediately
    var nextP=_wuPhrases[_wuIdx+1];
    if(nextP && back.dataset.wuStem!==nextP.stem){
      back.pause();
      back.src=WU_R2+'/warmups/video/'+nextP.stem+'.mp4';
      back.dataset.wuStem=nextP.stem;
      back.preload='auto';
      back.load();
    }
  }

  _wuSetState('idle');
}

function _wuPickBlank(phrase){
  var stop=['i','a','an','the','to','do','did','is','it','of','in','at','for','on','and','or','but','you','we','he','she','they','be','am','are','was','were','have','has','had','will','would','could','should','can','may','just','please','me','us','my','your','our','its','this','that','with','from','what','where','when','how','who','by'];
  var words=phrase.replace(/[^\w\s]/g,'').split(/\s+/).filter(Boolean);
  var candidates=words.filter(function(w){ return w.length>3 && stop.indexOf(w.toLowerCase())===-1; });
  if(!candidates.length) return words[words.length-1]||'';
  // Pick ~70% through — avoids last word (too easy) and first (too hard)
  return candidates[Math.floor(candidates.length*0.7)];
}

function _wuLoadGap(pi){
  var p=_wuPhrases[pi]; if(!p) return;
  _wuBlankWord=_wuPickBlank(p.en);
  var clean=p.en.replace(/[“”"]/g,'');
  var blanked=clean.replace(new RegExp('\\b'+_wuBlankWord+'\\b','i'),
    '<span class="wu-blank">'+Array(_wuBlankWord.length+1).join(' ')+'</span>');
  var enEl=document.getElementById('wuEn');
  var ptEl=document.getElementById('wuPt');
  if(enEl) enEl.innerHTML='“'+blanked+'”';
  if(ptEl) ptEl.innerHTML='<input class="wu-input" id="wuP2Input" type="text" placeholder="type the missing word…" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><button class="wu-p2-mic" id="wuP2MicBtn" onclick="window._wuP2Mic()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><line x1="12" y1="20" x2="12" y2="22"/></svg> or speak</button><div class="wu-p2-reveal" id="wuP2Reveal"></div>';
  var card=document.querySelector('.wu-card');
  if(card) card.classList.remove('wu-card-green','wu-card-amber');
  // Load video silently for "Hear again"
  var front=window._wuFront||document.getElementById('wuVidA');
  if(front && front.src!==WU_R2+'/warmups/video/'+p.stem+'.mp4'){
    front.pause(); front.src=WU_R2+'/warmups/video/'+p.stem+'.mp4'; front.load();
  }
  _wuSetState('gap');
  setTimeout(function(){ var inp=document.getElementById('wuP2Input'); if(inp) inp.focus(); },200);
}

function _wuLoadEcho(pi){
  var p=_wuPhrases[pi]; if(!p) return;
  var enEl=document.getElementById('wuEn');
  var ptEl=document.getElementById('wuPt');
  if(enEl) enEl.innerHTML='<span class="wu-p2-prompt">Listen carefully, then write what Emma said</span>';
  if(ptEl) ptEl.innerHTML='<input class="wu-input" id="wuP2Input" type="text" placeholder="type the full phrase…" autocomplete="off" autocorrect="off" autocapitalize="off" spellcheck="false"><button class="wu-p2-mic" id="wuP2MicBtn" onclick="window._wuP2Mic()"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><line x1="12" y1="20" x2="12" y2="22"/></svg> or speak</button><div class="wu-p2-reveal" id="wuP2Reveal"></div>';
  var card=document.querySelector('.wu-card');
  if(card) card.classList.remove('wu-card-green','wu-card-amber');
  // Load and play video with audio
  var front=window._wuFront||document.getElementById('wuVidA');
  if(front){
    front.pause(); front.onended=null;
    front.src=WU_R2+'/warmups/video/'+p.stem+'.mp4';
    front.dataset.wuStem=p.stem; front.preload='auto'; front.load();
  }
  _wuSetState('echo');
  // Play video directly — bypass _wuPlayAudio() to avoid state machine side-effects
  setTimeout(function(){
    var vid=window._wuFront||document.getElementById('wuVidA');
    if(vid){
      vid.currentTime=0;
      vid.onended=null; // don't trigger _wuGoListen when video ends
      var pr=vid.play(); if(pr&&pr.catch) pr.catch(function(){});
    }
  },400);
  setTimeout(function(){ var inp=document.getElementById('wuP2Input'); if(inp) inp.focus(); },2200);
}

window._wuP2Mic = function _wuP2Mic(){
  var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
  if(!SR) return;
  var btn=document.getElementById('wuP2MicBtn');
  var inp=document.getElementById('wuP2Input');
  if(!inp) return;

  // If already recording, stop
  if(window._wuP2SR){
    try{ window._wuP2SR.stop(); }catch(e){}
    window._wuP2SR=null;
    if(btn) btn.classList.remove('wu-p2-mic-active');
    return;
  }

  var sr=new SR();
  window._wuP2SR=sr;
  sr.lang='en-US'; sr.continuous=false; sr.interimResults=false; sr.maxAlternatives=1;

  if(btn){ btn.classList.add('wu-p2-mic-active'); btn.textContent='Listening…'; }

  sr.onresult=function(e){
    window._wuP2SR=null;
    if(btn){ btn.classList.remove('wu-p2-mic-active'); btn.innerHTML='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><line x1="12" y1="20" x2="12" y2="22"/></svg> or speak'; }
    var transcript=e.results[0][0].transcript.trim();

    if(_wuState==='gap'){
      // Accept either the isolated word OR the full sentence spoken —
      // if the transcript contains the blank word, extract it; else use as-is
      var norm=transcript.toLowerCase().replace(/[^a-z\s]/g,'').trim();
      var target=(_wuBlankWord||'').toLowerCase();
      var words=norm.split(/\s+/);
      // Find the spoken word closest to the target
      var best=transcript; var bestDist=99;
      words.forEach(function(w){
        var d=_wuEditDist(w,target);
        if(d<bestDist){ bestDist=d; best=w; }
      });
      // If any word was close enough, use it; else put full transcript
      inp.value = bestDist<=2 ? best : transcript;

    } else if(_wuIdx>=5 && _wuPhase2[_wuIdx-5] && _wuPhase2[_wuIdx-5].type==='echo'){
      // Fill transcript then immediately reveal the correct sentence for comparison
      inp.value = transcript;
      var act=_wuPhase2[_wuIdx-5];
      var p=act && _wuPhrases[act.pi];
      if(p){
        var enEl=document.getElementById('wuEn');
        if(enEl) enEl.innerHTML='“'+p.en+'”';
      }

    } else {
      inp.value = transcript;
    }
    inp.focus();
  };

  sr.onerror=function(){
    window._wuP2SR=null;
    if(btn){ btn.classList.remove('wu-p2-mic-active'); btn.innerHTML='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><line x1="12" y1="20" x2="12" y2="22"/></svg> or speak'; }
  };

  sr.onend=function(){
    window._wuP2SR=null;
    if(btn){ btn.classList.remove('wu-p2-mic-active'); btn.innerHTML='<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><line x1="12" y1="20" x2="12" y2="22"/></svg> or speak'; }
  };

  sr.start();
}

function _wuCheckGap(){
  var inp=document.getElementById('wuP2Input');
  var rev=document.getElementById('wuP2Reveal');
  if(!inp) return;
  var typed=inp.value.trim().toLowerCase().replace(/[^a-z]/g,'');
  var target=_wuBlankWord.toLowerCase().replace(/[^a-z]/g,'');
  var ok=typed===target||_wuEditDist(typed,target)<=1;
  inp.className='wu-input '+(ok?'wu-correct':'wu-wrong');
  inp.disabled=true;
  if(rev){
    rev.innerHTML=ok
      ?'<span style="color:#16a34a;font-weight:600;">✓ Correct!</span>'
      :'<span style="color:#ef4444;">The word was: <strong>'+_wuBlankWord+'</strong></span>';
    rev.classList.add('show');
  }
  if(ok){ try{ var c=new(window.AudioContext||window.webkitAudioContext)();[523,659,784].forEach(function(f,i){var o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=f;var t=c.currentTime+i*.09;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.22,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+.13);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.14);}); }catch(e){} }
  _wuSetState(ok?'gap-done':'gap-done'); // always advance (show answer either way)
}

function _wuCheckEcho(){
  var inp=document.getElementById('wuP2Input');
  var rev=document.getElementById('wuP2Reveal');
  var act=_wuPhase2[_wuIdx-5];
  var p=_wuPhrases[act.pi];
  if(!inp||!p) return;
  var typed=inp.value.trim();
  var score=_wuFuzzyScore(typed,p.en);
  var ok=score>=55;
  inp.className='wu-input '+(ok?'wu-correct':'wu-wrong');
  inp.disabled=true;
  var enEl=document.getElementById('wuEn');
  if(enEl) enEl.innerHTML='“'+p.en+'”';
  if(rev){
    rev.innerHTML=ok
      ?'<span style="color:#16a34a;font-weight:600;">✓ Well done!</span>'
      :'<span style="color:#ef4444;">Emma said: <strong>'+p.en+'</strong></span>';
    rev.classList.add('show');
  }
  if(ok){ try{ var c=new(window.AudioContext||window.webkitAudioContext)();[523,659,784].forEach(function(f,i){var o=c.createOscillator(),g=c.createGain();o.type='triangle';o.frequency.value=f;var t=c.currentTime+i*.09;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.22,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+.13);o.connect(g);g.connect(c.destination);o.start(t);o.stop(t+.14);}); }catch(e){} }
  _wuSetState('echo-done');
}

function _wuNext(){
  _wuLoad(_wuIdx+1);
}

function _wuSetState(s){
  _wuState = s;
  var label   = document.getElementById('wuLabel');
  var backBtn = document.getElementById('wuBackBtn');
  var hearBtn = document.getElementById('wuHearBtn');
  var mainBtn = document.getElementById('wuMainBtn');
  var mainIco = document.getElementById('wuMainIcon');
  var skipBtn = document.getElementById('wuSkipBtn');
  if(!label||!mainBtn) return;

  function playTriHtml(c){ return '<svg width="20" height="20" viewBox="0 0 24 24" fill="'+c+'" stroke="none"><polygon points="6 3 20 12 6 21 6 3"/></svg>'; }
  function pauseHtml(){ return '<span class="wu-pause-bars"></span>'; }
  function micHtml(){ return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2" width="6" height="12" rx="3"/><path d="M5 10v2a7 7 0 0 0 14 0v-2"/><line x1="12" y1="20" x2="12" y2="22.5"/><line x1="8.5" y1="22.5" x2="15.5" y2="22.5"/></svg>'; }
  function checkHtml(c){ return '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="'+c+'" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'; }
  function waveHtml(){ return '<span class="wu-wave"><span class="wb"></span><span class="wb"></span><span class="wb"></span></span>'; }
  function typingHtml(){ return '<span class="wu-typing"><span class="wt"></span><span class="wt"></span><span class="wt"></span></span>'; }
  function nextSvg(){ return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>'; }
  function skipSvg(){ return '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 4 15 12 5 20 5 4"/><line x1="19" y1="5" x2="19" y2="19"/></svg>'; }

  // Reset
  label.className = 'wu-label';
  mainBtn.className = 'wu-btn';
  hearBtn.className = 'wu-act wu-dim';
  skipBtn.className = 'wu-act';
  skipBtn.innerHTML = skipSvg()+'<span>Skip</span>';
  var _wc=document.querySelector('.wu-card');
  if(_wc){ _wc.classList.remove('wu-card-green','wu-card-amber'); }

  if(s==='idle'){
    label.classList.add('wu-gold');
    label.innerHTML='<svg width="10" height="10" viewBox="0 0 10 10" fill="#e8b84b"><polygon points="1 0 10 5 1 10"/></svg><span class="wu-txt">Tap to listen</span>';
    mainBtn.classList.add('wu-b-gold');
    mainIco.innerHTML=playTriHtml('#0a0a0a');

  }else if(s==='playing'){
    label.classList.add('wu-gold');
    label.innerHTML=waveHtml()+'<span class="wu-txt">Emma is speaking</span>';
    mainIco.innerHTML=pauseHtml();
    hearBtn.className='wu-act';

  }else if(s==='listening'){
    label.classList.add('wu-gold');
    label.innerHTML=waveHtml()+'<span class="wu-txt">Speak now</span>';
    mainBtn.classList.add('wu-b-rec');
    mainIco.innerHTML=micHtml();
    hearBtn.className='wu-act';

  }else if(s==='processing'){
    label.classList.add('wu-muted');
    label.innerHTML=typingHtml()+'<span class="wu-txt">Checking…</span>';
    mainIco.innerHTML=micHtml();
    skipBtn.className='wu-act wu-dim';

  }else if(s==='perfect'){
    label.classList.add('wu-green');
    label.innerHTML='<svg class="wu-check-draw" viewBox="0 0 22 22" width="15" height="15"><circle class="ck-c" cx="11" cy="11" r="9"/><path class="ck-p" d="M6.5 11 L9.5 14 L15.5 8"/></svg><span class="wu-txt">Perfect</span>';
    mainBtn.classList.add('wu-b-green');
    mainIco.innerHTML=checkHtml('#fff');
    hearBtn.className='wu-act';
    skipBtn.className='wu-act wu-go';
    skipBtn.innerHTML=nextSvg()+'<span>Next</span>';
    var _wcard=document.querySelector('.wu-card');
    if(_wcard) _wcard.classList.add('wu-card-green');
    var _enEl=document.getElementById('wuEn');
    var _wp=_wuPhrases[_wuIdx];
    if(_enEl&&_wp){
      var _rw=_wp.en.replace(/[“”"]/g,'').split(' ').filter(Boolean);
      var _ch='<div class="wu-chips">';
      _rw.forEach(function(w,i){
        var _ok=(!_wuMatchedWords.length)||(_wuMatchedWords[i]!==false);
        var _d=(i*0.09).toFixed(2);
        var _ck=_ok?'<svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 6 5 9 10 3"/></svg>':'';
        _ch+='<div class="wu-chip '+(_ok?'ok':'miss')+'" style="animation-delay:'+_d+'s">'+_ck+'<span>'+w+'</span></div>';
      });
      _ch+='</div><div class="wu-bar-row"><div class="wu-bar-wrap"><div class="wu-bar-fill" id="wuBarFill"></div></div></div>';
      _enEl.innerHTML=_ch;
      setTimeout(function(){var b=document.getElementById('wuBarFill');if(b)b.style.width=Math.min(100,_wuScore||100)+'%';},50);
    }
    setTimeout(function(){if(_wuState==='perfect')_wuNext();},2200);

  }else if(s==='retry'){
    label.classList.add('wu-amber');
    label.innerHTML='<span class="wu-pulse" style="background:#d97706;"></span><span class="wu-txt">Almost — try again</span>';
    mainBtn.classList.add('wu-b-rec');
    mainIco.innerHTML=micHtml();
    hearBtn.className='wu-act';
    var _wcard2=document.querySelector('.wu-card');
    if(_wcard2) _wcard2.classList.add('wu-card-amber');
    var _enEl2=document.getElementById('wuEn');
    var _wp2=_wuPhrases[_wuIdx];
    if(_enEl2&&_wp2){
      var _rw2=_wp2.en.replace(/[“”"]/g,'').split(' ').filter(Boolean);
      var _ch2='<div class="wu-chips">';
      _rw2.forEach(function(w,i){
        var _ok2=(!_wuMatchedWords.length)||(_wuMatchedWords[i]!==false);
        var _d2=(i*0.07).toFixed(2);
        var _ck2=_ok2?'<svg width="9" height="9" viewBox="0 0 12 12" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="2 6 5 9 10 3"/></svg>':'';
        _ch2+='<div class="wu-chip '+(_ok2?'ok':'miss')+'" style="animation-delay:'+_d2+'s">'+_ck2+'<span>'+w+'</span></div>';
      });
      _ch2+='</div>';
      _enEl2.innerHTML=_ch2;
    }
    setTimeout(function(){if(_wuState==='retry')_wuGoListen();},1800);

  }else if(s==='gap'||s==='echo'){
    label.classList.add('wu-gold');
    label.innerHTML='<span class="wu-txt">'+(s==='gap'?'Fill in the gap':'What did Emma say?')+'</span>';
    mainBtn.classList.add('wu-b-gold');
    mainIco.innerHTML=checkHtml('currentColor');

  }else if(s==='gap-done'||s==='echo-done'){
    label.classList.add('wu-green');
    label.innerHTML='<svg class="wu-check-draw" viewBox="0 0 22 22" width="15" height="15"><circle class="ck-c" cx="11" cy="11" r="9"/><path class="ck-p" d="M6.5 11 L9.5 14 L15.5 8"/></svg><span class="wu-txt">Good</span>';
    mainBtn.classList.add('wu-b-green');
    mainIco.innerHTML=nextSvg().replace('stroke="currentColor"','stroke="#fff"');
    skipBtn.className='wu-act wu-go';
    skipBtn.innerHTML=nextSvg()+'<span>Next</span>';
    setTimeout(function(){if(_wuState===s)_wuNext();},2500);
  }

  // Inject back arrow into the label (preserved across state changes)
  if(_wuIdx > 0 && label && label.innerHTML.indexOf('wu-back-mini') === -1){
    var bb = '<button class="wu-back-mini visible" onclick="wuGoBack()" aria-label="Back"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg></button>';
    label.insertAdjacentHTML('afterbegin', bb);
  }
}


function _wuPlayAudio(){
  var vid = window._wuFront || document.getElementById('wuVidA');
  if(!vid||!vid.src) return;
  _wuSetState('playing');
  vid.currentTime = 0;
  vid.onended = null;

  // Freeze on last frame instead of going black:
  // pause ~80ms before end, then advance to listening
  function _onTimeUpdate(){
    if(!vid.duration) return;
    if(vid.currentTime >= vid.duration - 0.08){
      vid.removeEventListener('timeupdate', _onTimeUpdate);
      vid.pause(); // holds last frame — no black flash
      if(_wuState==='playing') _wuGoListen();
    }
  }
  vid.addEventListener('timeupdate', _onTimeUpdate);
  // Fallback: onended in case timeupdate fires late
  vid.onended = function(){
    vid.removeEventListener('timeupdate', _onTimeUpdate);
    if(_wuState==='playing') _wuGoListen();
  };

  var pr = vid.play();
  if(pr && pr.catch) pr.catch(function(){ _wuGoListen(); });
}

function _wuStopAudio(){
  var vid = window._wuFront || document.getElementById('wuVidA');
  if(vid){
    vid.pause();
    vid.onended = null;
    // Remove any pending timeupdate freeze listener
    if(vid._wuTUListener){ vid.removeEventListener('timeupdate', vid._wuTUListener); vid._wuTUListener=null; }
  }
  if(_wuAudio){ try{_wuAudio.pause();}catch(e){} _wuAudio=null; }
}

function _wuGoListen(){
  _wuSetState('listening');
  _wuStartRec();
}

function _wuStartRec(){
  if(_wuRec) return;
  if(_wuTimeout){ clearTimeout(_wuTimeout); _wuTimeout=null; }

  var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if(!SpeechRecognition){
    // Fallback: no Web Speech API — just auto-pass after 4s
    _wuRec = true;
    _wuTimeout = setTimeout(function(){ _wuRec=false; _wuScore=80; _wuSetState('perfect'); }, 4000);
    return;
  }

  _wuRec = true;
  var sr = new SpeechRecognition();
  _wuSR = sr;
  sr.lang = 'en-US';
  sr.continuous = false;
  sr.interimResults = false;
  sr.maxAlternatives = 3;

  sr.onresult = function(e){
    _wuRec = false;
    if(_wuTimeout){ clearTimeout(_wuTimeout); _wuTimeout=null; }
    // Collect best transcript across all alternatives
    var best = '';
    var bestScore = -1;
    var target = (_wuPhrases[_wuIdx]||{}).en || '';
    for(var i=0; i<e.results[0].length; i++){
      var alt = e.results[0][i].transcript;
      var s = _wuFuzzyScore(alt, target);
      if(s > bestScore){ bestScore=s; best=alt; }
    }
    _wuScore = Math.round(bestScore);
    if(_wuScore>=65){try{var _ac=new(window.AudioContext||window.webkitAudioContext)();[523,659,784].forEach(function(f,i){var o=_ac.createOscillator(),g=_ac.createGain();o.type='triangle';o.frequency.value=f;var t=_ac.currentTime+i*.09;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.22,t+.008);g.gain.exponentialRampToValueAtTime(.001,t+.13);o.connect(g);g.connect(_ac.destination);o.start(t);o.stop(t+.14);});}catch(e){}}
    _wuSetState(_wuScore >= 65 ? 'perfect' : 'retry');
  };

  sr.onerror = function(e){
    _wuRec = false;
    if(_wuTimeout){ clearTimeout(_wuTimeout); _wuTimeout=null; }
    // 'no-speech' = they were silent; anything else = show retry
    _wuScore = 0;
    _wuSetState(e.error==='no-speech' ? 'retry' : 'retry');
  };

  sr.onend = function(){
    _wuSR = null;
    // Case 1: timed out with mic still open — no speech detected
    if(_wuRec){ _wuRec=false; _wuScore=0; _wuMatchedWords=[]; _wuSetState('retry'); return; }
    // Case 2: user tapped stop → _wuRec already false but onresult never fired
    // (browser stopped without recognising anything) — escape the processing state
    if(_wuState==='processing'){ _wuScore=0; _wuMatchedWords=[]; _wuSetState('retry'); }
  };

  // (Mic-start sound removed — native iOS/Android chirp already signals recording start)

  sr.start();

  // Auto-stop after 6s so the session doesn't hang
  _wuTimeout = setTimeout(function(){
    if(_wuRec && _wuSR){ try{ _wuSR.stop(); }catch(e){} }
  }, 6000);
}

function _wuStopRec(){
  if(_wuTimeout){ clearTimeout(_wuTimeout); _wuTimeout=null; }
  if(!_wuRec) return;
  _wuRec = false;
  _wuSetState('processing');
  if(_wuSR){
    // Key insight: DON'T call sr.stop() immediately on tap.
    // The engine already has the audio — it just needs time to process it.
    // Calling stop() too early cuts off the last words before they're recognised.
    // Instead: wait for onresult to fire naturally.
    // Safety net A: after 2.5s still no result → force stop
    _wuTimeout = setTimeout(function(){
      if(_wuState!=='processing') return;
      try{ if(_wuSR) _wuSR.stop(); }catch(e){}
      // Safety net B: if stop() also produces nothing, give up
      _wuTimeout = setTimeout(function(){
        if(_wuState==='processing'){ _wuScore=0; _wuMatchedWords=[]; _wuSetState('retry'); }
      }, 1000);
    }, 2500);
  }
}

// Fuzzy word-match score 0–100 between transcript and target phrase
function _wuFuzzyScore(transcript, target){
  function norm(s){ return s.toLowerCase().replace(/[^a-z0-9\s]/g,'').trim(); }
  var tWords = norm(target).split(/\s+/).filter(Boolean);
  var sWords = norm(transcript).split(/\s+/).filter(Boolean);
  if(!tWords.length) return 100;
  var matched = tWords.map(function(tw){
    return sWords.some(function(sw){ return sw===tw || _wuEditDist(sw,tw)<=1; });
  });
  _wuMatchedWords = matched;
  var hits = matched.filter(Boolean).length;
  return Math.round((hits/tWords.length)*100);
}

function _wuEditDist(a,b){
  var m=a.length,n=b.length,dp=[];
  for(var i=0;i<=m;i++){ dp[i]=[i]; }
  for(var j=0;j<=n;j++){ dp[0][j]=j; }
  for(var i=1;i<=m;i++) for(var j=1;j<=n;j++){
    dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j],dp[i][j-1],dp[i-1][j-1]);
  }
  return dp[m][n];
}

function _wuCleanup(){
  _wuStopAudio();
  if(_wuTimeout){ clearTimeout(_wuTimeout); _wuTimeout=null; }
  if(_wuRec&&_wuSR){ try{_wuSR.stop();}catch(e){} _wuRec=false; _wuSR=null; }
}

})(); // end warmup module


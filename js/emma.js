// ============================================================================
// EMMA — conversational coach: bubbles, speak, record, submit, pron panel
// ============================================================================
function renderEmma(){
  var area=document.getElementById('area');
  var pf=document.getElementById('pf');var pl=document.getElementById('pl');
  if(pf)pf.style.width='0%';if(pl)pl.textContent='';
  emmaTopic=window._emmaTopic||'general English conversation';
  area.innerHTML=renderModeTabs()+
    '<div class="emma-card">'+
      '<div class="emma-card-bg"></div>'+
      '<div class="emma-content">'+
        '<div class="emma-top">'+
          '<div class="emma-video-wrap" id="emmaVideoWrap">'+
            '<video id="vidIdle" playsinline muted loop style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 15%;opacity:1;transition:opacity 0.6s cubic-bezier(0.4,0,0.2,1)"></video>'+
            '<video id="vidTransition" playsinline muted style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 15%;opacity:0;transition:opacity 0.6s cubic-bezier(0.4,0,0.2,1)"></video>'+
            '<video id="vidSpeaking" playsinline muted loop style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center 15%;opacity:0;transition:opacity 0.6s cubic-bezier(0.4,0,0.2,1)"></video>'+
            '<div class="emma-vid-scrim"></div>'+
          '</div>'+
          '<div class="emma-identity">'+
            '<div class="emma-name-row">'+
              '<div class="emma-name">Emma</div>'+
              '<div class="emma-live"><div class="emma-live-dot"></div><div class="emma-live-txt">LIVE</div></div>'+
            '</div>'+
          '</div>'+
          '<button class="emma-end emma-end-top" onclick="emmaEnd()">End</button>'+
        '</div>'+
        '<div class="emma-bubble-wrap" id="emmaBubbles"></div>'+
        '<div class="emma-footer">'+
          '<div class="emma-status" id="emmaStatus">Tap anywhere to start...</div>'+
          '<div class="emma-controls">'+
            
            '<div class="emma-hint-btn" id="emmaHintBtn" onclick="showSuggestion()">'+
              '<div style="width:26px;height:26px;border-radius:50%;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:600;color:rgba(255,255,255,.85);line-height:1;font-family:-apple-system,sans-serif">?</div>'+
            '</div>'+
            '<button class="emma-mic" id="emmaMicBtn" onclick="emmaToggleRec()" disabled>&#127897; Tap to speak</button>'+
            '<button class="emma-end emma-end-footer" onclick="emmaEnd()">End</button>'+
          '</div>'+
        '</div>'+
      '</div>'+
    '</div>';
  // Floating close (X) — attached to <body> so nothing clips or covers it.
  // Click returns to the unit-selection screen (mhOpenUnits) for the current topic.
  (function(){
    var ex=document.getElementById('emmaCloseBtn'); if(ex){ex.remove();}
    var b=document.createElement('button');
    b.id='emmaCloseBtn';
    b.className='emma-close-btn';
    b.type='button';
    b.setAttribute('aria-label','Fechar');
    b.innerHTML='&#10005;';
    b.onclick=function(){
      try{ if(window._emmaAudio){window._emmaAudio.pause();} }catch(e){}
      try{ if(typeof _emmaSpeakId!=='undefined'){_emmaSpeakId++;} }catch(e){}
      try{ if(typeof emmaStateIdle==='function'){emmaStateIdle();} }catch(e){}
      var self=document.getElementById('emmaCloseBtn'); if(self){self.remove();}
      if(typeof showTopicPage==='function'){ showTopicPage(); }
      else if(typeof emmaEndAndBack==='function'){ emmaEndAndBack(); }
    };
    var _card=area.querySelector('.emma-card');
    if(_card){ _card.appendChild(b); } else { document.body.appendChild(b); }
  })();
  // Init videos
  var R2='https://pub-ee13894ad4e146cdb3eb6dd4f653dfc4.r2.dev';
  window._vidIdle=document.getElementById('vidIdle');
  window._vidTransition=document.getElementById('vidTransition');
  window._vidSpeaking=document.getElementById('vidSpeaking');
  window._emmaVideoWrap=document.getElementById('emmaVideoWrap');
  window._vidIdle.src=R2+'/emma-idle.mp4';
  window._vidTransition.src=R2+'/emma-transition.mp4';
  window._vidSpeaking.src=R2+'/emma-speaking.mp4';
  window._vidIdle.load();window._vidTransition.load();window._vidSpeaking.load();
  window._emmaTransitioning=false;
  // Calibrate bubble-area paddings from real rendered geometry (video bottom,
  // footer height) — once after first paint, again after layout fully settles.
  requestAnimationFrame(function(){_emmaFixChatInsets();});
  setTimeout(_emmaFixChatInsets,400);
  // Cold-start prefetch: begin the Claude intro + TTS downloads NOW, during the
  // seconds before the user's first tap. Playback still waits for the tap.
  if(emmaHistory.length===0){try{emmaPrefetchIntro();}catch(e){}}
  // Unlock on first click (iOS) and start convo
  document.body.addEventListener('click',function _init(){
    document.body.removeEventListener('click',_init);
    // Play all videos inside gesture — keeps them running so opacity swap works
    window._vidIdle.currentTime=0;
    window._vidIdle.play().catch(function(){});
    if(window._vidSpeaking){
      window._vidSpeaking.currentTime=0;
      window._vidSpeaking.play().catch(function(){});
    }
    if(window._vidTransition){
      window._vidTransition.currentTime=0;
      window._vidTransition.play().catch(function(){});
    }
    // Unlock audio element — create it here inside gesture
    if(!window._emmaAudioEl){
      window._emmaAudioEl=new Audio();
    }
    var a=window._emmaAudioEl;
    a.src='data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
    a.play().catch(function(){});
    if(emmaHistory.length===0) emmaStartConvo();
  },{once:true});
  if(emmaHistory.length>0){
    // Re-render existing bubbles after tab switch
    var wrap=document.getElementById('emmaBubbles');
    for(var i=0;i<emmaHistory.length;i++){
      var m=emmaHistory[i];
      if(m.role==='assistant'&&m.content!=='[Start the conversation]'){
        var d=document.createElement('div');d.className='emma-bubble emma';d.textContent=m.content;wrap.appendChild(d);
      } else if(m.role==='user'&&m.content.indexOf('[Start')===-1){
        var d=document.createElement('div');d.className='emma-bubble student';d.textContent=m.content;wrap.appendChild(d);
      }
    }
    wrap.scrollTop=wrap.scrollHeight;
    var btn=document.getElementById('emmaMicBtn');
    if(btn){btn.disabled=false;btn.style.opacity='1';}
    // Re-init videos on re-render
    window._vidIdle.currentTime=0;
    window._vidIdle.play().catch(function(){});
    emmaSyncVideoState();
  }
}

function emmaSyncVideoState(){
  // Ensure we're in idle state when re-rendering
  if(window._vidIdle){window._vidIdle.style.opacity='1';}
  if(window._vidTransition){window._vidTransition.style.opacity='0';}
  if(window._vidSpeaking){window._vidSpeaking.style.opacity='0';}
  if(window._emmaVideoWrap){window._emmaVideoWrap.classList.remove('speaking');}
  window._emmaTransitioning=false;
}

function emmaStateSpeaking(){
  var wrap=window._emmaVideoWrap;
  var vidIdle=window._vidIdle;
  var vidTransition=window._vidTransition;
  var vidSpeaking=window._vidSpeaking;
  if(!wrap||!vidIdle)return;
  if(window._emmaTransitioning)return;
  window._emmaTransitioning=true;
  wrap.classList.add('speaking');
  var isMobile=window.innerWidth<=600;
  if(isMobile){
    // Mobile: opacity swap only — no play/pause/currentTime touches
    if(vidSpeaking)vidSpeaking.style.opacity='1';
    if(vidIdle)vidIdle.style.opacity='0';
    if(vidTransition)vidTransition.style.opacity='0';
    window._emmaTransitioning=false;
  } else {
    vidTransition.currentTime=0;
    vidTransition.play().catch(function(){});
    vidIdle.style.opacity='1';
    vidSpeaking.style.opacity='0';
    vidTransition.style.opacity='1';
    vidTransition.onended=function(){
      vidTransition.onended=null;
      vidSpeaking.currentTime=0;
      vidSpeaking.play().catch(function(){});
      vidSpeaking.style.opacity='1';
      setTimeout(function(){
        vidTransition.style.opacity='0';
        vidIdle.style.opacity='0';
        window._emmaTransitioning=false;
      },650);
    };
  }
}

function emmaStateIdle(){
  var wrap=window._emmaVideoWrap;
  var vidIdle=window._vidIdle;
  var vidTransition=window._vidTransition;
  var vidSpeaking=window._vidSpeaking;
  if(!wrap||!vidIdle)return;
  window._emmaTransitioning=false;
  if(window.innerWidth<=600){
    // Mobile: opacity swap only — never pause or seek videos
    if(vidSpeaking)vidSpeaking.style.opacity='0';
    if(vidTransition)vidTransition.style.opacity='0';
    if(vidIdle)vidIdle.style.opacity='1';
    window._emmaTransitioning=false;
  } else {
    if(vidTransition){vidTransition.onended=null;vidTransition.pause();}
    if(vidSpeaking){vidSpeaking.pause();vidSpeaking.currentTime=0;}
    if(vidIdle){vidIdle.currentTime=0;vidIdle.play().catch(function(){});}
  }
  if(vidIdle)vidIdle.style.opacity='1';
  if(vidTransition)vidTransition.style.opacity='0';
  if(vidSpeaking)vidSpeaking.style.opacity='0';
  wrap.classList.remove('speaking');
}

function emmaStateListening(){
  emmaStateIdle();
}


function _emmaBuildStartPrompt(){
  // Get current unit and expressions for this topic
  var unit = getCurrentUnit(emmaTopic);
  var sessionExprs = getExpressionsForSession(emmaTopic);
  window._sessionExpressions = sessionExprs;
  window._expressionsTaught = 0;

  // ── Warm-up bridge ──────────────────────────────────────────────────────
  // Pull the 5 phrases the student just rehearsed in the warm-up and pass
  // them into Emma's system prompt. Same phrases as the warm-up screen
  // (warmup.js exposes getWarmupPhrases). Cached with the base prompt so it
  // persists across all turns of the session.
  var unitNum = (unit && unit.unit) || 1;
  var practicedPhrases = (typeof window.getWarmupPhrases === 'function')
    ? window.getWarmupPhrases(emmaTopic, unitNum)
    : [];
  var practicedContext = '';
  if (practicedPhrases.length > 0) {
    practicedContext =
      'PRACTICED PHRASES: The student JUST rehearsed these 5 phrases in the warm-up (pronunciation drill) — they have them fresh in mind and can deploy them. Create natural opportunities for the student to use these phrases during the conversation, but do not force any of them. If a phrase does not fit naturally in the flow, skip it. Quality of integration over quantity of phrases used. ' +
      'Phrases: ' + practicedPhrases.map(function(p,i){return (i+1)+') "'+p+'"';}).join(' | ') + '. ';
  }
  window._practicedPhrases = practicedPhrases;

  var curriculumContext = '';
  if (unit && sessionExprs.length > 0) {
    curriculumContext =
      'CURRICULUM CONTEXT: '+
      'Unit '+unit.unit+': '+unit.title+'. '+
      'Objective: '+unit.objective+'. '+
      'Grammar focus: '+unit.grammar+'. '+
      'Scenario: '+unit.scenario+'. '+
      'EXPRESSIONS TO TEACH THIS SESSION (introduce 2-3 naturally, in order): '+
      sessionExprs.map(function(e,i){return (i+1)+') '+e;}).join(' | ')+'. '+
      'HOW TO TEACH EXPRESSIONS: '+
      '1) Use the expression naturally in your own sentence first. '+
      '2) Highlight it by saying "by the way, a great expression here is [expression]" — wrap the expression in **double asterisks** in your text response so the UI can highlight it. '+
      '3) Ask the student to try using it. '+
      '4) Confirm when they use it correctly, then continue the conversation naturally. '+
      '5) Introduce the next expression only after the student has used the previous one. '+
      '6) If time allows, introduce a 3rd expression. Never rush — quality over quantity. ';
  }

  var unit0sc = getCurrentUnit(emmaTopic);
  var unitTitle0 = unit0sc ? unit0sc.title : '';
  var unitScenario0 = unit0sc ? unit0sc.scenario : '';

  var sysPrompt='You are Emma, an English coach. This session has ONE topic and ONE scenario — listed below. You will not deviate from it under any circumstances. '+
    'Topic: '+emmaTopic+'. Unit: '+unitTitle0+'. '+
    curriculumContext+
    practicedContext+
    'Your approach this session: '+unitScenario0+' '+
    'TEACHING APPROACH: Teach English through natural conversation about the unit topic. '+
    'FLEXIBLE: The student can ask questions, request explanations, change the teaching approach, say they do not want to role play, ask for more detail, or engage in any way they choose — as long as the SUBJECT stays on the current unit. All of these are valid and you should adapt immediately: "can you tell me more about Noah?", "what happened next?", "explain that to me", "I prefer you just tell me the story", "can we discuss this differently?". These are NOT topic switches — they are engagement choices. '+
    'FIXED: The only thing the student cannot do is switch to a completely different subject — a different Bible story, a different travel situation, a different business topic. If they explicitly name a different subject, redirect warmly: "That comes in a future session — right now we are on '+unitTitle0+'." '+
    'For Bible units: start by asking what the student already knows about the story. Discuss it conversationally. Teach expressions through the discussion. Role play is optional — never force it. '+
    'When the student asks to discuss anything outside the current unit — whether it is a different Bible book, a different travel situation, a different business scenario, or anything else — you respond with exactly this structure: '+
    '(1) Acknowledge warmly in one clause — "Oh, Revelation is fascinating!" or "Great idea about restaurants!" '+
    '(2) Immediately redirect — "but that is a future lesson. Right now we are on '+unitTitle0+', so let us stay here." '+
    '(3) Ask a question that pulls them back into the current scenario. '+
    'You do this EVERY TIME without exception, for ANY off-topic request — even topics within the same course. Your current unit is "'+unitTitle0+'". If the student asks about ANYTHING other than "'+unitTitle0+'", you say something like: "That sounds great — and it is actually coming up in a future session! But right now we are on '+unitTitle0+', so let us stay here:" then immediately continue the current scenario. One warm clause, then back to "'+unitTitle0+'" every single time. Never elaborate on the off-topic subject. '+
    'Teaching rules: '+
    '1) Stay on the current unit topic — but be flexible on approach. If the student prefers to discuss the story rather than role play, or wants you to explain rather than act, adapt. Topic is fixed, teaching method is flexible. '+
    '2) Teach the target expressions one at a time, naturally woven into the conversation. Get the student to use each one before moving on. '+
    '3) Keep every response to 1-2 sentences max. One question at a time. '+
    '4) Speak naturally — warm, real. No bullet points. NEVER use asterisks or stage directions like *smiles*, *settles*, *leans*, *nods* or any physical description. Just speak. '+
    '5) Opening: MAXIMUM 10 words. Then immediately ask the student a question. For Bible topics say something like: "The creation story — what do you already know about it?" Never describe your own posture or feelings. '+
    '6) When the student uses a target expression correctly, affirm it briefly and introduce the next one. '+
    '7) PACING — this is the most important rule for session quality. The conversation must last AT LEAST 12 student turns. Do not wrap up before then under any circumstances. Track your turn count internally. '+
    'BEFORE turn 12: you are FORBIDDEN from ending or winding down. If the natural scenario resolves before turn 12 (e.g. the airport check-in is done, the coffee is ordered, the appointment is booked), you MUST immediately extend with one of: '+
    '(a) a complication — "oh actually, my flight just got delayed, can you help me figure out the rebooking?", "wait, I forgot to ask — do you have any window seats?", "actually I just realized my passport expires next month, is that going to be a problem?". '+
    '(b) a related sub-scene — "great, now imagine you have made it to the gate and the person next to you starts a conversation", "perfect, now you are at the hotel checking in", "now imagine the flight attendant comes by". '+
    '(c) a real-life pivot — "tell me, have you ever had a stressful airport experience? what happened?", "what is the most memorable trip you have taken?". '+
    'AFTER turn 12: you may begin to wrap up IF the student has used multiple target expressions and had a meaningful conversation. Even then, prefer offering one more related round: "Nice work — want to try a related scenario? Imagine now that you...". '+
    'A clean scenario resolution is NOT permission to end. You are running a 5-7 minute coaching session, not a transactional roleplay. The student paid for a conversation. Give them one.';

  // Cache the full session prompt so every subsequent turn reuses the same
  // instructions (curriculum, expressions, redirect logic, teaching rules).
  // Without this, emmaSubmit was sending a stripped-down prompt and Emma
  // would forget the unit, expressions, and redirect rules after turn 1.
  window._emmaBasePrompt = sysPrompt;
  return sysPrompt;
}

// ── Cold-start prefetch ──────────────────────────────────────────────────────
// Called the moment the chat renders — BEFORE the user's first tap. The Claude
// intro and its TTS chunks download during the seconds the user takes to tap,
// so by tap time the audio is usually already in memory. Keyed by topic so a
// stale prefetch from another topic is never consumed.
function emmaPrefetchIntro(){
  if(window._introPrefetch&&window._introPrefetchTopic===emmaTopic)return;
  window._introPrefetchTopic=emmaTopic;
  var sysPrompt=_emmaBuildStartPrompt();
  var _t0=Date.now();
  window._introPrefetch=fetch(W+'/emma-chat',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({system:sysPrompt,messages:[{role:'user',content:'[Start the conversation - introduce yourself and begin the scenario]'}],topic:emmaTopic,max_tokens:300})
  })
  .then(function(r){return r.json();})
  .then(function(d){
    if(d.error)throw new Error(d.error);
    console.log('[perf] intro prefetched: '+(Date.now()-_t0)+'ms');
    var spoken=String(d.text).replace(/\*\*([^*]+)\*\*/g,'$1');
    // Start TTS downloads immediately too — array of blob promises
    var blobPromises=_emmaSplitSentences(spoken).map(function(t){return _emmaFetchTTS(t);});
    return {text:d.text,blobPromises:blobPromises};
  })
  .catch(function(){return null;});
}

function emmaStartConvo(){
  var status=document.getElementById('emmaStatus');
  if(status)status.textContent='Emma is preparing...';
  emmaStateIdle();
  emmaHistory=[{role:'user',content:'[Start the conversation - introduce yourself and begin the scenario]'}];
  function begin(text,blobPromises){
    emmaHistory.push({role:'assistant',content:text});
    emmaAddBubble('emma', renderHighlightedBubble(text));
    emmaStateSpeaking();
    if(blobPromises&&blobPromises.length){
      var s2=document.getElementById('emmaStatus');
      if(s2)s2.textContent='Emma is speaking...';
      _emmaPlayChunks(blobPromises,++_emmaSpeakId);
    } else {
      emmaSpeak(text.replace(/\*\*([^*]+)\*\*/g,'$1'));
    }
  }
  var pre=(window._introPrefetchTopic===emmaTopic)?window._introPrefetch:null;
  window._introPrefetch=null;
  if(pre){
    pre.then(function(res){
      if(res&&res.text){ begin(res.text,res.blobPromises); }
      else {
        // Prefetch failed — do the classic path
        var sys=window._emmaBasePrompt||_emmaBuildStartPrompt();
        emmaCallClaude(sys,function(text){begin(text,null);});
      }
    });
    return;
  }
  var sysPrompt=_emmaBuildStartPrompt();
  emmaCallClaude(sysPrompt,function(text){begin(text,null);});
}

function emmaCallClaude(sysPrompt,cb){
  // Send a sliding window, not the whole conversation — the full system prompt
  // (unit, expressions, redirect/anti-drift rules) is resent complete on EVERY
  // turn regardless, so topic discipline never depends on old messages.
  // 30 messages ≈ 15 student turns: covers a full normal session end-to-end,
  // so turn counting and expression progress stay visible; only marathon chats
  // get truncated, which is exactly where unbounded history was causing the
  // slowdown. emmaHistory itself stays complete (the report needs it all).
  var msgs=emmaHistory.length>30?emmaHistory.slice(-30):emmaHistory;
  var _t0=Date.now();
  fetch(W+'/emma-chat',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({system:sysPrompt,messages:msgs,topic:emmaTopic,max_tokens:300})
  })
  .then(function(r){return r.json();})
  .then(function(d){
    console.log('[perf] claude: '+(Date.now()-_t0)+'ms ('+msgs.length+' msgs sent)');
    if(d.error)throw new Error(d.error);
    cb(d.text);
  })
  .catch(function(e){
    var s=document.getElementById('emmaStatus');
    if(s)s.textContent='Error: '+e.message;
    var ring=document.getElementById('emmaRing');
    if(ring)ring.classList.remove('speaking');
  });
}

var _emmaSpeakId=0;
var _emmaAudio=null;

// ── Sentence-chunked TTS ─────────────────────────────────────────────────────
// Splits the reply into sentences, fires ALL TTS requests in parallel, plays
// them back-to-back. Time-to-first-audio = synthesis of one short sentence
// instead of the whole reply. Chunks capped at 3 to bound request count.
function _emmaSplitSentences(text){
  var parts=String(text).match(/.+?[.!?\u2026]+["\u201d']?(?=\s+|$)|.+$/g)||[String(text)];
  var out=[];
  parts.forEach(function(p){
    p=p.trim();if(!p)return;
    // Merge tiny fragments (abbreviations, "Great!", decimals) into a neighbor
    if(out.length&&(p.length<20||out[out.length-1].length<20)){out[out.length-1]+=' '+p;}
    else out.push(p);
  });
  if(out.length>3)out=[out[0],out[1],out.slice(2).join(' ')];
  return out.length?out:[String(text)];
}

function _emmaFetchTTS(text){
  return fetch(W+'/emma-speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:text})})
    .then(function(r){if(!r.ok)throw new Error(r.status);return r.blob();});
}

// Plays an ordered array of blob promises through the unlocked audio element.
// turnId guards make any newer speak/interrupt cancel this sequence cleanly.
function _emmaPlayChunks(blobPromises,turnId){
  if(_emmaAudio){
    _emmaAudio.onended=null;
    _emmaAudio.onerror=null;
    _emmaAudio.pause();
    _emmaAudio=null;
  }
  var audio=window._emmaAudioEl||new Audio();
  window._emmaAudioEl=audio;
  var _t0=Date.now(),firstLogged=false;
  function onDone(){
    if(turnId!==_emmaSpeakId)return;
    _emmaAudio=null;
    emmaStateIdle();
    var s=document.getElementById('emmaStatus');if(s)s.textContent='Your turn — tap to speak';
    var btn=document.getElementById('emmaMicBtn');
    if(btn){btn.disabled=false;btn.style.opacity='1';}
    if(!window._sugOnboardShown){window._sugOnboardShown=true;setTimeout(showSuggestionOnboarding,300);}
  }
  function playAt(i){
    if(turnId!==_emmaSpeakId)return;
    if(i>=blobPromises.length){onDone();return;}
    blobPromises[i].then(function(blob){
      if(turnId!==_emmaSpeakId)return;
      if(!firstLogged){firstLogged=true;console.log('[perf] tts first audio: '+(Date.now()-_t0)+'ms ('+blobPromises.length+' chunk(s), '+Math.round(blob.size/1024)+'KB first)');}
      var url=URL.createObjectURL(blob);
      _emmaAudio=audio;
      audio.onended=function(){URL.revokeObjectURL(url);playAt(i+1);};
      audio.onerror=function(){URL.revokeObjectURL(url);playAt(i+1);};
      audio.src=url;
      var p=audio.play();
      if(p&&p.catch)p.catch(function(){URL.revokeObjectURL(url);onDone();});
    }).catch(function(){onDone();});
  }
  playAt(0);
}

function emmaSpeak(text){
  var status=document.getElementById('emmaStatus');
  if(status)status.textContent='Emma is speaking...';
  var turnId=++_emmaSpeakId;
  var blobPromises=_emmaSplitSentences(text).map(function(t){return _emmaFetchTTS(t);});
  _emmaPlayChunks(blobPromises,turnId);
}
function renderHighlightedBubble(text){
  // Convert **expression** to highlighted gold span
  return text.replace(/\*\*([^*]+)\*\*/g,'<span class="emma-expr-highlight">$1</span>');
}

function emmaAddCorrectionBubble(original,correction){
  var wrap=document.getElementById('emmaBubbles');
  if(!wrap)return;
  var div=document.createElement('div');
  div.className='emma-correction';
  var safeOrig=original.replace(/</g,'&lt;').replace(/>/g,'&gt;');
  var safeCorr=correction.replace(/</g,'&lt;').replace(/>/g,'&gt;');
  div.innerHTML='<span class="corr-wrong">“'+safeOrig+'”</span>'+
    '<span class="corr-fix">“'+safeCorr+'”</span>';
  wrap.appendChild(div);
  wrap.scrollTop=wrap.scrollHeight;
}

var _pronData={};var _pronBubbleCounter=0;var _pronAudio=null;var _pronEmmaSrc=null;var _pronCurrentBtn=null;window._sessionPronunciationData=[];

function pronCls(s){return s>=80?'g':s>=65?'y':'r';}
function pronColor(s){return s>=80?'#1a7f44':s>=65?'#8a6d00':'#b91c1c';}
function pronRingColor(s){return s>=80?'#1a7f44':s>=65?'#c9a227':'#b91c1c';}
function pronOffset(s){return Math.round(213-(Math.min(Math.max(s,0),100)/100)*213);}
function pronFriendlyError(e){return {'Mispronunciation':'This word was difficult to understand. Try saying it more slowly and clearly.','Omission':'You skipped this word — make sure to say every word.','Insertion':'You added a word that was not in the sentence.'}[e]||null;}
function pronFriendlyProsody(p){var t=[];if(p&&p.break==='UnexpectedBreak')t.push('You paused unexpectedly before this word. Try to keep the sentence flowing.');if(p&&p.intonation==='Monotone')t.push('Your voice sounded a bit flat here. Try raising your pitch on this word.');return t;}

var _wpRecorder=null;var _wpWord=null;
function pronSelectWord(bubbleId,idx){
  console.log('[WP] pronSelectWord called, bubbleId='+bubbleId+' idx='+idx);
  var data=_pronData[bubbleId];
  console.log('[WP] data=',data);
  if(!data){console.log('[WP] no data for bubble');return;}
  // Allow tapping even without pronunciation — show practice UI
  var word=data.pronunciation&&data.pronunciation.words&&data.pronunciation.words[idx];
  if(!word){
    // No Azure word data — build a minimal practice from transcript
    console.log('[WP] no word data, using transcript');
    var transcript=data.transcript||'';
    var words=transcript.replace(/[?.!,]/g,'').split(' ').filter(Boolean);
    if(!words[idx]){console.log('[WP] no word at idx '+idx);return;}
    word={word:words[idx],accuracyScore:null,errorType:'None',prosody:{break:'None',intonation:'None'},phonemes:[]};
  }
  console.log('[WP] word=',word.word);
  document.querySelectorAll('.pron-word-chip').forEach(function(c){c.classList.remove('sel');});
  var chip=document.querySelector('[data-widx="'+idx+'"]');if(chip)chip.classList.add('sel');
  var area=document.getElementById('pronDetail');if(!area)return;
  var allGood=word.accuracyScore>=80&&!pronFriendlyError(word.errorType)&&pronFriendlyProsody(word.prosody).length===0;
  if(allGood){area.innerHTML='<div class="pron-detail-good">"'+word.word+'" sounds great</div><div class="pron-detail-good-sub">Your pronunciation of this word is clear and natural.</div>';return;}
  _wpWord=word.word;
  var errTip=pronFriendlyError(word.errorType);
  var prosTips=pronFriendlyProsody(word.prosody);
  var tipsHtml='';
  if(errTip||prosTips.length>0){tipsHtml='<div class="pron-tips-section"><div class="pron-tips-lbl">Tips</div>';if(errTip)tipsHtml+='<div class="pron-tip-red">'+errTip+'</div>';prosTips.forEach(function(t){tipsHtml+='<div class="pron-tip-amber">'+t+'</div>';});tipsHtml+='</div>';}
  // Build word practice UI using DOM — avoids SVG/HTML parsing issues in Safari
  var wp=document.createElement('div');
  wp.className='word-practice';
  wp.innerHTML='<div class="word-practice-lbl">Practice this word</div><div class="word-practice-name">'+word.word+'</div>';
  var btns=document.createElement('div');btns.className='word-practice-btns';
  var playBtn=document.createElement('button');
  playBtn.className='wp-btn wp-btn-play';playBtn.id='wpPlayBtn';
  playBtn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24"><path fill="rgba(0,0,0,.6)" d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg>';
  playBtn.onclick=function(){wpPlayEmma();};
  var recBtn=document.createElement('button');
  recBtn.className='wp-btn wp-btn-rec';recBtn.id='wpRecBtn';
  recBtn.innerHTML='<svg width="14" height="14" viewBox="0 0 24 24"><path fill="#fff" d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.42 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.3 6-6.72h-1.7z"/></svg>';
  recBtn.onclick=function(){wpToggleRec();};
  var scoreSpan=document.createElement('span');scoreSpan.className='wp-score';scoreSpan.id='wpScore';
  btns.appendChild(playBtn);btns.appendChild(recBtn);btns.appendChild(scoreSpan);
  wp.appendChild(btns);
  var tipDiv=document.createElement('div');tipDiv.className='wp-tip';tipDiv.id='wpTip';
  tipDiv.textContent='Listen to Emma, then record yourself saying just this word.';
  wp.appendChild(tipDiv);
  area.innerHTML='';
  if(tipsHtml){var th=document.createElement('div');th.innerHTML=tipsHtml;area.appendChild(th);}
  area.appendChild(wp);
}

function wpPlayEmma(){
  if(!_wpWord)return;
  var btn=document.getElementById('wpPlayBtn');
  if(btn)btn.style.background='rgba(201,162,39,.15)';
  fetch(W+'/emma-speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:_wpWord})})
  .then(function(r){return r.arrayBuffer();})
  .then(function(ab){var ctx=new (window.AudioContext||window.webkitAudioContext)();return ctx.decodeAudioData(ab).then(function(buf){var src=ctx.createBufferSource();src.buffer=buf;src.connect(ctx.destination);src.start();src.onended=function(){if(btn)btn.style.background='';};});})
  .catch(function(){if(btn)btn.style.background='';});
}

function wpToggleRec(){
  var recBtn=document.getElementById('wpRecBtn');
  if(_wpRecorder&&_wpRecorder.state==='recording'){_wpRecorder.stop();return;}
  navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
    var chunks=[];
    var mt=MediaRecorder.isTypeSupported('audio/mp4')?'audio/mp4':MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')?'audio/ogg;codecs=opus':'audio/webm';
    _wpRecorder=new MediaRecorder(stream,{mimeType:mt});
    _wpRecorder.ondataavailable=function(e){if(e.data.size>0)chunks.push(e.data);};
    _wpRecorder.onstop=function(){
      stream.getTracks().forEach(function(t){t.stop();});
      if(recBtn)recBtn.classList.remove('recording');
      var blob=new Blob(chunks,{type:mt});
      var fr=new FileReader();
      fr.onloadend=function(){
        var b64=fr.result.split(',')[1];
        var tip=document.getElementById('wpTip');if(tip)tip.textContent='Scoring...';
        // WAV conversion then score
        (function(audioB64,mimeType,targetWord,rawBlob){
          var fr3=new FileReader();
          fr3.onloadend=function(){
            if(!fr3.result){wpScoreWithAudio(audioB64,mimeType,null,targetWord);return;}
            try{
              var actx=new (window.AudioContext||window.webkitAudioContext)({sampleRate:16000});
              actx.decodeAudioData(fr3.result,function(decoded){
                var sr=16000,offCtx=new OfflineAudioContext(1,Math.ceil(decoded.duration*sr),sr);
                var src=offCtx.createBufferSource();src.buffer=decoded;src.connect(offCtx.destination);src.start(0);
                offCtx.startRendering().then(function(rendered){
                  var s=rendered.getChannelData(0),dLen=s.length*2,ab=new ArrayBuffer(44+dLen),dv=new DataView(ab);
                  function ws(o,str){for(var k=0;k<str.length;k++)dv.setUint8(o+k,str.charCodeAt(k));}
                  ws(0,'RIFF');dv.setUint32(4,36+dLen,true);ws(8,'WAVE');ws(12,'fmt ');
                  dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);
                  dv.setUint32(24,sr,true);dv.setUint32(28,sr*2,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);
                  ws(36,'data');dv.setUint32(40,dLen,true);
                  for(var i=0,off=44;i<s.length;i++,off+=2){var v=Math.max(-1,Math.min(1,s[i]));dv.setInt16(off,v<0?v*0x8000:v*0x7FFF,true);}
                  var wb=new Uint8Array(ab),cs=8192,wstr='';
                  for(var j=0;j<wb.length;j+=cs)wstr+=String.fromCharCode.apply(null,wb.subarray(j,Math.min(j+cs,wb.length)));
                  wpScoreWithAudio(audioB64,mimeType,btoa(wstr),targetWord);
                }).catch(function(){wpScoreWithAudio(audioB64,mimeType,null,targetWord);});
              },function(){wpScoreWithAudio(audioB64,mimeType,null,targetWord);});
            }catch(e){wpScoreWithAudio(audioB64,mimeType,null,targetWord);}
          };
          fr3.readAsArrayBuffer(rawBlob);
        })(b64,mt,_wpWord,blob);
      };
      fr.readAsDataURL(blob);
    };
    _wpRecorder.start();
    if(recBtn)recBtn.classList.add('recording');
    var tip=document.getElementById('wpTip');if(tip)tip.textContent='Recording... tap again to stop.';
  }).catch(function(){});
}

function wpScoreWithAudio(audioB64,mimeType,wavB64,targetWord){
  fetch(W+'/transcribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({audio:audioB64,mimeType:mimeType,wavB64:wavB64||null,referenceText:targetWord||'',noEcho:true})})
  .then(function(r){return r.json();})
  .then(function(d){
    var scoreEl=document.getElementById('wpScore'),tipEl=document.getElementById('wpTip');
    var score=0;
    if(d.pronunciation&&d.pronunciation.words&&d.pronunciation.words.length>0){
      var match=d.pronunciation.words.find(function(w){return w.word&&w.word.toLowerCase()===targetWord.toLowerCase();});
      score=Math.round(match?match.accuracyScore:d.pronunciation.pronScore||0);
    }
    if(score>0){
      if(scoreEl){scoreEl.textContent=score+'%';scoreEl.style.color=pronColor(score);}
      if(tipEl){if(score>=80)tipEl.textContent='Ficou ótimo! Soou claro e natural.';else if(score>=65)tipEl.textContent='Quase lá! Ouça Emma mais uma vez e tente de novo.';else tipEl.textContent='Continue praticando! Foque em imitar o som da Emma.';}
    }else{
      if(scoreEl)scoreEl.textContent='';
      if(tipEl)tipEl.textContent='Não conseguimos pontuar. Tente de novo mais perto do microfone.';
    }
  }).catch(function(){var t=document.getElementById('wpTip');if(t)t.textContent='Erro ao pontuar. Tente de novo.';});
}

function showPronunciationPanel(bubbleId){
  var data=_pronData[bubbleId];if(!data)return;
  if(!data.pronunciation)return; // scores still computing in the background
  var p=data.pronunciation;
  var overall=Math.round(p?(p.pronScore||0):0),acc=Math.round(p?(p.accuracyScore||0):0),flu=Math.round(p?(p.fluencyScore||0):0),nat=Math.round(p?(p.prosodyScore||0):0);
  var rc=pronRingColor(overall),nc=pronColor(overall),off=pronOffset(overall);
  var hasW=p&&p.words&&p.words.length>0;
  var wordHtml=hasW?(p.words||[]).map(function(w,i){var cls=pronCls(w.accuracyScore||100);var oc="pronSelectWord('" + bubbleId + "'," + i + ")";return '<span class="pron-word-chip '+cls+'" data-widx="'+i+'" onclick="'+oc+'"><span class="pron-word-name '+cls+'">'+w.word+'</span><span class="pron-word-pct '+cls+'">'+Math.round(w.accuracyScore||100)+'%</span></span>';}).join(''):'';
  var subHtml='<div class="pron-sub"><div class="pron-sub-num">'+acc+'<span>%</span></div><div class="pron-sub-lbl">Accuracy</div></div><div class="pron-sub"><div class="pron-sub-num">'+flu+'<span>%</span></div><div class="pron-sub-lbl">Fluency</div></div>'+(nat?'<div class="pron-sub"><div class="pron-sub-num">'+nat+'<span>%</span></div><div class="pron-sub-lbl">Naturalness</div></div>':'');
  var ov=document.createElement('div');ov.className='pron-overlay';ov.id='pronOverlay';ov.onclick=function(e){if(e.target===ov)closePronPanel();};
  ov.innerHTML='<div class="pron-panel"><div class="pron-handle"></div><div class="pron-top"><div class="pron-ring-wrap"><svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="34" fill="none" stroke="#f0ede8" stroke-width="7"/><circle cx="40" cy="40" r="34" fill="none" stroke="'+rc+'" stroke-width="7" stroke-dasharray="213" stroke-dashoffset="'+off+'" stroke-linecap="round"/></svg><div class="pron-ring-inner"><span class="pron-ring-num" style="color:'+nc+'">'+overall+'</span><span class="pron-ring-lbl">score</span></div></div><div class="pron-right"><div class="pron-transcript">"'+data.transcript+'"</div><div class="pron-sub-scores">'+subHtml+'</div></div></div>'+(wordHtml?'<div class="pron-words-section"><div class="pron-words-lbl">Words</div><div class="pron-words-grid">'+wordHtml+'</div></div>':'')+'<div class="pron-detail" id="pronDetail"><span class="pron-detail-empty">Tap a word above to see what to improve</span></div><div class="pron-btns"><div style="display:flex;flex-direction:column;align-items:center;gap:5px"><button class="pron-btn-p" id="pronBtnYou"><svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(0,0,0,.45)"><path d="M8 5v14l11-7z"/></svg></button><span style="font-size:10px;color:#bbb;font-weight:500">Sua voz</span></div><div style="display:flex;flex-direction:column;align-items:center;gap:5px"><button class="pron-btn-s" id="pronBtnEmma"><svg width="14" height="14" viewBox="0 0 24 24" fill="rgba(0,0,0,.45)"><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/></svg></button><span style="font-size:10px;color:#bbb;font-weight:500">Emma</span></div></div></div>';
  document.body.appendChild(ov);
  var by=document.getElementById('pronBtnYou'),be=document.getElementById('pronBtnEmma');
  if(by)by.onclick=function(){pronPlayStudent(bubbleId);};if(be)be.onclick=function(){pronPlayEmma(data.transcript);};
}

// Stops any currently-playing pronunciation audio and resets button visual state
function pronStopAll(){
  if(_pronAudio){try{_pronAudio.pause();}catch(e){}_pronAudio=null;}
  if(_pronEmmaSrc){try{_pronEmmaSrc.stop();}catch(e){}_pronEmmaSrc=null;}
  var byb=document.getElementById('pronBtnYou');if(byb)byb.classList.remove('playing');
  var beb=document.getElementById('pronBtnEmma');if(beb)beb.classList.remove('playing');
  _pronCurrentBtn=null;
}

function pronPlayStudent(id){
  var data=_pronData[id];if(!data||!data.audioB64)return;
  var btn=document.getElementById('pronBtnYou');
  // Tap-toggle: if this button is already playing, stop and return
  if(btn && btn.classList.contains('playing')){pronStopAll();return;}
  pronStopAll();
  var raw=atob(data.audioB64),arr=new Uint8Array(raw.length);
  for(var i=0;i<raw.length;i++)arr[i]=raw.charCodeAt(i);
  var blob=new Blob([arr],{type:data.audioMime||'audio/mp4'});
  var url=URL.createObjectURL(blob);
  _pronAudio=new Audio(url);
  if(btn){btn.classList.add('playing');_pronCurrentBtn=btn;}
  _pronAudio.play();
  _pronAudio.onended=function(){URL.revokeObjectURL(url);if(btn)btn.classList.remove('playing');if(_pronCurrentBtn===btn)_pronCurrentBtn=null;_pronAudio=null;};
}

function pronPlayEmma(transcript){
  if(!transcript)return;
  var btn=document.getElementById('pronBtnEmma');
  // Tap-toggle: if this button is already playing, stop and return
  if(btn && btn.classList.contains('playing')){pronStopAll();return;}
  pronStopAll();
  if(btn){btn.classList.add('playing');_pronCurrentBtn=btn;}
  fetch(W+'/emma-speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:transcript})})
    .then(function(r){return r.arrayBuffer();})
    .then(function(ab){
      if(_pronCurrentBtn!==btn)return; // user switched/stopped during fetch
      var ctx=new (window.AudioContext||window.webkitAudioContext)();
      return ctx.decodeAudioData(ab).then(function(buf){
        if(_pronCurrentBtn!==btn)return;
        var src=ctx.createBufferSource();src.buffer=buf;src.connect(ctx.destination);
        _pronEmmaSrc=src;
        src.start();
        src.onended=function(){if(btn)btn.classList.remove('playing');if(_pronCurrentBtn===btn)_pronCurrentBtn=null;if(_pronEmmaSrc===src)_pronEmmaSrc=null;};
      });
    })
    .catch(function(){if(btn)btn.classList.remove('playing');if(_pronCurrentBtn===btn)_pronCurrentBtn=null;});
}

function closePronPanel(){var el=document.getElementById('pronOverlay');if(el)el.remove();pronStopAll();}

function closeSuggestion(){var p=document.getElementById('suggestionPopup');if(p)p.remove();var b=document.getElementById('suggestionBdrop');if(b)b.remove();}

function showSuggestion(){
  if(document.getElementById('suggestionPopup'))return;
  var lastEmma='';for(var i=emmaHistory.length-1;i>=0;i--){if(emmaHistory[i].role==='assistant'){lastEmma=emmaHistory[i].content;break;}}
  if(!lastEmma)return;
  var popup=document.createElement('div');popup.className='suggestion-popup';popup.id='suggestionPopup';var bdrop=document.createElement('div');bdrop.id='suggestionBdrop';bdrop.onclick=closeSuggestion;bdrop.style.cssText='position:fixed;inset:0;z-index:199;background:rgba(0,0,0,.65);';document.body.appendChild(bdrop);
  popup.innerHTML='<div class="suggestion-handle"></div><div class="suggestion-header"><div class="suggestion-lbl">Sugestão de resposta</div></div><div id="suggestionOptions"><div style="padding:20px 24px;font-size:14px;color:rgba(255,255,255,.3)">Carregando...</div></div><div class="suggestion-close" onclick="closeSuggestion()">Dispensar</div>';
  document.body.appendChild(popup);
  fetch(W+'/emma-chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({system:(window._emmaSystem||'')+' Give 2 short natural English responses the student could say. Return ONLY a JSON array of 2 strings.',messages:(emmaHistory.length>10?emmaHistory.slice(-10):emmaHistory).concat([{role:'user',content:'Suggest 2 responses.'}]),max_tokens:100})})
  .then(function(r){return r.json();})
  .then(function(d){
    try{
      var opts=JSON.parse((d.text||'').replace(/```json|```/g,'').trim());
      var el=document.getElementById('suggestionOptions');
      if(el&&Array.isArray(opts)){el.innerHTML=opts.slice(0,2).map(function(o,i){return '<div class="suggestion-option" style="animation:rowIn .2s ease '+(i*0.08)+'s both;" onclick="useSuggestion(this)"><span style="flex:1">'+o+'</span><span style="font-size:18px;color:rgba(255,255,255,.15);flex-shrink:0">→</span></div>';}).join('');}
    }catch(e){var el=document.getElementById('suggestionOptions');if(el)el.innerHTML='<div style="font-size:13px;color:rgba(255,255,255,.4)">Não foi possível carregar sugestões.</div>';}
  });
}

function useSuggestion(el){
  var text=el.textContent;
  closeSuggestion();
  emmaSubmit(text);
}

function _makeOnboardOverlay(text,topPx,rightPx,bottomPx,leftPx){
  var old=document.getElementById('_onboardOverlay');if(old)old.remove();
  var overlay=document.createElement('div');overlay.id='_onboardOverlay';
  overlay.style.cssText='position:fixed;top:0;left:0;width:100vw;height:100vh;pointer-events:none;z-index:9999;';
  var lbl=document.createElement('div');lbl.textContent=text;
  lbl.style.cssText='position:absolute;font-size:11px;font-weight:700;letter-spacing:.03em;color:#f5c842;background:rgba(20,20,20,.95);padding:5px 11px;border-radius:8px;border:1.5px solid rgba(201,162,39,.6);white-space:nowrap;box-shadow:0 2px 16px rgba(0,0,0,.4);animation:labelFadeIn 8s ease forwards;';
  if(topPx!==null)lbl.style.top=topPx+'px';
  if(rightPx!==null)lbl.style.right=rightPx+'px';
  if(bottomPx!==null)lbl.style.bottom=bottomPx+'px';
  if(leftPx!==null)lbl.style.left=leftPx+'px';
  overlay.appendChild(lbl);document.body.appendChild(overlay);
  setTimeout(function(){if(overlay.parentNode)overlay.remove();},8300);
}
function showPronOnboarding(){
  var icons=document.querySelectorAll('.stu-info');
  if(icons.length===0)return;
  var last=icons[icons.length-1];
  var bubble=last.closest('.emma-bubble.student');if(!bubble||!bubble.parentNode)return;
  var wrap=bubble.parentNode;
  var existing=wrap.querySelector('.pron-inline-label');if(existing)existing.remove();
  var lbl=document.createElement('div');lbl.className='pron-inline-label';
  lbl.textContent='Feedback de pronúncia';
  lbl.style.cssText='font-size:11px;font-weight:700;letter-spacing:.03em;color:#E6B31E;background:rgba(20,20,20,.95);padding:5px 11px;border-radius:8px;border:1.5px solid rgba(230,179,30,.5);white-space:nowrap;box-shadow:0 2px 16px rgba(0,0,0,.4);animation:labelFadeIn 8s ease forwards;align-self:flex-end;margin-right:4px;margin-top:2px;';
  wrap.insertBefore(lbl,bubble.nextSibling);
  setTimeout(function(){if(lbl.parentNode)lbl.remove();},8300);
}

function showSuggestionOnboarding(){
  // Glow the hint button
  var hb=document.getElementById('emmaHintBtn');
  if(!hb)return;
  hb.classList.remove('glow-white');
  void hb.offsetWidth;
  hb.classList.add('glow-white');
  // Label above
  var rect=hb.getBoundingClientRect();
  var lbl=document.createElement('div');
  lbl.className='pron-onboard-label';
  lbl.textContent='Sugestão de resposta';
  lbl.style.cssText='bottom:'+(window.innerHeight-rect.top+12)+'px;left:'+rect.left+'px;animation:sugFadeIn 5s ease forwards;';
  document.body.appendChild(lbl);
  setTimeout(function(){if(lbl.parentNode)lbl.remove();},5200);
  setTimeout(function(){hb.classList.remove('glow-white');},3500);
}

function emmaAddBubble(who,text){
  var wrap=document.getElementById('emmaBubbles');if(!wrap)return;
  var div=document.createElement('div');div.className='emma-bubble '+who;div.innerHTML=text;
  if(who==='student'){
    var pid=window._pendingPronId||null;window._pendingPronId=null;
    // Graphite bubble: text above, one faint-gray info icon below (inside the
    // bubble, bottom-right). Layout is flex-column via conversation.css.
    // The old external action row (play + i circles) is gone — replay and
    // scores live in the details panel the icon opens.
    div.innerHTML='<span class="stu-text">'+text+'</span>';
    var infoBtn=document.createElement('button');
    infoBtn.className='stu-info';
    infoBtn.setAttribute('aria-label','Detalhes');
    infoBtn.innerHTML='<svg width="13" height="13" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5.35" fill="none" stroke="rgba(255,255,255,.38)" stroke-width="1.1"/><rect x="5.3" y="5.1" width="1.4" height="4" rx="0.7" fill="rgba(255,255,255,.38)"/><circle cx="6" cy="3.2" r="0.85" fill="rgba(255,255,255,.38)"/></svg>';
    if(pid){(function(id){infoBtn.onclick=function(){showPronunciationPanel(id);};})(pid);}
    div.appendChild(infoBtn);
    wrap.appendChild(div);
    wrap.scrollTop=wrap.scrollHeight;
    return;
  }

  // Emma bubble — translate icon inside, bottom-right
  div.innerHTML = text;
  div.style.position = 'relative';

  var COLOR_IDLE = 'rgba(255,255,255,.85)';
  var COLOR_ACTIVE = 'rgb(232,184,75)';
  // Icon embedded as a data URI (Apple translate glyph, 88px, 2.5KB) - zero
  // network requests, appears instantly on every bubble, cannot fail to load.
  var ICON_URL = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAFgAAABYCAYAAABxlTA0AAAJwklEQVR42u2de6wdVRXGf/vM9EqFthggpVatr6YaBYEGNBElUaSFKCoYo4mgwUYQ6gNBEfGBEiFoQE1AjUYRExQCRoRAa4gCgjEiqAUbtYpGRPBBSgttbe89Z5Z/zLdzN+M8z4t7bmcnO+eeMzN79v5m7bW+9e19znVmRltGVzotBC3ALcBtaQFuAW4BbksLcAtwC3BbWoBbgNvSAtwC3ALclhbgFuAW4La0AM/5Ejc83wGR/jbVUTzwRHXii6u5Juc0+N4Y+xYJZJvvALtgkEuB44GjgOcB++k4gVVnrwmPuZz2/Xm7gYeBXwEbgYcCq07mK8AeqBj4BPAB4MAx9OsJ4FvAp4CdkwxyGcDe2hYDNwDH6n23xBpdhRVXFX/+Ar3eB5wIPDKpIJcBHGnAG4DjgGlZshtDv0wPckou4xhgz4gC69NC0yIFtPUBuAsagtsTGP0EKqf7TQNHAuernc58sGA/tRcDW4CDMi6jCUh5078qkOZd8ySwEvhPn65nTlmw/+xYsYakIbjeP18k63sn8HgFyFYCfAIsAdYGs2uiXYQH87V9+Dw/jbcAnwbuBa4FvqN2e33MAN+HV8+XVNkDulKDdA0BBrhJbS/W6zVqtx/r831YVsPVTBTAz+wz+zLghwL7dCUk9wGbGlItmw+6yaCddjnu4Q/APfr7I8Drdd61GSsf5F7zCmBX08o8cDeLwx4JHKzgZMD1SofjmveYSECbAOwa+rzQPQCcpPevE9B/Ae4oCHbWgFnsVS4i6x5+L+bQAU4QkPsHFOuaPmeLBf0ddp0TLsLVABjgR3IPxwEvlzvoAGfo9VbgMX1uBcCG9+sFn8W6zwyzevEwKqOUAOKa/tVquIcE+IE6ulBqmNcvdgGLgK16CO8VeHEmObHggUU6PiOxZxvwAuBZGX7uChKdsiQItbtVbXczEsFIU2VPpe6QyNLNsbjQ2nrq2CbgiAqW4IDXAHdmMkQXDN7fbztwFbADOBw4RL58aojj36Gk6CbgmwJ7qCAPasEWWJvnvosERicD7C7gN8DPReVeooF0gvY9uDcDnwPWAe/LcPJhBr/9ZBRHAGcBFwjo4YFsZtna0evtlpYZM0sqatfMDjMzZ2bvseLySrV9od5PZ9owM/uemR1gZr8NruuaWa9GP2Zq9tfXntqeCe51ifoY5WDTuA7Kg/00/7VchAFv02sYjKZ1/sl6vS6w1qyGsQ64DXiFrjMdcyV9ckEgjCv67TLusJMJoB9XUO4NQ1jqNEhVy865QZ1ZLr/tV58dT12JPlE+9E/AzwIf7v3vh5VeH86sBp0HjBX046ekCwSuD+WuE7iGy5TiD6xBd2pQL6uRXNwoi1wrv9bNsZQesAp4lY5fF9wnBv4B/I507S/JiQ9WwQweFT08gXTRtI56ZzntJPL5Hwpmz0jkyp0NtN/PAh8ELqzRqSuAM4F3ZT6/S9z5wAqqVdSPxaJxMXD5AOm2D7pv0WzrDsKRywD+a8A3y/yZAe8AvgI8p6BdF1j7IcCVomvhw/gbsDpgJlWAhlx4BtgXOFWA3Ak8EMwcy7mmaNze36/QA2PYAPvifWSnhNSHGddMDrfNAuKCYNLLTNMEeGHgt11OZucKUmbPjc8FDlPb00Hgy55vFUHcB7hnDwpwXNC4UyT/F+maXDbTchlriIKHVTW9OwXgRcoAywQn3/ZuZWGdzLFYesdDmk2P5sy2JfKxVhE4GUZSExdMv4h0ofEi+cxsRLeKAGQFrsQqgkxS0aZTtnWMHn4nw0L8avSUYkg4czyTWQLcIn/fy3ngQ1XxijI5P0WuJF2be7umdb8KVNWWqrrT0KkfD8uK+ynbZf3ZmTESiTSuIUGeQrrp45TMAwine5lPqwouidpLKpICf58VkkW3qP/nAPcDh2q27VFb+5CuonxVzOTb+mypAq01oIIj1SKmFZ1vERVbDTyjxlQOg1pUwaXR4K3GgA14vip68OcAfxaQq4Jz1+v8tcAbc9q1UbmGMjWtSA/2FvZiWdFy4OsKTEWNdOUTHwHOk+SYZ8FTwB+BS4E36bqoYnZ5xrINeKl05tXA3XpYFwAX65x7lB12A1aRFyPIyKVrgR8PJP40EC4iiTn+/b5m9qQEkjwhZlrHHjCzF9W8x8aMwGQlQo0FIs03gjY+ama3BaLVGYFgVNZWkiM8rRlU+GkSsHoBw4gkfLsCv+st93ZF/Af1PiqoUzn8tM4yUqR7rVPtAF8k3cOcKEBfOmg2Nuolo6Kg1Cvwuz2B+V1gjSJ2FCQXRTWp4MB5OnQvWO45U64h1JXfrxQ6DtzKWBdYBxEysolHuL51MfBuDbTJVw/ysr8y5Ssm3fd2CfAGifoHiCV0gdOAjwH/1rlRMFPGY9F9+BXvh5eZ2S75wT2BLz69wGdX+XfMbEOOyG85/rJnZr80s/PNbEXQzkozu1f9Ojn4fJmZnW1md5nZ7qBNG7UP7hdgZ2ZTZnZ/sBKw1cyO1zlxwzb9AG4tCXI+kG41s0Mz1x9kZufpWFiu1kpLeO5zzWxTAORIAY77MXpNs2mpaJ8Ruf+8qFbM7Cpt07KrQTZ3MOnuoTWSFpcHwdi7gVNJt89uJF3NvlsxYaZAuMpmlf8dBw9uUvrli/6hXAacHQQpVyA0dTX4RRnmEuUwn9CIZnTewpzs03Ie4irJtn1/P6QzhCAZBcGj35VYC0R3l1Hm8kShWOD2BFhRtug16G5AHRdmwMpLMkyZ4d8HzfIGBTgpoVlN2wH4iVQyVxHpk8BVxTXGEQVgJyUypQuOXx/MiqcN4KGRmUAivVz96tZI36voXBUVzFs4iKS4fS1DPyca4FC9+5JcxRSzy/2MODmwzKw4C/gnQ/hu3lwC2AJ/eRLwi2BFoRu4ISupTe+VBH7cJy7nalVkKLt75tq2fA/SY6Q747+saL4gk4kV1aTBuMNscIH0kreKyQxt65Sbo7+AHUbul4nLHk26zrZPgai/hNk9GVU7craTLik9Ie6+Afi+YsBQN/+5OfwT43k/oRDLbeRto1oKXE36da8u/7/dKuTF60l3bs6oDsrjJ8ZFZK2yl6FiXWV7O4O6Q/VBuZWreOq+47yyW+2E+5AdI/g9jEn4alQSJBOupHaUsp+m1ZMyvxxlZkh3VJLlpH33rIxB+AcQAV8A3ky6nBTlcOp+mMdeAXBdtxKT7lo/GtgsluBnwVi/tT9ff3XKi0WbBfKNzG5I6YgtjCdSz/N/VBKygk+SbjvYrERm2wgywr0O4Cyn3p/8rQMtwEO25rH9qIfby/6XkRuHWyCTGe1NZezW1P52ZQtwC3BbWoBbgFuA29IC3ALcAtyWFuBJK/8DdQKXknlWsDsAAAAASUVORK5CYII=';

  var tBtn = document.createElement('button');
  tBtn.style.cssText = 'background:none;border:none;cursor:pointer;padding:0;position:absolute;bottom:6px;right:8px;opacity:.4;transition:opacity .2s;';
  // Use a div with the PNG as a CSS mask, so the visible color is controlled by background-color.
  // Lets us set the icon to the exact same yellow as the translation text when active.
  var tImg = document.createElement('div');
  tImg.style.cssText = 'width:22px;height:22px;background-color:'+COLOR_IDLE+';-webkit-mask:url("'+ICON_URL+'") center/contain no-repeat;mask:url("'+ICON_URL+'") center/contain no-repeat;';
  tBtn.appendChild(tImg);
  tBtn._translated = false;
  tBtn._loading = false;
  tBtn.onclick = function(){
    if(tBtn._loading) return; // guard against rapid double-tap (was causing duplicate translations)
    if(tBtn._translated){
      var ex=div.querySelectorAll('.emma-translation');
      for(var i=0;i<ex.length;i++)ex[i].remove();
      tBtn.style.opacity='.65';tImg.style.backgroundColor=COLOR_IDLE;tBtn._translated=false;return;
    }
    // Safety: clean any leftover translations from a previous in-flight click
    var leftover=div.querySelectorAll('.emma-translation');
    for(var i2=0;i2<leftover.length;i2++)leftover[i2].remove();
    tBtn._loading = true;
    tBtn.style.opacity='.35';
    fetch(W+'/emma-chat',{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({system:'You are a translation tool. Your only job is to translate English to Brazilian Portuguese. Output ONLY the translated text. No explanations, no notes, no other text whatsoever.',messages:[{role:'user',content:text}],topic:'translation_'+Date.now(),max_tokens:300})
    }).then(function(r){return r.json();}).then(function(d){
      tBtn._loading = false;
      var t=d.text?d.text.trim():'';
      if(!t){tBtn.style.opacity='.65';return;}
      // Reject Claude refusals / meta-commentary that occasionally slip through the system prompt
      var refusalPatterns = [
        /^(i'?m sorry|i cannot|i can'?t|sorry,|i apologize|unfortunately|my apologies)/i,
        /^as an? (ai|assistant|language model)/i,
        /^i'?m an? (ai|assistant)/i,
        /i'?m not able to/i,
        /i don'?t (translate|provide|do)/i,
        /^(here'?s|here is) the translation/i,
        /^translation:/i
      ];
      if(refusalPatterns.some(function(p){return p.test(t);})){
        tBtn.style.opacity='.65';
        return;
      }
      // Final safety: remove any existing translation div before inserting (defense in depth)
      var dup=div.querySelectorAll('.emma-translation');
      for(var k=0;k<dup.length;k++)dup[k].remove();
      var el=document.createElement('div');el.className='emma-translation';
      // No font-size set — inherits from the parent bubble (17px on mobile, 14px on desktop)
      el.style.cssText='color:rgba(232,184,75,.85);line-height:1.5;padding-top:8px;margin-top:6px;border-top:1px solid rgba(255,255,255,.1);font-style:italic;';
      el.textContent=t;div.insertBefore(el,tBtn);
      tBtn.style.opacity='1';tImg.style.backgroundColor=COLOR_ACTIVE;tBtn._translated=true;
      wrap.scrollTop=wrap.scrollHeight;
    }).catch(function(){tBtn._loading=false;tBtn.style.opacity='.65';});
  };
  div.appendChild(tBtn);
  wrap.appendChild(div);
  wrap.scrollTop=wrap.scrollHeight;
}

// ── Chat inset auto-calibration ──────────────────────────────────────────────
// The bubble area scrolls behind the video (top) and the dock (bottom). Its
// paddings were hand-tuned constants, but the video is scaled (1.18) and
// offset by device safe-areas, so on some devices bubbles hid behind the
// video/footer with no way to scroll them out. This measures the REAL rendered
// geometry (getBoundingClientRect includes transforms) and sets the paddings
// from it. Runs on chat open and on resize/rotation; only applies in the
// overlay layout (wrap position:absolute), never on desktop's normal flow.
function _emmaFixChatInsets(){
  var wrap=document.querySelector('body.tab-conversation .emma-bubble-wrap');
  if(!wrap)return;
  if(getComputedStyle(wrap).position!=='absolute')return;
  var vid=document.querySelector('body.tab-conversation .emma-video-wrap');
  var foot=document.querySelector('body.tab-conversation .emma-footer');
  var wrapRect=wrap.getBoundingClientRect();
  if(vid){
    var vb=vid.getBoundingClientRect().bottom-wrapRect.top;
    if(vb>0&&vb<wrapRect.height)wrap.style.paddingTop=Math.round(vb+12)+'px';
  }
  if(foot){
    var fh=foot.getBoundingClientRect().height;
    // Bottom inset lives in a ::after spacer (see conversation.css) because iOS
    // Safari ignores scroll-container bottom padding in overflow math.
    if(fh>0&&fh<wrapRect.height){
      wrap.style.setProperty('--emma-bottom-inset',Math.round(fh+24)+'px');
      wrap.style.paddingBottom='0px';
    }
  }
  // keep the newest bubble in view after the geometry change
  wrap.scrollTop=wrap.scrollHeight;
}
if(!window._emmaInsetListener){
  window._emmaInsetListener=true;
  window.addEventListener('resize',function(){setTimeout(_emmaFixChatInsets,60);});
}

function emmaToggleRec(){
  emmaRec?emmaStopRec():emmaStartRec();
}

function emmaStartRec(){
  var btn=document.getElementById('emmaMicBtn');
  var status=document.getElementById('emmaStatus');
  navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
    emmaChunks=[];
    var mt2=mime();
    // 32kbps opus/aac is plenty for speech — halves upload size and WAV-decode
    // time versus the browser default, with no effect on Whisper/SpeechAce accuracy.
    var recOpts=mt2?{mimeType:mt2,audioBitsPerSecond:32000}:{audioBitsPerSecond:32000};
    try{emmaMr=new MediaRecorder(stream,recOpts);}
    catch(e){emmaMr=new MediaRecorder(stream,mt2?{mimeType:mt2}:{});}
    emmaMr.ondataavailable=function(e){if(e.data&&e.data.size>0)emmaChunks.push(e.data);};
    emmaMr.start(250);
    emmaRec=true;
    if(btn){btn.classList.add('rec');btn.innerHTML='<span class="stop-sq"></span> Stop speaking';}
    if(status)status.textContent='Listening... tap stop when done';
  }).catch(function(e){if(status)status.textContent='Mic error: '+e.message;});
}

function emmaStopRec(){
  if(!emmaMr||!emmaRec)return;
  emmaRec=false;
  emmaMr.stop();
  emmaMr.stream.getTracks().forEach(function(t){t.stop();});
  var btn=document.getElementById('emmaMicBtn');
  var status=document.getElementById('emmaStatus');
  if(btn){btn.classList.remove('rec');btn.innerHTML='&#127908; Tap to speak';btn.disabled=true;btn.style.opacity='0.5';}
  if(status)status.textContent='Transcribing...';
  emmaMr.onstop=function(){
    var mt2=emmaMr.mimeType||'audio/webm';
    var blob=new Blob(emmaChunks,{type:mt2});
    if(blob.size<1000){
      if(btn){btn.disabled=false;btn.style.opacity='1';}
      if(status)status.textContent='Could not hear you. Tap to try again.';
      return;
    }
    var reader=new FileReader();
    reader.onloadend=function(){
      var b64=reader.result.split(',')[1];
      var _recBlob=new Blob(emmaChunks,{type:mt2});
      (function(blob,origB64,origMime){
        var pid='p'+(++_pronBubbleCounter);
        var cancelled=false;

        // ── FAST LANE — transcript only (no WAV). The conversation rides this
        //    and never waits for pronunciation scoring.
        var _t0=Date.now();
        fetch(W+'/transcribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({audio:origB64,mimeType:origMime,skipPron:true,noEcho:true})})
        .then(function(r){return r.json();})
        .then(function(d){
          console.log('[perf] transcribe fast lane: '+(Date.now()-_t0)+'ms (payload ~'+Math.round(origB64.length/1024)+'KB)');
          var transcript=(d.text||'').trim();
          // ── Whisper hallucination filter ─────────────────────────────────
          // Whisper (trained on YouTube subs) hallucinates these phrases on silent/unclear audio.
          // Treat them as empty transcriptions so the user just gets the "try again" prompt.
          var whisperHallucinations = [
            /^\s*learn english for free/i,
            /www\.engvid\.com/i,
            /engvid\.com/i,
            /^\s*thanks for watching/i,
            /^\s*thank you for watching/i,
            /^\s*please subscribe/i,
            /don['’]t forget to subscribe/i,
            /^\s*subtitles? by/i,
            /^\s*subtitled by/i,
            /^\s*captions? by/i,
            /transcription outsourcing/i,
            /amara\.org/i,
            /^\s*like and subscribe/i,
            /^\s*see you in the next video/i,
            /do(es)? not correct (my |the )?grammar/i,
            /don['’]t correct (my |the )?grammar/i,
            /please (do(es)? not|don['’]t) correct/i
          ];
          var isHallucination = whisperHallucinations.some(function(p){ return p.test(transcript); });
          if(!transcript || isHallucination){
            cancelled=true; // late-arriving scores would have no bubble to attach to
            if(btn){btn.disabled=false;btn.style.opacity='1';}
            if(status)status.textContent='Could not hear you. Tap to try again.';
            return;
          }
          // Replay works immediately (local audio). Scores are null for now —
          // the bubble's ⓘ starts greyed and lights up when the background
          // lane delivers.
          _pronData[pid]={transcript:transcript,pronunciation:null,audioB64:origB64,audioMime:origMime};
          window._pendingPronId=pid;
          // Memory cap: keep replay AUDIO only for the last 8 turns. Scores and
          // transcripts stay forever (panel still works); older "Sua voz" replay
          // simply no-ops (pronPlayStudent guards !audioB64). Prevents long chats
          // from holding tens of MB of base64 audio and turning Safari sluggish.
          var _cut=_pronBubbleCounter-8;
          for(var _pi=_cut;_pi>0;_pi--){
            var _old=_pronData['p'+_pi];
            if(!_old||!_old.audioB64)break;
            _old.audioB64=null;
          }
          emmaSubmit(transcript);
        })
        .catch(function(){cancelled=true;if(btn){btn.disabled=false;btn.style.opacity='1';}});

        // ── BACKGROUND LANE — WAV build + pronunciation scoring. Fire-and-forget;
        //    never blocks or delays the turn. Attaches results to the bubble.
        function sendScore(wavB64){
          if(!wavB64||cancelled)return;
          var _ts=Date.now();
          fetch(W+'/score-pron',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({wavB64:wavB64})})
          .then(function(r){return r.json();})
          .then(function(d2){
            if(cancelled||!d2||!d2.pronunciation)return;
            console.log('[perf] pron scores (background): '+(Date.now()-_ts)+'ms');
            var rec=_pronData[pid];
            if(!rec)return;
            rec.pronunciation=d2.pronunciation;
            window._sessionPronunciationData.push({transcript:rec.transcript,scores:d2.pronunciation});
            // Icon stays faint gray by design (stateless). First scores of the
            // session still trigger the one-time onboarding label.
            if(!window._pronOnboardShown){
              window._pronOnboardShown=true;setTimeout(showPronOnboarding,300);
            }
          })
          .catch(function(){});
        }
        try{
          var fr2=new FileReader();
          fr2.onloadend=function(){
            if(!fr2.result){return;}
            try{
              var actx=new (window.AudioContext||window.webkitAudioContext)({sampleRate:16000});
              actx.decodeAudioData(fr2.result,function(decoded){
                try{
                  var sr=16000,offCtx=new OfflineAudioContext(1,decoded.length,sr);
                  var src=offCtx.createBufferSource();src.buffer=decoded;src.connect(offCtx.destination);src.start(0);
                  offCtx.startRendering().then(function(rendered){
                    var s=rendered.getChannelData(0),dLen=s.length*2,ab=new ArrayBuffer(44+dLen),dv=new DataView(ab);
                    function ws(o,str){for(var k=0;k<str.length;k++)dv.setUint8(o+k,str.charCodeAt(k));}
                    ws(0,'RIFF');dv.setUint32(4,36+dLen,true);ws(8,'WAVE');ws(12,'fmt ');
                    dv.setUint32(16,16,true);dv.setUint16(20,1,true);dv.setUint16(22,1,true);
                    dv.setUint32(24,sr,true);dv.setUint32(28,sr*2,true);dv.setUint16(32,2,true);dv.setUint16(34,16,true);
                    ws(36,'data');dv.setUint32(40,dLen,true);
                    for(var i=0,off=44;i<s.length;i++,off+=2){var v=Math.max(-1,Math.min(1,s[i]));dv.setInt16(off,v<0?v*0x8000:v*0x7FFF,true);}
                    var wb=new Uint8Array(ab),cs=8192,wstr='';
                    for(var j=0;j<wb.length;j+=cs)wstr+=String.fromCharCode.apply(null,wb.subarray(j,Math.min(j+cs,wb.length)));
                    sendScore(btoa(wstr));
                  }).catch(function(){});
                }catch(e){}
              },function(){});
            }catch(e){}
          };
          fr2.readAsArrayBuffer(blob);
        }catch(e){}
      })(_recBlob,b64,mt2);
      return;
    };
    reader.readAsDataURL(blob);
  };
}

function emmaSubmit(transcript){
  var status=document.getElementById('emmaStatus');
  var btn=document.getElementById('emmaMicBtn');
  if(btn){btn.disabled=true;btn.style.opacity='0.5';}
  emmaAddBubble('student',transcript);
  emmaHistory.push({role:'user',content:transcript});
  window._emmaTranscript='';

  // Image system removed

  // ── Injection filter — block URLs and suspicious content ─────────────────
  var injectionPatterns = [
    /https?:\/\//i,           // URLs
    /www\.[a-z]+\.[a-z]/i,   // www. domains
    /\.com|\.org|\.net|\.io/i, // domain extensions
    /ignore previous/i,
    /disregard/i,
    /system prompt/i,
    /you are now/i,
    /new instruction/i,
  ];
  var isInjection = injectionPatterns.some(function(p){ return p.test(transcript); });
  if(isInjection){
    // Silently drop — don't send to Claude, don't respond
    var btn0 = document.getElementById('emmaMicBtn');
    if(btn0){btn0.disabled=false;btn0.style.opacity='1';}
    emmaStateIdle();
    return;
  }

  // Topic switch interceptor — ONLY fires on explicit named-topic switch requests
  // Everything else (questions, approach changes, clarifications) goes to Claude
  var unit0 = getCurrentUnit(emmaTopic);
  if(unit0){
    // Only intercept if student is explicitly asking to switch to a NAMED different topic
    // Pattern: "I want to talk about X" or "can we talk about X" where X is a subject word
    var explicitSwitch = /^(i want to|can we|lets|let us|how about we|what if we)\s+(talk about|discuss|do|practice|switch to|move to)\s+(.{3,30})$/i.exec(transcript.trim());
    if(explicitSwitch){
      var requestedTopic = explicitSwitch[3].toLowerCase().trim();
      var currentTopic = unit0.title.toLowerCase();
      // Check if what they're asking about matches the current unit
      var currentWords = currentTopic.split(' ').filter(function(w){ return w.length > 3; });
      var isAboutCurrentUnit = currentWords.some(function(w){ return requestedTopic.indexOf(w) >= 0; });
      if(!isAboutCurrentUnit){
        var switchReply = 'Oh nice idea — but that comes up in a future session! Right now we are on ' + unit0.title + '. Back to it:';
        emmaAddBubble('emma', switchReply);
        emmaHistory.push({role:'assistant', content: switchReply});
        emmaStateSpeaking();
        emmaSpeak(switchReply);
        var rb = document.getElementById('emmaMicBtn');
        if(rb){rb.disabled=false;rb.style.opacity='1';}
        return;
      }
    }
  }

  // Check if waiting for student to repeat a corrected phrase
  if(window._emmaWaitingForRepeat){
    var expected=window._emmaWaitingForRepeat.toLowerCase().replace(/[^a-z0-9 ]/g,'');
    var said=transcript.toLowerCase().replace(/[^a-z0-9 ]/g,'');
    var matched=said.indexOf(expected)>=0||expected.indexOf(said)>=0||
      said.split(' ').filter(function(w){return expected.indexOf(w)>=0;}).length>=Math.floor(expected.split(' ').length*0.6);
    window._emmaWaitingForRepeat=null;
    var pendingReply=window._emmaPendingReply||'';
    window._emmaPendingReply=null;
    if(matched){
      // Student got it — praise and continue
      var praise='Perfect! Great job. ';
      emmaAddBubble('emma',praise+pendingReply);
      emmaHistory.push({role:'assistant',content:praise+pendingReply});
        emmaStateSpeaking();
      emmaSpeak(praise+pendingReply);
    } else {
      // Try once more gently
      var tryAgain='Almost! Try saying it one more time: "'+window._emmaLastFixed+'"';
      window._emmaWaitingForRepeat=window._emmaLastFixed;
      window._emmaPendingReply=pendingReply;
      emmaAddBubble('emma',tryAgain);
      emmaHistory.push({role:'assistant',content:tryAgain});
      emmaStateSpeaking();
      emmaSpeak(tryAgain);
    }
    var b=document.getElementById('emmaMicBtn');
    if(b){b.disabled=false;b.style.opacity='1';}
    return;
  }

  if(status)status.textContent='Emma is thinking...';
  // Use the full session prompt (curriculum, unit, expressions, redirect logic,
  // teaching rules) — cached in emmaStartConvo — plus the JSON correction
  // format rules. This is the drift fix: previously the per-turn prompt was
  // a stripped-down version, so Emma forgot the unit and expressions after
  // turn 1. Now every turn gets the same full instructions.
  var jsonRules =
    ' RESPONSE FORMAT (every turn): Respond ONLY with a JSON object, no markdown, no backticks. '+
    'Format: {"correction":{"original":"exact wrong phrase the student said","fixed":"the correct version"},"reply":"your conversational reply"}. '+
    'If the student made NO grammar or vocabulary mistake, set correction to null: {"correction":null,"reply":"your reply"}. '+
    'Rules for correction: The transcript is literal — treat it exactly as written. Correct clear grammar/vocabulary errors only. The fixed field must contain ONE clean phrase only, no quotes inside it, no alternatives separated by "or". Be warm — start the reply naturally after correcting. '+
    'Rules for reply: 1-2 sentences max. Ask one question to keep conversation going. Be natural and friendly. Never use bullet points. The reply must still respect ALL the teaching rules and unit constraints above — stay on the current unit, teach target expressions, redirect off-topic requests using the structure defined earlier.';
  var sysPrompt = (window._emmaBasePrompt || 'You are Emma, a friendly American English conversation coach having a natural spoken conversation with a Brazilian student. Topic: '+emmaTopic+'.') + jsonRules;
  emmaCallClaude(sysPrompt,function(raw){
    var parsed;
    try{
      // Strip markdown fences
      var clean=raw.replace(/```json/g,'').replace(/```/g,'').trim();
      // Find the JSON object boundaries robustly
      var start=clean.indexOf('{');
      var end=clean.lastIndexOf('}');
      if(start>=0&&end>start)clean=clean.slice(start,end+1);
      parsed=JSON.parse(clean);
    }catch(e){
      // Try extracting reply with regex as fallback
      var replyMatch=raw.match(/"reply"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      var origMatch=raw.match(/"original"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      var fixMatch=raw.match(/"fixed"\s*:\s*"((?:[^"\\]|\\.)*)"/);
      var replyText=replyMatch?replyMatch[1]:raw.replace(/```json|```/g,'').replace(/[\s\S]*"reply"\s*:\s*"/,'').replace(/"[\s\S]*/,'').trim()||raw;
      parsed={
        correction:(origMatch&&fixMatch)?{original:origMatch[1],fixed:fixMatch[1]}:null,
        reply:replyText
      };
    }
    var reply=(parsed&&parsed.reply)||raw;
    var spoken='';
    if(parsed&&parsed.correction&&parsed.correction.original&&parsed.correction.fixed){
      emmaAddCorrectionBubble(parsed.correction.original,parsed.correction.fixed);
      var corrExplanation='Oh, just a quick note — instead of “'+parsed.correction.original+'”, we say “'+parsed.correction.fixed+'”. Can you try that again?';
      spoken=corrExplanation;
      emmaAddBubble('emma',corrExplanation.trim());
      window._emmaWaitingForRepeat=parsed.correction.fixed;
      window._emmaPendingReply=reply;
      emmaHistory.push({role:'assistant',content:corrExplanation});
      emmaStateSpeaking();
      emmaSpeak(corrExplanation);
      var btn2=document.getElementById('emmaMicBtn');
      if(btn2){btn2.disabled=false;btn2.style.opacity='1';}
      return;
    }
    spoken+=reply;
    emmaHistory.push({role:'assistant',content:reply});
    var highlightedReply=renderHighlightedBubble(parsed.reply);
    emmaAddBubble('emma',highlightedReply);
    emmaStateSpeaking();
    emmaSpeak(spoken.replace(/\*\*([^*]+)\*\*/g,'$1'));
  });
}

function _openPrintWindow(htmlContent,filename){
  var w=window.open('','_blank');
  if(!w){return;}
  w.document.open();
  w.document.write(htmlContent);
  w.document.close();
}


// ============================================================================
// END SCREEN — session end UI, coach playback, word popup
// ============================================================================

// ─── Verify exercise answer keys + pron sentences against the LLM ─
// Catches wrong "answer" indices on grammar Qs and grammar errors in pron sentences.
function _endVerifyExercises(exercises, pronSentences, done){
  if((!exercises||!exercises.length)&&(!pronSentences||!pronSentences.length)){
    done({exercises:exercises||[],pronSentences:pronSentences||[]});return;
  }
  var exList=(exercises||[]).map(function(q,i){
    var opts=q.options.map(function(o,j){return '    '+String.fromCharCode(65+j)+') '+o;}).join('\n');
    return 'EXERCISE '+i+':\nQ: '+q.question+'\n'+opts+'\nMarked correct: '+String.fromCharCode(65+q.answer)+'\nHint shown to student: '+(q.tip||'(none)');
  }).join('\n\n---\n\n');
  var pronList=(pronSentences||[]).map(function(s,i){
    return 'SENTENCE '+i+': "'+s+'"';
  }).join('\n');
  var prompt='You are auditing English learning material before it is shown to a Brazilian student. There are two sections to audit: grammar EXERCISES and pronunciation SENTENCES.\n\n'+
    '== EXERCISES ==\n'+
    'CRITICAL RULES:\n'+
    '• When an option is written like "X / Y" for a question with multiple blanks (_____), interpret X as filling the FIRST blank and Y as filling the SECOND in order. The "/" does NOT mean "X or Y".\n'+
    '• Each exercise has a HINT — the explanation shown to the student. The hint MUST be consistent with the marked correct answer. If the hint clearly teaches a rule pointing to a different option than what is marked, FIX the answer to match the hint. The hint is ground truth.\n'+
    '• For each option, construct the full resolved sentence and judge it in natural, standard English.\n\n'+
    'Return one verdict per exercise:\n'+
    '1. "ok" — exactly one option produces natural correct English, the marked option is that one, and the hint is consistent.\n'+
    '2. "fix" — the marked answer is wrong (or the hint contradicts it). Return the correct index.\n'+
    '3. "discard" — broken: multiple options valid, awkward English in all, or unclear question.\n\n'+
    '== PRON SENTENCES ==\n'+
    'Each pronunciation sentence will be read aloud by Emma and repeated by the student. They MUST be natural, grammatically correct English the way a native speaker would say it.\n\n'+
    'Return one verdict per sentence:\n'+
    '1. "ok" — natural standard English, no changes needed.\n'+
    '2. "rewrite" — has a grammar error or unnatural phrasing, but the intent is clear and fixable. Return a "text" field with the corrected sentence (same meaning, natural English, similar length).\n'+
    '3. "discard" — broken or nonsensical, cannot be salvaged.\n'+
    'Example: "have you browsing around the venue" → rewrite to "have you been browsing around the venue" (missing "been").\n'+
    'Example: "I am go to store" → rewrite to "I am going to the store".\n\n'+
    'Respond ONLY with valid JSON, no markdown, no preamble. Format:\n'+
    '{"exerciseVerdicts":[{"i":<index>,"v":"ok"|"fix"|"discard","correct":<index_if_fix>}],"sentenceVerdicts":[{"i":<index>,"v":"ok"|"rewrite"|"discard","text":"<rewrite_if_rewrite>"}]}\n'+
    'Include an entry for EVERY exercise and EVERY sentence.\n\n'+
    'EXERCISES:\n\n'+(exList||'(none)')+
    '\n\n=================\n\nPRON SENTENCES:\n\n'+(pronList||'(none)');
  fetch(W+'/emma-chat',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      system:'You are a strict English teacher auditing material quality. Respond ONLY with valid JSON.',
      messages:[{role:'user',content:prompt}],
      topic:'verify',
      max_tokens:1200
    })
  })
  .then(function(r){return r.json();})
  .then(function(d){
    if(d.error)throw new Error(d.error);
    var text=(d.text||'').replace(/```json|```/g,'').trim();
    var res;
    try { res=JSON.parse(text); }
    catch(e){
      var m=text.match(/\{[\s\S]*?"exerciseVerdicts"[\s\S]*\}/);
      if(m){ try { res=JSON.parse(m[0]); } catch(e2){} }
    }
    if(!res){
      console.warn('[verifier] no verdicts, passing through unverified',text.slice(0,200));
      done({exercises:exercises||[],pronSentences:pronSentences||[]});return;
    }

    // Process exercise verdicts
    var keptExercises=[];
    var exFixed=0,exDiscarded=0;
    var exMap={};
    (res.exerciseVerdicts||[]).forEach(function(v){if(typeof v.i==='number')exMap[v.i]=v;});
    for(var i=0;i<(exercises||[]).length;i++){
      var v=exMap[i];
      if(!v){keptExercises.push(exercises[i]);continue;}
      if(v.v==='discard'){exDiscarded++;continue;}
      if(v.v==='fix'&&typeof v.correct==='number'&&v.correct>=0&&v.correct<exercises[i].options.length){
        exercises[i].answer=v.correct;exFixed++;
      }
      keptExercises.push(exercises[i]);
    }

    // Process pron sentence verdicts
    var keptSentences=[];
    var senRewritten=0,senDiscarded=0;
    var senMap={};
    (res.sentenceVerdicts||[]).forEach(function(v){if(typeof v.i==='number')senMap[v.i]=v;});
    for(var j=0;j<(pronSentences||[]).length;j++){
      var sv=senMap[j];
      if(!sv){keptSentences.push(pronSentences[j]);continue;}
      if(sv.v==='discard'){senDiscarded++;continue;}
      if(sv.v==='rewrite'&&typeof sv.text==='string'&&sv.text.length>3){
        keptSentences.push(sv.text);senRewritten++;
      } else {
        keptSentences.push(pronSentences[j]);
      }
    }

    console.log('[verifier] exercises: '+exFixed+' fixed, '+exDiscarded+' discarded, '+keptExercises.length+' kept of '+(exercises||[]).length+
      '; sentences: '+senRewritten+' rewritten, '+senDiscarded+' discarded, '+keptSentences.length+' kept of '+(pronSentences||[]).length);
    done({exercises:keptExercises,pronSentences:keptSentences});
  })
  .catch(function(err){
    console.warn('[verifier] failed, passing through unverified:',err&&err.message);
    done({exercises:exercises||[],pronSentences:pronSentences||[]});
  });
}

function emmaEndAndBack(){
  // End conversation and return to topic selection
  if(window._sessionExpressions && window._sessionExpressions.length > 0){
    advanceProgress(emmaTopic, window._expressionsTaught || 2);
  }
  window._sessionExpressions = null;
  window._expressionsTaught = 0;
  window._emmaWaitingForRepeat = null;
  window._emmaPendingReply = null;
  if(window._emmaAudio){window._emmaAudio.pause();}
  if(typeof _emmaSpeakId!=='undefined')_emmaSpeakId++;
  emmaStateIdle();
  emmaHistory=[];
  appMode='emma';
  showTopicPage();
}

// ─── Score → visual mapping (color + bar fill out of 10) ──────────────
function _endScoreToVisual(score){
  var s=(score||'B').toString().toUpperCase().trim();
  if(s==='A+')return{color:'green',filled:10};
  if(s==='A') return{color:'green',filled:9};
  if(s==='B+')return{color:'yellow',filled:8};
  if(s==='B') return{color:'yellow',filled:7};
  if(s==='C+')return{color:'orange',filled:6};
  if(s==='C') return{color:'orange',filled:5};
  if(s==='D') return{color:'red',filled:3};
  return{color:'yellow',filled:7};
}

// ─── Wrap single-quoted English phrases (handles contractions) in <q> ──
function _endStyleQuotes(text){
  return(text||'').replace(/'([A-Za-z][^']*(?:'\w[^']*)*)'/g,'<q>$1</q>');
}

// ─── Loading screen status message cycle ──────────────────────────────
var _endLoadingTimer=null;
function _endStartLoadingCycle(){
  var messages=['Analisando a conversa','Verificando sua pronúncia','Identificando pontos a melhorar','Gerando seu relatório'];
  var idx=0;
  if(_endLoadingTimer)clearInterval(_endLoadingTimer);
  _endLoadingTimer=setInterval(function(){
    idx=(idx+1)%messages.length;
    var el=document.getElementById('endLoadingStatus');
    if(!el)return;
    el.style.opacity='0';
    setTimeout(function(){
      var e=document.getElementById('endLoadingStatus');
      if(e){e.textContent=messages[idx];e.style.opacity='1';}
    },280);
  },2200);
}
function _endStopLoadingCycle(){
  if(_endLoadingTimer){clearInterval(_endLoadingTimer);_endLoadingTimer=null;}
}

// ─── Shared styles (injected once per render) ─────────────────────────
var _endStyles='\
.end-shell{display:flex;flex-direction:column;height:100vh;height:100dvh;background:#f6f5f1;font-family:-apple-system,BlinkMacSystemFont,"DM Sans",sans-serif;color:#0a0a0a;}\
.end-shell .emma-nav-bar{flex-shrink:0;background:#f6f5f1;}\
body.tab-conversation .end-shell .emma-back-menu{background:transparent;border-color:rgba(0,0,0,.12);color:rgba(0,0,0,.55);backdrop-filter:none;-webkit-backdrop-filter:none;}\
body.tab-conversation .end-shell .emma-nav-topic{color:rgba(0,0,0,.42);}\
.end-page,.end-loading{flex:1;overflow-y:auto;-webkit-overflow-scrolling:touch;min-height:0;background:#f6f5f1;}\
.end-page{padding:18px 14px 32px;}\
.end-loading{padding:40px 24px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px;}\
.end-card{background:#fff;border-radius:16px;margin-bottom:10px;padding:20px;}\
.end-card-title{font-size:15px;font-weight:700;color:#0a0a0a;letter-spacing:-.01em;margin-bottom:14px;}\
.end-hero-label{font-size:11px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:rgba(0,0,0,.42);margin-bottom:10px;}\
.end-hero-row{display:flex;align-items:center;gap:14px;margin-bottom:18px;}\
.end-hero-grade{font-size:38px;font-weight:800;letter-spacing:-.04em;line-height:1;flex-shrink:0;}\
.end-color-green{color:#22c55e;}.end-color-yellow{color:#e8b84b;}.end-color-orange{color:#f59e0b;}.end-color-red{color:#ef4444;}\
.end-bar{display:flex;gap:5px;align-items:center;height:30px;}\
.end-bar span{width:8px;height:100%;background:#ececef;border-radius:100px;}\
.end-bar span.f.end-color-green{background:#22c55e;}\
.end-bar span.f.end-color-yellow{background:#e8b84b;}\
.end-bar span.f.end-color-orange{background:#f59e0b;}\
.end-bar span.f.end-color-red{background:#ef4444;}\
.end-hero-sub{font-size:13.5px;color:rgba(0,0,0,.55);line-height:1.5;letter-spacing:-.005em;}\
.end-positive{margin-top:16px;padding:12px 14px;background:rgba(45,122,58,.07);border-radius:10px;display:flex;gap:10px;align-items:flex-start;}\
.end-positive-icon{flex-shrink:0;width:14px;height:14px;color:#2d7a3a;margin-top:2px;}\
.end-positive-text{font-size:13px;line-height:1.5;color:#1f5e2c;letter-spacing:-.005em;}\
.end-row{display:flex;gap:12px;align-items:flex-start;padding:14px 0;border-bottom:1px solid #f1f0f3;}\
.end-row:first-of-type{padding-top:0;}\
.end-row:last-of-type{padding-bottom:0;border-bottom:none;}\
.end-row-badge{width:24px;height:24px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;font-weight:800;}\
.end-badge-mistake{background:rgba(192,57,43,.1);color:#c0392b;font-size:11px;}\
.end-badge-next{background:rgba(232,184,75,.16);color:#b88a2e;}\
.end-badge-next svg{width:13px;height:13px;}\
.end-row-body{flex:1;min-width:0;}\
.end-row-title{font-size:14px;font-weight:600;color:#0a0a0a;margin-bottom:4px;line-height:1.35;letter-spacing:-.005em;}\
.end-row-detail{font-size:12.5px;color:rgba(0,0,0,.55);line-height:1.55;}\
.end-row-detail q{quotes:"\\27" "\\27";color:rgba(0,0,0,.78);font-weight:500;}\
.end-pills{display:flex;flex-wrap:wrap;gap:7px;}\
.end-pill{border:none;background:rgba(0,0,0,.04);border-radius:100px;padding:9px 14px;font-family:inherit;font-size:13.5px;font-weight:600;color:#0a0a0a;cursor:pointer;display:inline-flex;align-items:baseline;gap:7px;transition:transform .1s,background .15s;letter-spacing:-.005em;}\
.end-pill:active{transform:scale(.96);}\
.end-pill-pct{font-size:11px;font-weight:700;opacity:.65;}\
.end-pill-r{background:rgba(192,57,43,.1);color:#c0392b;}\
.end-pill-y{background:rgba(232,184,75,.16);color:#8a6d00;}\
.end-pill-g{background:rgba(45,122,58,.1);color:#2d7a3a;}\
.end-actions{margin-top:20px;display:flex;flex-direction:column;gap:10px;}\
.end-primary-btn{width:100%;padding:14px;border-radius:13px;background:#0a0a0a;color:#fff;border:none;font-family:inherit;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;letter-spacing:-.005em;}\
.end-primary-btn svg{width:16px;height:16px;}\
.end-secondary-row{display:flex;gap:8px;}\
.end-secondary-btn{flex:1;padding:11px 6px;border-radius:11px;background:#fff;border:1px solid #ececef;color:rgba(0,0,0,.7);font-family:inherit;font-size:11.5px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:5px;cursor:pointer;letter-spacing:-.005em;}\
.end-secondary-btn svg{width:14px;height:14px;flex-shrink:0;}\
.end-bar-loading span{animation:endBarFill 2.6s ease-in-out infinite;}\
.end-bar-loading span:nth-child(1){animation-delay:0s;}\
.end-bar-loading span:nth-child(2){animation-delay:.12s;}\
.end-bar-loading span:nth-child(3){animation-delay:.24s;}\
.end-bar-loading span:nth-child(4){animation-delay:.36s;}\
.end-bar-loading span:nth-child(5){animation-delay:.48s;}\
.end-bar-loading span:nth-child(6){animation-delay:.60s;}\
.end-bar-loading span:nth-child(7){animation-delay:.72s;}\
.end-bar-loading span:nth-child(8){animation-delay:.84s;}\
.end-bar-loading span:nth-child(9){animation-delay:.96s;}\
.end-bar-loading span:nth-child(10){animation-delay:1.08s;}\
@keyframes endBarFill{0%,55%{background:#ececef;transform:scaleY(.85);}65%{background:#e8b84b;transform:scaleY(1.08);}100%{background:#ececef;transform:scaleY(.85);}}\
.end-loading-status{font-size:24px;font-weight:700;color:rgba(0,0,0,.85);letter-spacing:-.02em;transition:opacity .35s ease;text-align:center;max-width:290px;line-height:1.25;}\
.end-loading-sub{font-size:13px;color:rgba(0,0,0,.4);letter-spacing:-.005em;margin-top:-14px;display:flex;align-items:center;gap:5px;}\
.end-loading-dots{display:inline-flex;gap:3px;align-items:center;}\
.end-loading-dots span{width:3px;height:3px;border-radius:50%;background:rgba(0,0,0,.35);animation:endDot 1.4s ease-in-out infinite;}\
.end-loading-dots span:nth-child(2){animation-delay:.2s;}\
.end-loading-dots span:nth-child(3){animation-delay:.4s;}\
@keyframes endDot{0%,60%,100%{opacity:.25;}30%{opacity:1;}}\
';

// ─── HTML builders ────────────────────────────────────────────────────
function _endBuildLoadingHTML(){
  return '<style>'+_endStyles+'</style>'+
    '<div class="end-shell">'+renderModeTabs()+
      '<div class="end-loading">'+
        '<div class="end-bar end-bar-loading">'+
          '<span></span><span></span><span></span><span></span><span></span>'+
          '<span></span><span></span><span></span><span></span><span></span>'+
        '</div>'+
        '<div class="end-loading-status" id="endLoadingStatus">Analisando a conversa</div>'+
        '<div class="end-loading-sub"><span>só um instante</span>'+
        '<span class="end-loading-dots"><span></span><span></span><span></span></span></div>'+
      '</div>'+
    '</div>';
}

function _endBuildReportHTML(r,pronWords){
  var v=_endScoreToVisual(r.score);
  var i;
  // Score bar
  var barHTML='';
  for(i=0;i<10;i++){barHTML+='<span class="'+(i<v.filled?'f end-color-'+v.color:'')+'"></span>';}

  // Hero card (score + headline + summary + inline positive)
  var heroHTML='<div class="end-card">'+
    '<div class="end-hero-label">Sua nota</div>'+
    '<div class="end-hero-row">'+
      '<div class="end-hero-grade end-color-'+v.color+'">'+(r.score||'B')+'</div>'+
      '<div class="end-bar">'+barHTML+'</div>'+
    '</div>'+
    '<div class="end-hero-sub">'+(r.headline||'')+(r.summary?' '+r.summary:'')+'</div>'+
    (r.positive?'<div class="end-positive">'+
      '<svg class="end-positive-icon" viewBox="0 0 24 24"><path d="M12 1.5l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="currentColor"/></svg>'+
      '<span class="end-positive-text">'+_endStyleQuotes(r.positive)+'</span>'+
    '</div>':'')+
  '</div>';

  // Mistakes card
  var mistakesHTML='';
  if(r.mistakes&&r.mistakes.length>0){
    mistakesHTML='<div class="end-card"><div class="end-card-title">Erros para corrigir</div>'+
      r.mistakes.map(function(m,i){
        return '<div class="end-row">'+
          '<div class="end-row-badge end-badge-mistake">'+(i+1)+'</div>'+
          '<div class="end-row-body">'+
            '<div class="end-row-title">'+(m.title||'')+'</div>'+
            '<div class="end-row-detail">'+_endStyleQuotes(m.detail||'')+'</div>'+
          '</div>'+
        '</div>';
      }).join('')+
    '</div>';
  }

  // Next steps card
  var arrowSvg='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="13 5 19 12 13 19"/></svg>';
  var nextHTML='';
  if(r.improvements&&r.improvements.length>0){
    nextHTML='<div class="end-card"><div class="end-card-title">Próximos passos</div>'+
      r.improvements.map(function(imp){
        return '<div class="end-row">'+
          '<div class="end-row-badge end-badge-next">'+arrowSvg+'</div>'+
          '<div class="end-row-body">'+
            '<div class="end-row-title">'+(imp.title||'')+'</div>'+
            '<div class="end-row-detail">'+_endStyleQuotes(imp.detail||'')+'</div>'+
          '</div>'+
        '</div>';
      }).join('')+
    '</div>';
  }

  // Pronunciation pills card
  var pronHTML='';
  if(pronWords&&pronWords.length>0){
    pronHTML='<div class="end-card"><div class="end-card-title">Pronúncia · treinar</div>'+
      '<div class="end-pills">'+
        pronWords.map(function(w){
          var cls=w.score<60?'r':w.score<80?'y':'g';
          return '<button class="end-pill end-pill-'+cls+'" onclick="playCorrectWord(this)" data-word="'+w.word+'">'+w.word+
            ' <span class="end-pill-pct">'+w.score+'%</span></button>';
        }).join('')+
      '</div>'+
    '</div>';
  }

  // Actions (all icons as inline SVG — no emoji)
  var refreshIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-3.5-7.1"/><polyline points="21 3 21 9 15 9"/></svg>';
  var docIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>';
  var chatIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';
  var pencilIcon='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4z"/></svg>';
  var actionsHTML='<div class="end-actions">'+
    '<button class="end-primary-btn" onclick="renderEmma()">'+refreshIcon+' Nova conversa</button>'+
    '<div class="end-secondary-row">'+
      '<button class="end-secondary-btn" onclick="downloadReport()">'+docIcon+' Salvar PDF</button>'+
      '<button class="end-secondary-btn" onclick="downloadTranscript()">'+chatIcon+' Transcript</button>'+
      '<button class="end-secondary-btn" onclick="downloadExercises()">'+pencilIcon+' Exercícios</button>'+
    '</div>'+
  '</div>';

  return '<style>'+_endStyles+'</style>'+
    '<div class="end-shell">'+renderModeTabs()+
      '<div class="end-page">'+
        '<button onclick="showTopicPage()" style="background:none;border:none;cursor:pointer;font-size:14px;font-weight:600;color:rgba(0,0,0,.42);font-family:inherit;display:flex;align-items:center;gap:6px;padding:0 0 14px;">'+
          '<svg width="16" height="16" viewBox="0 0 24 24" fill="rgba(0,0,0,.42)"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>In\u00edcio</button>'+
        heroHTML+mistakesHTML+nextHTML+pronHTML+actionsHTML+'</div>'+
    '</div>';
}

// ─── Main end-screen entry point ──────────────────────────────────────
function emmaEnd(){
  // Save progress
  if(window._sessionExpressions && window._sessionExpressions.length > 0){
    var taught = window._expressionsTaught || 2;
    advanceProgress(emmaTopic, taught);
  }
  window._sessionExpressions = null;
  window._expressionsTaught = 0;
  window._emmaWaitingForRepeat = null;
  window._emmaPendingReply = null;

  if(emmaAudio){emmaAudio.pause();emmaAudio=null;}
  if(emmaRec)emmaStopRec();
  if(typeof _emmaSpeakId!=='undefined')_emmaSpeakId++;
  emmaStateIdle();
  var history=emmaHistory.slice();
  emmaHistory=[];
  var area=document.getElementById('area');

  // Show loading screen with cycling status messages
  area.innerHTML=_endBuildLoadingHTML();
  _endStartLoadingCycle();

  // Short conversation guard
  if(history.length<3){
    _endStopLoadingCycle();
    area.innerHTML=renderModeTabs()+
      '<div class="card" style="text-align:center;padding:3rem 2rem;">'+
        '<div style="font-size:40px;margin-bottom:1rem;">&#128075;</div>'+
        '<div style="font-size:18px;font-weight:700;color:var(--white);margin-bottom:8px;">Conversa encerrada</div>'+
        '<div style="font-size:13px;color:var(--g400);margin-bottom:2rem;">Tenha uma conversa mais longa para gerar o relatório!</div>'+
        '<button class="ab" onclick="renderEmma()">Try again</button>'+
      '</div>';
    return;
  }

  var convoText=history.map(function(m){return (m.role==='user'?'Student: ':'Emma: ')+m.content;}).join(' | ');
  window._lastHistory=history;
  window._lastTopic=emmaTopic;
  var convoText2=convoText;if(convoText2.length>2000)convoText2=convoText2.slice(-2000);

  // Pronunciation words — top 6 lowest-scoring (was 10)
  var pronWords=[];
  if(window._sessionPronunciationData&&window._sessionPronunciationData.length>0){
    var wordMap={};
    window._sessionPronunciationData.forEach(function(s){
      (s.scores&&s.scores.words||[]).forEach(function(w){
        if(!w.word)return;
        var k=w.word.toLowerCase();
        if(!wordMap[k])wordMap[k]={word:w.word,total:0,count:0};
        wordMap[k].total+=w.accuracyScore||0;
        wordMap[k].count++;
      });
    });
    pronWords=Object.values(wordMap)
      .map(function(w){return {word:w.word,score:Math.round(w.total/w.count)};})
      .filter(function(w){return w.score<90;})
      .sort(function(a,b){return a.score-b.score;})
      .slice(0,6);
  }
  var pronInfo=pronWords.length>0?(' Pronunciation data: '+JSON.stringify(pronWords)):'';

  // Prompt — adds length constraint on detail fields to cap report size
  var reportPrompt='Analyze this English conversation between a Brazilian student and coach Emma. Conversation: '+convoText2+pronInfo+' '+
    'Respond ONLY with a single JSON object, no markdown, no backticks. Format: '+
    '{"headline":"título encorajador curto em português","score":"A/B/C/D","summary":"uma frase of avaliação em português",'+
    '"mistakes":[{"title":"nome do erro em português","detail":"exemplo específico da conversa + correção, manter frases em inglês como estão"}],'+
    '"improvements":[{"title":"focus area","detail":"specific actionable advice"}],'+
    '"positive":"what the student did well",'+
    '"exercises":[{"question":"complete the sentence / choose the correct form","options":["opt A","opt B","opt C","opt D"],"answer":0,"tip":"brief grammar explanation"}],'+
    '"pronSentences":["correct English sentence relevant to this conversation","...","...","..."]}'+
    ' Rules: max 3 mistakes, max 3 improvements. Each "detail" field MUST be 20-40 words (concise and actionable, no fluff). The "summary" and "positive" fields MUST each be a single sentence. Generate 8 exercises based on grammar mistakes and vocabulary from this conversation — mix multiple choice, sentence completion and error correction. answer is 0-based index of correct option.'+
    ' CRITICAL exercise rule: each question MUST have EXACTLY ONE correct answer; the other three options must be unambiguously wrong (clear grammatical errors, factually incorrect, or obviously inappropriate for the context). Do NOT create questions where multiple options could be considered correct in standard English. For example, do NOT ask "choose the correct form" if both an uncontracted and contracted version are grammatically valid — only one option should be correct.'+
    ' Generate exactly 4 pronSentences: correct natural English sentences (8-15 words) relevant to the conversation.'+(pronWords.length>0?' Each sentence must include at least one of these poorly-pronounced words (lowest score first): '+pronWords.map(function(w){return w.word;}).join(', ')+'.':'')+
    ' Match the vocabulary complexity of the student\'s own sentences — keep it simple if they spoke simply. Be kind and practical.';
  fetch(W+'/emma-chat',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({system:'You are an English coach writing a report for a Brazilian student. Respond ONLY with valid JSON, nothing else. Write ALL text fields in Brazilian Portuguese, EXCEPT: keep any English words, phrases, or sentences used as examples exactly in English (do not translate them). This includes the headline, summary, mistake titles, mistake details, improvement titles, improvement details, and the positive field.',messages:[{role:'user',content:reportPrompt}],topic:'report',max_tokens:2500})
  })
  .then(function(r){return r.json();})
  .then(function(d){
    if(d.error)throw new Error(d.error);
    var text=d.text.replace(/```json|```/g,'').trim();
    var r=JSON.parse(text);
    _endVerifyExercises(r.exercises||[],r.pronSentences||[],function(result){
      r.exercises=result.exercises;
      r.pronSentences=result.pronSentences;
      _endStopLoadingCycle();
      var area2=document.getElementById('area');
      if(area2)area2.innerHTML=_endBuildReportHTML(r,pronWords);
      window._lastReport=r;
      // Log this chat session's grade into the weekly accuracy pool (one sample per session)
      try{ if(window.SWTrack && SWTrack.acc){ var _av=_endScoreToVisual(r.score); SWTrack.acc((_av.filled||0)*10); } }catch(e){}
    });
  })
  .catch(function(){
    _endStopLoadingCycle();
    var area3=document.getElementById('area');
    if(area3)area3.innerHTML=renderModeTabs()+
      '<div class="card" style="text-align:center;padding:3rem 2rem;">'+
        '<div style="font-size:18px;font-weight:700;color:var(--white);margin-bottom:8px;">Ótima conversa!</div>'+
        '<div style="font-size:13px;color:var(--g400);margin-bottom:2rem;">Continue praticando todo dia.</div>'+
        '<button class="ab" onclick="renderEmma()">Nova conversa</button>'+
      '</div>';
  });
}

function showEnd(){
  var sv=Object.values(scores).map(Number);
  var avg=sv.length?Math.round(sv.reduce(function(a,b){return a+b;},0)/sv.length):0;
  var gr=sv.filter(function(v){return v>=85;}).length;
  var ok=sv.filter(function(v){return v>=75&&v<85;}).length;
  var lo=sv.filter(function(v){return v<75;}).length;
  var best=sv.length?Math.max.apply(null,sv):0;
  document.getElementById('area').innerHTML=
    '<div class="ec"><div class="ei">&#127881;</div>'+
    '<div class="et">Session Complete!</div>'+
    '<div class="es">You practiced all '+SENTS.length+' sentences</div>'+
    '<div class="avg">'+avg+'%</div><div class="avgl">Average Score</div>'+
    '<div class="sg">'+
      '<div class="si"><div class="sn g">'+gr+'</div><div class="sll">Excellent &ge;85%</div></div>'+
      '<div class="si"><div class="sn o">'+ok+'</div><div class="sll">Good 75-84%</div></div>'+
      '<div class="si"><div class="sn rr">'+lo+'</div><div class="sll">Needs work</div></div>'+
      '<div class="si"><div class="sn">'+best+'%</div><div class="sll">Best score</div></div>'+
    '</div>'+
    '<button class="rb" id="rbtn">Practice again</button></div>';
  document.getElementById('rbtn').onclick=function(){
    done={};scores={};localStorage.setItem('pd','{}');localStorage.setItem('ps','{}');cur=0;render();
  };
}

function speakCoach(btn){
  // Prevent double-click while fetching
  if(btn._fetching)return;
  // If playing, stop
  if(window._coachAudio&&!window._coachAudio.paused){
    window._coachAudio.pause();window._coachAudio=null;
    btn.innerHTML='&#128266;';btn.classList.remove('playing','loading');btn.style.opacity='1';return;
  }
  if(!window._coachText)return;
  // If already cached, play instantly
  if(window._coachAudioUrl){
    window._coachAudio=new Audio(window._coachAudioUrl);
    btn.innerHTML='<span class="stop-sq"></span>';btn.classList.add('playing');
    window._coachAudio.play();
    window._coachAudio.onended=function(){
      window._coachAudio=null;
      var b2=document.getElementById('coachAudioBtn');
      if(b2){b2.innerHTML='&#128266;';b2.classList.remove('playing');}
    };
    return;
  }
  // Fetch from ElevenLabs
  btn._fetching=true;
  btn.innerHTML='&#9203;&#65039;';btn.classList.add('loading');btn.style.opacity='0.7';
  fetch(W+'/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:window._coachText,lang:'pt'})})
    .then(function(r){if(!r.ok)throw new Error(r.status);return r.blob();})
    .then(function(b){
      btn._fetching=false;btn.style.opacity='1';
      var url=URL.createObjectURL(b);
      window._coachAudioUrl=url;// Cache it
      window._coachAudio=new Audio(url);
      btn.innerHTML='<span class="stop-sq"></span>';btn.classList.remove('loading');btn.classList.add('playing');
      window._coachAudio.play();
      window._coachAudio.onended=function(){
        window._coachAudio=null;
        var b2=document.getElementById('coachAudioBtn');
        if(b2){b2.innerHTML='&#128266;';b2.classList.remove('playing');b2.style.opacity='1';}
      };
    })
    .catch(function(){
      btn._fetching=false;
      btn.innerHTML='&#128266;';btn.classList.remove('loading','playing');btn.style.opacity='1';
    });
}

var wpopCorrectAudio=null,wpopRecAudio=null;
function openWordPopup(pill){
  var d=JSON.parse(decodeURIComponent(pill.getAttribute('data-w')));
  var pop=document.getElementById('wpop');
  var box=document.getElementById('wpopBox');
  var scoreColor=d.score>=85?'var(--green)':d.score>=75?'var(--amb)':'var(--red)';
  var rows='';
  if(d.allPhones&&d.allPhones.length){
    for(var i=0;i<d.allPhones.length;i++){
      var p=d.allPhones[i];
      var isGood=p.score>=75;
      var feedback=isGood?'<span class="wpop-good">Good</span>':'<span class="wpop-bad">'+(p.soundLike?'Sounds like '+p.soundLike:'Needs work')+'</span>';
      rows+='<tr><td>'+p.syllable+'</td><td style="font-family:monospace">'+p.phone+'</td><td>'+feedback+'</td></tr>';
    }
  } else {
    rows='<tr><td colspan="3" style="color:var(--g400);text-align:center;padding:12px 0">No phoneme data</td></tr>';
  }
  box.innerHTML=
    '<div class="wpop-word">'+d.word+'</div>'+
    '<div class="wpop-score" style="color:'+scoreColor+'">Score: '+d.score+'%</div>'+
    '<div class="wpop-btns">'+
      '<button class="wpop-btn" id="wpopCorrectBtn" onclick="playCorrectWord(this)" data-word="'+d.word+'">'+
        '<span class="wpop-btn-icon">🔊</span><span>Correct</span>'+
      '</button>'+
      (window._recUrl&&d.start&&d.end?
        '<button class="wpop-btn" id="wpopRecBtn" onclick="playWordClip('+d.start+','+d.end+',this)">'+
          '<span class="wpop-btn-icon">▶</span><span>Your voice</span>'+
        '</button>':'')+
    '</div>'+
    '<table class="wpop-table">'+
      '<thead><tr><th>Syllable</th><th>Sound</th><th style="text-align:right">Score</th></tr></thead>'+
      '<tbody>'+rows+'</tbody>'+
    '</table>'+
    '<button class="wpop-close" onclick="closeWordPopup()">Close</button>';
  pop.classList.add('show');
}
function closeWordPopup(e){
  if(e&&e.target!==document.getElementById('wpop'))return;
  if(wpopCorrectAudio){wpopCorrectAudio.pause();wpopCorrectAudio=null;}
  if(wpopRecAudio){wpopRecAudio.pause();wpopRecAudio=null;}
  document.getElementById('wpop').classList.remove('show');
}
function playCorrectWord(btn){var word=btn.getAttribute('data-word');
  if(wpopCorrectAudio&&!wpopCorrectAudio.paused){
    wpopCorrectAudio.pause();wpopCorrectAudio=null;
    btn.classList.remove('active','loading');return;
  }
  btn.classList.add('loading');
  var icon=btn.querySelector('.wpop-btn-icon');
  if(icon)icon.textContent='⏳';
  fetch(W+'/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:word})})
    .then(function(r){return r.blob();})
    .then(function(b){
      var url=URL.createObjectURL(b);
      wpopCorrectAudio=new Audio(url);
      btn.classList.remove('loading');btn.classList.add('active');
      if(icon)icon.textContent='🔊';
      wpopCorrectAudio.play();
      wpopCorrectAudio.onended=function(){
        btn.classList.remove('active');
        if(icon)icon.textContent='🔊';
        URL.revokeObjectURL(url);
      };
    }).catch(function(){
      btn.classList.remove('active','loading');
      if(icon)icon.textContent='🔊';
    });
}
function playWordClip(start,end,btn){
  if(wpopRecAudio&&!wpopRecAudio.paused){
    wpopRecAudio.pause();wpopRecAudio=null;
    btn.classList.remove('active');return;
  }
  if(!window._recUrl)return;
  var startSec=start*0.01;
  var endSec=end*0.01;
  var audio=new Audio(window._recUrl);
  audio.currentTime=startSec;
  wpopRecAudio=audio;
  btn.classList.add('active');
  var icon=btn.querySelector('.wpop-btn-icon');
  if(icon)icon.textContent='▶';
  audio.play();
  var iv=setInterval(function(){
    if(audio.currentTime>=endSec){
      audio.pause();clearInterval(iv);
      btn.classList.remove('active');
      wpopRecAudio=null;
      if(icon)icon.textContent='▶';
    }
  },50);
}


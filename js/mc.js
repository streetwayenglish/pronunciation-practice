// ============================================================================
// MC — multiple-choice exercise mode
// ============================================================================
function renderMC(){
  // Update progress bar for MC mode
  var pf=document.getElementById('pf');
  var pl=document.getElementById('pl');
  if(pf)pf.style.width=MCQS.length?Math.round((mcCur/MCQS.length)*100)+'%':'0%';
  if(pl)pl.textContent=(mcCur+1)+' / '+(MCQS.length||0);
  var area=document.getElementById('area');
  if(!MCQS||MCQS.length===0){
    area.innerHTML=renderModeTabs()+'<div class="fbc" style="text-align:center;padding:2rem"><p style="color:var(--g400);font-size:15px">No speaking exercises yet. Check back soon!</p></div>';
    return;
  }
  if(mcCur>=MCQS.length){
    var pf2=document.getElementById('pf');
    var pl2=document.getElementById('pl');
    if(pf2)pf2.style.width='100%';
    if(pl2)pl2.textContent=MCQS.length+' / '+MCQS.length;
    var total=MCQS.length;
    var correct=mcScores.filter(function(s){return s===1;}).length;
    var pct=total>0?Math.round((correct/total)*100):0;
    var emoji=pct>=85?'🏆':pct>=70?'🎉':'💪';
    var msg=pct>=85?'Excellent work!':pct>=70?'Good job!':'Keep practicing!';
    area.innerHTML=renderModeTabs()+
      '<div class="ec">'+
        '<div class="ei">'+emoji+'</div>'+
        '<div class="et">'+msg+'</div>'+
        '<div class="es">Speaking exercises complete</div>'+
        '<div class="avg">'+pct+'%</div>'+
        '<div class="avgl">Overall Score</div>'+
        '<div class="sg">'+
          '<div class="si"><div class="sn g">'+correct+'</div><div class="sll">Correct</div></div>'+
          '<div class="si"><div class="sn rr">'+(total-correct)+'</div><div class="sll">Incorrect</div></div>'+
          '<div class="si"><div class="sn">'+total+'</div><div class="sll">Total</div></div>'+
        '</div>'+
        '<button class="rb" onclick="mcCur=0;mcScores=[];renderMC()">Try again</button>'+
      '</div>';
    return;
  }
  var q=MCQS[mcCur];
  var optHtml='';
  for(var i=0;i<q.options.length;i++){
    if(q.options[i]) optHtml+='<button class="mc-opt" onclick="selectMCOpt(this,'+i+')">'+q.options[i]+'</button>';
  }
  area.innerHTML=renderModeTabs()+
    '<div class="mc-card">'+
      '<div class="mc-qnum">Question '+(mcCur+1)+' of '+MCQS.length+'</div>'+
      '<div class="mc-question">'+q.question+'</div>'+
      '<button class="mc-listen-btn" id="mcListenBtn" onclick="mcSpeak(this)">&#128266;</button>'+
      '<div class="mc-options" id="mcOpts">'+optHtml+'</div>'+
      '<div class="ms">'+
        '<button class="mb" id="mcMicBtn" onclick="mcToggleRec()">&#127908;</button>'+
        '<div class="ml" id="mcMicLbl">Tap to speak your answer</div>'+
        '<div class="trow">'+
          '<div class="tb" id="mcTbox"><span class="ph">Your answer will appear here...</span></div>'+
          '<button class="playbtn" id="mcPlayBtn" onclick="togglePlayRec(this)">&#9654;</button>'+
        '</div>'+
      '</div>'+
      '<div id="mcResult"></div>'+
      '<div class="mc-analyzing" id="mcAnalyzing">&#9203; Analyzing your answer...</div>'+
      '<button class="mc-check-btn" id="mcCheckBtn" onclick="mcCheckManual()">Check my answer</button>'+
      '<div style="display:flex;gap:8px;margin-top:1rem;">'+
        '<button class="mc-next-btn" id="mcNextBtn" onclick="mcNext()" style="margin-top:0;flex:1">Next question &#8594;</button>'+
        '<button class="mc-skip-btn" onclick="mcNext()">Skip &#8594;</button>'+
      '</div>'+
    '</div>';
  if(mcAudio){mcAudio.pause();mcAudio=null;}
}

function mcSpeak(btn){
  if(mcAudio&&!mcAudio.paused){mcAudio.pause();mcAudio=null;btn.innerHTML='&#128266;';return;}
  // Use cached audio if available
  if(_mcAudioCache[mcCur]){
    var url=_mcAudioCache[mcCur];
    mcAudio=new Audio(url);
    btn.innerHTML='<span class="stop-sq"></span>';btn.style.opacity='1';
    mcAudio.play();
    mcAudio.onended=function(){mcAudio=null;btn.innerHTML='&#128266;';};
    return;
  }
  // Fallback: fetch if not cached yet
  var q=MCQS[mcCur];
  btn.innerHTML='&#9203;&#65039;';btn.style.opacity='0.6';
  fetch(W+'/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:q.question})})
    .then(function(r){return r.blob();})
    .then(function(b){
      var url=URL.createObjectURL(b);
      _mcAudioCache[mcCur]=url;
      mcAudio=new Audio(url);
      btn.innerHTML='<span class="stop-sq"></span>';btn.style.opacity='1';
      mcAudio.play();
      mcAudio.onended=function(){mcAudio=null;btn.innerHTML='&#128266;';URL.revokeObjectURL(url);};
    }).catch(function(){btn.innerHTML='&#128266;';btn.style.opacity='1';});
}

var mcRec=false,mcMr=null,mcChunks=[];
function mcToggleRec(qIdx){mcRec?mcStopRec(qIdx):mcStartRec(qIdx);}
function mcStartRec(qIdx){
  navigator.mediaDevices.getUserMedia({audio:true}).then(function(stream){
    mcChunks=[];var mt2=mime();
    mcMr=new MediaRecorder(stream,mt2?{mimeType:mt2}:{});
    mcMr.ondataavailable=function(e){if(e.data&&e.data.size>0)mcChunks.push(e.data);};
    mcMr.start(250);mcRec=true;
    var b=document.getElementById('exMicBtn');
    if(b){b.style.background='#c0392b';b.style.boxShadow='0 0 0 8px rgba(192,57,43,.15)';}
    var micIconStart=document.getElementById('exMicIcon');
    if(micIconStart){micIconStart.setAttribute('fill','#fff');micIconStart.innerHTML='<rect x="6" y="6" width="12" height="12" rx="2"/>';}
    var l=document.getElementById('exMicLbl');if(l)l.textContent='Gravando... toque para parar';
    var t=document.getElementById('exTranscript');if(t)t.textContent='';
    window._exTranscript='';
    var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
    if(SR){try{
      window._exSR=new SR();window._exSR.continuous=true;window._exSR.interimResults=true;window._exSR.lang='en-US';
      window._exSR.onresult=function(e){
        var interim='',final='';
        for(var i=e.resultIndex;i<e.results.length;i++){
          if(e.results[i].isFinal)final+=e.results[i][0].transcript;
          else interim+=e.results[i][0].transcript;
        }
        window._exTranscript=(window._exTranscript||'')+final;
        var tb=document.getElementById('exTranscript');
        if(tb)tb.textContent=(window._exTranscript||'')+(interim?' '+interim:'');
      };
      window._exSR.onerror=function(){};
      window._exSR.onend=function(){if(mcRec&&window._exSR){try{window._exSR.start();}catch(e){}}};
      window._exSR.start();
    }catch(e){}}
  }).catch(function(e){var l=document.getElementById('exMicLbl');if(l)l.textContent='Mic error: '+e.message;});
}
function mcStopRec(qIdx){
  if(!mcMr)return;mcRec=false;
  if(window._exSR){try{window._exSR.onend=null;window._exSR.stop();}catch(e){}}
  mcMr.stop();
  if(mcMr.stream)mcMr.stream.getTracks().forEach(function(t){t.stop();});
  var b=document.getElementById('exMicBtn');
  if(b){b.style.background='rgba(0,0,0,.08)';b.style.boxShadow='none';}
  var micIconStop=document.getElementById('exMicIcon');
  if(micIconStop){micIconStop.setAttribute('fill','rgba(0,0,0,.45)');micIconStop.innerHTML='<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.42 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.3 6-6.72h-1.7z"/>';}
  var l=document.getElementById('exMicLbl');if(l)l.textContent='Verificando...';
  mcMr.onstop=function(){
    var transcript=(window._exTranscript||'').trim();
    setTimeout(function(){exCheckVoice(qIdx,transcript);},300);
  };
}
function exCheckVoice(qIdx,transcript){
  var qs=window._exGrammarQs||[];var q=qs[qIdx];if(!q)return;
  var said=(transcript||'').toLowerCase().trim();
  if(!said){
    var l=document.getElementById('exMicLbl');
    if(l)l.textContent='Não entendi — tente novamente';return;
  }
  var matchedIdx=-1,bestScore=0;
  var letters=['a','b','c','d'];
  // 1. Check if student said a letter (A, B, C, D)
  for(var i=0;i<q.options.length;i++){
    if(said===letters[i]||said.indexOf(letters[i]+' ')===0||said.endsWith(' '+letters[i])){
      matchedIdx=i;bestScore=1;break;
    }
  }
  // 2. Check full option text match
  if(matchedIdx===-1){
    for(var i=0;i<q.options.length;i++){
      if(!q.options[i])continue;
      var opt=q.options[i].toLowerCase().trim();
      if(said===opt||said.indexOf(opt)>=0){matchedIdx=i;bestScore=1;break;}
    }
  }
  // 3. Word overlap match
  if(matchedIdx===-1){
    for(var i=0;i<q.options.length;i++){
      if(!q.options[i])continue;
      var opt=q.options[i].toLowerCase();
      var words=opt.split(' ').filter(function(w){return w.length>1;});
      var hits=0;for(var w=0;w<words.length;w++){if(said.indexOf(words[w])>=0)hits++;}
      var score=words.length>0?hits/words.length:0;
      if(score>bestScore){bestScore=score;matchedIdx=i;}
    }
    if(bestScore<0.25)matchedIdx=-1;
  }
  var l=document.getElementById('exMicLbl');
  if(l)l.textContent='Resposta: "'+transcript+'"';
  if(typeof window._exSetScore==='function')window._exSetScore(qIdx,matchedIdx>=0?matchedIdx:0);
}
function mcCheckManual(){
  var transcript=window._transcript||'';
  var cb=document.getElementById('mcCheckBtn');
  var an=document.getElementById('mcAnalyzing');
  if(cb)cb.style.display='none';
  if(an)an.style.display='block';
  // Small delay to show analyzing state
  setTimeout(function(){
    if(an)an.style.display='none';
    checkMCAnswer(transcript);
  },300);
}

function checkMCAnswer(transcript){
  var q=MCQS[mcCur];
  var correctOpt=q.options[q.correct]||'';
  var said=transcript.toLowerCase().trim();
  // Check if any option was said
  var matchedIdx=-1;
  var bestScore=0;
  for(var i=0;i<q.options.length;i++){
    if(!q.options[i])continue;
    var opt=q.options[i].toLowerCase();
    // Check overlap — count matching words
    var optWords=opt.split(' ');
    var matches=0;
    for(var w=0;w<optWords.length;w++){if(said.indexOf(optWords[w])>=0)matches++;}
    var score=matches/optWords.length;
    if(score>bestScore){bestScore=score;matchedIdx=i;}
  }
  // Also check if transcript directly contains key words from correct option
  var correctOpt2=(q.options[q.correct]||'').toLowerCase();
  var correctWords=correctOpt2.split(' ').filter(function(w){return w.length>2;});
  var directMatches=0;
  for(var cw=0;cw<correctWords.length;cw++){if(said.indexOf(correctWords[cw])>=0)directMatches++;}
  var directScore=correctWords.length>0?directMatches/correctWords.length:0;
  var isCorrect=(matchedIdx===q.correct&&bestScore>0.3)||(directScore>=0.5);
  // Highlight options
  var opts=document.querySelectorAll('.mc-opt');
  for(var i=0;i<opts.length;i++){
    if(i===q.correct)opts[i].classList.add('correct');
    else if(i===matchedIdx&&!isCorrect)opts[i].classList.add('wrong');
  }
  var result=document.getElementById('mcResult');
  var nextBtn=document.getElementById('mcNextBtn');
  if(!transcript){
    result.className='mc-result wrong-r';
    result.innerHTML='We could not detect your answer. Please try recording again — speak clearly and close to the mic.';
    var cb2=document.getElementById('mcCheckBtn');if(cb2)cb2.style.display='none';
    return;
  }
  if(isCorrect){
    mcScores.push(1);
    result.className='';
    result.style='';
    result.innerHTML=
      '<div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,.08);">'+
        '<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="10" stroke="#6fcf6f" stroke-width="1.5"/><path d="M7 11l3 3 5-5" stroke="#6fcf6f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'+
        '<span style="font-size:18px;font-weight:700;color:#6fcf6f;font-family:Syne,sans-serif;">Correct!</span>'+
      '</div>'+
      '<div style="padding:14px 0 20px;border-top:1px solid rgba(255,255,255,.06);">'+
        '<span style="font-size:16px;font-weight:600;color:#f5c842;font-family:Syne,sans-serif;animation:fade 2s ease-in-out infinite;display:inline-block;">Analyzing pronunciation...</span>'+
      '</div>';
    if(nextBtn)nextBtn.style.display='block';
    // Analyze pronunciation of the target phrase
    if(window._ab&&q.target){
      mcAnalyzePronunciation(q.target);
    }
  } else {
    mcScores.push(0);
    result.className='';result.style='';
    var correctText=q.options[q.correct];
    var saidText=transcript||'...';
    result.innerHTML=
      '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:4px;">'+
        '<div style="background:rgba(192,57,43,.15);border-radius:10px;padding:12px;">'+
          '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#ef5350;margin-bottom:6px;">You said</div>'+
          '<div style="font-size:14px;font-weight:700;color:rgba(255,255,255,.5);">'+saidText+'</div>'+
        '</div>'+
        '<div style="background:rgba(45,122,58,.2);border-radius:10px;padding:12px;">'+
          '<div style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#6fcf6f;margin-bottom:6px;">Correct</div>'+
          '<div style="font-size:14px;font-weight:700;color:#6fcf6f;">'+correctText+'</div>'+
        '</div>'+
      '</div>'+
      '<div style="margin-top:10px;font-size:12px;color:rgba(255,255,255,.35);text-align:center;">Try saying it again</div>';
    if(nextBtn)nextBtn.style.display='block';
  }
  var l=document.getElementById('mcMicLbl');if(l)l.textContent='Tap to try again';
}

function mcAnalyzePronunciation(target){
  if(!window._ab)return;
  var result=document.getElementById('mcResult');
  // analyzing state shown in correct result HTML
  fetch(W+'/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({audio:window._ab,target:target,mimeType:window._am||'audio/webm'})})
    .then(function(r){return r.json();})
    .then(function(d){
      if(!result)return;
      var ws=d.wordScores||[];
      if(!ws.length)return;
      var pills='';
      for(var i=0;i<ws.length;i++){
        var ww=ws[i];
        var wordHtml=ww.word;
        if(ww.allSyllables&&ww.allSyllables.length>0){
          var hasBad=false;
          for(var sx=0;sx<ww.allSyllables.length;sx++){if(ww.allSyllables[sx].bad)hasBad=true;}
          if(hasBad){
            wordHtml='';
            for(var si=0;si<ww.allSyllables.length;si++){
              var s2=ww.allSyllables[si];
              wordHtml+='<span class="'+(s2.bad?'syl-bad':'syl-ok')+'">'+s2.letters+'</span>';
            }
          }
        }
        // Dark-card pill colors
        var darkStyle=ww.score>=85
          ?'background:rgba(45,122,58,.3);color:#6fcf6f'
          :ww.score>=75
          ?'background:rgba(245,200,66,.2);color:#f5c842'
          :'background:rgba(192,57,43,.3);color:#ef5350';
        pills+='<div class="pill" style="'+darkStyle+'"><span class="pt2">'+wordHtml+'</span><span class="ps">'+ww.score+'%</span></div>';
      }
      // Replace analyzing text with pills
      var existing=
        '<div style="display:flex;align-items:center;gap:8px;margin-bottom:20px;margin-top:24px;padding-top:20px;border-top:1px solid rgba(255,255,255,.08);">'+
          '<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="10" stroke="#6fcf6f" stroke-width="1.5"/><path d="M7 11l3 3 5-5" stroke="#6fcf6f" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>'+
          '<span style="font-size:18px;font-weight:700;color:#6fcf6f;font-family:Syne,sans-serif;">Correct!</span>'+
        '</div>';
      var avg=ws.reduce(function(a,w){return a+w.score;},0)/ws.length;
      var avgR=Math.round(avg);
      var circCol=avgR>=85?'rgba(45,122,58,.3)':avgR>=75?'rgba(245,200,66,.2)':'rgba(192,57,43,.3)';
      var circTxt=avgR>=85?'#6fcf6f':avgR>=75?'#f5c842':'#ef5350';
      result.innerHTML=existing+
        '<div style="margin-top:12px;background:rgba(255,255,255,.08);border-radius:12px;padding:14px;">'+
          '<div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">'+
            '<div style="width:44px;height:44px;border-radius:50%;background:'+circCol+';display:flex;align-items:center;justify-content:center;font-weight:700;font-size:13px;color:'+circTxt+';flex-shrink:0;">'+avgR+'%</div>'+
            '<div style="font-size:13px;color:rgba(255,255,255,.5);">Pronunciation of target phrase</div>'+
          '</div>'+
          '<div class="wp">'+pills+'</div>'+
        '</div>';
    }).catch(function(){});
}

function mcNext(){
  mcCur++;
  window._ab=null;window._transcript='';
  if(window._recUrl){URL.revokeObjectURL(window._recUrl);window._recUrl=null;}
  renderMC();
}


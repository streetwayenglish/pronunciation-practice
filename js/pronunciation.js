// ============================================================================
// PRONUNCIATION — sentence drill: render, speak, record, analyze
// ============================================================================
var scores=JSON.parse(localStorage.getItem('ps')||'{}');
var cur=0,mr=null,chunks=[],rec=false,laudio=null,mt='';

// Audio cache for pronunciation tab — preloaded when tab opens
var _sentAudioCache={};
var _sentAudioLoading={};

function preloadSentenceAudio(){ /* disabled */ }

// Audio cache for speaking tab — preloaded when tab opens
var _mcAudioCache={};
var _mcAudioLoading={};

function preloadMCAudio(){ /* disabled */ }

function mime(){
  var t=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg'];
  for(var i=0;i<t.length;i++) if(typeof MediaRecorder!=='undefined'&&MediaRecorder.isTypeSupported(t[i])) return t[i];
  return '';
}
function sbg(s){return s>=85?'cg':s>=75?'co':'cr';}
function spc(s){return s>=85?'pg':s>=75?'po':'prr';}

function prog(){
  var n=Object.keys(done).length;
  document.getElementById('pf').style.width=Math.round(n/SENTS.length*100)+'%';
  document.getElementById('pl').textContent=(cur+1)+' / '+SENTS.length;
}

function renderModeTabs(){
  if(appMode==='emma'){
    return '';
  }
  return '';
}
function switchMode(m){
  Log.d('[ui] app mode -> '+m);
  appMode=m;
  document.body.classList.toggle('tab-conversation', m==='emma');
  if(m==='sentences'){preloadSentenceAudio();render();}
  else if(m==='mc'){preloadMCAudio();renderMC();}
  else renderEmma();
}
function render(){
  prog();
  if(cur>=SENTS.length){showEnd();return;}
  var s=SENTS[cur];
  var prevDis=cur===0?' disabled':'';
  var nextDis=cur===SENTS.length-1?' disabled':'';
  document.getElementById('area').innerHTML=
    renderModeTabs()+
    '<div class="card">'+
      '<div class="cl">Sentence '+(cur+1)+' of '+SENTS.length+'</div>'+
      '<div class="sr"><div class="snt">'+s+'</div>'+
      '<button class="lbtn" id="lbtn" onclick="doSpeak()">&#128266;</button></div>'+
      '<div class="nr">'+
        '<button class="nb" id="pbtn"'+prevDis+'>&#8592; Prev</button>'+
        '<button class="nb" id="nbtn"'+nextDis+'>Next &#8594;</button>'+
      '</div>'+
      '<div class="ms">'+
        '<button class="mb" id="mbtn" onclick="toggleRec()">&#127908;</button>'+
        '<div class="ml" id="mlbl">Tap to start recording</div>'+
        '<div class="trow">'+
          '<div class="tb" id="tbox"><span class="ph">Your spoken words will appear here...</span></div>'+
          '<button class="playbtn" id="playBtn" onclick="togglePlayRec(this)">&#9654;</button>'+
        '</div>'+
      '</div>'+
      '<button class="ab" id="abtn" onclick="doAnalyze()" disabled>Analyze my pronunciation</button>'+
    '</div>'+
    '<div id="fbarea"></div>';
  if(!document.getElementById('pbtn').disabled)
    document.getElementById('pbtn').onclick=function(){goTo(cur-1);};
  if(!document.getElementById('nbtn').disabled)
    document.getElementById('nbtn').onclick=function(){goTo(cur+1);};
}

function doSpeak(){
  var btn=document.getElementById('lbtn');
  if(!btn)return;
  if(laudio){laudio.pause();laudio=null;btn.innerHTML='&#128266;';btn.classList.remove('sp');btn.style.opacity='1';return;}
  // Use cached audio if available
  if(_sentAudioCache[cur]){
    var url=_sentAudioCache[cur];
    laudio=new Audio(url);
    btn.innerHTML='<span class="stop-sq"></span>';btn.style.opacity='1';btn.classList.add('sp');
    laudio.play();
    laudio.onended=function(){laudio=null;var b2=document.getElementById('lbtn');if(b2){b2.innerHTML='&#128266;';b2.classList.remove('sp');}};
    return;
  }
  // Fallback: fetch if not cached yet
  btn.innerHTML='&#9203;&#65039;';btn.style.opacity='0.6';
  fetch(W+'/speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:SENTS[cur]})})
    .then(function(r){if(!r.ok)throw new Error(r.status);return r.blob();})
    .then(function(b){
      var url=URL.createObjectURL(b);
      _sentAudioCache[cur]=url;
      laudio=new Audio(url);
      btn.innerHTML='<span class="stop-sq"></span>';btn.style.opacity='1';btn.classList.add('sp');
      laudio.play();
      laudio.onended=function(){laudio=null;var b2=document.getElementById('lbtn');if(b2){b2.innerHTML='&#128266;';b2.classList.remove('sp');}URL.revokeObjectURL(url);};
    })
    .catch(function(){
      btn.innerHTML='&#128266;';btn.style.opacity='1';btn.classList.remove('sp');
    });
}

function goTo(i){
  if(i<0||i>=SENTS.length)return;
  if(laudio){laudio.pause();laudio=null;}
  if(window._recAudio){window._recAudio.pause();window._recAudio=null;}
  if(window._coachAudio){window._coachAudio.pause();window._coachAudio=null;}
  if(window._coachAudioUrl){URL.revokeObjectURL(window._coachAudioUrl);window._coachAudioUrl=null;}
  window._coachText=null;
  if(window._recUrl){URL.revokeObjectURL(window._recUrl);window._recUrl=null;}
  window._ab=null;cur=i;render();
}

function toggleRec(){Log.d('[tap] mbtn (currently '+(rec?'recording -> stop':'idle -> start')+')');rec?doStop():doStart();}

function doStart(){
  navigator.mediaDevices.getUserMedia({audio:true})
    .then(function(stream){
      chunks=[];mt=mime();
      Log.d('[pron:mic] getUserMedia OK, recorder mimeType='+(mt||'(default)'));
      mr=new MediaRecorder(stream,mt?{mimeType:mt}:{});
      mr.ondataavailable=function(e){if(e.data&&e.data.size>0)chunks.push(e.data);};
      mr.start(250);rec=true;
      var b=document.getElementById('mbtn'),l=document.getElementById('mlbl');
      if(b){b.classList.add('rec');b.innerHTML='<span class="stop-sq"></span>';}
      if(l)l.textContent='Recording... tap to stop';
      var t=document.getElementById('tbox');
      if(t)t.innerHTML='<span class="ph">Listening...</span>';
      window._transcript='';
      var SR=window.SpeechRecognition||window.webkitSpeechRecognition;
      if(SR){try{
        window._sr=new SR();
        window._sr.continuous=true;window._sr.interimResults=true;window._sr.lang='en-US';
        window._sr.onresult=function(e){
          var interim='',final='';
          for(var i=e.resultIndex;i<e.results.length;i++){
            if(e.results[i].isFinal)final+=e.results[i][0].transcript;
            else interim+=e.results[i][0].transcript;
          }
          window._transcript=(window._transcript||'')+final;
          var tb=document.getElementById('tbox');
          if(tb)tb.innerHTML=(window._transcript||'')+(interim?'<em style="color:rgba(255,255,255,0.4)"> '+interim+'</em>':'');
        };
        window._sr.onerror=function(){};
        window._sr.onend=function(){if(rec&&window._sr){try{window._sr.start();}catch(e){}}};
        window._sr.start();
      }catch(e){}}
    })
    .catch(function(e){
      Log.e('[pron:mic] getUserMedia FAILED name='+e.name+' message='+e.message);
      var l=document.getElementById('mlbl');
      if(e.name==='NotAllowedError'||e.name==='PermissionDeniedError'){
        var b=document.getElementById('micBanner');
        if(b)b.classList.add('show');
        if(l)l.textContent='Microphone blocked — see instructions above.';
      } else if(e.name==='NotFoundError'){
        if(l)l.textContent='No microphone found. Please connect a microphone.';
      } else {
        if(l)l.textContent='Mic error: '+e.message;
      }
    });
}

function doStop(){
  if(!mr)return;rec=false;
  if(window._sr){try{window._sr.onend=null;window._sr.stop();}catch(e){}}
  mr.stop();mr.stream.getTracks().forEach(function(t){t.stop();});
  var b=document.getElementById('mbtn'),l=document.getElementById('mlbl');
  if(b){b.classList.remove('rec');b.innerHTML='&#127908;';}
  if(l)l.textContent='Processing...';
  mr.onstop=function(){
    var m2=mr.mimeType||mt||'audio/webm';
    var blob=new Blob(chunks,{type:m2});
    if(window._recUrl)URL.revokeObjectURL(window._recUrl);
    window._recUrl=URL.createObjectURL(blob);
    var pb=document.getElementById('playBtn');if(pb)pb.classList.add('show');
    var rd=new FileReader();
    rd.onloadend=function(){
      window._ab=rd.result.split(',')[1];window._am=m2;
      var l2=document.getElementById('mlbl');if(l2)l2.textContent='Ready - click Analyze';
      var ab=document.getElementById('abtn');if(ab)ab.disabled=false;
      var tb=document.getElementById('tbox');
      var transcript=window._transcript||'';
      if(tb){
        if(transcript)tb.innerHTML='<span style="color:rgba(255,255,255,0.9);">'+transcript+'</span>';
        else tb.innerHTML='<span style="color:rgba(255,255,255,0.7);font-style:italic;">Audio recorded &#10003;</span>';
      }
    };
    rd.readAsDataURL(blob);
  };
}

function togglePlayRec(btn){
  if(window._recAudio&&!window._recAudio.paused){
    window._recAudio.pause();window._recAudio.currentTime=0;
    btn.innerHTML='&#9654;';btn.classList.remove('playing');return;
  }
  if(window._recUrl){
    window._recAudio=new Audio(window._recUrl);
    btn.innerHTML='<span class="stop-sq"></span>';btn.classList.add('playing');
    window._recAudio.play();
    window._recAudio.onended=function(){btn.innerHTML='&#9654;';btn.classList.remove('playing');};
  }
}

function doAnalyze(){
  Log.d('[tap] abtn (Analyze my pronunciation)');
  if(!window._ab)return;
  var target=SENTS[cur];
  var fb=document.getElementById('fbarea');
  fb.innerHTML='<div class="fbc"><div class="fbt">Analyzing <div class="dots"><span></span><span></span><span></span></div></div></div>';
  done[cur]=true;localStorage.setItem('pd',JSON.stringify(done));prog();
  Log.d('[pron:analyze] REQUEST target="'+target+'" mimeType='+(window._am||'audio/webm')+' b64Len='+((window._ab||'').length));
  fetch(W+'/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({audio:window._ab,target:target,mimeType:window._am||'audio/webm'})})
    .then(function(r){Log.d('[pron:analyze] HTTP status='+r.status); return r.json();})
    .then(function(d){
      Log.d('[pron:analyze] RESPONSE '+JSON.stringify(d));
      var ov=d.overallScore||0;
      var ws=d.wordScores||[];
      // Dedupe: SpeechAce sometimes returns the same word twice (word entry + syllable-stress entry).
      // Key on word + start time (rounded) so genuine repeats stay, but duplicates at the same position collapse.
      // If two entries share a key, keep the richer one (more phonemeIssues, then higher score).
      var _seen={},_wsd=[];
      for(var _di=0;_di<ws.length;_di++){
        var _w=ws[_di];
        var _k=((_w.word||'')+'').toLowerCase()+'@'+Math.round((+_w.start||0)*100);
        if(_seen[_k]!==undefined){
          var _pi=_seen[_k],_prev=_wsd[_pi];
          var _newRich=((_w.phonemeIssues||[]).length)+((_w.allSyllables||[]).length);
          var _oldRich=((_prev.phonemeIssues||[]).length)+((_prev.allSyllables||[]).length);
          if(_newRich>_oldRich||(_newRich===_oldRich&&(_w.score||0)>(_prev.score||0))) _wsd[_pi]=_w;
          continue;
        }
        _seen[_k]=_wsd.length;_wsd.push(_w);
      }
      ws=_wsd;
      var rawText=d.feedback||d.error||'Erro';
      window._coachText=rawText;
      scores[cur]=ov;localStorage.setItem('ps',JSON.stringify(scores));

      // Word pills with syllable highlights
      var pills='';
      for(var wi=0;wi<ws.length;wi++){
        var ww=ws[wi];
        var tip=ww.phonemeIssues&&ww.phonemeIssues.length?' title="'+ww.phonemeIssues.join(' | ')+'"':'';
        // Build inline word HTML with bad syllables underlined
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
        var wdata=encodeURIComponent(JSON.stringify({word:ww.word,score:ww.score,phonemes:ww.phonemeIssues||[],allPhones:ww.allPhones||[],start:ww.start||0,end:ww.end||0}));
        pills+='<div class="pill '+spc(ww.score)+'" onclick="openWordPopup(this)" data-w="'+wdata+'" style="cursor:pointer"><span class="pt2">'+wordHtml+'</span><span class="ps">'+ww.score+'%</span></div>';
      }

      // Profile metrics
      var totalWords=ws.length||1;
      var phonemeIssueCount=0,stressIssueCount=0;
      for(var ri=0;ri<ws.length;ri++){
        if(ws[ri].phonemeIssues)phonemeIssueCount+=ws[ri].phonemeIssues.length;
        if(ws[ri].syllableIssues)stressIssueCount+=ws[ri].syllableIssues.length;
      }
      var phonemeScore=Math.max(0,Math.round(100-(phonemeIssueCount/totalWords)*30));
      var stressScore=Math.max(0,Math.round(100-(stressIssueCount/totalWords)*30));
      var intonationScore=Math.round((phonemeScore+stressScore)/2);

      // Coach blocks — split by double newline first, then single newline
      var paragraphs=rawText.split('\n\n').filter(function(p){return p.trim();});
      if(paragraphs.length<2) paragraphs=rawText.split('\n').filter(function(p){return p.trim();});
      if(!paragraphs.length) paragraphs=[rawText];
      var coachHtml='';
      for(var bi=0;bi<paragraphs.length;bi++){
        var icon=bi===0?'💬':bi===paragraphs.length-1?'⭐':'🎯';
        if(bi>0) coachHtml+='<div class="cdiv"></div>';
        var btext=paragraphs[bi].trim();
        // Highlight problem words
        for(var wi2=0;wi2<ws.length;wi2++){
          if(ws[wi2].score<85){
            var wrd=ws[wi2].word.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
            btext=btext.replace(new RegExp('\\b'+wrd+'\\b','gi'),'<span class="hw">$&</span>');
          }
        }
        coachHtml+='<div class="cblock"><span class="cicon">'+icon+'</span><span class="ctext">'+btext+'</span></div>';
      }

      Log.d('[ui] feedback rendered: score='+ov+'% phonemeScore='+phonemeScore+' stressScore='+stressScore);
      fb.innerHTML=
        '<div class="fbc">'+
          '<div class="scr">'+
            '<div class="circ '+sbg(ov)+'">'+ov+'%</div>'+
            '<div class="sl"><strong>'+(ov>=85?'Excellent!':ov>=75?'Good effort!':'Keep practicing!')+'</strong><br>Overall pronunciation score</div>'+
          '</div>'+
          (pills?'<div class="hr"></div><div class="fbt">Word Scores</div><div class="wp">'+pills+'</div>':'')+
          '<div class="hr"></div><div class="fbt">Pronunciation Profile</div>'+
          '<div class="profile">'+
            '<div class="pmet"><div class="pmet-icon">🎯</div><div class="pmet-label">Pronúncia</div><div class="pmet-score">'+ov+'<span style="font-size:13px;opacity:.5">%</span></div><div class="pmet-bar"><div class="pmet-fill pmet-fill-'+(ov>=85?'g':ov>=75?'o':'r')+'" data-w="'+ov+'" style="width:0%"></div></div></div>'+
            '<div class="pmet"><div class="pmet-icon">🔤</div><div class="pmet-label">Fonemas</div><div class="pmet-score">'+phonemeScore+'<span style="font-size:13px;opacity:.5">%</span></div><div class="pmet-bar"><div class="pmet-fill pmet-fill-'+(phonemeScore>=85?'g':phonemeScore>=75?'o':'r')+'" data-w="'+phonemeScore+'" style="width:0%"></div></div></div>'+
            '<div class="pmet"><div class="pmet-icon">🎵</div><div class="pmet-label">Stress</div><div class="pmet-score">'+stressScore+'<span style="font-size:13px;opacity:.5">%</span></div><div class="pmet-bar"><div class="pmet-fill pmet-fill-'+(stressScore>=85?'g':stressScore>=75?'o':'r')+'" data-w="'+stressScore+'" style="width:0%"></div></div></div>'+
            '<div class="pmet"><div class="pmet-icon">〰️</div><div class="pmet-label">Entonação</div><div class="pmet-score">'+intonationScore+'<span style="font-size:13px;opacity:.5">%</span></div><div class="pmet-bar"><div class="pmet-fill pmet-fill-'+(intonationScore>=85?'g':intonationScore>=75?'o':'r')+'" data-w="'+intonationScore+'" style="width:0%"></div></div></div>'+
          '</div>'+
          '<div class="hr"></div>'+
          '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">'+
            '<div class="fbt" style="margin-bottom:0">Coach of IA</div>'+
            '<button class="coach-audio-btn" id="coachAudioBtn" onclick="speakCoach(this)" title="Ouvir feedback">&#128266;</button>'+
          '</div>'+
          '<div class="coach-wrap">'+coachHtml+'</div>'+
        '</div>';

      setTimeout(function(){
        document.querySelectorAll('[data-w]').forEach(function(el){el.style.width=el.getAttribute('data-w')+'%';});
      },80);
    })
    .catch(function(e){
      Log.e('[pron:analyze] ERROR '+(e&&e.message));
      fb.innerHTML='<div class="fbc"><div class="ctext" style="color:var(--red)">Error: '+e.message+'</div></div>';
    });
}


// ============================================================================
// END SCREEN — session end UI, coach playback, word popup
// ============================================================================
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
  // Show warm completion message first
  var unit = getCurrentUnit(emmaTopic);
  var unitInfo = unit ? ' — '+unit.title : '';
  area.innerHTML=renderModeTabs()+
    '<div style="background:#fff;border-radius:20px;overflow:hidden;border:1px solid #ede9e2;box-shadow:0 2px 20px rgba(0,0,0,.06);">'+
      '<div style="background:#0a0a0a;padding:28px 28px 24px;display:flex;align-items:center;gap:16px;">'+
        '<div style="position:relative;width:64px;height:64px;flex-shrink:0;">'+
          '<svg width="64" height="64" viewBox="0 0 64 64">'+
            '<circle cx="32" cy="32" r="26" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="5"/>'+
            '<circle cx="32" cy="32" r="26" fill="none" stroke="#e8b84b" stroke-width="5" stroke-dasharray="163" stroke-dashoffset="40" stroke-linecap="round" transform="rotate(-90 32 32)" style="filter:blur(1.5px)"/>'+
          '</svg>'+
          '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:800;color:rgba(232,184,75,.35);filter:blur(4px);">B+</div>'+
        '</div>'+
        '<div>'+
          '<div style="font-size:15px;font-weight:700;color:#fff;margin-bottom:4px;">Calculando sua nota...</div>'+
          '<div style="font-size:12px;color:rgba(255,255,255,.3);">Session complete'+unitInfo+'</div>'+
        '</div>'+
      '</div>'+
      '<div style="padding:18px 28px;display:flex;align-items:center;gap:10px;">'+
        '<div style="width:18px;height:18px;border-radius:50%;border:2.5px solid #f0ede8;border-top-color:#e8b84b;animation:spin .8s linear infinite;flex-shrink:0;"></div>'+
        '<div style="font-size:12px;color:#bbb;">Analisando a conversa...</div>'+
      '</div>'+
    '</div>';
  if(history.length<3){
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
      .slice(0,10);
  }
  var pronInfo=pronWords.length>0?(' Pronunciation data: '+JSON.stringify(pronWords)):'';
  var reportPrompt='Analyze this English conversation between a Brazilian student and coach Emma. Conversation: '+convoText2+pronInfo+' '+
    'Respond ONLY with a single JSON object, no markdown, no backticks. Format: '+
    '{"headline":"título encorajador curto em português","score":"A/B/C/D","summary":"uma frase of avaliação em português",'+
    '"mistakes":[{"title":"nome do erro em português","detail":"exemplo específico da conversa + correção, manter frases em inglês como estão"}],'+
    '"improvements":[{"title":"focus area","detail":"specific actionable advice"}],'+
    '"positive":"what the student did well",'+
    '"exercises":[{"question":"complete the sentence / choose the correct form","options":["opt A","opt B","opt C","opt D"],"answer":0,"tip":"brief grammar explanation"}],'+
    '"pronSentences":["correct English sentence relevant to this conversation","...","...","..."]}'+
    ' Rules: max 3 mistakes, max 3 improvements. Generate 8 exercises based on grammar mistakes and vocabulary from this conversation — mix multiple choice, sentence completion and error correction. answer is 0-based index of correct option.'+
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
    var pronHtml='';
    if(pronWords&&pronWords.length>0){
      pronHtml=pronWords.map(function(w,i){
        var c=w.score<=60?'#c0392b':w.score<=75?'#e8b84b':'#2d7a3a';
        return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:9px;">'+
          '<span style="font-size:9px;font-weight:700;color:#ccc;width:12px;text-align:right;flex-shrink:0">'+(i+1)+'</span>'+
          '<span style="font-size:12px;font-weight:600;color:#111;width:90px;flex-shrink:0">'+w.word+'</span>'+
          '<div style="flex:1;height:6px;background:#f0ede8;border-radius:3px;overflow:hidden">'+
            '<div style="width:'+w.score+'%;height:100%;background:'+c+';border-radius:3px;"></div></div>'+
          '<span style="font-size:11px;font-weight:700;color:'+c+';width:30px;text-align:right;flex-shrink:0">'+w.score+'%</span></div>';
      }).join('');
    }
    var ringPct=r.score==='A+'?0.97:r.score==='A'?0.90:r.score==='B+'?0.77:r.score==='B'?0.66:0.50;
    var ringCirc=2*Math.PI*34;
    var ringOffset=ringCirc*(1-ringPct);
    var ringSvg='<div style="position:relative;width:80px;height:80px;flex-shrink:0">'+
      '<svg width="80" height="80" viewBox="0 0 80 80">'+
        '<circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="6"/>'+
        '<circle cx="40" cy="40" r="34" fill="none" stroke="#e8b84b" stroke-width="6" stroke-dasharray="'+ringCirc+'" stroke-dashoffset="'+ringOffset+'" stroke-linecap="round" transform="rotate(-90 40 40)"/>'+
      '</svg>'+
      '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:21px;font-weight:800;color:#e8b84b">'+r.score+'</div></div>';
    var mistakesHtml=r.mistakes.map(function(m,i){
      return '<div style="display:flex;gap:10px;padding-bottom:'+(i<r.mistakes.length-1?'13px':'0')+';margin-bottom:'+(i<r.mistakes.length-1?'13px':'0')+';border-bottom:'+(i<r.mistakes.length-1?'1px solid #faf8f4':'none')+'">'+
        '<div style="width:20px;height:20px;border-radius:50%;background:rgba(192,57,43,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;font-size:9px;font-weight:800;color:#c0392b">'+(i+1)+'</div>'+
        '<div><div style="font-size:13px;font-weight:600;color:#0a0a0a;margin-bottom:2px;">'+m.title+'</div>'+
        '<div style="font-size:12px;color:#888;line-height:1.5;">'+m.detail+'</div></div></div>';
    }).join('');
    var improvementsHtml=r.improvements.map(function(imp,i){
      return '<div style="display:flex;gap:10px;padding-bottom:'+(i<r.improvements.length-1?'13px':'0')+';margin-bottom:'+(i<r.improvements.length-1?'13px':'0')+';border-bottom:'+(i<r.improvements.length-1?'1px solid #faf8f4':'none')+'">'+
        '<div style="width:20px;height:20px;border-radius:50%;background:rgba(232,184,75,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;font-size:11px;color:#e8b84b;font-weight:700;">→</div>'+
        '<div><div style="font-size:13px;font-weight:600;color:#0a0a0a;margin-bottom:2px;">'+imp.title+'</div>'+
        '<div style="font-size:12px;color:#888;line-height:1.5;">'+imp.detail+'</div></div></div>';
    }).join('');
    area.innerHTML=renderModeTabs()+
      '<div style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 2px 24px rgba(0,0,0,.08);border:1px solid #ede9e2;margin-bottom:1rem;">'+
        '<div style="background:#0a0a0a;padding:28px 24px;display:flex;align-items:center;gap:18px;">'+ringSvg+
          '<div style="flex:1;"><div style="font-size:15px;font-weight:700;color:#fff;line-height:1.3;margin-bottom:5px;">'+r.headline+'</div>'+
          '<div style="font-size:12px;color:rgba(255,255,255,.38);line-height:1.45;">'+r.summary+'</div></div></div>'+
        '<div style="padding:18px 24px;border-bottom:1px solid #f0ede8;">'+
          '<div style="background:rgba(45,122,58,.06);border:1px solid rgba(45,122,58,.15);border-radius:10px;padding:12px 14px;display:flex;gap:10px;align-items:flex-start;">'+
            '<span style="font-size:14px;flex-shrink:0;margin-top:1px;">✦</span>'+
            '<div style="font-size:13px;color:#2d7a3a;line-height:1.55;">'+r.positive+'</div></div></div>'+
        '<div style="padding:18px 24px;border-bottom:1px solid #f0ede8;">'+
          '<div style="font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#c0392b;margin-bottom:14px;">Erros para corrigir</div>'+mistakesHtml+'</div>'+
        '<div style="padding:18px 24px;border-bottom:1px solid #f0ede8;">'+
          '<div style="font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#e8b84b;margin-bottom:14px;">Próximos passos</div>'+improvementsHtml+'</div>'+
        (pronHtml?'<div style="padding:18px 24px;border-bottom:1px solid #f0ede8;"><div style="font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#aaa;margin-bottom:14px;">🎙 Pronúncia — top 10 para treinar</div>'+pronHtml+'</div>':'')+
        '<div style="padding:16px 24px;display:flex;flex-direction:column;gap:8px;">'+
          '<button class="ab" onclick="renderEmma()" style="width:100%;padding:14px;border-radius:12px;background:#0a0a0a;border:none;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px;"><span>🔄</span> Nova conversa</button>'+
          '<div style="height:1px;background:#f0ede8;margin:2px 0;"></div>'+
          '<div style="display:flex;gap:8px;">'+
            '<button class="ab" onclick="downloadReport()" style="flex:1;padding:11px 6px;border-radius:11px;background:#f5f3ef;border:1px solid #e8e4de;color:#333;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:5px;"><span style="font-size:13px;">📄</span> Salvar PDF</button>'+
            '<button class="ab" onclick="downloadTranscript()" style="flex:1;padding:11px 6px;border-radius:11px;background:#f5f3ef;border:1px solid #e8e4de;color:#333;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:5px;"><span style="font-size:13px;">💬</span> Transcript</button>'+
            '<button class="ab" onclick="downloadExercises()" style="flex:1;padding:11px 6px;border-radius:11px;background:rgba(232,184,75,.08);border:1px solid rgba(232,184,75,.3);color:#7a5c00;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:5px;"><span style="font-size:13px;">✏️</span> Exercícios</button>'+
          '</div></div></div>';
    window._lastReport=r;
  })
  .catch(function(){
    area.innerHTML=renderModeTabs()+
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


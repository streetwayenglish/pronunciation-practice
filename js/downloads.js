// ============================================================================
// DOWNLOADS — print/download report, transcript, exercises
// ============================================================================
function downloadReport(){
  var r=window._lastReport;
  if(!r)return;
  var date=new Date().toLocaleDateString('pt-BR',{day:'2-digit',month:'short',year:'numeric'});
  var w=window.open('','_blank');
  if(!w)return;
  var d=w.document;
  d.open();
  d.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Relatorio</title></head><body></body></html>');
  d.close();

  // Reuse the live report styles (from end-screen.js) + a small print/PDF wrapper layer.
  var style=d.createElement('style');
  style.textContent=
    (typeof _endStyles!=='undefined'?_endStyles:'')+
    'body{margin:0;background:#f6f5f1;font-family:-apple-system,BlinkMacSystemFont,"DM Sans",sans-serif;color:#0a0a0a;}'+
    '.pdf-wrap{max-width:640px;margin:0 auto;padding:32px 24px 48px;}'+
    '.pdf-head{margin-bottom:20px;padding-bottom:14px;border-bottom:1px solid #e8e4de;}'+
    '.pdf-brand{font-size:10px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#aaa;margin-bottom:6px;}'+
    '.pdf-headline{font-family:"Fraunces",Georgia,serif;font-size:24px;font-weight:700;margin:0 0 4px;letter-spacing:-.015em;line-height:1.2;color:#0a0a0a;}'+
    '.pdf-date{font-size:12px;color:#aaa;letter-spacing:.01em;}'+
    '.pdf-footer{margin-top:24px;padding-top:14px;border-top:1px solid #e8e4de;font-size:10px;color:#aaa;text-align:center;letter-spacing:.06em;}'+
    '.print-btn{display:block;width:100%;padding:13px;background:#0a0a0a;color:#fff;border:none;border-radius:11px;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:24px;font-family:inherit;letter-spacing:-.005em;}'+
    '@media print{.no-print{display:none!important;}body{background:#fff!important;}.pdf-wrap{padding:0!important;max-width:none;}.end-card{box-shadow:none!important;break-inside:avoid;page-break-inside:avoid;}}';
  d.head.appendChild(style);

  // Helpers — mirror end-screen.js logic so PDF renders identically.
  function styleQuotes(t){
    if(typeof _endStyleQuotes==='function')return _endStyleQuotes(t);
    return t||'';
  }
  var s=(r.score||'B').toString().toUpperCase().trim();
  var visual={color:'yellow',filled:7};
  if(s==='A+')visual={color:'green',filled:10};
  else if(s==='A')visual={color:'green',filled:9};
  else if(s==='B+')visual={color:'yellow',filled:8};
  else if(s==='B')visual={color:'yellow',filled:7};
  else if(s==='C+')visual={color:'orange',filled:6};
  else if(s==='C')visual={color:'orange',filled:5};
  else if(s==='D')visual={color:'red',filled:3};

  var bars='';
  for(var i=0;i<10;i++){bars+='<span class="'+(i<visual.filled?'f end-color-'+visual.color:'')+'"></span>';}

  // Hero card (matches _endBuildReportHTML)
  var heroHTML='<div class="end-card">'+
    '<div class="end-hero-label">Sua nota</div>'+
    '<div class="end-hero-row">'+
      '<div class="end-hero-grade end-color-'+visual.color+'">'+(r.score||'B')+'</div>'+
      '<div class="end-bar">'+bars+'</div>'+
    '</div>'+
    '<div class="end-hero-sub">'+(r.summary||'')+'</div>'+
    (r.positive?'<div class="end-positive">'+
      '<svg class="end-positive-icon" viewBox="0 0 24 24"><path d="M12 1.5l2 8 8 2-8 2-2 8-2-8-8-2 8-2z" fill="currentColor"/></svg>'+
      '<span class="end-positive-text">'+styleQuotes(r.positive)+'</span>'+
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
            '<div class="end-row-detail">'+styleQuotes(m.detail||'')+'</div>'+
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
            '<div class="end-row-detail">'+styleQuotes(imp.detail||'')+'</div>'+
          '</div>'+
        '</div>';
      }).join('')+
    '</div>';
  }

  // Pronunciation pills — recompute from session data the same way emmaEnd does
  var pronWords=[];
  if(window._sessionPronunciationData&&window._sessionPronunciationData.length>0){
    var wordMap={};
    window._sessionPronunciationData.forEach(function(sess){
      (sess.scores&&sess.scores.words||[]).forEach(function(wd){
        if(!wd.word)return;
        var k=wd.word.toLowerCase();
        if(!wordMap[k])wordMap[k]={word:wd.word,total:0,count:0};
        wordMap[k].total+=wd.accuracyScore||0;
        wordMap[k].count++;
      });
    });
    pronWords=Object.values(wordMap)
      .map(function(wd){return {word:wd.word,score:Math.round(wd.total/wd.count)};})
      .filter(function(wd){return wd.score<90;})
      .sort(function(a,b){return a.score-b.score;})
      .slice(0,6);
  }
  var pronHTML='';
  if(pronWords.length>0){
    pronHTML='<div class="end-card"><div class="end-card-title">Pronúncia · treinar</div>'+
      '<div class="end-pills">'+
        pronWords.map(function(wd){
          var cls=wd.score<60?'r':wd.score<80?'y':'g';
          return '<span class="end-pill end-pill-'+cls+'">'+wd.word+
            ' <span class="end-pill-pct">'+wd.score+'%</span></span>';
        }).join('')+
      '</div>'+
    '</div>';
  }

  // Assemble
  var body=d.body;
  var btn=d.createElement('button');
  btn.className='print-btn no-print';
  btn.textContent='Salvar como PDF';
  btn.onclick=function(){w.print();};

  var wrap=d.createElement('div');
  wrap.className='pdf-wrap';
  wrap.innerHTML=
    '<div class="pdf-head">'+
      '<div class="pdf-brand">Street Way English</div>'+
      '<h1 class="pdf-headline">'+(r.headline||'Relatório de Conversa')+'</h1>'+
      '<div class="pdf-date">Relatório — '+date+'</div>'+
    '</div>'+
    heroHTML+mistakesHTML+nextHTML+pronHTML+
    '<div class="pdf-footer">Street Way English • Emma AI Coach</div>';

  body.appendChild(btn);
  body.appendChild(wrap);
}

function downloadTranscript(){
  var history=window._lastHistory;
  if(!history||!history.length)return;
  var date=new Date().toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  var topic=window._lastTopic||'Conversation';
  var w=window.open('','_blank');
  if(!w)return;
  var d=w.document;
  d.open();
  d.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Transcript</title></head><body></body></html>');
  d.close();

  var style=d.createElement('style');
  style.textContent=[
    '@media print{.no-print{display:none;}body{padding:24px;}}',
    'body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:580px;margin:40px auto;padding:0 24px;color:#1a1a1a;background:#fff;}',
    'h1{font-size:11px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:#aaa;margin-bottom:4px;}',
    'h2{font-size:20px;font-weight:700;margin-bottom:4px;}',
    '.meta{font-size:12px;color:#bbb;margin-bottom:28px;}',
    '.bubble-e{display:flex;align-items:flex-start;gap:10px;margin-bottom:14px;}',
    '.avatar{width:28px;height:28px;border-radius:50%;background:#1a1a1a;color:#f5c842;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;}',
    '.msg-e{background:#f4f4f2;border-radius:4px 14px 14px 14px;padding:10px 14px;font-size:13px;color:#1a1a1a;line-height:1.6;max-width:82%;}',
    '.bubble-s{display:flex;justify-content:flex-end;margin-bottom:14px;}',
    '.msg-s{background:#1a1a1a;border-radius:14px 4px 14px 14px;padding:10px 14px;font-size:13px;color:#fff;line-height:1.6;max-width:82%;}',
    '.footer{margin-top:32px;padding-top:14px;border-top:1px solid #e8e8e8;font-size:11px;color:#bbb;text-align:center;}',
    '.print-btn{display:block;width:100%;padding:12px;background:#1a1a1a;color:#fff;border:none;border-radius:8px;font-size:14px;cursor:pointer;margin-bottom:24px;font-family:sans-serif;}'
  ].join('');
  d.head.appendChild(style);

  var body=d.body;

  var btn=d.createElement('button');
  btn.className='print-btn no-print';
  btn.textContent='Salvar como PDF';
  btn.onclick=function(){w.print();};
  body.appendChild(btn);

  var h1=d.createElement('h1');h1.textContent='Street Way English';body.appendChild(h1);
  var h2=d.createElement('h2');h2.textContent='Conversation Transcript';body.appendChild(h2);
  var meta=d.createElement('div');meta.className='meta';meta.textContent='Topic: '+topic+' • '+date;body.appendChild(meta);

  history.forEach(function(m){
    if(m.content.indexOf('[Start')===0)return;
    if(m.role==='assistant'){
      var row=d.createElement('div');row.className='bubble-e';
      var av=d.createElement('div');av.className='avatar';av.textContent='E';row.appendChild(av);
      var msg=d.createElement('div');msg.className='msg-e';msg.textContent=m.content;row.appendChild(msg);
      body.appendChild(row);
    } else {
      var row=d.createElement('div');row.className='bubble-s';
      var msg=d.createElement('div');msg.className='msg-s';msg.textContent=m.content;row.appendChild(msg);
      body.appendChild(row);
    }
  });

  var ft=d.createElement('div');ft.className='footer';ft.textContent='Street Way English • Emma AI Coach';body.appendChild(ft);
}

function emmaTranslate(btn,text,bubble){
  if(btn._translated){
    var existing=bubble?bubble.querySelector('.emma-translation'):null;
    if(existing)existing.remove();
    btn.style.opacity='.38';btn.style.filter='none';
    btn._translated=false;return;
  }
  btn.style.opacity='.6';
  var loadingEl=document.createElement('div');
  loadingEl.style.cssText='font-size:12px;color:rgba(255,255,255,.3);font-style:italic;padding:6px 0 2px;clear:both;';
  loadingEl.textContent='Traduzindo...';
  btn.parentNode.insertBefore(loadingEl,btn);
  fetch(W+'/emma-chat',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      system:'Translate the following English text to Brazilian Portuguese. Reply with ONLY the translation, no explanation, no quotes.',
      messages:[{role:'user',content:text}],topic:'translation',max_tokens:300
    })
  })
  .then(function(r){return r.json();})
  .then(function(d){
    loadingEl.remove();
    var t=d.content&&d.content[0]?d.content[0].text.trim():'';
    if(!t)return;
    var el=document.createElement('div');
    el.className='emma-translation';
    el.style.cssText='font-size:13px;color:rgba(232,184,75,.82);line-height:1.5;padding-top:8px;border-top:1px solid rgba(255,255,255,.1);font-style:italic;margin-top:6px;clear:both;';
    el.textContent=t;
    btn.parentNode.insertBefore(el,btn);
    btn.style.opacity='1';btn.style.filter='sepia(1) saturate(4) hue-rotate(5deg)';
    btn._translated=true;
    var wrap=document.getElementById('emmaBubbles');
    if(wrap)wrap.scrollTop=wrap.scrollHeight;
  })
  .catch(function(){loadingEl.remove();btn.style.opacity='.38';});
}

function showReport(){
  var r=window._lastReport;
  if(!r)return;
  var area=document.getElementById('area');
  if(!area)return;
  var pronWords=window._pronWords||[];
  var pronHtml='';
  if(pronWords.length>0){
    pronHtml=pronWords.map(function(w,i){
      var c=w.score<=60?'#c0392b':w.score<=75?'#e8b84b':'#2d7a3a';
      return '<div style="display:flex;align-items:center;gap:10px;margin-bottom:9px;">'+
        '<span style="font-size:9px;font-weight:700;color:#ccc;width:12px;text-align:right;flex-shrink:0">'+(i+1)+'</span>'+
        '<span style="font-size:12px;font-weight:600;color:#111;width:90px;flex-shrink:0">'+w.word+'</span>'+
        '<div style="flex:1;height:6px;background:#f0ede8;border-radius:3px;overflow:hidden">'+
          '<div style="width:'+w.score+'%;height:100%;background:'+c+';border-radius:3px"></div></div>'+
        '<span style="font-size:11px;font-weight:700;color:'+c+';width:30px;text-align:right;flex-shrink:0">'+w.score+'%</span></div>';
    }).join('');
  }
  var ringPct=r.score==='A+'?0.97:r.score==='A'?0.90:r.score==='B+'?0.77:r.score==='B'?0.66:0.50;
  var ringCirc=2*Math.PI*34;var ringOffset=ringCirc*(1-ringPct);
  var ringSvg='<div style="position:relative;width:80px;height:80px;flex-shrink:0">'+
    '<svg width="80" height="80" viewBox="0 0 80 80">'+
      '<circle cx="40" cy="40" r="34" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="6"/>'+
      '<circle cx="40" cy="40" r="34" fill="none" stroke="#e8b84b" stroke-width="6" stroke-dasharray="'+ringCirc+'" stroke-dashoffset="'+ringOffset+'" stroke-linecap="round" transform="rotate(-90 40 40)"/>'+
    '</svg>'+
    '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-size:21px;font-weight:800;color:#e8b84b">'+r.score+'</div></div>';
  var mistakesHtml=(r.mistakes||[]).map(function(m,i){
    return '<div style="display:flex;gap:10px;padding-bottom:'+(i<r.mistakes.length-1?'13px':'0')+';margin-bottom:'+(i<r.mistakes.length-1?'13px':'0')+';border-bottom:'+(i<r.mistakes.length-1?'1px solid #faf8f4':'none')+'">'+
      '<div style="width:20px;height:20px;border-radius:50%;background:rgba(192,57,43,.1);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;font-size:9px;font-weight:800;color:#c0392b">'+(i+1)+'</div>'+
      '<div><div style="font-size:13px;font-weight:600;color:#0a0a0a;margin-bottom:2px;">'+m.title+'</div>'+
      '<div style="font-size:12px;color:#888;line-height:1.5">'+m.detail+'</div></div></div>';
  }).join('');
  var improvementsHtml=(r.improvements||[]).map(function(imp,i){
    return '<div style="display:flex;gap:10px;padding-bottom:'+(i<r.improvements.length-1?'13px':'0')+';margin-bottom:'+(i<r.improvements.length-1?'13px':'0')+';border-bottom:'+(i<r.improvements.length-1?'1px solid #faf8f4':'none')+'">'+
      '<div style="width:20px;height:20px;border-radius:50%;background:rgba(232,184,75,.12);display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:1px;font-size:11px;color:#e8b84b;font-weight:700">→</div>'+
      '<div><div style="font-size:13px;font-weight:600;color:#0a0a0a;margin-bottom:2px;">'+imp.title+'</div>'+
      '<div style="font-size:12px;color:#888;line-height:1.5">'+imp.detail+'</div></div></div>';
  }).join('');
  area.innerHTML=renderModeTabs()+
    '<div style="padding:10px 2px 14px;"><button onclick="showTopicPage()" style="background:rgba(0,0,0,.42);-webkit-backdrop-filter:blur(6px);backdrop-filter:blur(6px);color:#fff;border:none;border-radius:22px;padding:9px 16px;font-size:14px;font-weight:600;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;gap:6px;">\u2190 In\u00edcio</button></div>'+
    '<div style="background:#fff;border-radius:20px;overflow:hidden;box-shadow:0 2px 24px rgba(0,0,0,.08);border:1px solid #ede9e2;margin-bottom:1rem;">'+
      '<div style="background:#0a0a0a;padding:28px 24px;display:flex;align-items:center;gap:18px;">'+ringSvg+
        '<div style="flex:1"><div style="font-size:15px;font-weight:700;color:#fff;line-height:1.3;margin-bottom:5px;">'+r.headline+'</div>'+
        '<div style="font-size:12px;color:rgba(255,255,255,.38);line-height:1.45">'+r.summary+'</div></div></div>'+
      '<div style="padding:18px 24px;border-bottom:1px solid #f0ede8">'+
        '<div style="background:rgba(45,122,58,.06);border:1px solid rgba(45,122,58,.15);border-radius:10px;padding:12px 14px;display:flex;gap:10px;align-items:flex-start">'+
          '<span style="font-size:14px;flex-shrink:0;margin-top:1px">✦</span>'+
          '<div style="font-size:13px;color:#2d7a3a;line-height:1.55">'+r.positive+'</div></div></div>'+
      '<div style="padding:18px 24px;border-bottom:1px solid #f0ede8">'+
        '<div style="font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#c0392b;margin-bottom:14px">Erros para corrigir</div>'+mistakesHtml+'</div>'+
      '<div style="padding:18px 24px;border-bottom:1px solid #f0ede8">'+
        '<div style="font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#e8b84b;margin-bottom:14px">Próximos passos</div>'+improvementsHtml+'</div>'+
      (pronHtml?'<div style="padding:18px 24px;border-bottom:1px solid #f0ede8"><div style="font-size:9px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#aaa;margin-bottom:14px">🎙 Pronúncia — top 10 para treinar</div>'+pronHtml+'</div>':'')+
      '<div style="padding:16px 24px;display:flex;flex-direction:column;gap:8px">'+
        '<button class="ab" onclick="renderEmma()" style="width:100%;padding:14px;border-radius:12px;background:#0a0a0a;border:none;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:8px"><span>🔄</span> Nova conversa</button>'+
        '<div style="height:1px;background:#f0ede8;margin:2px 0"></div>'+
        '<div style="display:flex;gap:8px">'+
          '<button class="ab" onclick="downloadReport()" style="flex:1;padding:11px 6px;border-radius:11px;background:#f5f3ef;border:1px solid #e8e4de;color:#333;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:5px"><span style="font-size:13px">📄</span> Salvar PDF</button>'+
          '<button class="ab" onclick="downloadTranscript()" style="flex:1;padding:11px 6px;border-radius:11px;background:#f5f3ef;border:1px solid #e8e4de;color:#333;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:5px"><span style="font-size:13px">💬</span> Transcript</button>'+
          '<button class="ab" onclick="downloadExercises()" style="flex:1;padding:11px 6px;border-radius:11px;background:rgba(232,184,75,.08);border:1px solid rgba(232,184,75,.3);color:#7a5c00;font-size:11px;font-weight:700;display:flex;align-items:center;justify-content:center;gap:5px"><span style="font-size:13px">✏️</span> Exercícios</button>'+
        '</div></div></div>';
}

function downloadExercises(){
  var r=window._lastReport;
  if(!r||!r.exercises)return;
  var area=document.getElementById('area');
  if(!area)return;
  if(!window._exSkipCapture)window._exReturnHTML=area.innerHTML;  // remember the exact report to return to
  window._exSkipCapture=false;

  // ─── 1. Drop phonetics questions — this drill is grammar/vocabulary only ────
  if(!r._exCleaned){
    r._exCleaned=true;
    var phonRe=/phoneme|phonetic|pronunc|pronounce|syllable|word stress|stressed|silent letter|rhym|vowel|consonant|\bIPA\b|\/[a-z\u00e6\u0251\u0254\u0259\u025b\u026a\u028a\u028c\u03b8\u00f0\u0283\u0292\u014b\u02d0:]{1,7}\//i;
    r.exercises=(r.exercises||[]).filter(function(q){
      if(!q||!q.question||!q.options)return false;
      return !phonRe.test(q.question+' '+q.options.join(' '));
    });
  }

  // ─── 2. Audit answers once per report — Haiku re-solves each question and ───
  //      fixes a mismarked answer index; flawed/phonetics questions are dropped.
  if(!r._exVerified&&!window._exAuditing){
    window._exAuditing=true;
    area.innerHTML=renderModeTabs()+
      '<style>@keyframes _exAP{0%,100%{opacity:.4}50%{opacity:1}}</style>'+
      '<div style="min-height:55vh;display:flex;align-items:center;justify-content:center;">'+
        '<div style="font-size:13px;font-weight:600;color:#999;letter-spacing:.02em;animation:_exAP 1.4s ease-in-out infinite;">Preparando exerc\u00edcios\u2026</div>'+
      '</div>';
    var auditQs=(r.exercises||[]).slice(0,8);
    var payload=auditQs.map(function(q,i){return{i:i,question:q.question,options:q.options};});
    fetch(W+'/emma-chat',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({
        system:'You audit multiple-choice English grammar/vocabulary exercises for Brazilian learners. For each item, decide the 0-based index of the option that is truly correct. Reply with ONLY a JSON array, no prose, no markdown fences: [{"i":<item i>,"correct":<option index>}]. Set "correct":-1 if: the question is about phonetics, phonemes, pronunciation, sounds or syllables instead of grammar/vocabulary; OR no option is correct; OR more than one option is equally correct.',
        messages:[{role:'user',content:JSON.stringify(payload)}],
        topic:'exercise-audit',max_tokens:600
      })
    })
    .then(function(res){return res.json();})
    .then(function(d){
      var t=(typeof d.text==='string'&&d.text)?d.text:(d.content&&d.content[0]&&d.content[0].text)||'';
      t=String(t).replace(/```json|```/g,'').trim();
      var verdicts=JSON.parse(t);
      if(!Array.isArray(verdicts))return;
      var drop={};
      verdicts.forEach(function(v){
        if(!v||typeof v.i!=='number')return;
        var q=auditQs[v.i];if(!q)return;
        if(typeof v.correct!=='number'||v.correct<0||v.correct>=q.options.length){drop[v.i]=true;return;}
        q.answer=v.correct;
      });
      r.exercises=auditQs.filter(function(q,i){return !drop[i];});
    })
    .catch(function(){/* audit failed — show exercises as-is rather than block */})
    .then(function(){
      r._exVerified=true;
      window._exAuditing=false;
      window._exSkipCapture=true;   // don't let the loading screen become the "back" target
      downloadExercises();
    });
    return;
  }

  // Shuffle each question's options once — LLMs put the correct answer first,
  // so without this, option A is almost always right. Correctness is judged
  // by value (q.answer), so reordering is safe.
  if(!r._exShuffled){
    r._exShuffled=true;
    (r.exercises||[]).forEach(function(q){
      if(!q||!q.options||q.options.length<2)return;
      // q.answer is an INDEX into options — remember the correct text,
      // shuffle, then re-point the index at the text's new position.
      var correctText=(typeof q.answer==='number' && q.options[q.answer]!==undefined)
        ? q.options[q.answer] : null;
      for(var i=q.options.length-1;i>0;i--){
        var j=Math.floor(Math.random()*(i+1));
        var t=q.options[i];q.options[i]=q.options[j];q.options[j]=t;
      }
      if(correctText!==null){
        var ni=q.options.indexOf(correctText);
        if(ni>=0) q.answer=ni;
      }
    });
  }

  // ─── Inject keyframe styles + correct-answer chime (idempotent) ─────────────
  if(!document.getElementById('_exFxStyles')){
    var _exS=document.createElement('style');
    _exS.id='_exFxStyles';
    _exS.textContent=
      '@keyframes _exRecPulse{0%,100%{box-shadow:0 0 0 10px rgba(192,57,43,.20)}50%{box-shadow:0 0 0 18px rgba(192,57,43,.04)}}'+
      '@keyframes _exStopBreath{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.6;transform:scale(.88)}}'+
      '.ex-rec-active{animation:_exRecPulse 1.2s ease-in-out infinite}'+
      '.ex-rec-active svg{transform-origin:center;animation:_exStopBreath 1.2s ease-in-out infinite}';
    document.head.appendChild(_exS);
  }
  window._exPlayCorrectChime=window._exPlayCorrectChime||function(){
    try{
      var c=new(window.AudioContext||window.webkitAudioContext)();
      [523,659,784].forEach(function(f,i){
        var o=c.createOscillator(),g=c.createGain();
        o.type='triangle';o.frequency.value=f;
        var t=c.currentTime+i*.09;
        g.gain.setValueAtTime(0,t);
        g.gain.linearRampToValueAtTime(.22,t+.008);
        g.gain.exponentialRampToValueAtTime(.001,t+.13);
        o.connect(g);g.connect(c.destination);
        o.start(t);o.stop(t+.14);
      });
    }catch(e){}
  };
  // ─── Shared mic stream cache (kills iOS recording chime by reusing stream) ──
  window._exGetMicStream=window._exGetMicStream||function(){
    if(window._exMicStream && window._exMicStream.active){
      return Promise.resolve(window._exMicStream);
    }
    return navigator.mediaDevices.getUserMedia({audio:true}).then(function(s){
      window._exMicStream=s;
      return s;
    });
  };
  window._exReleaseMicStream=window._exReleaseMicStream||function(){
    if(window._exMicStream){
      try{window._exMicStream.getTracks().forEach(function(t){t.stop();});}catch(e){}
      window._exMicStream=null;
    }
  };

  // Build pronunciation exercises from AI-generated sentences (same as grammar)
  var pronExercises=[];
  if(r.pronSentences&&r.pronSentences.length>0){
    pronExercises=r.pronSentences.slice(0,4).map(function(s){return {sentence:s};});
  } else {
    // Fallback: use Emma's sentences from the conversation
    var emmaSents=[];
    (window._lastHistory||[]).forEach(function(m){
      if(m.role!=='assistant')return;
      var sents=m.content.split(/[.!?]+/).map(function(s){return s.trim();})
        .filter(function(s){return s.length>10&&s.split(' ').length>=4&&s.split(' ').length<=15;});
      sents.forEach(function(s){emmaSents.push(s);});
    });
    pronExercises=emmaSents.slice(0,4).map(function(s){return {sentence:s};});
  }

  // All questions: 8 grammar + up to 4 pronunciation
  var grammarQs=r.exercises.slice(0,8);
  var totalQs=grammarQs.length+pronExercises.length;
  var exIdx=0; // current question index
  var grammarTotal=grammarQs.length;
  var pronTotal=pronExercises.length;
  var exScores=[]; // track grammar answers
  var pronAudio=null; // for playing Emma audio in pron exercises

  window._exGrammarQs=grammarQs;
  window._exScores=exScores;
  window._exSetScore=function(qIdx,i){
    if(exScores[qIdx]!==undefined)return;
    exScores[qIdx]=i;exIdx=qIdx;
    if(grammarQs[qIdx]&&i===grammarQs[qIdx].answer&&window._exPlayCorrectChime)window._exPlayCorrectChime();
    renderExercise();
  };
  function renderExercise(){
    var isGrammar=exIdx<grammarTotal;
    var isPron=exIdx>=grammarTotal&&exIdx<totalQs;
    var isSummary=exIdx>=totalQs;
    var pct=Math.round((exIdx/totalQs)*100);
    var grammarPct=isGrammar?Math.round((exIdx/grammarTotal)*100):100;
    var pronPct=isPron?Math.round(((exIdx-grammarTotal)/Math.max(pronTotal,1))*100):0;

    // Progress bar HTML
    var progressHtml=
      '<div style="margin-bottom:20px;">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">'+
          '<div style="font-size:13px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;color:'+(isGrammar?'rgba(0,0,0,.4)':'#e8b84b')+';">'+(isGrammar?'Gramática · '+(exIdx+1)+'/'+grammarTotal:'Pronúncia · '+(exIdx-grammarTotal+1)+'/'+pronTotal)+'</div>'+
          '<div style="font-size:14px;font-weight:600;color:rgba(0,0,0,.3);">'+(exIdx+1)+'/'+totalQs+'</div>'+
        '</div>'+
        '<div style="height:4px;background:#e8e4de;border-radius:2px;overflow:hidden;">'+
          '<div style="height:100%;display:flex;border-radius:2px;overflow:hidden;">'+
            '<div style="width:'+Math.round(grammarTotal/totalQs*100)+'%;height:100%;position:relative;">'+
              '<div style="position:absolute;inset:0;background:#e8e4de;"></div>'+
              '<div style="position:absolute;inset:0;width:'+grammarPct+'%;background:#0a0a0a;transition:width .3s;"></div>'+
            '</div>'+
            '<div style="width:1px;background:#fff;flex-shrink:0;"></div>'+
            '<div style="flex:1;height:100%;position:relative;">'+
              '<div style="position:absolute;inset:0;background:#e8e4de;"></div>'+
              (pronPct>0?'<div style="position:absolute;inset:0;width:'+pronPct+'%;background:#e8b84b;transition:width .3s;"></div>':'')+
            '</div>'+
          '</div>'+
        '</div>'+
      '</div>';

    // Nav arrows
    var navHtml=
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-top:26px;">'+
        '<button onclick="exNav(-1)" style="width:46px;height:46px;border-radius:50%;background:rgba(0,0,0,.06);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;"'+
          (exIdx===0?' disabled style="width:46px;height:46px;border-radius:50%;background:rgba(0,0,0,.03);border:none;cursor:default;display:flex;align-items:center;justify-content:center;opacity:.3;"':'')+'>'+
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="rgba(0,0,0,.35)"><path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>'+
        '</button>'+
        '<button id="exNextBtn" onclick="exNav(1)" style="width:46px;height:46px;border-radius:50%;background:#0a0a0a;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;">'+
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="#fff"><path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z"/></svg>'+
        '</button>'+
      '</div>';

    var cardHtml='';

    if(isGrammar){
      var q=grammarQs[exIdx];
      var answered=exScores[exIdx]!==undefined;
      var sel=exScores[exIdx];
      var optsHtml=q.options.map(function(opt,i){
        var bg='#fff',border='1.5px solid #e8e4de',color='#111';
        if(answered){
          if(i===q.answer){bg='rgba(45,122,58,.07)';border='1.5px solid #2d7a3a';color='#2d7a3a';}
          else if(i===sel){bg='rgba(192,57,43,.06)';border='1.5px solid #c0392b';color='#c0392b';}
        } else if(i===sel){bg='#fafafa';border='1.5px solid #0a0a0a';}
        return '<button onclick="exSelect('+i+')" style="width:100%;padding:17px 18px;border-radius:14px;border:'+border+';background:'+bg+';font-size:18px;color:'+color+';cursor:pointer;font-family:inherit;text-align:left;margin-bottom:11px;transition:all .15s;">'+
          '<span style="font-weight:700;color:#ccc;margin-right:12px;font-size:16px;">'+String.fromCharCode(65+i)+'</span>'+opt+'</button>';
      }).join('');
      var tipHtml=answered&&q.tip?
        '<div style="margin-top:14px;font-size:14px;color:#888;line-height:1.5;padding:10px 14px;background:#f8f6f2;border-radius:10px;">'+q.tip+'</div>':'';
      cardHtml=
        '<div style="font-size:20px;font-weight:600;color:#0a0a0a;line-height:1.5;margin-bottom:24px;">'+q.question+'</div>'+
        optsHtml+tipHtml+
        '<div style="margin-top:16px;display:flex;flex-direction:column;align-items:center;gap:8px;">'+
          '<button id="exMicBtn" onclick="mcToggleRec('+exIdx+')" style="width:60px;height:60px;border-radius:50%;background:rgba(0,0,0,.08);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;">'+
            '<svg id="exMicIcon" width="22" height="22" viewBox="0 0 24 24" fill="rgba(0,0,0,.45)"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.42 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.3 6-6.72h-1.7z"/></svg>'+
          '</button>'+
          '<div id="exMicLbl" style="font-size:15px;color:#bbb;">Ou fale sua resposta</div>'+
          '<div id="exTranscript" style="font-size:14px;color:#888;min-height:16px;text-align:center;"></div>'+
        '</div>';
    }

    if(isPron){
      var pi=exIdx-grammarTotal;
      var pe=pronExercises[pi];
      cardHtml=
        '<div style="font-size:15px;color:#aaa;font-weight:500;margin-bottom:14px;">Ouça e repita:</div>'+
        '<div style="background:#f8f6f2;border-radius:12px;padding:12px 14px;margin-bottom:28px;display:flex;align-items:flex-start;gap:12px;">'+
          '<button onclick="exPlayEmma('+pi+')" id="exPlayBtn_'+pi+'" style="width:34px;height:34px;border-radius:50%;flex-shrink:0;margin-top:2px;background:rgba(0,0,0,.08);border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .2s;">'+
            '<svg id="exPlayIcon_'+pi+'" width="12" height="12" viewBox="0 0 24 24" fill="rgba(0,0,0,.4)"><path d="M8 5v14l11-7z"/></svg>'+
          '</button>'+
          '<div id="exWords_'+pi+'" style="flex:1;display:flex;flex-wrap:wrap;gap:4px 6px;align-items:baseline;">'+
            pe.sentence.split(' ').map(function(w){return '<span style="font-size:18px;font-weight:500;color:#111;">'+w+'</span>';}).join('')+
          '</div>'+
        '</div>'+
        '<div style="display:flex;flex-direction:column;align-items:center;gap:8px;">'+
          '<button onclick="exToggleRec('+pi+')" id="exRecBtn_'+pi+'" style="width:64px;height:64px;border-radius:50%;background:#e8b84b;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;box-shadow:0 0 0 10px rgba(232,184,75,.12);">'+
            '<svg id="exRecIcon_'+pi+'" width="20" height="20" viewBox="0 0 24 24" fill="#fff"><path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.42 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.3 6-6.72h-1.7z"/></svg>'+
          '</button>'+
          '<div id="exRecLabel_'+pi+'" style="font-size:13px;color:#bbb;">Toque para gravar</div>'+
        '</div>'+
        '<div id="exPronFeedback_'+pi+'"></div>';
    }

    if(isSummary){
      // Summary screen — release the mic since recording is done
      if(window._exReleaseMicStream)window._exReleaseMicStream();

      // ─── Compute scores ─────────────────────────────────────────────────
      var correct=exScores.filter(function(s,i){return s!==undefined&&grammarQs[i]&&s===grammarQs[i].answer;}).length;
      var grammarPct=grammarTotal>0?Math.round(correct/grammarTotal*100):0;
      var pronDone=pronExercises.filter(function(p){return typeof p.score==='number';});
      var pronAvg=pronDone.length>0
        ?Math.round(pronDone.reduce(function(a,p){return a+p.score;},0)/pronDone.length)
        :null;
      var overall=pronAvg===null?grammarPct:Math.round((grammarPct+pronAvg)/2);

      // Tier → color + message
      var sColor=overall>=80?'#2d7a3a':overall>=65?'#e8b84b':'#c0392b';
      var msgHead,msgSub;
      if(overall>=90){msgHead='Excelente trabalho!';msgSub='Você está dominando esse conteúdo. Continue assim!';}
      else if(overall>=75){msgHead='Muito bem!';msgSub='Você está no caminho certo — continue praticando para aperfeiçoar.';}
      else if(overall>=60){msgHead='Bom progresso!';msgSub='Algumas áreas precisam de revisão, mas você está avançando.';}
      else {msgHead='Continue praticando.';msgSub='Cada conversa te aproxima do seu objetivo. Não desanime!';}

      // Pron stat block (varies based on whether anything was attempted)
      var pronStatHTML=pronAvg!==null
        ?'<div style="font-size:24px;font-weight:800;color:#0a0a0a;line-height:1;">'+pronAvg+'<span style="font-size:14px;font-weight:600;color:#aaa;">%</span></div>'+
          '<div style="font-size:11px;color:#aaa;margin-top:4px;">média</div>'
        :'<div style="font-size:24px;font-weight:800;color:#d4d0ca;line-height:1;">—</div>'+
          '<div style="font-size:11px;color:#aaa;margin-top:4px;">não praticado</div>';

      cardHtml=
        '<div style="text-align:center;padding:8px 0 4px;">'+
          '<div style="font-size:10px;font-weight:700;letter-spacing:.18em;color:#bbb;margin-bottom:10px;">SUA PONTUAÇÃO</div>'+
          '<div style="font-size:64px;font-weight:800;color:'+sColor+';line-height:1;letter-spacing:-.04em;margin-bottom:14px;">'+overall+'<span style="font-size:28px;font-weight:600;opacity:.5;">%</span></div>'+
          '<div style="height:6px;background:#e8e4de;border-radius:3px;overflow:hidden;margin:0 auto 22px;max-width:200px;">'+
            '<div style="height:100%;width:'+overall+'%;background:'+sColor+';transition:width .8s ease-out;"></div>'+
          '</div>'+
          '<div style="font-family:\'Fraunces\',Georgia,serif;font-size:22px;font-weight:700;color:#0a0a0a;letter-spacing:-.02em;margin-bottom:8px;">'+msgHead+'</div>'+
          '<div style="font-size:14px;color:#888;line-height:1.5;max-width:300px;margin:0 auto 24px;">'+msgSub+'</div>'+
        '</div>'+
        '<div style="display:flex;gap:8px;margin-bottom:20px;">'+
          '<div style="flex:1;background:#f8f6f2;border-radius:12px;padding:14px 10px;text-align:center;">'+
            '<div style="font-size:10px;font-weight:700;letter-spacing:.14em;color:#bbb;margin-bottom:6px;">GRAMÁTICA</div>'+
            '<div style="font-size:24px;font-weight:800;color:#0a0a0a;line-height:1;">'+correct+'<span style="font-size:14px;font-weight:600;color:#aaa;">/'+grammarTotal+'</span></div>'+
            '<div style="font-size:11px;color:#aaa;margin-top:4px;">corretas</div>'+
          '</div>'+
          '<div style="flex:1;background:#f8f6f2;border-radius:12px;padding:14px 10px;text-align:center;">'+
            '<div style="font-size:10px;font-weight:700;letter-spacing:.14em;color:#bbb;margin-bottom:6px;">PRONÚNCIA</div>'+
            pronStatHTML+
          '</div>'+
        '</div>'+
        '<button onclick="renderEmma()" style="width:100%;padding:14px;border-radius:13px;background:#0a0a0a;border:none;color:#fff;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit;letter-spacing:-.005em;">Nova conversa</button>';
      navHtml='';
      progressHtml='';
    }

    var backBtn='<div style="display:flex;align-items:center;margin-bottom:16px;">'+
      '<button onclick="if(window._exReleaseMicStream)window._exReleaseMicStream();if(window._exReturnHTML){document.getElementById(\'area\').innerHTML=window._exReturnHTML;window.scrollTo(0,0);}else{showReport();}" style="background:none;border:none;cursor:pointer;font-size:13px;font-weight:600;color:rgba(0,0,0,.35);font-family:inherit;display:flex;align-items:center;gap:5px;padding:0;letter-spacing:.02em;">'+
        '<svg width="15" height="15" viewBox="0 0 24 24" fill="rgba(0,0,0,.35)"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z"/></svg>'+
        'Relatório'+
      '</button>'+
    '</div>';
    area.innerHTML=renderModeTabs()+
      '<div style="position:fixed;top:max(20px, env(safe-area-inset-top,0px));left:0;right:0;bottom:0;z-index:50;background:#fff;overflow-y:auto;-webkit-overflow-scrolling:touch;box-sizing:border-box;display:flex;flex-direction:column;padding:18px 22px calc(env(safe-area-inset-bottom,0px) + 22px);">'+
        backBtn+progressHtml+
        '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;min-height:0;">'+cardHtml+'</div>'+
        navHtml+
      '</div>';

    // Re-init pron rec state
    window._exPronRec=null;
  }

  window.exSelect=function(i){
    if(exIdx>=grammarTotal)return;
    if(exScores[exIdx]!==undefined)return;
    exScores[exIdx]=i;
    if(window._exScores)window._exScores[exIdx]=i;
    if(grammarQs[exIdx]&&i===grammarQs[exIdx].answer&&window._exPlayCorrectChime)window._exPlayCorrectChime();
    renderExercise();
  };
  // Apply voice result if pending
  if(window._exVoiceResult&&window._exVoiceResult[exIdx]!==undefined){
    var vr=window._exVoiceResult[exIdx];
    if(exScores[exIdx]===undefined){
      exScores[exIdx]=vr.correct?grammarQs[exIdx].answer:vr.matched;
      delete window._exVoiceResult[exIdx];
      renderExercise();
    }
  }

  window.exNav=function(dir){
    exIdx=Math.max(0,Math.min(totalQs,exIdx+dir));
    if(pronAudio){pronAudio.pause();pronAudio=null;}
    if(window._exPronRec&&window._exPronRec.state==='recording')window._exPronRec.stop();
    renderExercise();
  };

  window.exPlayEmma=function(pi){
    var pe=pronExercises[pi];
    if(!pe)return;
    var btn=document.getElementById('exPlayBtn_'+pi);
    var icon=document.getElementById('exPlayIcon_'+pi);
    var playSvg='<path d="M8 5v14l11-7z"/>';
    var pauseSvg='<path d="M6 4h4v16H6zM14 4h4v16h-4z"/>';
    function resetBtn(){
      if(btn){btn.style.background='rgba(0,0,0,.08)';}
      if(icon){icon.setAttribute('fill','rgba(0,0,0,.4)');icon.innerHTML=playSvg;}
      if(pronAudio){try{pronAudio.stop();}catch(e){}pronAudio=null;}
    }
    // Already playing? Stop and reset.
    if(pronAudio){resetBtn();return;}
    if(btn){btn.style.background='#0a0a0a';}
    if(icon){icon.setAttribute('fill','#fff');icon.innerHTML=pauseSvg;}
    fetch(W+'/emma-speak',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text:pe.sentence})})
    .then(function(r){return r.arrayBuffer();})
    .then(function(ab){
      var ctx=new (window.AudioContext||window.webkitAudioContext)();
      return ctx.decodeAudioData(ab).then(function(buf){
        var src=ctx.createBufferSource();src.buffer=buf;src.connect(ctx.destination);src.start();
        pronAudio=src;
        src.onended=function(){if(pronAudio===src)resetBtn();};
      });
    }).catch(resetBtn);
  };

  window.exToggleRec=function(pi){
    var recBtn=document.getElementById('exRecBtn_'+pi);
    var recLabel=document.getElementById('exRecLabel_'+pi);
    if(window._exPronRec&&window._exPronRec.state==='recording'){
      window._exPronRec.stop();
      return;
    }
    window._exGetMicStream().then(function(stream){
      var chunks=[];
      var mt=MediaRecorder.isTypeSupported('audio/mp4')?'audio/mp4':MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')?'audio/ogg;codecs=opus':'audio/webm';
      var mr=new MediaRecorder(stream,{mimeType:mt});
      window._exPronRec=mr;
      mr.ondataavailable=function(e){if(e.data.size>0)chunks.push(e.data);};
      mr.onstop=function(){
        // Don't stop tracks — stream stays alive to avoid iOS chime on next record
        if(recBtn){recBtn.style.background='#e8b84b';recBtn.style.boxShadow='0 0 0 10px rgba(232,184,75,.12)';recBtn.classList.remove('ex-rec-active');}
        var recIconStop=document.getElementById('exRecIcon_'+pi);
        if(recIconStop){recIconStop.innerHTML='<path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.42 2.72 6.23 6 6.72V21h2v-3.28c3.28-.49 6-3.3 6-6.72h-1.7z"/>';}
        if(recLabel)recLabel.textContent='Enviando...';
        var blob=new Blob(chunks,{type:mt});
        var fr=new FileReader();
        fr.onloadend=function(){
          var b64=fr.result.split(',')[1];
          var pe=pronExercises[pi];
          // Convert to 16kHz WAV for better Azure scoring
          function sendToAzure(wavB64){
            fetch(W+'/transcribe',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({audio:b64,mimeType:mt,wavB64:wavB64||null,referenceText:pe.sentence,noEcho:true})})
            .then(function(r){return r.json();})
            .then(function(d){
              var fb=document.getElementById('exPronFeedback_'+pi);
              var wordsEl=document.getElementById('exWords_'+pi);
              var score=d.pronunciation?Math.round(d.pronunciation.pronScore||d.pronunciation.accuracyScore||0):0;
              pe.score=score; // store for summary screen
              if(recLabel){
                if(score>0){
                  var sColor=score>=80?'#2d7a3a':score>=65?'#e8b84b':'#c0392b';
                  recLabel.innerHTML=
                    '<div style="display:flex;flex-direction:column;align-items:center;">'+
                      '<div style="font-size:10px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;color:#bbb;margin-bottom:4px;">Sua pontuação</div>'+
                      '<div style="font-size:34px;font-weight:800;color:'+sColor+';line-height:1;letter-spacing:-.03em;">'+score+'<span style="font-size:18px;font-weight:600;opacity:.55;">%</span></div>'+
                    '</div>';
                } else {
                  recLabel.textContent='Toque para gravar novamente';
                }
              }
              if(wordsEl&&d.pronunciation&&d.pronunciation.words){
                var wds=d.pronunciation.words;
                wordsEl.innerHTML=wds.map(function(w){
                  var score=Math.round(w.accuracyScore||0);
                  var c=score>=80?'#2d7a3a':score>=65?'#e8b84b':'#c0392b';
                  // Only show the score badge for words that need attention.
                  // Green words stay clean text — less visual noise.
                  var showScore=score<80;
                  return '<div style="display:flex;flex-direction:column;align-items:center;">'+
                    '<span style="font-size:18px;font-weight:500;color:'+c+';">'+w.word+'</span>'+
                    (showScore?'<span style="font-size:10px;font-weight:700;color:'+c+';margin-top:2px;">'+score+'%</span>':'')+
                  '</div>';
                }).join('');
              }
              if(fb&&score>0){
                var msg=score>=80?'✦ Ótimo! Continue assim.':score>=65?'Quase lá! Ouça Emma e tente de novo.':'Foque nas palavras em vermelho — ouça Emma mais uma vez.';
                fb.innerHTML='<div style="margin-top:14px;padding:10px 14px;background:rgba(45,122,58,.06);border:1px solid rgba(45,122,58,.15);border-radius:10px;font-size:14px;color:#2d7a3a;">'+msg+'</div>';
                if(score>=80&&window._exPlayCorrectChime)window._exPlayCorrectChime();
              }
            }).catch(function(){if(recLabel)recLabel.textContent='Erro. Tente novamente.';});
          }
          try{
            var arrBuf=fr.result;
            fetch(arrBuf).then(function(r2){return r2.arrayBuffer();}).then(function(ab){
              var ctx=new(window.AudioContext||window.webkitAudioContext)();
              ctx.decodeAudioData(ab,function(audioBuf){
                var sr=16000,ns=Math.floor(audioBuf.duration*sr);
                var oCtx=new OfflineAudioContext(1,ns,sr);
                var src=oCtx.createBufferSource();src.buffer=audioBuf;src.connect(oCtx.destination);src.start();
                oCtx.startRendering().then(function(rendered){
                  var pcm=rendered.getChannelData(0);
                  var wavBuf=new ArrayBuffer(44+pcm.length*2);
                  var v=new DataView(wavBuf);
                  function ws(o,s){for(var i=0;i<s.length;i++)v.setUint8(o+i,s.charCodeAt(i));}
                  ws(0,'RIFF');v.setUint32(4,36+pcm.length*2,true);ws(8,'WAVE');
                  ws(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,1,true);
                  v.setUint32(24,16000,true);v.setUint32(28,32000,true);v.setUint16(32,2,true);v.setUint16(34,16,true);
                  ws(36,'data');v.setUint32(40,pcm.length*2,true);
                  var off=44;for(var i=0;i<pcm.length;i++){var s2=Math.max(-1,Math.min(1,pcm[i]));v.setInt16(off,s2<0?s2*0x8000:s2*0x7FFF,true);off+=2;}
                  var bytes=new Uint8Array(wavBuf);
                  var bin='';for(var i=0;i<bytes.length;i++)bin+=String.fromCharCode(bytes[i]);
                  sendToAzure(btoa(bin));
                }).catch(function(){sendToAzure(null);});
              },function(){sendToAzure(null);});
            }).catch(function(){sendToAzure(null);});
          }catch(e){sendToAzure(null);}
        };
        fr.readAsDataURL(blob);
      };
      mr.start();
      if(recBtn){recBtn.style.background='#c0392b';recBtn.style.boxShadow='0 0 0 10px rgba(192,57,43,.12)';recBtn.classList.add('ex-rec-active');}
      var recIconStart=document.getElementById('exRecIcon_'+pi);
      if(recIconStart){recIconStart.innerHTML='<rect x="6" y="6" width="12" height="12" rx="2"/>';}
      if(recLabel)recLabel.textContent='Gravando... toque para parar';
    }).catch(function(){});
  };

  renderExercise();
}

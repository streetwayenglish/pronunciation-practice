// ============================================================================
// TEACHER — admin panel: login, MC editor, sentence import
// ============================================================================
function showTeacherLogin(){
  var o=document.getElementById('tov');o.style.display='flex';
  o.innerHTML='<div class="lbox"><h2>Teacher Panel</h2><p>Enter your password.</p><input type="password" class="pwi" id="pwi" placeholder="Password..."/><button class="lbt" id="lbt">Enter</button><div class="pwe" id="pwe"></div></div>';
  setTimeout(function(){
    var el=document.getElementById('pwi');
    if(el){el.focus();el.onkeydown=function(e){if(e.key==='Enter')doLogin();};}
    document.getElementById('lbt').onclick=doLogin;
  },50);
}
function doLogin(){
  if(document.getElementById('pwi').value==='streetway2024')showTeacherPanel();
  else document.getElementById('pwe').textContent='Wrong password.';
}
var MCQS=[];
function showTeacherPanel(tab){
  tab=tab||'sentences';
  var o=document.getElementById('tov');o.style.display='flex';
  var tabs='<div class="ttabs">'+
    '<button class="ttab'+(tab==='sentences'?' active':'')+'" onclick="showTeacherPanel(&quot;sentences&quot;)">Sentences</button>'+
    '<button class="ttab'+(tab==='mc'?' active':'')+'" onclick="showTeacherPanel(&quot;mc&quot;)">Multiple Choice</button>'+
  '</div>';
  if(tab==='sentences'){
    var rows='';
    for(var ti=0;ti<SENTS.length;ti++){
      var sv=SENTS[ti].replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      rows+='<div class="trow2"><input class="tinp" value="'+sv+'"/><button class="tdel" onclick="this.parentElement.remove()">x</button></div>';
    }
    o.innerHTML='<div class="tmod"><h2>Teacher Panel</h2>'+tabs+
      '<div class="ai-gen-box" style="margin-bottom:10px">'+
        '<div class="ai-gen-label">📋 Import sentences from Claude</div>'+
        '<textarea class="ai-gen-inp" id="importSentsInp" placeholder="Paste JSON array of sentences from Claude here...&#10;e.g. [&quot;She walked to the market.&quot;, &quot;He talked to his boss.&quot;]" style="min-height:60px"></textarea>'+
        '<button class="ai-gen-btn" onclick="importSentences()" style="background:var(--g600)">Import sentences</button>'+
        '<div class="ai-gen-status" id="importSentsStatus"></div>'+
      '</div>'+
      '<div class="ai-gen-box">'+
        '<div class="ai-gen-label">✨ Generate sentences with AI</div>'+
        '<textarea class="ai-gen-inp" id="aiSentsInp" placeholder="Paste vocabulary or topic here...&#10;e.g. walked, talked, looked forward to, called the shots"></textarea>'+
        '<button class="ai-gen-btn" id="aiSentsBtn" onclick="generateSentsWithAI()">Generate sentences with AI</button>'+
        '<div class="ai-gen-status" id="aiSentsStatus"></div>'+
      '</div>'+
      '<div id="trows">'+rows+'</div><button class="tadd" id="tadd">+ Add sentence</button><div class="tact"><button class="tcn" id="tcn">Cancel</button><button class="tsv" id="tsv">Save and publish</button></div><div class="tmsg" id="tmsg"></div></div>';
    document.getElementById('tadd').onclick=function(){
      var c=document.getElementById('trows'),d=document.createElement('div');d.className='trow2';
      d.innerHTML='<input class="tinp" placeholder="Type new sentence..."/><button class="tdel" onclick="this.parentElement.remove()">x</button>';
      c.appendChild(d);d.querySelector('input').focus();
    };
    document.getElementById('tcn').onclick=closeTeacher;
    document.getElementById('tsv').onclick=saveTeacher;
  } else {
    o.innerHTML='<div class="tmod"><h2>Teacher Panel</h2>'+tabs+
    '<div class="ai-gen-box" style="margin-bottom:10px">'+
        '<div class="ai-gen-label">📋 Import from Claude chat</div>'+
        '<textarea class="ai-gen-inp" id="importInp" placeholder="Paste JSON from Claude here..." style="min-height:60px"></textarea>'+
        '<button class="ai-gen-btn" onclick="importMCJSON()" style="background:var(--g600)">Import questions</button>'+
        '<div class="ai-gen-status" id="importStatus"></div>'+
      '</div>'+
      '<div class="ai-gen-box">'+
      '<div class="ai-gen-label">✨ Generate with AI</div>'+
      '<textarea class="ai-gen-inp" id="aiGenInp" placeholder="Paste vocabulary, expressions or topic here... e.g. looking forward to, see eye to eye, call the shots"></textarea>'+
      '<button class="ai-gen-btn" id="aiGenBtn" onclick="generateMCWithAI()">Generate questions with AI</button>'+
      '<div class="ai-gen-status" id="aiGenStatus"></div>'+
    '</div>'+
    '<div id="mcrows"></div><button class="tadd" id="mcadd">+ Add question</button><div class="tact"><button class="tcn" id="tcn">Cancel</button><button class="tsv" id="mcsvbtn">Save and publish</button></div><div class="tmsg" id="tmsg"></div></div>';
    // Render existing MC questions
    for(var qi=0;qi<MCQS.length;qi++) addMCRow(MCQS[qi]);
    document.getElementById('mcadd').onclick=function(){addMCRow(null);};
    document.getElementById('tcn').onclick=closeTeacher;
    document.getElementById('mcsvbtn').onclick=saveMC;
  }
}

function addMCRow(q){
  var c=document.getElementById('mcrows');
  var div=document.createElement('div');div.className='mc-row';
  var qv=q?q.question.replace(/"/g,'&quot;'):'';
  var tv=q?q.target.replace(/"/g,'&quot;'):'';
  var opts=['','','',''];
  var correct=0;
  if(q&&q.options){for(var i=0;i<4;i++){opts[i]=q.options[i]||'';} correct=q.correct||0;}
  var optRows='';
  for(var i=0;i<4;i++){
    var ov=opts[i].replace(/"/g,'&quot;');
    optRows+='<div class="mc-opt-row">'+
      '<input type="radio" class="mc-opt-radio" name="mc-correct-'+Date.now()+'-'+Math.random()+'" value="'+i+'"'+(correct===i?' checked':'')+'>'+
      '<input class="mc-opt-inp" placeholder="Option '+(i+1)+'..." value="'+ov+'">'+
    '</div>';
  }
  div.innerHTML=
    '<input class="mc-q" placeholder="Question (e.g. How do you feel about the meeting?)" value="'+qv+'">'+
    '<div class="mc-opts">'+optRows+'</div>'+
    '<div class="mc-target-row">'+
      '<span class="mc-target-lbl">Target phrase:</span>'+
      '<input class="mc-opt-inp" placeholder="e.g. looking forward to" value="'+tv+'">'+
      '<button class="mc-del" onclick="this.parentElement.parentElement.remove()">Remove</button>'+
    '</div>';
  c.appendChild(div);
}



function importSentences(){
  var inp=document.getElementById('importSentsInp');
  var status=document.getElementById('importSentsStatus');
  var text=inp?inp.value.trim():'';
  if(!text){status.textContent='Please paste JSON first.';return;}
  try{
    text=text.replace(/```json|```/g,'').trim();
    var sents=JSON.parse(text);
    if(!Array.isArray(sents))throw new Error('Must be a JSON array of strings');
    var c=document.getElementById('trows');
    for(var i=0;i<sents.length;i++){
      if(!sents[i]||typeof sents[i]!=='string')continue;
      var d=document.createElement('div');d.className='trow2';
      var sv=sents[i].replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      d.innerHTML='<input class="tinp" value="'+sv+'"/><button class="tdel" onclick="this.parentElement.remove()">x</button>';
      c.appendChild(d);
    }
    inp.value='';
    status.textContent='Imported '+sents.length+' sentences!';
  }catch(e){
    status.textContent='Invalid JSON: '+e.message;
  }
}

function generateSentsWithAI(){
  var inp=document.getElementById('aiSentsInp');
  var btn=document.getElementById('aiSentsBtn');
  var status=document.getElementById('aiSentsStatus');
  var topic=inp?inp.value.trim():'';
  if(!topic){status.textContent='Please enter vocabulary or topic first.';return;}
  btn.disabled=true;btn.textContent='Generating...';
  status.textContent='Generating sentences...';
  fetch(W+'/generate-sents',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({password:'streetway2024',topic:topic})
  })
  .then(function(r){return r.json();})
  .then(function(d){
    if(d.error)throw new Error(d.error);
    var sents=d.sentences;
    if(!Array.isArray(sents))throw new Error('Invalid response');
    var c=document.getElementById('trows');
    for(var i=0;i<sents.length;i++){
      var dv=document.createElement('div');dv.className='trow2';
      var sv=sents[i].replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
      dv.innerHTML='<input class="tinp" value="'+sv+'"/><button class="tdel" onclick="this.parentElement.remove()">x</button>';
      c.appendChild(dv);
    }
    status.textContent='Generated '+sents.length+' sentences!';
    btn.disabled=false;btn.textContent='Generate sentences with AI';
  })
  .catch(function(e){
    status.textContent='Error: '+e.message;
    btn.disabled=false;btn.textContent='Generate sentences with AI';
  });
}

function saveMC(){
  var rows=document.querySelectorAll('.mc-row');
  var qs=[];
  for(var ri=0;ri<rows.length;ri++){
    var row=rows[ri];
    var question=row.querySelector('.mc-q').value.trim();
    if(!question)continue;
    var optInps=row.querySelectorAll('.mc-opt-inp');
    var radioInps=row.querySelectorAll('.mc-opt-radio');
    var opts=[];
    var correct=0;
    for(var i=0;i<4;i++){opts.push(optInps[i]?optInps[i].value.trim():'');}
    for(var i=0;i<radioInps.length;i++){if(radioInps[i].checked)correct=parseInt(radioInps[i].value);}
    var target=optInps[4]?optInps[4].value.trim():'';
    qs.push({question:question,options:opts,correct:correct,target:target});
  }
  if(!qs.length){document.getElementById('tmsg').textContent='Add at least one question.';return;}
  document.getElementById('tmsg').textContent='Saving...';
  fetch(W+'/mc',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'streetway2024',questions:qs})})
    .then(function(r){return r.json();})
    .then(function(d){
      if(d.ok){MCQS=qs;document.getElementById('tmsg').textContent='Saved!';setTimeout(closeTeacher,2000);}
      else document.getElementById('tmsg').textContent='Error saving.';
    }).catch(function(e){document.getElementById('tmsg').textContent='Error: '+e.message;});
}
function importMCJSON(){
  var inp=document.getElementById('importInp');
  var status=document.getElementById('importStatus');
  var text=inp?inp.value.trim():'';
  if(!text){status.textContent='Please paste JSON first.';return;}
  try{
    text=text.replace(/```json|```/g,'').trim();
    var questions=JSON.parse(text);
    if(!Array.isArray(questions))throw new Error('Must be a JSON array');
    for(var i=0;i<questions.length;i++) addMCRow(questions[i]);
    inp.value='';
    status.textContent='Imported '+questions.length+' questions successfully!';
    var rows=document.getElementById('mcrows');
    if(rows)rows.scrollIntoView({behavior:'smooth',block:'start'});
  }catch(e){
    status.textContent='Invalid JSON: '+e.message;
  }
}

function generateMCWithAI(){
  var inp=document.getElementById('aiGenInp');
  var btn=document.getElementById('aiGenBtn');
  var status=document.getElementById('aiGenStatus');
  var topic=inp?inp.value.trim():'';
  if(!topic){status.textContent='Please enter some vocabulary or a topic first.';return;}
  btn.disabled=true;
  status.textContent='Generating questions...';
  var prompt='You are an English teacher creating speaking multiple choice exercises for Brazilian students.'+
    ' Based on this vocabulary/topic: '+topic+
    ' Create 5 conversational multiple choice questions.'+
    ' Each question should: be a realistic conversational situation, have 4 natural spoken answer options, one clearly correct answer that uses the target expression naturally.'+
    ' Respond ONLY with a JSON array, no markdown, no explanation. Format exactly like this:'+
    ' [{"question":"...","options":["...","...","...","..."],"correct":0,"target":"..."},...]'+
    ' The "correct" field is the index (0-3) of the correct option.'+
    ' The "target" field is the specific phrase or expression to practice pronunciation of.';
  fetch('https://api.anthropic.com/v1/messages',{
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({
      model:'claude-haiku-4-5-20251001',
      max_tokens:2000,
      messages:[{role:'user',content:prompt}]
    })
  })
  .then(function(r){return r.json();})
  .then(function(d){
    var text=(d.content||[]).map(function(b){return b.text||'';}).join('');
    // Strip any markdown backticks
    text=text.replace(/```json|```/g,'').trim();
    var questions=JSON.parse(text);
    if(!Array.isArray(questions))throw new Error('Invalid response');
    // Add to existing rows
    for(var qi=0;qi<questions.length;qi++) addMCRow(questions[qi]);
    status.textContent=questions.length+' questions generated! Review and save.';
    btn.disabled=false;
    inp.value='';
  })
  .catch(function(e){
    status.textContent='Error: '+e.message+'. Please try again.';
    btn.disabled=false;
  });
}

function saveTeacher(){
  var inp=document.querySelectorAll('.tinp'),ns=[];
  for(var si=0;si<inp.length;si++){var v=inp[si].value.trim();if(v)ns.push(v);}
  if(!ns.length){document.getElementById('tmsg').textContent='Add at least one sentence.';return;}
  document.getElementById('tmsg').textContent='Saving...';
  fetch(W+'/sentences',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:'streetway2024',sentences:ns})})
    .then(function(r){return r.json();})
    .then(function(d){
      if(d.ok){SENTS.length=0;ns.forEach(function(s){SENTS.push(s);});done={};scores={};localStorage.setItem('pd','{}');localStorage.setItem('ps','{}');cur=0;render();document.getElementById('tmsg').textContent='Saved!';setTimeout(closeTeacher,2000);}
      else document.getElementById('tmsg').textContent='Error saving.';
    }).catch(function(e){document.getElementById('tmsg').textContent='Error: '+e.message;});
}
function closeTeacher(){document.getElementById('tov').style.display='none';history.replaceState({},'',window.location.pathname);}

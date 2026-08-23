// ============================================================================
// SPEECH RECORDER — platform adapter for mic capture + pronunciation scoring.
//
// This centralizes the getUserMedia -> MediaRecorder -> WAV encode -> /score-pron
// pipeline that used to be copy-pasted separately in js/warmup.js,
// beginner-player.html and travel-player.html. Callers keep their own target
// text, fuzzy-match function and post-score UI flow; this module only owns
// the platform-dependent recording + scoring mechanics.
//
// Usage:
//   var handle = SpeechRecorder.record({
//     apiBase: W, target: 'some phrase', fuzzyMatch: fz,
//     timeoutMs: 6000, minBytes: 800, logTag: 'player:rec',
//     onOpen: function(){}, onClose: function(){},
//     onDone: function(score, details){ ... }
//   });
//   handle.stop(); // force-stop early (or triggers onDone(0) if not recording)
// ============================================================================
(function(){

  function pickMime(){
    var candidates=['audio/mp4','audio/webm;codecs=opus','audio/webm','audio/ogg;codecs=opus','audio/ogg'];
    for(var i=0;i<candidates.length;i++){
      if(typeof MediaRecorder!=='undefined' && MediaRecorder.isTypeSupported(candidates[i])) return candidates[i];
    }
    return '';
  }

  function blobToWavB64(blob,cb){
    var fr=new FileReader();
    fr.onloadend=function(){
      try{
        var actx=new (window.AudioContext||window.webkitAudioContext)({sampleRate:16000});
        actx.decodeAudioData(fr.result,function(decoded){
          try{
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
              cb(null,btoa(wstr));
            }).catch(function(e){cb(e);});
          }catch(e){cb(e);}
        },function(e){cb(e||new Error('decodeAudioData failed'));});
      }catch(e){cb(e);}
    };
    fr.readAsArrayBuffer(blob);
  }

  // Blend word-match against the API's acoustic accuracy score. If the words
  // clearly don't match the target, don't let a high acoustic score (on the
  // wrong words) pass — same rule used at every call site before the refactor.
  function scoreFromPronunciation(pron,target,fuzzyMatch,tag){
    var heardText=(pron.words||[]).map(function(w){return w.word;}).join(' ');
    var wordMatch=fuzzyMatch(heardText,target);
    var acc=pron.accuracyScore||0;
    var s=wordMatch<50?Math.round(wordMatch):Math.round((wordMatch*0.4)+(acc*0.6));
    Log.d('['+tag+':checking] heard="'+heardText+'" target="'+target+'" wordMatch='+wordMatch+' accuracyScore='+acc+' -> finalScore='+s);
    return {score:s,heardText:heardText,wordMatch:wordMatch,accuracyScore:acc};
  }

  function scorePronunciation(blob,opts,cb){
    var tag=opts.logTag||'speech-recorder';
    blobToWavB64(blob,function(err,wavB64){
      if(err){ Log.e('['+tag+':score-pron] WAV encode ERROR '+(err&&err.message)); cb(0,{error:err}); return; }
      Log.d('['+tag+':score-pron] REQUEST target="'+opts.target+'" wavB64Len='+wavB64.length);
      fetch(opts.apiBase+'/score-pron',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({wavB64:wavB64})})
        .then(function(r){Log.d('['+tag+':score-pron] HTTP status='+r.status);return r.json();})
        .then(function(d){
          var pron=d&&d.pronunciation;
          if(!pron){Log.d('['+tag+':checking] no pronunciation data — treating as no speech detected');cb(0,{});return;}
          var res=scoreFromPronunciation(pron,opts.target,opts.fuzzyMatch,tag);
          cb(res.score,res);
        })
        .catch(function(err){Log.e('['+tag+':score-pron] ERROR '+(err&&err.message));cb(0,{error:err});});
    });
  }

  function record(opts){
    var tag=opts.logTag||'speech-recorder';
    var timeoutMs=opts.timeoutMs||6000;
    var minBytes=opts.minBytes==null?800:opts.minBytes;
    var onOpen=opts.onOpen||function(){};
    var onClose=opts.onClose||function(){};
    var onDone=opts.onDone||function(){};
    var mr=null,stream=null,chunks=[],done=false,timer=null,recording=false;

    function fin(score,details){
      if(done)return; done=true;
      if(timer){clearTimeout(timer);timer=null;}
      onDone(score,details||{});
    }

    navigator.mediaDevices.getUserMedia({audio:true}).then(function(s){
      Log.d('['+tag+':mic] OPEN — listening for speech');
      stream=s;chunks=[];recording=true;
      var mt=pickMime();
      mr=new MediaRecorder(stream,mt?{mimeType:mt}:{});
      onOpen();
      mr.ondataavailable=function(e){if(e.data&&e.data.size>0)chunks.push(e.data);};
      mr.onstop=function(){
        Log.d('['+tag+':mic] CLOSED');
        recording=false;
        try{stream.getTracks().forEach(function(t){t.stop();});}catch(e){}
        onClose();
        var m2=(mr&&mr.mimeType)||mt||'audio/webm';
        var blob=new Blob(chunks,{type:m2});
        if(blob.size<minBytes){
          Log.d('['+tag+':mic] DISCARDED recording — too short/silent (blobBytes='+blob.size+')');
          fin(0,{discarded:true});
          return;
        }
        Log.d('['+tag+':checking] analyzing recording... (blobBytes='+blob.size+')');
        scorePronunciation(blob,opts,function(s,details){fin(s,details);});
      };
      mr.start();
      timer=setTimeout(function(){
        Log.d('['+tag+':mic] auto-stop timeout ('+timeoutMs+'ms) reached');
        try{if(mr&&mr.state==='recording')mr.stop();}catch(e){}
      },timeoutMs);
    }).catch(function(e){
      Log.e('['+tag+':mic] FAILED to open name='+e.name+' message='+e.message);
      fin(0,{error:e,micFailed:true});
    });

    return {
      stop:function(){
        if(timer){clearTimeout(timer);timer=null;}
        if(mr&&mr.state==='recording'){ try{mr.stop();}catch(e){} }
        else if(!done && !recording){ fin(0,{}); }
      },
      isRecording:function(){ return recording; }
    };
  }

  window.SpeechRecorder={pickMime:pickMime,blobToWavB64:blobToWavB64,scorePronunciation:scorePronunciation,record:record};
})();

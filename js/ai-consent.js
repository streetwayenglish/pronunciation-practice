// AI Consent Dialog for Third-Party Speech Processing
// Required by Apple Guidelines 5.1.1(i) & 5.1.2(i)
window.AIConsent={
  show:function(onAccept,onDecline){
    if(localStorage.getItem('emma_ai_consent')==='granted'){onAccept();return;}
    if(document.getElementById('ai-consent-overlay'))return;
    var d=document.createElement('div');d.id='ai-consent-overlay';
    d.innerHTML='<div class="ai-consent-box"><h2>Voice Recording &amp; AI Processing</h2>'+
      '<p>Before you record, please review how Emma Speak uses your voice.</p>'+
      '<p><b>What data is sent:</b> Your voice audio recordings from pronunciation practice and AI conversations (and transcripts derived from that audio).</p>'+
      '<p><b>Who receives it:</b></p>'+
      '<ul style="margin:8px 0 8px 18px;padding:0;color:#333;font-size:15px;line-height:1.6;">'+
      '<li>Emma Speak cloud API (Cloudflare Worker)</li>'+
      '<li>Microsoft Azure Speech (pronunciation scoring)</li>'+
      '<li>Speech-to-text AI (transcription)</li>'+
      '<li>AI language model (conversation replies)</li>'+
      '<li>Avatar / voice providers when you use live avatar chat</li>'+
      '</ul>'+
      '<p><b>How it is used:</b> Speech-to-text, pronunciation scoring, and AI conversation responses for the feature you started. Audio is not sold or used for advertising.</p>'+
      '<p><b>Retention:</b> Audio is processed to provide your results. Providers may keep limited system logs for security and reliability.</p>'+
      '<p style="font-size:14px;color:#999;">You can decline and still browse the app. Without consent, voice features stay off. You can also revoke microphone access in iOS Settings.</p>'+
      '<div class="ai-consent-btns">'+
      '<button type="button" id="ai-decline" class="btn-sec">Decline</button>'+
      '<button type="button" id="ai-accept" class="btn-pri">I Understand &amp; Agree</button>'+
      '</div></div>';
    document.body.appendChild(d);
    document.getElementById('ai-accept').onclick=function(){
      localStorage.setItem('emma_ai_consent','granted');
      localStorage.setItem('emma_ai_consent_date',new Date().toISOString());
      document.body.removeChild(d);
      onAccept();
    };
    document.getElementById('ai-decline').onclick=function(){
      localStorage.setItem('emma_ai_consent','declined');
      document.body.removeChild(d);
      if(onDecline)onDecline();
    };
  },
  hasConsent:function(){return localStorage.getItem('emma_ai_consent')==='granted';},
  require:function(onAccept,onDecline){
    if(this.hasConsent()){onAccept();return;}
    this.show(onAccept,onDecline||function(){});
  }
};

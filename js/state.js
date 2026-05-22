// ============================================================================
// STATE — globals (W endpoint, SENTS, done/scores, mode, audio caches)
// ============================================================================
var W='https://billowing-sunset-c961.lucaswassup.workers.dev';
var SENTS=[
  "She walked to the market yesterday.",
  "He talked to his teacher after class.",
  "They stopped at the traffic light.",
  "She washed the dishes last night.",
  "He missed the bus this morning.",
  "The dog jumped over the fence.",
  "She pushed the door and walked in.",
  "He looked at the map and stopped.",
  "They watched a movie and laughed.",
  "She helped her friend and walked home."
];
var done=JSON.parse(localStorage.getItem('pd')||'{}');
var appMode='emma';var mcCur=0;var mcAudio=null;var mcScores=[];
var emmaHistory=[];var emmaAudio=null;var emmaRec=false;var emmaMr=null;var emmaChunks=[];var emmaTopic='';
var scores=JSON.parse(localStorage.getItem('ps')||'{}');
var cur=0,mr=null,chunks=[],rec=false,laudio=null,mt='';

// Audio cache for pronunciation tab — preloaded when tab opens
var _sentAudioCache={};
var _sentAudioLoading={};

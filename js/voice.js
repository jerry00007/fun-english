// voice.js — US/UK TTS accent engine + WebAudio ding + iOS audio compatibility layer.

const ACCENTS = {
  us:{ lang:"en-US", names:["google us english","samantha","ava","aria","jenny","zira","allison","susan","victoria","catherine"] },
  uk:{ lang:"en-GB", names:["google uk english female","karen","moira","tessa","serena","kate","libby","sonia","martha","fiona"] }
};

let actx, iosUnlocked = false;

/* ===== 预生成童声音频索引（美音Ana/英音Maisie，-15%慢速）=====
   key = md5(文本)前16位。运行时优先播 mp3，无匹配回退系统 TTS。 */
const TTS_INDEX = (window.TTS_MANIFEST || null);

const hashText = (() => {
  // 与 Python hashlib.md5 结果一致的轻量 md5（仅用于查表，无需加密强度）
  function md5(s){
    function rl(n,c){return (n<<c)|(n>>>(32-c));}
    function au(x,y){let l=(x&0xFFFF)+(y&0xFFFF),m=(x>>16)+(y>>16)+(l>>16);return (m<<16)|(l&0xFFFF);}
    function ad(x,y){return au(x,y);}
    function cmn(q,a,b,x,s,t){return ad(rl(ad(ad(a,q),ad(x,t)),s),b);}
    function ff(a,b,c,d,x,s,t){return cmn((b&c)|((~b)&d),a,b,x,s,t);}
    function gg(a,b,c,d,x,s,t){return cmn((b&d)|(c&(~d)),a,b,x,s,t);}
    function hh(a,b,c,d,x,s,t){return cmn(b^c^d,a,b,x,s,t);}
    function ii(a,b,c,d,x,s,t){return cmn(c^(b|(~d)),a,b,x,s,t);}
    function sb(A,i,n){return (A[i>>2]|0) + (n<<((i%4)*8));}
    function cv(A,i,n){A[i>>2]=(A[i>>2]|0)|(n<<((i%4)*8));}
    function uk(s){
      const n=((s.length+8)>>6)+1, b=new Array(n*16).fill(0);
      for(let i=0;i<s.length;i++) cv(b,i,s.charCodeAt(i));
      cv(b,s.length,0x80);
      cv(b,s.length*8,0); // 简化：长度<2^32
      return b;
    }
    let x=uk(s), a=1732584193,b=-271733879,c=-1732584194,d=271733878;
    for(let i=0;i<x.length;i+=16){
      const oa=a,ob=b,oc=c,od=d;
      a=ff(a,b,c,d,sb(x,i),7,-680876936);d=ff(d,a,b,c,sb(x,i+1),12,-389564586);c=ff(c,d,a,b,sb(x,i+2),17,606105819);b=ff(b,c,d,a,sb(x,i+3),22,-1044525330);
      a=ff(a,b,c,d,sb(x,i+4),7,-176418897);d=ff(d,a,b,c,sb(x,i+5),12,1200080426);c=ff(c,d,a,b,sb(x,i+6),17,-1473231341);b=ff(b,c,d,a,sb(x,i+7),22,-45705983);
      a=ff(a,b,c,d,sb(x,i+8),7,1770035416);d=ff(d,a,b,c,sb(x,i+9),12,-1958414417);c=ff(c,d,a,b,sb(x,i+10),17,-42063);b=ff(b,c,d,a,sb(x,i+11),22,-1990404162);
      a=ff(a,b,c,d,sb(x,i+12),7,1804603682);d=ff(d,a,b,c,sb(x,i+13),12,-40341101);c=ff(c,d,a,b,sb(x,i+14),17,-1502002290);b=ff(b,c,d,a,sb(x,i+15),22,1236535329);
      a=gg(a,b,c,d,sb(x,i+1),5,-165796510);d=gg(d,a,b,c,sb(x,i+6),9,-1069501632);c=gg(c,d,a,b,sb(x,i+11),14,643717713);b=gg(b,c,d,a,sb(x,i),20,-373897302);
      a=gg(a,b,c,d,sb(x,i+5),5,-701558691);d=gg(d,a,b,c,sb(x,i+10),9,38016083);c=gg(c,d,a,b,sb(x,i+15),14,-660478335);b=gg(b,c,d,a,sb(x,i+4),20,-405537848);
      a=gg(a,b,c,d,sb(x,i+9),5,568446438);d=gg(d,a,b,c,sb(x,i+14),9,-1019803690);c=gg(c,d,a,b,sb(x,i+3),14,-187363961);b=gg(b,c,d,a,sb(x,i+8),20,1163531501);
      a=gg(a,b,c,d,sb(x,i+13),5,-1444681467);d=gg(d,a,b,c,sb(x,i+2),9,-51403784);c=gg(c,d,a,b,sb(x,i+7),14,1735328473);b=gg(b,c,d,a,sb(x,i+12),20,-1926607734);
      a=hh(a,b,c,d,sb(x,i+5),4,-378558);d=hh(d,a,b,c,sb(x,i+8),11,-2022574463);c=hh(c,d,a,b,sb(x,i+11),16,1839030562);b=hh(b,c,d,a,sb(x,i+14),23,-35309556);
      a=hh(a,b,c,d,sb(x,i+1),4,-1530992060);d=hh(d,a,b,c,sb(x,i+4),11,1272893353);c=hh(c,d,a,b,sb(x,i+7),16,-155497632);b=hh(b,c,d,a,sb(x,i+10),23,-1094730640);
      a=hh(a,b,c,d,sb(x,i+13),4,681279174);d=hh(d,a,b,c,sb(x,i),11,-358537222);c=hh(c,d,a,b,sb(x,i+3),16,-722521979);b=hh(b,c,d,a,sb(x,i+6),23,76029189);
      a=hh(a,b,c,d,sb(x,i+9),4,-640364487);d=hh(d,a,b,c,sb(x,i+12),11,-421815835);c=hh(c,d,a,b,sb(x,i+15),16,530742520);b=hh(b,c,d,a,sb(x,i+2),23,-995338651);
      a=ii(a,b,c,d,sb(x,i),6,-198630844);d=ii(d,a,b,c,sb(x,i+7),10,1126891415);c=ii(c,d,a,b,sb(x,i+14),15,-1416354905);b=ii(b,c,d,a,sb(x,i+5),21,-57434055);
      a=ii(a,b,c,d,sb(x,i+12),6,1700485571);d=ii(d,a,b,c,sb(x,i+3),10,-1894986606);c=ii(c,d,a,b,sb(x,i+10),15,-1051523);b=ii(b,c,d,a,sb(x,i+1),21,-2054922799);
      a=ii(a,b,c,d,sb(x,i+8),6,1873313359);d=ii(d,a,b,c,sb(x,i+15),10,-30611744);c=ii(c,d,a,b,sb(x,i+6),15,-1560198380);b=ii(b,c,d,a,sb(x,i+13),21,1309151649);
      a=ii(a,b,c,d,sb(x,i+4),6,-145523070);d=ii(d,a,b,c,sb(x,i+11),10,-1120210379);c=ii(c,d,a,b,sb(x,i+2),15,718787259);b=ii(b,c,d,a,sb(x,i+9),21,-343485551);
      a=ad(a,oa);b=ad(b,ob);c=ad(c,oc);d=ad(d,od);
    }
    const hx=n=>{let s='';for(let i=3;i>=0;i--)s+=((n>>(i*8))&0xFF).toString(16).padStart(2,'0');return s;};
    return hx(a)+hx(b)+hx(c)+hx(d);
  }
  return t => md5(String(t)).slice(0,16);
})();

const Voice = {
  accent: "us",
  degraded: false,
  picked: null,

  resolve(accent){
    this.picked = null;
    this.degraded = false;
    if(!window.speechSynthesis){ this.degraded = true; return null; }
    const cfg = ACCENTS[accent] || ACCENTS.us;
    const want = cfg.lang.toLowerCase();
    const matches = speechSynthesis.getVoices().filter(v =>
      v.lang && v.lang.toLowerCase().replace("_","-").startsWith(want)
    );
    if(!matches.length){ this.degraded = true; return null; }
    const score = v => {
      const n = (v.name || "").toLowerCase();
      let s = 0;
      cfg.names.forEach((name, i) => { if(n.includes(name)) s = Math.max(s, cfg.names.length - i); });
      return s;
    };
    matches.sort((a,b) => score(b) - score(a));
    this.picked = matches[0];
    return this.picked;
  },

  init(){
    let saved = "us";
    try{ saved = localStorage.getItem("cwd_accent") || "us"; }catch(e){}
    this.accent = saved === "uk" ? "uk" : "us";
    this.resolve(this.accent);
    if(window.speechSynthesis){
      speechSynthesis.onvoiceschanged = () => {
        this.resolve(this.accent);
        window.refreshAccentUI?.();
      };
    }
    window.refreshAccentUI?.();
  },

  setAccent(a){
    if(a !== "us" && a !== "uk") return;
    this.accent = a;
    this.resolve(a);
    try{ localStorage.setItem("cwd_accent", a); }catch(e){}
    window.refreshAccentUI?.();
    if(this.degraded){
      window.showToast?.("当前设备没有找到英音语音，已用默认发音 🙈");
    }else{
      this.speak("Hello!");
    }
  },

  speak(text, {rate = 0.62, pitch = 1.12, onend} = {}){
    if(text == null || !String(text).trim()){ if(onend) onend(); return; }
    // 优先播预生成童声（纯英文短句才走这条路）
    if(this.playCached(String(text), onend)) return;
    if(!window.speechSynthesis){ if(onend) onend(); return; }
    try{ speechSynthesis.cancel(); }catch(e){}
    // iOS 兼容：utterance 必须保持在用户手势的同步调用栈内，异步 setTimeout 会被静默拒绝
    const u = new SpeechSynthesisUtterance(String(text));
    if(this.picked) u.voice = this.picked;
    else u.lang = (ACCENTS[this.accent] || ACCENTS.us).lang;
    u.rate = rate;
    u.pitch = pitch;
    if(onend) u.onend = onend;
    try{ speechSynthesis.speak(u); }catch(e){ if(onend) onend(); }
  },

  // 预生成音频播放：命中 manifest → new Audio 播放。返回 true 表示已处理。
  playCached(text, onend){
    const M = window.TTS_MANIFEST;
    if(!M || !/^[\x00-\x7F]+$/.test(text)) return false;
    const h = M[text];
    if(!h) return false;
    try{
      if(this._audio){ try{ this._audio.pause(); }catch(e){} }
      const a = new Audio("assets/audio/" + this.accent + "/" + h + ".mp3");
      this._audio = a;
      a.onended = () => { if(onend) onend(); };
      a.onerror = () => { this._speakFallback(text, onend); };
      a.play().catch(() => this._speakFallback(text, onend));
      return true;
    }catch(e){ return false; }
  },

  _speakFallback(text, onend){
    if(!window.speechSynthesis){ if(onend) onend(); return; }
    try{ speechSynthesis.cancel(); }catch(e){}
    const u = new SpeechSynthesisUtterance(text);
    if(this.picked) u.voice = this.picked;
    else u.lang = (ACCENTS[this.accent] || ACCENTS.us).lang;
    u.rate = 0.55; u.pitch = 1.12;
    if(onend) u.onend = onend;
    try{ speechSynthesis.speak(u); }catch(e){ if(onend) onend(); }
  },

  // 单字母 → 近似音素的可发音文本（TTS 直接读字母名是 /ɑːr/ 而非音素 /rə/，这是拼读教学的关键修正）
  speakSound(part, {rate = 0.42, pitch = 1.05, onend} = {}){
    const hints = {
      a:"ah", b:"buh", c:"kuh", d:"duh", e:"eh", f:"ff", g:"guh", h:"huh", i:"ih",
      j:"juh", k:"kuh", l:"ul", m:"mm", n:"nn", o:"ah", p:"puh", q:"kwa", r:"rah",
      s:"ss", t:"tuh", u:"uh", v:"vv", w:"wuh", x:"ks", y:"yuh", z:"zz"
    };
    const t = hints[String(part).toLowerCase()] || part;
    this.speak(t, {rate, pitch, onend});
  },

  ding(good = true){
    try{
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const notes = good ? [523.25, 659.25, 783.99] : [330, 262]; // C5-E5-G5 / E4-C4
      notes.forEach((f, i) => {
        const o = actx.createOscillator(), g = actx.createGain();
        o.type = "sine"; o.frequency.value = f;
        g.gain.setValueAtTime(0.001, actx.currentTime + i*0.12);
        g.gain.exponentialRampToValueAtTime(0.25, actx.currentTime + i*0.12 + 0.02);
        g.gain.exponentialRampToValueAtTime(0.001, actx.currentTime + i*0.12 + 0.34);
        o.connect(g); g.connect(actx.destination);
        o.start(actx.currentTime + i*0.12); o.stop(actx.currentTime + i*0.12 + 0.4);
      });
    }catch(e){}
  }
};

/* ===== iOS audio unlock: first user gesture resumes AudioContext + primes TTS ===== */
function unlockAudio(){
  if(iosUnlocked) return;
  iosUnlocked = true;
  try{
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if(actx.state === "suspended") actx.resume();
  }catch(e){}
  try{ speechSynthesis.speak(new SpeechSynthesisUtterance("")); }catch(e){}
  try{ speechSynthesis.cancel(); }catch(e){}
}
document.addEventListener("touchstart", unlockAudio, {once:true, passive:true});
document.addEventListener("click", unlockAudio, {once:true});

/* ===== iOS speechSynthesis keepalive: random pause bug, wake every 15s and on foreground ===== */
setInterval(() => {
  if(window.speechSynthesis && speechSynthesis.speaking){
    try{ speechSynthesis.resume(); }catch(e){}
  }
}, 15000);

document.addEventListener("visibilitychange", () => {
  if(!document.hidden && window.speechSynthesis){
    try{ speechSynthesis.resume(); }catch(e){}
  }
});

/* ===== Block iOS double-tap zoom / pinch zoom / rubber-band ===== */
let lastTouchEnd = 0;
document.addEventListener("touchend", e => {
  const now = Date.now();
  if(now - lastTouchEnd <= 300){ e.preventDefault(); }
  lastTouchEnd = now;
}, false);
document.addEventListener("touchmove", e => {
  if(e.touches.length > 1) e.preventDefault();
}, {passive:false});
document.addEventListener("gesturestart", e => e.preventDefault());
document.addEventListener("dblclick", e => e.preventDefault());

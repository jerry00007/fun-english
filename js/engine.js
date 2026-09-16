// engine.js — course runtime: six modes (words/phonics/read/talk/game/quiz) + star bar + done view.
// Globals used (load order): data.js(COURSES) → voice.js(Voice) → engine.js → app.js(Progress/showToast at runtime).

const MODE_LABELS = {
  words:  "🃏 Words 单词",
  flash:  "👀 Flash 认词",
  phonics:"🔤 Phonics 拼读",
  read:   "📖 Read 点读",
  talk:   "🗣️ Talk 对话",
  game:   "🎮 Game 游戏",
  quiz:   "👂 Quiz 测验",
  trace:  "✏️ Trace 描红"
};
const PRAISES = ["Great! 太棒了，汤圆！", "Awesome! Kiki 真棒！", "Wonderful! 汤圆好厉害！", "Nice job! Kiki 做得好！", "Super! 汤圆超级棒！"];

// 每个模式的星星池（star pool）：一个模式最多可得几颗星。
// 课件总星数 = 其 modes 的池子之和（app.js 迁移/汇总也读这张表）。
const MODE_STARS = { words:3, flash:1, read:2, talk:2, phonics:2, trace:2, game:2, quiz:2 };
const CONF_COLORS = ["#FFC93C", "#FF6B6B", "#4ECDC4", "#95E06C", "#A78BFA"];

function shuffle(arr){
  const a = [...arr];
  for(let i = a.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function rainConfetti(){
  for(let i = 0; i < 90; i++){
    const c = document.createElement("div");
    c.className = "confetti";
    const size = 8 + Math.random() * 10;
    c.style.left = Math.random() * 100 + "vw";
    c.style.width = c.style.height = size + "px";
    c.style.background = CONF_COLORS[i % CONF_COLORS.length];
    c.style.animationDuration = 2.4 + Math.random() * 2 + "s";
    c.style.animationDelay = Math.random() * 0.8 + "s";
    if(i % 3 === 0) c.style.borderRadius = "50%";
    document.body.appendChild(c);
    c.addEventListener("animationend", () => c.remove());
  }
  setTimeout(() => document.querySelectorAll(".confetti").forEach(el => el.remove()), 7000);
}

const Engine = {
  course: null, mode: null, timers: [], gen: 0,
  stars: {}, sessionDone: new Set(), awarded: new Set(),

  get total(){
    if(!this.course) return 0;
    return this.course.modes.reduce((s, m) => s + (MODE_STARS[m] || 0), 0);
  },

  starSum(){
    return Object.values(this.stars || {}).reduce((s, n) => s + (n || 0), 0);
  },

  /* ===== lifecycle ===== */

  start(courseId){
    const course = COURSES.find(c => c.id === courseId);
    if(!course){ location.hash = "#/"; return; }
    this.course = course;
    this.sessionDone = new Set();
    this.awarded = new Set();
    const rec = Progress.get(courseId);
    // 未完成课件：续上各模式已得星星；已完成：从头再来
    this.stars = rec && !rec.done ? { ...(rec.modes || {}) } : {};
    const startMode = rec && !rec.done && course.modes.includes(rec.lastMode)
      ? rec.lastMode : course.modes[0];
    document.getElementById("modeContainer").style.background = course.bg || "";
    this.renderTabs();
    this.renderStars();
    this.switchMode(startMode);
  },

  stop(){
    this.clearTimers();
    try{ speechSynthesis.cancel(); }catch(e){}
    this.course = null; this.mode = null; this.gen++;
    document.querySelectorAll(".confetti").forEach(el => el.remove());
  },

  restart(){
    if(!this.course) return;
    this.stars = {};
    this.sessionDone = new Set();
    this.awarded = new Set();
    this.renderStars();
    this.switchMode(this.course.modes[0]);
  },

  switchMode(mode){
    if(!this.course || !this.course.modes.includes(mode)) return;
    this.clearTimers();
    try{ speechSynthesis.cancel(); }catch(e){}
    this.gen++;
    this.mode = mode;
    Progress.update(this.course.id, { lastMode: mode, modes: { ...this.stars } });
    this.renderTabs();
    const box = document.getElementById("modeContainer");
    box.innerHTML = "";
    box.onclick = null;
    const renderer = {
      words: this.mWords, flash: this.mFlash, phonics: this.mPhonics, read: this.mRead,
      talk: this.mTalk, game: this.mGame, quiz: this.mQuiz, trace: this.mTrace
    }[mode];
    if(renderer) renderer.call(this, box);
  },

  later(fn, ms){
    const t = setTimeout(() => {
      this.timers = this.timers.filter(x => x !== t);
      fn();
    }, ms);
    this.timers.push(t);
    return t;
  },
  clearTimers(){
    this.timers.forEach(clearTimeout);
    this.timers = [];
  },

  /* ===== chrome ===== */

  renderTabs(){
    document.getElementById("modeTabs").innerHTML = this.course.modes.map(m =>
      `<button type="button" class="tab${m === this.mode ? " on" : ""}" data-mode="${m}">${MODE_LABELS[m] || m}</button>`
    ).join("");
  },

  renderStars(popIndex){
    const total = this.total;
    const lit = this.starSum();
    document.getElementById("starIcons").innerHTML = Array.from({length: total}, (_, i) =>
      `<span class="star${i < lit ? " lit" : ""}">⭐</span>`
    ).join("");
    document.getElementById("starCount").textContent = Math.min(lit, total) + "/" + total;
    if(typeof popIndex === "number"){
      const el = document.getElementById("starIcons").children[popIndex];
      if(el) this.later(() => el.classList.add("lit"), 60);
    }
  },

  addStar(){
    if(!this.course || !this.mode) return;
    const cap = MODE_STARS[this.mode] || 0;
    if((this.stars[this.mode] || 0) >= cap) return;
    this.stars[this.mode] = (this.stars[this.mode] || 0) + 1;
    this.renderStars(this.starSum() - 1);
    Progress.update(this.course.id, { modes: { ...this.stars }, lastMode: this.mode });
  },

  praise(){ return PRAISES[Math.floor(Math.random() * PRAISES.length)]; },

  complete(mode){
    if(!this.course) return;
    this.sessionDone.add(mode);
    const next = this.course.modes.find(m => m !== mode && !this.sessionDone.has(m));
    if(mode === "quiz" || !next){ this.renderDone(); return; }
    Voice.ding(true);
    showToast(this.praise());
    const g = this.gen;
    this.later(() => { if(this.course && this.gen === g) this.switchMode(next); }, 1600);
  },

  renderDone(){
    const c = this.course;
    if(!c) return;
    this.clearTimers();
    try{ speechSynthesis.cancel(); }catch(e){}
    this.gen++;
    this.mode = null;
    this.renderTabs();
    Progress.update(c.id, { done: true, modes: { ...this.stars }, ts: Date.now() });
    const next = Progress.nextCourse(c.id);
    const box = document.getElementById("modeContainer");
    box.innerHTML = `
      <div class="done-wrap">
        <div class="done-trophy">🏆</div>
        <div class="done-title">Amazing, Kiki! 汤圆太棒了！</div>
        <div class="done-sub">You finished ${c.title}! 汤圆完成了《${c.zhTitle}》</div>
        <div class="done-emoji-row">${c.words.map(w => w.emoji).join("")}</div>
        <div class="done-actions">
          <button type="button" class="big-btn alt" data-act="home">🏠 Home 回首页</button>
          <button type="button" class="big-btn" data-act="again">🔁 Again 再玩一次</button>
          ${next ? `<button type="button" class="big-btn grass" data-act="next">➡️ Next 下一课</button>` : ""}
        </div>
      </div>`;
    box.onclick = e => {
      const btn = e.target.closest("[data-act]");
      if(!btn) return;
      if(btn.dataset.act === "home") location.hash = "#/";
      else if(btn.dataset.act === "again") this.restart();
      else if(btn.dataset.act === "next" && next) location.hash = "#/course/" + next.id;
    };
    rainConfetti();
    this.later(() => Voice.speak("Wow! You did it, Kiki! Great job!", { rate: 0.7 }), 700);
  },

  /* ===== mode: words 单词 ===== */

  mWords(box){
    const c = this.course;
    const said = new Set();
    box.innerHTML = `<div class="card-grid">${c.words.map((w, i) => `
      <button type="button" class="word-card" data-i="${i}" style="animation-delay:${i * 70}ms">
        <div class="emoji">${w.emoji}</div>
        <div class="word">${w.en}</div>
        <div class="zh">${w.zh}</div>
      </button>`).join("")}</div>`;
    box.onclick = e => {
      const card = e.target.closest(".word-card");
      if(!card) return;
      const w = c.words[+card.dataset.i];
      card.classList.remove("said"); void card.offsetWidth; card.classList.add("said");
      // 数字等 noThe 词条不加 The（"The one" 语法不对），其余读 "The ___." 短语两遍
      const say2 = w.noThe ? `${w.en}. ${w.en}.` : `The ${w.en}. The ${w.en}.`;
      Voice.speak(say2, { rate: 0.55 });
      if(!said.has(w.en)){
        said.add(w.en);
        if(!this.awarded.has("words:" + w.en)){
          this.awarded.add("words:" + w.en);
          this.addStar();
        }
        if(said.size === c.words.length){
          this.later(() => { if(this.mode === "words") this.complete("words"); }, 1400);
        }
      }
    };
    this.later(() => Voice.speak("Tap the cards! 点一点，读一读！", { rate: 0.65 }), 500);
  },

  /* ===== mode: flash 认词（看词选图，无声音提示，考察认读） ===== */

  mFlash(box){
    const c = this.course;
    let qi = 0;
    const render = () => {
      const w = c.words[qi];
      const others = shuffle(c.words.filter(x => x.en !== w.en)).slice(0, Math.min(3, c.words.length - 1));
      const opts = shuffle([w, ...others]);
      box.innerHTML = `
        <div class="quiz-box">
          <div class="quiz-progress">Word ${qi + 1} / ${c.words.length}</div>
          <div class="quiz-q">👀 认一认，选图片！Read & tap!</div>
          <div class="flash-word">${w.en}</div>
          <div class="quiz-opts">${opts.map(o =>
            `<button type="button" class="quiz-opt pic" data-word="${o.en}">${o.emoji}</button>`).join("")}</div>
          <button type="button" class="flash-help">🤔 不会读？点我听一听</button>
        </div>`;
    };
    render();
    box.onclick = e => {
      if(e.target.closest(".flash-help")){
        Voice.speak(c.words[qi].en, { rate: 0.5 });
        return;
      }
      const opt = e.target.closest(".quiz-opt");
      if(!opt || opt.classList.contains("right")) return;
      const w = c.words[qi];
      if(opt.dataset.word === w.en){
        opt.classList.add("right");
        Voice.ding(true);
        Voice.speak(w.en, { rate: 0.6 });
        if(!this.awarded.has("flash:" + w.en)){
          this.awarded.add("flash:" + w.en);
          this.addStar();
        }
        qi++;
        if(qi >= c.words.length){
          this.later(() => { if(this.mode === "flash") this.complete("flash"); }, 1100);
          return;
        }
        this.later(render, 1200);
      }else{
        opt.classList.add("wrong");
        Voice.ding(false);
        showToast("Look again! 再看一看！");
        this.later(() => opt.classList.remove("wrong"), 600);
      }
    };
  },

  /* ===== mode: phonics 自然拼读 ===== */

  mPhonics(box){
    const c = this.course;
    const first = c.words[0];
    const blended = new Set();
    box.innerHTML = `
      <div class="phonic-hint">👆 点卡片听拼读 ${c.sound || ""}：${first.parts.join(" · ")} · ${first.en}!</div>
      <div class="phonic-grid">${c.words.map((w, i) => `
        <button type="button" class="phonic-card" data-i="${i}" style="animation-delay:${i * 90}ms">
          <div class="letter-blocks">${w.parts.map((p, j) =>
            `<span class="lb ${j === 0 ? "onset" : "rime"}">${p}</span>`).join("")}</div>
          <div class="phonic-emoji">${w.emoji}</div>
          <div class="phonic-word">${w.en}</div>
          <div class="phonic-zh">${w.zh}</div>
        </button>`).join("")}</div>`;
    let busy = false;
    box.onclick = e => {
      const card = e.target.closest(".phonic-card");
      if(!card || busy) return;
      const w = c.words[+card.dataset.i];
      busy = true;
      this.readParts(card, w, () => {
        busy = false;
        card.classList.add("blended");
        if(!blended.has(w.en)){
          blended.add(w.en);
          if(!this.awarded.has("phonics:" + w.en)){
            this.awarded.add("phonics:" + w.en);
            this.addStar();
          }
          if(blended.size === c.words.length){
            this.later(() => { if(this.mode === "phonics") this.complete("phonics"); }, 1500);
          }
        }
      });
    };
  },

  readParts(card, w, done){
    const gen = this.gen;
    const lbs = [...card.querySelectorAll(".lb")];
    // blending 链：音素分读（字母名→音素修正）→ 含元音的 rime 连读 → 慢速整词 → 常速整词
    const steps = [];
    steps.push({ hi: [0], run: onend => Voice.speakSound(w.parts[0], { onend }) });
    if(/[aeiou]/.test(w.parts[1] || "")){
      steps.push({ hi: [1], run: onend => Voice.speakSound(w.parts[1], { rate: 0.5, onend }) });
    }
    steps.push({ hi: [0, 1], run: onend => Voice.speak(w.en, { rate: 0.3, onend }) });
    steps.push({ hi: [0, 1], run: onend => Voice.speak(w.en, { rate: 0.62, onend }) });
    const step = i => {
      if(gen !== this.gen || !this.course) return;
      if(i >= steps.length){
        lbs.forEach(lb => lb.classList.remove("active"));
        done();
        return;
      }
      lbs.forEach((lb, j) => lb.classList.toggle("active", steps[i].hi.includes(j)));
      let fin = false;
      const next = () => { if(fin) return; fin = true; step(i + 1); };
      steps[i].run(next);
      this.later(next, 1400); // watchdog：onend 丢失时兜底
    };
    step(0);
  },

  /* ===== mode: read 点读书 ===== */

  mRead(box){
    const c = this.course;
    const tpl = (c.story && c.story.template) || "the-noun";
    const page = { i: 0 };
    const listened = new Set();

    const pages = (c.story && c.story.pages) || null;   // 自定义绘本页（数数课）
    const total = pages ? pages.length : c.words.length;
    const tokensOf = i => {
      if(pages) return pages[i].text.split(" ");
      const w = c.words[i];
      return tpl === "i-see"   ? ["I", "see", "a", w.en, "."] :
             tpl === "it-is-a" ? ["It", "is", "a", w.en, "."] :
                                 ["The", w.en, "."];
    };
    // 合并句末标点到前一个词的 span，避免 flex gap 把句号甩出去
    const renderTokens = i => {
      const targetEn = pages ? null : c.words[i].en;
      const spans = [];
      tokensOf(i).forEach(t => {
        if(t === "." && spans.length){ spans[spans.length - 1].text += "."; }
        else spans.push({ text: t, say: t });
      });
      return spans.map(s =>
        `<span class="s-word${targetEn && s.say === targetEn ? " target" : ""}" data-say="${s.say}">${s.text}</span>`
      ).join(" ");
    };

    const render = () => {
      const emojiHTML = pages ? pages[page.i].emojis : c.words[page.i].emoji;
      box.innerHTML = `
        <div class="book">
          <div class="page-tag">📖 Page ${page.i + 1}/${total}</div>
          <div class="story-emoji${pages ? " story-row" : ""}">${emojiHTML}</div>
          <div class="sentence">${renderTokens(page.i)}</div>
        </div>
        <div class="nav-row">
          <button type="button" class="nav-arrow" data-nav="-1">◀</button>
          <button type="button" class="listen-btn">🔊 Listen 听一听</button>
          <button type="button" class="nav-arrow" data-nav="1">▶</button>
        </div>
        <div class="page-dots">${Array.from({length: total}, (_, i) =>
          `<span class="dot${i === page.i ? " on" : ""}"></span>`).join("")}</div>`;
    };
    render();

    const readSentence = () => {
      const gen = this.gen;
      listened.add(page.i);
      const spans = [...box.querySelectorAll(".s-word")];
      const full = spans.map(s => s.dataset.say).join(" ");
      spans.forEach(s => s.classList.remove("hl"));
      // 整句连读：一次 utterance 读完整句，语速自然连贯（iOS 兼容：同步 speak）
      Voice.speak(full, { rate: 0.55, onend: () => {
        if(gen !== this.gen || !this.course) return;
        spans.forEach(s => s.classList.remove("hl"));
        if(page.i === total - 1 && listened.size === total){
          this.later(() => { if(this.mode === "read") this.complete("read"); }, 800);
        }
      }});
      // 卡拉OK高亮：按单词长度估算读到的位置（TTS 无词级事件，估算即可，误差不影响教学）
      const rate = 0.55, overhead = 350;
      let t = overhead;
      spans.forEach((s, i) => {
        const dur = 90 + s.dataset.say.length * 230 / rate;
        this.later(() => {
          if(gen !== this.gen || !this.course) return;
          spans.forEach(x => x.classList.remove("hl"));
          spans[i].classList.add("hl");
        }, t);
        t += dur;
      });
    };

    box.onclick = e => {
      const sw = e.target.closest(".s-word");
      if(sw){ Voice.speak(sw.dataset.say, { rate: 0.55 }); return; }
      if(e.target.closest(".story-emoji") || e.target.closest(".listen-btn")){ readSentence(); return; }
      const nav = e.target.closest(".nav-arrow");
      if(nav){
        const d = +nav.dataset.nav;
        if(page.i === total - 1 && d === 1){ this.complete("read"); return; }
        page.i = (page.i + d + total) % total;
        render();
        this.later(readSentence, 350);
      }
    };
    this.later(readSentence, 600);
  },

  /* ===== mode: talk 对话 ===== */

  mTalk(box){
    const c = this.course;
    if(c.talkPairs && c.talkPairs.length) return this.mTalkPairs(box);
    const st = { p: 0, w: 0, q: false, a: false };
    const doneWords = new Set();
    const cap = s => s.charAt(0).toUpperCase() + s.slice(1);
    const fill = (tpl, w, capIt) => tpl.replace(/\{word\}/g, capIt ? cap(w.en) : w.en);

    const render = () => {
      const pat = c.patterns[st.p], w = c.words[st.w];
      const qShow = fill(pat.q, w, true), qSay = fill(pat.q, w, false), aTxt = fill(pat.a, w, false);
      box.innerHTML = `
        <div class="talk-wrap">
          <button type="button" class="talk-pattern-label" data-cycle="1">🗣️ 句型 ${st.p + 1} / ${c.patterns.length}（点我换句型）</button>
          <div class="talk-card">
            <div class="talk-emoji">${w.emoji}</div>
            <button type="button" class="bubble q" data-say="${qSay}">❓ ${qShow}</button>
            <button type="button" class="bubble a" data-say="${aTxt}">💬 ${aTxt}</button>
          </div>
          <div class="nav-row">
            <button type="button" class="nav-arrow" data-nav="-1">◀</button>
            <button type="button" class="listen-btn">🔊 Next word 下一个</button>
            <button type="button" class="nav-arrow" data-nav="1">▶</button>
          </div>
          <div class="page-dots talk-dots">${c.words.map((_, i) =>
            `<span class="dot${i === st.w ? " on" : ""}"></span>`).join("")}</div>
        </div>`;
    };
    render();

    const resetWord = () => { st.q = false; st.a = false; };
    const curPatternAllDone = () => c.words.every(w => doneWords.has(st.p + ":" + w.en));
    const otherPatternRemains = () => c.patterns.length > 1 &&
      c.words.some(w => !doneWords.has((1 - st.p) + ":" + w.en));

    const markDone = () => {
      if(!(st.q && st.a)) return;
      const w = c.words[st.w];
      const key = st.p + ":" + w.en;
      const isNew = !doneWords.has(key);
      doneWords.add(key);
      if(isNew && !this.awarded.has("talk:" + w.en)){
        this.awarded.add("talk:" + w.en);
        this.addStar();
      }
      Voice.ding(true);
      if(curPatternAllDone()){
        if(otherPatternRemains()){
          showToast("换个句型再说一说！Try the other pattern! 🗣️");
          this.later(() => {
            if(this.mode !== "talk") return;
            st.p = 1 - st.p; st.w = 0; resetWord(); render();
          }, 1400);
        }else{
          this.later(() => { if(this.mode === "talk") this.complete("talk"); }, 1400);
        }
      }else{
        this.later(() => {
          if(this.mode !== "talk") return;
          st.w = (st.w + 1) % c.words.length; resetWord(); render();
        }, 1200);
      }
    };

    box.onclick = e => {
      const b = e.target.closest(".bubble");
      if(b){
        b.classList.remove("said"); void b.offsetWidth; b.classList.add("said");
        Voice.speak(b.dataset.say, { rate: 0.6 });
        if(b.classList.contains("q")) st.q = true; else st.a = true;
        markDone();
        return;
      }
      if(e.target.closest("[data-cycle]")){
        st.p = (st.p + 1) % c.patterns.length; st.w = 0; resetWord(); render();
        return;
      }
      if(e.target.closest(".listen-btn")){
        st.w = (st.w + 1) % c.words.length; resetWord(); render();
        return;
      }
      const nav = e.target.closest(".nav-arrow");
      if(nav){
        st.w = (st.w + +nav.dataset.nav + c.words.length) % c.words.length;
        resetWord(); render();
      }
    };
  },

  /* ===== mode: game 游戏 ===== */

  mGame(box){
    const g = (this.course.game || {}).scene;
    if(g === "jump-say") return this.mJumpSay(box);
    if(g === "count-pop") return this.mCountPop(box);
    if(g === "memory") return this.mMemory(box);
    if(g === "grid") return this.mPlaceGame(box, null);
    if(g === "dining-table") return this.mPlaceGame(box, this.course.game.slots);
    showToast("这个课件还没有游戏哦～");
  },

  mPlaceGame(box, slots){
    const c = this.course, g = c.game;
    const order = shuffle(c.words.map((w, i) => i));
    let t = 0;
    const sceneHTML = slots ? `
      <div class="scene"><div class="table-obj">${slots.map(s => {
        const w = c.words.find(x => x.en === s.en);
        return `<span class="slot" data-word="${s.en}" style="left:${s.left};top:${s.top};transform:${s.tf}">${w ? w.emoji : ""}</span>`;
      }).join("")}</div></div>` : `
      <div class="scene"><div class="grid-board">${shuffle(c.words).map(w =>
        `<span class="slot" data-word="${w.en}">${w.emoji}</span>`).join("")}</div></div>`;
    box.innerHTML = `
      <div class="game-wrap">
        <div class="game-prompt"></div>
        ${sceneHTML}
        <div class="tray">${shuffle(c.words).map(w =>
          `<span class="tray-item" data-word="${w.en}">${w.emoji}</span>`).join("")}</div>
      </div>`;
    const promptEl = box.querySelector(".game-prompt");
    const prompt = () => {
      if(t >= order.length){
        promptEl.innerHTML = "🎉 All done! 全部放好啦！";
        showToast(this.praise());
        this.later(() => { if(this.mode === "game") this.complete("game"); }, 1000);
        return;
      }
      const w = c.words[order[t]];
      const verb = slots ? "on the table" : "in";
      promptEl.innerHTML = `Put the <span class="needle">${w.emoji} ${w.en}</span> ${verb}!`;
      Voice.speak(`Put the ${w.en} ${verb}!`, { rate: 0.55 });
    };
    box.onclick = e => {
      const item = e.target.closest(".tray-item");
      if(!item || item.classList.contains("used")) return;
      const w = c.words[order[t]];
      if(item.dataset.word === w.en){
        const slot = box.querySelector(`.slot[data-word="${w.en}"]`);
        if(slot) slot.classList.add("filled");
        item.classList.add("used");
        Voice.ding(true);
        if(!this.awarded.has("game:" + w.en)){
          this.awarded.add("game:" + w.en);
          this.addStar();
        }
        t++;
        this.later(prompt, 900);
      }else{
        item.classList.remove("shake"); void item.offsetWidth; item.classList.add("shake");
        Voice.ding(false);
        showToast("Try again! 再试一次！");
      }
    };
    prompt();
  },

  mJumpSay(box){
    const c = this.course;
    const rounds = c.words.length > 6 ? 1 : 2;
    const queue = [];
    for(let r = 0; r < rounds; r++) queue.push(...shuffle(c.words));
    const render = () => {
      const cur = queue[0];
      box.innerHTML = `
        <div class="game-wrap">
          <div class="game-prompt">Jump to <span class="needle">${cur.emoji} ${cur.en}</span>!</div>
          <div class="jump-grid js-${c.vowel || "a"}">${shuffle(c.words).map(w => `
            <button type="button" class="jump-card" data-word="${w.en}">
              <div class="emoji">${w.emoji}</div>
              <div class="word">${w.en}</div>
            </button>`).join("")}</div>
        </div>`;
      Voice.speak(`Jump to ${cur.en}!`, { rate: 0.55 });
    };
    render();
    box.onclick = e => {
      const card = e.target.closest(".jump-card");
      if(!card) return;
      const cur = queue[0];
      if(card.dataset.word === cur.en){
        card.classList.add("bounce");
        Voice.ding(true);
        if(!this.awarded.has("game:" + cur.en)){
          this.awarded.add("game:" + cur.en);
          this.addStar();
        }
        queue.shift();
        if(queue.length === 0){
          box.querySelector(".game-prompt").innerHTML = "🎉 All done! 全部跳完啦！";
          this.later(() => { if(this.mode === "game") this.complete("game"); }, 900);
          return;
        }
        this.later(render, 800);
      }else{
        card.classList.remove("shake"); void card.offsetWidth; card.classList.add("shake");
        Voice.ding(false);
        showToast("Try again! 再试一次！");
      }
    };
  },

  /* ===== game 变体：memory 翻牌配对（图 ↔ 词找朋友） ===== */
  mMemory(box){
    const c = this.course;
    const pairs = shuffle([...c.words]).slice(0, 4);
    if(!pairs.length){ showToast("这个课件还没有游戏哦～"); return; }
    const cards = [];
    pairs.forEach((w, p) => {
      cards.push({ en: w.en, kind: "art", html: w.emoji, p });
      cards.push({ en: w.en, kind: "word", text: w.en, p });
    });
    shuffle(cards);
    this._memState = { first: null, lock: false, matched: 0, total: pairs.length };
    const st = this._memState;
    box.innerHTML = `
      <div class="game-wrap">
        <div class="game-prompt">🃏 Find the pairs! <span class="needle">找朋友</span></div>
        <div class="memory-grid">${cards.map((cd, i) => `
          <button type="button" class="mem-card" data-en="${cd.en}" data-kind="${cd.kind}" data-p="${cd.p}" style="animation-delay:${i * 60}ms">
            <div class="mem-inner">
              <div class="mem-face front"><span class="mem-q">?</span></div>
              <div class="mem-face back">${cd.kind === "art" ? cd.html : `<span class="mem-word">${cd.text}</span>`}</div>
            </div>
          </button>`).join("")}</div>
      </div>`;
    box.onclick = e => {
      const card = e.target.closest(".mem-card");
      if(!card || st.lock) return;
      if(card.classList.contains("flipped") || card.classList.contains("matched")) return;
      card.classList.add("flipped");
      Voice.speak(card.dataset.en, { rate: 0.55 });
      if(!st.first){ st.first = card; return; }
      const a = st.first;
      st.first = null;
      st.lock = true;
      if(a.dataset.en === card.dataset.en){
        a.classList.add("matched");
        card.classList.add("matched");
        Voice.ding(true);
        this.addStar();
        st.matched++;
        st.lock = false;
        if(st.matched >= st.total){
          showToast(this.praise());
          this.later(() => { if(this.mode === "game") this.complete("game"); }, 900);
        }
      }else{
        this.later(() => {
          a.classList.remove("flipped");
          card.classList.remove("flipped");
          st.lock = false;
        }, 700);
      }
    };
    this.later(() => Voice.speak("Find the pairs! 找朋友!", { rate: 0.6 }), 500);
  },

  /* ===== talk 变体：自定义问答对（数数课 How many...? There are...） ===== */
  mTalkPairs(box){
    const c = this.course;
    const pairs = c.talkPairs;
    const st = { i: 0, q: false, a: false };
    const render = () => {
      const p = pairs[st.i];
      box.innerHTML = `
        <div class="talk-wrap">
          <div class="talk-pattern-label">🗣️ 问答 ${st.i + 1} / ${pairs.length}</div>
          <div class="talk-card">
            <div class="talk-emoji story-row">${p.emojis}</div>
            <button type="button" class="bubble q" data-say="${p.q}">❓ ${p.q}</button>
            <button type="button" class="bubble a" data-say="${p.a}">💬 ${p.a}</button>
          </div>
          <div class="nav-row">
            <button type="button" class="nav-arrow" data-nav="-1">◀</button>
            <button type="button" class="listen-btn">🔊 Replay 重听</button>
            <button type="button" class="nav-arrow" data-nav="1">▶</button>
          </div>
          <div class="page-dots talk-dots">${pairs.map((_, i) =>
            `<span class="dot${i === st.i ? " on" : ""}"></span>`).join("")}</div>
        </div>`;
    };
    render();
    box.onclick = e => {
      const b = e.target.closest(".bubble");
      if(b){
        b.classList.remove("said"); void b.offsetWidth; b.classList.add("said");
        Voice.speak(b.dataset.say, { rate: 0.6 });
        if(b.classList.contains("q")) st.q = true; else st.a = true;
        if(st.q && st.a){
          const key = "talkpair:" + st.i;
          if(!this.awarded.has(key)){ this.awarded.add(key); this.addStar(); }
          Voice.ding(true);
          this.later(() => {
            if(this.mode !== "talk") return;
            if(st.i === pairs.length - 1){ this.complete("talk"); return; }
            st.i++; st.q = st.a = false; render();
          }, 1300);
        }
        return;
      }
      if(e.target.closest(".listen-btn")){
        const p = pairs[st.i];
        Voice.speak(p.q + " " + p.a, { rate: 0.58 });
        return;
      }
      const nav = e.target.closest(".nav-arrow");
      if(nav){
        st.i = (st.i + +nav.dataset.nav + pairs.length) % pairs.length;
        st.q = st.a = false; render();
      }
    };
  },

  /* ===== game 变体：count-pop 戳泡泡数数 =====
     漂浮泡泡 → 戳破一只报一个数(one~four) → 全破后问 How many...?
     选对数量 → "There are N ...!" 下一轮。完整练课上三个句型。 */
  mCountPop(box){
    const c = this.course;
    const rounds = (c.game && c.game.rounds) || [];
    const NUMW = ["", "one", "two", "three", "four"];
    const wordOf = en => c.words.find(w => w.en === en) || {en, zh:en, emoji:"❓"};
    // 4 个坑位，第 i 个泡泡中心 = slot*W + bubbleW/2 → left = 12.5% + i*25% - 11.5%（宽23%的一半）
    // 1-2 只时取中间坑位（居中），3-4 只时均匀铺开；4 只时气泡收窄到 21% 宽，离屏幕边缘更透气
    const LAYOUTS = {1:[38.5], 2:[26.5,50.5], 3:[13.5,38.5,63.5], 4:[5,28,51,74]};
    const DURS = ["11s","8.5s","13s","9.5s"];
    let ri = 0, popped = 0;

    const renderRound = () => {
      const r = rounds[ri];
      const w = wordOf(r.en);
      const spots = (LAYOUTS[Math.min(r.n, 4)] || LAYOUTS[4]).slice();
      let bubbles = "";
      const usedDurs = [];
      const durOf = () => {
        const pool = DURS.filter(d => !usedDurs.includes(d));
        const d = pool[Math.floor(Math.random() * pool.length)] || DURS[0];
        usedDurs.push(d);
        return d;
      };
      for(let k = 0; k < r.n; k++){
        const lf = spots[k];
        const dur = durOf();
        const tilt = (Math.random() * 8 - 4).toFixed(1);    // 每只泡泡随机微倾 ±4°，更俏皮
        const delay = (Math.random() * -6).toFixed(2);       // 负延迟：出场即浮动中
        const narrow = r.n === 4 ? "width:21%;" : "";        // 4 只时收窄，给屏幕边缘留白
        bubbles += `<button type="button" class="p-bubble" style="left:${lf}%;${narrow}--tilt:${tilt}deg;animation-delay:${delay}s;animation-duration:${dur}"><span class="b-in">${w.emoji}</span></button>`;
      }
      box.innerHTML = `
        <div class="game-wrap pop-wrap">
          <div class="game-prompt">🫧 Pop &amp; count! 戳泡泡数一数 <span class="pop-round">${ri + 1}/${rounds.length}</span></div>
          <div class="pop-count"></div>
          <div class="pop-field">${bubbles}</div>
          <div class="pop-ask" hidden></div>
        </div>`;
      Voice.speak("Pop the bubbles! Let's count!", { rate: 0.6 });
    };

    const askCount = () => {
      const r = rounds[ri];
      const w = wordOf(r.en);
      const plural = r.en + "s";
      const field = box.querySelector(".pop-field");
      if(field) field.hidden = true;
      const ask = box.querySelector(".pop-ask");
      if(!ask) return;
      const opts = shuffle([r.n, ...shuffle([1,2,3,4].filter(x => x !== r.n)).slice(0, 2)]);
      ask.hidden = false;
      ask.innerHTML = `
        <div class="pop-question">❓ How many ${w.emoji} ${plural} are there?</div>
        <div class="count-opts">${opts.map(n =>
          `<button type="button" class="c-opt quiz-opt" data-n="${n}">${n}️⃣</button>`).join("")}</div>`;
      Voice.speak(`How many ${plural} are there?`, { rate: 0.55 });
    };

    renderRound();

    box.onclick = e => {
      const b = e.target.closest(".p-bubble");
      if(b && !b.classList.contains("pop")){
        b.classList.add("pop");
        popped++;
        const num = document.createElement("span");
        num.className = "fly-num";
        num.textContent = popped;
        b.appendChild(num);
        const bar = box.querySelector(".pop-count");
        if(bar) bar.insertAdjacentHTML("beforeend", `<span class="cnt">${popped}</span>`);
        Voice.speak(NUMW[popped] + "!", { rate: 0.55 });
        this.later(() => b.remove(), 650);
        if(popped >= rounds[ri].n) this.later(askCount, 950);
        return;
      }
      const opt = e.target.closest(".c-opt");
      if(opt){
        const r = rounds[ri];
        const w = wordOf(r.en);
        const plural = r.en + "s";
        if(+opt.dataset.n === r.n){
          opt.classList.add("bounce");
          Voice.ding(true);
          showToast(this.praise());
          Voice.speak(`There are ${NUMW[r.n]} ${plural}!`, { rate: 0.6 });
          const key = "game:" + r.en + ":" + r.n;
          if(!this.awarded.has(key)){ this.awarded.add(key); this.addStar(); }
          this.later(() => {
            if(this.mode !== "game") return;
            if(ri === rounds.length - 1){
              const ask = box.querySelector(".pop-ask");
              if(ask) ask.innerHTML = `<div class="pop-question">🎉 All done! 全部数对啦，Kiki！</div>`;
              this.later(() => { if(this.mode === "game") this.complete("game"); }, 1100);
              return;
            }
            ri++; popped = 0; renderRound();
          }, 1800);
        }else{
          opt.classList.remove("shake"); void opt.offsetWidth; opt.classList.add("shake");
          Voice.ding(false);
          showToast("Try again! 再数一数！");
          this.later(() => Voice.speak("Let's count!", { rate: 0.55 }), 600);
        }
      }
    };
  },

  /* ===== mode: quiz 听音选词 ===== */

  mQuiz(box){
    const c = this.course;
    let qi = 0;
    const render = () => {
      const w = c.words[qi];
      const others = shuffle(c.words.filter(x => x.en !== w.en)).slice(0, Math.min(2, c.words.length - 1));
      const opts = shuffle([w, ...others]);
      box.innerHTML = `
        <div class="quiz-box">
          <div class="quiz-progress">Question ${qi + 1} / ${c.words.length}</div>
          <div class="quiz-q">👂 Listen & tap! 听音选词</div>
          <div class="quiz-emoji">${w.emoji}</div>
          <div class="quiz-opts">${opts.map(o =>
            `<button type="button" class="quiz-opt" data-word="${o.en}">${o.en}</button>`).join("")}</div>
        </div>`;
      this.later(() => Voice.speak(w.en, { rate: 0.5 }), 450);
    };
    render();
    box.onclick = e => {
      const em = e.target.closest(".quiz-emoji");
      if(em){ Voice.speak(c.words[qi].en, { rate: 0.5 }); return; }
      const opt = e.target.closest(".quiz-opt");
      if(!opt || opt.classList.contains("right")) return;
      const w = c.words[qi];
      if(opt.dataset.word === w.en){
        opt.classList.add("right");
        Voice.ding(true);
        if(!this.awarded.has("quiz:" + w.en)){
          this.awarded.add("quiz:" + w.en);
          this.addStar();
        }
        qi++;
        if(qi >= c.words.length){
          this.later(() => { if(this.mode === "quiz") this.complete("quiz"); }, 900);
          return;
        }
        this.later(render, 950);
      }else{
        opt.classList.add("wrong");
        Voice.ding(false);
        showToast("Listen again! 再听一次！");
        this.later(() => opt.classList.remove("wrong"), 600);
        this.later(() => Voice.speak(w.en, { rate: 0.45 }), 700);
      }
    };
  },

  /* ===== mode: trace 描红（四线三格 + 手指书写 + 覆盖率判定） ===== */
  mTrace(box){
    const c = this.course;
    const words = (c.traceWords && c.traceWords.length) ? c.traceWords : ["it", "is"];
    const st = { i: 0 };

    const onPass = () => {
      const w = words[st.i];
      Voice.ding(true);
      showToast(this.praise());
      if(!this.awarded.has("trace:" + w)){
        this.awarded.add("trace:" + w);
        this.addStar();
      }
      this.later(() => {
        if(this.mode !== "trace") return;
        if(st.i === words.length - 1){
          const head = box.querySelector(".trace-head");
          if(head) head.innerHTML = `<div class="trace-word-label">🎉 All done! 全部写好啦，Kiki！</div>`;
          this.later(() => { if(this.mode === "trace") this.complete("trace"); }, 1200);
          return;
        }
        st.i++;
        render();
      }, 1500);
    };

    const render = () => {
      const w = words[st.i];
      box.innerHTML = `
        <div class="trace-wrap">
          <div class="trace-head">
            <div class="trace-word-label">✏️ Write: <span class="needle">${w}</span> <span class="trace-step">${st.i + 1}/${words.length}</span></div>
            <button type="button" class="trace-clear" data-clear="1">🧽 擦掉重写</button>
          </div>
          <div class="trace-canvas-box"><canvas class="trace-cv"></canvas></div>
          <div class="trace-bar"><div class="trace-fill"></div></div>
          <div class="trace-hint">👆 用手指描灰色字母：示范 → 描虚线 → 自己写</div>
        </div>`;
      this.later(() => Voice.speak(`${w}! Write ${w}!`, { rate: 0.55 }), 400);
      const boot = () => { if(this.mode === "trace") this.initTraceCanvas(box, w, onPass); };
      const spec = '700 24px "Andika"';
      if(document.fonts && document.fonts.check(spec)) boot();
      else if(document.fonts && document.fonts.load) document.fonts.load(spec).then(boot, boot);
      else boot();
    };
    render();

    box.onclick = e => {
      if(e.target.closest("[data-clear]")){ this.initTraceCanvas(box, words[st.i], onPass); return; }
    };
  },

  initTraceCanvas(box, word, onPass){
    const cv = box.querySelector(".trace-cv");
    if(!cv || !cv.getContext) return;
    const host = box.querySelector(".trace-canvas-box");
    const cssW = Math.max(280, Math.min(host.clientWidth - 16 || 640, 860));
    const vh = window.innerHeight || 640;
    // 画布高度 = 视口剩余空间（减去画布以上的头部 + 以下的进度条/提示/安全区），不溢出屏幕
    const hostTop = host.getBoundingClientRect().top;
    const barH = (box.querySelector(".trace-bar") || {}).offsetHeight || 16;
    const hintH = (box.querySelector(".trace-hint") || {}).offsetHeight || 20;
    const gaps = 22;   // flex gap × 2 + 余量
    const safeB = 12;
    const availH = Math.max(240, vh - hostTop - barH - hintH - gaps - safeB - 16);
    // 横屏矮屏退回单行（宽高比>2.2）
    const twoRows = cssW / availH < 2.2;
    const cssH = twoRows ? Math.round(Math.min(Math.max(availH, 300), 560))
                         : Math.min(Math.round(availH), 250);

    const dpr = window.devicePixelRatio || 1;
    cv.width = Math.round(cssW * dpr); cv.height = Math.round(cssH * dpr);
    cv.style.width = cssW + "px"; cv.style.height = cssH + "px";
    const ctx = cv.getContext("2d", {willReadFrequently:true});

    // 两行四线三格（2×2）：示范/描红/描红/自写；单行 3 格（横屏兜底）
    const rowSpans = twoRows ? [[0.06, 0.44], [0.56, 0.94]] : [[0.14, 0.86]];
    const ROWS = rowSpans.map(([f, t]) => {
      const L0 = Math.round(cssH * f), L3 = Math.round(cssH * t);
      const step = (L3 - L0) / 3;
      return [L0, Math.round(L0 + step), Math.round(L0 + 2 * step), L3];
    });
    const cellOf = (x, row, mode) => ({x, row, mode, baseY: ROWS[row][2] + Math.round((ROWS[row][3] - ROWS[row][2]) * 0.14)});
    const CELLS = twoRows ? [
      cellOf(0.26, 0, "solid"), cellOf(0.74, 0, "dash"),
      cellOf(0.26, 1, "dash"),  cellOf(0.74, 1, "ghost")
    ] : [
      cellOf(0.18, 0, "solid"), cellOf(0.50, 0, "dash"), cellOf(0.82, 0, "ghost")
    ];

    // 字号：行高的 0.86，宽度约束（两行每格更宽）
    const rowH = ROWS[0][3] - ROWS[0][0];
    let fontSize = Math.round(rowH * 0.86);
    const fontOf = s => `700 ${s}px "Andika","Comic Sans MS","Chalkboard SE",cursive,sans-serif`;
    ctx.font = fontOf(fontSize);
    const w1 = ctx.measureText(word).width;
    const maxW = cssW * (twoRows ? 0.37 : 0.27);
    if(w1 > maxW){ fontSize = Math.floor(fontSize * maxW / w1); }
    const font = fontOf(fontSize);

    const drawPaper = () => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, cssH);
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, cssW, cssH);
      ROWS.forEach(L => {
        L.forEach((y, i) => {
          ctx.setLineDash([]);
          ctx.lineWidth = 2;
          ctx.strokeStyle = (i === 0 || i === 3) ? "#7A9CC6" : "#C5D6EA";
          ctx.beginPath();
          ctx.moveTo(cssW * 0.03, y);
          ctx.lineTo(cssW * 0.97, y);
          ctx.stroke();
        });
      });
      ctx.font = font; ctx.textAlign = "center"; ctx.textBaseline = "alphabetic";
      CELLS.forEach(c => {
        const x = cssW * c.x, y = c.baseY;
        if(c.mode === "solid"){
          ctx.setLineDash([]);
          ctx.fillStyle = "rgba(90,90,110,.5)";
          ctx.fillText(word, x, y);
        }else if(c.mode === "dash"){
          ctx.setLineDash([8, 7]);
          ctx.lineWidth = 1.8;
          ctx.strokeStyle = "rgba(90,90,110,.55)";
          ctx.strokeText(word, x, y);
          ctx.setLineDash([]);
        }else{
          ctx.fillStyle = "rgba(90,90,110,.3)";
          ctx.fillText(word, x, y);
          ctx.setLineDash([8, 7]);
          ctx.lineWidth = 1.4;
          ctx.strokeStyle = "rgba(90,90,110,.3)";
          ctx.strokeText(word, x, y);
          ctx.setLineDash([]);
        }
      });
    };
    drawPaper();

    // 目标掩码：只算描红格+自写格（示范格是看的，不用描）
    const practiceCells = CELLS.filter(c => c.mode !== "solid");
    const mk = document.createElement("canvas");
    mk.width = cv.width; mk.height = cv.height;
    const mctx = mk.getContext("2d", {willReadFrequently:true});
    mctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    mctx.font = font; mctx.textAlign = "center"; mctx.textBaseline = "alphabetic";
    mctx.fillStyle = "#fff"; mctx.strokeStyle = "#fff";
    practiceCells.forEach(c => {
      const x = cssW * c.x;
      mctx.fillText(word, x, c.baseY);
      mctx.lineWidth = 16;
      mctx.strokeText(word, x, c.baseY);
    });
    const tdata = mctx.getImageData(0, 0, mk.width, mk.height).data;
    const CELL = 8 * dpr;
    const gw = Math.ceil(mk.width / CELL), gh = Math.ceil(mk.height / CELL);
    const targetCells = new Uint8Array(gw * gh);
    for(let y = 0; y < mk.height; y++){
      for(let x = 0; x < mk.width; x++){
        if(tdata[(y * mk.width + x) * 4 + 3] > 40){
          targetCells[(y / CELL | 0) * gw + (x / CELL | 0)] = 1;
        }
      }
    }
    let totalTarget = 0;
    for(let i = 0; i < targetCells.length; i++) totalTarget += targetCells[i];
    if(!totalTarget) return;

    let drawing = false, lastPt = null, passFired = false;
    const CRAYON = "#FF6B6B";

    const dot = p => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = CRAYON;
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fill();
    };
    const lineTo = p => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.strokeStyle = CRAYON;
      ctx.lineWidth = 10; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(lastPt.x, lastPt.y);
      ctx.lineTo(p.x, p.y);
      ctx.stroke();
    };

    const evaluate = () => {
      if(passFired) return;
      const sdata = ctx.getImageData(0, 0, cv.width, cv.height).data;
      const hitCells = new Uint8Array(gw * gh);
      const strokeCells = new Uint8Array(gw * gh);
      for(let y = 0; y < cv.height; y += 2){
        for(let x = 0; x < cv.width; x += 2){
          const i = (y * cv.width + x) * 4;
          if(sdata[i] > 180 && sdata[i + 1] < 170 && sdata[i + 2] < 170){
            const ci = (y / CELL | 0) * gw + (x / CELL | 0);
            strokeCells[ci] = 1;
            if(targetCells[ci]) hitCells[ci] = 1;
          }
        }
      }
      let st = 0, sc = 0;
      for(let i = 0; i < gw * gh; i++){ st += hitCells[i]; sc += strokeCells[i]; }
      const coverage = st / totalTarget;
      const precision = sc ? st / sc : 0;
      const fill = box.querySelector(".trace-fill");
      if(fill) fill.style.width = Math.min(100, Math.round(Math.min(coverage / 0.5, 1) * 100)) + "%";
      if(coverage >= 0.5 && precision >= 0.42){
        passFired = true;
        Voice.speak(`Great writing! ${word}!`, { rate: 0.6 });
        if(onPass) onPass();
      }
    };

    const ptOf = e => {
      const r = cv.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (cssW / r.width), y: (e.clientY - r.top) * (cssH / r.height) };
    };
    cv.onpointerdown = e => {
      e.preventDefault();
      drawing = true; lastPt = ptOf(e);
      try{ cv.setPointerCapture(e.pointerId); }catch(err){}
      dot(lastPt);
    };
    cv.onpointermove = e => {
      if(!drawing) return;
      e.preventDefault();
      const p = ptOf(e);
      lineTo(p);
      lastPt = p;
    };
    cv.onpointerup = cv.onpointercancel = () => {
      if(!drawing) return;
      drawing = false;
      evaluate();
    };
  }
};

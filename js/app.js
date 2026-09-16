// app.js — bootstrap: Progress storage, hash router, home rendering, toast/accent UI helpers.
// Loaded last. Globals from data.js(CATEGORIES/COURSES), voice.js(Voice), engine.js(Engine).

function showToast(msg){
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.remove("hidden");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.add("hidden"), 2500);
}

function refreshAccentUI(){
  document.querySelectorAll("[data-accent]").forEach(b => {
    b.classList.toggle("on", b.dataset.accent === Voice.accent);
  });
}

const Progress = {
  _key: "cwd_progress_v2",
  _all(){
    try{ return JSON.parse(localStorage.getItem(this._key)) || {}; }catch(e){ return {}; }
  },
  _save(all){
    try{ localStorage.setItem(this._key, JSON.stringify(all)); }catch(e){}
  },
  get(id){
    return this._all()[id] || null;
  },
  update(id, patch){
    try{
      const all = this._all();
      const old = all[id] || { modes: {}, done: false, lastMode: null, ts: 0 };
      const rec = Object.assign({}, old);
      rec.modes = Object.assign({}, old.modes || {});
      const pm = patch && patch.modes;
      if(pm && typeof pm === "object"){
        for(const k in pm){
          rec.modes[k] = Math.max(rec.modes[k] || 0, pm[k] || 0);
        }
      }
      if(patch && patch.done) rec.done = true;
      if(patch && patch.lastMode != null) rec.lastMode = patch.lastMode;
      rec.ts = Date.now();
      all[id] = rec;
      this._save(all);
      return rec;
    }catch(e){ return null; }
  },
  totalStars(){
    return Object.values(this._all()).reduce((s, r) => s + this._recStars(r), 0);
  },
  stationStars(ids){
    return (Array.isArray(ids) ? ids : []).reduce((s, id) =>
      s + this._recStars(this.get(id)), 0);
  },
  _recStars(r){
    return r && r.modes ? Object.values(r.modes).reduce((a, n) => a + (n || 0), 0) : 0;
  },
  nextCourse(id){
    const cur = COURSES.find(c => c.id === id);
    if(!cur) return null;
    const ring = COURSES.filter(c => c.category === cur.category);
    const idx = ring.findIndex(c => c.id === id);
    for(let k = 1; k <= ring.length; k++){
      const c = ring[(idx + k) % ring.length];
      const r = this.get(c.id);
      if(!r || !r.done) return c;
    }
    return null;
  }
};

/* v1(共享星池 {stars,total}) → v2(按模式星池 {modes}) 一次性迁移：
   按 MODE_STARS 权重把旧 stars 按比例分摊（向下取整，余数给权重最大的模式），
   仅当 v2 键不存在时写入；绝不删除 v1。 */
function migrateProgressV1(){
  try{
    if(localStorage.getItem("cwd_progress_v2") != null) return;
    let v1 = null;
    try{ v1 = JSON.parse(localStorage.getItem("cwd_progress_v1")); }catch(e){}
    if(!v1 || typeof v1 !== "object") return;
    const out = {};
    for(const id in v1){
      const course = COURSES.find(c => c.id === id);
      if(!course) continue;
      const r = v1[id] || {};
      const entries = (course.modes || []).map(m => [m, MODE_STARS[m] || 0]).filter(x => x[1] > 0);
      const cap = entries.reduce((s, x) => s + x[1], 0);
      const dist = Math.min(Math.max(r.stars | 0, 0), cap);
      const wSum = cap || 1;
      const modes = {};
      let assigned = 0;
      entries.forEach(([m, w]) => {
        modes[m] = Math.min(Math.floor(dist * w / wSum), w);
        assigned += modes[m];
      });
      let rem = dist - assigned;
      const byWeight = entries.slice().sort((a, b) => b[1] - a[1]);
      for(const [m, w] of byWeight){
        if(rem <= 0) break;
        const give = Math.min(w - modes[m], rem);
        if(give > 0){ modes[m] += give; rem -= give; }
      }
      out[id] = { modes, done: !!r.done, lastMode: r.lastMode || null, ts: r.ts || 0 };
    }
    localStorage.setItem("cwd_progress_v2", JSON.stringify(out));
  }catch(e){}
}

/* ===== Home ===== */

let homeCat = "all";

function catLabelOf(id){
  const c = CATEGORIES.find(x => x.id === id);
  return c ? c.label : "";
}

function courseTotalStars(c){
  return (c.modes || []).reduce((s, m) => s + (MODE_STARS[m] || 0), 0);
}

function courseCardHTML(c, i){
  const r = Progress.get(c.id);
  const got = r && r.modes ? Progress._recStars(r) : 0;
  const prog = r && r.done
    ? `<div class="cc-progress"><span class="cc-badge">🏅 完成</span></div>`
    : got
      ? `<div class="cc-progress"><span class="cc-stars">⭐ ${got}/${courseTotalStars(c)}</span></div>`
      : `<div class="cc-progress"></div>`;
  return `<button type="button" class="course-card" data-id="${c.id}" style="animation-delay:${i * 80}ms">
    <div class="cc-cover" style="background-image:url('assets/images/cover/${c.id}.jpg')"><span class="cc-emoji">${c.emoji}</span></div>
    <div class="cc-body">
      <div class="cc-title">${c.title}</div>
      <div class="cc-zh">${c.zhTitle} · ${catLabelOf(c.category)}</div>
      ${prog}
    </div>
  </button>`;
}

function sudokuCardHTML(){
  return `<div class="sudoku-card" id="sudokuCard">
    <div class="sk-lead">🧩 图形数独 · Sudoku</div>
    <button type="button" class="sk-btn sk-easy" data-lv="1">😊 简单</button>
    <button type="button" class="sk-btn sk-med" data-lv="2">🙂 中等</button>
    <button type="button" class="sk-btn sk-hard" data-lv="3">🔥 困难</button>
  </div>`;
}

function renderHome(){
  document.getElementById("totalStars").textContent = "⭐ " + Progress.totalStars();

  document.getElementById("chipRow").innerHTML = CATEGORIES.map(c =>
    `<button type="button" class="chip${c.id === homeCat ? " on" : ""}" data-cat="${c.id}">${c.emoji} ${c.label}</button>`
  ).join("");

  const cont = Object.entries(Progress._all())
    .map(([id, r]) => ({ id, r }))
    .filter(x => x.r && !x.r.done && COURSES.some(c => c.id === x.id))
    .sort((a, b) => (b.r.ts || 0) - (a.r.ts || 0))[0];
  const cb = document.getElementById("continueBox");
  if(cont){
    const c = COURSES.find(x => x.id === cont.id);
    const got = Progress._recStars(cont.r);
    cb.innerHTML = `<button type="button" class="continue-card" data-id="${c.id}">▶ 继续 ${c.emoji} ${c.title} · ⭐${got}/${courseTotalStars(c)}</button>`;
    cb.classList.remove("hidden");
  }else{
    cb.classList.add("hidden");
    cb.innerHTML = "";
  }

  const stations = typeof STATIONS !== "undefined" && Array.isArray(STATIONS) ? STATIONS : null;
  const grid = document.getElementById("courseGrid");
  if(stations && homeCat === "all"){
    grid.classList.remove("course-grid");
    grid.innerHTML = stations.map(st => {
      const courses = (st.courses || [])
        .map(id => COURSES.find(c => c.id === id)).filter(Boolean);
      const got = Progress.stationStars(st.courses);
      const tot = courses.reduce((s, c) => s + courseTotalStars(c), 0);
      const head = `
        <header class="station-head">
          <span class="station-emoji">${st.emoji}</span>
          <div class="station-titles"><div class="station-title">${st.title}</div><div class="station-sub">${st.sub}</div></div>
          <span class="station-stars">⭐ ${got}/${tot}</span>
        </header>`;
      if(st.id === "brain" || !courses.length){
        return `<section class="station">${head}${sudokuCardHTML()}</section>`;
      }
      return `<section class="station">${head}
        <div class="course-grid">${courses.map((c, i) => courseCardHTML(c, i)).join("")}</div>
      </section>`;
    }).join("");
    return;
  }

  const list = homeCat === "all" ? COURSES : COURSES.filter(c => c.category === homeCat);
  grid.classList.add("course-grid");
  grid.innerHTML = list.map((c, i) => courseCardHTML(c, i)).join("")
    || `<div style="grid-column:1/-1;text-align:center;padding:6vh 4vw;font-weight:900;color:#7A6F8B">这个分类还没有课件哦～</div>`;
}

/* ===== Router ===== */

let currentCourseId = null;

function parseHash(){
  const m = location.hash.match(/^#\/course\/([\w-]+)/);
  if(m) return { view: "course", id: m[1] };
  if(location.hash === "#/sudoku") return { view: "sudoku" };
  return { view: "home" };
}

function route(){
  const r = parseHash();
  const home = document.getElementById("home");
  const course = document.getElementById("course");
  const sudokuPage = document.getElementById("sudokuPage");
  if(r.view === "course"){
    const courseData = COURSES.find(c => c.id === r.id);
    if(!courseData){ location.hash = "#/"; return; }
    home.classList.add("hidden");
    sudokuPage.classList.add("hidden");
    course.classList.remove("hidden");
    if(currentCourseId === r.id) return;
    currentCourseId = r.id;
    Engine.start(r.id);
  }else if(r.view === "sudoku"){
    currentCourseId = null;
    Engine.stop();
    course.classList.add("hidden");
    home.classList.add("hidden");
    sudokuPage.classList.remove("hidden");
  }else{
    currentCourseId = null;
    Engine.stop();
    course.classList.add("hidden");
    sudokuPage.classList.add("hidden");
    home.classList.remove("hidden");
    renderHome();
  }
}

/* ===== Bootstrap ===== */

function validateCatalog(){
  COURSES.forEach(c => {
    (c.words || []).forEach(w => {
      if(window.TTS_MANIFEST && !TTS_MANIFEST[w.en]){
        console.warn("[check] missing audio:", c.id, w.en);
      }
    });
    if(c.game && c.game.slots){
      const pts = c.game.slots.map(s => {
        const L = parseFloat(s.left) || 0, T = parseFloat(s.top) || 0;
        const centered = s.tf === "translate(-50%,-50%)";
        return {
          en: s.en,
          x: L * 680 / 100 + (centered ? 0 : 45),
          y: T * 300 / 100 + (centered ? 0 : 45)
        };
      });
      for(let i = 0; i < pts.length; i++){
        for(let j = i + 1; j < pts.length; j++){
          const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if(dist < 96) console.warn("[check] slot overlap:", c.id, pts[i].en, "↔", pts[j].en, dist.toFixed(0) + "px");
        }
      }
    }
    if((c.modes || []).includes("trace") && !(c.traceWords && c.traceWords.length)){
      console.warn("[check] missing traceWords:", c.id);
    }
  });
}

function boot(){
  Voice.init();
  refreshAccentUI();
  migrateProgressV1();
  validateCatalog();

  document.addEventListener("click", e => {
    const acc = e.target.closest("[data-accent]");
    if(acc) Voice.setAccent(acc.dataset.accent);
  });

  document.getElementById("chipRow").addEventListener("click", e => {
    const chip = e.target.closest(".chip");
    if(!chip) return;
    homeCat = chip.dataset.cat;
    renderHome();
  });

  document.getElementById("courseGrid").addEventListener("click", e => {
    const card = e.target.closest(".course-card");
    if(card) location.hash = "#/course/" + card.dataset.id;
  });

  document.getElementById("continueBox").addEventListener("click", e => {
    const card = e.target.closest(".continue-card");
    if(card) location.hash = "#/course/" + card.dataset.id;
  });

  // 数独入口随首页重渲染增删，改为 document 级委托（.sk-btn 永远生效）
  document.addEventListener("click", e => {
    const btn = e.target.closest(".sk-btn");
    if(!btn) return;
    location.hash = "#/sudoku";
    Sudoku.start(+btn.dataset.lv);
  });

  document.getElementById("sudokuBoard").addEventListener("click", e => Sudoku.onTap(e));

  document.getElementById("homeBtn").addEventListener("click", () => { location.hash = "#/"; });

  document.getElementById("modeTabs").addEventListener("click", e => {
    const tab = e.target.closest(".tab");
    if(tab) Engine.switchMode(tab.dataset.mode);
  });

  window.addEventListener("hashchange", route);
  route();
}

boot();

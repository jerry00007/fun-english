// sudoku.js — 图形四宫格数独（首页独立模块，三档难度）
// 复用 data.js 的手绘贴纸图形；发音复用 Voice（预生成童声优先）。

const Sudoku = (() => {
  /* ===== 图形库：从课程词条取（data.js 先加载） ===== */
  function POOL(){
    const find = id => {
      const c = COURSES.find(x => x.id === id);
      return c && c.words ? c.words : [];
    };
    const animals = find("what-is-it");
    const shapes = find("how-many");
    const shapeArt = ["triangle","circle","star","rectangle","square","heart"]
      .map(en => shapes.find(w => w.en === en)).filter(Boolean);
    // what-is-it 词条为空时（课件被改名/下线），困难级退回用图形贴纸
    return { animals: animals.length ? animals : shapeArt, shapes: shapeArt };
  }

  /* ===== 4x4 数独生成（288 个完整解）+ 挖洞（唯一解验证） ===== */
  function allSolutions(){
    const sols = [];
    const perms = [];
    (function perm(arr, l){
      if(l === 4){ perms.push(arr.slice()); return; }
      for(let i = l; i < 4; i++){
        [arr[l], arr[i]] = [arr[i], arr[l]];
        perm(arr, l + 1);
        [arr[l], arr[i]] = [arr[i], arr[l]];
      }
    })([0,1,2,3], 0);
    const boxOk = (a, b) => {
      for(let k = 0; k < 2; k++){
        const s = new Set([a[k*2], a[k*2+1], b[k*2], b[k*2+1]]);
        if(s.size !== 4) return false;
      }
      return true;
    };
    for(const r0 of perms) for(const r1 of perms){
      if(r0[0] === r1[0] || r0[1] === r1[1] || r0[2] === r1[2] || r0[3] === r1[3]) continue;
      for(const r2 of perms) for(const r3 of perms){
        if(!boxOk(r0, r1) || !boxOk(r2, r3)) continue;
        let bad = false;
        for(let c = 0; c < 4; c++){
          if(new Set([r0[c], r1[c], r2[c], r3[c]]).size !== 4){ bad = true; break; }
        }
        if(!bad) sols.push([r0.slice(), r1.slice(), r2.slice(), r3.slice()]);
      }
    }
    return sols;
  }
  const SOLUTIONS = allSolutions();

  function countSolutions(grid, cap){
    cap = cap || 2;
    const rows = [], cols = [], boxes = [];
    for(let i = 0; i < 4; i++){ rows.push(new Set()); cols.push(new Set()); boxes.push(new Set()); }
    const empties = [];
    for(let i = 0; i < 16; i++){
      const r = i >> 2, c = i & 3, b = (r >> 1) * 2 + (c >> 1), v = grid[i];
      if(v < 0){ empties.push(i); continue; }
      rows[r].add(v); cols[c].add(v); boxes[b].add(v);
    }
    let n = 0;
    (function go(k){
      if(n >= cap) return;
      if(k === empties.length){ n++; return; }
      const i = empties[k], r = i >> 2, c = i & 3, b = (r >> 1) * 2 + (c >> 1);
      for(let v = 0; v < 4; v++){
        if(rows[r].has(v) || cols[c].has(v) || boxes[b].has(v)) continue;
        rows[r].add(v); cols[c].add(v); boxes[b].add(v);
        go(k + 1);
        rows[r].delete(v); cols[c].delete(v); boxes[b].delete(v);
      }
    })(0);
    return n;
  }

  function makePuzzle(level){
    const blanks = level === 1 ? 5 : level === 2 ? 7 : 9;
    const sol = SOLUTIONS[Math.floor(Math.random() * SOLUTIONS.length)];
    const flat = [].concat(...sol);
    const puzzle = flat.slice();
    const order = [];
    for(let i = 0; i < 16; i++) order.push(i);
    for(let i = 15; i > 0; i--){
      const j = Math.floor(Math.random() * (i + 1));
      const t = order[i]; order[i] = order[j]; order[j] = t;
    }
    let removed = 0;
    for(const idx of order){
      if(removed >= blanks) break;
      const keep = puzzle[idx];
      puzzle[idx] = -1;
      if(countSolutions(puzzle) === 1){ removed++; }
      else{ puzzle[idx] = keep; }
    }
    const solution2 = [];
    for(let r = 0; r < 4; r++) solution2.push(flat.slice(r * 4, r * 4 + 4));
    return { puzzle, solution: flat };
  }

  /* ===== 渲染与交互 ===== */
  let state = null;
  const LEVEL_NAMES = { 1: "简单 Easy", 2: "中等 Medium", 3: "困难 Hard" };

  function start(level){
    const pool = POOL();
    const useAnimals = level === 3;
    let src = useAnimals ? pool.animals : pool.shapes;
    if(src.length < 4) src = pool.animals.length >= 4 ? pool.animals : pool.shapes;
    if(src.length < 4){ showToast("图形不够，数独开不了啦～"); state = null; return; }
    const pick = src.slice().sort(() => Math.random() - 0.5).slice(0, 4);
    const mk = makePuzzle(level);
    const given = new Set(mk.puzzle.map((v, i) => v >= 0 ? i : -1).filter(i => i >= 0));
    state = { level, pick, puzzle: mk.puzzle.slice(), solution: mk.solution, sel: null, wrongSet: null, given };
    render();
  }

  function render(){
    const el = document.getElementById("sudokuBoard");
    if(!el || !state) return;
    const pick = state.pick;
    const cells = state.puzzle.map((v, i) => {
      const given = v >= 0;
      const wrong = state.wrongSet && state.wrongSet.has(i) ? " wrong" : "";
      const img = given ? pick[v].emoji : "";
      return '<button type="button" class="sd-cell' + (given ? " given" : "") + wrong + '" data-i="' + i + '">' + img + "</button>";
    }).join("");
    const tray = '<div class="sd-tray">' + pick.map((w, k) =>
      '<button type="button" class="sd-chip' + (state.sel === k ? " sel" : "") + '" data-k="' + k + '">' + w.emoji + "</button>").join("") + "</div>";
    el.innerHTML =
      '<div class="sd-head">' +
        '<button type="button" class="sd-home" data-home="1">🏠</button>' +
        '<div class="sd-title">🧩 图形数独 · ' + LEVEL_NAMES[state.level] + "</div>" +
        '<button type="button" class="sd-new" data-new="1">🔄</button>' +
      "</div>" +
      '<div class="sd-sub">每行、每列、每个彩色宫格，图形都不能重复哦！</div>' +
      '<div class="sd-grid">' + cells + "</div>" + tray +
      '<div class="sd-hint">👆 选图形放格子 · 点已放的图形 = 拿走重来</div>';
  }

  function onTap(e){
    const t = e.target.closest("[data-home],[data-new],.sd-chip,.sd-cell");
    if(!t) return;
    if(t.dataset.home){ location.hash = "#/"; return; }
    if(t.dataset.new){ start(state.level); return; }
    const chip = e.target.closest(".sd-chip");
    if(chip){
      const k = +chip.dataset.k;
      state.sel = (state.sel === k) ? null : k;   // 再点一次 = 取消选择（进入"拿走"模式）
      state.wrongSet = null;
      document.querySelectorAll(".sd-chip").forEach(c => c.classList.toggle("sel", state.sel !== null && +c.dataset.k === state.sel));
      if(state.sel != null) Voice.ding(true);
      return;
    }
    const cell = e.target.closest(".sd-cell");
    if(cell){
      const i = +cell.dataset.i;
      if(state.given.has(i)) return;                      // 给定格子不能动
      // 没选图形：点自己放的图形 = 拿走（取消）
      if(state.sel == null){
        if(state.puzzle[i] >= 0){
          state.puzzle[i] = -1;
          state.wrongSet = null;
          cell.innerHTML = "";
          cell.classList.remove("wrong", "pop-in"); void cell.offsetWidth; cell.classList.add("pop-in");
          showToast("拿走啦～ 放别的试试！");
        }else{
          showToast("先选一个图形哦！Pick one first!");
        }
        return;
      }
      // 已选图形：即时校验行/列/宫格重复，重复当场拦截（不用等填满）
      if(hasConflict(i, state.sel)){
        cell.classList.remove("shake"); void cell.offsetWidth; cell.classList.add("shake");
        Voice.ding(false);
        showToast("重复啦！每行、每列、每宫格只能有一个！");
        Voice.speak("Oops! Look again!", { rate: 0.55 });
        return;
      }
      state.puzzle[i] = state.sel;
      cell.innerHTML = state.pick[state.sel].emoji;
      cell.classList.remove("wrong", "pop-in"); void cell.offsetWidth; cell.classList.add("pop-in");
      Voice.speak("The " + state.pick[state.sel].en + ".", { rate: 0.55 });
      setTimeout(checkDone, 250);
    }
  }

  // 该格放 v 是否与行/列/宫格现有图形冲突（忽略该格自身，支持覆盖）
  function hasConflict(i, v){
    const r = i >> 2, c = i & 3;
    for(let k = 0; k < 4; k++){
      if(k !== c && state.puzzle[r * 4 + k] === v) return true;    // 行
      if(k !== r && state.puzzle[k * 4 + c] === v) return true;    // 列
    }
    const br = (r >> 1) * 2, bc = (c >> 1) * 2;
    for(let rr = br; rr < br + 2; rr++) for(let cc = bc; cc < bc + 2; cc++){
      if(!(rr === r && cc === c) && state.puzzle[rr * 4 + cc] === v) return true;  // 宫格
    }
    return false;
  }

  function checkDone(){
    let allFilled = true;
    const wrongSet = new Set();
    for(let i = 0; i < 16; i++){
      const v = state.puzzle[i];
      if(v < 0){ allFilled = false; continue; }
      if(v !== state.solution[i]) wrongSet.add(i);
    }
    if(!allFilled) return;
    if(wrongSet.size === 0){
      state.wrongSet = null;
      Voice.ding(true);
      Voice.speak("Perfect! Amazing, Kiki!", { rate: 0.6 });
      showToast("🎉 Perfect! 数独完成！");
      confettiBurst();
      const rec = Progress.get("sudoku") || {};
      const wins = ((rec.modes && rec.modes.sudoku) || 0) + 1;
      Progress.update("sudoku", { modes: { sudoku: wins }, done: false });
      const ts = document.getElementById("totalStars");
      if(ts) ts.textContent = "⭐ " + Progress.totalStars();
      setTimeout(() => { if(location.hash === "#/sudoku") start(state.level); }, 2600);
    }else{
      state.wrongSet = wrongSet;
      Voice.ding(false);
      showToast("有 " + wrongSet.size + " 格不对，换一换！Try again!");
      render();
    }
  }

  function confettiBurst(){
    try{
      const colors = (typeof CONF_COLORS !== "undefined" && CONF_COLORS) || ["#FFC93C", "#FF6B6B", "#4ECDC4", "#95E06C", "#A78BFA"];
      const frag = document.createDocumentFragment();
      for(let k = 0; k < 36; k++){
        const s = document.createElement("span");
        s.className = "sd-confetti";
        s.style.left = (50 + (Math.random() * 60 - 30)) + "vw";
        s.style.background = colors[k % colors.length];
        s.style.animationDelay = (Math.random() * 0.4).toFixed(2) + "s";
        frag.appendChild(s);
      }
      document.body.appendChild(frag);
      setTimeout(() => { document.querySelectorAll(".sd-confetti").forEach(x => x.remove()); }, 2600);
    }catch(e){}
  }

  return { start, onTap };
})();

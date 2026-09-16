# Fun English 多课件平台 — 构建契约 (SPEC)

> 本文件是三个并行构建任务的唯一契约。所有 DOM id、全局 API、数据结构、样式 token 以此为准，**禁止重命名**。

## 1. 架构总览

- 零构建、零依赖、纯静态多文件。必须支持 `file://` 协议直接双击打开（禁止 fetch/XHR 加载数据）。
- hash 路由：`#/` = 首页，`#/course/{id}` = 课程页。路由变化产生真实历史记录（iOS 手势返回落在应用内）。
- 所有 JS 为普通 `<script>` 顺序加载（非 module），共享全局对象。

### 文件与加载顺序（index.html 底部）

```html
<link rel="stylesheet" href="css/style.css">
<!-- body 内容 -->
<script src="assets/audio/manifest.js"></script>
<script src="js/art.js"></script>   <!-- v2 新增：ANIMAL_ART + SHAPE_ART 美术字典，须在 data.js 之前 -->
<script src="js/data.js"></script>
<script src="js/voice.js"></script>
<script src="js/engine.js"></script>
<script src="js/sudoku.js"></script>
<script src="js/app.js"></script><!-- 最后加载，bootstrap -->
```

## 2. 全局 API 契约

```js
// data.js
const CATEGORIES = [{id:"all",label:"全部",emoji:"📚"},{id:"storybook",label:"绘本故事",emoji:"📖"},{id:"phonics",label:"自然拼读",emoji:"🔤"},{id:"topic",label:"主题单词",emoji:"🏫"}];
const COURSES = [ /* 见 §3 */ ];

// voice.js
const Voice = {
  accent: "us",              // "us" | "uk"
  degraded: false,           // 解析不到目标口音语音时为 true
  init(),                    // 页面加载时调用；监听 onvoiceschanged 重新解析
  setAccent(accent),         // 切口音：解析语音、写 localStorage("cwd_accent")、调用 window.refreshAccentUI?.()、试播 "Hello!"
  speak(text, {rate, pitch, onend}),  // cancel + 60ms 延迟再 speak（修复 Chrome 吞音）
  ding(good)                 // WebAudio 叮咚音效（从原文件迁移）
};

// engine.js
const Engine = {
  course: null,              // 当前课程对象
  start(courseId),           // 渲染课程壳（tabs/星星条），进入 lastMode 或第一个模式
  stop(),                    // 清理所有 pending timers，供路由离开时调用
  switchMode(mode),          // 清 timers，渲染模式到 #modeContainer
  restart()                  // 再玩一次：重置会话星星（不动 Progress 里的 best），回到第一个模式
};

// app.js（最后加载，负责 bootstrap）
const Progress = {
  get(courseId),             // → {stars,total,done,lastMode,ts}，无记录返回 null
  update(courseId, patch),   // try/catch 安全写 localStorage("cwd_progress_v1")，stars 取 max
  totalStars(),              // 所有课程 stars 之和
  nextCourse(courseId)       // 同分类的下一个未完成课件（环形），全完成返回 null
};
function showToast(msg);     // #toast 显示 2.5s
function refreshAccentUI();  // 刷新页面上所有 [data-accent] 按钮的 .on 状态
```

## 3. 课件数据（data.js 完整内容，照抄）

```js
const CATEGORIES = [
  {id:"all",      label:"全部",     emoji:"📚"},
  {id:"storybook",label:"绘本故事", emoji:"📖"},
  {id:"phonics",  label:"自然拼读", emoji:"🔤"},
  {id:"topic",    label:"主题单词", emoji:"🏫"}
];

const COURSES = [
  {
    id:"setting-table", type:"storybook", category:"storybook",
    title:"Setting the Table", zhTitle:"摆餐桌", emoji:"🍽️",
    modes:["words","read","talk","game","quiz"],
    bg:"linear-gradient(180deg,#FFF3C4 0%,#FFF9EC 40%)",
    words:[
      {en:"fork",  zh:"叉子",emoji:"🍴"},{en:"spoon", zh:"勺子",emoji:"🥄"},
      {en:"knife", zh:"刀",  emoji:"🔪"},{en:"plate", zh:"盘子",emoji:"🍽️"},
      {en:"bowl",  zh:"碗",  emoji:"🥣"},{en:"glass", zh:"杯子",emoji:"🥛"},
      {en:"cup",   zh:"茶杯",emoji:"☕"},{en:"napkin",zh:"餐巾",emoji:"🧻"}
    ],
    story:{template:"the-noun"},  // 第 i 页句子: "The {word}."
    patterns:[
      {q:"What is it?",           a:"It's a {word}."},
      {q:"Can you see the {word}?",a:"Yes, I can!"}
    ],
    game:{scene:"dining-table", slots:[
      {en:"plate", left:"50%",top:"50%",tf:"translate(-50%,-50%)"},
      {en:"napkin",left:"50%",top:"14%",tf:"translate(-50%,0)"},
      {en:"fork",  left:"10%",top:"34%",tf:"translate(0,0)"},
      {en:"knife", left:"4%", top:"62%",tf:"translate(0,0)"},
      {en:"spoon", left:"16%",top:"84%",tf:"translate(0,0)"},
      {en:"glass", left:"82%",top:"22%",tf:"translate(-50%,0)"},
      {en:"cup",   left:"82%",top:"52%",tf:"translate(-50%,0)"},
      {en:"bowl",  left:"68%",top:"78%",tf:"translate(-50%,0)"}
    ]}
  },
  {
    id:"a-park", type:"storybook", category:"storybook",
    title:"A Park", zhTitle:"公园", emoji:"🌳",
    modes:["words","read","talk","game","quiz"],
    bg:"linear-gradient(180deg,#D6F0FF 0%,#FFF9EC 45%)",
    words:[
      {en:"tree", zh:"树",  emoji:"🌳"},{en:"flower",zh:"花", emoji:"🌸"},
      {en:"bird", zh:"小鸟",emoji:"🐦"},{en:"duck",  zh:"鸭子",emoji:"🦆"},
      {en:"bench",zh:"长椅",emoji:"🪑"},{en:"kite",  zh:"风筝",emoji:"🪁"},
      {en:"ball", zh:"球",  emoji:"⚽"},{en:"slide", zh:"滑梯",emoji:"🛝"}
    ],
    story:{template:"i-see"},     // 第 i 页句子: "I see a {word}."
    patterns:[
      {q:"What do you see?",      a:"I see a {word}."},
      {q:"Do you like the {word}?",a:"Yes, I do!"}
    ],
    game:{scene:"grid", boardTitle:"Put them back in the park!"}
  },
  {
    id:"classroom", type:"topic", category:"topic",
    title:"My Classroom", zhTitle:"我的教室", emoji:"🏫",
    modes:["words","talk","game","quiz"],
    bg:"linear-gradient(180deg,#FFE8F0 0%,#FFF9EC 50%)",
    words:[
      {en:"door",    zh:"门",  emoji:"🚪"},{en:"board",   zh:"黑板",emoji:"🪧"},
      {en:"computer",zh:"电脑",emoji:"💻"},{en:"window",  zh:"窗户",emoji:"🪟"},
      {en:"clock",   zh:"时钟",emoji:"🕒"},{en:"book",    zh:"书",  emoji:"📚"},
      {en:"pencil",  zh:"铅笔",emoji:"✏️"},{en:"bag",     zh:"书包",emoji:"🎒"}
    ],
    patterns:[
      {q:"What is it!",                     a:"It's a {word}."},
      {q:"I can see a {word}. Can you see?",a:"Yes, I can!"}
    ],
    game:{scene:"grid", boardTitle:"Put them back in the classroom!"}
  },
  {
    id:"opw-am", type:"phonics", category:"phonics",
    title:"-am Words", zhTitle:"自然拼读 am", emoji:"🔤",
    family:"am", sound:"/æm/",
    modes:["phonics","words","game","quiz"],
    bg:"linear-gradient(180deg,#EDE7FF 0%,#FFF9EC 50%)",
    words:[
      {en:"ram",zh:"公羊",emoji:"🐏",parts:["r","am"]},
      {en:"jam",zh:"果酱",emoji:"🍯",parts:["j","am"]},
      {en:"dam",zh:"水坝",emoji:"🏞️",parts:["d","am"]},
      {en:"yam",zh:"山药",emoji:"🍠",parts:["y","am"]}
    ],
    game:{scene:"jump-say"}
  }
];
```

## 4. index.html DOM 骨架（id/class 精确契约）

```html
<body>
  <div id="toast" class="toast hidden"></div>

  <section id="home" class="page">
    <!-- 装饰: .cloud × 2 (飘动云朵, 从原文件迁移), .sun (可选) -->
    <header class="home-head">
      <h1 class="home-title">🌈 Fun English</h1>
      <div class="home-sub">儿童英语课件 · 点击卡片开始</div>
      <div class="home-tools">
        <div class="accent-toggle" id="accentToggle">
          <button type="button" class="acc-btn" data-accent="us">🇺🇸 US</button>
          <button type="button" class="acc-btn" data-accent="uk">🇬🇧 UK</button>
        </div>
        <div class="total-stars" id="totalStars">⭐ 0</div>
      </div>
    </header>
    <div id="continueBox" class="continue-box hidden"></div>
    <nav class="chip-row" id="chipRow"></nav>
    <div class="course-grid" id="courseGrid"></div>
    <footer class="home-foot">Made with ❤️ · 家长提示：右上角切换美音/英音</footer>
  </section>

  <section id="course" class="page hidden">
    <div class="stars" id="starBar">
      <span class="star-icons" id="starIcons"></span>
      <span id="starCount">0/0</span>
    </div>
    <div class="topbar">
      <button type="button" class="home-btn" id="homeBtn">🏠</button>
      <div class="mode-tabs" id="modeTabs"></div>
      <div class="accent-toggle small" id="accentToggleCourse">
        <button type="button" class="acc-btn" data-accent="us">🇺🇸</button>
        <button type="button" class="acc-btn" data-accent="uk">🇬🇧</button>
      </div>
    </div>
    <main class="mode-container" id="modeContainer"></main>
  </section>
</body>
```

### app.js 动态生成的标记（css 必须覆盖这些 class）

```html
<!-- chip -->
<button type="button" class="chip on" data-cat="all">📚 全部</button>

<!-- course card -->
<button type="button" class="course-card" data-id="setting-table">
  <div class="cc-emoji">🍽️</div>
  <div class="cc-title">Setting the Table</div>
  <div class="cc-zh">摆餐桌 · 绘本故事</div>
  <div class="cc-progress"><span class="cc-stars">⭐ 5/8</span></div>
  <!-- 或已完成: <div class="cc-progress"><span class="cc-badge">🏅 完成</span></div> -->
</button>

<!-- continue card -->
<button type="button" class="continue-card" data-id="...">▶ 继续 🍽️ Setting the Table · ⭐5/8</button>
```

### engine.js 动态生成的标记（css 必须覆盖）

模式 tab（#modeTabs 内）：
```html
<button type="button" class="tab on" data-mode="words">🃏 Words</button>
```
label 映射：words→`🃏 Words 单词`, phonics→`🔤 Phonics 拼读`, read→`📖 Read 点读`, talk→`🗣️ Talk 对话`, game→`🎮 Game 游戏`, quiz→`👂 Quiz 测验`。

星星（#starIcons 内）：`<span class="star lit">⭐</span>` × words.length（lit=已获得）。

**words 模式**：`.card-grid > .word-card > .emoji/.word/.zh`（同原版；点击卡片 `.said` 动画 + 发音 `The {word}. The {word}.` rate 0.55）。

**phonics 模式**（仅 phonics 课）：
```html
<div class="phonic-hint">👆 点卡片听拼读：r · am · ram!</div>
<div class="phonic-grid">
  <div class="phonic-card">
    <div class="letter-blocks"><span class="lb onset">r</span><span class="lb rime">am</span></div>
    <div class="phonic-emoji">🐏</div>
    <div class="phonic-word">ram</div>
    <div class="phonic-zh">公羊</div>
  </div>×4
</div>
```
行为：点击卡片 → 依次读 parts（"r" 停顿 "am"）再读整词 "ram"，期间 `.lb` 依次加 `.active` 高亮脉冲，读完 `.phonic-card` 加 `.blended`（两个块合拢 + 词放大弹跳）。**onset 首字母块用珊瑚色 --coral，rime 用天蓝 --sky**（模仿老师卡片首字母红色高亮）。

**read 模式**（有 story 的课）：结构同原版 `.book > .page-tag/.story-emoji/.sentence > .s-word(.target/.hl)` + `.nav-row > .nav-arrow/.listen-btn` + `.page-dots > .dot(.on)`。句子由 template 生成：
- `the-noun` → tokens: ["The", word, "."]
- `i-see` → tokens: ["I","see","a",word,"."]（word 是 target）

**talk 模式**（有 patterns 的课）：
```html
<div class="talk-wrap">
  <div class="talk-pattern-label">🗣️ 句型 1 / 2</div>
  <div class="talk-card">
    <div class="talk-emoji">🍴</div>
    <button type="button" class="bubble q">❓ Can you see the fork?</button>
    <button type="button" class="bubble a">💬 Yes, I can!</button>
  </div>
  <div class="nav-row">
    <button type="button" class="nav-arrow">◀</button>
    <button type="button" class="listen-btn">🔊 Next word 下一个</button>
    <button type="button" class="nav-arrow">▶</button>
  </div>
  <div class="page-dots talk-dots"><!-- 每词一个 .dot --></div>
</div>
```
行为：`{word}` 用当前词替换并首字母大写显示在 q 气泡；点 q 气泡→读问句（bubble 加 `.said`）；点 a 气泡→读答句；当前词 q+a 都读过 → addStar + dot 变 on；◀▶ 换词（环形）。pattern 通过"句型 1/2"切换（点 label 或答完后自动轮换，二选一实现，简单优先）。

**game 模式** — 三个场景模板：
1. `dining-table`：同原版 `.table-obj`（木桌色 #D9A066 边 #8B5A2B）+ 绝对定位 `.slot(.filled)` + `.tray > .tray-item(.used)`，prompt `Put the 🍴 fork on the table!`。
2. `grid`：`.grid-board`（大圆角卡片，浅色渐变背景 + dashed 边框）内部 CSS grid 4 列放 `.slot(.filled)`，上方 `.game-prompt` 显示 boardTitle + 目标词；tray 同上。prompt：`Put the {emoji} {word} in!`
3. `jump-say`：`.jump-grid` 4 个大 `.jump-card`（emoji+word）。prompt `Jump to 🐏 ram!`（发音 "Jump to ram!"）。点对：卡片 `.bounce` + star + ding；点错 `.shake` + "Try again"。2 轮（打乱顺序）后 → done。

所有 game 场景通用：`.game-wrap > .game-prompt(.needle 高亮目标词) + .scene + .tray`；答对 `slot.filled` 掉落动画 `slotDrop`（迁移原 keyframes）。

**quiz 模式**：同原版 `.quiz-box > .quiz-progress/.quiz-q/.quiz-emoji/.quiz-opts > .quiz-opt(.right/.wrong)`。题数 = words.length，顺序出题，3 选项（目标+2随机干扰），完成后 → done。

**done 视图**（渲染进 #modeContainer）：
```html
<div class="done-wrap">
  <div class="done-trophy">🏆</div>
  <div class="done-title">Amazing! 太棒了！</div>
  <div class="done-sub">You finished Setting the Table! 你完成了《摆餐桌》</div>
  <div class="done-emoji-row">🍴🥄🔪🍽️🥣🥛☕🧻</div><!-- course.words 的 emoji 串 -->
  <div class="done-actions">
    <button type="button" class="big-btn alt">🏠 Home 回首页</button>
    <button type="button" class="big-btn">🔁 Again 再玩一次</button>
    <button type="button" class="big-btn grass">➡️ Next 下一课</button><!-- nextCourse 为 null 时整个隐藏 -->
  </div>
</div>
```
进入 done 时：rainConfetti()（迁移原撒花代码）+ 语音 "Wow! You did it! Great job!" + Progress.update({done:true})。

## 5. voice.js 规格细节

```js
const ACCENTS = {
  us:{ lang:"en-US", names:["google us english","samantha","ava","aria","jenny","zira","allison","susan","victoria","catherine"] },
  uk:{ lang:"en-GB", names:["google uk english female","karen","moira","tessa","serena","kate","libby","sonia","martha","fiona"] }
};
```
- `resolve(accent)`：`speechSynthesis.getVoices()` 过滤 `v.lang` 以 accent.lang 开头（不区分大小写）→ 按 names 白名单出现位置打分（越靠前分越高）排序 → 返回第一个或 null。同时记录 `Voice.degraded`（目标口音完全无语音时 true）。
- `init()`：读 localStorage("cwd_accent")（默认 "us"，try/catch）→ resolve；监听 `speechSynthesis.onvoiceschanged` 重新 resolve（iOS 语音延迟到达）。每次 resolve 后调用 `window.refreshAccentUI?.()`。
- `speak(text,{rate=0.62,pitch=1.12,onend})`：`speechSynthesis.cancel()` → `setTimeout(60ms)` → 新建 utterance（有解析到 voice 就设 `u.voice`，否则只设 `u.lang = accent对应的lang`）→ speak。连续快速点击不吞音。
- `setAccent(a)`：更新 accent → resolve → 持久化 → `refreshAccentUI?.()` → 若 degraded 调 `window.showToast?.("当前设备没有找到英音语音，已用默认发音 🙈")` → 否则试播 "Hello!"。
- `ding(good)`：从原文件逐行迁移（WebAudio C5-E5-G5 / E4-C4）。
- **iOS 兼容层（从原文件迁移，必须保留）**：首次 touchstart/click 解锁 AudioContext + 空 utterance；每 15s `speechSynthesis.resume()` 保活；`visibilitychange` 回前台强制 resume。
- 首选音色均为**女声**（白名单全是女声名）。

## 6. app.js 规格细节

- bootstrap：`Voice.init()` → 绑定 document 级事件委托 `[data-accent]` click → `Voice.setAccent` → 绑定 hashchange → 解析当前 hash 渲染。
- `renderHome()`：计算 totalStars → 渲染 chips（默认 cat=all，点击重渲网格）→ 渲染 continueBox（最近 ts 的未完成课件，无则隐藏）→ 渲染 courseGrid（按当前 cat 过滤；卡片点击 `location.hash = "#/course/"+id`）。#home 需要可滚动（内部滚动，html/body 保持 overflow hidden）。
- 路由：`#/` → Engine.stop() + show #home hide #course；`#/course/xxx` → 课程存在则 show #course + Engine.start(xxx)，否则回 `#/`。
- `Progress`：localStorage key `cwd_progress_v1`，值 `{courseId:{stars,total,done,lastMode,ts}}`。所有读写 try/catch（iOS 隐私模式）。`update` 时 stars 取 max(旧,新)，Engine 每次 addStar / switchMode 时调用 update（lastMode 记录）。
- `showToast(msg)`：#toast 移除 .hidden → 2.5s 后加回。css：底部居中悬浮圆角黑底白字。
- `refreshAccentUI()`：所有 `[data-accent]` 按钮按 `Voice.accent` 切换 `.on`。

## 7. 样式规格（css/style.css）

### 设计 token（从原文件 :root 迁移，一字不改）
```css
:root{
  --sun:#FFC93C; --coral:#FF6B6B; --sky:#4ECDC4; --grass:#95E06C;
  --grape:#A78BFA; --ink:#3D3450; --paper:#FFF9EC;
  --shadow:0 10px 0 rgba(0,0,0,.12);
}
```
字体栈、`user-select:none`、`-webkit-tap-highlight-color:transparent`、`.hidden{display:none!important}` 全部迁移。

### 首页（#home）
- 背景：`linear-gradient(180deg,#8ED6FF 0%,#C9F0FF 55%,#DFFB9E 55.5%,#B8E986 100%)`（原封面天空草地）+ 迁移 .cloud 漂移动画。
- `.home-head`：大标题彩虹逐字着色（每字不同 token 色，参考原 title-word 的 bounceCh 动画）。
- `.accent-toggle`：白底 3px ink 边圆角胶囊，内两个 `.acc-btn`；`.acc-btn.on` 背景 --sun 放大 1.06（参考原 .tab.on）。`.small` 变体：字号更小只显示旗帜。
- `.chip-row`：横向可滚动，`.chip` 同 .tab 样式，`.chip.on` 用 --sky。
- `.course-grid`：`repeat(auto-fill,minmax(220px,1fr))`；`.course-card` 白底 4px ink 边 30px 圆角 --shadow，hover/active 缩放，`.cc-emoji` 巨大（clamp 56-90px），`.cc-title` 粗黑，`.cc-zh` 灰紫小字，`.cc-badge` 金色。
- `.continue-card`：全宽 --coral 大按钮带 --shadow。
- `.home-foot`：半透明白小字。

### 课程页（#course）
- `.stars` 星条、`.topbar`、`.mode-tabs`、`.tab(.on)`：从原文件迁移。`.home-btn`：圆形白底 3px ink 边，大号 🏠。
- `#modeContainer`：flex:1 相对定位 overflow hidden；模式视图都在其内渲染；背景色由 Engine 设置为 `course.bg`。
- 各模式样式全部从原文件对应区块迁移（Learn/Story/Game/Quiz/Done 的 class 改名按本契约）。
- `.big-btn(.alt/.grass)`：迁移原 big-btn；.alt 白底 ink 字；.grass 用 --grass。
- 新增：`.toast`、`.phonic-*`（onset 块 --coral 白字、rime 块 --sky ink 字，均 3px ink 边圆角 16px，`.active` 脉冲 scale 1.15，`.blended` 时两块 margin 收拢 + `.phonic-word` 弹跳放大）、`.bubble.q/.a`（对话气泡：q 白底、a --grass 底，大圆角带小尾巴可选，`.said` 时描边高亮）、`.jump-card`（超大 emoji+word 卡）、`.grid-board`（浅色渐变 + 3px dashed ink 边 + 26px 圆角，内部 4 列 grid）。

### 响应式（全部从原文件迁移对应断点并适配新 class）
- `@supports (padding: env(safe-area-inset-top))` 安全区适配（stars/topbar/home-head）。
- `@media (max-width:400px)`：chip/tab/卡片缩小。
- `@media (orientation:landscape) and (max-height:500px)`：压缩模式。
- `@media (min-width:768px) and (min-height:768px)`：iPad 放大。
- `@media (max-height:380px)`：超小高度兜底。
- 首页在窄屏单列、iPad 3-4 列。
- #home 内部滚动：`#home{overflow-y:auto;-webkit-overflow-scrolling:touch}`，html/body 保持 overflow hidden。
- 阻止 iOS 双击缩放/橡皮筋的 JS 由 engine.js 或 app.js 全局绑定（从原文件迁移那段 touch 事件代码，放 app.js）。

## 8. 迁移来源

原单文件课件已备份至 `legacy/setting-table-standalone.html`。其中所有动画 keyframes（bounceCh/wiggle/pulse/cardIn/saidAnim/emoJump/floaty/wordPop/slotDrop/trayIn/confFall/optRight/shake/trophyIn/starPop/sunSpin/drift）、iOS 兼容 JS、ding/speak 实现均为迁移素材，**视觉风格必须与原版一致**（粗描边、大圆角、实底投影 0 10px 0、高饱和糖果色、Comic Sans/Chalkboard/Baloo 2 字体栈）。

## 9. 验收清单（构建完成后逐条自查）

1. `file://` 直接打开 index.html 无任何 console 错误，四课件可见可进入。
2. 首页分类筛选、继续学习、总星数正确。
3. 课程内 tab 只显示该课 modes 字段声明的模式。
4. 星星数 = words.length（setting-table 8、a-park 8、classroom 8、opw-am 4），无硬编码数字。
5. game 答对 1.6s 内切 quiz 模式无语音串台（timers 已清）。
6. 连续快速点 10 次单词卡每次都发音（60ms 延迟生效）。
7. 🇺🇸/🇬🇧 切换后两个位置的 toggle 状态同步，刷新后保持。
8. 课程页 iOS 手势返回（浏览器后退）→ 回到首页而非退出。
9. done 屏三按钮：回首页 hash 变 `#/`、再玩一次不刷新页面、下一课跳同分类下一未完成课件。
10. localStorage 进度跨刷新保留（⭐ 数、完成徽章）。

## 10. v2 重构增量（学习地图 / 星池分模式 / 美术字典）

### 10.1 美术字典（js/art.js，先于 data.js 加载）
```js
const art = svg => '<img src="data:image/svg+xml,' + encodeURIComponent(svg) + '">';
const ANIMAL_ART = { fish, bird, giraffe, dog, turtle, rabbit, cat, frog, duck }; // 手绘糖果风 kawaii 贴纸
const SHAPE_ART  = { triangle, circle, star, rectangle, square, heart };
```
data.js 词表 `emoji` 字段统一引用字典（`emoji:ANIMAL_ART.cat`），禁止内联 SVG。消费端（word-card/quiz/tray/sudoku/pop 等）通过全局 CSS `img{height:1em;width:1em;object-fit:contain}` 按 1em 缩放。

### 10.2 学习地图（STATIONS，data.js）
首页 cat=all 时按站点分组渲染；分类 chip 激活时回退平铺网格。
```js
const STATIONS = [
  {id:"starter", emoji:"📖", title:"启蒙绘本站", sub:"词汇 · 句型", courses:["setting-table","a-park","what-is-it"]},
  {id:"life",    emoji:"🏫", title:"生活认知站", sub:"主题 · 数学", courses:["classroom","how-many"]},
  {id:"phonics", emoji:"🔤", title:"拼读乐园",  sub:"a · e · i · o · u", courses:[/* 9 门拼读课 */]},
  {id:"brain",   emoji:"🧩", title:"脑力小站",  sub:"数独 · 配对", courses:[]}  // 渲染数独启动器
];
```
数独启动器由 renderHome 动态渲染进 brain 站（index.html 不再有静态 #sudokuCard），`.sk-btn` 用 document 级事件委托绑定（应对重复渲染）。

### 10.3 模式矩阵（全部 14 门课）
- 绘本 3 门：`words,flash,read,talk,trace,game,quiz`（traceWords 3 词）
- 主题 2 门：classroom 无 read（`words,flash,talk,trace,game,quiz`）；how-many 七模式不变（traceWords:["it","is"]）
- 拼读 9 门：`phonics,words,flash,trace,game,quiz` + `vowel:"a|e|i o|u"` 字段（jump-say 皮肤 `js-{vowel}` class）
- 每课新增 `traceWords:[...]`（描红词，2-3 个）；`what-is-it` 的 game.scene 改为 `"memory"`

### 10.4 星池分模式（engine.js MODE_STARS + app.js Progress v2）
```js
const MODE_STARS = { words:3, flash:1, read:2, talk:2, phonics:2, trace:2, game:2, quiz:2 };
```
- 课程总星 = Σ MODE_STARS(模式)；`Engine.stars = {mode:n}` 按模式记账，addStar 只记入当前模式且不超过该模式上限（words/flash 按去重词唯一授星）。
- localStorage key `cwd_progress_v2`：`{courseId:{modes:{},done,lastMode,ts}}`，update 按模式 max 合并、done 只置真。
- 启动时一次性迁移 v1（按 MODE_STARS 权重比例分配，余数给最大权重模式；保留 v1 键不删）。
- 数独胜利记 `modes:{sudoku:n}` 计入总星。

### 10.5 Memory 配对翻翻乐（新 game 场景）
4 对（art 图卡 ↔ word 词卡）共 8 张 `.mem-card`，3D 翻转（`.mem-inner` preserve-3d + `.flipped/.matched` rotateY180），`data-p` 配对色提示（coral/sky/sun/grape 边框）。翻卡读词、配对 ding+授星、全配对后 complete("game")。

### 10.6 游戏修复
- dining-table 槽位 8 点新坐标（3 行错位布局，环心距 ≥110px，全部 tf:translate(-50%,-50%)）；环 1.4em；落点动画拆分 `.table-obj`→slotDropCenter（内嵌 -50% 平移）/`.grid-board`→slotDrop。
- count-pop：N=4 布局 [5,30.5,56,81.5]+width:21%；tilt ±4°；光晕 `at 50% 52%` 收紧椭圆。

### 10.7 验收
`python3 tests/smoke.py [base_url]` 覆盖：站点渲染/chips 回退、14 课×全模式渲染、槽位零重叠、泡泡居中±1.5%、memory 翻配对、SVG 艺术全覆盖、trace、vowel 皮肤、星池封顶、v1→v2 迁移、零 console 错误。

// data.js — courseware catalog: categories + stations + 12 courses (see SPEC.md §3)

const CATEGORIES = [
  {id:"all",      label:"全部",     emoji:"📚"},
  {id:"storybook",label:"绘本故事", emoji:"📖"},
  {id:"phonics",  label:"自然拼读", emoji:"🔤"},
  {id:"topic",    label:"主题单词", emoji:"🏫"}
];

const STATIONS = [
  {id:"starter", emoji:"📖", title:"启蒙绘本站", sub:"词汇 · 句型", courses:["setting-table","a-park","what-is-it"]},
  {id:"life",    emoji:"🏫", title:"生活认知站", sub:"主题 · 数学", courses:["classroom","how-many"]},
  {id:"phonics", emoji:"🔤", title:"拼读乐园",  sub:"a · e · i · o · u", courses:["opw-am","opw2-u1","opw2-u2","opw2-u3","opw2-u4","opw2-u5","opw2-u6","opw2-u7","opw2-u8"]},
  {id:"brain",   emoji:"🧩", title:"脑力小站",  sub:"数独 · 配对", courses:[]}
];

const rep = (s, n) => Array(n).fill(s).join("");

const COURSES = [
  {
    id:"setting-table", type:"storybook", category:"storybook",
    title:"Setting the Table", zhTitle:"摆餐桌", emoji:"🍽️",
    modes:["words","flash","read","talk","trace","game","quiz"], traceWords:["cup","fork","bowl"],
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
      {en:"napkin",left:"17.6%",top:"17.3%",tf:"translate(-50%,-50%)"},
      {en:"plate", left:"50%",  top:"17.3%",tf:"translate(-50%,-50%)"},
      {en:"glass", left:"82.4%",top:"17.3%",tf:"translate(-50%,-50%)"},
      {en:"fork",  left:"25%",  top:"50%",  tf:"translate(-50%,-50%)"},
      {en:"cup",   left:"66.9%",top:"50%",  tf:"translate(-50%,-50%)"},
      {en:"knife", left:"14%",  top:"82.7%",tf:"translate(-50%,-50%)"},
      {en:"spoon", left:"44.1%",top:"82.7%",tf:"translate(-50%,-50%)"},
      {en:"bowl",  left:"74.3%",top:"82.7%",tf:"translate(-50%,-50%)"}
    ]}
  },
  {
    id:"a-park", type:"storybook", category:"storybook",
    title:"A Park", zhTitle:"公园", emoji:"🌳",
    modes:["words","flash","read","talk","trace","game","quiz"], traceWords:["tree","kite","ball"],
    bg:"linear-gradient(180deg,#D6F0FF 0%,#FFF9EC 45%)",
    words:[
      {en:"tree", zh:"树",  emoji:"🌳"},{en:"flower",zh:"花", emoji:"🌸"},
      {en:"bird", zh:"小鸟",emoji:ANIMAL_ART.bird},{en:"duck",  zh:"鸭子",emoji:ANIMAL_ART.duck},
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
    modes:["words","flash","talk","trace","game","quiz"], traceWords:["book","bag","pen"],
    bg:"linear-gradient(180deg,#FFE8F0 0%,#FFF9EC 50%)",
    words:[
      {en:"door",    zh:"门",  emoji:"🚪"},{en:"board",   zh:"黑板",emoji:"🪧"},
      {en:"computer",zh:"电脑",emoji:"💻"},{en:"window",  zh:"窗户",emoji:"🪟"},
      {en:"clock",   zh:"时钟",emoji:"🕒"},{en:"book",    zh:"书",  emoji:"📚"},
      {en:"pencil",  zh:"铅笔",emoji:"✏️"},{en:"bag",     zh:"书包",emoji:"🎒"}
    ],
    patterns:[
      {q:"What is it?",                     a:"It's a {word}."},
      {q:"I can see a {word}. Can you see?",a:"Yes, I can!"}
    ],
    game:{scene:"grid", boardTitle:"Put them back in the classroom!"}
  },
  {
    id:"opw-am", type:"phonics", category:"phonics",
    title:"-am Words", zhTitle:"自然拼读 am", emoji:"🔤",
    family:"am", sound:"/æm/",
    modes:["phonics","words","flash","trace","game","quiz"], traceWords:["ram","jam"], vowel:"a",
    bg:"linear-gradient(180deg,#EDE7FF 0%,#FFF9EC 50%)",
    words:[
      {en:"ram",zh:"公羊",emoji:"🐏",parts:["r","am"]},
      {en:"jam",zh:"果酱",emoji:"🍯",parts:["j","am"]},
      {en:"dam",zh:"水坝",emoji:"🏞️",parts:["d","am"]},
      {en:"yam",zh:"山药",emoji:"🍠",parts:["y","am"]}
    ],
    game:{scene:"jump-say"}
  },

  /* ===== 今日教学：绘本《What is it?》（Unit 1 · Session 5） ===== */
  {
    id:"what-is-it", type:"storybook", category:"storybook",
    title:"What Is It?", zhTitle:"这是什么", emoji:"🐠",
    modes:["words","flash","read","talk","trace","game","quiz"], traceWords:["cat","dog","fish"],
    bg:"linear-gradient(180deg,#D8F5D0 0%,#FFF9EC 45%)",
    words:[
      {en:"fish",   zh:"鱼",   emoji:ANIMAL_ART.fish},
      {en:"bird",   zh:"小鸟", emoji:ANIMAL_ART.bird},
      {en:"giraffe",zh:"长颈鹿",emoji:ANIMAL_ART.giraffe},
      {en:"dog",    zh:"小狗", emoji:ANIMAL_ART.dog},
      {en:"turtle", zh:"乌龟", emoji:ANIMAL_ART.turtle},
      {en:"rabbit", zh:"兔子", emoji:ANIMAL_ART.rabbit},
      {en:"cat",    zh:"小猫", emoji:ANIMAL_ART.cat},
      {en:"frog",   zh:"青蛙", emoji:ANIMAL_ART.frog}
    ],
    story:{template:"it-is-a"},
    patterns:[
      {q:"What is it?", a:"It is a {word}."}
    ],
    game:{scene:"memory"}
  },

  {
    id:"how-many", type:"topic", category:"topic",
    title:"How Many?", zhTitle:"数一数", emoji:"🔢",
    modes:["words","flash","read","talk","trace","game","quiz"],
    traceWords:["it", "is"],
    bg:"linear-gradient(180deg,#E3E0FF 0%,#FFF9EC 45%)",
    words:[
      {en:"one", noThe:true,      zh:"一",     emoji:"1️⃣"},
      {en:"two", noThe:true,      zh:"二",     emoji:"2️⃣"},
      {en:"three", noThe:true,    zh:"三",     emoji:"3️⃣"},
      {en:"four", noThe:true,     zh:"四",     emoji:"4️⃣"},
      {en:"rabbit",   zh:"兔子",   emoji:ANIMAL_ART.rabbit},
      {en:"triangle",  zh:"三角形", emoji:SHAPE_ART.triangle},
      {en:"circle",    zh:"圆形",   emoji:SHAPE_ART.circle},
      {en:"star",      zh:"星星",   emoji:SHAPE_ART.star},
      {en:"rectangle", zh:"长方形", emoji:SHAPE_ART.rectangle},
      {en:"square",    zh:"正方形", emoji:SHAPE_ART.square},
      {en:"heart",     zh:"爱心",   emoji:SHAPE_ART.heart}
    ],
    story:{pages:[
      {emojis:rep(ANIMAL_ART.rabbit,4), text:"There are four rabbits."},
      {emojis:rep(SHAPE_ART.triangle,3), text:"There are three triangles."},
      {emojis:rep(SHAPE_ART.circle,4),   text:"There are four circles."},
      {emojis:rep(SHAPE_ART.star,2),     text:"There are two stars."},
      {emojis:rep(SHAPE_ART.square,2),   text:"There are two squares."},
      {emojis:rep(SHAPE_ART.heart,5),    text:"There are five hearts."}
    ]},
    talkPairs:[
      {emojis:rep(ANIMAL_ART.rabbit,4), q:"How many rabbits are there?",   a:"There are four rabbits."},
      {emojis:rep(SHAPE_ART.triangle,3), q:"How many triangles are there?", a:"There are three triangles."},
      {emojis:rep(SHAPE_ART.circle,4),   q:"How many circles are there?",   a:"There are four circles."},
      {emojis:rep(SHAPE_ART.star,2),     q:"How many stars are there?",     a:"There are two stars."},
      {emojis:rep(SHAPE_ART.square,2),   q:"How many squares are there?",   a:"There are two squares."},
      {emojis:rep(SHAPE_ART.heart,4),    q:"How many hearts are there?",    a:"There are four hearts."}
    ],
    patterns:[
      {q:"What is it?", a:"It is a {word}."}
    ],
    game:{scene:"count-pop", rounds:[
      {en:"rabbit",    n:4},
      {en:"triangle",  n:3},
      {en:"circle",    n:4},
      {en:"star",      n:2},
      {en:"rabbit",    n:2},
      {en:"triangle",  n:4},
      {en:"rectangle", n:2},
      {en:"square",    n:3},
      {en:"heart",     n:4},
      {en:"rectangle", n:4}
    ]}
  },

  /* ===== Oxford Phonics World 2 · 本学期课本（8 个单元） ===== */
  {
    id:"opw2-u1", type:"phonics", category:"phonics",
    title:"Unit 1 · Short a", zhTitle:"拼读 U1 · 短元音 a", emoji:"🐜",
    family:"a/am/an", sound:"/æ/",
    modes:["phonics","words","flash","trace","game","quiz"], traceWords:["cat","fan","pan"], vowel:"a",
    bg:"linear-gradient(180deg,#FFE3E3 0%,#FFF9EC 50%)",
    words:[
      {en:"cat",zh:"小猫",emoji:ANIMAL_ART.cat,parts:["c","at"]},{en:"ant",zh:"蚂蚁",emoji:"🐜",parts:["a","nt"]},
      {en:"yak",zh:"牦牛",emoji:"🐃",parts:["y","ak"]},{en:"ax", zh:"斧头",emoji:"🪓",parts:["a","x"]},
      {en:"ram",zh:"公羊",emoji:"🐏",parts:["r","am"]},{en:"jam",zh:"果酱",emoji:"🍯",parts:["j","am"]},
      {en:"yam",zh:"山药",emoji:"🍠",parts:["y","am"]},{en:"dam",zh:"水坝",emoji:"🏞️",parts:["d","am"]},
      {en:"fan",zh:"风扇",emoji:"🪭",parts:["f","an"]},{en:"man",zh:"男人",emoji:"👨",parts:["m","an"]},
      {en:"pan",zh:"平底锅",emoji:"🍳",parts:["p","an"]},{en:"can",zh:"罐头",emoji:"🥫",parts:["c","an"]}
    ],
    game:{scene:"jump-say"}
  },
  {
    id:"opw2-u2", type:"phonics", category:"phonics",
    title:"Unit 2 · Short a", zhTitle:"拼读 U2 · 短元音 a", emoji:"🧢",
    family:"ad/ag/ap/at", sound:"/æ/",
    modes:["phonics","words","flash","trace","game","quiz"], traceWords:["bag","cap","map"], vowel:"a",
    bg:"linear-gradient(180deg,#FFF3D6 0%,#FFF9EC 50%)",
    words:[
      {en:"dad",zh:"爸爸",emoji:"🧔",parts:["d","ad"]},{en:"pad",zh:"便签本",emoji:"📝",parts:["p","ad"]},
      {en:"bag",zh:"书包",emoji:"🎒",parts:["b","ag"]},{en:"rag",zh:"抹布",emoji:"🧼",parts:["r","ag"]},
      {en:"cap",zh:"鸭舌帽",emoji:"🧢",parts:["c","ap"]},{en:"map",zh:"地图",emoji:"🗺️",parts:["m","ap"]},
      {en:"nap",zh:"小睡",emoji:"😴",parts:["n","ap"]},{en:"tap",zh:"水龙头",emoji:"🚰",parts:["t","ap"]},
      {en:"bat",zh:"蝙蝠",emoji:"🦇",parts:["b","at"]},{en:"rat",zh:"老鼠",emoji:"🐭",parts:["r","at"]},
      {en:"hat",zh:"帽子",emoji:"🎩",parts:["h","at"]},{en:"mat",zh:"垫子",emoji:"🟫",parts:["m","at"]}
    ],
    game:{scene:"jump-say"}
  },
  {
    id:"opw2-u3", type:"phonics", category:"phonics",
    title:"Unit 3 · Short e", zhTitle:"拼读 U3 · 短元音 e", emoji:"🐔",
    family:"e/et/en/ed", sound:"/e/",
    modes:["phonics","words","flash","trace","game","quiz"], traceWords:["hen","pen","ten"], vowel:"e",
    bg:"linear-gradient(180deg,#E5F9D8 0%,#FFF9EC 50%)",
    words:[
      {en:"web",zh:"蜘蛛网",emoji:"🕸️",parts:["w","eb"]},{en:"egg",zh:"鸡蛋",emoji:"🥚",parts:["e","gg"]},
      {en:"vet",zh:"兽医",emoji:"👩‍⚕️",parts:["v","et"]},{en:"ten",zh:"十",emoji:"🔟",parts:["t","en"]},
      {en:"jet",zh:"喷气机",emoji:"✈️",parts:["j","et"]},{en:"net",zh:"球网",emoji:"🥅",parts:["n","et"]},
      {en:"wet",zh:"湿的",emoji:"💦",parts:["w","et"]},{en:"pet",zh:"宠物",emoji:"🐾",parts:["p","et"]},
      {en:"hen",zh:"母鸡",emoji:"🐔",parts:["h","en"]},{en:"pen",zh:"钢笔",emoji:"🖊️",parts:["p","en"]},
      {en:"red",zh:"红色",emoji:"🟥",parts:["r","ed"]},{en:"bed",zh:"床",emoji:"🛏️",parts:["b","ed"]}
    ],
    game:{scene:"jump-say"}
  },
  {
    id:"opw2-u4", type:"phonics", category:"phonics",
    title:"Unit 4 · Short i", zhTitle:"拼读 U4 · 短元音 i", emoji:"🖊️",
    family:"i/ip/ib/id", sound:"/ɪ/",
    modes:["phonics","words","flash","trace","game","quiz"], traceWords:["zip","lip","six"], vowel:"i",
    bg:"linear-gradient(180deg,#DFF3FF 0%,#FFF9EC 50%)",
    words:[
      {en:"hip",zh:"臀部",emoji:"👖",parts:["h","ip"]},{en:"ink",zh:"墨水",emoji:"🖋️",parts:["i","nk"]},
      {en:"zip",zh:"拉链",emoji:"🤐",parts:["z","ip"]},{en:"in", zh:"在…里",emoji:"📥",parts:["i","n"]},
      {en:"lip",zh:"嘴唇",emoji:"👄",parts:["l","ip"]},{en:"tip",zh:"尖端",emoji:"💡",parts:["t","ip"]},
      {en:"sip",zh:"啜饮",emoji:"🥤",parts:["s","ip"]},{en:"rip",zh:"撕开",emoji:"✂️",parts:["r","ip"]},
      {en:"bib",zh:"围兜",emoji:"👶",parts:["b","ib"]},{en:"rib",zh:"肋骨",emoji:"🦴",parts:["r","ib"]},
      {en:"kid",zh:"小孩",emoji:"🧒",parts:["k","id"]},{en:"lid",zh:"盖子",emoji:"🫙",parts:["l","id"]}
    ],
    game:{scene:"jump-say"}
  },
  {
    id:"opw2-u5", type:"phonics", category:"phonics",
    title:"Unit 5 · Short i", zhTitle:"拼读 U5 · 短元音 i", emoji:"📌",
    family:"in/ig/it/ix", sound:"/ɪ/",
    modes:["phonics","words","flash","trace","game","quiz"], traceWords:["pin","pig","win"], vowel:"i",
    bg:"linear-gradient(180deg,#EDE7FF 0%,#FFF9EC 50%)",
    words:[
      {en:"pin",zh:"别针",emoji:"📌",parts:["p","in"]},{en:"fin",zh:"鱼鳍",emoji:"🦈",parts:["f","in"]},
      {en:"bin",zh:"垃圾桶",emoji:"🗑️",parts:["b","in"]},{en:"win",zh:"赢",emoji:"🏆",parts:["w","in"]},
      {en:"fig",zh:"无花果",emoji:"🍇",parts:["f","ig"]},{en:"wig",zh:"假发",emoji:"👱",parts:["w","ig"]},
      {en:"big",zh:"大的",emoji:"🐘",parts:["b","ig"]},{en:"dig",zh:"挖",emoji:"⛏️",parts:["d","ig"]},
      {en:"pit",zh:"坑",emoji:"🕳️",parts:["p","it"]},{en:"hit",zh:"打",emoji:"👊",parts:["h","it"]},
      {en:"six",zh:"六",emoji:"6️⃣",parts:["s","ix"]},{en:"mix",zh:"混合",emoji:"🥣",parts:["m","ix"]}
    ],
    game:{scene:"jump-say"}
  },
  {
    id:"opw2-u6", type:"phonics", category:"phonics",
    title:"Unit 6 · Short o", zhTitle:"拼读 U6 · 短元音 o", emoji:"🦊",
    family:"o/ot/op", sound:"/ɒ/",
    modes:["phonics","words","flash","trace","game","quiz"], traceWords:["fox","pot","mop"], vowel:"o",
    bg:"linear-gradient(180deg,#FFE9D0 0%,#FFF9EC 50%)",
    words:[
      {en:"fox",zh:"狐狸",emoji:"🦊",parts:["f","ox"]},{en:"log",zh:"木头",emoji:"🪵",parts:["l","og"]},
      {en:"ox", zh:"公牛",emoji:"🐂",parts:["o","x"]},{en:"rod",zh:"竿子",emoji:"🎣",parts:["r","od"]},
      {en:"pot",zh:"锅",emoji:"🍲",parts:["p","ot"]},{en:"hot",zh:"热的",emoji:"🥵",parts:["h","ot"]},
      {en:"cot",zh:"折叠床",emoji:"🛌",parts:["c","ot"]},{en:"dot",zh:"圆点",emoji:"🔴",parts:["d","ot"]},
      {en:"top",zh:"陀螺",emoji:"🪀",parts:["t","op"]},{en:"mop",zh:"拖把",emoji:"🧹",parts:["m","op"]},
      {en:"hop",zh:"单脚跳",emoji:"🐇",parts:["h","op"]},{en:"pop",zh:"爆米花",emoji:"🍿",parts:["p","op"]}
    ],
    game:{scene:"jump-say"}
  },
  {
    id:"opw2-u7", type:"phonics", category:"phonics",
    title:"Unit 7 · Short u", zhTitle:"拼读 U7 · 短元音 u", emoji:"☀️",
    family:"u/ug/ud/up", sound:"/ʌ/",
    modes:["phonics","words","flash","trace","game","quiz"], traceWords:["bug","cup","sun"], vowel:"u",
    bg:"linear-gradient(180deg,#FFF7D1 0%,#FFF9EC 50%)",
    words:[
      {en:"sun",zh:"太阳",emoji:"☀️",parts:["s","un"]},{en:"up", zh:"向上",emoji:"⬆️",parts:["u","p"]},
      {en:"jug",zh:"壶",emoji:"🫖",parts:["j","ug"]},{en:"hug",zh:"拥抱",emoji:"🤗",parts:["h","ug"]},
      {en:"bug",zh:"虫子",emoji:"🐛",parts:["b","ug"]},{en:"rug",zh:"地毯",emoji:"🟧",parts:["r","ug"]},
      {en:"mug",zh:"马克杯",emoji:"☕",parts:["m","ug"]},
      {en:"bud",zh:"花蕾",emoji:"🌱",parts:["b","ud"]},{en:"mud",zh:"泥",emoji:"🟤",parts:["m","ud"]},
      {en:"pup",zh:"小狗",emoji:"🐶",parts:["p","up"]},{en:"cup",zh:"杯子",emoji:"🥤",parts:["c","up"]}
    ],
    game:{scene:"jump-say"}
  },
  {
    id:"opw2-u8", type:"phonics", category:"phonics",
    title:"Unit 8 · Short u", zhTitle:"拼读 U8 · 短元音 u", emoji:"🥜",
    family:"ut/ub/um/un", sound:"/ʌ/",
    modes:["phonics","words","flash","trace","game","quiz"], traceWords:["nut","cut","run"], vowel:"u",
    bg:"linear-gradient(180deg,#E3F6EC 0%,#FFF9EC 50%)",
    words:[
      {en:"nut",zh:"坚果",emoji:"🥜",parts:["n","ut"]},{en:"hut",zh:"小屋",emoji:"🛖",parts:["h","ut"]},
      {en:"cut",zh:"剪",emoji:"✂️",parts:["c","ut"]},
      {en:"cub",zh:"幼兽",emoji:"🦁",parts:["c","ub"]},{en:"tub",zh:"浴盆",emoji:"🛁",parts:["t","ub"]},
      {en:"gum",zh:"口香糖",emoji:"🍬",parts:["g","um"]},{en:"hum",zh:"哼唱",emoji:"🎵",parts:["h","um"]},
      {en:"bun",zh:"小圆面包",emoji:"🍞",parts:["b","un"]},{en:"run",zh:"跑",emoji:"🏃",parts:["r","un"]},
      {en:"fun",zh:"乐趣",emoji:"🎉",parts:["f","un"]}
    ],
    game:{scene:"jump-say"}
  }
];

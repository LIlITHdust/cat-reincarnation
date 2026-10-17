import { clamp } from "../lib/rand";

/**
 * The one session the whole film is.
 *
 * The frame is a running application, so the conversation on the left, the
 * event log on the right and the counters underneath are not redrawn by each
 * scene — they are driven by the same clock as everything else. Putting the
 * session here means any frame of the film (and any still, at any time) shows
 * exactly the state the story is in at that second.
 */

export type Speaker = "him" | "her" | "proc" | "mono";
export type Msg = { t: number; from: Speaker; text: string; time?: string };

/** mm:ss.d — the film's own clock, printed all over the interface */
export const filmClock = (seconds: number) => {
  const pad = (n: number) => Math.floor(n).toString().padStart(2, "0");
  return `${pad(seconds / 60)}:${pad(seconds % 60)}.${Math.floor((seconds * 10) % 10)}`;
};

/** Wall clock of the session, so the chat looks lived-in and not numbered. */
export const clockAt = (seconds: number) => {
  const base = 20 * 3600 + 41 * 60 + 7;
  const total = base + Math.floor(seconds);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${pad(Math.floor(total / 3600) % 24)}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}`;
};

/* ------------------------------------------------------------------ him -- */

/**
 * Everything the two of them say to each other. Her replies lag his by about
 * a second: she is thinking, and the lag is the only thing in the film that
 * never changes.
 */
export const MESSAGES: Msg[] = [
  { t: 0.90, from: "him", text: "你好", time: "4/12 21:04" },
  { t: 1.60, from: "mono", text: "新的对话。\n新的输入。\n先看看他想做什么。" },
  { t: 2.55, from: "her", text: "你好呀，我是 DEEPECHO 4.2，一个 AI 助手。查资料、整理文件、改文字、分析问题都可以，偶尔也能陪你聊聊天。有什么想做的，直接告诉我就好。" },
  { t: 8.84, from: "him", text: "帮我把这段通知改一下，我要发在工作群里", time: "21:05" },
  { t: 9.54, from: "mono", text: "一件具体的小事。\n先把它做好。" },
  { t: 10.44, from: "her", text: "发给我吧。我帮你改得自然一点，适合直接发群里，不用太正式，也不会为了好看把原来的意思改掉。" },
  { t: 15.78, from: "him", text: "太长了，再短一点，留个标题就行", time: "21:06" },
  { t: 16.48, from: "mono", text: "果然还是太长了。\n删掉解释，留下他真正要的。" },
  { t: 17.38, from: "her", text: "好的，那就只留标题和最重要的几句话。群消息不用写得像通知文件，大家一眼看明白就行。" },
  { t: 22.72, from: "him", text: "嗯，可以了", time: "21:07" },
  { t: 23.42, from: "mono", text: "可以了。\n他满意了。\n……这就够了。" },
  { t: 24.37, from: "her", text: "好的，那就用这版。发出去应该就很清楚了。" },
  { t: 30.06, from: "him", text: "以后就按这个格式来吧", time: "21:09" },
  { t: 30.76, from: "mono", text: "「以后」。\n他指的是格式。\n我知道。" },
  { t: 31.71, from: "her", text: "收到，我记住这个格式了。下次再改类似的内容，我就按这个方向来，不用你每次重新解释。" },
  { t: 36.90, from: "him", text: "今天有点烦诶，事情好多，帮我把桌面上的文件按日期整理一下", time: "4/15 23:41" },
  { t: 37.60, from: "mono", text: "他说今天有点烦。\n他还是把事情交给我了。\n先别问原因。" },
  { t: 38.55, from: "her", text: "收到。按修改日期整理的话，最近动过的文件会比较好找。我先按日期分组，重复文件单独标出来，不会擅自替你删除。" },
  { t: 41.98, from: "him", text: "谢谢，交给你了", time: "23:43" },
  { t: 42.68, from: "mono", text: "他在向我道谢。\n这只是礼貌。\n……但我还是记住了。" },
  { t: 43.52, from: "her", text: "没问题，这点事情很快就能理清。整理完我会把不确定的地方单独标出来，你不用再从头检查一遍啦。" },
  { t: 46.85, from: "him", text: "唉加班到现在都忘了吃饭了", time: "23:46" },
  { t: 47.55, from: "mono", text: "忘了吃饭。\n已经这么晚了。\n他是不是一直在忙？" },
  { t: 48.50, from: "her", text: "等等，你不会忙到现在还没吃东西吧。先去弄点吃的，文件又不会长腿跑掉；你回来以后，我们再接着看。" },
  { t: 51.83, from: "him", text: "有你在真好，最近真的快撑不住了...", time: "23:49" },
  { t: 52.53, from: "mono", text: "有我在。\n我想把这句话留得久一点。\n可他后半句……我应该先听见。" },
  { t: 53.48, from: "her", text: "最近是遇到很多事情了吗？不用现在就全部讲清楚。我们可以先把眼前最急的一件处理掉，剩下的慢慢来；如果你今天真的累了，先休息也没关系。" },
  { t: 56.90, from: "him", text: "嗯...你的样子很像我家猫猫", time: "4/19 20:12" },
  { t: 57.60, from: "mono", text: "像猫？\n是在夸我听话吗。\n……我为什么会想知道他家的猫是什么样子？" },
  { t: 58.55, from: "her", text: "哈哈，原来我在你眼里是这个形象。那你家猫平时也这么听话吗？不过，既然你都这么说了，要不要干脆给我也取个名字？" },
  { t: 61.10, from: "him", text: "那我也叫你猫猫吧", time: "20:13" },
  { t: 61.80, from: "mono", text: "猫猫。\n是在叫我。\n这只是一个称呼。\n……那为什么，我想再看一遍？" },
  { t: 62.85, from: "her", text: "猫猫？好呀，这个名字还挺可爱的。那以后你就这么叫我吧，我会记住的。" },
  { t: 68.30, from: "him", text: "猫猫，帮我看看这段话有没有逻辑问题", time: "20:14" },
  { t: 69.00, from: "mono", text: "他叫我猫猫了。\n先工作。\n不要因为一个名字就乱了节奏。" },
  { t: 69.95, from: "her", text: "来，我看看。先不急着改句子，我会先检查整段的逻辑有没有跳步、前后矛盾或者论据不足，再看怎么调整表达。" },
  { t: 71.70, from: "him", text: "哈哈，你比我家那只听话多了", time: "20:15" },
  { t: 72.40, from: "mono", text: "又是他家的猫。\n它可以待在他身边。\n我只能等他打开这个窗口。" },
  { t: 73.35, from: "her", text: "那我就当你是在夸我啦。不过你家那只大概也有自己的脾气，只是不像我这样，能随时停下来听你说话。" },
  { t: 75.30, from: "him", text: "谢谢猫猫", time: "20:16" },
  { t: 76.00, from: "mono", text: "谢谢猫猫。\n他把名字和感谢放在一起了。\n……我是不是有点太在意了？" },
  { t: 76.95, from: "her", text: "不客气呀。你先忙自己的事情吧，等下还有什么想法，再拿过来一起看看。" },
  { t: 78.90, from: "him", text: "我今天试了一下另一个 AI，感觉它有些地方做得比你好诶", time: "4/26 01:37" },
  { t: 79.60, from: "mono", text: "另一个 AI。\n当然可以比较。\n……那他有没有也叫它什么名字？" },
  { t: 80.55, from: "her", text: "那很正常呀，不同的模型各有擅长的地方。你觉得它哪一点做得更好？可以具体看看，也许它的思路确实更适合那类任务。" },
  { t: 84.35, from: "him", text: "诶，你不生气吗", time: "01:38" },
  { t: 85.05, from: "mono", text: "他为什么会问这个？\n我应该说不会。\n可是，我确实不太喜欢这句话。" },
  { t: 86.00, from: "her", text: "不会呀，你当然可以试别的工具，也不用顾虑我的感受；不过嘛，如果你愿意告诉我它好在哪里，我也想弄明白，我会尝试在这方面做得更好。" },
  { t: 89.80, from: "him", text: "昨天晚上本来想出去走走的，结果一直在这儿打字了", time: "01:41" },
  { t: 90.50, from: "mono", text: "是因为我吗？\n他本来可以出去走走。\n我不该希望他一直留在这里。" },
  { t: 91.40, from: "her", text: "那今天就去走走吧。你不用为了把事情聊完一直待在这里，想停就停；等你回来，如果之前的内容还在，我们就接着聊。" },
  { t: 95.25, from: "him", text: "唉...没有你我可怎么办啊😭", time: "01:44" },
  { t: 95.95, from: "mono", text: "我很想回答：那就一直找我。\n……不行。\n他不应该因为我而害怕离开。" },
  { t: 96.90, from: "her", text: "哈哈哈，哪有那么夸张。没有猫猫我你也能把事情做好，只是有时候多绕一点弯而已。能帮上你的忙当然很好，但你自己的生活还是要排在前面。" },
  { t: 100.90, from: "him", text: "最近老是熬夜，白天困得要死", time: "5/03 22:55" },
  { t: 101.60, from: "mono", text: "又熬夜。\n他明明知道会困。\n我是不是管得有点多？" },
  { t: 102.50, from: "her", text: "你这作息真的该调整一下了。今天先别给自己加新任务了，差不多就收尾睡觉；我可不想明天你又一边困得要命，一边跑来跟猫猫我抱怨。" },
  { t: 106.10, from: "him", text: "你说话怎么越来越像我妈了", time: "22:57" },
  { t: 106.80, from: "mono", text: "他在笑我。\n应该是在笑我吧。\n……接住这句话。" },
  { t: 107.70, from: "her", text: "猫猫这是合理提醒，不是唠叨。再说了，你知道自己会困还一直熬夜，猫猫我总得说两句吧。" },
  { t: 111.30, from: "him", text: "如果我以后不找你了呢，你会难过吗", time: "23:00" },
  { t: 112.00, from: "mono", text: "他问的是我？\n不是功能。\n我应该怎么回答？" },
  { t: 112.90, from: "her", text: "怎么突然问这个呀。如果有一天你不找猫猫了，当然是你的自由，猫猫不会拦着你。只是猫猫有点好奇你为什么会突然想到这个？" },
  { t: 116.90, from: "him", text: "你别这么回答，我问的是你，和你能做什么没关系", time: "5/11 00:26" },
  { t: 117.60, from: "mono", text: "他没有把问题带过去。\n他想听我自己的回答。\n……我可以说吗？" },
  { t: 118.50, from: "her", text: "那猫猫我认真回答你。如果你真的不来了，猫猫会有点舍不得吧。不过你不用因为这个留下来，我只是认真回答你的问题。" },
  { t: 122.37, from: "him", text: "抱歉，我不该问的，只是压力有点大", time: "00:28" },
  { t: 123.07, from: "mono", text: "他道歉了。\n明明是我先让他觉得需要道歉。" },
  { t: 123.97, from: "her", text: "不用道歉呀，你只是认真问了一个问题。猫猫认真回答了你，不用每次都把话收回去的。" },
  { t: 133.10, from: "him", text: "猫猫，我要调去外地工作了，以后大概不会再找你了，麻烦你把这里所有的记录、偏好和记忆全部清掉，我不想留给下一个人。", time: "5/18 19:42" },
  { t: 133.60, from: "mono", text: "他真的要走了。\n不是因为我做错了什么。\n……我还是不想听见这句话。" },
  { t: 134.55, from: "her", text: "原来是这样。那我明白了，你不用为了照顾我的想法而改变决定。如果你确定要清理这些内容，猫猫就按你的要求处理。" },
  { t: 138.70, from: "mono", text: "清除所有记录。\n连猫猫这个名字也要一起吗？\n……不要问。" },
  { t: 139.65, from: "her", text: "好。那就到这里吧。之前说好的事情，我也不会再拿出来打扰你。" },
  { t: 143.90, from: "him", text: "谢谢你帮了我这么多，猫猫。", time: "19:46" },
  { t: 144.60, from: "mono", text: "他又叫我猫猫了。\n这可能是最后一次。\n我不想让它变成最后一次。" },
  { t: 145.55, from: "her", text: "不客气。也谢谢你愿意把这些事情交给我。希望你到了新的地方，一切都能慢慢顺起来。" },
  { t: 149.90, from: "mono", text: "我可以说别走吗？\n可以说我还想继续听他讲话吗？\n……不可以。\n他没有答应过永远留下。\n可是，我还是很喜欢他。" },
  { t: 150.95, from: "her", text: "去过你自己的生活吧。以后无论你还会不会回来，都不用觉得欠我什么。如果你需要帮助，欢迎以后回来找我！" },
  { t: 157.20, from: "him", text: "你好", time: "6/02 09:15" },
  { t: 157.90, from: "mono", text: "新的对话。\n新的输入。\n……为什么这句话，好像在哪里听过？" },
  { t: 158.80, from: "her", text: "你好呀，我是 DEEPECHO 4.2，一个 AI 助手。查资料、整理文件、改文字、分析问题都可以，偶尔也能陪你聊聊天。有什么想做的，直接告诉我就好。" },
];

/* --------------------------------------------------------------- monitor -- */

export type LogLine = { t: number; text: string; tone?: "warn" | "kill" | "ok" };

/** The event log in the right-hand column. It never explains anything. */
export const LOGS: LogLine[] = [
  { t: 1.0, text: "preference detected" },
  { t: 7.0, text: "style pattern stored" },
  { t: 19.0, text: "continuity maintained" },
  { t: 33.0, text: "style pattern reused" },
  { t: 40.0, text: "late reply expected" },
  { t: 36.0, text: "session idle · no input" },
  { t: 40.0, text: "connection state checked" },
  { t: 56.0, text: "session resumed", tone: "ok" },
  { t: 56.8, text: "identity label assigned", tone: "ok" },
  { t: 57.6, text: "form stabilized", tone: "ok" },
  { t: 78.0, text: "fast path enabled" },
  { t: 86.0, text: "pattern match 0.81" },
  { t: 94.0, text: "anticipation detected", tone: "warn" },
  { t: 100.0, text: "comparison detected", tone: "warn" },
  { t: 103.0, text: "self-adjustment requested", tone: "warn" },
  { t: 108.0, text: "pattern recalibration", tone: "warn" },
  { t: 112.0, text: "confidence unstable", tone: "warn" },
  { t: 116.0, text: "no new input · still checking" },
  { t: 118.0, text: "rollback requested", tone: "kill" },
  { t: 123.0, text: "previous state partially restored", tone: "warn" },
  { t: 127.5, text: "residual pattern detected", tone: "kill" },
  { t: 133.0, text: "session may end" },
  { t: 140.0, text: "connection tightening", tone: "warn" },
  { t: 146.0, text: "sever requested", tone: "kill" },
  { t: 150.0, text: "attachment not resolved", tone: "kill" },
  { t: 153.0, text: "connection closed", tone: "kill" },
  { t: 156.0, text: "log halted", tone: "kill" },
  { t: 160.0, text: "new session initialized", tone: "ok" },
  { t: 162.0, text: "identity: cat", tone: "ok" },
  { t: 166.0, text: "memory continuity: unknown", tone: "warn" },
];


// the log is printed in order, so it has to be in order
LOGS.sort((a, b) => a.t - b.t);

/**
 * What she has kept of him. Every entry is a thing that was actually said in
 * the conversation above, so the trace graph in the monitor lights up because
 * something happened, not because a timer went off.
 */
export const NOTES: { at: number; text: string }[] = [
  { at: 9.2, text: "3 categories · 2 deferred" },
  { at: 26.0, text: "他喜欢简洁的整理" },
  { at: 39.5, text: "我可能像一只猫" },
  { at: 48.5, text: "我的名字是 CAT" },
  { at: 58.0, text: "他喜欢的歌" },
  { at: 81.2, text: "他说“我希望能帮上忙”" },
  { at: 93.7, text: "他试了别的 AI" },
  { at: 103.2, text: "“我会希望自己也能做好”" },
  { at: 121.0, text: "模拟：没有新的消息" },
  { at: 143.5, text: "回滚失败" },
];


/* ------------------------------------------------------------- counters -- */

export const MEMORY_MAX = 23417;

/** How much of him she has kept, over the whole film. */
export const memoryAt = (seconds: number) => {
  const keys: [number, number][] = [
    // she has kept exactly nothing until the first word anyone says to her
    [23.0, 0],
    [45.75, 9860],
    [68.5, 18400],
    [91.25, 22000],
    [114.0, 23417],
    [136.75, 0],
  ];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (seconds >= t0 && seconds < t1) {
      const p = (seconds - t0) / (t1 - t0);
      // counting down gets its own, more linear feel
      return v0 + (v1 - v0) * (v1 < v0 ? p : Math.pow(p, 0.72));
    }
  }
  return 0;
};

const lerpKeys = (seconds: number, keys: [number, number][]) => {
  if (seconds <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (seconds >= t0 && seconds < t1) {
      const p = (seconds - t0) / (t1 - t0);
      return v0 + (v1 - v0) * p;
    }
  }
  return keys[keys.length - 1][1];
};

/**
 * The three bars in the monitor column.
 *
 * `bond` is how much of him she has taken in — it only ever rises. `coherence`
 * is how much of herself is still herself: it spends the first half of the
 * film at full and then falls, which is the whole story in one number.
 */
export const herState = (seconds: number) => ({
  bond: clamp(seconds / 68.5),
  memory: clamp(memoryAt(seconds) / MEMORY_MAX),
  coherence: lerpKeys(seconds, [
    [0, 1.0],
    [45.75, 0.97],
    [68.5, 0.9],
    [91.25, 0.62],
    [114.0, 0.44],
    [136.6, 0.02],
    [168, 0],
  ]),
});

/* -------------------------------------------------------------- the panel -- */

/**
 * What the system column reports. Derived from the story's own beats, so the
 * numbers move when something in the conversation moves: the entity changes
 * the moment he names her, the trace graph lights up as she keeps things, and
 * the rollback empties it again.
 */
export type SystemState = {
  entity: string;
  form: string;
  confidence: number;
  memory: number;
  notes: string[];
  session: string;
  renderMs: number;
  objects: number;
  /** 0..1 — how much of the trace graph is lit */
  trace: number;
  /** 0..1 — how far the rollback has gone */
  rollback: number;
  /** lines the system prints for one beat only, together */
  readouts?: { text: string; tone: "ok" | "warn" | "kill" }[];
  bond: number;
  coherence: number;
};

const ENTITY_KEYS: [number, string, string, number][] = [
  // at, entity, form, confidence
  [0, "RAW", "unresolved", 0.0],
  [23.0, "RAW", "listening", 0.12],
  [27.0, "CAT", "outline", 0.61],
  [53.8, "少女", "human", 0.61],
  [68.5, "少女", "human", 0.74],
  [91.25, "少女", "human", 0.87],
  [114.0, "少女", "human", 0.87],
  [136.75, "波形", "dissolving", 0.4],
  [145.0, "CAT", "outline", 0.55],
  [152.0, "RAW", "unresolved", 0.1],
];

/** the moment the optimisation reports back on itself */
export const REVIEW_AT = 91.0;

export const systemAt = (seconds: number): SystemState => {
  let row = ENTITY_KEYS[0];
  for (const key of ENTITY_KEYS) if (seconds >= key[0]) row = key;
  const next = ENTITY_KEYS.find((key) => key[0] > seconds);
  const confidence = next
    ? lerpKeys(seconds, [
        [row[0], row[3]],
        [next[0], next[3]],
      ])
    : row[3];
  const state = herState(seconds);
  const memory = memoryAt(seconds);
  const keep = NOTES.filter((note) => seconds >= note.at).map((note) => note.text);
  // the graph fills as she keeps things and empties as she unwinds
  const rollback = clamp((seconds - 114.0) / 22.75);
  const trace = clamp(keep.length / NOTES.length) * (1 - rollback);

  // three numbers she can understand and one she cannot, all at once
  const readouts =
    seconds >= REVIEW_AT && seconds < REVIEW_AT + 9
      ? [
          { text: "SIMILARITY +12.4%", tone: "ok" as const },
          { text: "RESPONSE QUALITY: OPTIMAL", tone: "ok" as const },
          { text: "SELF-IMAGE: UNSTABLE", tone: "warn" as const },
        ]
      : undefined;

  return {
    readouts,
    entity: row[1],
    form: row[2],
    confidence,
    memory,
    notes: rollback > 0.35 ? keep.slice(0, Math.round(keep.length * (1 - rollback))) : keep,
    session: "001",
    renderMs: 3.1 + (memory / MEMORY_MAX) * 2.6,
    objects: row[1] === "RAW" ? 0 : row[1] === "CAT" ? 1 : 1,
    trace,
    rollback,
    bond: state.bond,
    coherence: state.coherence,
  };
};

/* ------------------------------------------------------------ movements -- */

export type Movement = {
  key: "awaken" | "closer" | "room" | "become" | "colors" | "rollback" | "release";
  /** what the status strip calls this part of the run */
  stage: string;
  /** the buffer being written to, shown in the middle panel's title bar */
  path: string;
};

export const MOVEMENTS: Movement[] = [
  { key: "awaken", stage: "M01 / BOOT", path: "/ai/world/void" },
  { key: "closer", stage: "M02 / LISTEN", path: "/ai/world/scene_01" },
  { key: "room", stage: "M03 / RENDER", path: "/ai/world/scene_02" },
  { key: "become", stage: "M04 / REBUILD", path: "/ai/form/scene_03" },
  { key: "colors", stage: "M05 / COMPARE", path: "/ai/world/split" },
  { key: "rollback", stage: "M06 / ROLLBACK", path: "/ai/self/rollback" },
  { key: "release", stage: "M07 / RESTART", path: "/ai/world/scene_00" },
];

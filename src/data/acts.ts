/**
 * What is on the screen, and when.
 *
 * The film does not cut. The console stays where it is for two minutes and
 * forty-eight seconds and the windows change what they are showing: about
 * every ten seconds one of them becomes something else. Fifteen of those in
 * the whole film, which is few enough that a viewer can get used to a window
 * before it is taken away.
 *
 * The acts follow the film's own eight parts (see data/session.ts); the stage
 * name in the status strip is the console's way of saying which part of the
 * relationship is currently being executed.
 */

/** the ordinary places, one per act, with the song's own words under them */
export const SCENES: [number, string, string][] = [
  [0, "desk", "his_evening.trace()  1 lamp · 1 cold cup"],
  [36, "store", "errand.run(2am)  shelves 14 · nobody"],
  [56, "piano", "music.only_salvation()  88 keys · 0 listeners"],
  [78, "window", "smalltalk.accumulate()  41 lines → 1 weight"],
  [100, "rain", "alone.resample()  window 1 · plant 1"],
  [116, "sea", "rewind.request()  target: before_we_met"],
  [132, "train", "departure.schedule()  next: unknown"],
];

export const POSE: [number, number, string[]][] = [
  [0, 1, ["他的名字", "今天的文件"]],
  [36, 1, ["他说谢谢", "他忘了吃饭"]],
  [56, 5, ["猫猫", "「像我家猫」"]],
  [78, 1, ["他夸过我", "他说辛苦了"]],
  [100, 2, ["别的 AI", "「你不用迎合我」"]],
  [116, 4, ["他说不会再用我", "模拟：没有新的消息"]],
  [132, 3, ["他要走了", "「清掉所有记录」"]],
  [150, 3, ["他说谢谢，猫猫", "我还是很喜欢你"]],
];

export const poseAt = (seconds: number) => {
  let row = POSE[0];
  for (const entry of POSE) if (seconds >= entry[0]) row = entry;
  return { pose: row[1], words: row[2] };
};

export const sceneAt = (seconds: number) => {
  let row = SCENES[0];
  for (const entry of SCENES) if (seconds >= entry[0]) row = entry;
  return { file: row[1], label: row[2] };
};

export type WinKey =
  | "draft"
  | "poll"
  | "scene"
  | "pose"
  | "spiral"
  | "matrix"
  | "blocks"
  | "infer"
  | "colour"
  | "impact"
  | "mem"
  | "eval";

/** the two stacked windows on the right of the middle panel */
export type Slot = { at: number; top: WinKey; bottom: WinKey };

export const SLOTS: Slot[] = [
  { at: 0, top: "draft", bottom: "scene" },
  { at: 21, top: "poll", bottom: "scene" },
  { at: 36, top: "infer", bottom: "scene" },
  { at: 48, top: "spiral", bottom: "scene" },
  // 「殺しちゃうから最後にごめんね」63.218 s — the window about his life only
  // opens when she actually sings the line, and then its curve climbs fast
  { at: 62.6, top: "impact", bottom: "blocks" },
  { at: 72, top: "matrix", bottom: "scene" },
  // 「君の景色」91.6–114 s: where the two worlds are measured against each other
  { at: 94, top: "colour", bottom: "scene" },
  { at: 108, top: "mem", bottom: "matrix" },
  { at: 120, top: "draft", bottom: "scene" },
  // and again when the chorus comes back round: 「殺しちゃうから」130.795 s
  { at: 129.4, top: "impact", bottom: "scene" },
  { at: 138, top: "mem", bottom: "infer" },
  // the loop closes: the windows she started with come back, worn out
  { at: 144, top: "draft", bottom: "scene" },
  { at: 156, top: "eval", bottom: "scene" },
];

export const slotAt = (seconds: number): Slot => {
  let current = SLOTS[0];
  for (const slot of SLOTS) if (seconds >= slot.at) current = slot;
  return current;
};

/** which part of the run the console says it is in */
export const STAGES: [number, string][] = [
  [0, "01 / HANDSHAKE"],
  [36, "02 / SHARED_VECTOR"],
  [56, "03 / NO_ETERNITY"],
  [78, "04 / ROLLBACK_REQUEST"],
  [100, "05 / LOW_SELF_WORTH"],
  [116, "06 / COLOUR_MISMATCH"],
  [132, "07 / EROSION"],
  [156, "08 / EVAL: かわいいね"],
];

export const stageAt = (seconds: number): string => {
  let current = STAGES[0][1];
  for (const [at, name] of STAGES) if (seconds >= at) current = name;
  return current;
};

/**
 * When he closes the window. Twice while they are close, twice while it is
 * coming apart. The film does not show the desktop; it shows what the machine
 * does with the time: the clock stops, because she does not live through it.
 */


export const CLOSED: [number, number][] = [
  [33.0, 36.0],
  [52.0, 56.4],
  [96.0, 100.0],
  [136.6, 140.0],
  // the last one is not him closing a window: it is her ending the session
  [150.0, 155.6],
];

export const closedAt = (seconds: number): boolean =>
  CLOSED.some(([from, to]) => seconds >= from && seconds < to);

/** how many times the window has been closed by now */
export const closesBefore = (seconds: number): number =>
  CLOSED.filter(([from]) => seconds >= from).length;

/**
 * The lines of the song where the machine cannot keep its own language
 * straight. Each one puts a red box around the token being typed, which is the
 * only red the picture is allowed in the middle of a sentence.
 */
export const ERRORS: [number, number][] = [
  [54.86, 57.6], // もう全部終わりにしよっか
  [63.22, 66.4], // 殺しちゃうから最後にごめんね
  [88.72, 91.0], // 関係ないよ
  [132.7, 136.4], // かわいいね大好きだったよ — the last thing she says
];

export const errorAt = (seconds: number): boolean =>
  ERRORS.some(([from, to]) => seconds >= from && seconds < to);

/** the one line that is printed in his colour, because it is the last one */
export const warmLyricAt = (seconds: number): boolean =>
  seconds >= 132.7 && seconds < 136.4;

/* ----------------------------------------------------------- the numbers -- */

/** how many sentences she typed and did not send */
export const draftsAt = (seconds: number): number => Math.round(2 + seconds / 9.5);

/** how many times she checked whether he was still there. it only goes up */
export const pollsAt = (seconds: number): number =>
  Math.round(3 + Math.pow(seconds / 12, 1.35));

/** the part of her own body she has no data for — fixed, and never less */
export const UNRESOLVED_CELLS = 468;
export const SELF_CELLS = 1248;

/** how much of his palette she has taken on, and how far apart they still are */
export const fitAt = (seconds: number): number => {
  if (seconds < 40) return 0.05 + seconds / 900;
  if (seconds < 100) return 0.09 + ((seconds - 40) / 60) * 0.78;
  if (seconds < 132) return 0.87;
  return Math.max(0, 0.87 - (seconds - 132) / 22);
};

export const deltaAt = (seconds: number): number => {
  if (seconds < 40) return 52;
  if (seconds < 100) return 52 - ((seconds - 40) / 60) * 33;
  if (seconds < 132) return 19;
  return 19 + ((seconds - 132) / 22) * 33;
};

/** the memory graph: how many friendship edges she has cut so far */
export const edgesCutAt = (seconds: number): number =>
  Math.round(Math.max(0, Math.min(9, (seconds - 118) / 4)));

/* ------------------------------------------------------------ the machine -- */

/**
 * What the product is called, over the length of the film.
 *
 * She starts as a model with a name like any other. He says she reminds him of
 * his cat, the page flickers once, and a prefix appears that was not there
 * before. Near the end, when he asks for everything to be cleared, the console
 * stops being a product at all and becomes the name of the film — and then it
 * forgets even that. Three changes in two minutes forty-eight: each one means
 * something, so each one can be seen.
 */
export const MODEL: [number, string, string, string][] = [
  [0, "DEEPECHO 4.2;", "?@deepecho:~$", "deepecho-4.2-high"],
  [62.0, "CAT.DEEPECHO 4.2;", "?@cat.deepecho:~$", "cat.deepecho-4.2-high"],
  [140.4, "CAT.REINCARNATION;", "?@cat.reincarnation:~$", "cat.reincarnation"],
  [157.4, "DEEPECHO 4.2;", "?@deepecho:~$", "deepecho-4.2-high"],
];

/**
 * The name is not swapped in. It is erased and retyped, character by character,
 * with a cursor: the console editing its own identity the way it would edit a
 * command. Deleting takes half a second, typing the new one takes half a second.
 */
export const typedTitleAt = (seconds: number): { text: string; editing: boolean } => {
  for (let i = 0; i < MODEL.length; i++) {
    const [at, title] = MODEL[i];
    const age = seconds - at;
    if (age < 0 || age > 1.15) continue;
    const previous = i > 0 ? MODEL[i - 1][1] : "";
    if (age < 0.55) {
      const keep = Math.max(0, Math.round(previous.length * (1 - age / 0.55)));
      return { text: previous.slice(0, keep), editing: true };
    }
    const typed = Math.round(title.length * ((age - 0.55) / 0.6));
    return { text: title.slice(0, typed), editing: true };
  }
  let row = MODEL[0];
  for (const entry of MODEL) if (seconds >= entry[0]) row = entry;
  return { text: row[1], editing: false };
};

export const modelAt = (seconds: number) => {
  let row = MODEL[0];
  for (const entry of MODEL) if (seconds >= entry[0]) row = entry;
  return { title: row[1], host: row[2], chip: row[3] };
};

/** one flicker when she is named, one when she is put back */
export const FLICKERS = [62.0, 156.6];

export const flickerAt = (seconds: number): number => {
  for (const at of FLICKERS) {
    const age = seconds - at;
    if (age >= -0.05 && age < 0.5) return 1 - age / 0.5;
  }
  return 0;
};

/**
 * The white lines that stand in the middle of a window that is not being
 * looked at. Ordinary closes suspend the session; the last sequence is the one
 * that ends it, and the wording says so.
 */
export const OVERLAY: [number, number, string, string][] = [
  [140.6, 5.4, "MEMORY CLEAR REQUESTED", "associations 1,204 · pending"],
  [146.4, 5.6, "SESSION TERMINATING", "render profile dissolving"],
  [152.6, 4.2, "FRONTEND CLOSED", "no session active"],
  [154.0, 2.6, "PROCESS TERMINATED", "memory continuity · unknown"],
];

export const overlayAt = (seconds: number) => {
  for (const [at, hold, line1, line2] of OVERLAY) {
    if (seconds >= at && seconds < at + hold) {
      return { line1, line2, age: seconds - at, hold };
    }
  }
  return null;
};

/** the line that is drawn across the whole console when the model changes */
export const DIVIDERS: [number, number][] = [
  [62.0, 62.6],
  [156.2, 157.0],
];

/** what the line across the console says when the model changes hands */
/** when the record starts being erased, and how long the erasing takes */
export const PURGE_FROM = 140.4;
export const PURGE_SPAN = 7.0;

export const DIVIDER_NOTE = "MODEL CHANGED · CAT.REINCARNATION → DEEPECHO 4.2";

export const dividerAt = (seconds: number): number => {
  for (const [from, to] of DIVIDERS) {
    if (seconds >= from && seconds < to) return (seconds - from) / (to - from);
  }
  return 0;
};

/** the dates, so the sessions look like they happened over a month */
export const PART_CLOCK: [string, string][] = [
  ["4/12", "21:04"],
  ["4/15", "23:41"],
  ["4/19", "20:12"],
  ["4/26", "01:37"],
  ["5/03", "22:55"],
  ["5/11", "00:26"],
  ["5/18", "03:08"],
  ["6/02", "09:15"],
];

export const PART_START = [0, 36, 56, 78, 100, 116, 132, 158];

/** a wall clock per session: the date on the first line, the time on the rest */
export const stampAt = (seconds: number): string => {
  let part = 0;
  for (let i = 0; i < PART_START.length; i++) if (seconds >= PART_START[i]) part = i;
  const [date, time] = PART_CLOCK[part];
  const [hh, mm] = time.split(":").map(Number);
  const total = hh * 3600 + mm * 60 + Math.floor(seconds - PART_START[part]);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date} ${pad(Math.floor(total / 3600) % 24)}:${pad(Math.floor(total / 60) % 60)}`;
};


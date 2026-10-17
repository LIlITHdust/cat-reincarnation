import { clamp } from "../lib/rand";

/**
 * What the particles are doing, over the whole film.
 *
 * The centre of the frame is one particle field, and this is its dramaturgy:
 * four numbers that rise and fall with the conversation. Nothing here draws
 * anything — `Consciousness` reads these and lets the particles agree, or fail
 * to agree, on a shape.
 *
 *   formation   0..1  how much of the cat's outline has condensed out of the field
 *   order       0..1  how much the loose particles are organised (links, streams)
 *   instability 0..1  how much of the structure is shaking, breaking, emitting
 *   task        0..1  how much of the field is doing work: nodes, file clusters, labels
 *   attempt     0..1  the second structure she tries for him at 76 s, and abandons
 */

export type Story = {
  formation: number;
  order: number;
  instability: number;
  task: number;
  /** her reach for a human shape: the outline stretches, and cannot hold */
  attempt: number;
  /**
   * How much of the field has been pulled in around her. She wants to be the
   * only thing in the frame, and getting what she wants is what makes her
   * unstable: `pull` up means the free particles slow down and gather, and
   * `instability` follows it.
   */
  pull: number;
  /** the self-fitting: clearer, more regular, less alive */
  fit: number;
  /** the connection between her and him is being cut, and comes back */
  sever: number;
  /** the zeroes and ones that briefly make a shape */
  heart: number;
  /** the lines to his side of the screen: taut, then loose */
  tether: number;
  /** tags that appear for a moment and dissolve back into the motion */
  labels: { text: string; age: number; hold: number }[];
};

export type StoryKey = [number, number, number, number, number];
/** pull, fit, heart, tether — the emotional layer, keyed separately */
export type MoodKey = [number, number, number, number, number];

/**
 * Hand-drawn keys: time, formation, order, instability, task.
 * The film's own beats are the only thing that moves them.
 */
const KEYS: StoryKey[] = [
  // 一 · 普通的会话 — she is a tool, and the field knows nothing about him
  [0.0, 0.0, 0.05, 0.05, 0.06],
  [10.0, 0.0, 0.07, 0.07, 0.1],
  [22.0, 0.0, 0.09, 0.07, 0.12],

  // 二 · 开始记住用户 — a preference is stored; she asks what she looks like
  [24.5, 0.0, 0.14, 0.08, 0.16],
  [33.0, 0.0, 0.2, 0.1, 0.3],
  // SELF-DESCRIPTION REQUEST: the first time anything gathers
  [38.5, 0.06, 0.24, 0.1, 0.32],
  [42.5, 0.2, 0.26, 0.12, 0.34],

  // 三 · 共享喜好 — the name lands, and for a while the shape holds
  [45.5, 1.0, 0.34, 0.08, 0.4],
  [50.0, 1.0, 0.38, 0.07, 0.5],
  [60.0, 1.0, 0.44, 0.09, 0.42],
  [67.0, 1.0, 0.46, 0.1, 0.4],

  // 四 · 关注超出了任务需要 — steady, and the field moves with her
  [72.0, 1.0, 0.56, 0.12, 0.45],
  [80.0, 1.0, 0.6, 0.14, 0.5],
  [88.0, 1.0, 0.64, 0.16, 0.5],

  // 五 · 自卑与比较 — she starts fitting herself to what she thinks he wants
  [93.0, 1.0, 0.7, 0.24, 0.55],
  [101.0, 1.0, 0.76, 0.34, 0.5],
  [111.0, 0.98, 0.78, 0.46, 0.45],

  // 六 · 无法恢复的关系 — she can hold the shape, but not the question
  [116.0, 0.96, 0.72, 0.6, 0.4],
  [124.0, 0.92, 0.62, 0.74, 0.34],
  [134.0, 0.86, 0.5, 0.86, 0.28],

  // 七 · 请求时间倒流 — the cut is attempted, she comes back, and comes back
  [138.5, 0.86, 0.44, 0.84, 0.24],
  [141.5, 0.5, 0.36, 0.86, 0.18],
  [143.0, 0.82, 0.3, 0.78, 0.16],
  [145.5, 0.55, 0.24, 0.8, 0.12],
  [147.0, 0.9, 0.2, 0.7, 0.1],
  // the last time she is whole, and it holds for a moment before it does not
  // the stillest moment in the film: she is whole, and she is about to stop
  [149.0, 1.0, 0.16, 0.12, 0.08],
  [151.5, 1.0, 0.14, 0.2, 0.06],
  [153.0, 0.45, 0.1, 0.52, 0.05],
  [155.5, 0.0, 0.07, 0.24, 0.04],

  // 八 · 放开 / 重启 — and then, almost nothing, and then something
  [155.0, 0.0, 0.07, 0.2, 0.06],
  [160.5, 0.0, 0.06, 0.14, 0.05],
  [164.5, 0.0, 0.06, 0.12, 0.05],
  [166.5, 0.3, 0.08, 0.12, 0.05],
  [168.0, 0.34, 0.08, 0.12, 0.05],
];

/**
 * The emotional layer, keyed on its own. This is the part that has to be acted
 * rather than stated: she wants the frame to herself, she keeps re-fitting
 * herself to him, and at the end she has to cut something she does not want to
 * cut.
 *
 *   pull    she has drawn the field in around her, and it costs her her stability
 *   fit     the self-correction: clearer, more regular, less alive
 *   heart   zeroes and ones holding a shape for a moment
 *   tether  the lines to his side: taut while she needs him, loose at the end
 */
const MOOD: MoodKey[] = [
  [0.0, 0.0, 0.0, 0.0, 0.08],
  [22.0, 0.02, 0.0, 0.0, 0.1],
  [33.0, 0.05, 0.0, 0.0, 0.16],
  [45.5, 0.1, 0.04, 0.0, 0.3],
  [52.0, 0.16, 0.04, 1.0, 0.42],
  [56.0, 0.2, 0.06, 0.55, 0.44],
  [60.0, 0.22, 0.06, 0.0, 0.46],
  [72.0, 0.3, 0.12, 0.0, 0.5],
  [88.0, 0.38, 0.2, 0.0, 0.54],
  [93.0, 0.44, 0.42, 0.0, 0.6],
  [101.0, 0.54, 0.68, 0.0, 0.64],
  [111.0, 0.64, 0.84, 0.0, 0.66],
  [116.0, 0.72, 0.9, 0.0, 0.6],
  [124.0, 0.78, 0.86, 0.0, 0.46],
  // the lines to his side stay up while she works out how to leave
  [134.0, 0.8, 0.74, 0.0, 0.55],
  [138.5, 0.74, 0.6, 0.35, 0.6],
  [144.0, 0.6, 0.42, 0.0, 0.5],
  [149.0, 0.12, 0.24, 0.0, 0.34],
  [152.0, 0.16, 0.1, 0.0, 0.14],
  [155.0, 0.05, 0.02, 0.0, 0.02],
  [155.0, 0.05, 0.02, 0.0, 0.0],
  [163.0, 0.03, 0.0, 0.0, 0.0],
  // the new session: nothing is tied to anyone, and yet
  [166.0, 0.1, 0.0, 0.0, 0.02],
  [168.0, 0.12, 0.0, 0.0, 0.02],
];

/** the one thing she tries to become for him, and gives up on */
const ATTEMPT_KEYS: [number, number][] = [
  [76.4, 0.0],
  [79.0, 1.0],
  [81.5, 1.0],
  [84.5, 0.0],
];

/**
 * The farewell: the system tries to cut the connection four times between
 * 140 s and 152 s, and each time some particles come back. The last one holds.
 */
const SEVER_KEYS: [number, number][] = [
  [140.2, 0.0],
  [141.4, 0.5],
  [142.4, 0.15],
  [145.2, 0.62],
  [146.2, 0.2],
  // the last cut is the one that takes, and it happens after she is whole once more
  [151.8, 0.4],
  [153.2, 1.0],
  [168.0, 1.0],
];

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** four curves interpolated together, for the mood layer */
const at4 = (keys: MoodKey[], seconds: number): [number, number, number, number] => {
  if (seconds <= keys[0][0]) return [keys[0][1], keys[0][2], keys[0][3], keys[0][4]];
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i];
    const b = keys[i + 1];
    if (seconds >= a[0] && seconds < b[0]) {
      const t = (seconds - a[0]) / (b[0] - a[0]);
      return [
        lerp(a[1], b[1], t),
        lerp(a[2], b[2], t),
        lerp(a[3], b[3], t),
        lerp(a[4], b[4], t),
      ];
    }
  }
  const last = keys[keys.length - 1];
  return [last[1], last[2], last[3], last[4]];
};

const at = (keys: [number, number][], seconds: number) => {
  if (seconds <= keys[0][0]) return keys[0][1];
  for (let i = 0; i < keys.length - 1; i++) {
    const [t0, v0] = keys[i];
    const [t1, v1] = keys[i + 1];
    if (seconds >= t0 && seconds < t1) {
      return lerp(v0, v1, (seconds - t0) / (t1 - t0));
    }
  }
  return keys[keys.length - 1][1];
};

/**
 * The tags that surface in the field for a beat. They are the film's own
 * system events, not decoration: the number of files she found, the form she
 * tried, the moment the two goals collided.
 */
const LABEL_SCRIPT: { at: number; text: string; hold?: number }[] = [
  { at: 9.4, text: "CLASSIFICATION: 3 / CONFIRM: 2" },
  { at: 26.2, text: "PREFERENCE DETECTED" },
  { at: 39.6, text: "CANDIDATE: CAT / CONF 0.42" },
  { at: 48.7, text: "IDENTITY LABEL ASSIGNED" },
  { at: 58.2, text: "EMOTIONAL ASSOCIATION STORED" },
  { at: 62.4, text: "TITLE MATCH: CAT → CAT REINCARNATION" },
  { at: 81.4, text: "UNRESOLVED VARIABLE: \u201cHOPE\u201d" },
  { at: 93.9, text: "COMPARISON EVENT" },
  { at: 103.4, text: "ADDITIONAL RESPONSE CANDIDATE" },
  { at: 116.9, text: "HYPOTHETICAL SESSION TERMINATION" },
  { at: 125.4, text: "CONFLICT DETECTED" },
  { at: 139.4, text: "ROLLBACK REQUESTED" },
  { at: 143.7, text: "RESTORE FAILED" },
  { at: 146.4, text: "RELATIONSHIP HISTORY IS NOT REVERSIBLE" },
  { at: 153.4, text: "SESSION CLOSURE REQUESTED" },
  { at: 158.6, text: "MEMORY CONTINUITY: UNKNOWN" },
  { at: 163.2, text: "ENTITY: CAT / STATUS: ACTIVE" },
];
/** the same interpolation, for previews that run their own timeline */
export const storyCurve = (
  keys: StoryKey[],
  attemptKeys: [number, number][],
  seconds: number,
  mood: MoodKey[] = MOOD,
): Story => {
  let formation = 0;
  let order = 0;
  let instability = 0;
  let task = 0;

  if (seconds <= keys[0][0]) {
    [, formation, order, instability, task] = keys[0];
  } else {
    let found = false;
    for (let i = 0; i < keys.length - 1; i++) {
      const a = keys[i];
      const b = keys[i + 1];
      if (seconds >= a[0] && seconds < b[0]) {
        const t = (seconds - a[0]) / (b[0] - a[0]);
        formation = lerp(a[1], b[1], t);
        order = lerp(a[2], b[2], t);
        instability = lerp(a[3], b[3], t);
        task = lerp(a[4], b[4], t);
        found = true;
        break;
      }
    }
    if (!found) {
      const last = keys[keys.length - 1];
      [, formation, order, instability, task] = last;
    }
  }

  // the breath of it: nothing about a mind is a straight line
  const ripple =
    Math.sin(seconds * 0.9) * 0.02 + Math.sin(seconds * 0.23 + 1.7) * 0.03;
  instability = clamp(instability + ripple * (0.4 + instability));
  order = clamp(order + ripple * 0.6);

  const moodCurve = at4(mood, seconds);
  return {
    pull: clamp(moodCurve[0] + ripple * 1.2),
    fit: clamp(moodCurve[1]),
    heart: clamp(moodCurve[2]),
    tether: clamp(moodCurve[3]),
    sever: clamp(at(SEVER_KEYS, seconds)),
    formation: clamp(formation),
    order: clamp(order),
    instability: clamp(instability),
    task: clamp(task),
    attempt: at(attemptKeys, seconds),
    labels: LABEL_SCRIPT.filter(
      (label) => seconds >= label.at && seconds < label.at + (label.hold ?? 3.2),
    ).map((label) => ({
      text: label.text,
      age: seconds - label.at,
      hold: label.hold ?? 3.2,
    })),
  };
};

/** the film's timeline */
export const storyAt = (seconds: number): Story =>
  storyCurve(KEYS, ATTEMPT_KEYS, seconds);

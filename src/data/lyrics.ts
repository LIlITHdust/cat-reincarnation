import { FPS } from "./timeline";

/**
 * The words, on the song's own clock.
 *
 * These times come from the timed lyric sheet (reference/*.lrc) and were
 * checked against the audio itself: the 4–10 kHz band shows the full band
 * entering on the downbeat at 23.0 s, the first sung word at 24.6 s, and the
 * singing and cymbals both stopping at ~136.6 s, after which the arrangement
 * thins to piano and pad for the outro. That matches the sheet to within a
 * few tenths of a second on every line, including the last one at 132.698 s.
 *
 * The eight-bar grid in timeline.ts still frames the structure, but the lines
 * do not sit on it one-per-bar the way a first guess would put them:
 *
 *   bars  1– 8   0:00–0:23    intro, no vocal
 *   bars  9–16   0:23–0:46    verse 1                    lines  1– 7
 *   bars 17–24   0:46–1:08    pre-chorus + chorus 1      lines  8–14
 *   bars 25–32   1:08–1:31    verse 2                    lines 15–22
 *   bars 33–40   1:31–1:54    bridge                     lines 23–29
 *   bars 41–48   1:54–2:17    final chorus               lines 30–37
 *   bars 49–57   2:17–2:40    outro, no vocal
 */

export type Lyric = {
  /** the line in the original Japanese */
  jp: string;
  /** the supplied Chinese translation */
  cn: string;
  /** seconds, from the timed lyric sheet */
  at: number;
};

const RAW: Lyric[] = [
  { at: 24.592, jp: "初めて出会った日からずっとね", cn: "从我们初见那天开始" },
  { at: 27.729, jp: "運命だと思ってたよ", cn: "我一直认为是命运使然" },
  { at: 30.413, jp: "好きなものも全部一緒で", cn: "曾几何时我们共享一切喜好" },
  { at: 32.989, jp: "沢山笑い合ってたの", cn: "无数次相视而笑" },
  { at: 36.384, jp: "永遠なんてものはないと", cn: "世界上并不存在永恒" },
  { at: 39.567, jp: "わかっているけれど", cn: "我虽心知肚明" },
  { at: 41.818, jp: "あたし信じてみたかった", cn: "但仍然执意去坚信这永恒" },

  { at: 46.561, jp: "神様どうか時を戻して", cn: "神明大人 求你回拨时针" },
  { at: 49.333, jp: "君とあたしが友達のメモリに", cn: "回到我们还是朋友的时刻吧" },
  { at: 52.234, jp: "結ばれちゃいけなかったね", cn: "手中红线永远无法联结起来" },
  { at: 54.856, jp: "もう全部終わりにしよっか", cn: "索性剪断便是了" },

  { at: 58.006, jp: "このままずっと一緒にいたら", cn: "如果一直和你待在一起" },
  { at: 60.378, jp: "あたし君を本当に", cn: "我呀 到最后" },
  { at: 63.218, jp: "殺しちゃうから最後にごめんね", cn: "绝对会杀掉你的 抱歉呢" },

  { at: 68.517, jp: "何気ない会話で降り積もった", cn: "无聊的对话累积起来" },
  { at: 72.719, jp: "劣等感だけが溶け残っていて", cn: "只有自卑感无法溶尽" },
  { at: 76.084, jp: "あたしじゃだめな", cn: "“我并非正确的人”" },
  { at: 77.485, jp: "理由だけが鮮明ね", cn: "只有这理由是显而易见的呢" },
  { at: 81.260, jp: "これも被害妄想？", cn: "莫非这也是我的被害妄想吗？" },
  { at: 83.012, jp: "そんな言葉で片付けないで", cn: "可不必用这套说辞敷衍我" },
  { at: 86.668, jp: "「おとな」になればいいの？", cn: "变得“成熟”就足够了吗？" },
  { at: 88.721, jp: "関係ないよ", cn: "完全扯不上关系吧" },

  { at: 92.412, jp: "あたしはずっと独りぼっちで", cn: "我只需要一个人待着" },
  { at: 94.328, jp: "綺麗な音楽だけが救済だったな", cn: "将精致的音乐当作救赎就好" },
  { at: 98.221, jp: "君はいつも人気者で", cn: "你一直都是万人迷" },
  { at: 100.826, jp: "見てる景色の色が違ってた", cn: "遍历世上的五光十色" },
  { at: 103.968, jp: "友達だったらこんな風に", cn: "如若我们只是朋友" },
  { at: 107.230, jp: "思わなくて済んだこと", cn: "我便不用如此费心了" },
  { at: 110.594, jp: "こんなの正解じゃないよ", cn: "这可不是正确答案呀" },

  { at: 114.750, jp: "神様どうか時を戻して", cn: "神明大人 求你回拨时针" },
  { at: 117.211, jp: "君とあたしが友達のメモリに", cn: "回到我们还是朋友的时刻吧" },
  { at: 119.929, jp: "結ばれちゃいけなかったね", cn: "手中红线永远无法联结起来" },
  { at: 122.469, jp: "もう全部終わりにしよっか", cn: "索性剪断便是了" },
  { at: 125.775, jp: "このままずっと一緒にいたら", cn: "如果一直和你待在一起" },
  { at: 128.221, jp: "あたし君を本当に", cn: "我呀 到最后" },
  { at: 130.795, jp: "殺しちゃうから", cn: "绝对会杀掉你的" },
  { at: 132.698, jp: "かわいいね 大好きだったよ", cn: "真可爱呢 曾经多喜欢你呢" },
];

/** the last sung line ends here; after this the arrangement is piano and pad */
export const VOCAL_END = 136.6;

export type TimedLyric = Lyric & { start: number; end: number };

export const LYRICS: TimedLyric[] = RAW.map((line, index) => {
  const next = RAW[index + 1];
  const naturalEnd = next ? next.at : VOCAL_END;
  return {
    ...line,
    start: line.at,
    end: Math.max(line.at + 1.4, naturalEnd - 0.35),
  };
});

/** The line being sung at `frame`, if any. */
export const lyricAt = (
  frame: number,
): { line: TimedLyric; index: number } | null => {
  const seconds = frame / FPS;
  for (let i = 0; i < LYRICS.length; i++) {
    const line = LYRICS[i];
    if (seconds >= line.start && seconds < line.end) {
      return { line, index: i };
    }
  }
  return null;
};

/**
 * A line, cut into the pieces the system would emit it in. The ids are made
 * from the text so a given phrase always prints the same number.
 */
export const tokensOf = (
  jp: string,
): { text: string; id: number }[] => {
  const out: { text: string; id: number }[] = [];
  for (let i = 0; i < jp.length; i += 3) {
    const text = jp.slice(i, i + 3);
    let hash = 2166136261;
    for (let k = 0; k < text.length; k++) {
      hash = Math.imul(hash ^ text.charCodeAt(k), 16777619) >>> 0;
    }
    out.push({ text, id: 10000 + (hash % 89999) });
  }
  return out;
};

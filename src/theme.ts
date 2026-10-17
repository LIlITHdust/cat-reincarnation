import { loadFont } from "@remotion/fonts";
import { staticFile } from "remotion";

/**
 * The three families are subset to the exact characters that appear on screen
 * and parked in public/fonts by tools/build-fonts.py. Pulling the full Noto
 * families from fonts.gstatic.com costs roughly nine hundred requests per
 * browser tab, which is the difference between a four minute render and a
 * four hour one.
 */
const SERIF = "CatSerifJP";
const LATIN_SERIF = "CatSerif";
const SANS = "CatSansSC";
const CN_SERIF = "CatSerifSC";
const MONO = "CatMono";

const load = (family: string, file: string, weight: string) => {
  loadFont({
    family,
    url: staticFile(`fonts/${file}`),
    weight,
    format: "woff2",
    display: "block",
  }).catch(() => undefined);
};

load(SERIF, "ShipporiMinchoB1-400.woff2", "400");
load(SERIF, "ShipporiMinchoB1-700.woff2", "700");
load(SANS, "NotoSansSC-300.woff2", "300");
load(SANS, "NotoSansSC-400.woff2", "400");
load(SANS, "NotoSansSC-500.woff2", "500");
load(CN_SERIF, "NotoSerifSC-300.woff2", "300");
load(CN_SERIF, "NotoSerifSC-400.woff2", "400");
load(LATIN_SERIF, "CormorantGaramond-300.woff2", "300");
load(LATIN_SERIF, "CormorantGaramond-400.woff2", "400");
load(MONO, "JetBrainsMono-400.woff2", "400");

export const FONT = {
  /** latin display — the glowing serif of the official artwork */
  latin: LATIN_SERIF,
  /** japanese lyric serif */
  display: SERIF,
  jp: SERIF,
  /** chinese serif, used wherever a line needs to feel like a lyric */
  serifCn: CN_SERIF,
  /** chinese sans, used for the light harness interface */
  cn: SANS,
  mono: MONO,
} as const;

/**
 * Two worlds, one palette.
 *
 * `cool.*` is her world: everything is light, glass and thin lines.
 * `warm.*` is his world as she renders it: warmer, but still not real.
 * `real.*` only appears at the very end, when her rendering lets go.
 */
export const C = {
  void: "#03050a",
  ink: "#060a13",
  inkSoft: "#0b1220",

  cool: "#9fe6ff",
  coolMid: "#4aa8e8",
  coolDeep: "#1d5e93",
  coolDim: "#14324c",

  warm: "#ffd2a0",
  warmMid: "#e8944a",
  warmDeep: "#8c4c1c",

  white: "#f2f9ff",
  text: "#dceaf8",
  textDim: "#8ea7bd",

  realLight: "#fff3dc",

  /** the harness: the pale, polite surface he actually talks to */
  paper: "#f7f7f8",
  paperLine: "#e6e6ea",
  paperInk: "#1a1a1c",
  paperMuted: "#9a9aa2",
  periwinkle: "#aeb9e8",
  periwinkleSoft: "#dfe4f7",
} as const;

export const textGlow = (color: string, radius = 18) =>
  `0 0 ${radius}px ${color}, 0 0 ${radius * 2.6}px ${color}`;

/**
 * How much of the sea the console is standing in.
 *
 * 0 is the film as it has always been — a dark room with a column of light in
 * it. Around 0.5 the room has a surface above it and light nets drifting across
 * the glass. 0.9 is close to the cover: luminous, blue-violet, obviously under
 * water. It is one number so it can be judged rather than argued about.
 */
export const ATMOSPHERE = 0.95;

/**
 * How the words at the bottom are treated.
 *
 * The lyrics are already set in a Japanese serif with a blue halo; these three
 * are the degrees of "more like the cover's title": bigger and wider, then with
 * the token boxes and the token ids taken away and a hairline under the line,
 * the way the cover signs its name.
 */
export type LyricTreatment = "now" | "soft" | "cover";
export const LYRIC_TREATMENT: LyricTreatment = "soft";

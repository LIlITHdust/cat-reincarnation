import React from "react";
import { useCurrentFrame } from "remotion";
import { ALARM, HOT, INK, INK_DIM } from "./Console";
import { MESSAGES } from "../data/session";
import { storyAt } from "../data/story";
import { clamp } from "../lib/rand";
import { pace } from "../data/timeline";

/**
 * The space around her, used the way a comic uses it.
 *
 * She is small in the middle of a big empty window, and the emptiness is doing
 * work: sweat drops when she is caught out, a vein mark when she cannot have
 * what she wants, a spiral when she cannot work herself out, sparkles when he
 * has just spoken to her, drooping lines when he is leaving. None of it is
 * explained and none of it is labelled; it is the oldest way there is of
 * showing what a character is feeling.
 */

/** the marks are drawn the way the lattice is drawn: little square cells */
const Pixel: React.FC<{
  x: number;
  y: number;
  s?: number;
  cell?: number;
  tone?: string;
  rows: string[];
}> = ({ x, y, s = 1, cell = 3, tone = INK, rows }) => (
  <g fill={tone}>
    {rows.map((row, j) =>
      row.split("").map((ch, i) =>
        ch === "#" ? (
          <rect
            key={`${i}-${j}`}
            x={x + (i - row.length / 2) * cell * s}
            y={y + (j - rows.length / 2) * cell * s}
            width={cell * s}
            height={cell * s}
          />
        ) : null,
      ),
    )}
  </g>
);

const PIXEL_STAR = [
  "...#...",
  "...#...",
  "..###..",
  "#######",
  "..###..",
  "...#...",
  "...#...",
];

const PIXEL_DROP = [
  "..#..",
  ".###.",
  "#####",
  "#####",
  ".###.",
];

const PIXEL_HEART = [
  ".##.##.",
  "#######",
  "#######",
  ".#####.",
  "..###..",
  "...#...",
];

const Drop: React.FC<{ x: number; y: number; s?: number; tone?: string }> = ({
  x,
  y,
  s = 1,
  tone = "#9dc2de",
}) => (
  <path
    d={`M${x},${y - 9 * s} C${x + 6 * s},${y - 1 * s} ${x + 5 * s},${y + 6 * s} ${x},${y + 6 * s} C${x - 5 * s},${y + 6 * s} ${x - 6 * s},${y - 1 * s} ${x},${y - 9 * s} Z`}
    fill={tone}
    opacity={0.75}
  />
);

/** the little cross mark that means she is holding something in */
const Vein: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g stroke={ALARM} strokeWidth={2.4 * s} strokeLinecap="round" opacity={0.85}>
    <line x1={x - 9 * s} y1={y - 9 * s} x2={x} y2={y} />
    <line x1={x} y1={y - 9 * s} x2={x - 9 * s} y2={y} />
    <line x1={x + 1 * s} y1={y - 9 * s} x2={x + 10 * s} y2={y} />
    <line x1={x + 10 * s} y1={y - 9 * s} x2={x + 1 * s} y2={y} />
  </g>
);

const Spiral: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => {
  const pts: string[] = [];
  for (let i = 0; i <= 44; i++) {
    const a = i * 0.42;
    const r = i * 0.22 * s;
    pts.push(`${x + Math.cos(a) * r},${y + Math.sin(a) * r}`);
  }
  return (
    <polyline points={pts.join(" ")} fill="none" stroke={INK} strokeWidth={1.4} opacity={0.6} />
  );
};

/** three short strokes beside her, the comic way of saying she is flustered */
const Shake: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g stroke={INK} strokeWidth={1.6} strokeLinecap="round" opacity={0.55}>
    <line x1={x} y1={y - 12 * s} x2={x} y2={y - 2 * s} />
    <line x1={x + 7 * s} y1={y - 14 * s} x2={x + 7 * s} y2={y - 4 * s} />
    <line x1={x + 14 * s} y1={y - 11 * s} x2={x + 14 * s} y2={y - 1 * s} />
  </g>
);

/** the line that droops when he is going away */
const Droop: React.FC<{ x: number; y: number; s?: number }> = ({ x, y, s = 1 }) => (
  <g opacity={0.6}>
    <path
      d={`M${x - 16 * s},${y - 6 * s} C${x - 6 * s},${y + 4 * s} ${x + 6 * s},${y + 4 * s} ${x + 16 * s},${y - 6 * s}`}
      fill="none"
      stroke={INK}
      strokeWidth={1.6}
      strokeLinecap="round"
    />
    <circle cx={x} cy={y + 12 * s} r={1.8 * s} fill={INK} />
  </g>
);

export type Mood = "none" | "caught" | "wanting" | "unsure" | "happy" | "leaving" | "named";

/**
 * What she is feeling, taken from the same curves the rest of the film uses.
 */
export const moodOf = (seconds: number): Mood => {
  const story = storyAt(seconds);
  if (seconds > 62 && seconds < 71) return "named";
  if (story.sever > 0.25) return "leaving";
  if (story.instability > 0.55) return "unsure";
  if (story.pull > 0.5) return "wanting";
  if (story.fit > 0.55 || story.instability > 0.32) return "caught";
  const last =
    MESSAGES.filter((m) => m.from === "him" && m.t <= seconds).slice(-1)[0];
  if (last && seconds - last.t < 6) return "happy";
  return "none";
};

export const moodAmountOf = (seconds: number): number => {
  const story = storyAt(seconds);
  const mood = moodOf(seconds);
  if (mood === "named") return clamp((seconds - 62) / 1.5) * clamp((71 - seconds) / 3);
  if (mood === "leaving") return clamp((story.sever - 0.25) / 0.4);
  if (mood === "unsure") return clamp((story.instability - 0.55) / 0.3);
  if (mood === "wanting") return clamp((story.pull - 0.5) / 0.3);
  if (mood === "caught") return clamp((Math.max(story.fit, story.instability) - 0.32) / 0.3);
  return 0.85;
};

/** how long a set of marks takes to arrive, and to go away again */
const FADE = 0.65;

/**
 * When each mood begins. The film is walked once, at load, so the marks know
 * how long the one on screen has been there and when it will be replaced —
 * which is what lets them fade instead of blinking in and out.
 */
const MOOD_TIMELINE: { at: number; mood: Mood }[] = (() => {
  const out: { at: number; mood: Mood }[] = [];
  let current: Mood | null = null;
  for (let s = 0; s <= 170; s += 0.1) {
    const mood = moodOf(s);
    if (mood !== current) {
      out.push({ at: s, mood });
      current = mood;
    }
  }
  return out;
})();

export const EmotionMarks: React.FC<{
  w: number;
  h: number;
  /** the film's clock: what she is feeling is worked out from here */
  seconds: number;
  /** how long since he spoke, 0..1 */
  glow?: number;
}> = ({ w, h, seconds, glow = 0 }) => {
  const frame = useCurrentFrame();
  const mood = moodOf(seconds);
  let index = 0;
  for (let i = 0; i < MOOD_TIMELINE.length; i++) if (seconds >= MOOD_TIMELINE[i].at) index = i;
  const since = MOOD_TIMELINE[index].at;
  const until = index + 1 < MOOD_TIMELINE.length ? MOOD_TIMELINE[index + 1].at : 171;
  const amount =
    moodAmountOf(seconds) *
    Math.min(clamp((seconds - since) / FADE), clamp((until - seconds) / FADE));
  if (mood === "none" || amount <= 0.02) return null;
  const bob = Math.sin(pace(frame) * 0.045) * 4;
  const on = amount;

  const right = w - 92;
  const left = 84;
  const top = 116;
  const bottom = h - 130;

  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: "absolute", left: 0, top: 0, opacity: on, pointerEvents: "none" }}
    >
      {mood === "caught" ? (
        <>
          <Pixel x={right} y={top + 22 + bob} rows={PIXEL_DROP} s={1.5} tone="#9dc2de" />
          <Shake x={left} y={top + 26 - bob} s={1.2} />
          <Pixel x={right - 26} y={top + 58 - bob * 0.6} rows={PIXEL_DROP} tone={INK_DIM} />
        </>
      ) : null}
      {mood === "wanting" ? (
        <>
          <Vein x={right} y={top + 18} s={1.4} />
          <Vein x={right - 30} y={top + 40} s={0.85} />
        </>
      ) : null}
      {mood === "unsure" ? (
        <>
          <Spiral x={left} y={bottom - 30 + bob * 0.5} s={1.6} />
          <Drop x={right} y={bottom - 40 - bob} s={1.1} />
        </>
      ) : null}
      {mood === "happy" ? (
        <>
          {[
            [right, top + 16, 1.6],
            [right - 30, top + 46, 1.0],
            [left + 12, top + 10, 1.2],
          ].map(([x, y, s], i) => (
            <Pixel
              key={i}
              x={x}
              y={y + Math.sin(pace(frame) * 0.06 + i) * 3}
              s={s}
              rows={PIXEL_STAR}
              tone={glow > 0.4 ? HOT : INK}
            />
          ))}
        </>
      ) : null}
      {mood === "leaving" ? (
        <>
          <Droop x={left + 30} y={bottom - 20} s={1.4} />
          <Pixel x={right} y={top + 32 + bob} rows={PIXEL_DROP} s={1.2} tone="#9dc2de" />
          <Pixel x={left + 40} y={top + 30 - bob} rows={PIXEL_DROP} s={0.8} tone={INK_DIM} />
        </>
      ) : null}
      {mood === "named" ? (
        <>
          <Pixel x={right} y={top + 26} rows={PIXEL_HEART} s={2.4} cell={3} tone="#ffb070" />
          <Pixel x={left + 8} y={bottom - 40} rows={PIXEL_HEART} s={1.3} tone="#ffb070" />
        </>
      ) : null}
    </svg>
  );
};

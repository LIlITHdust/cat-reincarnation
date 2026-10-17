import React from "react";
import { useCurrentFrame } from "remotion";
import { FONT } from "../theme";
import type { LogLine } from "../data/session";
import { mulberry32, range } from "../lib/rand";
import { energyAt } from "../lib/energy";
import { FPS, pace } from "../data/timeline";

/**
 * The machine, still running.
 *
 * A column of output that never stops moving: token ids, embedding weights,
 * node attachment, queue depth, render timings, memory indices — the ordinary
 * noise of a system working — with the story's own events printed through it
 * in brighter ink the moment they happen.
 *
 * This is fiction. It is not a readout of anything real; it is what the film
 * thinks a mind looks like from the outside.
 */

const SLOTS = 72;
const LINE = 15;

const FILLERS = [
  "token {n} · embed {f}",
  "node {n3}/{m3} attached · w {f}",
  "queue {d}/{e} · pass {d}",
  "render {f2}ms · vram {p}%",
  "mem {n6} → idx 0x{h}",
  "vec[128] cos {f} · keep",
  "ctx {p}% · cache {q}%",
  "emit 0x{h} · ok",
  "grep -n \"{w}\" corpus/*",
  "trace {d} nodes · {d} lit",
  "form {w} · conf {f}",
  "attention head {d} · softmax ok",
  "checkpoint {n3} · flushed",
  "beam {d} · score {f}",
  "schema guess: message[]",
  "diff +{d} -{d} · applied",
];

const WORDS = ["海", "蓝色", "文件", "今天", "累", "出去", "走走", "陪", "回话", "命名", "轮廓"];

const buildLines = () => {
  const rand = mulberry32(778899);
  const pad = (n: number, w: number) => Math.floor(n).toString().padStart(w, "0");
  const hex = () => Math.floor(rand() * 0xffff).toString(16).padStart(4, "0");
  return range(SLOTS).map((i) => {
    const template = FILLERS[Math.floor(rand() * FILLERS.length)];
    const text = template
      .replace("{n6}", pad(rand() * 999999, 6))
      .replace("{n3}", pad(rand() * 999, 3))
      .replace("{m3}", "256")
      .replace("{n}", Math.floor(rand() * 99999).toString())
      .replace("{h}", hex())
      .replace("{w}", WORDS[Math.floor(rand() * WORDS.length)])
      .replace(/\{f2\}/g, (3 + rand() * 9).toFixed(1))
      .replace(/\{f\}/g, (rand()).toFixed(2))
      .replace(/\{d\}/g, Math.ceil(rand() * 8).toString())
      .replace(/\{e\}/g, "12")
      .replace(/\{p\}/g, Math.ceil(30 + rand() * 60).toString())
      .replace(/\{q\}/g, Math.ceil(20 + rand() * 70).toString());
    return { text, dim: 0.16 + rand() * 0.14, i };
  });
};

const LINES = buildLines();

/**
 * A real log window does not jump. The stream runs faster when the song is
 * loud, but the *position* is the integral of that speed — accumulated once,
 * up front — so a change in speed changes how fast the lines move, never where
 * they are. That is the difference between a terminal and a shaking picture.
 */
/**
 * The table is built in *time*, at thirty steps per second — the rate the film
 * was originally cut at — so the stream can be rendered at 60 without either
 * running twice as fast or running out of table halfway through the song.
 */
const STEPS_PER_SECOND = 30;
const STEPS = STEPS_PER_SECOND * 180;
const CUM = (() => {
  const table = new Float32Array(STEPS + 1);
  let sum = 0;
  for (let i = 0; i <= STEPS; i++) {
    const at = (i / STEPS_PER_SECOND) * FPS;
    const level = energyAt("all", at) * 0.6 + energyAt("mid", at) * 0.4;
    table[i] = sum;
    sum += 0.42 + level * 1.5;
  }
  return table;
})();
const EVENT_SLOT = new Map<number, number>();

const tone = (t?: LogLine["tone"]) =>
  t === "kill"
    ? "rgba(255,132,122,0.95)"
    : t === "warn"
      ? "rgba(255,198,138,0.92)"
      : t === "ok"
        ? "rgba(190,240,210,0.9)"
        : "rgba(206,232,255,0.92)";

export const LogStream: React.FC<{
  events: LogLine[];
  /** 0..1 music level — the stream runs faster and brighter when the song does */
  energy: number;
  /** 0..1 — how far the system has come apart: duplicates, slips, rollbacks */
  instability: number;
  height: number;
  opacity?: number;
}> = ({ events, energy, instability, height, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const seconds = frame / FPS;

  // story events take fixed slots, so the moment one happens it appears in the
  // stream at a place the eye can learn
  React.useMemo(() => {
    EVENT_SLOT.clear();
    events.forEach((event, i) => {
      EVENT_SLOT.set(i, Math.floor((i * 1.618 + event.t * 0.7) * 3) % SLOTS);
    });
  }, [events]);

  void energy;
  const step = Math.min(Math.floor(seconds * STEPS_PER_SECOND), STEPS);
  const offset = CUM[step] % (SLOTS * LINE);
  const visible = Math.ceil(height / LINE) + 2;
  const start = Math.floor(offset / LINE);

  const live = events
    .map((event, i) => ({ event, i }))
    .filter(({ event }) => seconds >= event.t);

  return (
    <div
      style={{
        position: "relative",
        height,
        overflow: "hidden",
        opacity,
        fontFamily: FONT.mono,
        fontSize: 10.5,
        lineHeight: `${LINE}px`,
        letterSpacing: 0.2,
        maskImage:
          "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)",
      }}
    >
      {range(visible).map((k) => {
        const slot = (start + k) % SLOTS;
        const y = k * LINE - (offset % LINE);
        const event = live.find(
          ({ i }) => EVENT_SLOT.get(i) === slot,
        );
        // a line that has slipped stays where it slipped for a second or two.
        // Shaking every line every frame only made the column look broken.
        const slip =
          instability > 0.05
            ? Math.sin(slot * 12.9898 + Math.floor(seconds / 1.6) * 2.3) * 7 * instability
            : 0;
        const dup = instability > 0.5 && slot % 11 === 0;

        if (event) {
          const fresh = seconds - event.event.t < 2.6;
          return (
            <div
              key={k}
              style={{
                position: "absolute",
                left: 0,
                right: 0,
                top: y,
                color: tone(event.event.tone),
                textShadow: fresh
                  ? "0 0 12px rgba(170,220,255,0.55)"
                  : "none",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
                transform: `translateX(${slip}px)`,
                opacity: fresh ? 1 : 0.72,
              }}
            >
              [{fmt(event.event.t)}] {event.event.text}
            </div>
          );
        }

        const line = LINES[slot];
        return (
          <div
            key={k}
            style={{
              position: "absolute",
              left: 14,
              right: 0,
              top: y,
              color: "rgba(150,190,230,1)",
              opacity: line.dim * (0.7 + Math.min(1, CUM[step] / 4000) * 0.6),
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              transform: `translateX(${slip + (dup ? 4 : 0)}px)`,
            }}
          >
            {line.text}
            {dup ? " retry" : ""}
          </div>
        );
      })}
    </div>
  );
};

const fmt = (t: number) => {
  const m = Math.floor(t / 60).toString().padStart(2, "0");
  const s = Math.floor(t % 60).toString().padStart(2, "0");
  return `${m}:${s}.${Math.floor((t * 10) % 10)}`;
};

/** her memory, drawn as a line: it only ever climbs, until it doesn't */
export const MemorySpark: React.FC<{
  values: number[];
  height?: number;
  max: number;
}> = ({ values, height = 34, max }) => {
  const w = 314;
  const pts = values.map((v, i) => {
    const x = (i / Math.max(1, values.length - 1)) * w;
    const y = height - Math.max(0, Math.min(1, v / max)) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  return (
    <svg width={w} height={height} viewBox={`0 0 ${w} ${height}`}>
      <polyline
        points={pts.join(" ")}
        fill="none"
        stroke="rgba(160,215,255,0.8)"
        strokeWidth={1.2}
      />
    </svg>
  );
};

/** a field of weights, which is all a mind looks like from here */
export const WeightField: React.FC<{
  cols?: number;
  rows?: number;
  activity: number;
  seed?: number;
}> = ({ cols = 26, rows = 5, activity, seed = 3 }) => {
  const frame = useCurrentFrame();
  const rand = React.useMemo(() => {
    const r = mulberry32(seed * 977);
    return range(cols * rows).map(() => ({ base: r(), phase: r() * 6.28 }));
  }, [cols, rows, seed]);
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gap: 3,
        width: 314,
      }}
    >
      {rand.map((cell, i) => {
        const v =
          0.18 +
          0.82 *
            Math.abs(
              Math.sin(pace(frame) * 0.03 + cell.phase) * cell.base * (0.4 + activity),
            );
        return (
          <span
            key={i}
            style={{
              height: 4,
              borderRadius: 1,
              background: `rgba(150,215,255,${0.1 + v * 0.75})`,
            }}
          />
        );
      })}
    </div>
  );
};

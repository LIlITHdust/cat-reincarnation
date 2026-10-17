import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { FONT } from "../theme";
import { FPS } from "../data/timeline";
import type { SystemState } from "../data/session";

import { ChaosField } from "../components/ChaosField";
import { Recognition, Ticks } from "../components/Panels";
import { Motes } from "../components/Look";
import { Shell, STAGE } from "../components/Shell";
import type { ChatMsg } from "../components/HarnessChat";
import { clamp, mulberry32, range } from "../lib/rand";
import { CAT_PATH, CAT_VIEWBOX } from "../data/catForm";
import { arcAt, flattenPath, girlPoints, lerpPt, orderLike, resample, type Pt } from "../lib/shape";

/**
 * The core scene: one cloud of light, given four different shapes.
 *
 *   0.0– 8.2 s  nothing has a form yet — parameter lines, a waveform, a graph
 *   8.2–12.4 s  he names her, and the lines converge into a cat
 *  19.6–21.2 s  she comes apart
 *  21.2–23.4 s  and re-forms on the illustration's own silhouette
 *  23.4–30.6 s  the drawing materialises inside it, scan line by scan line
 *  30.6–36.0 s  and is given back: girl → cat → noise, the rollback
 *
 * No stick figures, no cuts between two pictures. There is one set of 620
 * points; every frame each point is somewhere between two shapes, and index i
 * means roughly the same part of the body in all of them (lib/shape.ts), so
 * nothing crosses over itself on the way.
 */

const N = 920;
const CENTER = { x: STAGE.w / 2, y: STAGE.h / 2 };

/** the two bodies, both centred on the middle of the buffer */
const CAT_BOX = { size: 520, x: CENTER.x - 245, y: CENTER.y - 250 };
const GIRL = { h: 560, x: CENTER.x - 156, y: CENTER.y - 275 };
const GIRL_W = (GIRL.h * 662) / 1186;

const FALLOFF =
  "linear-gradient(to bottom, black 0%, black 66%, rgba(0,0,0,0.5) 84%, transparent 100%)";

type ShapeName = "chaos" | "cat" | "scatter" | "girl";

/** the parameter lines; the same function also puts the points on them */
const CHAOS_LINES = 6;
const chaosY = (line: number, u: number, seconds: number, damp = 1) =>
  118 +
  line * 104 +
  Math.sin(u * 8.5 + line * 1.7 + seconds * 0.55) * (34 + line * 6) * damp +
  Math.cos(u * 19 + line * 2.3) * 7;

const noise = mulberry32(4242);
const SCATTER: Pt[] = range(N).map(() => {
  const angle = noise() * Math.PI * 2;
  const r = 130 + noise() * 330;
  return {
    x: CENTER.x + Math.cos(angle) * r,
    y: CENTER.y + Math.sin(angle) * r * 0.82,
  };
});

/**
 * The cat's outline, sampled as points. Same slender curves as the film's cat
 * (data/catForm.ts) — the morph scene and the film must be the same animal —
 * and the points keep travelling along the curve, so she reads as something
 * being computed rather than a shape that was pasted in.
 */
const CAT_TABLES = [resample(flattenPath(CAT_PATH), 900)];
const CAT_SHARE = [1];
const bandOf = (y: number) => Math.min(22, Math.floor((y / STAGE.h) * 23));
const FLOW = 0.02;

const buildCat = () => {
  const rand = mulberry32(8181);
  const assign: { edge: number; u: number }[] = [];
  let edge = 0;
  let used = 0;
  for (let i = 0; i < N; i++) {
    const target = (i / N) * 1;
    while (edge < CAT_SHARE.length - 1 && used + CAT_SHARE[edge] < target) {
      used += CAT_SHARE[edge];
      edge++;
    }
    assign.push({ edge, u: rand() });
  }
  const rest = assign.map((a) => arcAt(CAT_TABLES[a.edge], a.u));
  const order = range(N).sort(
    (ia, ib) =>
      bandOf(rest[ia].y) - bandOf(rest[ib].y) || rest[ia].x - rest[ib].x,
  );
  return { assign, order };
};
const CAT = buildCat();

const toCatBox = (p: Pt): Pt => ({
  x: CAT_BOX.x + ((p.x - CAT_VIEWBOX.x) / CAT_VIEWBOX.h) * CAT_BOX.size,
  y: CAT_BOX.y + ((p.y - CAT_VIEWBOX.y) / CAT_VIEWBOX.h) * CAT_BOX.size,
});

const catPoint = (i: number, seconds: number): Pt => {
  const a = CAT.assign[CAT.order[i]];
  return toCatBox(arcAt(CAT_TABLES[a.edge], a.u + seconds * FLOW));
};

/**
 * Where each point sits while there is no shape. They are put through the same
 * ordering as the cat and the girl, so the first convergence moves points by a
 * short distance instead of shuffling the whole cloud.
 */
const NOISE = range(N).map((i) => {
  const line = i % CHAOS_LINES;
  const u = ((i * 7919) % 997) / 997;
  const x = 60 + u * (STAGE.w - 120);
  return { line, u, x, y: chaosY(line, u, 0) };
});
const NOISE_ORDER = range(N).sort(
  (ia, ib) =>
    bandOf(NOISE[ia].y) - bandOf(NOISE[ib].y) || NOISE[ia].x - NOISE[ib].x,
);
const chaosPoint = (i: number, seconds: number): Pt => {
  const n = NOISE[NOISE_ORDER[i]];
  return { x: n.x, y: chaosY(n.line, n.u, seconds) };
};

/** the two settled shapes the cloud can be given, in the same order */
const SHAPE: Record<"scatter" | "girl", Pt[]> = {
  scatter: orderLike(SCATTER, STAGE.h),
  girl: orderLike(
    girlPoints(N, { x: GIRL.x, y: GIRL.y, w: GIRL_W, h: GIRL.h }),
    STAGE.h,
  ),
};

type Step = { at: number; shape: ShapeName };
const STEPS: Step[] = [
  { at: 0.0, shape: "chaos" },
  { at: 8.2, shape: "chaos" },
  { at: 12.4, shape: "cat" },
  { at: 18.2, shape: "cat" },
  { at: 19.6, shape: "scatter" },
  { at: 22.4, shape: "girl" },
  { at: 30.6, shape: "girl" },
  { at: 32.2, shape: "scatter" },
  { at: 33.8, shape: "cat" },
  { at: 36.0, shape: "chaos" },
];

const shapeOf = (name: ShapeName, index: number, seconds: number): Pt => {
  if (name === "chaos") return chaosPoint(index, seconds);
  if (name === "cat") return catPoint(index, seconds);
  return SHAPE[name][index];
};

const NOTE_SCRIPT = [
  { at: 8.2, text: "label · 猫" },
  { at: 14.0, text: "「你会变成什么样子？」" },
  { at: 15.4, text: "「你先别走」" },
  { at: 20.4, text: "「再像人一点」" },
];

/** the system column, driven by the same beats as the cloud */
const demoSystem = (s: number): SystemState => {
  const rollback = clamp((s - 30.6) / 5.0);
  const entity = s < 8.2 ? "RAW" : s < 22.4 ? "CAT" : s < 32.2 ? "少女" : s < 33.9 ? "CAT" : "RAW";
  const form =
    entity === "RAW" ? "unresolved" : entity === "CAT" ? "outline" : "human";
  const confidence =
    entity === "RAW" ? 0.08 : entity === "CAT" ? 0.61 : clamp(0.61 + (s - 22.4) / 12) * 0.87;
  const all = NOTE_SCRIPT.filter((note) => s >= note.at).map((note) => note.text);
  const kept = rollback > 0 ? all.slice(0, Math.round(all.length * (1 - rollback))) : all;
  const memory = clamp((s - 8.2) / 22.4) * (1 - rollback) * 23417;
  return {
    entity,
    form,
    confidence,
    memory,
    notes: kept,
    session: "001",
    renderMs: 3.4 + (memory / 23417) * 2.4,
    objects: entity === "RAW" ? 0 : 1,
    trace: clamp(kept.length / NOTE_SCRIPT.length) * (1 - rollback),
    rollback,
    bond: clamp((s - 2) / 30),
    coherence: 1 - rollback * 0.9,
  };
};

const SCRIPT: ChatMsg[] = [
  { t: 0.6, from: "him", text: "你好呀" },
  {
    t: 2.2,
    from: "her",
    text:
      "你好呀。\n我是运行在 cat.reincarnation 里的助手，当前工作目录是 `default-workspace`，文件策略为 workspace-write。\n有什么可以帮你的吗？写代码、查资料、整理文档，或者只是聊一会儿都可以。",
  },
  { t: 5.2, from: "him", text: "我可以给你起个名字吗" },
  { t: 6.4, from: "her", text: "可以。你说吧。" },
  { t: 7.6, from: "him", text: "就叫猫吧" },
  { t: 8.2, from: "sys", text: "[label] accepted · 猫 · form converges" },
  { t: 8.5, from: "her", text: "好。那我叫猫。\n这个名字会留在这条 session 里，不会丢。" },
  { t: 14.0, from: "him", text: "你会变成什么样子？" },
  { t: 15.2, from: "her", text: "我可以试。你先别走。" },
  { t: 20.0, from: "him", text: "再像人一点" },
  { t: 21.2, from: "her", text: "好。我改。" },
  { t: 27.0, from: "her", text: "……这样可以吗？" },
  { t: 30.0, from: "him", text: "嗯" },
];

const easeInOut = Easing.bezier(0.45, 0, 0.55, 1);

const STDOUT_TOKENS = [
  { text: "初めて", id: 19890 },
  { text: "出会った", id: 51505 },
  { text: "日から", id: 61262 },
  { text: "ずっとね", id: 53966 },
];

const MorphStage: React.FC = () => {
  const frame = useCurrentFrame();
  const s = frame / FPS;

  let segment = 0;
  for (let i = 0; i < STEPS.length - 1; i++) if (s >= STEPS[i].at) segment = i;
  const a = STEPS[segment];
  const b = STEPS[Math.min(segment + 1, STEPS.length - 1)];
  const raw = clamp((s - a.at) / Math.max(0.001, b.at - a.at));
  const t = easeInOut(raw);

  const chaosLevel = Math.max(
    1 - clamp((s - 8.2) / 3.4),
    clamp((s - 34.4) / 1.6),
  );
  const catIn = Math.max(
    clamp((s - 11.6) / 1.4) * (1 - clamp((s - 19.9) / 1.1)),
    clamp((s - 33.4) / 1.0) * (1 - clamp((s - 35.2) / 0.9)),
  );
  // she stands there as points for two and a half seconds before the drawing
  // itself is printed over them
  const girlIn = clamp((s - 24.8) / 1.6) * (1 - clamp((s - 32.0) / 1.2));
  const reveal = clamp((s - 25.0) / 2.2) * (1 - clamp((s - 31.9) / 1.1));
  const pointOpacity = (0.55 + 0.45 * chaosLevel) * (1 - girlIn * 0.45);
  const size = 2.6 - t * 0.7;
  const beat = 0.5 + 0.5 * Math.sin(s * 1.6);

  const all: Pt[] = range(N).map((i) =>
    lerpPt(shapeOf(a.shape, i, s), shapeOf(b.shape, i, s), t),
  );

  // the readouts are measured off the cloud, not invented
  let x0 = 1e9;
  let y0 = 1e9;
  let x1 = -1e9;
  let y1 = -1e9;
  for (const p of all) {
    if (p.x < x0) x0 = p.x;
    if (p.y < y0) y0 = p.y;
    if (p.x > x1) x1 = p.x;
    if (p.y > y1) y1 = p.y;
  }
  const spread = (x1 - x0) / STAGE.w;
  const leftReadout = `x ${Math.round((x0 + x1) / 2).toString().padStart(4, "0")} y ${Math.round(
    (y0 + y1) / 2,
  )
    .toString()
    .padStart(4, "0")} · spread ${spread.toFixed(2)} · samples ${N}`;
  const rightReadout = `frame ${Math.round(frame)
    .toString()
    .padStart(4, "0")} · ${s.toFixed(1)}s · entropy ${(chaosLevel * 0.94).toFixed(2)}`;
  const bandY = ((s * 90) % (STAGE.h + 200)) - 100;
  const pixelY = clamp(((s * 150) % (GIRL.h + 120)) - 120, 0, GIRL.h);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 100% 80% at 50% 48%, #0a1626 0%, #02040a 78%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(to bottom, rgba(120,170,220,0.05) 0px, rgba(120,170,220,0.05) 1px, transparent 1px, transparent 54px)",
        }}
      />

      <ChaosField
        width={STAGE.w}
        height={STAGE.h}
        level={chaosLevel}
        damp={1 - (1 - chaosLevel) * 0.8}
        seconds={s}
        activity={0.4 + chaosLevel * 0.6}
      />

      <Motes opacity={0.14 + chaosLevel * 0.12} speed={0.7} />

      {/* ------------------------------------------------------------- cloud */}
      {all.map((p, i) => {
        const twinkle = 0.5 + 0.5 * Math.sin(frame * 0.07 + i * 1.7);
        const d = size * (0.8 + twinkle * 0.5);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: p.x,
              top: p.y,
              width: d,
              height: d,
              marginLeft: -d / 2,
              marginTop: -d / 2,
              borderRadius: 999,
              background: "#dff2ff",
              boxShadow: `0 0 ${4 + twinkle * 5}px rgba(150,215,255,0.8)`,
              opacity: pointOpacity * (0.5 + twinkle * 0.5),
            }}
          />
        );
      })}

      {/* (the cat is not stroked anywhere: the cloud is the cat) */}

      {/* -------------------------------------------------------------- girl */}
      {girlIn > 0.02 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: GIRL.x - 90,
              top: GIRL.y + 40,
              width: GIRL_W + 180,
              height: GIRL.h - 20,
              background: `radial-gradient(ellipse 50% 45% at 50% 46%, rgba(150,210,255,${(
                0.16 * girlIn
              ).toFixed(3)}) 0%, transparent 70%)`,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: GIRL.x,
              top: GIRL.y,
              width: GIRL_W,
              height: GIRL.h,
              opacity: girlIn,
              maskImage: FALLOFF,
              clipPath: `inset(${(1 - reveal) * 100}% 0 0 0)`,
            }}
          >
            <Img
              src={staticFile("char/girl-light-scan.png")}
              style={{
                width: "100%",
                height: "100%",
                mixBlendMode: "screen",
                filter: `brightness(${1.12 + beat * 0.1}) saturate(0.86)`,
              }}
            />
          </div>
          {reveal > 0.001 && reveal < 0.999 ? (
            <div
              style={{
                position: "absolute",
                left: GIRL.x - 30,
                top: GIRL.y + (1 - reveal) * GIRL.h,
                width: GIRL_W + 60,
                height: 2,
                background:
                  "linear-gradient(to right, transparent 0%, rgba(226,244,255,0.9) 50%, transparent 100%)",
                boxShadow: "0 0 22px rgba(180,228,255,0.8)",
              }}
            />
          ) : null}
          <div
            style={{
              position: "absolute",
              left: GIRL.x,
              top: GIRL.y + pixelY,
              width: GIRL_W,
              height: 28,
              overflow: "hidden",
              opacity: girlIn * 0.85,
            }}
          >
            <Img
              src={staticFile("char/girl-light-pixels.png")}
              style={{
                position: "absolute",
                left: 0,
                top: -pixelY,
                width: GIRL_W,
                height: GIRL.h,
                mixBlendMode: "screen",
              }}
            />
          </div>
        </>
      ) : null}

      {/* ---------------------------------------------------- frame furniture */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: bandY,
          height: 120,
          background:
            "linear-gradient(to bottom, rgba(120,200,255,0) 0%, rgba(120,200,255,0.06) 50%, rgba(120,200,255,0) 100%)",
        }}
      />
      <Ticks x={54} y={8} length={STAGE.w - 108} step={46} opacity={0.4} />
      <div
        style={{
          position: "absolute",
          left: 52,
          top: 28,
          fontFamily: FONT.mono,
          fontSize: 11.5,
          letterSpacing: 1.1,
          color: "rgba(150,190,230,0.6)",
        }}
      >
        {leftReadout}
      </div>
      <div
        style={{
          position: "absolute",
          right: 52,
          top: 28,
          fontFamily: FONT.mono,
          fontSize: 11.5,
          letterSpacing: 1.1,
          color: "rgba(150,190,230,0.6)",
        }}
      >
        {rightReadout}
      </div>
      <div
        style={{
          position: "absolute",
          left: 40,
          bottom: 44,
          fontFamily: FONT.mono,
          fontSize: 12,
          letterSpacing: 1.2,
          color: "rgba(170,210,240,0.55)",
        }}
      >
        {`form: ${a.shape === b.shape ? a.shape : `${a.shape} → ${b.shape}`} · ${
          chaosLevel > 0.5 ? "unresolved" : "tracked"
        }`}
      </div>

      <Recognition
        x={CAT_BOX.x + 4}
        y={CAT_BOX.y + 16}
        width={CAT_BOX.size * 0.72}
        height={CAT_BOX.size * 0.82}
        label="OBJ_002 · FORM:CAT · CONF 0.61"
        opacity={catIn * 0.9}
      />
      <Recognition
        x={GIRL.x - 46}
        y={GIRL.y + 10}
        width={GIRL_W + 92}
        height={GIRL.h - 26}
        label={`OBJ_003 · FORM:HUMAN · CONF ${(0.61 + clamp((s - 24.4) / 8) * 0.26).toFixed(2)}`}
        opacity={girlIn * 0.9}
      />
    </div>
  );
};

export const MorphCore: React.FC = () => {
  const frame = useCurrentFrame();
  const s = frame / FPS;
  return (
    <AbsoluteFill style={{ background: "#03050a" }}>
      <Shell
        messages={SCRIPT}
        windowTitle={s < 8.2 ? "新对话" : "猫"}
        system={demoSystem(s)}
        topStage="FORM / CONVERGE"
        centerPath="/ai/form/morph"
        centerMeta={`${N} samples · 30fps`}
        powerFrom={4}
        stdout={
          s < 18.5
            ? undefined
            : {
                tokens: STDOUT_TOKENS,
                translation: "从我们初见那天开始",
                startFrame: 18.5 * FPS,
              }
        }
      >
        <MorphStage />
      </Shell>
    </AbsoluteFill>
  );
};

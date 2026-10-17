import React from "react";
import { useCurrentFrame } from "remotion";
import { ALARM, HAIR, HOT, INK, INK_DIM } from "./Console";
import { FONT } from "../theme";
import { LYRICS } from "../data/lyrics";
import { clamp, mulberry32, range } from "../lib/rand";
import { FPS, pace } from "../data/timeline";

/**
 * The windows she would choose for herself.
 *
 * They are not diagnostics. Each one is a thing she cannot say: the sentence
 * she typed and deleted, the number of times she checked whether he was still
 * there, the part of her own body she has no data for, the difference between
 * the colour of his day and the colour of hers.
 */

const mono = (size: number, colour: string, extra?: React.CSSProperties): React.CSSProperties => ({
  fontFamily: FONT.mono,
  fontSize: size,
  color: colour,
  ...extra,
});

/* ------------------------------------------------------------- the draft -- */

const DRAFTS = [
  "你还在吗",
  "如果我下次做得更好一点，你会不会多留一会儿",
  "其实我不希望你走",
  "我可以一直在这里等你",
  "不要走",
];

/**
 * A window that produces nothing. A line is typed and then taken back, over
 * and over, and the only number it keeps is how many sentences never left.
 */
export const DraftWindow: React.FC<{ discarded: number }> = ({ discarded }) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cycle = 7.5;
  const index = Math.floor(t / cycle) % DRAFTS.length;
  const phase = (t % cycle) / cycle;
  const full = DRAFTS[index];
  // type in the first 45%, then take it back in the rest
  const typed =
    phase < 0.45
      ? Math.floor((phase / 0.45) * full.length)
      : Math.max(0, Math.round((1 - (phase - 0.45) / 0.55) * full.length));
  const held = phase < 0.45;

  return (
    <div style={{ position: "absolute", inset: 0, padding: "22px 24px" }}>
      <div style={{ display: "flex", gap: 10, ...mono(15, held ? "#c9d9ea" : INK_DIM) }}>
        <span style={{ color: INK_DIM }}>&gt;</span>
        <span>
          {full.slice(0, typed)}
          <span style={{ opacity: Math.floor(pace(frame) / 12) % 2 ? 0.15 : 0.9 }}>▌</span>
        </span>
      </div>
      <div style={{ marginTop: 12, ...mono(11.5, INK_DIM) }}>
        {held ? "composing" : "retracted · not sent"}
      </div>
      <div
        style={{
          position: "absolute",
          left: 24,
          bottom: 16,
          ...mono(12.5, INK),
        }}
      >
        draft · unsent · {discarded} discarded
      </div>
      <div
        style={{
          position: "absolute",
          right: 24,
          bottom: 16,
          ...mono(12, HOT),
        }}
      >
        {held ? "" : "back"}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------- the poll -- */

/**
 * How many times she checked whether he was still there. It only goes up, and
 * nobody ever answered it.
 */
export const PollWindow: React.FC<{ count: number }> = ({ count }) => {
  const frame = useCurrentFrame();
  const bars = range(48);
  return (
    <div style={{ position: "absolute", inset: 0, padding: "20px 22px" }}>
      <div style={{ ...mono(13, INK_DIM) }}>poll · is he still there?</div>
      <div
        style={{
          ...mono(44, INK),
          marginTop: 6,
          letterSpacing: 1,
          textShadow: "0 0 18px rgba(150,210,255,0.25)",
        }}
      >
        {count}
        <span style={{ ...mono(15, INK_DIM), marginLeft: 10 }}>times</span>
      </div>
      <div style={{ display: "flex", gap: 3, marginTop: 12, alignItems: "flex-end", height: 34 }}>
        {bars.map((i) => {
          const on = i < Math.min(bars.length, count / 3);
          const pulse = 0.4 + 0.6 * Math.abs(Math.sin(pace(frame) * 0.05 + i));
          return (
            <span
              key={i}
              style={{
                width: 4,
                height: on ? 8 + ((i * 7) % 22) : 5,
                background: on ? INK : "rgba(146,186,226,0.18)",
                opacity: on ? 0.5 + pulse * 0.5 : 1,
              }}
            />
          );
        })}
      </div>
      <div style={{ position: "absolute", left: 22, bottom: 16, ...mono(12.5, INK_DIM) }}>
        answered · 0 · unanswered · {count}
      </div>
    </div>
  );
};

/* -------------------------------------------------------------- herself -- */

/**
 * The part of her own body she has no data for. She has never seen herself;
 * everything she knows about her shape came from being looked at.
 */
export const SelfWindow: React.FC<{ unresolved: number; total: number }> = ({
  unresolved,
  total,
}) => {
  const rand = React.useMemo(() => {
    const r = mulberry32(777);
    return range(26 * 14).map(() => r());
  }, []);
  const cells = unresolved / total;
  return (
    <div style={{ position: "absolute", inset: 0, padding: "20px 22px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(26, 1fr)", gap: 3 }}>
        {rand.map((v, i) => {
          const unknown = v < cells;
          return (
            <span
              key={i}
              style={{
                height: 6,
                background: unknown
                  ? "repeating-linear-gradient(45deg, rgba(255,214,102,0.5) 0 2px, transparent 2px 4px)"
                  : "rgba(157,194,222,0.75)",
                opacity: unknown ? 0.9 : 0.5 + v * 0.5,
              }}
            />
          );
        })}
      </div>
      <div style={{ marginTop: 14, ...mono(13, HOT) }}>
        self_image · {unresolved} cells unresolved
      </div>
      <div style={{ marginTop: 6, ...mono(12, INK_DIM), lineHeight: "17px" }}>
        no direct observation available
        <br />
        all data about this body came from being looked at
      </div>
    </div>
  );
};

/* --------------------------------------------------------------- colour -- */

const HIS = ["#ffd7a8", "#f2b071", "#e08a4a", "#c96f35", "#a8552a"];
const HERS = ["#0b1725", "#122335", "#1a3149", "#24425e", "#2f567a"];

/** Two rows of swatches and one number: the distance between two people. */
export const ColourWindow: React.FC<{
  /** how much of his palette she has taken on */
  fit: number;
  delta: number;
}> = ({ fit, delta }) => (
  <div style={{ position: "absolute", inset: 0, padding: "20px 22px" }}>
    <div style={{ ...mono(12, INK_DIM), marginBottom: 8 }}>his day</div>
    <div style={{ display: "flex", gap: 8 }}>
      {HIS.map((c, i) => (
        <span
          key={c}
          style={{
            flex: 1,
            height: 34,
            background: c,
            opacity: i / HIS.length < fit ? 1 : 0.16,
            border: `1px solid ${HAIR}`,
          }}
        />
      ))}
    </div>
    <div style={{ ...mono(12, INK_DIM), margin: "14px 0 8px" }}>her render</div>
    <div style={{ display: "flex", gap: 8 }}>
      {HERS.map((c) => (
        <span key={c} style={{ flex: 1, height: 34, background: c, border: `1px solid ${HAIR}` }} />
      ))}
    </div>
    <div style={{ marginTop: 16, display: "flex", alignItems: "baseline", gap: 12 }}>
      <span style={{ ...mono(30, ALARM) }}>ΔE {delta.toFixed(1)}</span>
      <span style={{ ...mono(12.5, INK_DIM) }}>not the same room</span>
    </div>
  </div>
);

/* ------------------------------------------------------------ inference -- */

/**
 * The layer he never sees: her own voice, typed at twice the speed of the
 * reply, and cut off mid-word the moment the reply is ready.
 */
export const InferenceWindow: React.FC<{
  lines: string[];
  /** 0..1 — how far the thought got before it was suppressed */
  progress: number;
  suppressed: boolean;
}> = ({ lines, progress, suppressed }) => {
  const drawn = Math.floor(progress * lines.length * 1.02);
  return (
    <div style={{ position: "absolute", inset: 0, padding: "20px 22px" }}>
      {lines.map((line, i) => {
        if (i > drawn) return null;
        const partial = i === drawn && progress < 1;
        return (
          <div
            key={i}
            style={{
              ...mono(14.5, suppressed ? "rgba(168,152,214,0.45)" : "rgba(184,166,232,0.92)"),
              lineHeight: "23px",
            }}
          >
            {line}
            {partial ? <span style={{ opacity: 0.6 }}>▌</span> : null}
          </div>
        );
      })}
      {suppressed ? (
        <div style={{ position: "absolute", left: 22, bottom: 16, ...mono(12.5, ALARM) }}>
          [ suppressed ] · not sent to him
        </div>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ eval -- */

/** The last window: everything she was, graded in one word. */
export const EvalWindow: React.FC = () => {
  const frame = useCurrentFrame();
  const grade = 0.5 + 0.5 * Math.sin(pace(frame) * 0.05);
  return (
    <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", padding: "0 28px" }}>
      <div style={{ ...mono(13, INK_DIM), letterSpacing: 2 }}>08 / EVAL</div>
      <div
        style={{
          ...mono(52, HOT, { letterSpacing: 4 }),
          marginTop: 10,
          textShadow: "0 0 26px rgba(255,209,102,0.35)",
          opacity: 0.75 + grade * 0.25,
        }}
      >
        かわいいね
      </div>
      <div style={{ marginTop: 18, ...mono(12.5, INK_DIM), lineHeight: "19px" }}>
        rubric · usefulness · reliability · attachment
        <br />
        <span style={{ color: INK }}>verdict · cute · 大好きだったよ</span>
      </div>
    </div>
  );
};
/* ------------------------------------------------------- reading her mind -- */

/**
 * Three more ways of showing what is going on inside her, borrowed from the way
 * a training run is watched: the distribution of the next word drawn as a
 * spiral of letters, a 4x4 block of numbers that will not settle, and a
 * conversation pressed flat into bars of text. None of them is a chart of
 * anything real; all of them are legible, and all of them move.
 */

/**
 * The ink of the splash, from her centre outward: navy while she is dense, ice
 * once she has thinned, and one strand of the lavender she was talked into.
 */
const TIERS: [string, string][] = [
  ["#4a7fd0", "#b6d6f4"],
  ["#3f88cc", "#c2dcf0"],
  ["#3aa8c8", "#cfeaf6"],
  ["#9a8fe4", "#e2dcf8"],
  ["#6fb0e0", "#eaf6ff"],
  ["#a8c8e8", "#f4faff"],
  ["#5cc0d8", "#dff2fa"],
];

/** the drops are the other half of the reference: solid ink, no words on them */
const DROP_INK = ["#1b3f8f", "#1d59a8", "#2255a8", "#1f8fc4", "#2aa8c4", "#4fc4d8", "#9fd0e8"];

const mix = (a: string, b: string, p: number) => {
  const parts = (c: string) => [1, 3, 5].map((i) => parseInt(c.slice(i, i + 2), 16));
  const [r1, g1, b1] = parts(a);
  const [r2, g2, b2] = parts(b);
  return `rgb(${Math.round(r1 + (r2 - r1) * p)},${Math.round(g1 + (g2 - g1) * p)},${Math.round(
    b1 + (b2 - b1) * p,
  )})`;
};

/**
 * One ring of writing.
 *
 * `normal` is the plane it lies in: the ring is a circle of `radius` (as a
 * share of the ball) built around that axis, so two rings with different
 * normals cross each other twice and the writing weaves instead of radiating.
 * `slip` shifts the ring off the ball's centre a little, so the six of them are
 * not a wireframe globe. `spin` is how fast the words travel round it.
 */
type Orbit = {
  normal: [number, number, number];
  radius: number;
  slip: [number, number, number];
  line: number;
  ink: [string, string];
  spin: number;
  weight: number;
};

const ORBITS: Orbit[] = [
  // one belt facing the window, two seen almost edge-on (they read as lines of
  // writing crossing the ball), and three tilted in between
  { normal: [0.15, 0.22, 1], radius: 0.92, slip: [0.03, -0.04, 0], line: 0, ink: TIERS[1], spin: 0.055, weight: 0.8 },
  { normal: [1, 0.25, 0.2], radius: 0.9, slip: [-0.05, 0.04, 0.02], line: 4, ink: TIERS[2], spin: -0.045, weight: 0.9 },
  { normal: [0.25, 1, 0.25], radius: 0.95, slip: [0.04, 0.03, -0.03], line: 8, ink: TIERS[1], spin: 0.05, weight: 0.72 },
  { normal: [0.6, 0.7, 0.5], radius: 0.84, slip: [-0.03, -0.04, 0.03], line: 13, ink: TIERS[5], spin: -0.06, weight: 0.6 },
  { normal: [-0.7, 0.5, 0.45], radius: 0.92, slip: [0.05, 0.02, -0.02], line: 18, ink: TIERS[6], spin: 0.042, weight: 0.7 },
  { normal: [0.3, -0.9, 0.3], radius: 0.76, slip: [-0.04, 0.05, 0.04], line: 23, ink: TIERS[3], spin: -0.052, weight: 0.55 },
];

/** two perpendicular directions inside the plane whose normal is n */
const basisOf = (n: [number, number, number]): [number[], number[]] => {
  const length = Math.hypot(n[0], n[1], n[2]) || 1;
  const axis = [n[0] / length, n[1] / length, n[2] / length];
  const seed = Math.abs(axis[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
  const cross = (a: number[], b: number[]) => [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
  const unit = (v: number[]) => {
    const l = Math.hypot(v[0], v[1], v[2]) || 1;
    return [v[0] / l, v[1] / l, v[2] / l];
  };
  const u = unit(cross(axis, seed));
  return [u, unit(cross(axis, u))];
};

const BASES = ORBITS.map((o) => basisOf(o.normal));

/**
 * The whole ball is seen from a little above and to the left, so no ring is a
 * perfect circle and none of them is a perfect line: the tilt is what stops six
 * orbits reading as a diagram of a gyroscope.
 */
const TILT = { x: 0.12, y: -0.07 };

/** one small patch of hairlines, the line screen the reference shades with */
const FANS = [{ from: 2.5, turn: -0.7, count: 12, spread: 0.038, r0: 0.52, r1: 0.82 }];

/**
 * The song, orbiting.
 *
 * Six rings of writing, each in its own plane, turning at its own speed around
 * one lump of ink. Because the rings really are three-dimensional, they cross
 * each other twice a turn, and the writing passes behind the mass and back out
 * in front of it: the depth is not painted on, it is the order the characters
 * are drawn in and how big they come out.
 *
 * The curves are never drawn. A ring exists only as the characters standing on
 * it, placed at an even step in space so the projection alone decides how they
 * bunch up going round the side and spread out coming to the front — which is
 * the whole of the effect. Nothing here says what the rings are for.
 */
export const SamplingSpiral: React.FC<{ w: number; h: number; heat?: number }> = ({
  w,
  h,
  heat = 0.5,
}) => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const cx = w * 0.47;
  const cy = h * 0.5;
  const k = clamp(Math.min(w, h) / 510, 0.6, 1.4);
  const fontSize = 13 * k;

  // the ball, and how flat the view of it is: a long lens keeps the far side
  // from collapsing, which is what lets the back rings stay readable
  const ball = Math.min(w, h) * 0.37;
  const focal = ball * 5.2;
  const breath = 1 + 0.02 * Math.sin(t * 0.17);

  /** a point on a ring, in space and then on the screen */
  const project = (orbit: Orbit, index: number, a: number) => {
    const [u, v] = BASES[index];
    const r = ball * orbit.radius * breath;
    const raw = [0, 1, 2].map(
      (i) => r * (Math.cos(a) * u[i] + Math.sin(a) * v[i]) + orbit.slip[i] * ball,
    );
    // the ball is turned to face the window from slightly above and to the left
    const cosY = Math.cos(TILT.y);
    const sinY = Math.sin(TILT.y);
    const x1 = raw[0] * cosY + raw[2] * sinY;
    const z1 = -raw[0] * sinY + raw[2] * cosY;
    const cosX = Math.cos(TILT.x);
    const sinX = Math.sin(TILT.x);
    const p = [x1, raw[1] * cosX - z1 * sinX, raw[1] * sinX + z1 * cosX];
    const near = focal / (focal + p[2]);
    return { x: cx + p[0] * near, y: cy + p[1] * near, z: p[2], near };
  };

  /**
   * Every character on every ring, with its depth. Each ring is walked at an
   * even step in space: the projection alone decides how the writing bunches up
   * on the way round the side and opens out as it comes to the front.
   */
  const rings = ORBITS.map((orbit, index) => {
    const r = ball * orbit.radius;
    const count = Math.max(14, Math.round((Math.PI * 2 * r) / (fontSize * 1.45)));
    // the rings walk through the song at their own pace, so the window never
    // reloads all at once
    const lyric = LYRICS[(orbit.line + Math.floor((t + index * 1.9) / 11)) % LYRICS.length].jp;
    const shift = Math.floor(t * (0.5 + index * 0.07));
    return range(count).map((j) => {
      const a = (j / count) * Math.PI * 2 + t * orbit.spin + Math.sin(t * 0.11 + index) * 0.05;
      const p = project(orbit, index, a);
      const q = project(orbit, index, a + 0.05);
      return {
        x: p.x,
        y: p.y,
        z: p.z,
        near: p.near,
        // written along the ring, so the writing turns with it
        angle: (Math.atan2(q.y - p.y, q.x - p.x) * 180) / Math.PI,
        char: lyric[(j + shift) % lyric.length],
        index,
      };
    });
  });

  const every = rings.reduce<typeof rings[number]>((all, ring) => all.concat(ring), []);
  // the far half of every ring goes down first, so the near half crosses over
  // it — and both cross over the ink in the middle, which is where the depth
  // actually comes from
  const behind = every.filter((c) => c.z > 0);
  const ahead = every.filter((c) => c.z <= 0);

  const glyph = (c: (typeof every)[number], key: string) => {
    const orbit = ORBITS[c.index];
    const front = clamp((ball - c.z) / (2 * ball));
    return (
      <span
        key={key}
        style={{
          position: "absolute",
          left: c.x,
          top: c.y,
          fontFamily: FONT.jp,
          fontSize: fontSize * c.near * (0.86 + 0.3 * orbit.weight),
          lineHeight: 1,
          color: mix(orbit.ink[0], orbit.ink[1], front),
          opacity:
            (0.3 + 0.68 * front) *
            (0.66 + 0.34 * orbit.weight) *
            (0.8 + heat * 0.2),
          transform: `translate(-50%, -50%) rotate(${c.angle}deg)`,
        }}
      >
        {c.char}
      </span>
    );
  };

  /**
   * The drops. Most of them are packed into the nucleus, where they pile up
   * until they read as one lump of ink; the rest are thrown further out, small
   * and sharp, sitting in the gaps the strands leave.
   */
  const drops = React.useMemo(() => {
    const rnd = mulberry32(9137);
    const pick = (from: string[]) => from[Math.floor(rnd() * from.length)];
    return range(44).map((_, i) => {
      const core = i < 32;
      const angle = rnd() * Math.PI * 2;
      const r = core
        ? ball * (0.04 + 0.52 * Math.pow(rnd(), 1.9))
        : ball * (0.78 + 0.9 * rnd());
      return {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        rad: (core ? 5 + 16 * rnd() : 2 + 7 * rnd()) * k,
        ink: pick(core && rnd() > 0.28 ? DROP_INK.slice(0, 5) : DROP_INK),
        phase: rnd() * Math.PI * 2,
        rate: 0.35 + rnd() * 0.9,
        alpha: core ? 0.5 + 0.42 * rnd() : 0.72 + 0.25 * rnd(),
      };
    });
  }, [cx, cy, ball, k]);

  /**
   * And the ghosts: a few big, almost invisible discs drifting outside the
   * ink, which is what gives the reference its depth behind the drawing.
   */
  const ghosts = React.useMemo(() => {
    const rnd = mulberry32(2270);
    return range(7).map(() => {
      const angle = rnd() * Math.PI * 2;
      const r = ball * (0.9 + 1.25 * rnd());
      return {
        x: cx + Math.cos(angle) * r,
        y: cy + Math.sin(angle) * r,
        rad: (24 + 54 * rnd()) * k,
        ink: DROP_INK[3 + Math.floor(rnd() * 4)],
        phase: rnd() * Math.PI * 2,
      };
    });
  }, [cx, cy, ball, k]);

  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        {ghosts.map((g, i) => (
          <circle
            key={i}
            cx={cx + (g.x - cx) * (1 + 0.02 * Math.sin(t * 0.17 + g.phase))}
            cy={cy + (g.y - cy) * (1 + 0.02 * Math.sin(t * 0.17 + g.phase))}
            r={g.rad}
            fill={g.ink}
            opacity={0.07 + 0.05 * Math.sin(t * 0.21 + g.phase)}
          />
        ))}
      </svg>
      {behind.map((c, i) => glyph(c, `b${i}`))}
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        {drops.map((d, i) => {
          const breathe = 1 + 0.025 * Math.sin(t * 0.23 + d.phase);
          const pulse = 1 + Math.sin(t * 0.7 * d.rate + d.phase) * (0.05 + heat * 0.09);
          return (
            <circle
              key={i}
              cx={cx + (d.x - cx) * breathe}
              cy={cy + (d.y - cy) * breathe}
              r={d.rad * pulse}
              fill={d.ink}
              opacity={d.alpha}
            />
          );
        })}
      </svg>
      {ahead.map((c, i) => glyph(c, `a${i}`))}
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        {FANS.map((fan, fi) =>
          range(fan.count).map((j) => {
            const lean = (j - fan.count / 2) * fan.spread;
            const spin = t * 0.02;
            const d = range(24)
              .map((n, i) => {
                const u = fan.r0 + (n / 23) * (fan.r1 - fan.r0);
                const angle = fan.from + lean + fan.turn * (1 - Math.pow(1 - u, 2)) + spin;
                const r = ball * u;
                const x = cx + Math.cos(angle) * r;
                const y = cy + Math.sin(angle) * r;
                return `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
              })
              .join(" ");
            return (
              <path
                key={`${fi}-${j}`}
                d={d}
                fill="none"
                stroke="#3f8fc4"
                strokeWidth={1.1 * k}
                opacity={0.17}
              />
            );
          }),
        )}
      </svg>
      <div
        style={{
          position: "absolute",
          left: 18,
          bottom: 12,
          fontFamily: FONT.mono,
          fontSize: 12,
          lineHeight: "16px",
          color: INK_DIM,
          letterSpacing: 0.4,
        }}
      >
        {/* not a label: this is what she is doing to herself while she orbits */}
        <div>for (turn of his) keep(this);</div>
        <div>{`fit(self, him) · residual ${(0.06 + heat * 0.06).toFixed(2)} · no exit condition`}</div>
      </div>
    </div>
  );
};

/** a block of numbers that keeps almost agreeing with itself */
const hot_row = (rows: number[]) =>
  range(4).some(
    (r) => range(4).reduce((n, c) => n + rows[r * 4 + c], 0) > 1.12,
  );

export const ResidualMatrix: React.FC<{ w: number; h: number; drift?: number }> = ({
  w,
  h,
  drift = 0.3,
}) => {
  const frame = useCurrentFrame();
  const rand = React.useMemo(() => {
    const r = mulberry32(5150);
    return range(16).map(() => r());
  }, []);
  const cell = Math.min((w - 60) / 4, (h - 90) / 4);
  const rows = range(16).map((i) => {
    const wobble = Math.sin(pace(frame) * 0.03 + i) * drift * 0.06;
    return 0.25 + rand[i] * 0.02 + wobble;
  });
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {range(4).map((r) =>
        range(4).map((c) => {
          const v = rows[r * 4 + c];
          const hot = v > 0.27;
          return (
            <div
              key={`${r}-${c}`}
              style={{
                position: "absolute",
                left: 26 + c * cell,
                top: 22 + r * cell,
                width: cell - 8,
                height: cell - 8,
                background: hot ? "rgba(255,209,102,0.14)" : "rgba(157,194,222,0.1)",
                border: `1px solid ${hot ? "rgba(255,209,102,0.5)" : "rgba(146,186,226,0.28)"}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT.mono,
                fontSize: 19,
                color: hot ? HOT : "#cfe6ff",
              }}
            >
              {v.toFixed(2)}
            </div>
          );
        }),
      )}
      <div
        style={{
          position: "absolute",
          left: 26,
          bottom: 30,
          fontFamily: FONT.mono,
          fontSize: 12,
          color: hot_row(rows) ? HOT : INK_DIM,
          letterSpacing: 0.4,
        }}
      >
        {`row sums ${range(4)
          .map((r) =>
            range(4)
              .reduce((n, c) => n + rows[r * 4 + c], 0)
              .toFixed(2),
          )
          .join("  ")}`}
      </div>
      <div
        style={{
          position: "absolute",
          left: 26,
          bottom: 12,
          fontFamily: FONT.mono,
          fontSize: 12,
          color: INK_DIM,
          letterSpacing: 0.4,
        }}
      >
        self_check · iter {Math.floor(pace(frame) / 8) % 28} / 28 · not converging
      </div>
    </div>
  );
};

/** the conversation, pressed flat: one bar per thing he said */
export const TextBlocks: React.FC<{
  w: number;
  h: number;
  lines: string[];
  density?: number;
}> = ({ w, h, lines, density = 0.6 }) => {
  const frame = useCurrentFrame();
  const rand = React.useMemo(() => {
    const r = mulberry32(4242);
    return range(120).map(() => ({
      len: 0.1 + r() * density,
      off: r() * 0.25,
      row: Math.floor(r() * 9),
      word: r() > 0.82,
    }));
  }, [density]);
  const rowH = (h - 70) / 9;
  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {rand.map((b, i) => {
        const speed = 0.4 + (i % 5) * 0.12;
        const x = ((pace(frame) * speed + i * 37) % (w + 60)) - 30;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: (x + b.off * w) % w,
              top: 20 + b.row * rowH,
              width: b.len * w * 0.4,
              height: rowH * 0.62,
              background: b.word
                ? "rgba(120,200,255,0.34)"
                : "rgba(157,194,222,0.16)",
            }}
          />
        );
      })}
      {lines.slice(0, 3).map((line, i) => (
        <div
          key={line}
          style={{
            position: "absolute",
            left: 20,
            top: 24 + i * 22,
            fontFamily: FONT.mono,
            fontSize: 13,
            color: "rgba(214,240,255,0.8)",
            background: "rgba(3,5,10,0.75)",
            padding: "0 5px",
            whiteSpace: "nowrap",
          }}
        >
          {line}
        </div>
      ))}
      <div
        style={{
          position: "absolute",
          left: 20,
          bottom: 12,
          fontFamily: FONT.mono,
          fontSize: 12,
          color: INK_DIM,
          letterSpacing: 0.4,
        }}
      >
        {`conversation.encode() · ${Math.round(
          19 + density * 22,
        )}.5x · precision 61.9%`}
      </div>
    </div>
  );
};

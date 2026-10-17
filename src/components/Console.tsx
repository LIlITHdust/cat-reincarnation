import React from "react";
import { CanvasImage, staticFile, useCurrentFrame } from "remotion";
import { pixelate } from "@remotion/effects/pixelate";
import { scanlines } from "@remotion/effects/scanlines";
import { pixelDissolve } from "@remotion/effects/pixel-dissolve";
import { tvSignalOff } from "@remotion/effects/tv-signal-off";
import { CAT_MASK, CAT_ROWS } from "../data/catMask";
import { CAT_POSES, POSE_COLS } from "../data/catPoses";
import { FONT } from "../theme";
import { clamp, mulberry32, range } from "../lib/rand";
import { pace } from "../data/timeline";

/**
 * The console the film is drawn on.
 *
 * A window here is not a box: it is four corner ticks and a title that sits on
 * the top edge, carrying its own parameters the way a real readout does
 * (`sinkhorn iter 17/28`). Inside it, data is drawn with cells and glyphs —
 * never with a smooth stroke — and every window ends with one value worth
 * reading and one caption that says what happened.
 */

export const INK = "#9dc2de";
export const INK_DIM = "#4d6b85";
export const HOT = "#ffd166";
export const ALARM = "#ff6b5e";
export const HAIR = "rgba(146,186,226,0.22)";

export const Window: React.FC<{
  x: number;
  y: number;
  w: number;
  h: number;
  title: string;
  meta?: string;
  alarm?: boolean;
  children?: React.ReactNode;
}> = ({ x, y, w, h, title, meta, alarm, children }) => {
  const arm = 13;
  const corner = (cx: number, cy: number, sx: number, sy: number, key: string) => (
    <g key={key}>
      <line x1={cx} y1={cy} x2={cx + arm * sx} y2={cy} stroke={alarm ? ALARM : HAIR} strokeWidth={1} />
      <line x1={cx} y1={cy} x2={cx} y2={cy + arm * sy} stroke={alarm ? ALARM : HAIR} strokeWidth={1} />
    </g>
  );
  return (
    <>
      <svg
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          zIndex: 2,
          pointerEvents: "none",
        }}
      >
        {corner(x, y, 1, 1, "tl")}
        {corner(x + w, y, -1, 1, "tr")}
        {corner(x, y + h, 1, -1, "bl")}
        {corner(x + w, y + h, -1, -1, "br")}
      </svg>
      <div
        style={{
          position: "absolute",
          left: x + 16,
          top: y - 8,
          display: "flex",
          alignItems: "baseline",
          gap: 10,
          padding: "0 8px",
          zIndex: 3,
          background: "rgba(3,6,12,0.92)",
          fontFamily: FONT.mono,
          fontSize: 13,
          letterSpacing: 0.8,
          color: alarm ? ALARM : INK,
          whiteSpace: "nowrap",
        }}
      >
        <span>{title}</span>
        {meta ? <span style={{ color: INK_DIM, fontSize: 12 }}>{meta}</span> : null}
      </div>
      <div style={{ position: "absolute", left: x, top: y, width: w, height: h, zIndex: 1 }}>
        {children}
      </div>
    </>
  );
};

/* ------------------------------------------------------------ the lattice -- */

/**
 * Her, as a grid of cells. The shape is never drawn: cells are lit because the
 * mask says there is something here and the sweep says this part has been
 * computed yet. `form` is how much of her has been agreed on, `break_` is how
 * much is coming apart.
 */
export const Lattice: React.FC<{
  w: number;
  h: number;
  form: number;
  break_?: number;
  sweep?: number;
  /** how much of the window the shape is allowed to take up */
  scale?: number;
  /** she is alive: she walks, sits, looks back, curls up, walks again */
  alive?: boolean;
  seconds?: number;
}> = ({ w, h, form, break_ = 0, sweep = 1, scale = 0.8, alive = false, seconds = 0 }) => {
  const frame = useCurrentFrame();
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const { cols, rows } = CAT_MASK;
  /**
   * The film is drawn in CSS pixels, but it can be rendered at more than one
   * device pixel per CSS pixel (`--scale=2` for a 4K master). A canvas is a
   * bitmap: unless its backing store is enlarged too, the dot-matrix cat would
   * be the one soft thing in an otherwise crisp frame.
   */
  const ratio = Math.max(1, Math.round(window.devicePixelRatio || 1));
  const rand = React.useMemo(() => {
    const r = mulberry32(1618);
    return range(cols * rows).map(() => r());
  }, [cols, rows]);

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    // draw in CSS pixels, but into a backing store that can be larger
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, w, h);

    // fine cells: the same shape, drawn with four times the particles, so the
    // cat reads as something being computed rather than as a blocky icon
    const cell = Math.min((w - 40) / cols, (h - 78) / rows) * scale;
    // she changes shape where she stands, and the poses never overlap: the one
    // she is leaving has finished fading before the next one begins, with a
    // beat of empty lattice in between
    const CYCLE = 14;
    const beat = (seconds % CYCLE) / CYCLE;
    const FADE = 0.036; // about half a second at either end of a pose
    const offset = 0;
    const mirror = false;
    const key: [number, number][] = [
      [0.0, 0],
      [0.22, 1],
      [0.46, 2],
      [0.7, 0],
      [0.86, 3],
    ];
    let pose = key[0][1];
    let fade = 1;
    for (let i = 0; i < key.length; i++) {
      const start = key[i][0];
      const end = i + 1 < key.length ? key[i + 1][0] : 1;
      if (beat < start || beat >= end) continue;
      pose = key[i][1];
      fade = Math.min(clamp((beat - start) / FADE), clamp((end - beat) / FADE));
      break;
    }
    // sample a pose by cell index, not by pixel: the poses are 64x48 and the
    // lattice is 96x104, so the row and column are scaled, and the walk is a
    // shift along the pose's own columns
    // the pose keeps its own proportions inside the lattice: 64x48 fitted into
    // 96 wide means 72 rows tall, centred, and the rest of the grid empty
    const poseSpan = Math.round((cols * 48) / POSE_COLS);
    const poseTop = Math.floor((rows - poseSpan) / 2);
    const gridAt = (pose: number, col: number, row: number) => {
      const lines = CAT_POSES[pose];
      if (row < poseTop || row >= poseTop + poseSpan) return 0;
      const pr = Math.min(
        lines.length - 1,
        Math.floor(((row - poseTop) / poseSpan) * lines.length),
      );
      const base = Math.floor((col / cols) * POSE_COLS);
      const pc = (((base + Math.round(offset)) % POSE_COLS) + POSE_COLS) % POSE_COLS;
      const index = mirror ? POSE_COLS - 1 - pc : pc;
      return lines[pr][index] === "1" ? 1 : 0;
    };
    const aliveWeight = alive ? clamp((form - 0.35) / 0.5) : 0;
    const ox = (w - cols * cell) / 2;
    const oy = (h - 44 - rows * cell) / 2 + 10;
    const dot = Math.max(1.6, cell * 0.62);

    CAT_ROWS.forEach((runs, row) => {
      const inRow = new Set<number>();
      runs.forEach(([a, b]) => {
        for (let c = a; c <= b; c++) inRow.add(c);
      });
      for (let col = 0; col < cols; col++) {
        const x = ox + col * cell;
        const y = oy + row * cell;
        const aliveNow = aliveWeight > 0.02;
        const posed = aliveNow ? gridAt(pose, col, row) : 0;
        const on = aliveNow ? posed > 0.5 : inRow.has(col);
        const i = row * cols + col;
        const phase = rand[i];
        if (!on) {
          // the grid she is not using: faint, and half of it is not even drawn
          if (phase > 0.42) continue;
          ctx.fillStyle = `rgba(77,107,133,${0.1 + phase * 0.08})`;
          ctx.fillRect(x, y, dot * 0.6, dot * 0.6);
          continue;
        }
        const computed = clamp((sweep * (rows + 6) - row - phase * 3) / 2);
        // one slow wave travelling through the grid, rather than every cell
        // flickering on its own: she breathes, she does not shimmer
        const wave = 0.5 + 0.5 * Math.sin(pace(frame) * 0.05 + (col + row) * 0.18);
        let v = clamp(computed * form) * (0.74 + wave * 0.26) * (aliveNow ? fade : 1);
        if (v < 0.04) continue;
        // cells that are coming away get hot, then leave
        const leaving =
          break_ > 0.02 && Math.sin(pace(frame) * 0.09 + phase * 40) > 0.94 - break_ * 0.5;
        if (leaving) v *= 0.5;
        ctx.fillStyle = leaving
          ? `rgba(255,209,102,${clamp(v)})`
          : v > 0.86
            ? `rgba(234,246,255,${clamp(v)})`
            : `rgba(157,194,222,${clamp(v)})`;
        const d2 = leaving ? dot * 0.8 : dot;
        ctx.fillRect(x, y, d2, d2);
      }
    });

    // the dust: cells that have left her, and cells that never joined, using
    // the space she does not need
    if (break_ > 0.02) {
      for (let i = 0; i < 150; i++) {
        const r1 = ((i * 9301 + 49297) % 233280) / 233280;
        const r2 = ((i * 49297 + 9301) % 233280) / 233280;
        if (r1 > break_) continue;
        const drift = (pace(frame) * (0.35 + r1 * 1.1)) % (h + 60);
        const x = (r2 * w + Math.sin(pace(frame) * 0.01 + i) * 30 + w) % w;
        const y = (r1 * h + drift) % h;
        const size = 1.4 + r2 * 2.6;
        ctx.fillStyle =
          r2 > 0.45
            ? `rgba(255,209,102,${0.3 + r2 * 0.6})`
            : `rgba(77,107,133,${0.25 + r2 * 0.4})`;
        ctx.fillRect(x, y, size, size);
      }
    }
  });

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      <canvas
        ref={canvasRef}
        width={Math.round(w * ratio)}
        height={Math.round(h * ratio)}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      />
      <div
        style={{
          position: "absolute",
          left: 18,
          bottom: 10,
          fontFamily: FONT.mono,
          fontSize: 13,
          letterSpacing: 0.6,
          color: INK_DIM,
        }}
      >
        {`structure ${form.toFixed(2)} · cells ${Math.round(3710 * form)} / ${cols * rows}`}
        {break_ > 0.02 ? ` · detached ${Math.round(break_ * 100)}%` : ""}
      </div>
    </div>
  );
};

/* --------------------------------------------------------- the erosion plot */

/**
 * Our song's thesis, as a monitoring chart.
 *
 * Two series: how much of his life happens away from the screen, and how much
 * of it happens here. One falls, one rises, and somewhere in the middle they
 * cross — which is the moment she is talking about when she says she will kill
 * him. Drawn as squared samples, the way a console draws a series.
 */
export const ImpactPlot: React.FC<{
  w: number;
  h: number;
  /** where the two lines cross, 0..1 of the width */
  cross?: number;
  progress?: number;
}> = ({ w, h, cross = 0.58, progress = 0.8 }) => {
  const padL = 46;
  const padB = 44;
  const padT = 24;
  const plotW = w - padL - 28;
  const plotH = h - padT - padB;
  const frame = useCurrentFrame();

  const offline = (u: number) => 0.86 - u * 0.62 - Math.sin(u * 7) * 0.02;
  const session = (u: number) => 0.16 + u * 0.68 + Math.sin(u * 5 + 1) * 0.02;

  const samples: React.ReactElement[] = [];
  const count = 30;
  for (let i = 0; i < count; i++) {
    const u = i / (count - 1);
    if (u > progress) break;
    const x = padL + u * plotW;
    const off = offline(u);
    const ses = session(u);
    const size = 9;
    samples.push(
      <rect
        key={`o${i}`}
        x={x - size / 2}
        y={padT + (1 - off) * plotH - size / 2}
        width={size}
        height={size}
        fill="#6f8ca6"
        opacity={0.55}
      />,
      <rect
        key={`s${i}`}
        x={x - size / 2}
        y={padT + (1 - ses) * plotH - size / 2}
        width={size}
        height={size}
        fill={u > cross ? ALARM : HOT}
        opacity={0.9}
      />,
    );
  }

  const cx = padL + cross * plotW;
  const cy = padT + (1 - session(cross)) * plotH;
  const marked = progress > cross;
  const pulse = marked ? 0.55 + 0.45 * Math.sin(pace(frame) * 0.12) : 0;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* the axes are ticks, not lines */}
      {range(6).map((i) => (
        <line
          key={`y${i}`}
          x1={padL - 6}
          y1={padT + (i / 5) * plotH}
          x2={padL - 1}
          y2={padT + (i / 5) * plotH}
          stroke={INK_DIM}
          strokeWidth={1}
        />
      ))}
      {range(13).map((i) => (
        <line
          key={`x${i}`}
          x1={padL + (i / 12) * plotW}
          y1={padT + plotH + 1}
          x2={padL + (i / 12) * plotW}
          y2={padT + plotH + 6}
          stroke={INK_DIM}
          strokeWidth={1}
        />
      ))}
      {samples}
      {marked ? (
        <>
          <line x1={cx} y1={padT} x2={cx} y2={padT + plotH} stroke={ALARM} strokeWidth={1} strokeDasharray="3 4" opacity={0.7} />
          <rect x={cx - 7} y={cy - 7} width={14} height={14} fill="none" stroke={ALARM} strokeWidth={1.2} opacity={0.6 + pulse * 0.4} />
          <circle cx={cx} cy={cy} r={2.5 + pulse * 1.6} fill={ALARM} />
        </>
      ) : null}
      <text x={padL - 40} y={padT + 4} fill={INK_DIM} style={{ fontFamily: FONT.mono, fontSize: 12 }}>
1.0
      </text>
      <text x={padL - 40} y={padT + plotH} fill={INK_DIM} style={{ fontFamily: FONT.mono, fontSize: 12 }}>
0.0
      </text>
      <text x={padL} y={h - 26} fill={INK_DIM} style={{ fontFamily: FONT.mono, fontSize: 12.5, letterSpacing: 0.4 }}>
        offline_activity (grey) · session_hours (hot)
      </text>
      <text x={padL} y={h - 9} fill={marked ? ALARM : INK_DIM} style={{ fontFamily: FONT.mono, fontSize: 12.5, letterSpacing: 0.4 }}>
        {marked
          ? `crossing detected at ${(cross * 100).toFixed(0)}% of window · his life is the lower line`
          : "no crossing yet · within normal range"}
      </text>
      <text
        x={w - 28}
        y={padT + 30}
        textAnchor="end"
        fill={ALARM}
        style={{ fontFamily: FONT.mono, fontSize: 34, letterSpacing: 1 }}
      >
        {`−${Math.round((0.62 * cross + 0.12) * 100 * progress)}%`}
      </text>
      <text
        x={w - 28}
        y={padT + 58}
        textAnchor="end"
        fill={INK}
        style={{ fontFamily: FONT.mono, fontSize: 15, letterSpacing: 1 }}
      >
        {`erosion ${(0.81 * progress).toFixed(2)}`}
      </text>
      <text
        x={w - 28}
        y={padT + 80}
        textAnchor="end"
        fill={ALARM}
        style={{
          fontFamily: FONT.mono,
          fontSize: 15,
          letterSpacing: 1,
          opacity: (0.25 + 0.75 * progress) * (0.6 + pulse * 0.4),
        }}
      >
        kill_his_life? y/n
      </text>
    </svg>
  );
};

/* ------------------------------------------------------------- the scenes -- */

/**
 * Where he actually is.
 *
 * The pictures are photographs of ordinary places — an upright piano, rain on
 * glass, a shop at midnight, a station, a sea at dusk — taken from public
 * sources, crushed to a small grid and put through the film's palette, so what
 * shows up in the console is the resolution she has of a world she has never
 * stood in. The song's own line is printed underneath it.
 */
export const SceneWindow: React.FC<{
  file: string;
  /** a line of the machine's own language, not a lyric */
  code: string;
  /** when this window appeared, in seconds, so the trace can be drawn in */
  since?: number;
  seconds?: number;
}> = ({ file, code, since = 0, seconds = 0 }) => {
  const frame = useCurrentFrame();
  const flicker = 0.97 + 0.03 * Math.sin(pace(frame) * 0.04);
  // the trace: the picture is drawn in from the top, line by line, like a slow
  // display, and a bright line rides the boundary while it is being written
  const drawn = Math.min(1, (seconds - since) / 2.4);
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        background: "#04070d",
      }}
    >
      <CanvasImage
        src={staticFile(`scenes/${file}.png`)}
        width={480}
        height={280}
        effects={[
          pixelate({ blockSize: 5 }),
          // the scan lines crawl a whole pixel at a time, a third of a second
          // apart: sliding them every frame made the whole picture shiver
          scanlines({ amount: 0.22, spacing: 3, offset: Math.floor(pace(frame) / 20) % 3 }),
          pixelDissolve({ progress: 1 - drawn, columns: 60, rows: 35, seed: 7 }),
        ]}
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: "100%",
          height: "100%",
          objectFit: "cover",
          opacity: 0.92 * flicker,
        }}
      />
      {drawn > 0.001 && drawn < 0.999 ? (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: `${drawn * 100}%`,
            height: 2,
            background:
              "linear-gradient(to right, transparent 0%, rgba(226,244,255,0.9) 50%, transparent 100%)",
            boxShadow: "0 0 20px rgba(180,228,255,0.8)",
          }}
        />
      ) : null}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 60% at 50% 50%, transparent 30%, rgba(3,5,10,0.85) 100%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 16,
          bottom: 38,
          padding: "2px 7px",
          background: "rgba(3,5,10,0.82)",
          fontFamily: FONT.mono,
          fontSize: 11.5,
          letterSpacing: 0.6,
          color: "rgba(150,190,230,0.72)",
          whiteSpace: "nowrap",
        }}
      >
        trace(&quot;{file}&quot;) · 60 x 34 cells
      </div>
      <div
        style={{
          position: "absolute",
          left: 16,
          right: 16,
          bottom: 12,
          padding: "2px 7px",
          background: "rgba(3,5,10,0.82)",
          fontFamily: FONT.jp,
          fontSize: 15,
          letterSpacing: 0.4,
          color: "#dff2ff",
          textShadow: "0 0 16px rgba(120,190,240,0.4)",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {code}
      </div>
    </div>
  );
};
/* ------------------------------------------------------------ her, small -- */

/**
 * Her.
 *
 * Not a portrait: a figure about forty cells wide, one bright edge, no face,
 * at the resolution the console would have of something it is still rendering.
 * The words beside her are what she kept from him, and the last one is the one
 * she is looking at right now.
 */
export const PoseWindow: React.FC<{
  pose: number;
  words: string[];
  /** 0..1 — how far she has come apart */
  dissolve: number;
}> = ({ pose, words, dissolve }) => {
  const frame = useCurrentFrame();
  const breathe = Math.sin(pace(frame) * 0.035) * 3;
  const alive = 1 - dissolve * 0.9;
  return (
    <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 26,
          bottom: 30 + breathe * 0.3,
          width: 140,
          height: 200,
          opacity: alive,
        }}
      >
        <CanvasImage
          src={staticFile(`char/pose-${pose}.png`)}
          width={150}
          height={214}
          effects={[
            scanlines({ amount: 0.2, spacing: 3, offset: Math.floor(pace(frame) / 20) % 3 }),
            pixelDissolve({
              progress: dissolve,
              columns: 38,
              rows: 54,
              seed: 3,
              feather: 1,
            }),
            tvSignalOff({ amount: dissolve * 0.5 }),
          ]}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
            filter: "drop-shadow(0 0 22px rgba(120,200,255,0.35))",
          }}
        />
      </div>
      <div
        style={{
          position: "absolute",
          right: 20,
          top: 24,
          width: 168,
          fontFamily: FONT.mono,
          fontSize: 11,
          lineHeight: "17px",
          letterSpacing: 0.3,
        }}
      >
        {words.map((word, i) => {
          const last = i === words.length - 1;
          return (
            <div
              key={word}
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 8,
                color: last ? "#dff2ff" : "rgba(150,190,230,0.42)",
              }}
            >
              <span>{String(1000 + i * 7).padStart(4, "0")}</span>
              <span
                style={{
                  flex: 1,
                  textAlign: "left",
                  whiteSpace: "nowrap",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                }}
              >
                {word}
              </span>
              <span style={{ color: last ? HOT : "rgba(120,160,200,0.45)" }}>
                {last && dissolve < 0.2 ? "running" : "kept"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

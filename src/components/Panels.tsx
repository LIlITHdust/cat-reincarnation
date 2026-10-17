import React from "react";
import { useCurrentFrame } from "remotion";
import { FPS } from "../data/timeline";
import { memoryAt, type LogLine, type SystemState } from "../data/session";
import { FONT } from "../theme";
import { LogStream, MemorySpark, WeightField } from "./LogStream";
import { mulberry32, range } from "../lib/rand";

/**
 * The frame is a running application, not a picture with a border around it.
 *
 * Five regions, separated by hairlines, all drawn in the same low-luminance
 * ink: the status strip along the top, the conversation on the left, the main
 * display in the middle (her), the monitor column on the right, and the
 * stdout strip along the bottom. Panel heads carry a title and a path, the way
 * a real window would.
 */

export const LAYOUT = {
  top: 46,
  head: 30,
  bottom: 150,
  // the left column is a whole application window now, and the system column
  // needs room for six fields instead of one number
  left: 600,
  right: 340,
} as const;

export const LINE = "rgba(146,186,226,0.16)";
export const LINE_SOFT = "rgba(146,186,226,0.085)";
export const INK = "#9dc2de";
export const INK_DIM = "#5f819f";
export const INK_FAINT = "#3b5468";

const PANEL_BG =
  "linear-gradient(180deg, rgba(8,14,24,0.95) 0%, rgba(4,7,13,0.93) 100%)";
const HEAD_BG =
  "linear-gradient(180deg, rgba(26,46,70,0.52) 0%, rgba(10,18,30,0.44) 100%)";

export const Panel: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  title: string;
  path?: string;
  meta?: React.ReactNode;
  background?: string;
  children?: React.ReactNode;
}> = ({ x, y, width, height, title, path, meta, background, children }) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width,
      height,
      border: `1px solid ${LINE}`,
      background: background ?? PANEL_BG,
      boxSizing: "border-box",
    }}
  >
    <div
      style={{
        height: LAYOUT.head,
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "0 11px",
        borderBottom: `1px solid ${LINE}`,
        background: HEAD_BG,
        fontFamily: FONT.mono,
        fontSize: 12.5,
        letterSpacing: 0.7,
        color: INK,
      }}
    >
      <span>{title}</span>
      {path ? <span style={{ color: INK_DIM }}>{path}</span> : null}
      <span style={{ flex: 1 }} />
      {meta ? <span style={{ color: INK_DIM }}>{meta}</span> : null}
    </div>
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: LAYOUT.head,
        bottom: 0,
        overflow: "hidden",
      }}
    >
      {children}
    </div>
  </div>
);

/* ------------------------------------------------------------------ left -- */

/**
 * The conversation panel shows the harness itself — see HarnessChat. It lives
 * in its own file because it is a whole application window, not a fragment of
 * this one.
 */
export { HarnessChat as Conversation, type ChatMsg as Line } from "./HarnessChat";

/* ---------------------------------------------------------------- right -- */

/** the standalone style frame's log, kept for as long as that preview exists */
const DEMO_LOGS: LogLine[] = [
  { t: 0.4, text: "attach: form.human" },
  { t: 0.9, text: "warn: divergence", tone: "warn" },
  { t: 1.4, text: "render: ok", tone: "ok" },
  { t: 2.0, text: "mem: 023417" },
];

const DEMO_STATE: SystemState = {
  entity: "少女",
  form: "human",
  confidence: 0.87,
  memory: 23417,
  notes: ["label · 猫", "颜色 · 蓝色", "海 · 未见过", "歌 · cat_reincarnation", "「真可爱呢」"],
  session: "001",
  renderMs: 5.4,
  objects: 1,
  trace: 0.86,
  rollback: 0,
  bond: 0.62,
  coherence: 0.81,
};


const Field: React.FC<{
  name: string;
  value: React.ReactNode;
  bright?: boolean;
  tone?: string;
}> = ({ name, value, bright, tone }) => (
  <div
    style={{
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      fontFamily: FONT.mono,
      fontSize: 12.5,
      lineHeight: "20px",
      color: INK_FAINT,
    }}
  >
    <span style={{ width: 74, letterSpacing: 1.3 }}>{name}</span>
    <span
      style={{
        flex: 1,
        textAlign: "right",
        color: tone ?? (bright ? "#dff2ff" : INK_DIM),
        letterSpacing: 0.6,
        textShadow: bright ? "0 0 14px rgba(150,210,255,0.5)" : "none",
      }}
    >
      {value}
    </span>
  </div>
);

const Bar: React.FC<{ v: number; tone?: string }> = ({ v, tone }) => (
  <div style={{ height: 3, background: "rgba(140,190,235,0.14)", margin: "3px 0 7px" }}>
    <div
      style={{
        width: `${Math.max(0, Math.min(1, v)) * 100}%`,
        height: "100%",
        background:
          tone ??
          "linear-gradient(90deg, rgba(120,200,255,0.5) 0%, rgba(220,242,255,0.95) 100%)",
      }}
    />
  </div>
);

/**
 * The system column: what she is, what she has kept, and what it costs to keep
 * it. Six fields the story actually moves — ENTITY, MEMORY, SESSION, RENDER,
 * TRACE, ROLLBACK — plus the trace graph, which lights a node for every thing
 * of his she has stored and gives them back one by one when she unwinds.
 */
export const Monitor: React.FC<{
  state?: Partial<SystemState>;
  logs?: LogLine[];
  /** 0..1 music level: the machine works harder when the song does */
  energy?: number;
  opacity?: number;
  /** everything has been cleared: the column keeps its frame and nothing else */
  blank?: boolean;
}> = ({ state: patch, logs = DEMO_LOGS, energy = 0.5, opacity = 1, blank = false }) => {
  const frame = useCurrentFrame();
  const seconds = frame / FPS;
  const state = { ...DEMO_STATE, ...patch };

  const nodes = React.useMemo(() => {
    const rand = mulberry32(90210);
    return range(12).map(() => ({
      x: 24 + rand() * 262,
      y: 16 + rand() * 74,
      r: 1.6 + rand() * 2.2,
    }));
  }, []);
  const edges: [number, number][] = [
    [0, 1], [1, 2], [2, 3], [1, 4], [4, 5], [5, 6], [4, 7],
    [7, 8], [2, 5], [8, 9], [7, 10], [10, 11], [3, 11],
  ];

  const lit = state.trace * nodes.length;
  const memoryMax = 23417;
  const spark = React.useMemo(() => {
    const out: number[] = [];
    for (let i = 0; i < 40; i++) {
      const t = Math.max(0, seconds - (39 - i) * 1.4);
      out.push(memoryAt(t));
    }
    return out;
  }, [seconds]);

  // once she has been cleared away there is nothing left to measure: no trace,
  // no weights field, no memory line, no stream
  if (blank) return <div style={{ position: "absolute", inset: 0 }} />;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        padding: "11px 12px",
        overflow: "hidden",
        opacity,
      }}
    >
      <Field name="ENTITY" value={state.entity} bright />
      <Field name="FORM" value={state.form} />
      <Field name="CONF" value={state.confidence.toFixed(2)} />
      <Bar v={state.confidence} />

      <div style={{ borderTop: `1px solid ${LINE_SOFT}`, margin: "3px 0 7px" }} />
      <Field
        name="MEMORY"
        value={`${Math.round(state.memory).toString().padStart(6, "0")} / ${memoryMax}`}
      />
      <Bar v={state.memory / memoryMax} />
      {state.notes.slice(-2).map((note, i, all) => (
        <div
          key={note}
          style={{
            fontFamily: FONT.mono,
            fontSize: 10.5,
            lineHeight: "16px",
            letterSpacing: 0.3,
            color:
              i === all.length - 1 ? "rgba(190,222,248,0.86)" : "rgba(150,190,230,0.42)",
          }}
        >
          {i === all.length - 1 ? "▸ " : "  "}
          {note}
        </div>
      ))}

      <div style={{ borderTop: `1px solid ${LINE_SOFT}`, margin: "7px 0 7px" }} />
      <Field name="SESSION" value={`${state.session} · live`} />
      <Field
        name="RENDER"
        value={`${state.renderMs.toFixed(1)}ms · ${FPS}fps · ${state.objects} obj`}
      />
      <Field
        name="ROLLBACK"
        value={
          state.rollback <= 0.001
            ? "idle"
            : state.rollback >= 0.999
              ? "complete"
              : `${Math.round(state.rollback * 100)}%`
        }
        tone={state.rollback > 0.001 ? "rgba(255,198,138,0.85)" : undefined}
      />
      <Bar
        v={state.rollback}
        tone="linear-gradient(90deg, rgba(255,168,120,0.5) 0%, rgba(255,214,170,0.95) 100%)"
      />

      {state.readouts?.length ? (
        <div style={{ marginTop: 2 }}>
          {state.readouts.map((line) => (
            <div
              key={line.text}
              style={{
                fontFamily: FONT.mono,
                fontSize: 11,
                lineHeight: "17px",
                letterSpacing: 0.5,
                color:
                  line.tone === "warn"
                    ? "rgba(255,198,138,0.9)"
                    : line.tone === "kill"
                      ? "rgba(255,132,122,0.92)"
                      : "rgba(190,222,248,0.9)",
              }}
            >
              {line.text}
            </div>
          ))}
        </div>
      ) : null}

      {/* the trace graph: one node per thing she kept, and they go out one by one */}
      <div style={{ borderTop: `1px solid ${LINE_SOFT}`, margin: "7px 0 5px" }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: FONT.mono,
          fontSize: 10.5,
          letterSpacing: 1.1,
          color: INK_FAINT,
        }}
      >
        <span>trace · {state.notes.length} kept</span>
        <span>bond {state.bond.toFixed(2)}</span>
      </div>
      <svg width={314} height={100} viewBox="0 0 314 100" style={{ marginTop: 2 }}>
        {edges.map(([a, b], i) => {
          const alive = (a < lit ? 1 : 0) * (b < lit ? 1 : 0);
          return (
            <line
              key={i}
              x1={nodes[a].x}
              y1={nodes[a].y}
              x2={nodes[b].x}
              y2={nodes[b].y}
              stroke="rgba(140,190,235,0.34)"
              strokeWidth={0.9}
              opacity={0.1 + alive * 0.75}
            />
          );
        })}
        {nodes.map((node, i) => {
          const on = i < lit;
          return (
            <circle
              key={i}
              cx={node.x}
              cy={node.y}
              r={node.r + (on ? 0.8 : 0)}
              fill={on ? "#dff2ff" : "rgba(160,205,245,0.34)"}
              opacity={on ? 0.95 : 0.45}
            />
          );
        })}
      </svg>

      <div style={{ borderTop: `1px solid ${LINE_SOFT}`, margin: "5px 0 4px" }} />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: 1.1,
          color: INK_FAINT,
          marginBottom: 3,
        }}
      >
        <span>weights · 130</span>
        <span>{(0.3 + energy).toFixed(2)} act</span>
      </div>
      <WeightField activity={energy + state.coherence * 0.3} />

      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: FONT.mono,
          fontSize: 10,
          letterSpacing: 1.1,
          color: INK_FAINT,
          margin: "6px 0 1px",
        }}
      >
        <span>memory · last 56s</span>
        <span>peak {Math.round(memoryMax / 1000)}K</span>
      </div>
      <MemorySpark values={spark} max={memoryMax} height={30} />

      <div style={{ borderTop: `1px solid ${LINE_SOFT}`, margin: "6px 0 0" }} />
      <LogStream
        events={logs}
        energy={energy}
        instability={state.rollback}
        height={286}
      />
    </div>
  );
};

/* ------------------------------------------------------- stage ornaments -- */

/** Corner brackets and a label, the way a vision system boxes a found object. */
export const Recognition: React.FC<{
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  opacity?: number;
  /** which corner the label hangs off; the far one from her head reads best */
  anchor?: "start" | "end";
}> = ({ x, y, width, height, label, opacity = 1, anchor = "start" }) => {
  const arm = 22;
  const corner = (cx: number, cy: number, sx: number, sy: number) => (
    <g>
      <line x1={cx} y1={cy} x2={cx + arm * sx} y2={cy} stroke="rgba(206,236,255,0.75)" strokeWidth={1.2} />
      <line x1={cx} y1={cy} x2={cx} y2={cy + arm * sy} stroke="rgba(206,236,255,0.75)" strokeWidth={1.2} />
    </g>
  );
  return (
    <svg
      style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", opacity }}
    >
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill="none"
        stroke="rgba(170,215,250,0.34)"
        strokeWidth={1}
        strokeDasharray="5 7"
      />
      {corner(x, y, 1, 1)}
      {corner(x + width, y, -1, 1)}
      {corner(x, y + height, 1, -1)}
      {corner(x + width, y + height, -1, -1)}
      <text
        x={anchor === "end" ? x + width - 9 : x + 9}
        y={y + 17}
        textAnchor={anchor === "end" ? "end" : "start"}
        fill="rgba(190,226,255,0.8)"
        style={{ fontFamily: FONT.mono, fontSize: 11.5, letterSpacing: 1.2 }}
      >
        {label}
      </text>
    </svg>
  );
};

/** A thin leader line from something on her to a label in the margin. */
export const Link: React.FC<{
  from: [number, number];
  to: [number, number];
  label: string;
  opacity?: number;
}> = ({ from, to, label, opacity = 1 }) => {
  return (
    <svg
      style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", opacity }}
    >
      <polyline
        points={`${from[0]},${from[1]} ${from[0] + (to[0] - from[0]) * 0.6},${to[1]} ${to[0]},${to[1]}`}
        fill="none"
        stroke="rgba(150,200,240,0.32)"
        strokeWidth={0.9}
      />
      <circle cx={from[0]} cy={from[1]} r={2.1} fill="rgba(210,238,255,0.85)" />
      <text
        x={to[0] + (to[0] > from[0] ? 7 : -7)}
        y={to[1] - 5}
        textAnchor={to[0] > from[0] ? "start" : "end"}
        fill="rgba(160,200,235,0.72)"
        style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: 0.8 }}
      >
        {label}
      </text>
    </svg>
  );
};

/** A ruler along one edge, so the main panel reads as a measured viewport. */
export const Ticks: React.FC<{
  x: number;
  y: number;
  length: number;
  step?: number;
  vertical?: boolean;
  opacity?: number;
}> = ({ x, y, length, step = 46, vertical = false, opacity = 0.8 }) => (
  <svg style={{ position: "absolute", left: 0, top: 0, width: "100%", height: "100%", opacity }}>
    {range(Math.floor(length / step) + 1).map((i) => {
      const long = i % 4 === 0;
      const d = long ? 9 : 5;
      return vertical ? (
        <line
          key={i}
          x1={x}
          y1={y + i * step}
          x2={x + d}
          y2={y + i * step}
          stroke="rgba(140,185,225,0.45)"
          strokeWidth={0.8}
        />
      ) : (
        <line
          key={i}
          x1={x + i * step}
          y1={y}
          x2={x + i * step}
          y2={y + d}
          stroke="rgba(140,185,225,0.45)"
          strokeWidth={0.8}
        />
      );
    })}
  </svg>
);

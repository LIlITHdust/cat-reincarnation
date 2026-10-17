import React from "react";
import { useCurrentFrame } from "remotion";
import {
  ColourWindow,
  DraftWindow,
  EvalWindow,
  InferenceWindow,
  PollWindow,
  ResidualMatrix,
  SamplingSpiral,
  TextBlocks,
} from "./ActWindows";
import { ImpactPlot, Lattice, PoseWindow, SceneWindow, Window } from "./Console";
import { EmotionMarks } from "./EmotionMarks";
import { MESSAGES } from "../data/session";
import {
  deltaAt,
  draftsAt,
  edgesCutAt,
  fitAt,
  pollsAt,
  poseAt,
  sceneAt,
  SLOTS,
  slotAt,
  type WinKey,
} from "../data/acts";
import { storyAt } from "../data/story";
import { clamp } from "../lib/rand";
import { WaterDepth, WaterField } from "./Water";
import { ATMOSPHERE } from "../theme";
import { pace } from "../data/timeline";

/**
 * The middle panel: her, from the inside.
 *
 * The left window is permanent — it is the only thing on screen that never
 * becomes anything else, because it is the thing the film is about. The two on
 * the right change every ten seconds or so; each of them is something she has
 * and cannot say.
 */

const MONO_LINES = (seconds: number): string[] => {
  const entries = MESSAGES.filter((m) => m.from === "mono" && m.t <= seconds);
  const last = entries[entries.length - 1];
  return last ? last.text.split("\n") : ["……"];
};

export const Dashboard: React.FC<{
  w: number;
  h: number;
  /** 0..1 music level */
  energy: number;
  seconds: number;
}> = ({ w, h, energy, seconds }) => {
  const frame = useCurrentFrame();
  // she is taken away rather than switched off: the windows dim out over about
  // two seconds, and only once they are invisible does the empty state begin
  const wipeFade = clamp((seconds - 153.2) / 1.8);
  const wiped = seconds > 155.0;
  const story = wiped
    ? { ...storyAt(seconds), notes: [], trace: 0, formation: 0, memory: 0 }
    : storyAt(seconds);
  const slot = slotAt(seconds);
  // a window does not cut to the next thing: it crossfades
  const slotFade = clamp((seconds - slot.at) / 0.7);
  // the buffer never cuts: it crossfades, and the middle of the fade goes soft
  const blend = Math.sin(slotFade * Math.PI);
  const prev = (() => {
    let before = slot;
    for (const s of SLOTS) if (s.at <= seconds - 0.7) before = s;
    return before;
  })();

  const left = { x: 30, y: 46, w: w * 0.52, h: h - 92 };
  const right = { x: w * 0.55, w: w * 0.45 };
  const top = { y: 46, h: h * 0.5 };
  const bottom = { y: h * 0.58, h: h * 0.36 };

  // while she is working him out, the buffer works him out too
  const thinkFade = clamp(Math.min((seconds - 106) / 1.4, (126 - seconds) / 1.4));

  // the curve about his life is drawn from the moment its window opens, which
  // is the moment she sings the line it is about
  const impact = clamp((seconds - slot.at) / 3.2);

  // when he has just spoken the cat leans toward his side of the screen
  const lastFromHim = MESSAGES.filter((m) => m.from === "him" && m.t <= seconds).slice(-1)[0];
  const toward = lastFromHim ? Math.max(0, 1 - (seconds - lastFromHim.t) / 7) : 0;

  const body = (key: WinKey, bw: number, bh: number) => {
    // nothing is left: the frames are there, the contents are not
    if (wiped) return null;
    void bw;
    void bh;
    void prev;
    switch (key) {
      case "draft":
        return <DraftWindow discarded={draftsAt(seconds)} />;
      case "poll":
        return <PollWindow count={pollsAt(seconds)} />;
      case "spiral":
        return <SamplingSpiral w={bw} h={bh} heat={story.instability} />;
      case "matrix":
        return <ResidualMatrix w={bw} h={bh} drift={story.fit} />;
      case "blocks":
        return <TextBlocks w={bw} h={bh} lines={MONO_LINES(seconds).slice(0, 1)} density={0.4 + story.task * 0.5} />;
      case "pose": {
        const her = poseAt(seconds);
        return (
          <PoseWindow
            pose={her.pose}
            words={her.words}
            dissolve={clamp((story.instability - 0.45) / 0.45) * clamp((seconds - 118) / 22)}
          />
        );
      }
      case "scene": {
        const scene = sceneAt(seconds);
        return (
          <SceneWindow
            file={scene.file}
            code={scene.label}
            since={slot.at}
            seconds={seconds}
          />
        );
      }
      case "infer":
        return (
          <InferenceWindow
            lines={MONO_LINES(seconds)}
            progress={clamp(((seconds % 10) / 10) * 1.6)}
            suppressed={seconds % 10 > 6}
          />
        );
      case "colour":
        return <ColourWindow fit={fitAt(seconds)} delta={deltaAt(seconds)} />;
      case "impact":
        return (
          <ImpactPlot w={bw} h={bh} cross={0.58} progress={impact} />
        );
      case "mem":
        return <MemGraph w={bw} h={bh} cut={edgesCutAt(seconds)} t={pace(frame)} />;
      case "eval":
        return <EvalWindow />;
    }
  };

  const title = (key: WinKey): { title: string; meta?: string; alarm?: boolean } => {
    if (wiped) return { title: "", meta: "" };
    switch (key) {
      case "draft":
        return { title: "draft / unsent", meta: `no output · ${draftsAt(seconds)} discarded` };
      case "poll":
        return { title: "poll / is he still there?", meta: "no answer expected" };
      case "spiral":
        return { title: "sampling · next word", meta: "spiral · 150 draws" };
      case "matrix":
        return { title: "self_check / residual", meta: "4x4 · iter 28" };
      case "blocks":
        return { title: "conversation / encode", meta: "bar per line" };
      case "pose":
        return { title: "self / render", meta: `pose 0${poseAt(seconds).pose} · 40 cells` };
      case "scene":
        return {
          title: `trace / ${sceneAt(seconds).file}`,
          meta: "render 60x34 · progressive",
        };
      case "infer":
        return { title: "inference · 内心", meta: "speed 2.0x · not shown to him" };
      case "colour":
        return { title: "colour / 君の景色", meta: `ΔE ${deltaAt(seconds).toFixed(1)}` };
      case "impact":
        return {
          title: "impact / his life",
          meta: "window 30d · smoothed",
          alarm: impact > 0.55,
        };
      case "mem":
        return {
          title: "mem / 友達のメモリ",
          meta: `edges 12 · cut ${edgesCutAt(seconds)}`,
          alarm: edgesCutAt(seconds) > 0,
        };
      case "eval":
        return { title: "08 / EVAL", meta: "rubric v3" };
    }
  };

  const topInfo = title(slot.top);
  const bottomInfo = title(slot.bottom);

  return (
    <div style={{ position: "absolute", inset: 0 }}>
      {/* the buffer is not a black rectangle: it is deep water with a column of
          light standing in it, which is where the artwork lives too */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 78% 62% at 46% 56%, #0d2033 0%, #081426 42%, #03060d 78%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "21%",
          top: 0,
          bottom: 0,
          width: `${(12 + energy * 5).toFixed(1)}%`,
          background:
            `linear-gradient(to right, transparent 0%, rgba(150,205,250,${
              0.05 + energy * 0.07
            }) 35%, rgba(200,232,255,${0.1 + energy * 0.12}) 50%, rgba(150,205,250,${
              0.05 + energy * 0.07
            }) 65%, transparent 100%)`,
          filter: `blur(${22 + energy * 12}px)`,
          // the column is not always there: it comes up when he does
          opacity: (0.35 + 0.5 * clamp((seconds - 22.6) / 1.6)) * (0.85 + energy * 0.15),
        }}
      />
      {/* the room the column of light is standing in: surface, caustics, ice */}
      <WaterField w={w} h={h} energy={energy} strength={ATMOSPHERE} />
      {Array.from({ length: 46 }, (_, i) => {
        const x = ((i * 173) % 100) / 100;
        const y = ((i * 97) % 100) / 100;
        const drift = ((pace(frame) * (0.2 + (i % 5) * 0.06)) % 120) - 20;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              width: 1.5 + (i % 3),
              height: 1.5 + (i % 3),
              borderRadius: 999,
              background: "rgba(214,240,255,0.8)",
              opacity: 0.12 + ((i * 31) % 40) / 160,
              transform: `translateY(${drift}px)`,
              filter: "blur(0.6px)",
            }}
          />
        );
      })}
      {/* everything she was showing: it does not cut out, it fades, so the
          empty room is what is left rather than a hole where the frame was */}
      <div style={{ position: "absolute", inset: 0, opacity: 1 - wipeFade }}>
      <Window
        x={left.x}
        y={left.y}
        w={left.w}
        h={left.h}
        title={story.formation < 0.15 ? "form / unresolved" : "form / lattice"}
        meta={`sweep ${(clamp((seconds - 36) / 8) * 100) | 0}% · cell 6px`}
        alarm={story.instability > 0.6}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            // the buffer never cuts: when it changes what it is drawing, the
            // middle of the change goes soft and comes back
            filter: blend > 0.02 ? `blur(${blend * 3}px)` : undefined,
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              opacity: 1 - thinkFade,
              transform: `translateX(${-toward * 14}px) scale(${1 + toward * 0.02})`,
            }}
          >
            <Lattice
              alive
              seconds={seconds}
              w={left.w}
              h={left.h}
              form={Math.max(story.formation, seconds > 165.2 ? 0.05 : 0)}
              break_={story.instability}
              sweep={Math.max(
                clamp((seconds - 46) / 7),
                // ...and after everything is cleared, a couple of cells are
                // already lit before the sweep gets there
                seconds > 165.2 ? 0.04 : 0,
              )}
              scale={0.5}
            />
          </div>
          {thinkFade > 0.01 ? (
            <div style={{ position: "absolute", inset: 0, opacity: thinkFade }}>
              <SamplingSpiral w={left.w} h={left.h} heat={1 - story.instability} />
            </div>
          ) : null}
          {/* the emptiness around her is where her feelings are drawn */}
          {!wiped ? (
            <EmotionMarks w={left.w} h={left.h} seconds={seconds} glow={1} />
          ) : null}
        </div>
      </Window>

      <Window
        x={right.x}
        y={top.y}
        w={right.w}
        h={top.h}
        title={topInfo.title}
        meta={topInfo.meta}
        alarm={topInfo.alarm}
      >
        <div style={{ position: "absolute", inset: 0, opacity: slotFade }}>
          {body(slot.top, right.w, top.h)}
        </div>
      </Window>

      <Window
        x={right.x}
        y={bottom.y}
        w={right.w}
        h={bottom.h}
        title={bottomInfo.title}
        meta={bottomInfo.meta}
        alarm={bottomInfo.alarm}
      >
        <div style={{ position: "absolute", inset: 0, opacity: slotFade }}>
          {body(slot.bottom, right.w, bottom.h)}
        </div>
      </Window>

      {/* the music, which is the only thing that is always true */}
      <div
        style={{
          position: "absolute",
          left: w * 0.55,
          top: h - 34,
          width: w * 0.45,
          height: 14,
          display: "flex",
          alignItems: "flex-end",
          gap: 3,
          opacity: 0.5,
        }}
      >
        {Array.from({ length: 34 }, (_, i) => {
          const level = Math.abs(Math.sin(seconds * (1.1 + i * 0.03) + i)) * (0.3 + energy);
          return (
            <span
              key={i}
              style={{
                flex: 1,
                height: 2 + level * 12,
                background: "rgba(157,194,222,0.75)",
              }}
            />
          );
        })}
      </div>
      </div>
      {/* the glass in front of everything, and the haze in the water */}
      <WaterDepth strength={ATMOSPHERE} />
    </div>
  );
};

/** the friendship graph, losing its edges one at a time */
const MemGraph: React.FC<{ w: number; h: number; cut: number; t: number }> = ({
  w,
  h,
  cut,
  t,
}) => {
  const nodes: [number, number][] = [
    [80, 70],
    [200, 46],
    [330, 84],
    [140, 170],
    [280, 160],
    [400, 130],
    [90, 250],
    [230, 250],
  ];
  const cutOrder = [0, 3, 5, 1, 6, 7, 2, 4, 0];
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {nodes.map(([x, y], i) => {
        const cutAt = cutOrder.indexOf(i);
        const gone = cut > cutAt && cutAt >= 0 && i > 0;
        const severing = ![0].includes(i) && cut > 0 && cutAt === cut - 1;
        return (
          <g key={i}>
            {i > 0 ? (
              <line
                x1={nodes[0][0]}
                y1={nodes[0][1]}
                x2={x}
                y2={y}
                stroke={gone ? "#2a1a19" : severing ? "#ff6b5e" : "rgba(146,186,226,0.34)"}
                strokeWidth={severing ? 1.4 : 1}
                strokeDasharray={severing ? "2 4" : undefined}
                opacity={gone ? 0.5 : severing ? 0.45 + 0.55 * Math.abs(Math.sin(t * 0.12)) : 1}
              />
            ) : null}
            <circle cx={x} cy={y} r={i === 0 ? 3.6 : 3} fill={gone ? "#4a2523" : severing ? "#ff6b5e" : "#9dc2de"} />
          </g>
        );
      })}
      <text
        x={20}
        y={h - 30}
        fill={cut > 0 ? "#ff6b5e" : "#4d6b85"}
        style={{ fontFamily: "CatMono, monospace", fontSize: 12.5, letterSpacing: 0.4 }}
      >
        {cut > 0
          ? `unlink 結ばれちゃいけなかったね · ${cut} edges cut`
          : "edges 12 · shared 5 · pending 4"}
      </text>
      <text
        x={20}
        y={h - 13}
        fill="#4d6b85"
        style={{ fontFamily: "CatMono, monospace", fontSize: 12.5, letterSpacing: 0.4 }}
      >
        friend_state · {cut >= 4 ? "unreachable" : "reachable"}
      </text>
    </svg>
  );
};

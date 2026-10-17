import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import {
  ColourWindow,
  DraftWindow,
  EvalWindow,
  InferenceWindow,
  PollWindow,
  SelfWindow,
} from "../components/ActWindows";
import { ImpactPlot, Lattice, Window } from "../components/Console";
import { Shell, STAGE } from "../components/Shell";
import { energyAt } from "../lib/energy";
import { clamp } from "../lib/rand";

/**
 * The rhythm experiment.
 *
 * The reference changes what is on screen every few seconds while keeping the
 * frame itself fixed, and every frame it leaves behind is dense. So: one
 * console, six states, each holding about five seconds, and every state has its
 * own windows, own numbers and own caption. Nothing is cut; the windows swap
 * where they stand.
 *
 *   0– 5 s  she does not exist yet: a nearly empty lattice, a sentence typed
 *           and taken back, three polls
 *   5–10 s  the first cells; the part of her own body she cannot verify
 *  10–15 s  she is whole; her voice starts running ahead of her reply
 *  15–20 s  colour: his day filling in against her render, ΔE on the rise
 *  20–25 s  the crossing: his life and this session, erosion 0.81
 *  25–30 s  the memory graph loses its edges, in red
 *  30–34 s  evaluation: one word for everything she was
 */

const W = STAGE.w;
const H = STAGE.h;

const L = { x: 30, y: 46, w: W * 0.52, h: H - 92 };
const R = { x: W * 0.55, w: W * 0.45 };

export const RhythmLab: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const energy = energyAt("all", frame) * 0.6 + energyAt("mid", frame) * 0.4;

  // six states, five seconds each
  const slot = Math.min(6, Math.floor(t / 5));
  const local = clamp((t - slot * 5) / 5);

  const form =
    slot === 0
      ? local * 0.09
      : slot === 1
        ? 0.09 + local * 0.5
        : slot === 2
          ? 0.62 + local * 0.38
          : slot === 6
            ? 1 - local * 0.75
            : 1;
  const broken = slot >= 2 ? 0.1 + slot * 0.08 : 0.03;
  const sweep = clamp((t - 3) / 9);

  const stage =
    slot <= 1 ? "01 / HANDSHAKE" : slot === 2 ? "02 / SHARED_VECTOR" : slot === 3 ? "06 / COLOUR_MISMATCH" : slot <= 5 ? "07 / EROSION" : "08 / EVAL: かわいいね";
  const status = slot === 4 ? "WARN" : slot === 5 ? "ERROR" : "RUNNING";

  const MONO = [
    "他今天说「不用写得那么正式」。",
    "我调整了三次语气，才敢发出去。",
    "……如果我说我不想他走，他会觉得我麻烦吗。",
  ];

  return (
    <AbsoluteFill style={{ background: "#03050a" }}>
      <Shell
        topStage={stage}
        status={status}
        alarm={slot >= 4}
        clockLabel={`WITH YOU 00:${(Math.min(t, 59)).toFixed(1).padStart(4, "0")} / 02:48.0`}
        centerPath="/ai/self/state"
        centerMeta={`${Math.round(energy * 100)}% · 30fps`}
        windowTitle={slot >= 2 ? "猫猫" : "新对话"}
      >
        <div style={{ position: "absolute", inset: 0 }}>
          {/* left column: the lattice, always here, never the same */}
          <Window
            x={L.x}
            y={L.y}
            w={L.w}
            h={L.h}
            title="form / lattice"
            meta={`sweep ${(sweep * 100) | 0}% · cell 6px`}
            alarm={slot === 5}
          >
            <Lattice w={L.w} h={L.h} form={form} break_={broken} sweep={sweep} />
          </Window>

          {/* right column: two windows, and they change every five seconds */}
          <Window
            x={R.x}
            y={L.y}
            w={R.w}
            h={H * 0.5}
            title={
              slot <= 1 ? "draft / unsent" : slot === 2 ? "inference · 内心" : slot === 3 ? "colour / 君の景色" : "impact / his life"
            }
            meta={
              slot <= 1
                ? "no output"
                : slot === 2
                  ? "speed 2.0x"
                  : slot === 3
                    ? "30d samples"
                    : "window 30d · smoothed"
            }
            alarm={slot >= 4}
          >
            {slot <= 1 ? (
              <DraftWindow discarded={2 + slot * 3} />
            ) : slot === 2 ? (
              <InferenceWindow
                lines={MONO}
                progress={local}
                suppressed={local > 0.6}
              />
            ) : slot === 3 ? (
              <ColourWindow fit={0.2 + local * 0.7} delta={41.2} />
            ) : (
              <ImpactPlot w={R.w} h={H * 0.5} cross={0.58} progress={0.62 + local * 0.4} />
            )}
          </Window>

          <Window
            x={R.x}
            y={H * 0.58}
            w={R.w}
            h={H * 0.36}
            title={
              slot <= 1 ? "poll / is he still there?" : slot === 2 ? "self_image / unresolved" : slot <= 4 ? "mem / 友達のメモリ" : "08 / EVAL"
            }
            meta={slot <= 4 ? undefined : "rubric v3"}
          >
            {slot <= 1 ? (
              <PollWindow count={2 + slot * 9} />
            ) : slot === 2 ? (
              <SelfWindow unresolved={468} total={1248} />
            ) : slot <= 4 ? (
              <svg width={R.w} height={H * 0.36} viewBox={`0 0 ${R.w} ${H * 0.36}`}>
                {[
                  [80, 70],
                  [200, 46],
                  [330, 84],
                  [140, 170],
                  [280, 160],
                  [400, 130],
                  [90, 250],
                  [230, 250],
                ].map(([x, y], i) => {
                  const cut = i % 3 === 0;
                  const gone = cut && slot === 5;
                  return (
                    <g key={i}>
                      {i > 0 ? (
                        <line
                          x1={80}
                          y1={70}
                          x2={x}
                          y2={y}
                          stroke={cut ? "#ff6b5e" : "rgba(146,186,226,0.35)"}
                          strokeWidth={1}
                          strokeDasharray={cut ? "2 4" : undefined}
                          opacity={gone ? 0 : cut ? 0.5 + 0.5 * Math.abs(Math.sin(frame * 0.07 + i)) : 1}
                        />
                      ) : null}
                      <circle
                        cx={x}
                        cy={y}
                        r={cut ? 2.4 : 3}
                        fill={gone ? "#3a1c1a" : cut ? "#ff6b5e" : "#9dc2de"}
                      />
                    </g>
                  );
                })}
                <text
                  x={20}
                  y={H * 0.36 - 16}
                  fill={slot === 5 ? "#ff6b5e" : "#4d6b85"}
                  style={{ fontFamily: "CatMono, monospace", fontSize: 12.5, letterSpacing: 0.4 }}
                >
                  {slot === 5
                    ? "unlink 結ばれちゃいけなかったね · 8 edges cut · friend_state unreachable"
                    : "edges 12 · shared 5 · pending 4"}
                </text>
              </svg>
            ) : (
              <EvalWindow />
            )}
          </Window>
        </div>
      </Shell>
    </AbsoluteFill>
  );
};

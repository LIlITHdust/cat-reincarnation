import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { ImpactPlot, Lattice, Window } from "../components/Console";
import { storyAt } from "../data/story";
import { clamp } from "../lib/rand";
import { Shell, STAGE } from "../components/Shell";
import { energyAt } from "../lib/energy";

/**
 * An experiment: the centre of the film as two instrument windows instead of
 * one creature.
 *
 *   form / lattice      her, as a grid of cells that agree on a shape
 *   impact / his life   the two series that cross, which is the whole song
 *
 * Everything else — the chat, the monitor, the token stream — is the film's
 * existing shell, unchanged, so this frame can be judged against the current
 * look without touching it.
 */

const W = STAGE.w;
const H = STAGE.h;

export const ConsoleLab: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / 30;
  const energy = energyAt("all", frame) * 0.6 + energyAt("mid", frame) * 0.4;
  const story = storyAt(t);

  // the same dramaturgy as the film, so a still taken here is honest
  const progress = clamp(t / 140);
  const form = story.formation;

  return (
    <AbsoluteFill style={{ background: "#03050a" }}>
      <Shell
        topStage={t > 150 ? "08 / EVAL: かわいいね" : t > 120 ? "07 / EROSION" : t > 56 ? "06 / SHARED_VECTOR" : "01 / HANDSHAKE"}
        status={t > 150 ? "RUNNING" : t > 120 ? "ERROR" : t > 95 ? "WARN" : "RUNNING"}
        alarm={t > 95 && t < 152}
        centerPath="/ai/self/impact"
        centerMeta={`${Math.round(energy * 100)}% · 30fps`}
      >
        <div style={{ position: "absolute", inset: 0 }}>
          <Window
            x={30}
            y={40}
            w={W * 0.52}
            h={H - 80}
            title="form / lattice"
            meta={`sweep ${(progress * 100) | 0}% · cell 6px`}
            alarm={false}
          >
            <Lattice
              w={W * 0.52}
              h={H - 80}
              form={form}
              break_={story.instability}
              sweep={clamp((t - 40) / 8)}
            />
          </Window>

          <Window
            x={W * 0.55}
            y={40}
            w={W * 0.45}
            h={H * 0.52}
            title="impact / his life"
            meta="window 30d · smoothed"
            alarm={t > 120}
          >

            <ImpactPlot w={W * 0.45} h={H * 0.52} cross={0.58} progress={progress} />
          </Window>

          <Window
            x={W * 0.55}
            y={H * 0.58}
            w={W * 0.45}
            h={H * 0.36}
            title="mem / 友達のメモリ"
            meta="edges 12 → 4"
          >
            <svg width={W * 0.45} height={H * 0.36} viewBox={`0 0 ${W * 0.45} ${H * 0.36}`}>
              {[
                [70, 60],
                [180, 40],
                [300, 70],
                [120, 150],
                [250, 140],
                [380, 120],
                [80, 230],
              ].map(([x, y], i) => (
                <g key={i}>
                  {i > 0 ? (
                    <line
                      x1={70}
                      y1={60}
                      x2={x}
                      y2={y}
                      stroke={i % 3 === 0 ? "#ff6b5e" : "rgba(146,186,226,0.35)"}
                      strokeWidth={1}
                      strokeDasharray={i % 3 === 0 ? "2 4" : undefined}
                      opacity={i % 3 === 0 ? 0.5 + 0.5 * Math.abs(Math.sin(frame * 0.08 + i)) : 1}
                    />
                  ) : null}
                  <circle cx={x} cy={y} r={3} fill={i % 3 === 0 ? "#ff6b5e" : "#9dc2de"} />
                </g>
              ))}
              <text
                x={20}
                y={H * 0.36 - 14}
                fill="#4d6b85"
                style={{ fontFamily: "CatMono, monospace", fontSize: 12.5, letterSpacing: 0.4 }}
              >
                unlink 結ばれちゃいけなかったね · 8 edges cut · friend_state unreachable
              </text>
            </svg>
          </Window>
        </div>
      </Shell>
    </AbsoluteFill>
  );
};

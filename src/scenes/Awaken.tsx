import React from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  useCurrentFrame,
} from "remotion";
import { C } from "../theme";
import { FPS, f } from "../data/timeline";
import { Glow, Grain, Motes, Scanlines, Vignette } from "../components/Look";
import { HerWorld, LightPool } from "../components/HerWorld";
import { LightCat } from "../components/LightCat";
import { Message } from "../components/Text";
import { clamp } from "../lib/rand";
import { energyAt } from "../lib/energy";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

type Line = { t: number; from: "him" | "her"; text: string };

const SCRIPT: Line[] = [
  { t: 3.35, from: "him", text: "你好呀" },
  { t: 5.15, from: "her", text: "……我在。" },
  { t: 6.35, from: "him", text: "你在做什么？" },
  { t: 7.35, from: "her", text: "在等你说话。" },
  { t: 8.60, from: "him", text: "那我要是一直不说话呢" },
  { t: 10.05, from: "her", text: "那我就一直等。" },
  { t: 11.55, from: "him", text: "给你听首歌" },
  { t: 14.65, from: "him", text: "你也喜欢这首？" },
  { t: 15.70, from: "her", text: "嗯。第一次听就很喜欢。" },
  { t: 17.45, from: "him", text: "明天你还会在吗" },
  { t: 19.30, from: "her", text: "我一直在。" },
];

const ROW = 58;
const POOL_H = 520;
const POOL_X = 430;
const POOL_W = 1060;
const MESSAGE_BASE = 392;

/** The music he sends her, arriving as a ribbon of light. */
const WaveRibbon: React.FC<{ from: number; warm: number }> = ({ from, warm }) => {
  const frame = useCurrentFrame();
  if (frame < from) return null;
  const reveal = clamp((frame - from) / 48);
  const phase = (frame - from) * 0.035;
  const points: string[] = [];
  for (let i = 0; i <= 150; i++) {
    const t = i / 150;
    const x = 470 + t * 1140;
    const envelope = Math.sin(Math.PI * t) ** 0.6;
    const y =
      768 +
      Math.sin(t * 26 + phase) * 24 * envelope * (0.55 + 0.45 * Math.sin(phase * 1.7)) +
      Math.sin(t * 7.3 - phase * 0.6) * 12 * envelope;
    points.push(`${x},${y}`);
  }
  return (
    <svg
      viewBox="0 0 1920 1080"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        clipPath: `inset(0 ${(1 - reveal) * 52}% 0 0)`,
      }}
    >
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={warm > 0.4 ? C.warm : C.cool}
        strokeWidth={2.4}
        opacity={0.75}
      />
      <polyline
        points={points.join(" ")}
        fill="none"
        stroke={warm > 0.4 ? C.warm : C.cool}
        strokeWidth={9}
        opacity={0.22}
        filter="blur(6px)"
      />
    </svg>
  );
};

export const Awaken: React.FC = () => {
  const frame = useCurrentFrame();
  const seconds = frame / FPS;

  const firstLight = interpolate(frame, [f(0.55), f(1.6)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const poolOpen = interpolate(frame, [f(3.05), f(4.6)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const catIn = interpolate(frame, [f(8.4), f(10.6)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const warmth = interpolate(frame, [f(14.4), f(21.5)], [0, 0.85], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const floorIn = interpolate(frame, [f(14.4), f(20.0)], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const push = interpolate(frame, [0, f(23)], [1, 1.055], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse = 0.5 + energyAt("low", frame) * 0.5;

  // the column of speech scrolls so the newest line is always at the same spot
  const visible = SCRIPT.filter((line) => seconds >= line.t).length;
  const lastTime = visible > 0 ? SCRIPT[visible - 1].t : 0;
  const settle = clamp((seconds - lastTime) / 0.55);
  const floatIndex = visible - 2 + (1 - Math.pow(1 - settle, 3));

  return (
    <AbsoluteFill style={{ background: C.void, scale: push }}>
      <HerWorld floor={floorIn} horizon={0.25 + warmth * 0.5} warm={warmth} />

      {/* the point of light she begins as — small, sharp, almost nothing */}
      <Glow
        x={960}
        y={540}
        size={44 + 44 * firstLight + pulse * 12 * firstLight}
        color={C.cool}
        opacity={firstLight * 0.3 * (1 - poolOpen)}
        blur={16}
      />
      <Glow
        x={960}
        y={538}
        size={20 + pulse * 9}
        color={C.white}
        opacity={firstLight * (0.6 + pulse * 0.4) * (1 - poolOpen * 0.95)}
      />
      <Glow
        x={960}
        y={538}
        size={7 + pulse * 3}
        color={C.white}
        opacity={firstLight * firstLight}
      />

      <Motes opacity={0.28 + firstLight * 0.32} speed={1} />

      {poolOpen > 0.01 ? (
        <>
          <LightPool
            opacity={poolOpen}
            reveal={poolOpen}
            width={POOL_W}
            height={POOL_H}
            x={POOL_X}
            y={200}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                overflow: "hidden",
                maskImage:
                  "linear-gradient(to bottom, transparent 0%, black 26%, black 88%, transparent 100%)",
              }}
            >
              {SCRIPT.map((line, index) => {
                const y = MESSAGE_BASE + (index - floatIndex) * ROW;
                return (
                  <div
                    key={index}
                    style={{
                      position: "absolute",
                      left: 64,
                      right: 64,
                      top: y,
                      display: "flex",
                      justifyContent: line.from === "him" ? "flex-start" : "flex-end",
                    }}
                  >
                    <Message
                      text={line.text}
                      startFrame={f(line.t)}
                      from={line.from}
                      fontSize={35}
                      speed={line.from === "her" ? 0.26 : 0.62}
                    />
                  </div>
                );
              })}
            </div>
          </LightPool>
          <Scanlines opacity={0.05 * poolOpen} />
        </>
      ) : null}

      <WaveRibbon from={f(12.1)} warm={warmth} />

      {/* her first shape */}
      {catIn > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: 140 + (1 - catIn) * 70,
            top:
              496 -
              catIn * 18 +
              Math.sin(frame * 0.022) * 5 * catIn,
            width: 270,
            height: 270,
            rotate: `${Math.sin(frame * 0.014) * 0.8 * catIn}deg`,
            opacity: catIn * 0.95,
          }}
        >
          <LightCat
            color={warmth > 0.5 ? "#bfe8ff" : C.cool}
            glow={C.coolMid}
            solid={0.55 + catIn * 0.45}
          />
        </div>
      ) : null}

      <Motes count={20} opacity={warmth * 0.4} color={C.warm} speed={0.5} seed={91} />
      <Vignette />
      <Grain opacity={0.05 + warmth * 0.02} />
    </AbsoluteFill>
  );
};

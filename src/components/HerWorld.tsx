import React from "react";
import { AbsoluteFill } from "remotion";
import { C } from "../theme";
import { Backdrop, Glow } from "./Look";
import { range } from "../lib/rand";

const HORIZON = 726;
const VANISH: [number, number] = [960, 700];

/**
 * The space she lives in: no walls, no furniture, only a horizon made of light
 * and a floor that recedes forever. Anything that looks like a room in this
 * film was built by her, a few seconds before you see it.
 */
export const HerWorld: React.FC<{
  /** 0..1, how much of the floor grid is drawn */
  floor?: number;
  /** 0..1, how strongly the horizon burns */
  horizon?: number;
  warm?: number;
  children?: React.ReactNode;
}> = ({ floor = 1, horizon = 1, warm = 0, children }) => {
  const rows = range(26).map((i) => {
    const t = i / 25;
    const y = HORIZON + Math.pow(t, 2.1) * 400;
    return { y, t };
  });
  const rays = range(23).map((i) => i - 11);

  return (
    <AbsoluteFill>
      <Backdrop top="#081424" bottom="#02040a" />
      <svg
        viewBox="0 0 1920 1080"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.cool} stopOpacity="0.85" />
            <stop offset="45%" stopColor={C.cool} stopOpacity="0.22" />
            <stop offset="100%" stopColor={C.cool} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="horizonFade" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.cool} stopOpacity="0" />
            <stop offset="50%" stopColor={C.white} stopOpacity="0.9" />
            <stop offset="100%" stopColor={C.cool} stopOpacity="0" />
          </linearGradient>
        </defs>
        {floor > 0.01 ? (
          <g opacity={floor}>
            {rows.map((row, index) => (
              <line
                key={index}
                x1={-200}
                y1={row.y}
                x2={2120}
                y2={row.y}
                stroke="url(#floorFade)"
                strokeWidth={row.t < 0.06 ? 1.6 : 1}
                opacity={0.16 + row.t * 0.44}
              />
            ))}
            {rays.map((offset) => (
              <line
                key={offset}
                x1={VANISH[0]}
                y1={VANISH[1]}
                x2={VANISH[0] + offset * 420}
                y2={1180}
                stroke={C.cool}
                strokeWidth={1}
                opacity={0.12}
              />
            ))}
          </g>
        ) : null}
        <line
          x1={-100}
          y1={HORIZON}
          x2={2020}
          y2={HORIZON}
          stroke="url(#horizonFade)"
          strokeWidth={2}
          opacity={horizon}
        />
      </svg>
      <Glow
        x={960}
        y={HORIZON}
        size={1800}
        color={warm > 0.5 ? C.warmMid : C.coolMid}
        opacity={0.1 + horizon * 0.16}
      />
      {warm > 0.01 ? (
        <AbsoluteFill
          style={{
            background: `radial-gradient(ellipse 60% 45% at 50% 62%, ${C.warmMid}44 0%, transparent 70%)`,
            opacity: warm,
            mixBlendMode: "screen",
          }}
        />
      ) : null}
      {children}
    </AbsoluteFill>
  );
};

/** A pool of light in which speech appears. Her side of every conversation. */
export const LightPool: React.FC<{
  width?: number;
  height?: number;
  x?: number;
  y?: number;
  opacity?: number;
  /** 0..1 — how much of the pool has been revealed */
  reveal?: number;
  children?: React.ReactNode;
}> = ({
  width = 1240,
  height = 560,
  x = 340,
  y = 240,
  opacity = 1,
  reveal = 1,
  children,
}) => (
  <div
    style={{
      position: "absolute",
      left: x,
      top: y,
      width,
      height,
      borderRadius: 26,
      background: `linear-gradient(180deg, rgba(24,60,92,0.34) 0%, rgba(8,18,32,0.12) 100%)`,
      border: `1px solid rgba(120,206,255,${0.12 * opacity})`,
      boxShadow: `0 0 120px rgba(56,140,210,${0.16 * opacity}) inset, 0 0 70px rgba(40,110,180,0.12)`,
      overflow: "hidden",
      opacity: opacity * reveal,
      maskImage:
        "radial-gradient(ellipse 70% 68% at 50% 50%, black 46%, rgba(0,0,0,0.35) 78%, transparent 100%)",
      clipPath: `inset(${(1 - reveal) * 50}% round 26px)`,
    }}
  >
    {children}
  </div>
);

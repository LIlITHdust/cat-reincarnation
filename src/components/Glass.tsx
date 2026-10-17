import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { mulberry32, range } from "../lib/rand";

/**
 * Fragments of frozen light. They drift the way shattered glass would if it
 * were falling through water, which is roughly what her world is.
 */
export const Shards: React.FC<{
  count?: number;
  opacity?: number;
  seed?: number;
  spread?: number;
  tint?: string;
}> = ({ count = 26, opacity = 0.55, seed = 17, spread = 1, tint = "#ffffff" }) => {
  const frame = useCurrentFrame();
  const shards = useMemo(() => {
    const rand = mulberry32(seed);
    return range(count).map(() => ({
      x: rand(),
      y: rand(),
      w: 3 + rand() * 13,
      h: 40 + rand() * 190,
      rot: -70 + rand() * 60,
      speed: 0.1 + rand() * 0.5,
      depth: 0.25 + rand() * 0.75,
      phase: rand() * Math.PI * 2,
    }));
  }, [count, seed]);

  return (
    <AbsoluteFill style={{ opacity, pointerEvents: "none" }}>
      {shards.map((shard, index) => {
        const drift = ((frame * 0.0009 * shard.speed) % 1) * spread;
        const y = (((shard.y - drift) % 1) + 1) % 1;
        const wobble = Math.sin(frame * 0.012 + shard.phase) * 6 * shard.depth;
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: `calc(${shard.x * 100}% + ${wobble}px)`,
              top: `${y * 118 - 9}%`,
              width: shard.w * shard.depth,
              height: shard.h * shard.depth,
              rotate: `${shard.rot + wobble * 0.35}deg`,
              background: `linear-gradient(160deg, ${tint}00 0%, ${tint}cc 42%, ${tint}22 100%)`,
              opacity: 0.12 + shard.depth * 0.4,
              filter: "blur(0.6px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

/** A single held crystal, the kind of thing she makes and cannot keep. */
export const Crystal: React.FC<{
  x: number;
  y: number;
  size?: number;
  rotate?: number;
  color?: string;
  glow?: string;
  opacity?: number;
}> = ({ x, y, size = 1, rotate = -14, color = "#eaf6ff", glow = "#a8d8f0", opacity = 1 }) => {
  const id = React.useId().replace(/[:]/g, "");
  const shape = "M0,-64 L17,-18 L12,52 L0,74 L-12,52 L-17,-18 Z";
  return (
    <svg
      viewBox="-60 -90 120 190"
      style={{
        position: "absolute",
        left: x - 60 * size,
        top: y - 90 * size,
        width: 120 * size,
        height: 190 * size,
        rotate: `${rotate}deg`,
        opacity,
        overflow: "visible",
      }}
    >
      <defs>
        <linearGradient id={`cg${id}`} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="45%" stopColor={glow} stopOpacity="0.55" />
          <stop offset="100%" stopColor={glow} stopOpacity="0.12" />
        </linearGradient>
        <filter id={`cb${id}`} x="-120%" y="-120%" width="340%" height="340%">
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      <path d={shape} fill={glow} filter={`url(#cb${id})`} opacity={0.75} />
      <path d={shape} fill={`url(#cg${id})`} />
      <path d={shape} fill="none" stroke={color} strokeWidth={1.1} opacity={0.85} />
      <path d="M0,-64 L0,74" stroke="#ffffff" strokeWidth={0.9} opacity={0.5} />
      <ellipse cx={-4} cy={-8} rx={5} ry={22} fill="#ffffff" opacity={0.7} filter={`url(#cb${id})`} />
    </svg>
  );
};

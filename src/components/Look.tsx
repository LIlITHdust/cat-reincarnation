import React, { useMemo } from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { mulberry32, range } from "../lib/rand";
import { pace } from "../data/timeline";

const TILE = 220;
const TILES = 6;

/** Deterministic monochrome noise tiles, cycled on the timeline. */
const buildTiles = () => {
  const tiles: string[] = [];
  for (let t = 0; t < TILES; t++) {
    const canvas = document.createElement("canvas");
    canvas.width = TILE;
    canvas.height = TILE;
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];
    const image = ctx.createImageData(TILE, TILE);
    const rand = mulberry32(90210 + t * 7919);
    for (let i = 0; i < TILE * TILE; i++) {
      const v = Math.floor(rand() * 255);
      image.data[i * 4] = v;
      image.data[i * 4 + 1] = v;
      image.data[i * 4 + 2] = v;
      image.data[i * 4 + 3] = 255;
    }
    ctx.putImageData(image, 0, 0);
    tiles.push(canvas.toDataURL("image/png"));
  }
  return tiles;
};

let cachedTiles: string[] | null = null;
const tiles = () => {
  if (typeof document === "undefined") return [];
  if (!cachedTiles) cachedTiles = buildTiles();
  return cachedTiles;
};

/**
 * Film grain. In her world it is almost absent; the further the story goes,
 * the harder she tries to fake the texture of something real.
 */
export const Grain: React.FC<{ opacity: number; speed?: number }> = ({
  opacity,
  speed = 2,
}) => {
  const frame = useCurrentFrame();
  const list = useMemo(tiles, []);
  if (opacity <= 0.001 || list.length === 0) return null;
  const index = Math.floor(pace(frame) / speed) % list.length;
  return (
    <AbsoluteFill
      style={{
        background: `url(${list[index]})`,
        backgroundRepeat: "repeat",
        mixBlendMode: "overlay",
        opacity,
        pointerEvents: "none",
      }}
    />
  );
};

export const Vignette: React.FC<{ strength?: number }> = ({
  strength = 0.75,
}) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 78% 62% at 50% 46%, rgba(0,0,0,0) 40%, rgba(0,0,0,${
        0.55 * strength
      }) 100%)`,
      pointerEvents: "none",
    }}
  />
);

/** A flat colour wash used to tint a whole scene. */
export const Wash: React.FC<{
  color: string;
  opacity: number;
  mode?: React.CSSProperties["mixBlendMode"];
}> = ({ color, opacity, mode = "screen" }) => (
  <AbsoluteFill
    style={{
      background: color,
      opacity,
      mixBlendMode: mode,
      pointerEvents: "none",
    }}
  />
);

export const Scanlines: React.FC<{ opacity: number }> = ({ opacity }) => (
  <AbsoluteFill
    style={{
      background:
        "repeating-linear-gradient(to bottom, rgba(255,255,255,0.5) 0px, rgba(255,255,255,0.5) 1px, rgba(0,0,0,0) 1px, rgba(0,0,0,0) 3px)",
      opacity,
      pointerEvents: "none",
    }}
  />
);

/** The dark ground both worlds sit on. */
export const Backdrop: React.FC<{
  top?: string;
  bottom?: string;
  children?: React.ReactNode;
}> = ({ top = "#070d18", bottom = C.void, children }) => (
  <AbsoluteFill
    style={{
      background: `radial-gradient(ellipse 120% 90% at 50% 26%, ${top} 0%, ${bottom} 72%)`,
    }}
  >
    {children}
  </AbsoluteFill>
);

/** A soft bokeh light. Centred on `x`/`y` in composition pixels. */
export const Glow: React.FC<{
  x: number;
  y: number;
  size: number;
  color: string;
  opacity: number;
  blur?: number;
}> = ({ x, y, size, color, opacity, blur = 0 }) => (
  <div
    style={{
      position: "absolute",
      left: x - size / 2,
      top: y - size / 2,
      width: size,
      height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle, ${color} 0%, ${color}00 68%)`,
      opacity,
      filter: blur ? `blur(${blur}px)` : undefined,
      pointerEvents: "none",
    }}
  />
);

const MOTE_COUNT = 46;

/** Slow drifting motes of light — the dust of her world. */
export const Motes: React.FC<{
  count?: number;
  opacity?: number;
  color?: string;
  speed?: number;
  seed?: number;
}> = ({ count = MOTE_COUNT, opacity = 0.5, color = C.cool, speed = 1, seed = 5 }) => {
  const frame = useCurrentFrame();
  const motes = useMemo(() => {
    const rand = mulberry32(seed);
    return range(count).map(() => ({
      x: rand(),
      y: rand(),
      size: 2 + rand() * 7,
      drift: 0.3 + rand() * 1.4,
      phase: rand() * Math.PI * 2,
      depth: 0.25 + rand() * 0.75,
    }));
  }, [count, seed]);

  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      {motes.map((mote, index) => {
        const x =
          (((mote.x + pace(frame) * 0.00004 * mote.drift * speed) % 1) + 1) % 1;
        const y =
          (((mote.y - pace(frame) * 0.00006 * mote.drift * speed) % 1) + 1) % 1;
        const twinkle =
          0.35 +
          0.65 *
            (0.5 +
              0.5 * Math.sin(pace(frame) * 0.03 * mote.drift + mote.phase));
        return (
          <div
            key={index}
            style={{
              position: "absolute",
              left: `${x * 100}%`,
              top: `${y * 100}%`,
              width: mote.size * mote.depth * 2,
              height: mote.size * mote.depth * 2,
              borderRadius: "50%",
              background: color,
              opacity: twinkle * mote.depth,
              filter: "blur(1.5px)",
            }}
          />
        );
      })}
    </AbsoluteFill>
  );
};

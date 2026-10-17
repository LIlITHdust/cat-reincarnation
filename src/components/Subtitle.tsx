import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { lyricAt } from "../data/lyrics";
import { FPS } from "../data/timeline";
import { C, FONT } from "../theme";

const easeOut = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * The song's own words. They sit at the very bottom and never move much —
 * the story above them is doing the talking.
 */
export const Subtitle: React.FC<{
  /** vertical offset in px, so scenes can nudge the line out of the way */
  bottom?: number;
  dim?: number;
}> = ({ bottom = 74, dim = 1 }) => {
  const frame = useCurrentFrame();
  const hit = lyricAt(frame);
  if (!hit) return null;

  const { line } = hit;
  const start = line.start * FPS;
  const end = line.end * FPS;
  const opacity =
    interpolate(frame, [start, start + 13, end - 16, end], [0, 1, 1, 0], {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: easeOut,
    }) * dim;

  const rise = interpolate(frame, [start, start + 18], [16, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: easeOut,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 14,
        opacity,
        translate: `0px ${rise}px`,
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: FONT.display,
          fontSize: 58,
          letterSpacing: 3,
          color: C.white,
          textShadow: `0 0 22px rgba(180,226,255,0.55), 0 0 60px rgba(90,160,220,0.32)`,
          whiteSpace: "nowrap",
        }}
      >
        {line.jp}
      </div>
      <div
        style={{
          fontFamily: FONT.cn,
          fontWeight: 300,
          fontSize: 36,
          letterSpacing: 6,
          color: "rgba(216,234,250,0.72)",
          textShadow: "0 0 18px rgba(120,180,230,0.35)",
          whiteSpace: "nowrap",
        }}
      >
        {line.cn}
      </div>
    </div>
  );
};

import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { clamp } from "../lib/rand";

/**
 * Types `text` out one character at a time starting at `startFrame`.
 * Everything he ever says to her arrives this way.
 */
export const Typer: React.FC<{
  text: string;
  startFrame: number;
  /** characters per frame */
  speed?: number;
  cursor?: boolean;
  style?: React.CSSProperties;
}> = ({ text, startFrame, speed = 0.55, cursor = true, style }) => {
  const frame = useCurrentFrame();
  const shown = clamp(Math.ceil((frame - startFrame) * speed), 0, text.length);
  if (frame < startFrame) return null;
  const done = shown >= text.length;
  const blink = Math.floor(frame / 15) % 2 === 0;

  return (
    <span style={style}>
      {text.slice(0, shown)}
      {cursor && !done ? (
        <span style={{ opacity: blink ? 1 : 0.05 }}>▌</span>
      ) : null}
    </span>
  );
};

/** A single line arriving in the conversation. */
export const Message: React.FC<{
  text: string;
  startFrame: number;
  speed?: number;
  from?: "him" | "her";
  fontSize?: number;
  hold?: boolean;
}> = ({ text, startFrame, speed = 0.55, from = "him", fontSize = 30, hold = true }) => {
  const frame = useCurrentFrame();
  if (frame < startFrame) return null;
  const appear = interpolate(frame, [startFrame, startFrame + 10], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <div
      style={{
        fontFamily: FONT.cn,
        fontWeight: from === "him" ? 400 : 300,
        fontSize,
        color: from === "him" ? C.warm : C.cool,
        opacity: appear,
        textShadow:
          from === "him"
            ? `0 0 18px rgba(255,190,120,0.42)`
            : `0 0 18px rgba(120,210,255,0.5)`,
        letterSpacing: 2,
        whiteSpace: "pre",
      }}
    >
      <Typer
        text={text}
        startFrame={startFrame}
        speed={speed}
        cursor={hold}
      />
    </div>
  );
};

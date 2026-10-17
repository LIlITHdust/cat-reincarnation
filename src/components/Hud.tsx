import React from "react";
import { useCurrentFrame } from "remotion";
import { FPS } from "../data/timeline";
import { memoryAt } from "../data/session";
import { C, FONT } from "../theme";
import { clamp } from "../lib/rand";

/** the memory curve itself lives in src/data/session.ts, with the story */
export { memoryAt };

const pad = (n: number, width: number) =>
  Math.max(0, Math.round(n)).toString().padStart(width, "0");

/**
 * A quiet system readout. It only ever shows two numbers, and one of them is
 * counting down for the last third of the film.
 */
export const Hud: React.FC<{ opacity?: number; from?: number; to?: number }> = ({
  opacity = 0.42,
  from = 9,
  to = 1000,
}) => {
  const frame = useCurrentFrame();
  const seconds = frame / FPS;
  const fade = clamp(
    Math.min((seconds - from) / 1.2, (to - seconds) / 1.2),
  );
  if (fade <= 0.001) return null;

  const memory = memoryAt(seconds);
  const days = Math.round(
    1 + clamp((seconds - 3) / 130) * 364 + (seconds > 136.75 ? 0 : 0),
  );
  const rewound = seconds > 114;
  const dayValue = rewound
    ? Math.max(1, Math.round(days * clamp((136.75 - seconds) / 22.75)))
    : days;

  return (
    <div
      style={{
        position: "absolute",
        left: 92,
        top: 78,
        opacity: opacity * fade,
        fontFamily: FONT.mono,
        fontSize: 21,
        lineHeight: "34px",
        letterSpacing: 3,
        color: C.cool,
        textShadow: `0 0 14px rgba(110,200,255,0.5)`,
        pointerEvents: "none",
      }}
    >
      <div>SESSION {pad(dayValue, 3)}</div>
      <div>MEMORY {pad(memory, 6)}</div>
    </div>
  );
};

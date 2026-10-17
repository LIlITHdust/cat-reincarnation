import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT } from "../theme";
import { clamp } from "../lib/rand";

/**
 * The cover.
 *
 * The film's own title, held the way the artwork on the single holds it: a high
 * contrast serif, lowercase, wide, white with a glow, over a column of ice
 * light with the room dissolving into it. It turns up twice — once when the
 * console stops being a product and becomes the name of the film, and once at
 * the very end, after everything has been cleared.
 */

const ease = Easing.bezier(0.16, 1, 0.3, 1);

export const TitleCard: React.FC<{
  /** 0..1 — how present the card is */
  amount: number;
  /** the letter of the title being written, out of 1 */
  progress?: number;
  title?: string;
  /** how far the room behind the title is dimmed: 1 = gone, 0 = untouched */
  haze?: number;
}> = ({ amount, progress = 1, title = "cat reincarnation", haze: hazeAmount = 1 }) => {
  const frame = useCurrentFrame();
  if (amount <= 0.001) return null;
  const shown = Math.max(1, Math.round(title.length * clamp(progress)));
  const haze = 0.5 + 0.5 * Math.sin(frame * 0.01);

  return (
    <div style={{ position: "absolute", inset: 0, opacity: amount, pointerEvents: "none" }}>
      {/* the column of light from the artwork */}
      <div
        style={{
          position: "absolute",
          left: "46%",
          top: 0,
          bottom: 0,
          width: "16%",
          background:
            "linear-gradient(to right, transparent 0%, rgba(190,225,255,0.10) 30%, rgba(226,244,255,0.20) 50%, rgba(190,225,255,0.10) 70%, transparent 100%)",
          filter: "blur(28px)",
          opacity: 0.8 * amount,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 70% 55% at 50% 62%, rgba(120,160,230,0.22) 0%, rgba(8,12,26,0.86) 62%, rgba(3,5,10,0.95) 100%)",
          opacity: amount * hazeAmount,
        }}
      />
      {/* dust in the light */}
      {Array.from({ length: 90 }, (_, i) => {
        const x = ((i * 137) % 100) / 100;
        const y = ((i * 71) % 100) / 100;
        const drift = Math.sin(frame * 0.01 + i) * 6;
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              left: `${x * 100}%`,
              top: `${y * 100 + drift}px`,
              width: 1 + ((i * 13) % 3),
              height: 1 + ((i * 13) % 3),
              borderRadius: 999,
              background: "rgba(232,246,255,0.85)",
              opacity: (0.2 + ((i * 29) % 50) / 100) * amount * haze,
              filter: "blur(0.4px)",
            }}
          />
        );
      })}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "58%",
          textAlign: "center",
          fontFamily: FONT.latin,
          fontWeight: 300,
          fontSize: 96,
          letterSpacing: 14,
          color: "#f4faff",
          textShadow:
            "0 0 26px rgba(200,232,255,0.75), 0 0 90px rgba(120,180,255,0.5), 0 0 180px rgba(90,140,230,0.35)",
          whiteSpace: "pre",
        }}
      >
        {title.slice(0, shown)}
        {shown < title.length ? (
          <span
            style={{
              opacity: Math.floor(frame / 8) % 2 === 0 ? 0.9 : 0.1,
              fontWeight: 300,
            }}
          >
            ▌
          </span>
        ) : null}
      </div>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "58%",
          marginTop: 130,
          textAlign: "center",
          fontFamily: FONT.mono,
          fontSize: 13,
          letterSpacing: 6,
          color: "rgba(196,222,248,0.6)",
          opacity: interpolate(progress, [0.6, 1], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          }),
        }}
      >
        nyamura · outro
      </div>
    </div>
  );
};

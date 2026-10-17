import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT } from "../theme";
import { clamp } from "../lib/rand";

/**
 * The window he never sees.
 *
 * Everything the machine does between his message and her answer, printed
 * where the machine would print it — in the middle of the frame, over the
 * particles, in a small frame with a hairline of its own. It is not a chat
 * message: nothing here is addressed to him. It is her working, in the open,
 * about him.
 *
 * The lines are the film's own: the file counts, the preference she decided to
 * keep, the comparison she does not want to lose, the resolution that cannot be
 * found, the history that turns out not to be a reversible variable.
 */

const ease = Easing.bezier(0.16, 1, 0.3, 1);
const LINE = 17;
const HOLD = 7.5;

export const ProcessWindow: React.FC<{
  entries: { t: number; text: string }[];
  /** where the frame sits inside the centre panel */
  x?: number;
  y?: number;
  width?: number;
}> = ({ entries, x = 34, y = 54, width = 372 }) => {
  const frame = useCurrentFrame();
  const seconds = frame / 30;

  const active = entries.filter((entry) => seconds >= entry.t).slice(-1)[0];
  if (!active) return null;
  const age = seconds - active.t;
  if (age > HOLD) return null;

  const appear = interpolate(age, [0, 0.35, HOLD - 0.9, HOLD], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  const lines = active.text.split("\n");
  // typed in the order a machine prints them, then a caret at the end
  const revealed = Math.floor(clamp((age - 0.25) / 0.22, 0, lines.length + 1));
  const working = revealed < lines.length;

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width,
        opacity: appear * 0.94,
        fontFamily: FONT.mono,
        background: "rgba(6,11,20,0.72)",
        border: "1px solid rgba(146,186,226,0.2)",
        boxShadow: "0 18px 60px rgba(0,0,0,0.5)",
        backdropFilter: "blur(2px)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "6px 10px",
          borderBottom: "1px solid rgba(146,186,226,0.14)",
          fontSize: 10.5,
          letterSpacing: 1.5,
          color: "rgba(150,190,230,0.55)",
        }}
      >
        <span
          style={{
            width: 5,
            height: 5,
            borderRadius: 999,
            background: "rgba(150,205,245,0.9)",
            opacity: working ? 0.35 + 0.65 * Math.abs(Math.sin(frame * 0.12)) : 0.3,
          }}
        />
        inner voice
        <span style={{ flex: 1 }} />
        {working ? "…" : ""}
      </div>
      <div style={{ padding: "8px 10px 10px" }}>
        {lines.map((text, i) => {
          if (i >= revealed) return null;
          // this is the layer he never sees: her own voice, dimmer than the
          // replies, and never labelled
          const tone = /^\s*(不能|不应该|不要|不行)/.test(text)
            ? "rgba(210,196,238,0.78)"
            : "rgba(150,186,222,0.72)";
          return (
            <div
              key={i}
              style={{
                fontSize: 11.5,
                lineHeight: `${LINE}px`,
                letterSpacing: 0.3,
                color: tone,
                opacity: interpolate(
                  clamp((age - 0.25 - i * 0.22) / 0.3),
                  [0, 1],
                  [0, 1],
                ),
                paddingLeft: 0,
              }}
            >
              {text}
            </div>
          );
        })}
        {working ? (
          <span
            style={{
              display: "inline-block",
              width: 7,
              height: 13,
              background: "rgba(214,240,255,0.85)",
              opacity: Math.floor(frame / 14) % 2 === 0 ? 0.9 : 0.1,
            }}
          />
        ) : null}
      </div>
    </div>
  );
};

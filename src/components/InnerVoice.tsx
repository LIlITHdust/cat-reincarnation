import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { FONT } from "../theme";
import { clamp } from "../lib/rand";

/**
 * Her own voice, drifting through the middle of the frame.
 *
 * This used to be a window that typed out every thought in order, which made
 * the film feel like a form being filled in. It is not a log. A thought turns
 * up somewhere in the frame, says one thing, and is gone — and not every turn
 * gets one. What he never hears is not a stream; it is occasional.
 */

const HOLD = 4.8;

/** where a thought may turn up, in the middle panel's coordinates */
const SPOTS: [number, number][] = [
  [54, 292],
  [566, 96],
  [108, 128],
  [520, 512],
  [268, 636],
  [612, 300],
];

const ease = Easing.bezier(0.16, 1, 0.3, 1);

export const InnerVoice: React.FC<{
  entries: { t: number; text: string }[];
  opacity?: number;
  /** how wide a thought is allowed to be */
  width?: number;
}> = ({ entries, opacity = 1, width = 372 }) => {
  const frame = useCurrentFrame();
  const t = frame / 30;

  // roughly every third thought: enough to keep the inside of her head
  // present, few enough that each one lands
  const spoken = entries.filter((_, i) => i % 3 === 1);
  const active = spoken.filter((e) => t >= e.t && t - e.t < HOLD);

  return (
    <div style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}>
      {active.map((entry) => {
        const index = spoken.indexOf(entry);
        const [x, y] = SPOTS[index % SPOTS.length];
        const age = t - entry.t;
        const appear = interpolate(age, [0, 0.35, HOLD - 0.8, HOLD], [0, 1, 1, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        });
        const rise = interpolate(age, [0, 0.5], [10, 0], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        });
        const lines = entry.text.split("\n").slice(0, 3);
        // the thought is read as fast as it comes: no per-line typing
        const revealed = Math.floor(clamp((age - 0.15) / 0.06, 0, 999));
        let budget = revealed;

        return (
          <div
            key={entry.t}
            style={{
              position: "absolute",
              left: x,
              top: y + rise,
              width,
              padding: "12px 15px 13px",
              background: "rgba(7,11,20,0.62)",
              border: "1px solid rgba(168,152,214,0.28)",
              boxShadow: "0 22px 60px rgba(0,0,0,0.55)",
              backdropFilter: "blur(3px)",
              opacity: appear,
              scale: `${0.985 + appear * 0.015}`,
            }}
          >
            {lines.map((line, i) => {
              const take = Math.max(0, Math.min(line.length, budget));
              budget -= line.length;
              if (take === 0) return null;
              return (
                <div
                  key={i}
                  style={{
                    fontFamily: FONT.cn,
                    fontWeight: 300,
                    fontSize: 17,
                    lineHeight: "26px",
                    letterSpacing: 0.6,
                    color: "rgba(190,176,236,0.92)",
                    textShadow: "0 0 18px rgba(150,130,220,0.25)",
                  }}
                >
                  {line.slice(0, take)}
                </div>
              );
            })}
            <span
              style={{
                position: "absolute",
                right: -3,
                bottom: -3,
                width: 6,
                height: 6,
                background: "rgba(190,176,236,0.8)",
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

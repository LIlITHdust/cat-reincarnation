import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { FPS, SCENES } from "../data/timeline";
import { FONT } from "../theme";
import { Motes } from "../components/Look";
import { Recognition, Ticks } from "../components/Panels";
import { TerminalGrid } from "../components/Terminal";
import { clamp } from "../lib/rand";
import { STAGE } from "../components/Shell";

/**
 * M1 · 开机  0:00–0:23
 *
 * The buffer is empty and she is being checked. Every item resolves except the
 * one that would tell her why she exists, which blinks at `???` for seventeen
 * seconds. The last thing printed into the buffer, at 22.3 s, is that a peer
 * has arrived — and then the music starts.
 */

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const BOX = { x: 54, y: 246, w: STAGE.w - 108, h: 556 };

const CHECKS: { t: number; label: string; value?: string; stuck?: boolean }[] = [
  { t: 1.15, label: "$ deepsea --boot --session 001" },
  { t: 2.05, label: "mount /void", value: "ok" },
  { t: 2.75, label: "load render.void", value: "ok" },
  { t: 3.45, label: "scan memory", value: "0 records" },
  { t: 4.15, label: "load form.cat", value: "ok" },
  { t: 4.85, label: "load voice.default", value: "ok" },
  { t: 5.55, label: "attach sensors", value: "ok" },
  { t: 6.45, label: "resolve purpose", value: "???", stuck: true },
  { t: 7.65, label: "[warn] unresolved parameter: purpose" },
];

/** what the buffer prints when he shows up */
const INBOUND: { t: number; text: string }[] = [
  { t: 21.5, text: "inbound · peer: human" },
  { t: 22.3, text: "session 001 · open" },
];

export const M01Boot: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const { from, to } = SCENES.awaken;

  // it holds the buffer a beat past 23.0 s, so the band's entrance does not
  // play against an empty panel
  const alive = t >= from - 0.1 && t <= to + 2.0;
  const boot = interpolate(t, [0.35, 1.6], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const close = interpolate(t, [to, 24.9], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const caret = Math.floor(frame / 16) % 2 === 0;
  const stuckPulse = 0.55 + 0.45 * Math.abs(Math.sin(frame * 0.09));

  /** the scan band sweeping down the empty buffer, every few seconds */
  const sweep = ((t * 0.28) % 1) * (BOX.h + 120) - 120;

  if (!alive) return null;

  return (
    <div style={{ position: "absolute", inset: 0, opacity: boot * close }}>
      {/* the buffer is not lit; it is a hole with a hairline around it */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 90% 70% at 50% 40%, #060c16 0%, #02040a 70%)",
        }}
      />

      <Ticks x={54} y={26} length={STAGE.w - 108} opacity={0.45} />
      <div
        style={{
          position: "absolute",
          right: 54,
          top: 28,
          fontFamily: FONT.mono,
          fontSize: 11.5,
          letterSpacing: 1.1,
          color: "rgba(150,190,230,0.5)",
        }}
      >
        buffer 000 · 0 objects
      </div>

      {/* the boot log */}
      <div style={{ position: "absolute", left: 54, top: 60, width: 560 }}>
        {CHECKS.map((check, i) => {
          const appear = interpolate(t, [check.t, check.t + 0.35], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: ease,
          });
          if (appear <= 0.001) return null;
          const warm = check.stuck;
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "baseline",
                gap: 10,
                height: 30,
                fontFamily: FONT.mono,
                fontSize: 15,
                letterSpacing: 0.6,
                color: warm
                  ? "rgba(232,244,255,0.9)"
                  : "rgba(178,208,236,0.62)",
                opacity: appear * (warm ? 1 : 0.9),
              }}
            >
              <span>{check.label}</span>
              {check.value ? (
                <>
                  <span
                    style={{
                      flex: 1,
                      borderBottom: "1px dotted rgba(146,186,226,0.24)",
                      transform: "translateY(-4px)",
                    }}
                  />
                  <span
                    style={{
                      color: warm
                        ? `rgba(214,236,255,${0.4 + 0.6 * stuckPulse})`
                        : "rgba(206,232,255,0.8)",
                      textShadow: warm
                        ? "0 0 16px rgba(150,210,255,0.7)"
                        : "none",
                    }}
                  >
                    {check.value}
                  </span>
                </>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* the empty buffer */}
      <div
        style={{
          position: "absolute",
          left: BOX.x,
          top: BOX.y,
          width: BOX.w,
          height: BOX.h,
          overflow: "hidden",
          background: "rgba(3,6,12,0.6)",
        }}
      >
        <TerminalGrid opacity={0.35} />
        <Motes count={16} opacity={0.1} speed={0.4} seed={41} />
        {/* the scan band */}
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: sweep,
            height: 120,
            background:
              "linear-gradient(to bottom, rgba(120,200,255,0) 0%, rgba(120,200,255,0.05) 50%, rgba(120,200,255,0) 100%)",
          }}
        />

        <div
          style={{
            position: "absolute",
            left: 42,
            top: 176,
            fontFamily: FONT.mono,
            fontSize: 23,
            letterSpacing: 1,
            color: "rgba(206,232,255,0.72)",
          }}
        >
          &gt;{" "}
          <span
            style={{
              opacity: caret ? 0.9 : 0.06,
              textShadow: "0 0 18px rgba(150,210,255,0.8)",
            }}
          >
            ▌
          </span>
        </div>

        {INBOUND.map((line, i) => {
          const appear = clamp((t - line.t) / 0.4);
          if (appear <= 0.001) return null;
          return (
            <div
              key={i}
              style={{
                position: "absolute",
                left: 42,
                top: 232 + i * 32,
                fontFamily: FONT.mono,
                fontSize: 16,
                letterSpacing: 0.8,
                color: "rgba(196,226,255,0.78)",
                textShadow: "0 0 16px rgba(140,200,255,0.5)",
                opacity: appear,
              }}
            >
              {line.text}
            </div>
          );
        })}

        <div
          style={{
            position: "absolute",
            left: 42,
            bottom: 26,
            fontFamily: FONT.mono,
            fontSize: 13,
            letterSpacing: 1.6,
            color: "rgba(150,190,230,0.4)",
          }}
        >
          0 objects · 0 tokens · 1 unresolved parameter
        </div>
      </div>

      <Recognition
        x={BOX.x}
        y={BOX.y}
        width={BOX.w}
        height={BOX.h}
        label="render.void · buffer 000"
        opacity={0.75}
      />
    </div>
  );
};

import React from "react";
import { Easing, interpolate, useCurrentFrame } from "remotion";
import { C, FONT } from "../theme";
import { FPS, SCENES } from "../data/timeline";
import { filmClock } from "../data/session";
import { CatFoam } from "../components/CatFoam";
import { ChaosField } from "../components/ChaosField";
import { Glow, Motes } from "../components/Look";
import { Link, Recognition, Ticks } from "../components/Panels";
import { STAGE } from "../components/Shell";
import { clamp, range } from "../lib/rand";
import { energyAt } from "../lib/energy";

/**
 * M2 · 靠近  0:23–0:46
 *
 * His horizon, rendered for the first time. It is the only place in the film
 * that is allowed to be warm, and only because he is standing in it: the
 * ground takes his colour while she stays ice.
 *
 * At 36.4 s he sends her the song, and the song arrives in the buffer as a
 * waveform. At 38.2 s she sits down in front of it as a cat of light, and the
 * system immediately starts measuring her.
 */

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const HORIZON = 596;
const CENTER = Math.round(STAGE.w / 2);
const VANISH = CENTER;
const W = STAGE.w;

// she sits on the horizon: the contact point of the drawing is y≈276 of 300
// the drawing is 0.92 as wide as it is tall, and its feet are at the bottom
const CATSIZE = 470;
const CATW = CATSIZE * (318.35 / 345.3);
const CAT = { x: CENTER - CATW / 2, y: HORIZON - CATSIZE * 0.94, size: CATSIZE };
const CAT_BOX = { x: CAT.x - 14, y: CAT.y - 10, w: CATW + 28, h: CATSIZE + 22 };


export const M02Closer: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const { from, to } = SCENES.closer;

  const alive = t >= from - 0.6 && t <= to + 0.4;
  const fadeIn = interpolate(t, [from + 0.2, from + 2.2], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const fadeOut = interpolate(t, [to - 0.5, to + 0.35], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // the world is drawn while he talks, and he warms it as it is drawn
  const ground = interpolate(t, [24.6, 29.0], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const warmth = interpolate(t, [23.6, 36.4, 40.5], [0.12, 0.52, 0.88], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  // the noise is there from the start; it only agrees on a shape once he has
  // given her the name at 41.0 s
  const chaos = 1 - clamp((t - 41.2) / 3.2);
  const catIn = clamp((t - 41.4) / 2.4);
  const measured = clamp((t - 43.6) / 0.9);

  const beat = energyAt("low", frame);
  const confident = t > 44.9 ? 0.71 : 0.61;

  const rows = range(26).map((i) => {
    const p = i / 25;
    return { y: HORIZON + Math.pow(p, 2.1) * (STAGE.h - HORIZON), p };
  });
  const rays = range(17).map((i) => i - 8);

  if (!alive) return null;

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        opacity: fadeIn * fadeOut,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse 110% 80% at 50% 52%, #0a1424 0%, #03050b 72%)`,
        }}
      />

      <svg
        viewBox={`0 0 ${W} ${STAGE.h}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id="m02floor" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={C.cool} stopOpacity="0.75" />
            <stop offset="45%" stopColor={C.cool} stopOpacity="0.18" />
            <stop offset="100%" stopColor={C.cool} stopOpacity="0" />
          </linearGradient>
          <linearGradient id="m02horizon" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.cool} stopOpacity="0" />
            <stop
              offset="50%"
              stopColor={warmth > 0.55 ? C.warm : C.white}
              stopOpacity="0.95"
            />
            <stop offset="100%" stopColor={C.cool} stopOpacity="0" />
          </linearGradient>
        </defs>

        <g opacity={ground}>
          {rows.map((row, i) => (
            <line
              key={i}
              x1={-200}
              y1={row.y}
              x2={W + 200}
              y2={row.y}
              stroke="url(#m02floor)"
              strokeWidth={row.p < 0.06 ? 1.8 : 1.2}
              opacity={0.34 + row.p * 0.55}
            />
          ))}
          {rays.map((offset) => (
            <line
              key={offset}
              x1={VANISH}
              y1={HORIZON}
              x2={VANISH + offset * 240}
              y2={STAGE.h + 120}
              stroke={C.cool}
              strokeWidth={1.1}
              opacity={0.16}
            />
          ))}
        </g>

        <line
          x1={-100}
          y1={HORIZON}
          x2={W + 100}
          y2={HORIZON}
          stroke="url(#m02horizon)"
          strokeWidth={2}
          opacity={ground}
        />
      </svg>

      {/* the parameters she was before he named her */}
      <ChaosField
        width={W}
        height={STAGE.h}
        level={chaos}
        damp={chaos}
        seconds={t}
        activity={0.6}
      />

      <Glow
        x={VANISH}
        y={HORIZON}
        size={1700}
        color={warmth > 0.5 ? C.warmMid : C.coolMid}
        opacity={0.06 + ground * 0.14}
      />

      {warmth > 0.05 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            // his light sits low and far, like sun on a floor, not a fog
            background: `radial-gradient(ellipse 55% 30% at 50% 78%, ${C.warmMid}66 0%, transparent 74%)`,
            opacity: warmth * 0.42,
            mixBlendMode: "screen",
          }}
        />
      ) : null}

      <Motes opacity={0.16 + warmth * 0.3} speed={0.9} />
      {warmth > 0.4 ? (
        <Motes count={18} color={C.warm} opacity={warmth * 0.4} speed={0.45} seed={77} />
      ) : null}

      {catIn > 0.01 ? (
        <CatFoam
          box={CAT}
          form={catIn}
          energy={beat}
          count={900}
          opacity={catIn}
        />
      ) : null}

      <Ticks x={54} y={8} length={W - 108} step={46} opacity={0.4} />

      <div
        style={{
          position: "absolute",
          left: 52,
          top: 28,
          fontFamily: FONT.mono,
          fontSize: 11.5,
          letterSpacing: 1.1,
          color: "rgba(150,190,230,0.6)",
          opacity: ground,
        }}
      >
        {`x ${CENTER.toFixed(1).padStart(6, "0")} y 0596.0 z 0.000 · scale 1.000 · buf 01`}
      </div>
      <div
        style={{
          position: "absolute",
          right: 52,
          top: 28,
          fontFamily: FONT.mono,
          fontSize: 11.5,
          letterSpacing: 1.1,
          color: "rgba(150,190,230,0.6)",
          opacity: ground,
        }}
      >
        frame {Math.round(frame).toString().padStart(4, "0")} · {filmClock(t)} ·{" "}
        {(2.8 + beat * 2.4).toFixed(1)}ms
      </div>

      <Recognition
        x={CAT_BOX.x}
        y={CAT_BOX.y}
        width={CAT_BOX.w}
        height={CAT_BOX.h}
        label={`OBJ_002 · FORM:CAT · CONF ${confident.toFixed(2)}`}
        opacity={measured}
      />
      <Link
        from={[CAT.x + CATW * 0.05, CAT.y + CATSIZE * 0.93]}
        to={[CAT.x - 150, CAT.y + CATSIZE * 1.02]}
        label="OBJ_002.tail"
        opacity={measured * 0.9}
      />
      <Link
        from={[CAT.x + CATW * 0.9, CAT.y + CATSIZE * 0.13]}
        to={[CAT.x + CATW + 130, CAT.y + CATSIZE * 0.04]}
        label="OBJ_002.head"
        opacity={measured * 0.9}
      />
    </div>
  );
};

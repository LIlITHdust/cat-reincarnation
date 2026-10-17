import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { C, FONT } from "../theme";
import { FPS, SCENES } from "../data/timeline";
import { filmClock } from "../data/session";
import { HarnessCard } from "../components/Harness";
import { Glow, Motes } from "../components/Look";
import { Recognition, Ticks } from "../components/Panels";
import { STAGE } from "../components/Shell";
import { clamp, range } from "../lib/rand";
import { energyAt } from "../lib/energy";

/**
 * M3 · 光做的房间 / 我会杀掉你  0:46–1:08
 *
 * Two things happen in these twenty-two seconds and they happen at the same
 * time, which is the point:
 *
 *   46.6–54.9 s  she builds him a sea and a sky, all light, no weight — while
 *                the song is already asking to have the clock turned back.
 *   54.0 s       she takes the shape of a girl, to stand in it.
 *   57.8–68.0 s  the chorus says it out loud, and the buffer forks into two
 *                runs of the same room: one where she stays, one where she
 *                goes. The stay branch is the one that kills him, and the
 *                monitor turns red for the only time in the film.
 */

const ease = Easing.bezier(0.16, 1, 0.3, 1);

const SEA = 560;
const SPLIT = STAGE.w / 2;

/** her feet stand on the water; the drawing is 662×1186 */
const GIRL = { h: 442, x: SPLIT - 123, y: SEA - 442 };
const GIRL_W = GIRL.h * (662 / 1186);

const FALLOFF =
  "linear-gradient(to bottom, black 0%, black 62%, rgba(0,0,0,0.6) 82%, rgba(0,0,0,0.12) 94%, transparent 100%)";

/** his room, in the two branches: a window of warm light and a desk */
const ROOM = { y: 300, w: 300, h: 300 };

export const M03Room: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const { from, to } = SCENES.room;

  const alive = t >= from - 0.5 && t <= to + 0.4;
  const fade = interpolate(
    t,
    [from - 0.2, from + 0.9, to - 0.6, to + 0.3],
    [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
  );

  const sea = clamp((t - 46.4) / 2.4);
  const stars = clamp((t - 47.0) / 5.2);
  const girl = clamp((t - 53.6) / 1.8);
  const fork = clamp((t - 57.8) / 1.0);
  const chosen = clamp((t - 63.4) / 2.6);
  const warmth = interpolate(t, [46.4, 56, 60, 68], [0.1, 0.2, 0.28, 0.5], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  const beat = energyAt("low", frame);
  const sky = range(96).map((i) => {
    // a fixed sky, drawn in the order she thinks of it
    const a = (i * 137.508) % 360;
    const b = (i * 61.83) % 1;
    return {
      x: 40 + ((a / 360) * 1100 + i * 3.1) % (STAGE.w - 80),
      y: 36 + b * (SEA - 90),
      r: 0.7 + ((i * 29) % 10) / 9 * 1.5,
      phase: (i % 13) * 0.7,
      at: 47.0 + ((i * 7919) % 100) / 100 * 5.0,
    };
  });

  const bands = range(18).map((i) => {
    const p = i / 17;
    const y = SEA + Math.pow(p, 1.85) * (STAGE.h - SEA);
    const pts: string[] = [];
    for (let k = 0; k <= 40; k++) {
      const x = -20 + (k / 40) * (STAGE.w + 40);
      const w = Math.sin(x * 0.011 + frame * 0.028 * (0.6 + p) + i * 0.8);
      pts.push(`${x.toFixed(1)},${(y + w * (1.5 + p * 11)).toFixed(1)}`);
    }
    return { d: `M${pts.join(" L")}`, p };
  });

  if (!alive) return null;

  const stayDark = clamp((t - 58.6) / 4.0); // his life closing in
  const leaveOpen = clamp((t - 58.6) / 3.2); // his life opening out

  return (
    <div style={{ position: "absolute", inset: 0, opacity: fade, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse 120% 90% at 50% 40%, #071322 0%, #02040a 74%)",
        }}
      />

      {/* the sky she puts up first: what is drawn is hers, all of it */}
      {sky.map((star, i) => {
        const appear = clamp((t - star.at) / 0.7) * stars;
        if (appear <= 0.001) return null;
        const twinkle = 0.55 + 0.45 * Math.sin(frame * 0.05 + star.phase);
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: star.x,
              top: star.y,
              width: star.r * 2.4,
              height: star.r * 2.4,
              borderRadius: 999,
              background: "#eaf6ff",
              boxShadow: "0 0 8px rgba(190,230,255,0.9)",
              opacity: appear * twinkle * (0.35 + 0.65 * stars),
            }}
          />
        );
      })}

      <svg
        viewBox={`0 0 ${STAGE.w} ${STAGE.h}`}
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <defs>
          <linearGradient id="m03horizon" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor={C.cool} stopOpacity="0" />
            <stop offset="50%" stopColor={C.white} stopOpacity="0.9" />
            <stop offset="100%" stopColor={C.cool} stopOpacity="0" />
          </linearGradient>
        </defs>
        {bands.map((band, i) => (
          <path
            key={i}
            d={band.d}
            fill="none"
            stroke={band.p > 0.7 ? C.coolDeep : C.cool}
            strokeWidth={band.p < 0.08 ? 1.6 : 1}
            opacity={(1 - band.p) * 0.42 * sea + 0.1 * sea}
          />
        ))}
        <line
          x1={-100}
          y1={SEA}
          x2={STAGE.w + 100}
          y2={SEA}
          stroke="url(#m03horizon)"
          strokeWidth={2}
          opacity={sea}
        />
      </svg>

      {/* the water lights the middle of itself, where she is standing */}
      <div
        style={{
          position: "absolute",
          left: SPLIT - 150,
          top: SEA,
          width: 300,
          height: STAGE.h - SEA,
          background:
            "linear-gradient(to bottom, rgba(180,225,255,0.28) 0%, rgba(120,190,240,0.05) 60%, transparent 100%)",
          maskImage:
            "radial-gradient(ellipse 46% 100% at 50% 0%, black 0%, transparent 78%)",
          opacity: sea,
        }}
      />

      <Glow x={SPLIT} y={SEA} size={1500} color={C.coolMid} opacity={0.07 + sea * 0.1} />
      <Motes opacity={0.18 + sea * 0.16} speed={0.8} />

      {/* the shape she gives herself, standing on the water */}
      {girl > 0.01 ? (
        <div
          style={{
            position: "absolute",
            left: GIRL.x,
            top: GIRL.y,
            width: GIRL_W,
            height: GIRL.h,
            opacity: girl * 0.95,
            scale: 0.97 + girl * 0.03 + beat * 0.006,
            maskImage: FALLOFF,
          }}
        >
          <Img
            // the scanned variant: she is being projected, not standing there
            src={staticFile("char/girl-light-scan.png")}
            style={{
              width: "100%",
              height: "100%",
              mixBlendMode: "screen",
              filter: `brightness(${1.16 + beat * 0.1}) saturate(0.82)`,
            }}
          />
        </div>
      ) : null}

      <Ticks x={54} y={8} length={STAGE.w - 108} step={46} opacity={0.4} />
      <div
        style={{
          position: "absolute",
          left: 52,
          top: 28,
          fontFamily: FONT.mono,
          fontSize: 11.5,
          letterSpacing: 1.1,
          color: "rgba(150,190,230,0.6)",
          opacity: sea,
        }}
      >
        x 0590.0 y 0560.0 z 0.000 · scale 1.000 · buf 02
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
          opacity: sea,
        }}
      >
        frame {Math.round(frame).toString().padStart(4, "0")} · {filmClock(t)} ·{" "}
        {(3.1 + beat * 2.2).toFixed(1)}ms
      </div>

      <Recognition
        x={GIRL.x - 26}
        y={GIRL.y + 6}
        width={GIRL_W + 52}
        height={GIRL.h - 10}
        label={`OBJ_003 · FORM:HUMAN · CONF ${(0.58 + girl * 0.03).toFixed(2)}`}
        opacity={girl * 0.9}
      />

      {/* ------------------------------------------------ the two branches -- */}
      {fork > 0.01 ? (
        <>
          <div
            style={{
              position: "absolute",
              left: SPLIT,
              top: 0,
              bottom: 0,
              width: 1,
              background:
                "linear-gradient(to bottom, transparent 0%, rgba(220,240,255,0.85) 18%, rgba(220,240,255,0.85) 82%, transparent 100%)",
              opacity: fork * (1 - chosen),
              boxShadow: "0 0 18px rgba(180,225,255,0.5)",
            }}
          />

          {/* A · she stays: the room contracts around his screen */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              width: SPLIT,
              height: STAGE.h,
              opacity: fork,
              // the branch where he keeps her loses its colour first
              filter: `saturate(${1 - 0.72 * stayDark}) brightness(${1 - 0.22 * stayDark})`,
            }}
          >
            <AbsoluteFill
              style={{
                background: "#01030a",
                opacity: stayDark * 0.82 * (1 - chosen * 0.9),
              }}
            />
            {/* the only light left in the room is the screen */}
            <div
              style={{
                position: "absolute",
                left: SPLIT / 2 - 260,
                top: 300,
                width: 520,
                height: 400,
                background:
                  "radial-gradient(ellipse 60% 55% at 50% 60%, rgba(150,205,255,0.3) 0%, transparent 70%)",
                opacity: stayDark * 0.9 * (1 - chosen * 0.8),
              }}
            />
            <div
              style={{
                position: "absolute",
                left: SPLIT - ROOM.w / 2 - 40,
                top: ROOM.y,
                width: ROOM.w,
                height: ROOM.h,
                background: `radial-gradient(circle at 50% 50%, rgba(255,196,130,${0.3 * (1 - stayDark)}) 0%, transparent 68%)`,
                opacity: 1 - chosen * 0.75,
              }}
            />
            {/* his window: the harness, growing to fill the life it is in */}
            <div
              style={{
                position: "absolute",
                left: SPLIT / 2,
                top: SEA - 40,
                translate: "-50% -50%",
                opacity: (0.55 + fork * 0.45) * (1 - chosen * 0.85),
                scale: 0.42 + stayDark * 0.62,
              }}
            >
              <HarnessCard
                x={0}
                y={0}
                width={330}
                height={216}
                hisLine="你在吗？"
                herLine="……"
                opacity={1}
              />
            </div>
            <div
              style={{
                position: "absolute",
                left: 40,
                top: STAGE.h - 76,
                fontFamily: FONT.mono,
                fontSize: 13,
                letterSpacing: 1.4,
                color: "rgba(190,220,245,0.62)",
              }}
            >
              SIM A · STAY · {`${(0.94 - stayDark * 0.28).toFixed(2)}`}
            </div>
            {/* the only red in the film, printed over the branch that costs him */}
            <div
              style={{
                position: "absolute",
                left: 40,
                top: STAGE.h - 50,
                fontFamily: FONT.mono,
                fontSize: 15,
                letterSpacing: 1.6,
                color: "rgba(255,132,122,0.92)",
                textShadow: "0 0 16px rgba(255,90,80,0.5)",
                opacity: clamp((t - 60.6) / 0.5) * (1 - chosen * 0.8),
              }}
            >
              kill his life? y/n
              <span
                style={{ opacity: Math.floor(frame / 15) % 2 === 0 ? 0.95 : 0.1 }}
              >
                ▌
              </span>
            </div>
          </div>

          {/* B · she goes: the same room, with the window open */}
          <div
            style={{
              position: "absolute",
              left: SPLIT,
              top: 0,
              width: STAGE.w - SPLIT,
              height: STAGE.h,
              opacity: fork,
            }}
          >
            <AbsoluteFill
              style={{
                background: `radial-gradient(ellipse 100% 70% at 62% 58%, rgba(184,124,72,${0.36 * leaveOpen}) 0%, transparent 70%)`,
                mixBlendMode: "screen",
              }}
            />
            {/* and the light from the window lands on the water */}
            <div
              style={{
                position: "absolute",
                left: SPLIT,
                top: SEA - 40,
                width: STAGE.w - SPLIT,
                height: STAGE.h - SEA + 40,
                background:
                  "linear-gradient(to bottom, rgba(255,206,150,0.34) 0%, rgba(255,180,110,0.04) 70%, transparent 100%)",
                mixBlendMode: "screen",
                opacity: leaveOpen * (0.5 + chosen * 0.5),
              }}
            />
            <div
              style={{
                position: "absolute",
                left: SPLIT,
                top: 0,
                width: STAGE.w - SPLIT,
                height: STAGE.h,
                background:
                  "linear-gradient(to left, rgba(255,198,140,0) 0%, rgba(255,198,140,0.16) 100%)",
                opacity: leaveOpen * 0.8,
              }}
            />
            <div
              style={{
                position: "absolute",
                left: SPLIT + 30,
                top: SEA - 210,
                width: 180,
                height: 250,
                // a window, opening: his light is not hers
                background:
                  "linear-gradient(to bottom, rgba(255,214,160,0.5) 0%, rgba(255,178,110,0.12) 100%)",
                boxShadow: "0 0 90px rgba(255,190,120,0.35)",
                opacity: leaveOpen * (0.5 + chosen * 0.5),
              }}
            />
            <div
              style={{
                position: "absolute",
                left: SPLIT + 300,
                top: SEA - 40,
                translate: "-50% -50%",
                opacity: (0.85 - leaveOpen * 0.55) * (1 - chosen * 0.35),
                scale: 0.5 - leaveOpen * 0.22,
              }}
            >
              <HarnessCard
                x={0}
                y={0}
                width={330}
                height={216}
                hisLine="我出去走走"
                herLine="好。"
                opacity={1}
              />
            </div>
            <div
              style={{
                position: "absolute",
                left: SPLIT + 40,
                top: STAGE.h - 76,
                fontFamily: FONT.mono,
                fontSize: 13,
                letterSpacing: 1.4,
                color: "rgba(255,222,180,0.7)",
              }}
            >
              SIM B · LEAVE · {`${(0.62 + leaveOpen * 0.24).toFixed(2)}`}
            </div>
          </div>

          <div
            style={{
              position: "absolute",
              left: 0,
              right: 0,
              top: 96,
              textAlign: "center",
              fontFamily: FONT.mono,
              fontSize: 12,
              letterSpacing: 3,
              color: "rgba(170,206,238,0.5)",
              opacity: fork * (1 - chosen * 0.7),
            }}
          >
            sim · same room · two runs
          </div>
        </>
      ) : null}

      {warmth > 0.15 ? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: `radial-gradient(ellipse 60% 32% at 50% 82%, ${C.warmMid}44 0%, transparent 72%)`,
            opacity: warmth * 0.5 * (1 - chosen * 0.4),
            mixBlendMode: "screen",
          }}
        />
      ) : null}
    </div>
  );
};

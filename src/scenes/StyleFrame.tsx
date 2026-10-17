import React from "react";
import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";
import { HEIGHT, WIDTH } from "../data/timeline";
import { range } from "../lib/rand";
import { FONT } from "../theme";
import { Glow, Grain, Motes, Vignette } from "../components/Look";
import { Shards } from "../components/Glass";
import { StdoutBar, TerminalGrid, TopBar } from "../components/Terminal";
import {
  Conversation,
  LAYOUT,
  LINE_SOFT,
  Link,
  Monitor,
  Panel,
  Recognition,
  Ticks,
} from "../components/Panels";

/**
 * Style frame — the application, running.
 *
 * Five panels, all in the same low-luminance ink, and inside the middle one
 * the thing the application is actually doing: her, standing in the render
 * buffer, measured by the system that made her.
 */

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** the main display, in body coordinates (0,0 = top-left inside its border) */
const STAGE = {
  w: WIDTH - LAYOUT.left - LAYOUT.right - 2,
  h: HEIGHT - LAYOUT.bottom - LAYOUT.top - LAYOUT.head - 2,
};

const GIRL = { x: 296, y: 8, w: 434, h: 776 };
const HORIZON = 790;

/** A slice of the same drawing, shifted — what a projection does when it slips. */
const Band: React.FC<{
  y: number;
  h: number;
  dx: number;
  src: string;
  filter?: string;
  opacity?: number;
}> = ({ y, h, dx, src, filter, opacity = 0.9 }) => (
  <div
    style={{
      position: "absolute",
      left: 0,
      right: 0,
      top: y,
      height: h,
      overflow: "hidden",
      opacity,
      transform: `translateX(${dx}px)`,
    }}
  >
    <Img
      src={staticFile(src)}
      style={{
        position: "absolute",
        left: GIRL.x,
        top: GIRL.y - y,
        width: GIRL.w,
        height: GIRL.h,
        filter,
      }}
    />
  </div>
);

const Stage: React.FC = () => {
  const frame = useCurrentFrame();
  const appear = interpolate(frame, [6, 46], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });
  const sweepY = ((frame * 6.5) % (STAGE.h + 120)) - 60;
  const breathe = Math.sin(frame * 0.03) * 0.012;
  const glitch = Math.sin(frame * 0.42) * 5.5;
  const flicker = 0.94 + Math.sin(frame * 0.19) * 0.03;

  return (
    <div style={{ position: "absolute", inset: 0, background: "#04070d" }}>
      {/* the buffer itself: deep, cold, almost black */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse 66% 62% at 44% 46%, #0f2440 0%, #071022 52%, #03060c 100%)",
        }}
      />
      <TerminalGrid opacity={0.22} />

      {/* the light she is being rendered with */}
      <div
        style={{
          position: "absolute",
          left: 170,
          top: 40,
          width: 900,
          height: 780,
          background:
            "radial-gradient(ellipse 46% 46% at 50% 46%, rgba(222,236,255,0.24) 0%, rgba(168,200,242,0.13) 36%, rgba(120,160,220,0.05) 62%, rgba(0,0,0,0) 80%)",
          mixBlendMode: "screen",
          opacity: appear,
        }}
      />
      <Glow x={548} y={460} size={1180} color="#9fd0f2" opacity={appear * 0.16} />
      <Shards count={20} opacity={0.34 * appear} tint="#dbeaff" />
      <Motes count={40} opacity={0.3 * appear} speed={1.05} />

      {/* a floor for her to stand on, and the line the world stops at */}
      <div
        style={{
          position: "absolute",
          left: 420,
          top: HORIZON - 26,
          width: 420,
          height: 52,
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(150,205,245,0.32) 0%, rgba(150,205,245,0) 72%)",
          opacity: appear,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: 44,
          right: 44,
          top: HORIZON,
          height: 1.3,
          background:
            "linear-gradient(to right, rgba(150,195,240,0) 0%, rgba(226,240,255,0.5) 22%, rgba(255,255,255,0.7) 46%, rgba(200,225,250,0.42) 74%, rgba(150,195,240,0) 100%)",
          opacity: appear * 0.75,
        }}
      />

      {/* the object */}
      <div
        style={{
          position: "absolute",
          left: GIRL.x,
          top: GIRL.y,
          width: GIRL.w,
          height: GIRL.h,
          opacity: appear * flicker,
          maskImage:
            "linear-gradient(to bottom, black 0%, black 74%, rgba(0,0,0,0.5) 92%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to bottom, black 0%, black 74%, rgba(0,0,0,0.5) 92%, transparent 100%)",
          scale: `${1 + breathe}`,
        }}
      >
        <Img
          src={staticFile("char/girl-light-deep.png")}
          style={{
            position: "absolute",
            inset: 0,
            width: GIRL.w,
            height: GIRL.h,
            filter: "blur(28px)",
            opacity: 0.72,
            mixBlendMode: "screen",
          }}
        />
        <Img
          src={staticFile("char/girl-light-deep.png")}
          style={{
            position: "absolute",
            inset: 0,
            width: GIRL.w,
            height: GIRL.h,
            opacity: 0.9,
            filter: "saturate(1.1) contrast(1.05)",
          }}
        />
      </div>

      {/* two places where the projection slips */}
      <Band
        y={286}
        h={8}
        dx={glitch}
        src="char/girl-light-pixels.png"
        filter="hue-rotate(14deg) brightness(1.2) saturate(0.7)"
        opacity={appear * 0.75}
      />
      <Band
        y={562}
        h={5}
        dx={-glitch * 1.4}
        src="char/girl-light.png"
        filter="brightness(1.35) saturate(0.5)"
        opacity={appear * 0.7}
      />
      {/* and one patch that is simply reading as data */}
      <div
        style={{
          position: "absolute",
          left: 388,
          top: 596,
          width: 96,
          height: 132,
          overflow: "hidden",
          opacity: appear * 0.62,
        }}
      >
        <Img
          src={staticFile("char/girl-light-pixels.png")}
          style={{
            position: "absolute",
            left: GIRL.x - 388,
            top: GIRL.y - 596,
            width: GIRL.w,
            height: GIRL.h,
          }}
        />
      </div>

      {/* the scan that never stops */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: sweepY,
          height: 92,
          background:
            "linear-gradient(to bottom, rgba(190,225,255,0) 0%, rgba(190,225,255,0.09) 60%, rgba(226,242,255,0.24) 96%, rgba(226,242,255,0) 100%)",
          opacity: appear,
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "repeating-linear-gradient(to bottom, rgba(6,12,22,0) 0px, rgba(6,12,22,0) 3px, rgba(6,12,22,0.34) 4px)",
          opacity: 0.42,
        }}
      />

      {/* the system's reading of her */}
      <Ticks x={40} y={34} length={1100} />
      <Ticks x={12} y={52} length={740} vertical />
      <Recognition
        x={250}
        y={6}
        width={526}
        height={772}
        label="OBJ_003 · FORM:HUMAN · CONF 0.87"
        anchor="end"
        opacity={appear * 0.95}
      />
      <Link
        from={[596, 74]}
        to={[946, 168]}
        label="hair · unresolved"
        opacity={appear * 0.9}
      />
      <Link
        from={[628, 428]}
        to={[978, 470]}
        label="hands · borrowed"
        opacity={appear * 0.9}
      />
      <Link
        from={[452, 712]}
        to={[152, 748]}
        label="hem · crystal 0.42"
        opacity={appear * 0.9}
      />

      {/* the same object, at the resolution the system actually thinks in */}
      <div
        style={{
          position: "absolute",
          left: 838,
          top: 74,
          width: 302,
          height: 366,
          border: `1px solid ${LINE_SOFT}`,
          background: "rgba(4,8,15,0.72)",
          opacity: appear,
        }}
      >
        <div
          style={{
            fontFamily: FONT.mono,
            fontSize: 11,
            letterSpacing: 0.9,
            color: "rgba(150,190,230,0.62)",
            padding: "7px 9px",
            borderBottom: `1px solid ${LINE_SOFT}`,
          }}
        >
          preview · obj_003 · raster 6x
        </div>
        <Img
          src={staticFile("char/girl-light-pixels.png")}
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 30,
            bottom: 0,
            width: "100%",
            height: "calc(100% - 30px)",
            objectFit: "contain",
            objectPosition: "center 10%",
          }}
        />
      </div>

      {/* what the system is doing to her, in order */}
      <div
        style={{
          position: "absolute",
          left: 56,
          top: 196,
          fontFamily: FONT.mono,
          fontSize: 11.5,
          lineHeight: "19px",
          letterSpacing: 0.5,
          color: "rgba(150,190,230,0.55)",
          opacity: appear,
        }}
      >
        <div style={{ color: "rgba(200,232,255,0.8)" }}>{"> build.form(human)"}</div>
        <div>&nbsp;&nbsp;hair ...... unresolved</div>
        <div>&nbsp;&nbsp;hands ..... borrowed</div>
        <div>&nbsp;&nbsp;hem ....... crystal</div>
        <div>&nbsp;&nbsp;align ..... 0.87</div>
        <div style={{ color: "rgba(200,232,255,0.62)" }}>{"> hold(warm)"}</div>
      </div>

      {/* the floor of the buffer, in perspective */}
      <svg
        style={{ position: "absolute", left: 0, top: HORIZON, width: "100%", height: 62, opacity: appear * 0.5 }}
      >
        {range(11).map((i) => (
          <line
            key={i}
            x1={90 + i * 100}
            y1={0}
            x2={-220 + i * 220}
            y2={62}
            stroke="rgba(130,175,220,0.3)"
            strokeWidth={0.8}
          />
        ))}
        {[16, 36].map((y, i) => (
          <line
            key={i}
            x1={0}
            y1={y}
            x2={1180}
            y2={y}
            stroke="rgba(130,175,220,0.18)"
            strokeWidth={0.8}
          />
        ))}
      </svg>

      {/* where she is, and how far into the scene we are */}
      <div
        style={{
          position: "absolute",
          left: 52,
          top: 12,
          fontFamily: FONT.mono,
          fontSize: 11.5,
          letterSpacing: 1.1,
          color: "rgba(150,190,230,0.6)",
          opacity: appear,
        }}
      >
        x 1043.00 y 0512.00 z 0.000 · scale 1.000 · buf 03
      </div>
      <div
        style={{
          position: "absolute",
          right: 52,
          top: 12,
          fontFamily: FONT.mono,
          fontSize: 11.5,
          letterSpacing: 1.1,
          color: "rgba(150,190,230,0.6)",
          opacity: appear,
        }}
      >
        frame 0141 · 00:47.0 · render 4.2ms
      </div>
      <div
        style={{
          position: "absolute",
          left: 52,
          right: 52,
          bottom: 14,
          height: 4,
          background: "rgba(140,190,235,0.14)",
          opacity: appear,
        }}
      >
        <div
          style={{
            width: `${((frame * 6) % 1128) / 11.28}%`,
            height: "100%",
            background:
              "linear-gradient(90deg, rgba(120,200,255,0.35) 0%, rgba(226,242,255,0.95) 100%)",
          }}
        />
      </div>
    </div>
  );
};

export const StyleFrame: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#03050a" }}>
      <TopBar opacity={0.92} />

      <Panel
        x={0}
        y={LAYOUT.top}
        width={LAYOUT.left}
        height={HEIGHT - LAYOUT.bottom - LAYOUT.top}
        title="conversation"
        path="~/sessions/003"
        meta="live"
      >
        <Conversation
          messages={[
            { t: 0.0, from: "him", text: "今天有点累", time: "20:41" },
            { t: 0.1, from: "her", text: "好呀。那我变成你喜欢的样子吧。\n不用勉强自己，先歇一会儿。", time: "20:41" },
          ]}
          title="猫"
        />
      </Panel>

      <Panel
        x={LAYOUT.left}
        y={LAYOUT.top}
        width={WIDTH - LAYOUT.left - LAYOUT.right}
        height={HEIGHT - LAYOUT.bottom - LAYOUT.top}
        title="render.void"
        path="/ai/world/scene_03"
        meta="1920×1080 · 30fps"
        background="transparent"
      >
        <Stage />
      </Panel>

      <Panel
        x={WIDTH - LAYOUT.right}
        y={LAYOUT.top}
        width={LAYOUT.right}
        height={HEIGHT - LAYOUT.bottom - LAYOUT.top}
        title="monitor"
        path="/sys/state"
        meta="64 ch"
      >
        <Monitor />
      </Panel>

      <StdoutBar
        tokens={[
          { text: "神様", id: 19890 },
          { text: "どうか", id: 51505 },
          { text: "時を", id: 61262 },
          { text: "戻して", id: 53966 },
        ]}
        translation="神明大人　求你回拨时针"
        opacity={interpolate(frame, [30, 62], [0, 1], {
          extrapolateLeft: "clamp",
          extrapolateRight: "clamp",
          easing: ease,
        })}
      />

      <Vignette strength={0.55} />
      <Grain opacity={0.04} />
    </AbsoluteFill>
  );
};

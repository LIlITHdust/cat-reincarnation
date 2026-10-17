import React from "react";
import { AbsoluteFill, Img, staticFile, useCurrentFrame } from "remotion";
import { C } from "../theme";
import { Glow, Grain, Motes, Vignette } from "../components/Look";
import {
  ReadoutColumn,
  StdoutBar,
  TerminalGrid,
  TopBar,
} from "../components/Terminal";
import { HarnessCard } from "../components/Harness";
import { Shards } from "../components/Glass";

/**
 * Scratch composition: four ways of putting the supplied illustration into the
 * film's world, one per 30 frames, so they can be compared frame by frame.
 *
 *   00-29  as drawn, with a bloom                — the drawing, pasted in
 *   30-59  re-lit into ice                       — the palette matches
 *   60-89  re-lit, screen-blended, feet dissolving into her own light,
 *          air in front of her                    — she is inside the frame
 *   90-119 the same, projected: every fourth line missing
 */

const H = 880;
const W = H * (662 / 1186);
const X = 1128;
const Y = 96;

const FALLOFF =
  "linear-gradient(to bottom, black 0%, black 58%, rgba(0,0,0,0.72) 78%, rgba(0,0,0,0.18) 93%, transparent 100%)";

export const CharTest: React.FC = () => {
  const frame = useCurrentFrame();
  const mode =
    frame < 30 ? "color" : frame < 60 ? "light" : frame < 90 ? "glow" : "proj";
  const src =
    mode === "color"
      ? "char/girl.png"
      : mode === "proj"
        ? "char/girl-light-scan.png"
        : "char/girl-light.png";
  const screened = mode === "glow" || mode === "proj";

  return (
    <AbsoluteFill style={{ background: C.void }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 76% 60% at 52% 44%, #16283f 0%, #070c16 60%, #020306 100%)",
        }}
      />
      <TerminalGrid opacity={0.3} />
      <div
        style={{
          position: "absolute",
          left: 420,
          top: 20,
          width: 1520,
          height: 1020,
          background:
            "radial-gradient(ellipse 46% 46% at 52% 46%, rgba(226,238,255,0.28) 0%, rgba(170,200,240,0.16) 34%, rgba(110,160,220,0.06) 60%, rgba(0,0,0,0) 80%)",
          mixBlendMode: "screen",
        }}
      />
      <Glow x={1370} y={560} size={1500} color="#9fd0f2" opacity={0.2} />
      <Shards count={24} opacity={0.45} tint="#dbeaff" />

      {/* the floor light she stands in, brighter once she is lighting it */}
      <div
        style={{
          position: "absolute",
          left: X - 110,
          top: Y + H - 14,
          width: W + 220,
          height: 54,
          background:
            "radial-gradient(ellipse 50% 50% at 50% 50%, rgba(168,216,250,0.4) 0%, rgba(168,216,250,0) 72%)",
          opacity: mode === "color" ? 0.75 : 1,
        }}
      />

      <div
        style={{
          position: "absolute",
          left: X,
          top: Y,
          width: W,
          height: H,
          maskImage: screened ? FALLOFF : undefined,
          WebkitMaskImage: screened ? FALLOFF : undefined,
        }}
      >
        <Img
          src={staticFile(src)}
          style={{
            position: "absolute",
            inset: 0,
            width: W,
            height: H,
            filter: "blur(30px)",
            opacity: mode === "color" ? 0.5 : 0.7,
            mixBlendMode: "screen",
            transform: "scale(1.03)",
          }}
        />
        <Img
          src={staticFile(src)}
          style={{
            position: "absolute",
            inset: 0,
            width: W,
            height: H,
            mixBlendMode: screened ? "screen" : "normal",
            filter:
              mode === "color" ? "saturate(0.94)" : "saturate(1.05) brightness(1.02)",
          }}
        />
      </div>

      {/* the air in front of her, so she is in the shot and not on it */}
      <div
        style={{
          position: "absolute",
          left: 940,
          top: 240,
          width: 820,
          height: 700,
          background:
            "radial-gradient(ellipse 50% 50% at 46% 52%, rgba(150,196,240,0.16) 0%, rgba(150,196,240,0) 70%)",
          mixBlendMode: "screen",
          filter: "blur(30px)",
        }}
      />
      <Motes count={64} opacity={0.5} speed={1.15} />

      <HarnessCard
        x={96}
        y={116}
        width={424}
        height={258}
        hisLine="今天有点累"
        herLine="好。那我变成你喜欢的样子吧。"
        scale={0.8}
      />

      <TopBar opacity={0.9} />
      <ReadoutColumn opacity={0.85} highlight={21} />
      <StdoutBar
        tokens={[
          { text: "神様", id: 19890 },
          { text: "どうか", id: 51505 },
          { text: "時を", id: 61262 },
          { text: "戻して", id: 53966 },
        ]}
        translation="神明大人　求你回拨时针"
      />

      <Vignette strength={0.85} />
      <Grain opacity={0.05} />
    </AbsoluteFill>
  );
};

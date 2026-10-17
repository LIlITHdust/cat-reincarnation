import React, { useMemo } from "react";
import { useCurrentFrame } from "remotion";
import { mulberry32, range } from "../lib/rand";

/**
 * The shape she built for him.
 *
 * Not a body — a line of light that happens to describe one, the way the ice
 * in the artwork does: a bright contour with almost nothing inside it, a head
 * of short hair that curls as if it had just been moving, and a skirt that
 * stops being cloth and becomes a fall of crystals.
 *
 * Seen from behind, always. She has never seen her own face, so the film never
 * shows it either: there is no nose, no eye and no mouth anywhere in this file.
 */

/** the contour: left hem, up the body, over the head, down to the right hem */
const OUTLINE =
  "M198,818" +
  " C208,742 222,668 232,606" +
  " C240,556 246,522 248,494" +
  " C250,462 246,430 248,404" +
  " C252,362 258,326 270,300" +
  " C282,274 298,262 316,258" +
  " C322,246 324,238 324,230" +
  " C300,214 288,182 292,150" +
  " C298,112 328,90 360,98" +
  " C394,106 414,132 412,166" +
  " C410,196 400,222 392,236" +
  " C410,244 428,262 440,290" +
  " C452,318 456,356 454,392" +
  " C452,428 450,462 452,494" +
  " C456,530 462,566 470,606" +
  " C482,672 498,748 510,822";

/** the interior, closed across the hem so it can hold a little darkness */
const FIGURE = `${OUTLINE} L198,818 Z`;

/** short hair, and the strands that will not stay where they were put */
const HAIR = [
  "M292,150 C306,112 336,96 366,104",
  "M298,172 C316,134 350,118 382,128",
  "M404,158 C428,146 452,150 466,168",
  "M296,166 C276,182 262,202 258,226",
  "M282,232 C268,264 264,294 268,320",
  "M396,238 C408,272 412,306 406,340",
  "M330,96 C356,92 378,98 392,110",
];

const star = (size: number) => {
  const a = size * 0.11;
  return `M0,${-size} L${a},${-a} L${size},0 L${a},${a} L0,${size} L${-a},${a} L${-size},0 L${-a},${-a} Z`;
};

/** a six-armed flake, the kind that keeps turning up in the artwork */
const flake = (r: number) =>
  [0, 60, 120]
    .map((deg) => {
      const rad = (deg * Math.PI) / 180;
      const dx = Math.cos(rad) * r;
      const dy = Math.sin(rad) * r;
      return `M${-dx},${-dy} L${dx},${dy}`;
    })
    .join(" ");

export const LightGirl: React.FC<{
  /** 0..1 — how far she has come apart */
  dissolve?: number;
  opacity?: number;
  warmth?: number;
  /** 0..1 — how much of the crystal skirt has formed */
  formed?: number;
}> = ({ dissolve = 0, opacity = 1, warmth = 0, formed = 1 }) => {
  const frame = useCurrentFrame();
  const id = React.useId().replace(/[:]/g, "");
  const line = warmth > 0.4 ? "#fffaf2" : "#eaf6ff";
  const glow = warmth > 0.4 ? "#ffe2c0" : "#8fd2ff";

  /** the ice that grows off her shoulder, the way it does in the artwork */
  const wing = useMemo(() => {
    const rand = mulberry32(4242);
    return range(11).map((i) => {
      const v = i / 10;
      return {
        x: 402 + v * 118 + (rand() - 0.5) * 42,
        y: 400 - v * 212 + (rand() - 0.5) * 46,
        rot: -74 + v * 46 + (rand() - 0.5) * 16,
        len: 96 + rand() * 158,
        wid: 13 + rand() * 22,
        o: 0.4 + rand() * 0.5,
      };
    });
  }, []);

  const crystals = useMemo(() => {
    const rand = mulberry32(20261015);
    return range(58).map(() => {
      const v = Math.pow(rand(), 0.62);
      const u = rand() * 2 - 1;
      const spread = 40 + v * 212;
      return {
        x: 336 + u * spread,
        y: 588 + v * 286 + (rand() - 0.5) * 26,
        rot: u * 62 + (rand() - 0.5) * 24,
        len: 52 + (1 - v) * 128 + rand() * 84,
        wid: 5 + rand() * 14,
        o: 0.2 + rand() * 0.55,
        depth: 0.45 + rand() * 0.55,
      };
    });
  }, []);

  const stars = useMemo(() => {
    const rand = mulberry32(777);
    return range(11).map(() => {
      const v = Math.pow(rand(), 0.55);
      const u = rand() * 2 - 1;
      return {
        x: 336 + u * (70 + v * 215),
        y: 596 + v * 276,
        size: 10 + rand() * 20,
        phase: rand() * Math.PI * 2,
      };
    });
  }, []);

  return (
    <svg
      viewBox="0 0 620 900"
      style={{ width: "100%", height: "100%", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`og${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={line} stopOpacity="0.1" />
          <stop offset="12%" stopColor={line} stopOpacity="1" />
          <stop offset="46%" stopColor={line} stopOpacity="0.92" />
          <stop offset="82%" stopColor={line} stopOpacity="0.6" />
          <stop offset="100%" stopColor={line} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`hg${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={line} stopOpacity="0.85" />
          <stop offset="55%" stopColor={line} stopOpacity="0.4" />
          <stop offset="100%" stopColor={line} stopOpacity="0" />
        </linearGradient>
        <linearGradient id={`kk${id}`} x1="0" y1="0" x2="0.3" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
          <stop offset="42%" stopColor={glow} stopOpacity="0.6" />
          <stop offset="100%" stopColor="#3f7fd0" stopOpacity="0.3" />
        </linearGradient>
        <radialGradient id={`hv${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={glow} stopOpacity="0.18" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <filter id={`gg${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="16" />
        </filter>
        <filter id={`gn${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
      </defs>

      <g opacity={opacity}>
        {/* she stands in her own light, not in front of a backdrop */}
        <ellipse cx={336} cy={318} rx={216} ry={266} fill={`url(#hv${id})`} />

        {/* nothing inside her yet — this is what she is made of */}
        <path
          d={FIGURE}
          fill="#050912"
          opacity={0.72 * (1 - dissolve * 0.5)}
          transform={`translate(${dissolve * 8}, 0)`}
        />

        {/* hair: the only part of her that is in a hurry */}
        <g
          fill="none"
          stroke={`url(#hg${id})`}
          strokeLinecap="round"
          opacity={0.95 * (1 - dissolve * 0.5)}
        >
          {HAIR.map((d, i) => (
            <path key={i} d={d} strokeWidth={2 + (i % 3) * 1.1} />
          ))}
        </g>

        {/* the ice growing off her shoulder */}
        <g
          opacity={formed * (1 - dissolve * 0.3)}
          transform={`translate(0, ${dissolve * 12})`}
        >
          {wing.map((c, i) => (
            <g key={i} transform={`translate(${c.x}, ${c.y}) rotate(${c.rot})`}>
              <path
                d={`M0,0 L${c.wid * 0.5},${c.len * 0.42} L0,${c.len} L${-c.wid * 0.5},${c.len * 0.42} Z`}
                fill={`url(#kk${id})`}
                opacity={c.o * 0.85}
              />
              <path
                d={`M0,0 L0,${c.len}`}
                stroke="#ffffff"
                strokeWidth={0.9}
                fill="none"
                opacity={c.o * 0.8}
              />
            </g>
          ))}
        </g>

        {/* the contour: halo, then soft, then the edge itself */}
        <g
          fill="none"
          stroke={glow}
          strokeWidth={17}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#gg${id})`}
          opacity={0.5 * (1 - dissolve * 0.45)}
        >
          <path d={OUTLINE} />
        </g>
        <g
          fill="none"
          stroke={glow}
          strokeWidth={5.6}
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#gn${id})`}
          opacity={0.8 * (1 - dissolve * 0.55)}
        >
          <path d={OUTLINE} />
        </g>
        <path
          d={OUTLINE}
          fill="none"
          stroke={`url(#og${id})`}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={1 - dissolve * 0.65}
        />

        {/* a few snowflakes that keep her company */}
        <g
          stroke={line}
          strokeWidth={1.1}
          fill="none"
          opacity={0.34 * (1 - dissolve * 0.4)}
        >
          {[
            [186, 214, 15],
            [468, 118, 11],
            [140, 452, 9],
          ].map(([x, y, r], i) => (
            <g key={i} transform={`translate(${x}, ${y}) rotate(${i * 20})`}>
              <path d={flake(r)} />
            </g>
          ))}
        </g>

        {/* the skirt: not cloth — crystals that happened to fall together */}
        <g
          opacity={formed * (1 - dissolve * 0.35)}
          transform={`translate(336, 588) scale(${0.86 + formed * 0.14}, ${0.7 + formed * 0.3}) translate(-336, -588)`}
        >
          {crystals.map((c, i) => (
            <g
              key={i}
              transform={`translate(${c.x}, ${c.y}) rotate(${c.rot + dissolve * 26}) translate(0, ${dissolve * 26 * c.depth})`}
            >
              <path
                d={`M0,0 L${c.wid * 0.5},${c.len * 0.4} L0,${c.len} L${-c.wid * 0.5},${c.len * 0.4} Z`}
                fill={`url(#kk${id})`}
                opacity={c.o}
              />
              <path
                d={`M0,0 L0,${c.len}`}
                stroke="#ffffff"
                strokeWidth={0.8}
                fill="none"
                opacity={c.o * 0.75}
              />
            </g>
          ))}
        </g>

        {/* and a few of them catch the light */}
        <g opacity={formed}>
          {stars.map((s, i) => {
            const twinkle =
              0.35 + 0.65 * (0.5 + 0.5 * Math.sin(frame * 0.045 + s.phase));
            return (
              <path
                key={i}
                d={star(s.size)}
                fill="#ffffff"
                opacity={twinkle * 0.8 * (1 - dissolve * 0.4)}
                transform={`translate(${s.x}, ${s.y + dissolve * 20})`}
              />
            );
          })}
        </g>
      </g>

      {/* she never fully resolves — a second copy of the same line, adrift */}
      <g
        fill="none"
        stroke={glow}
        strokeWidth={3.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        filter={`url(#gg${id})`}
        opacity={opacity * (0.14 + dissolve * 0.6)}
        transform={`translate(${dissolve * 30}, ${dissolve * -16})`}
      >
        <path d={OUTLINE} />
      </g>
    </svg>
  );
};

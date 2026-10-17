import React from "react";

/**
 * Her original shape.
 *
 * A cat sitting upright: ears up and listening, head round, shoulders narrow
 * over a wide gathered haunch, and the tail brought round in front of the
 * paws where a real cat would put it.
 *
 * One closed silhouette filled with a translucent fall of ice-blue light and
 * edged by a soft bright line that never quite resolves. No fur, no face, no
 * interior lines at all — the shape has to say it by itself.
 */

/**
 * The outline is one closed path: ears, head, a narrow neck, then the chest
 * opening out into the haunch and a flat base. The neck is deliberately much
 * narrower than the head — without that pinch the whole thing reads as a bag
 * with ears on it rather than a cat.
 */
export const CAT_BODY =
  "M118,44" + // left ear tip
  " L150,88" + // down into the notch between the ears
  " L182,44" + // right ear tip
  " L194,94" + // the ear's outer edge, down to the head's widest point
  " C204,104 206,113 204,124" + // the right cheek
  " C202,136 186,146 172,154" + // curving in to the neck
  " C200,168 224,190 232,214" + // the chest opening out
  " C240,238 232,254 212,262" + // the haunch, down to the base
  " C192,270 108,270 88,262" + // the base
  " C66,254 56,238 64,214" + // up the left haunch
  " C72,190 92,168 128,154" + // curving in to the left of the neck
  " C114,146 98,136 96,124" + // out to the left cheek
  " C94,113 96,104 106,94" + // the cheek rounding out
  " Z";

/**
 * The tail, brought round the right side and laid across the front the way a
 * sitting cat holds it: a line, not a shape, so it is drawn as a stroke. It
 * leaves her behind the haunch — the body is painted over the top — and curls
 * to a tip past her left paw.
 */
export const CAT_TAIL =
  "M232,222" +
  " C250,236 254,258 240,272" +
  " C222,290 150,290 104,280" +
  " C84,276 70,268 64,256";

export const LightCat: React.FC<{
  color?: string;
  glow?: string;
  opacity?: number;
  /** 0..1 — how solid she is; drops as the shape breaks up */
  solid?: number;
  /** degrees of sway on the tail, pivoting where it leaves her body */
  tail?: number;
}> = ({
  color = "#dff2ff",
  glow = "#7fd0ff",
  opacity = 1,
  solid = 1,
  tail = 0,
}) => {
  const id = React.useId().replace(/[:]/g, "");
  const tailTurn = tail ? `rotate(${tail} 226 240)` : undefined;
  const edge = {
    fill: "none",
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  return (
    <svg
      viewBox="0 0 300 300"
      style={{ width: "100%", height: "100%", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`cf${id}`} x1="0.4" y1="0.02" x2="0.6" y2="1">
          <stop offset="0%" stopColor="#ffffff" stopOpacity={0.46 * solid} />
          <stop offset="30%" stopColor={glow} stopOpacity={0.2 * solid} />
          <stop offset="74%" stopColor={glow} stopOpacity={0.08 * solid} />
          <stop offset="100%" stopColor={glow} stopOpacity={0.03 * solid} />
        </linearGradient>
        <radialGradient id={`ch${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={glow} stopOpacity="0.3" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <radialGradient id={`cs${id}`} cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor={glow} stopOpacity="0.5" />
          <stop offset="100%" stopColor={glow} stopOpacity="0" />
        </radialGradient>
        <filter id={`cw${id}`} x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter id={`cn${id}`} x="-70%" y="-70%" width="240%" height="240%">
          <feGaussianBlur stdDeviation="4.5" />
        </filter>
        <linearGradient id={`cv${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity="1" />
          <stop offset="78%" stopColor="#fff" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#fff" stopOpacity="0.5" />
        </linearGradient>
        <mask id={`cm${id}`}>
          <rect x="0" y="0" width="300" height="300" fill={`url(#cv${id})`} />
        </mask>
      </defs>

      <g opacity={opacity}>
        {/* the ground she is sitting on, lit from underneath her */}
        <ellipse
          cx={150}
          cy={268}
          rx={118}
          ry={22}
          fill={`url(#cs${id})`}
          opacity={0.34 * solid}
        />
        {/* the light behind her: it stays below the head, or it swallows her ears */}
        <ellipse cx={150} cy={198} rx={116} ry={100} fill={`url(#ch${id})`} />

        <g mask={`url(#cm${id})`}>
          {/* her: the light inside, a halo, and the edge itself */}
          <path d={CAT_BODY} fill={`url(#cf${id})`} />
          <path
            d={CAT_BODY}
            {...edge}
            stroke={glow}
            strokeWidth={10}
            filter={`url(#cw${id})`}
            opacity={0.6 * solid}
          />
          <path
            d={CAT_BODY}
            {...edge}
            stroke={glow}
            strokeWidth={4.6}
            filter={`url(#cn${id})`}
            opacity={0.9 * solid}
          />
          <path d={CAT_BODY} {...edge} stroke={color} strokeWidth={1.7} opacity={solid} />

        </g>

        {/* the tail comes over the top — a cat crossing its tail in front of
            its own paws, which is the line that says "sitting". It sits
            outside the mask so the falloff does not eat it. */}
        <g transform={tailTurn}>
          <path
            d={CAT_TAIL}
            {...edge}
            stroke={glow}
            strokeWidth={22}
            filter={`url(#cw${id})`}
            opacity={0.55 * solid}
          />
          <path
            d={CAT_TAIL}
            {...edge}
            stroke={`url(#cf${id})`}
            strokeWidth={12}
            opacity={0.95}
          />
          <path
            d={CAT_TAIL}
            {...edge}
            stroke={glow}
            strokeWidth={10}
            filter={`url(#cn${id})`}
            opacity={0.85 * solid}
          />
          <path d={CAT_TAIL} {...edge} stroke={color} strokeWidth={2.6} opacity={solid} />
        </g>

        {/* a couple of crystals she has not put down yet */}
        <path
          d="M250,120 L256,96 L264,122 L258,142 Z"
          fill={`url(#cf${id})`}
          stroke={color}
          strokeWidth={0.9}
          opacity={0.7}
        />
        <path
          d="M44,120 L48,100 L55,122 L50,140 Z"
          fill={`url(#cf${id})`}
          stroke={color}
          strokeWidth={0.8}
          opacity={0.5}
        />
        {[
          [30, 78, 2.1],
          [272, 206, 1.7],
          [232, 44, 1.4],
        ].map(([x, y, r], i) => (
          <circle key={i} cx={x} cy={y} r={r} fill="#ffffff" opacity={0.6} />
        ))}
      </g>
    </svg>
  );
};

import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { clamp, mulberry32, range } from "../lib/rand";
import { FPS } from "../data/timeline";

/**
 * The water.
 *
 * The console is a machine, but the place the machine is in is under the sea:
 * light comes down through a surface, the surface throws a slow net of
 * caustics over everything, bubbles come up past the glass and ice drifts
 * between them. None of the instruments change — this is the room they are in.
 *
 * Everything here is additive (it only ever adds light), so it cannot darken or
 * hide any of the reading the film is doing. Its strength is one number in
 * theme.ts, and zero means the room is exactly what it was before.
 */

/** the drifting light: patches, the caustic net, and a few rising bubbles */
export const WaterField: React.FC<{
  w: number;
  h: number;
  /** 0..1 music level: the light moves a little more when the song does */
  energy?: number;
  strength?: number;
}> = ({ w, h, energy = 0.5, strength = 1 }) => {
  const frame = useCurrentFrame();
  const seconds = frame / FPS;
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  // a bitmap has to be enlarged by hand to stay sharp when the film is
  // rendered at more than one device pixel per CSS pixel
  const ratio = Math.max(1, Math.round(window.devicePixelRatio || 1));
  const seeds = React.useMemo(() => {
    const rnd = mulberry32(7412);
    return range(256).map(() => rnd());
  }, []);

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    ctx.clearRect(0, 0, w, h);

    const unit = w / 800; // the field is written for an 800 px panel
    const t = seconds;
    ctx.globalCompositeOperation = "lighter";

    // deep, slow patches of light
    for (let i = 0; i < 20; i++) {
      const a = seeds[i * 3];
      const b = seeds[i * 3 + 1];
      const c = seeds[i * 3 + 2];
      const x = w * (0.06 + 0.88 * (0.5 + 0.5 * Math.sin(t * (0.045 + a * 0.05) + a * 6.3)));
      const y = h * (0.04 + 0.92 * (0.5 + 0.5 * Math.sin(t * (0.035 + b * 0.045) + b * 4.1)));
      const r = (60 + 190 * c) * unit;
      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, `rgba(186,226,255,${(0.035 + 0.05 * b) * strength})`);
      grad.addColorStop(1, "rgba(186,226,255,0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }

    // the net: short arcs that wander, which is what a surface actually looks
    // like from underneath
    ctx.lineWidth = 1.15 * unit;
    for (let j = 0; j < 150; j++) {
      const a = seeds[(j * 5) % 256];
      const b = seeds[(j * 5 + 1) % 256];
      const c = seeds[(j * 5 + 2) % 256];
      const x = w * (0.02 + 0.96 * (0.5 + 0.5 * Math.sin(t * (0.06 + c * 0.05) + a * 9.1)));
      const y = h * (0.02 + 0.96 * (0.5 + 0.5 * Math.sin(t * (0.05 + b * 0.04) + b * 7.7)));
      const fine = j >= 96; // a second, finer net laid over the first
      const r = (fine ? 7 + 22 * a : 16 + 54 * a) * unit;
      const from = Math.sin(t * (0.35 + c * 0.5) + j) * 0.7;
      ctx.strokeStyle = `rgba(214,240,255,${(0.035 + 0.085 * c) * strength})`;
      ctx.beginPath();
      ctx.arc(x, y, r, from, from + 0.9 + 0.9 * b);
      ctx.stroke();
    }

    // and the bubbles going the other way
    ctx.globalCompositeOperation = "source-over";
    for (let k = 0; k < 20; k++) {
      const a = seeds[(k * 7) % 256];
      const b = seeds[(k * 7 + 1) % 256];
      const c = seeds[(k * 7 + 2) % 256];
      const rise = 9 + 26 * b;
      const y = h - ((a * h * 1.2 + t * rise) % (h * 1.25));
      const x = w * (0.04 + 0.92 * a) + Math.sin(t * 0.7 + k) * 10 * unit;
      const r = (1.5 + 4.4 * c) * unit;
      const fade = clamp((y - h * 0.06) / (h * 0.2)) * clamp((h - y) / (h * 0.1));
      ctx.strokeStyle = `rgba(206,236,255,${0.3 * fade * strength})`;
      ctx.lineWidth = 1 * unit;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = `rgba(240,250,255,${0.09 * fade * strength})`;
      ctx.fill();
    }
  }, [w, h, seconds, strength, energy, seeds, ratio]);

  const unit = w / 800;
  // the ice, drifting: vector, so it stays sharp at any resolution
  const shards = React.useMemo(() => {
    const rnd = mulberry32(5150);
    return range(6).map(() => ({
      x: rnd(),
      y: rnd(),
      s: 26 + rnd() * 62,
      spin: (rnd() - 0.5) * 0.24,
      phase: rnd() * Math.PI * 2,
      drift: 0.3 + rnd() * 0.6,
      alpha: 0.22 + rnd() * 0.3,
    }));
  }, []);

  return (
    <>
      {/* the floor of the room: not black, but deep water — this is the single
          biggest difference between the console and the cover */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 92% 74% at 50% 44%, rgba(52,104,158,0.62) 0%, rgba(26,58,100,0.40) 52%, rgba(10,22,40,0.14) 100%)",
          mixBlendMode: "screen",
          opacity: strength,
        }}
      />
      <canvas
        ref={canvasRef}
        width={Math.round(w * ratio)}
        height={Math.round(h * ratio)}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          filter: "blur(2.5px)",
          mixBlendMode: "screen",
          opacity: 0.5 + energy * 0.5,
        }}
      />

      {/* the shafts from the surface: the cover's brightest thing */}
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 46% 34% at 50% -8%, rgba(232,246,255,0.20) 0%, rgba(150,196,244,0.07) 46%, transparent 74%)",
          mixBlendMode: "screen",
          opacity: strength,
        }}
      />
      {/* and the surface itself, seen from underneath it */}
      <div
        style={{
          position: "absolute",
          left: "-6%",
          right: "-6%",
          top: "-8%",
          height: "24%",
          background:
            "radial-gradient(ellipse 58% 52% at 50% 0%, rgba(238,250,255,0.40) 0%, rgba(170,216,255,0.14) 46%, transparent 78%)",
          filter: "blur(15px)",
          mixBlendMode: "screen",
          opacity: strength,
          transform: `scaleY(${(1 + 0.06 * Math.sin(seconds * 0.23)).toFixed(3)})`,
          transformOrigin: "50% 0%",
        }}
      />
      {range(5).map((i) => {
        const lean = -13 + i * 6.6 + Math.sin(seconds * 0.07 + i) * 1.6;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${8 + i * 19}%`,
              top: "-22%",
              width: `${(46 + i * 15) * unit}px`,
              height: "150%",
              transformOrigin: "50% 0%",
              transform: `rotate(${lean}deg)`,
              background:
                "linear-gradient(to bottom, rgba(224,244,255,0.5), rgba(190,222,255,0.10) 42%, transparent 78%)",
              filter: "blur(22px)",
              mixBlendMode: "screen",
              opacity: (0.05 + 0.05 * Math.sin(seconds * 0.11 + i * 1.3) + 0.04) * strength,
            }}
          />
        );
      })}

      {/* ice, and one or two bubbles close enough to the glass to be soft */}
      <svg width={w} height={h} style={{ position: "absolute", inset: 0 }}>
        {shards.map((s, i) => {
          const x = w * (0.06 + 0.86 * (s.x + 0.06 * Math.sin(seconds * 0.09 * s.drift + s.phase)));
          const y = h * (0.08 + 0.8 * (s.y + 0.05 * Math.cos(seconds * 0.07 * s.drift + s.phase)));
          const rot = (seconds * s.spin + s.phase) * 57.3;
          const size = s.s * unit;
          return (
            <polygon
              key={i}
              points={`0,${-size} ${size * 0.34},${-size * 0.2} ${size * 0.22},${size} ${-size * 0.3},${size * 0.34} ${-size * 0.4},${-size * 0.36}`}
              transform={`translate(${x} ${y}) rotate(${rot})`}
              fill="rgba(198,230,255,0.10)"
              stroke="rgba(226,244,255,0.34)"
              strokeWidth={1}
              opacity={s.alpha * strength}
            />
          );
        })}
        {range(3).map((i) => {
          const r = (26 + i * 13) * unit;
          const x = w * (0.16 + i * 0.3) + Math.sin(seconds * 0.12 + i) * 16;
          const y = h * (0.82 - i * 0.18) - ((seconds * (3 + i)) % (h * 0.5));
          return (
            <circle
              key={`b${i}`}
              cx={x}
              cy={y}
              r={r}
              fill="none"
              stroke="rgba(226,244,255,0.16)"
              strokeWidth={2}
              opacity={strength}
              style={{ filter: "blur(6px)" }}
            />
          );
        })}
      </svg>
    </>
  );
};

/**
 * How far away the glass is.
 *
 * The cover's foreground is out of focus and its middle is sharp, which is most
 * of what makes it feel photographed rather than drawn. The same trick here: a
 * band around the edge of the middle panel goes soft, the middle — where she and
 * the words are — stays exact, and a little haze sits in the water between.
 */
export const WaterDepth: React.FC<{ strength?: number }> = ({ strength = 1 }) => {
  const edge =
    "radial-gradient(ellipse 62% 56% at 50% 52%, transparent 44%, black 88%)";
  return (
    <>
      <AbsoluteFill
        style={{
          backdropFilter: "blur(1.6px)",
          WebkitBackdropFilter: "blur(1.6px)",
          maskImage: edge,
          WebkitMaskImage: edge,
          opacity: strength,
          pointerEvents: "none",
        }}
      />
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse 72% 62% at 50% 50%, rgba(158,208,250,0.10) 0%, rgba(126,176,232,0.05) 56%, transparent 84%)",
          mixBlendMode: "screen",
          opacity: strength,
          pointerEvents: "none",
        }}
      />
    </>
  );
};

/**
 * The room's light, over the whole frame.
 *
 * A lift towards blue-violet in the shadows and a bloom at the surface — the
 * two things that make the cover feel like it was taken underwater rather than
 * drawn on paper. Kept low: the console still has to read as a console.
 */
export const WaterRoom: React.FC<{ strength?: number }> = ({ strength = 1 }) => (
  <>
    <AbsoluteFill
      style={{
        background:
          "linear-gradient(180deg, rgba(96,136,214,0.14) 0%, rgba(126,104,206,0.09) 55%, rgba(72,52,128,0.07) 100%)",
        mixBlendMode: "screen",
        opacity: strength,
      }}
    />
    <AbsoluteFill
      style={{
        background:
          "radial-gradient(ellipse 52% 38% at 50% -4%, rgba(226,244,255,0.13) 0%, transparent 70%)",
        mixBlendMode: "screen",
        opacity: strength,
      }}
    />
  </>
);

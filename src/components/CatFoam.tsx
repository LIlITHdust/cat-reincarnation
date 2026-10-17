import React from "react";
import { useCurrentFrame } from "remotion";
import { CAT_EYE, CAT_PATH, CAT_VIEWBOX } from "../data/catForm";
import { mulberry32, range } from "../lib/rand";
import { arcAt, flattenPath, resample } from "../lib/shape";

/**
 * Her, while she is still a computation.
 *
 * Not a line and not a picture: a few hundred particles that mostly agree on
 * where the edge of a cat is. They travel along that edge, drift off it and
 * come back, brighten and fade, and two of them are her eyes. When `form` is
 * low the particles have not agreed yet and are scattered; when `scatter`
 * rises they leave her on purpose.
 */

/** a long lookup table per curve, so a particle can be placed by arc position */
const K = 420;
/** the whole outline, closed; there is no second curve in this drawing */
const EDGES = [{ table: resample(flattenPath(CAT_PATH), K), share: 1 }];
const BOX = CAT_VIEWBOX;

const TOTAL = EDGES.reduce((n, edge) => n + edge.share, 0);

const buildRest = (count: number) => {
  const rand = mulberry32(31337);
  const out: { edge: number; u: number; amp: number; phase: number; rate: number; size: number }[] = [];
  let edge = 0;
  let used = 0;
  for (let i = 0; i < count; i++) {
    const target = (i / count) * TOTAL;
    while (edge < EDGES.length - 1 && used + EDGES[edge].share < target) {
      used += EDGES[edge].share;
      edge++;
    }
    out.push({
      edge,
      u: rand(),
      amp: 0.5 + rand() * 2.2,
      phase: rand() * Math.PI * 2,
      rate: 0.4 + rand() * 1.5,
      size: 1.0 + rand() * 1.3,
    });
  }
  return out;
};

export const CatFoam: React.FC<{
  box: { x: number; y: number; size: number };
  /** 0..1 — how much of her has been computed */
  form?: number;
  /** 0..1 — how far the particles have left the outline */
  scatter?: number;
  opacity?: number;
  /** music level; moves the drift and the twinkle */
  energy?: number;
  count?: number;
  seed?: number;
}> = ({
  box,
  form = 1,
  scatter = 0,
  opacity = 1,
  energy = 0.5,
  count = 340,
  seed = 0,
}) => {
  const frame = useCurrentFrame();
  const seconds = frame / 30;
  const rest = React.useMemo(() => buildRest(count), [count]);
  const scatterRand = React.useMemo(() => {
    const rand = mulberry32(9001 + seed * 131);
    return range(count).map(() => ({
      x: (rand() - 0.5) * 2,
      y: (rand() - 0.5) * 2,
      spin: (rand() - 0.5) * 2,
    }));
  }, [count, seed]);

  const scale = box.size / BOX.h;
  const flow = 0.012 + energy * 0.03;
  const blink = Math.floor(frame / 9) % 2 === 0 ? 1 : 0;
  const eyeOpen = seconds % 4.5 < 0.16 ? 0.15 : 1;

  return (
    <div style={{ position: "absolute", inset: 0, opacity, pointerEvents: "none" }}>
      {rest.map((p, i) => {
        const edge = EDGES[p.edge];
        const base = arcAt(edge.table, p.u + seconds * flow * p.rate);
        const drift =
          (0.7 + 0.5 * Math.sin(seconds * p.rate * 0.7 + p.phase)) * p.amp * (1 + energy);
        const nx = Math.cos(base.x * 0.05 + p.phase);
        const ny = Math.sin(base.y * 0.05 + p.phase * 1.3);
        const fly = scatter * (40 + p.amp * 26);
        const away = scatterRand[i];
        const x = base.x + nx * drift + away.x * fly;
        const y = base.y + ny * drift + away.y * fly * 0.8 - scatter * scatter * 40;
        const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(frame * 0.05 * p.rate + p.phase));
        const d = p.size * (0.7 + twinkle * 0.6) * (1 - scatter * 0.35);
        // before she is computed the particles sit near the middle, unordered
        const f = form * form;
        const px = box.x + (BOX.x + BOX.w / 2 + (x - (BOX.x + BOX.w / 2)) * f - BOX.x) * scale;
        const py = box.y + (BOX.y + BOX.h / 2 + (y - (BOX.y + BOX.h / 2)) * f - BOX.y) * scale;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: px,
              top: py,
              width: d,
              height: d,
              marginLeft: -d / 2,
              marginTop: -d / 2,
              borderRadius: 999,
              background: "#e8f6ff",
              boxShadow: `0 0 ${3 + twinkle * 5}px rgba(140,212,255,0.75)`,
              opacity: (0.3 + twinkle * 0.7) * (1 - scatter * 0.3),
            }}
          />
        );
      })}

      {[CAT_EYE].map(([ex, ey], i) => {
        const x = box.x + ((ex - BOX.x) / BOX.h) * box.size;
        const y = box.y + ((ey - BOX.y) / BOX.h) * box.size;
        return (
          <div
            key={`eye${i}`}
            style={{
              position: "absolute",
              left: x,
              top: y,
              width: 3.4 * scale,
              height: (3.4 * scale * eyeOpen) * (1 - scatter) * (0.6 + blink * 0.4),
              marginLeft: -1.7 * scale,
              marginTop: -1.7 * scale,
              borderRadius: 999,
              background: "#ffffff",
              boxShadow: "0 0 10px rgba(190,235,255,0.95)",
              opacity: form * form * (1 - scatter),
            }}
          />
        );
      })}
    </div>
  );
};

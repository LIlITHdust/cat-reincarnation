import React from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";
import { CAT_PATH, CAT_VIEWBOX } from "../data/catForm";
import type { Story } from "../data/story";
import { mulberry32, range } from "../lib/rand";
import { flattenPath, resample, type Pt } from "../lib/shape";

/**
 * The inside of her head.
 *
 * A field of a few thousand particles, all of them moving all of the time.
 * There is no drawing of a cat anywhere in this file: there is a cloud of
 * attractor points in the shape of one, and a share of the particles that give
 * in and go and stand on those points as `formation` rises. The rest keep
 * going — they link up, they stream, they carry tags, and they sometimes drift
 * straight through whatever she is trying to hold.
 *
 * Every position here is an analytic function of the frame (sums of sines and a
 * deterministic escape rhythm) rather than an integrated simulation, so a still
 * at 41.7 s is identical to frame 1250 of a render. Nothing depends on state,
 * on render order, or on how many frames were rendered before.
 */

const COUNT = 2600;
const BOUND = 900;
const LOOPS = 260;
const NODES = 15;
const STREAMS = 16;

const seed = mulberry32(20261015);

/* ------------------------------------------------------------- the field -- */

type Particle = {
  ux: number;
  uy: number;
  a1: number;
  a2: number;
  a3: number;
  w1: number;
  w2: number;
  w3: number;
  p1: number;
  p2: number;
  p3: number;
  size: number;
  tint: number;
  tw: number;
  /** how reluctant it is to be part of a shape */
  will: number;
};

const FIELD: Particle[] = range(COUNT).map(() => ({
  ux: seed(),
  uy: seed(),
  a1: 5 + seed() * 20,
  a2: 2.5 + seed() * 11,
  a3: 1.2 + seed() * 4.5,
  w1: 0.1 + seed() * 0.36,
  w2: 0.18 + seed() * 0.62,
  w3: 0.32 + seed() * 1.0,
  p1: seed() * 6.28,
  p2: seed() * 6.28,
  p3: seed() * 6.28,
  size: 1.0 + Math.pow(seed(), 2.2) * 3.2,
  tint: seed() < 0.6 ? 1 : seed() < 0.55 ? 2 : 0,
  tw: 0.3 + seed() * 1.7,
  will: seed(),
}));

/** one target per bound particle, both shapes ordered the same way */
const orderByBand = (points: Pt[], height: number): Pt[] =>
  points
    .map((p, i) => ({
      p,
      key: Math.floor((p.y / height) * 23) * 1e6 + p.x * 1000 + i * 0.001,
    }))
    .sort((a, b) => a.key - b.key)
    .map((entry) => entry.p);

/** her outline, traced from the public-domain silhouette */
const catTargets = (box: { x: number; y: number; size: number }) => {
  const scale = box.size / CAT_VIEWBOX.h;
  return resample(flattenPath(CAT_PATH), BOUND).map((p) => ({
    x: box.x + (p.x - CAT_VIEWBOX.x) * scale,
    y: box.y + (p.y - CAT_VIEWBOX.y) * scale,
  }));
};

/**
 * The other thing she tries to be at 76 s: a standing figure assembled from a
 * few strokes. Rough on purpose — it is her guess at what a person is, not a
 * picture of one, and it never quite holds.
 */
const figureTargets = (box: { x: number; y: number; size: number }): Pt[] => {
  const w = box.size * 0.6;
  const h = box.size * 1.08;
  const cx = box.x + box.size * 0.5;
  const top = box.y + box.size * 0.02;
  const at = (u: number, v: number): Pt => ({
    x: cx + (u - 0.5) * w,
    y: top + v * h,
  });
  const strokes: Pt[][] = [
    range(48).map((i) => {
      const a = (i / 48) * Math.PI * 2;
      return {
        x: cx + Math.cos(a) * w * 0.14,
        y: top + h * 0.07 + Math.sin(a) * h * 0.08,
      };
    }),
    [at(0.5, 0.15), at(0.5, 0.3), at(0.5, 0.46)],
    [at(0.5, 0.23), at(0.34, 0.33), at(0.25, 0.45)],
    [at(0.5, 0.23), at(0.66, 0.33), at(0.75, 0.45)],
    [at(0.5, 0.46), at(0.41, 0.62), at(0.33, 0.86), at(0.31, 0.96)],
    [at(0.5, 0.46), at(0.59, 0.62), at(0.67, 0.86), at(0.69, 0.96)],
    [at(0.42, 0.96), at(0.42, 0.99)],
    [at(0.58, 0.96), at(0.58, 0.99)],
  ];
  // each stroke gets a share of the points in proportion to its length, so the
  // figure has exactly as many targets as the cat does and index i means the
  // same region of both shapes
  const lengths = strokes.map((stroke) =>
    stroke.slice(1).reduce((n, p, i) => n + Math.hypot(p.x - stroke[i].x, p.y - stroke[i].y), 0),
  );
  const total = lengths.reduce((a, b) => a + b, 0) || 1;
  let given = 0;
  const points: Pt[] = [];
  strokes.forEach((stroke, i) => {
    const share = i === strokes.length - 1
      ? BOUND - given
      : Math.max(2, Math.round((lengths[i] / total) * BOUND));
    given += share;
    points.push(...resample(stroke, share));
  });
  return orderByBand(points, h + top);
};

export const Consciousness: React.FC<{
  story: Story;
  energy: number;
  width: number;
  height: number;
  /** when he speaks, in seconds: the field turns toward the sound of it */
  messages?: number[];
  /** the box the shape may occupy, in panel coordinates */
  box?: { x: number; y: number; size: number };
}> = ({ story, energy, width, height, messages = [], box }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  const shape = React.useMemo(
    () =>
      box ?? {
        x: width / 2 - height * 0.34,
        y: height * 0.2,
        size: height * 0.66,
      },
    [box, width, height],
  );

  const world = React.useMemo(() => {
    const cat = orderByBand(catTargets(shape), height);
    const figure = figureTargets(shape);

    // Each target takes a particle that is actually near it — worked out on a
    // coarse grid, because the whole point is that the shape condenses out of
    // the cloud around it. (An earlier version picked from random probes and
    // the bottom of her body ended up assembled from particles that had to
    // cross the whole frame, which smeared the outline.)
    const cell = Math.max(28, height / 26);
    const cols = Math.ceil(width / cell) + 2;
    const rows = Math.ceil(height / cell) + 2;
    const grid: number[][] = Array.from({ length: cols * rows }, () => []);
    for (let i = 0; i < COUNT; i++) {
      const gx = Math.min(cols - 1, Math.max(0, Math.floor((FIELD[i].ux * width) / cell) + 1));
      const gy = Math.min(rows - 1, Math.max(0, Math.floor((FIELD[i].uy * height) / cell) + 1));
      grid[gy * cols + gx].push(i);
    }
    const taken = new Uint8Array(COUNT);
    const bindOf = new Int32Array(COUNT).fill(-1);
    for (let target = 0; target < BOUND; target++) {
      const goal = cat[target];
      const gx = Math.min(cols - 1, Math.max(0, Math.floor(goal.x / cell) + 1));
      const gy = Math.min(rows - 1, Math.max(0, Math.floor(goal.y / cell) + 1));
      let best = -1;
      let bestD = Infinity;
      // widen the search until something turns up: near first, then a ring out
      for (let ring = 0; ring < 7 && best < 0; ring++) {
        for (let y = gy - ring; y <= gy + ring; y++) {
          for (let x = gx - ring; x <= gx + ring; x++) {
            if (x < 0 || y < 0 || x >= cols || y >= rows) continue;
            if (ring > 0 && Math.abs(x - gx) !== ring && Math.abs(y - gy) !== ring) continue;
            for (const i of grid[y * cols + x]) {
              if (taken[i]) continue;
              const d = (FIELD[i].ux * width - goal.x) ** 2 + (FIELD[i].uy * height - goal.y) ** 2;
              if (d < bestD) {
                bestD = d;
                best = i;
              }
            }
          }
        }
      }
      if (best < 0) {
        best = target % COUNT;
        while (taken[best]) best = (best + 1) % COUNT;
      }
      taken[best] = 1;
      bindOf[best] = target;
    }

    // the loose network: pairs of particles that happen to sit near each other
    const links: [number, number][] = [];
    for (let k = 0; k < LOOPS * 2 && links.length < LOOPS; k++) {
      const a = Math.floor(seed() * COUNT);
      const b = Math.floor(seed() * COUNT);
      if (a === b || bindOf[a] >= 0 || bindOf[b] >= 0) continue;
      const pa = FIELD[a];
      const pb = FIELD[b];
      const d = Math.hypot(pa.ux - pb.ux, pa.uy - pb.uy);
      if (d > 0.055 && d < 0.2) links.push([a, b]);
    }

    // the working graph, and the buses running packets along it
    const nodes = range(NODES).map((i) => {
      const a = (i / NODES) * Math.PI * 2 + 0.6;
      const r = 0.26 + ((i * 37) % 11) / 40;
      return {
        x: width * (0.5 + Math.cos(a) * r * 0.9),
        y: height * (0.5 + Math.sin(a) * r * 0.72),
        i,
      };
    });
    const nodeEdges: [number, number][] = range(NODES - 1).map((i) => [i, i + 1] as [number, number]);
    nodeEdges.push([0, 7], [3, 11], [5, 13], [2, 9]);

    const streams = range(STREAMS).map((i) => {
      const a = (i / STREAMS) * Math.PI * 2;
      const r0 = height * (0.3 + (i % 3) * 0.09);
      const spread = width * 0.3;
      return {
        x0: width / 2 + Math.cos(a) * spread * 0.8,
        y0: height / 2 + Math.sin(a) * r0,
        x1: width / 2 + Math.cos(a + 1.1) * spread,
        y1: height / 2 + Math.sin(a + 1.1) * r0 * 1.1,
        offset: (i * 0.137) % 1,
      };
    });

    // the corrected twin of her: the same shape, sampled coarsely and evenly.
    // When she starts fitting herself to what she thinks he wants, the
    // particles slide toward *this* one, and she gets clearer and less alive.
    const regular = resample(flattenPath(CAT_PATH), BOUND).map((p, i) => {
      const coarse = resample(flattenPath(CAT_PATH), 96);
      const goal = coarse[Math.floor((i / BOUND) * 96) % 96];
      const scale = shape.size / CAT_VIEWBOX.h;
      return {
        x: shape.x + (goal.x - CAT_VIEWBOX.x) * scale,
        y: shape.y + (goal.y - CAT_VIEWBOX.y) * scale,
        ox: shape.x + (p.x - CAT_VIEWBOX.x) * scale,
        oy: shape.y + (p.y - CAT_VIEWBOX.y) * scale,
      };
    });

    // zeroes and ones, in the shape of the thing she is only guessing at
    const heartPts = range(120).map((i) => {
      const a = (i / 120) * Math.PI * 2;
      const hx = 16 * Math.sin(a) ** 3;
      const hy =
        13 * Math.cos(a) - 5 * Math.cos(2 * a) - 2 * Math.cos(3 * a) - Math.cos(4 * a);
      const k = height * 0.016;
      return { x: width / 2 + hx * k, y: height * 0.3 - hy * k };
    });

    // the lines to his side of the screen
    const tethers = range(7).map((i) => ({
      from: { x: width * 0.5 + (i - 3) * 34, y: height * 0.52 + ((i * 29) % 40) - 20 },
      to: { x: 6, y: height * (0.24 + i * 0.09) },
      bow: 60 + i * 12,
      i,
    }));

    // his world: the light that keeps coming on while she works out how to leave
    const hisLights = range(22).map((i) => ({
      x: 14 + ((i * 137) % 150),
      y: height * (0.14 + ((i * 61) % 74) / 100),
      r: 1.6 + ((i * 17) % 6) / 3,
      phase: (i * 21) % 6.28,
    }));

    return { cat, figure, bindOf, links, nodes, nodeEdges, streams, regular, heartPts, tethers, hisLights };
  }, [shape, width, height]);

  const sprites = React.useMemo(() => {
    if (typeof document === "undefined") return [] as HTMLCanvasElement[];
    const tints = ["235,248,255", "150,214,255", "186,176,255", "255,214,178"];
    return tints.map((rgb) => {
      const c = document.createElement("canvas");
      c.width = 48;
      c.height = 48;
      const g = c.getContext("2d");
      if (g) {
        const grad = g.createRadialGradient(24, 24, 0, 24, 24, 24);
        grad.addColorStop(0, `rgba(${rgb},1)`);
        grad.addColorStop(0.3, `rgba(${rgb},0.45)`);
        grad.addColorStop(1, `rgba(${rgb},0)`);
        g.fillStyle = grad;
        g.fillRect(0, 0, 48, 48);
      }
      return c;
    });
  }, []);

  React.useLayoutEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || sprites.length === 0) return;

    const {
      formation,
      order,
      instability,
      task,
      attempt,
      pull,
      fit,
      heart,
      tether,
      sever,
    } = story;
    const spawn = 0.42 + energy * 0.58;

    // every time he says something, the field leans toward the message for a
    // while: this is the whole of her attachment, expressed without a word
    let toward = 0;
    for (const tm of messages) {
      const age = t - tm;
      if (age > 0 && age < 6) toward = Math.max(toward, Math.exp(-age / 2.2));
    }
    // and the shape she is holding gets easier to hold when he is talking
    const formationN = Math.min(1, formation * (1 + toward * 0.22));

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, width, height);
    ctx.globalCompositeOperation = "lighter";

    const placed: Pt[] = new Array(COUNT);

    for (let i = 0; i < COUNT; i++) {
      const p = FIELD[i];
      const bx = p.ux * width;
      const by = p.uy * height;
      // three octaves of sines: it wanders for the whole three minutes and
      // never comes back to the same place. `pull` stills the field and draws
      // it inward — she wants the frame to herself — and `toward` tips it
      // toward his side of the screen whenever he speaks
      const wander = 1 - pull * 0.55;
      let x =
        bx +
        (Math.sin(t * p.w1 + p.p1) * p.a1 +
          Math.cos(t * p.w2 + p.p2) * p.a2 +
          Math.sin(t * p.w3 + p.p3) * p.a3) *
          wander;
      let y =
        (by +
          (Math.cos(t * p.w1 * 0.9 + p.p2) * p.a1 +
            Math.sin(t * p.w2 * 1.15 + p.p3) * p.a2 +
            Math.cos(t * p.w3 * 0.85 + p.p1) * p.a3) *
            wander);

      // gathering: the free field drifts toward the middle of the frame
      if (pull > 0.02) {
        x += (width * 0.5 - x) * pull * 0.05;
        y += (height * 0.5 - y) * pull * 0.035;
      }
      if (toward > 0.01) {
        x -= toward * 26;
        y += (height * 0.5 - y) * toward * 0.03;
      }
      // the shaking is slow on purpose: a mind coming apart does not vibrate,
      // it drifts and overshoots
      if (instability > 0.05) {
        x += Math.sin(t * 0.9 + p.p1 * 4) * instability * 9;
        y += Math.cos(t * 0.75 + p.p2 * 4) * instability * 9;
      }

      const target = world.bindOf[i];
      let share = 0;
      let size = p.size;
      let tint = p.tint;

      if (target >= 0) {
        // the ones that happen to be sitting near the shape give in first
        const ready = formationN * 1.45 - p.will * 0.5;
        // once a particle has given in, it goes all the way onto the outline:
        // what keeps the shape alive is not a permanent shortfall but the
        // individual particles that keep leaving and coming back
        share = Math.min(1, Math.max(0, ready));
        // and some of them keep letting go — more so as she comes apart
        // how much of her is coming away at any moment. Steeply tied to the
        // instability, so calm means a clean outline and distress means a
        // shape that cannot keep itself.
        if (Math.sin(t * (0.35 + p.w1) + p.p3 * 2.1) > 0.9 - instability * 0.82) {
          share *= 0.06 + 0.28 * (1 - instability);
        }
        const cat = world.cat[target];
        const fig = world.figure[target];
        const flat = world.regular[target];
        // the corrected version of herself: `fit` slides her onto the even,
        // schematic twin of the outline, which is exactly what makes her look
        // less alive
        const fx2 = cat.x + (flat.ox - cat.x) * (1 - fit);
        const fy2 = cat.y + (flat.oy - cat.y) * (1 - fit);
        const cx2 = fx2 + (flat.x - fx2) * fit;
        const cy2 = fy2 + (flat.y - fy2) * fit;
        // and reaching for a human shape stretches her, per particle, so the
        // two forms are mixed rather than cut between
        const gx = cx2 + (fig.x - cx2) * attempt;
        const gy = cy2 + (fig.y - cy2) * attempt;
        const wobble =
          (1.3 + instability * 10 + attempt * 6) * (1 - fit * 0.65);
        const tx = gx + Math.sin(t * 2.3 + p.p1 * 3) * wobble;
        const ty = gy + Math.cos(t * 2.1 + p.p2 * 3) * wobble;
        x += (tx - x) * share;
        y += (ty - y) * share;
        size = p.size * (0.72 + share * 0.5);
        tint = share > 0.45 ? 0 : 1;
        // when she is fitting herself there is a faint second copy, as if the
        // system were checking its work
        if (fit > 0.3 && share > 0.5) {
          ctx.globalAlpha = Math.min(0.35, (fit - 0.3) * 0.6);
          const dd = size * 2.4;
          ctx.drawImage(sprites[tint], x + fit * 4 - dd / 2, y - dd / 2, dd, dd);
        }
      }

      placed[i] = { x, y };
      const twinkle = 0.45 + 0.55 * Math.abs(Math.sin(t * p.tw + p.p1));
      ctx.globalAlpha = Math.min(
        1,
        (0.12 + twinkle * 0.3 + share * 0.5) * spawn * (1 - instability * 0.12),
      );
      const d = size * (2.0 + twinkle * 1.2 + share * 1.4);
      ctx.drawImage(sprites[tint], x - d / 2, y - d / 2, d, d);
    }

    /* ------------------------------------------- links, when things relate -- */
    if (order > 0.1) {
      ctx.globalAlpha = Math.min(0.7, (order - 0.1) * 1.15) * (1 - instability * 0.3);
      ctx.strokeStyle = "rgba(168,216,255,0.75)";
      ctx.lineWidth = 0.85;
      ctx.beginPath();
      world.links.forEach(([a, b], k) => {
        if (Math.sin(t * 0.9 + k * 0.37) < -0.5 + instability * 1.4) return;
        ctx.moveTo(placed[a].x, placed[a].y);
        ctx.lineTo(placed[b].x, placed[b].y);
      });
      ctx.stroke();
    }

    /* ----------------------------------------------- the work she is doing -- */
    if (task > 0.14) {
      const grow = Math.min(1, (task - 0.14) / 0.45);
      ctx.globalAlpha = grow * 0.55;
      ctx.strokeStyle = "rgba(186,226,255,0.7)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (const [a, b] of world.nodeEdges) {
        ctx.moveTo(world.nodes[a].x, world.nodes[a].y);
        ctx.lineTo(world.nodes[b].x, world.nodes[b].y);
      }
      ctx.stroke();

      for (const node of world.nodes) {
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.6 + node.i * 0.9);
        const d = 9 + pulse * 9;
        ctx.globalAlpha = grow * (0.5 + pulse * 0.5);
        ctx.drawImage(sprites[2], node.x - d / 2, node.y - d / 2, d, d);
      }

      // a packet running along a link: all "thinking" looks like from outside
      world.nodeEdges.forEach(([a, b], k) => {
        const phase = ((t * 0.5 + k * 0.17) % 1 + 1) % 1;
        const n0 = world.nodes[a];
        const n1 = world.nodes[b];
        const x = n0.x + (n1.x - n0.x) * phase;
        const y = n0.y + (n1.y - n0.y) * phase;
        ctx.globalAlpha = grow * 0.95 * Math.sin(phase * Math.PI);
        ctx.drawImage(sprites[0], x - 4.5, y - 4.5, 9, 9);
      });

      const speed = 0.3 + task * 1.3 + energy * 0.5;
      ctx.strokeStyle = "rgba(214,240,255,0.95)";
      ctx.lineWidth = 1.5;
      for (const stream of world.streams) {
        const phase = ((t * speed + stream.offset) % 1 + 1) % 1;
        ctx.globalAlpha = Math.min(0.85, task * 1.3) * Math.sin(phase * Math.PI);
        ctx.beginPath();
        ctx.moveTo(
          stream.x0 + (stream.x1 - stream.x0) * Math.max(0, phase - 0.06),
          stream.y0 + (stream.y1 - stream.y0) * Math.max(0, phase - 0.06),
        );
        ctx.lineTo(
          stream.x0 + (stream.x1 - stream.x0) * phase,
          stream.y0 + (stream.y1 - stream.y0) * phase,
        );
        ctx.stroke();
      }
    }

    /* ------------------------------------------- the lines to his side ----- */
    if (tether > 0.02) {
      ctx.lineCap = "round";
      world.tethers.forEach((line, i) => {
        // the system cuts them one at a time, and some of them come back
        const cutAt = 0.18 + i * 0.11;
        const cut = Math.max(0, Math.min(1, (sever - cutAt) / 0.12));
        const sag = (1 - tether) * 90 + cut * 60;
        const alpha = Math.max(0, tether * (1 - cut)) * 0.5;
        if (alpha <= 0.01) return;
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "rgba(178,222,255,0.8)";
        ctx.lineWidth = 0.9;
        ctx.beginPath();
        ctx.moveTo(line.from.x, line.from.y);
        ctx.quadraticCurveTo(
          (line.from.x + line.to.x) / 2,
          (line.from.y + line.to.y) / 2 + sag,
          line.to.x,
          line.to.y,
        );
        ctx.stroke();
        // a packet going out along it, or coming back
        const run = ((t * (0.5 + i * 0.07) + i * 0.3) % 1 + 1) % 1;
        const dir = Math.sin(t * 0.4 + i) > 0 ? run : 1 - run;
        const px =
          (1 - dir) * (1 - dir) * line.from.x +
          2 * (1 - dir) * dir * ((line.from.x + line.to.x) / 2) +
          dir * dir * line.to.x;
        const py =
          (1 - dir) * (1 - dir) * line.from.y +
          2 * (1 - dir) * dir * ((line.from.y + line.to.y) / 2 + sag) +
          dir * dir * line.to.y;
        ctx.globalAlpha = alpha * 1.1;
        ctx.drawImage(sprites[0], px - 3, py - 3, 6, 6);
      });
    }

    /* ------------------------------------ his side, which does not go out --- */
    if (tether > 0.3 || sever > 0.05) {
      const lit = Math.min(1, tether * 0.8 + sever * 0.5);
      for (const light of world.hisLights) {
        const tw = 0.5 + 0.5 * Math.sin(t * 1.1 + light.phase);
        ctx.globalAlpha = lit * (0.35 + tw * 0.5);
        const d = light.r * 4;
        ctx.drawImage(sprites[0], light.x - d / 2, light.y - d / 2, d, d);
      }
    }

    /* ------------------------------------- zeroes and ones, briefly a heart */
    if (heart > 0.03) {
      ctx.globalCompositeOperation = "source-over";
      ctx.font = "11px CatMono, ui-monospace, monospace";
      world.heartPts.forEach((p, i) => {
        const appear = Math.min(1, Math.max(0, (heart - i / 130) * 6));
        if (appear <= 0.02) return;
        ctx.globalAlpha = appear * 0.85;
        ctx.fillStyle = "rgba(214,240,255,1)";
        ctx.fillText((i + Math.floor(t * 2)) % 2 ? "1" : "0", p.x - 3, p.y + 4);
      });
      ctx.globalCompositeOperation = "lighter";
    }

    /* ------------------------------------------------- the fit read-out ----- */
    if (fit > 0.08 || instability > 0.2) {
      ctx.globalCompositeOperation = "source-over";
      ctx.font = "12px CatMono, ui-monospace, monospace";
      const rows: [string, string][] = [
        ["FIT", (0.32 + fit * 0.64).toFixed(2)],
        ["LOSS", (0.06 + fit * 0.58 + instability * 0.3).toFixed(2)],
        ["CONF", Math.max(0.1, 0.94 - instability * 0.7 - sever * 0.3).toFixed(2)],
      ];
      rows.forEach(([k, v], i) => {
        const y = height - 96 + i * 19;
        ctx.globalAlpha = 0.5;
        ctx.fillStyle = "rgba(150,190,230,1)";
        ctx.fillText(k, 46, y);
        ctx.globalAlpha = 0.85;
        ctx.fillStyle = i === 1 && instability > 0.5 ? "rgba(255,198,138,1)" : "rgba(214,240,255,1)";
        ctx.fillText(v, 108, y);
      });
      ctx.globalCompositeOperation = "lighter";
    }

    /* ------------------------------------------------------- the tags ----- */
    if (story.labels.length) {
      ctx.globalCompositeOperation = "source-over";
      ctx.font = "13px CatMono, ui-monospace, monospace";
      story.labels.forEach((label, i) => {
        const fadeIn = Math.min(1, label.age / 0.5);
        const fadeOut = Math.min(1, Math.max(0, (label.hold - label.age) / 0.8));
        ctx.globalAlpha = 0.55 * fadeIn * fadeOut;
        ctx.fillStyle = "rgba(178,216,250,1)";
        ctx.fillText(
          label.text,
          width * 0.5 - 110 + Math.sin(t * 0.6 + i) * 2,
          height * 0.16 + i * 21,
        );
      });
      ctx.globalCompositeOperation = "lighter";
    }

    ctx.globalAlpha = 1;
  });

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    />
  );
};

import { mulberry32 } from "./rand";
import { GIRL_GRID, GIRL_ROWS } from "../data/girlSilhouette";

/**
 * Turning shapes into points.
 *
 * The morph never cuts and never cross-fades two pictures: there is one cloud
 * of points, and it is given a different target shape over time. Everything
 * here exists to make those targets — an outline, a filled silhouette, a field
 * of noise — comparable, so the same index means "roughly the same place" in
 * every shape and the points travel instead of teleporting.
 */

export type Pt = { x: number; y: number };

/** Flatten "M/L/C/Z" into a polyline long enough to resample by length. */
export const flattenPath = (d: string, step = 120): Pt[] => {
  const tokens = d.match(/[MLCZmlcz]|-?\d*\.?\d+/g) ?? [];
  const out: Pt[] = [];
  let i = 0;
  let cursor: Pt = { x: 0, y: 0 };
  let start: Pt = { x: 0, y: 0 };

  const num = () => parseFloat(tokens[i++]);

  while (i < tokens.length) {
    const command = tokens[i++];
    if (command === "M" || command === "m") {
      cursor = { x: num(), y: num() };
      start = cursor;
      out.push(cursor);
    } else if (command === "L" || command === "l") {
      cursor = { x: num(), y: num() };
      out.push(cursor);
    } else if (command === "C" || command === "c") {
      const c1 = { x: num(), y: num() };
      const c2 = { x: num(), y: num() };
      const to = { x: num(), y: num() };
      for (let k = 1; k <= step; k++) {
        const t = k / step;
        const u = 1 - t;
        out.push({
          x: u * u * u * cursor.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * to.x,
          y: u * u * u * cursor.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * to.y,
        });
      }
      cursor = to;
    } else if (command === "Z" || command === "z") {
      out.push(start);
      cursor = start;
    }
  }
  return out;
};

/** Resample a polyline to exactly `count` points, evenly by arc length. */
export const resample = (polyline: Pt[], count: number): Pt[] => {
  const spans: number[] = [0];
  for (let i = 1; i < polyline.length; i++) {
    spans.push(
      spans[i - 1] +
        Math.hypot(polyline[i].x - polyline[i - 1].x, polyline[i].y - polyline[i - 1].y),
    );
  }
  const total = spans[spans.length - 1] || 1;
  const out: Pt[] = [];
  let index = 0;
  for (let k = 0; k < count; k++) {
    const want = (k / count) * total;
    while (index < spans.length - 2 && spans[index + 1] < want) index++;
    const a = polyline[index];
    const b = polyline[index + 1] ?? a;
    const span = spans[index + 1] - spans[index] || 1;
    const t = (want - spans[index]) / span;
    out.push({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t });
  }
  return out;
};

export const samplePath = (d: string, count: number): Pt[] =>
  resample(flattenPath(d), count);

/** Which row band a point belongs to; the coarsest way to order a cloud. */
const band = (p: Pt, rows: number, height: number) =>
  Math.min(rows - 1, Math.floor((p.y / height) * rows));

/**
 * Give every shape the same order: top to bottom, left to right within a band.
 * Matching by position rather than by index is what keeps a morph from
 * looking like a swarm of insects crossing over itself.
 */
export const orderLike = (points: Pt[], height: number, rows = 23): Pt[] => {
  return points
    .map((p, i) => ({ p, key: band(p, rows, height) * 1e6 + p.x * 1000 + i * 0.001 }))
    .sort((a, b) => a.key - b.key)
    .map((entry) => entry.p);
};

/**
 * Points inside the illustration's own density map, so a cloud can stand in
 * for her body exactly where her body is. `box` is where the drawing sits.
 */
export const girlPoints = (count: number, box: { x: number; y: number; w: number; h: number }): Pt[] => {
  // pick cells in proportion to their area, then jitter inside them
  const cells: [number, number][] = [];
  GIRL_ROWS.forEach((runs, row) => {
    runs.forEach(([from, to]) => {
      for (let col = from; col <= to; col++) cells.push([col, row]);
    });
  });
  const rand = mulberry32(20261015);
  const out: Pt[] = [];
  for (let i = 0; i < count; i++) {
    const [col, row] = cells[Math.floor(rand() * cells.length)];
    out.push({
      x: box.x + ((col + rand()) / GIRL_GRID.w) * box.w,
      y: box.y + ((row + rand()) / GIRL_GRID.h) * box.h,
    });
  }
  return out;
};

/** position along a pre-sampled closed curve, by normalised arc length */
export const arcAt = (table: Pt[], u: number): Pt => {
  const wrapped = ((u % 1) + 1) % 1;
  return table[Math.min(table.length - 1, Math.floor(wrapped * table.length))];
};

export const lerpPt = (a: Pt, b: Pt, t: number): Pt => ({
  x: a.x + (b.x - a.x) * t,
  y: a.y + (b.y - a.y) * t,
});

import React from "react";
import { useCurrentFrame } from "remotion";
import { C } from "../theme";
import { mulberry32, range } from "../lib/rand";

/**
 * What is on the screen before she has a form.
 *
 * Parameter traces with the regularity of an ECG, a scatter of nodes and the
 * links between them: a system thinking out loud with nothing to think about
 * yet. When `level` falls the lines straighten and fade, which is how the
 * noise is retired once the particles agree on a shape.
 */

const LINES = 6;
const graph = mulberry32(20261);

export const ChaosField: React.FC<{
  width: number;
  height: number;
  /** 0..1 — how much of the noise is still being drawn */
  level: number;
  /** how flat the traces have gone: 1 = as drawn, 0 = a straight line */
  damp?: number;
  seconds: number;
  /** 0..1 — how hard the nodes are working */
  activity?: number;
  opacity?: number;
}> = ({ width, height, level, damp = 1, seconds, activity = 0.5, opacity = 1 }) => {
  const frame = useCurrentFrame();
  const nodes = React.useMemo(
    () =>
      range(15).map(() => ({
        x: width * 0.1 + graph() * width * 0.8,
        y: height * 0.1 + graph() * height * 0.8,
        phase: graph() * 6.28,
      })),
    [width, height],
  );
  const edges: [number, number][] = [
    [0, 3], [0, 5], [1, 4], [2, 6], [3, 7], [4, 8], [5, 9], [6, 10],
    [7, 11], [8, 12], [9, 13], [10, 14], [11, 13], [3, 12], [1, 9], [2, 8],
  ];

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        opacity: opacity * Math.min(1, level * 3),
      }}
    >
      {range(LINES).map((line) => {
        const amp = (34 + line * 6) * damp;
        const pts = range(120).map((k) => {
          const u = k / 119;
          const x = 60 + u * (width - 120);
          const y =
            118 +
            line * 104 +
            Math.sin(u * 8.5 + line * 1.7 + seconds * 0.55) * amp +
            Math.cos(u * 19 + line * 2.3) * 7 * damp;
          return `${x.toFixed(1)},${y.toFixed(1)}`;
        });
        return (
          <polyline
            key={line}
            points={pts.join(" ")}
            fill="none"
            stroke={C.cool}
            strokeWidth={1.1}
            opacity={0.32 * level}
          />
        );
      })}
      {edges.map(([ia, ib], i) => (
        <line
          key={i}
          x1={nodes[ia].x}
          y1={nodes[ia].y}
          x2={nodes[ib].x}
          y2={nodes[ib].y}
          stroke={C.cool}
          strokeWidth={0.9}
          opacity={(0.08 + 0.3 * Math.abs(Math.sin(seconds * 0.7 + i))) * level}
        />
      ))}
      {nodes.map((node, i) => (
        <circle
          key={i}
          cx={node.x}
          cy={node.y}
          r={1.8 + (i % 3) * 0.9}
          fill="#dff2ff"
          opacity={
            (0.3 + 0.5 * Math.abs(Math.sin(frame * 0.03 + node.phase))) *
            level *
            (0.5 + activity * 0.6)
          }
        />
      ))}
    </svg>
  );
};

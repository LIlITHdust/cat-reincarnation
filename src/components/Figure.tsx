import React from "react";
import { clamp } from "../lib/rand";

export type Vec = [number, number];

/**
 * A minimal skeleton. Everything that looks like a person in this film is
 * built from these eighteen points, because everything that looks like a
 * person in this film was drawn by her.
 */
export type Pose = {
  head: Vec;
  headR: number;
  neck: Vec;
  shoulderL: Vec;
  shoulderR: Vec;
  elbowL: Vec;
  elbowR: Vec;
  handL: Vec;
  handR: Vec;
  pelvis: Vec;
  hipL: Vec;
  hipR: Vec;
  kneeL: Vec;
  kneeR: Vec;
  footL: Vec;
  footR: Vec;
};

export const POSE_STAND: Pose = {
  head: [100, 56],
  headR: 27,
  neck: [100, 88],
  shoulderL: [73, 104],
  shoulderR: [127, 104],
  elbowL: [65, 164],
  elbowR: [135, 164],
  handL: [61, 222],
  handR: [139, 222],
  pelvis: [100, 218],
  hipL: [86, 218],
  hipR: [114, 218],
  kneeL: [84, 300],
  kneeR: [116, 300],
  footL: [80, 382],
  footR: [120, 382],
};

export const POSE_SEATED: Pose = {
  head: [100, 86],
  headR: 27,
  neck: [100, 118],
  shoulderL: [72, 134],
  shoulderR: [128, 134],
  elbowL: [62, 192],
  elbowR: [138, 192],
  handL: [58, 246],
  handR: [142, 246],
  pelvis: [100, 234],
  hipL: [85, 236],
  hipR: [115, 236],
  kneeL: [80, 300],
  kneeR: [120, 300],
  footL: [76, 358],
  footR: [124, 358],
};

/** Arm coming up towards the viewer — used for the hand on the screen. */
export const POSE_REACH: Pose = {
  ...POSE_STAND,
  elbowR: [150, 148],
  handR: [150, 92],
  elbowL: [66, 168],
  handL: [62, 228],
};

export const POSE_TURNED: Pose = {
  ...POSE_STAND,
  elbowR: [141, 166],
  handR: [146, 226],
  hipL: [84, 216],
  kneeL: [78, 298],
  footL: [72, 380],
};

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

const lerpVec = (a: Vec, b: Vec, t: number): Vec => [
  lerp(a[0], b[0], t),
  lerp(a[1], b[1], t),
];

export const mixPose = (a: Pose, b: Pose, t: number): Pose => {
  const k = clamp(t);
  return {
    head: lerpVec(a.head, b.head, k),
    headR: lerp(a.headR, b.headR, k),
    neck: lerpVec(a.neck, b.neck, k),
    shoulderL: lerpVec(a.shoulderL, b.shoulderL, k),
    shoulderR: lerpVec(a.shoulderR, b.shoulderR, k),
    elbowL: lerpVec(a.elbowL, b.elbowL, k),
    elbowR: lerpVec(a.elbowR, b.elbowR, k),
    handL: lerpVec(a.handL, b.handL, k),
    handR: lerpVec(a.handR, b.handR, k),
    pelvis: lerpVec(a.pelvis, b.pelvis, k),
    hipL: lerpVec(a.hipL, b.hipL, k),
    hipR: lerpVec(a.hipR, b.hipR, k),
    kneeL: lerpVec(a.kneeL, b.kneeL, k),
    kneeR: lerpVec(a.kneeR, b.kneeR, k),
    footL: lerpVec(a.footL, b.footL, k),
    footR: lerpVec(a.footR, b.footR, k),
  };
};

/** A walk cycle built from the standing pose. `phase` is in turns. */
export const walkPose = (phase: number): Pose => {
  const swing = Math.sin(phase * Math.PI * 2);
  const lift = Math.max(0, Math.sin(phase * Math.PI * 2)) * 26;
  const liftBack = Math.max(0, -Math.sin(phase * Math.PI * 2)) * 26;
  const bob = Math.abs(Math.cos(phase * Math.PI * 2)) * 6;
  return {
    ...POSE_STAND,
    head: [100, 56 - bob],
    neck: [100, 88 - bob],
    shoulderL: [73, 104 - bob],
    shoulderR: [127, 104 - bob],
    pelvis: [100, 218 - bob],
    hipL: [86, 218 - bob],
    hipR: [114, 218 - bob],
    kneeL: [84 - swing * 10, 300 - bob - lift * 0.4],
    kneeR: [116 + swing * 10, 300 - bob - liftBack * 0.4],
    footL: [80 - swing * 22, 382 - lift],
    footR: [120 + swing * 22, 382 - liftBack],
    elbowL: [65 + swing * 8, 164],
    elbowR: [135 - swing * 8, 164],
    handL: [61 + swing * 16, 222],
    handR: [139 - swing * 16, 222],
  };
};

const line = (a: Vec, b: Vec) => `M${a[0]},${a[1]}L${b[0]},${b[1]}`;

export type FigureStyle = {
  color: string;
  glow: string;
  /** 0 = crisp lines, 1 = frayed and unresolved */
  fray?: number;
  width?: number;
  opacity?: number;
};

/**
 * Draws a pose. The `fray` value stacks a few offset ghosts on top of the
 * sharp pass, which reads as "rendered from memory" rather than photographed.
 */
export const Figure: React.FC<{
  pose: Pose;
  style: FigureStyle;
  children?: React.ReactNode;
}> = ({ pose, style, children }) => {
  const width = style.width ?? 8;
  const fray = style.fray ?? 0;
  const id = React.useId().replace(/[:]/g, "");

  const skeleton = (
    <>
      <path
        d={line(pose.hipL, pose.kneeL) + line(pose.kneeL, pose.footL)}
        strokeWidth={width}
      />
      <path
        d={line(pose.hipR, pose.kneeR) + line(pose.kneeR, pose.footR)}
        strokeWidth={width}
      />
      <path d={line(pose.hipL, pose.hipR)} strokeWidth={width * 1.1} />
      <path d={line(pose.neck, pose.pelvis)} strokeWidth={width * 1.35} />
      <path d={line(pose.shoulderL, pose.shoulderR)} strokeWidth={width * 1.05} />
      <path
        d={line(pose.shoulderL, pose.elbowL) + line(pose.elbowL, pose.handL)}
        strokeWidth={width * 0.86}
      />
      <path
        d={line(pose.shoulderR, pose.elbowR) + line(pose.elbowR, pose.handR)}
        strokeWidth={width * 0.86}
      />
      <circle
        cx={pose.head[0]}
        cy={pose.head[1]}
        r={pose.headR}
        strokeWidth={width * 0.72}
      />
    </>
  );

  return (
    <svg
      viewBox="0 0 200 400"
      style={{ width: "100%", height: "100%", overflow: "visible" }}
    >
      <defs>
        <linearGradient id={`f${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={style.color} />
          <stop offset="62%" stopColor={style.color} />
          <stop offset="100%" stopColor={style.glow} />
        </linearGradient>
        <filter id={`b${id}`} x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
      </defs>
      <g
        fill="none"
        stroke={`url(#f${id})`}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={style.opacity ?? 1}
        filter={`url(#b${id})`}
      >
        {skeleton}
      </g>
      <g
        fill="none"
        stroke={style.color}
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={(style.opacity ?? 1) * 0.92}
      >
        {skeleton}
      </g>
      {fray > 0.01 ? (
        <g
          fill="none"
          stroke={style.glow}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={fray * 0.5}
          transform={`translate(${fray * 5}, ${-fray * 4})`}
        >
          {skeleton}
        </g>
      ) : null}
      {fray > 0.01 ? (
        <g
          fill="none"
          stroke={style.color}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={fray * 0.32}
          filter={`url(#b${id})`}
          transform={`translate(${-fray * 7}, ${fray * 6})`}
        >
          {skeleton}
        </g>
      ) : null}
      {children}
    </svg>
  );
};

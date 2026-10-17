import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FPS, SCENES, type SceneRange } from "../data/timeline";

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/**
 * One movement inside the middle panel.
 *
 * The frame never cuts: the application stays where it is and only the buffer
 * changes, so the movements dissolve into each other instead of ending. A
 * component outside its own stretch of the song renders nothing at all, which
 * is what keeps a still frame honest at any second of the film.
 */
export const StageSlot: React.FC<{
  scene: keyof typeof SCENES;
  /** seconds of overlap on either side of the movement */
  lead?: number;
  fade?: number;
  children?: React.ReactNode;
}> = ({ scene, lead = 0.6, fade = 0.55, children }) => {
  const frame = useCurrentFrame();
  const seconds = frame / FPS;
  const { from, to } = SCENES[scene] as SceneRange;

  const opacity = interpolate(
    seconds,
    [from, from + fade, to - fade, to],
    [0, 1, 1, 0],
    {
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
      easing: ease,
    },
  );

  if (seconds < from - lead || seconds > to + lead * 0.4) return null;
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>;
};

import React from "react";
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from "remotion";
import { Consciousness } from "../components/Consciousness";
import { Shell, STAGE } from "../components/Shell";
import { storyCurve, type StoryKey } from "../data/story";
import { energyAt } from "../lib/energy";

/**
 * A thirty-four second laboratory of the same field the film runs on.
 *
 * The film takes two minutes forty-eight to go from noise to a cat to noise
 * again; this is the same dramaturgy compressed, so the behaviour of the
 * particles can be judged on its own:
 *
 *   0.0– 7.0  noise, nothing agrees
 *   7.0–13.0  things begin to relate: links, faint structure
 *  13.0–17.0  the name arrives and the outline condenses out of the cloud
 *  17.0–21.0  she holds, and works
 *  21.0–26.0  she reaches for a standing shape, and it does not hold
 *  26.0–30.5  the outline lets go, and the field takes it back
 *  30.5–34.0  almost as it began, and then a few particles find each other
 */

const KEYS: StoryKey[] = [
  [0.0, 0.0, 0.04, 0.06, 0.05],
  [7.0, 0.0, 0.06, 0.08, 0.08],
  [10.0, 0.0, 0.3, 0.1, 0.15],
  [13.0, 0.0, 0.4, 0.1, 0.2],
  [17.0, 1.0, 0.5, 0.08, 0.55],
  [21.0, 1.0, 0.6, 0.16, 0.6],
  [23.5, 0.96, 0.6, 0.3, 0.4],
  [26.0, 0.9, 0.5, 0.6, 0.3],
  [30.5, 0.0, 0.14, 0.32, 0.1],
  [33.0, 0.0, 0.09, 0.14, 0.07],
  [34.0, 0.2, 0.1, 0.12, 0.07],
];

const ATTEMPT: [number, number][] = [
  [21.0, 0.0],
  [23.0, 1.0],
  [25.0, 1.0],
  [27.0, 0.0],
];

export const ParticleCore: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;
  const energy = energyAt("all", frame) * 0.6 + energyAt("mid", frame) * 0.4;
  return (
    <AbsoluteFill style={{ background: "#03050a" }}>
      <Shell
        topStage="FIELD / LAB"
        centerPath="/ai/field/p3000"
        centerMeta="2600 particles · 30fps"
        system={undefined}
      >
        <Consciousness story={storyCurve(KEYS, ATTEMPT, t)} energy={energy} width={STAGE.w} height={STAGE.h} />
      </Shell>
    </AbsoluteFill>
  );
};

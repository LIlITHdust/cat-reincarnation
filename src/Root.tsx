import { Composition } from "remotion";
import { CatReincarnation } from "./CatReincarnation";
import {
  FPS,
  HEIGHT,
  SCENES,
  TOTAL_FRAMES,
  WIDTH,
  f,
} from "./data/timeline";
import { Awaken } from "./scenes/Awaken";
import { CharTest } from "./scenes/CharTest";
import { ConsoleLab } from "./scenes/ConsoleLab";
import { RhythmLab } from "./scenes/RhythmLab";
import { ParticleCore } from "./scenes/ParticleCore";
import { StyleFrame } from "./scenes/StyleFrame";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="CatReincarnation"
        component={CatReincarnation}
        durationInFrames={TOTAL_FRAMES}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="Awaken"
        component={Awaken}
        durationInFrames={f(SCENES.awaken.to - SCENES.awaken.from)}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="StyleFrame"
        component={StyleFrame}
        durationInFrames={90}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="RhythmLab"
        component={RhythmLab}
        durationInFrames={35 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="ConsoleLab"
        component={ConsoleLab}
        durationInFrames={168 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="ParticleCore"
        component={ParticleCore}
        durationInFrames={34 * FPS}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
      <Composition
        id="CharTest"
        component={CharTest}
        durationInFrames={120}
        fps={FPS}
        width={WIDTH}
        height={HEIGHT}
      />
    </>
  );
};

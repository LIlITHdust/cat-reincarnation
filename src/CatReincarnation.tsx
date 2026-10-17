import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import { Dashboard } from "./components/Dashboard";
import { Shell, STAGE } from "./components/Shell";
import { FPS } from "./data/timeline";
import { CLOSED, PURGE_FROM, PURGE_SPAN } from "./data/acts";
import {
  closedAt,
  closesBefore,
  modelAt,
  stageAt,
  typedTitleAt,
} from "./data/acts";
import { energyAt } from "./lib/energy";
import { clamp } from "./lib/rand";

/**
 * The film.
 *
 * An application runs for two minutes and forty-eight seconds. The frame never
 * cuts: the console stays where it is and the windows change what they are
 * showing. His side of the screen is on the left; her inside is in the middle;
 * the song is along the bottom in her own tokens.
 */

/** the clock only counts the time he was actually here */
const timeWithHim = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes.toString().padStart(2, "0")}:${secs.toFixed(1).padStart(4, "0")}`;
};

export const CatReincarnation: React.FC = () => {
  const frame = useCurrentFrame();
  const seconds = frame / FPS;
  const energy = energyAt("all", frame) * 0.6 + energyAt("mid", frame) * 0.4;

  // while the window is closed she does not live: the clock holds still
  const closed = closedAt(seconds);
  const frozenAt =
    CLOSED.find(([from, to]) => seconds >= from && seconds < to)?.[0] ?? seconds;
  const shownTime = closed ? frozenAt : seconds;
  const model = modelAt(seconds);
  // the console edits its own name, and nothing else is drawn over the close:
  // the rule between sessions says everything that needs saying about time
  const name = typedTitleAt(seconds);
  // he asked for everything to be cleared: the console takes itself apart,
  // quickly, from the top down
  const purge = clamp((seconds - PURGE_FROM) / PURGE_SPAN);

  // she types the name of the thing she is — and then takes it back out again,
  // in the same line of output the lyrics come out of
  const TITLE_TEXT = "cat reincarnation";
  const titleVisible = (() => {
    if (seconds < 150.8 || seconds > 156.2) return null;
    if (seconds < 152.6) {
      return {
        text: TITLE_TEXT,
        visible: Math.round(clamp((seconds - 150.8) / 1.5) * TITLE_TEXT.length),
      };
    }
    return {
      text: TITLE_TEXT,
      visible: Math.round(
        clamp(1 - (seconds - 152.8) / 1.9) * TITLE_TEXT.length,
      ),
    };
  })();
  const TITLE = titleVisible;
  const status = closed
    ? "PAUSED"
    : seconds > 132 && seconds < 152
      ? "ERROR"
      : seconds > 100
        ? "WARN"
        : "RUNNING";

  return (
    <AbsoluteFill style={{ background: "#000" }}>
      <Audio src={staticFile("song.mp3")} />

      <Shell
        title={name.text}
        titleCursor={name.editing}
        host={model.host}
        model={model.chip}
        overlay={null}
        purge={purge}
        purgeStart={PURGE_FROM}
        titleLine={TITLE}
        topStage={stageAt(seconds)}
        status={status}
        alarm={status === "ERROR" || closed}
        clockLabel={`WITH YOU ${timeWithHim(shownTime)} / 02:48.0`}
        centerMeta={`${Math.round(energy * 100)}% · ${FPS}fps · closed ×${closesBefore(seconds)}`}

      >
        <Dashboard w={STAGE.w} h={STAGE.h} energy={energy} seconds={seconds} />
      </Shell>

    </AbsoluteFill>
  );
};

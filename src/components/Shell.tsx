import React from "react";
import { AbsoluteFill, Easing, interpolate, useCurrentFrame } from "remotion";
import { FPS, HEIGHT, RATE, SCENES, WIDTH } from "../data/timeline";
import { lyricAt, tokensOf } from "../data/lyrics";
import {
  LOGS,
  MESSAGES,
  MOVEMENTS,
  type Movement,
  filmClock,
  systemAt,
  type SystemState,
} from "../data/session";
import { Grain, Vignette } from "./Look";
import { energyAt } from "../lib/energy";
import { DIVIDER_NOTE, errorAt, warmLyricAt } from "../data/acts";
import { Conversation, LAYOUT, Monitor, Panel } from "./Panels";
import type { ChatMsg } from "./HarnessChat";
import { StdoutBar, TopBar } from "./Terminal";
import { WaterRoom } from "./Water";
import { ATMOSPHERE } from "../theme";

/**
 * The application the whole film runs inside.
 *
 * Five panels: the status strip, the conversation she is actually having, the
 * buffer she is rendering into, the monitor no one reads, and the stream of
 * words coming out of her. Only the middle one is a scene; the other four are
 * the machine, and they never change.
 */

const ease = Easing.bezier(0.16, 1, 0.3, 1);

/** the second he gives her a name; the window title changes on that frame */
const NAMED_AT = 12.6;

/** the inner area of the middle panel, in panel-body coordinates */
export const STAGE = {
  w: WIDTH - LAYOUT.left - LAYOUT.right - 2,
  h: HEIGHT - LAYOUT.bottom - LAYOUT.top - LAYOUT.head - 2,
};

/** what the buffer in the middle is being used for, per movement */
const BUFFER: Record<Movement["key"], string> = {
  awaken: "buffer 000 · empty",
  closer: `1920×1080 · ${FPS}fps`,
  room: `1920×1080 · ${FPS}fps`,
  become: "obj 003 · rebuild",
  colors: "split · 2 views",
  rollback: "release · drain",
  release: `1920×1080 · ${FPS}fps`,
};

const movementAt = (seconds: number): Movement => {
  const index = MOVEMENTS.findIndex((m) => seconds < SCENES[m.key].to);
  return MOVEMENTS[index < 0 ? MOVEMENTS.length - 1 : index];
};

type StdoutOverride = {
  tokens: { text: string; id: number }[];
  translation: string;
  startFrame: number;
  label?: string;
};

export const Shell: React.FC<{
  children?: React.ReactNode;
  /** everything the machine shows. The film's own timeline is the default;
   *  self-contained previews hand in their own script instead. */
  messages?: ChatMsg[];
  windowTitle?: string;
  system?: SystemState;
  stdout?: StdoutOverride;
  topStage?: string;
  status?: string;
  alarm?: boolean;
  clockLabel?: string;
  /** the product's name, or what is left of it */
  title?: string;
  host?: string;
  model?: string;
  /** while the name is being retyped by the console itself */
  titleCursor?: boolean;
  /** the white line printed across a window nobody is looking at */
  overlay?: { line1: string; line2: string; age: number; hold: number } | null;
  /** 0..1 — everything he ever said is being deleted, fastest first */
  purge?: number;
  /** the second the erasing begins */
  purgeStart?: number;
  /** the film's name, typed into the stream and taken back out again */
  titleLine?: { text: string; visible: number } | null;
  /** the window is closed: his side of the screen is not being watched */
  dimChat?: boolean;
  /** 0 open, 1 collapsed into the corner */
  collapse?: number;
  centerPath?: string;
  centerMeta?: string;
  /** skip the boot fade, for previews that start mid-story */
  powerFrom?: number;
}> = ({
  children,
  messages,
  windowTitle,
  system: systemPatch,
  stdout: stdoutOverride,
  topStage,
  status,
  alarm,
  clockLabel,
  title,
  host,
  model,
  titleCursor = false,
  overlay = null,
  purge = 0,
  purgeStart = 0,
  titleLine = null,
  dimChat = false,
  centerPath,
  centerMeta,
  powerFrom = 12,
}) => {
  const frame = useCurrentFrame();
  const seconds = frame / FPS;
  const movement = movementAt(seconds);

  // the application coming up: black, then a window
  const power = interpolate(frame, [powerFrom, powerFrom + 30 * RATE], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: ease,
  });

  const energy = energyAt("all", frame) * 0.6 + energyAt("mid", frame) * 0.4;

  const hit = lyricAt(frame);
  // she does not print a line in one go: the words are generated across the
  // time it takes to sing them, so the stream and the voice stay together
  const lyricChars = hit ? hit.line.jp.length : 1;
  const lyricSpeed = hit
    ? Math.min(1.1, Math.max(0.2, lyricChars / Math.max(1, (hit.line.end - hit.line.start) * FPS * 0.62)))
    : 0.5;
  const lineFade = hit
    ? interpolate(
        seconds,
        [hit.line.start, hit.line.start + 0.45, hit.line.end - 0.5, hit.line.end],
        [0, 1, 1, 0],
        { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease },
      )
    : 0;

  const system: SystemState = systemPatch ?? systemAt(seconds);

  return (
    <AbsoluteFill style={{ background: "#03050a", opacity: power }}>
      <TopBar
        title={title}
        titleDraft={title}
        titleCursor={titleCursor}
        host={host}
        stage={topStage ?? movement.stage}
        clock={`${filmClock(seconds)} / 02:48.0`}
        opacity={0.92}
        status={status}
        alarm={alarm}
        clockLabel={clockLabel}
      />

      <Panel
        x={0}
        y={LAYOUT.top}
        width={LAYOUT.left}
        height={HEIGHT - LAYOUT.bottom - LAYOUT.top}
        title="conversation"
        path="~/sessions/001"
        meta={seconds < 22.2 ? "idle" : "live"}
      >
        <Conversation
          dim={dimChat}
          overlay={overlay}
          purge={purge}
          purgeStart={purgeStart}
          ruleNote={seconds > 156.0 ? DIVIDER_NOTE : undefined}
          messages={messages ?? MESSAGES}
          title={windowTitle ?? (seconds < NAMED_AT ? "新对话" : "猫")}
          model={model ?? "deepecho-4.2-high"}
          session={system.session}
          status={seconds < 22.2 ? "waiting" : "live"}
        />
      </Panel>

      <Panel
        x={LAYOUT.left}
        y={LAYOUT.top}
        width={WIDTH - LAYOUT.left - LAYOUT.right}
        height={HEIGHT - LAYOUT.bottom - LAYOUT.top}
        title="render.void"
        path={centerPath ?? movement.path}
        meta={centerMeta ?? BUFFER[movement.key]}
        background="transparent"
      >
        {children}
      </Panel>

      <Panel
        x={WIDTH - LAYOUT.right}
        y={LAYOUT.top}
        width={LAYOUT.right}
        height={HEIGHT - LAYOUT.bottom - LAYOUT.top}
        title="monitor"
        path="/sys/state"
        meta="64 ch"
      >
        <Monitor
          logs={purge > 0.995 ? [] : LOGS}
          state={system}
          energy={energy}
          blank={purge > 0.995}
        />
      </Panel>

      <StdoutBar
        tokens={stdoutOverride ? stdoutOverride.tokens : hit ? tokensOf(hit.line.jp) : []}
        translation={stdoutOverride ? stdoutOverride.translation : hit ? hit.line.cn : ""}
        startFrame={stdoutOverride ? stdoutOverride.startFrame : hit ? hit.line.start * FPS : 0}
        speed={stdoutOverride ? 0.34 : lyricSpeed}
        alarm={errorAt(seconds)}
        warm={warmLyricAt(seconds)}
        titleLine={titleLine}
        label={
          stdoutOverride
            ? (stdoutOverride.label ?? "stdout · tokens")
            : hit
              ? "stdout · tokens"
              : "stdout · idle"
        }
        opacity={stdoutOverride ? 1 : hit ? lineFade : 0.55}
      />

      <WaterRoom strength={ATMOSPHERE} />
      <Vignette strength={0.55} />
      <Grain opacity={0.04} />
    </AbsoluteFill>
  );
};

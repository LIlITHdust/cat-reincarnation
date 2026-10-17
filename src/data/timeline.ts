export const FPS = 60;
export const WIDTH = 1920;
export const HEIGHT = 1080;

/**
 * Every animation in this film was written against 30 frames per second: the
 * breathing is `Math.sin(frame * 0.05)`, the cursor blinks every 14 frames, the
 * scanline steps every 20. `pace()` hands those expressions a frame counter that
 * still runs at 30 per second, so the film can be rendered at 60 — or 120 —
 * without a single rate changing. All that doubles is how smooth the motion is.
 */
export const RATE = FPS / 30;
export const pace = (frame: number) => frame / RATE;

/**
 * The song is a steady 4/4 pop arrangement grouped into eight-bar phrases.
 * Fitting the detected section boundaries (23.0 / 45.9 / 68.5 / 91.2 / 114.0 /
 * 136.6 / 159.5 s) gives a bar length of 2.84375 s with the first downbeat at
 * 0.25 s. Everything in the film is placed on this grid.
 */
export const BAR_SECONDS = 2.84375;
export const BAR_ZERO = 0.25;

export const bar = (n: number) => BAR_ZERO + (n - 1) * BAR_SECONDS;
export const beat = (barNumber: number, beatIndex: number) =>
  bar(barNumber) + (beatIndex * BAR_SECONDS) / 4;

/** seconds -> frames */
export const f = (seconds: number) => Math.round(seconds * FPS);

/** the last sung line, and where the music fades out */
export const SONG_FADE_START = 159.5;
export const TOTAL_SECONDS = 168;
export const TOTAL_FRAMES = TOTAL_SECONDS * FPS;

export type SceneRange = { from: number; to: number };

/**
 * Seven movements, one per eight-bar phrase. The last one runs past the end of
 * the music on purpose: the reboot happens in silence.
 */
export const SCENES: Record<
  "awaken" | "closer" | "room" | "become" | "colors" | "rollback" | "release",
  SceneRange
> = {
  awaken: { from: 0, to: 23.0 },
  closer: { from: 23.0, to: 45.75 },
  room: { from: 45.75, to: 68.5 },
  become: { from: 68.5, to: 91.25 },
  colors: { from: 91.25, to: 114.0 },
  rollback: { from: 114.0, to: 136.75 },
  release: { from: 136.75, to: TOTAL_SECONDS },
};

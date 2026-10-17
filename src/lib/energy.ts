import { ENERGY, ENERGY_FPS } from "../data/energy";
import { FPS } from "../data/timeline";
import { clamp } from "./rand";

export type Band = "low" | "mid" | "high" | "all";

/** Normalised (0..1) energy of one frequency band at a given frame. */
export const energyAt = (band: Band, frame: number) => {
  const data = ENERGY[band];
  const index = Math.round((frame / FPS) * ENERGY_FPS);
  return clamp((data[index] ?? 0) / 999);
};

/**
 * A smoothed, attack-normalised version: quiet passages stay near zero so it
 * reads as "the music just hit", not "the music is loud".
 */
export const pulseAt = (band: Band, frame: number, window = 24) => {
  const data = ENERGY[band];
  const centre = Math.round((frame / FPS) * ENERGY_FPS);
  let sum = 0;
  let count = 0;
  for (let i = centre - window; i <= centre + window; i++) {
    if (i < 0 || i >= data.length) continue;
    sum += data[i];
    count++;
  }
  const local = count ? sum / count / 999 : 0;
  const now = (data[centre] ?? 0) / 999;
  return clamp(0.5 + (now - local) * 2.2);
};

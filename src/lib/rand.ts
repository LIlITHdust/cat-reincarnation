/** Small deterministic PRNG so every render produces identical noise. */
export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

export const clamp = (v: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, v));

export const range = (n: number) => Array.from({ length: n }, (_, i) => i);

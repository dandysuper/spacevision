/**
 * Deterministic value noise + fractal Brownian motion. No dependencies, no
 * Math.random — the same seed always produces the same terrain, which keeps
 * the world stable across re-renders and between the 3D and AR views.
 */

function hash2(x: number, y: number, seed: number): number {
  const h = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123;
  return h - Math.floor(h);
}

function smoothCurve(t: number): number {
  return t * t * (3 - 2 * t);
}

/** 2D value noise in 0..1. */
export function valueNoise2D(x: number, y: number, seed = 0): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;

  const v00 = hash2(xi, yi, seed);
  const v10 = hash2(xi + 1, yi, seed);
  const v01 = hash2(xi, yi + 1, seed);
  const v11 = hash2(xi + 1, yi + 1, seed);

  const u = smoothCurve(xf);
  const v = smoothCurve(yf);

  const top = v00 + (v10 - v00) * u;
  const bottom = v01 + (v11 - v01) * u;
  return top + (bottom - top) * v;
}

export interface FbmOptions {
  octaves?: number;
  frequency?: number;
  amplitude?: number;
  lacunarity?: number;
  gain?: number;
  seed?: number;
}

/** Fractal Brownian motion, roughly 0..1. */
export function fbm2D(x: number, y: number, options: FbmOptions = {}): number {
  const {
    octaves = 4,
    frequency = 1,
    amplitude = 1,
    lacunarity = 2,
    gain = 0.5,
    seed = 0,
  } = options;

  let total = 0;
  let normalisation = 0;
  let freq = frequency;
  let amp = amplitude;

  for (let i = 0; i < octaves; i += 1) {
    total += valueNoise2D(x * freq, y * freq, seed + i * 13.37) * amp;
    normalisation += amp;
    freq *= lacunarity;
    amp *= gain;
  }

  return normalisation > 0 ? total / normalisation : 0;
}

/** Ridged noise — sharp crests, good for dunes and crater rims. */
export function ridged2D(x: number, y: number, options: FbmOptions = {}): number {
  const value = fbm2D(x, y, options);
  return 1 - Math.abs(value * 2 - 1);
}

/** Deterministic integer hash, used to scatter rocks and dust. */
export function hashInt(value: number): number {
  let h = value | 0;
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/** Small deterministic PRNG for scatter placement. */
export function createRandom(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

import type { ScenePalette } from '../types/scene';
import type { PlanetDerived, PlanetParams } from '../types/planet';

/**
 * 3D scene colours are derived from the planet's physical state, not picked
 * by hand. The base look comes from the authored sky kind (a Mars sky is
 * butterscotch because that is what Mars looks like), then atmosphere
 * thickness, solar irradiance and temperature modulate it so the sliders
 * change the world in a way that reads as physical.
 *
 * These are literal colour values because a renderer needs them — the UI
 * chrome above the canvas still uses only theme tokens.
 */

interface SkyRecipe {
  top: string;
  horizon: string;
  haze: string;
  fog: string;
  ambient: string;
}

const SKY_RECIPES: Record<PlanetParams['sky'], SkyRecipe> = {
  vacuum: {
    top: '#000206',
    horizon: '#01050c',
    haze: '#0a1220',
    fog: '#04070d',
    ambient: '#3a4a60',
  },
  thin: {
    top: '#5a3a1c',
    horizon: '#d09a64',
    haze: '#a87a44',
    fog: '#7c5834',
    ambient: '#b08a5c',
  },
  dense: {
    top: '#1b3d66',
    horizon: '#9cc0d8',
    haze: '#6f97b8',
    fog: '#557a96',
    ambient: '#8fa9c0',
  },
  haze: {
    top: '#54401a',
    horizon: '#e6c084',
    haze: '#b8964c',
    fog: '#8a6f3c',
    ambient: '#b49860',
  },
};

interface GroundRecipe {
  base: string;
  alt: string;
  rock: string;
  dust: string;
  roughness: number;
}

const GROUND_RECIPES: Record<PlanetParams['terrain'], GroundRecipe> = {
  regolith: { base: '#a8a49a', alt: '#7b776e', rock: '#6e6b62', dust: '#c4c0b4', roughness: 1 },
  basalt: { base: '#4a4a52', alt: '#33333a', rock: '#2a2a30', dust: '#5c5c66', roughness: 0.95 },
  dune: { base: '#c07a48', alt: '#8b5029', rock: '#7a4a2e', dust: '#dc9a62', roughness: 1 },
  ice: { base: '#b6cdd9', alt: '#87a3b4', rock: '#6d8896', dust: '#d6e6ee', roughness: 0.35 },
  volcanic: { base: '#3c2823', alt: '#241612', rock: '#170e0c', dust: '#6a3a2a', roughness: 0.9 },
  cratered: { base: '#8f887b', alt: '#655f56', rock: '#57524a', dust: '#b0aa9c', roughness: 1 },
  methane: { base: '#8a7444', alt: '#5e4d2c', rock: '#4a3c22', dust: '#b09454', roughness: 0.7 },
  grass: { base: '#6d8047', alt: '#4d5f34', rock: '#5c6152', dust: '#93a868', roughness: 1 },
  gas: { base: '#b49a72', alt: '#8a7454', rock: '#6b5a40', dust: '#d0b488', roughness: 0.6 },
};

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/** Column-density proxy: surface density times scale height, normalised. */
function thickness(planet: PlanetDerived): number {
  if (planet.atmosphereDensity <= 0) return 0;
  const column = planet.atmosphereDensity * planet.scaleHeightKm;
  if (column <= 0) return 0;
  return clamp(Math.log10(column + 1) / 3, 0, 1);
}

/** Shift a hex colour toward warm or cool by `amount` in −1..1. */
export function tint(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const warmR = clamp(r + amount * 0.22 * (1 - r), 0, 1);
  const warmG = clamp(g + amount * 0.04 * (1 - g) + Math.abs(amount) * 0.02, 0, 1);
  const warmB = clamp(b - amount * 0.2 * b, 0, 1);

  const toHex = (v: number): string =>
    Math.round(clamp(v, 0, 1) * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(warmR)}${toHex(warmG)}${toHex(warmB)}`;
}

/** Scale a hex colour's brightness by `factor`. */
export function shade(color: string, factor: number): string {
  const hex = color.replace('#', '');
  const full = hex.length === 3 ? hex.split('').map((c) => c + c).join('') : hex;
  const toHex = (v: number): string =>
    Math.round(clamp(v * factor, 0, 1) * 255)
      .toString(16)
      .padStart(2, '0');
  return `#${toHex(parseInt(full.slice(0, 2), 16) / 255)}${toHex(
    parseInt(full.slice(2, 4), 16) / 255
  )}${toHex(parseInt(full.slice(4, 6), 16) / 255)}`;
}

export function deriveScenePalette(
  params: PlanetParams,
  planet: PlanetDerived
): ScenePalette {
  const t = thickness(planet);
  const sky = SKY_RECIPES[params.sky];
  const ground = GROUND_RECIPES[params.terrain];

  // Brightness tracks solar irradiance on a log scale so Pluto is genuinely
  // dim and Mercury genuinely blinding.
  const irradiance = clamp(params.solarIrradianceWm2, 0.2, 12000);
  const brightness = clamp(0.28 + Math.log10(irradiance) * 0.26, 0.16, 1.5);

  // Temperature warms the horizon: hot worlds glow, cold ones go slate.
  const tempLean = clamp(params.surfaceTempC / 220, -1, 1.2);

  const skyTop = tint(shade(sky.top, 0.55 + t * 0.7 + brightness * 0.35), tempLean * 0.35);
  const skyHorizon = tint(
    shade(sky.horizon, 0.5 + t * 0.55 + brightness * 0.4),
    tempLean * 0.5
  );
  const hazeColor = tint(shade(sky.haze, 0.45 + t * 0.5 + brightness * 0.3), tempLean * 0.45);

  const groundBase = tint(shade(ground.base, 0.55 + brightness * 0.4), tempLean * 0.22);
  const groundAlt = tint(shade(ground.alt, 0.5 + brightness * 0.35), tempLean * 0.22);
  const rockColor = tint(shade(ground.rock, 0.5 + brightness * 0.3), tempLean * 0.18);
  const dustColor = tint(shade(ground.dust, 0.5 + brightness * 0.35), tempLean * 0.3);

  // Fog hides the terrain edge. Vacuum gets almost none.
  const fogDensity = t === 0 ? 0.0012 : 0.0007 + t * 0.016;

  const sunColor =
    params.solarIrradianceWm2 > 4000
      ? '#f4f7ff'
      : params.solarIrradianceWm2 > 400
        ? '#fff6e6'
        : '#ffd9a8';

  const sunIntensity = clamp(0.6 + Math.log10(irradiance + 1) * 0.66, 0.16, 3.6);
  // Even a thin atmosphere scatters a lot of light; airless worlds keep a
  // small floor so the shaded side does not read as pure black.
  const ambientIntensity = clamp(0.42 + t * 1.5, 0.34, 2.0);

  return {
    skyTop,
    skyHorizon,
    hazeColor,
    fogColor: tint(shade(sky.fog, 0.35 + t * 0.45 + brightness * 0.3), tempLean * 0.3),
    fogDensity,
    groundColor: groundBase,
    groundAlt,
    rockColor,
    dustColor,
    groundRoughness: ground.roughness,
    sunColor,
    sunIntensity,
    ambientColor: tint(sky.ambient, tempLean * 0.4),
    ambientIntensity,
    // These are all daylight scenes. Stars only read to the naked eye once the
    // atmosphere is gone entirely, so anything with air gets a clean sky.
    starOpacity: planet.atmosphereDensity <= 0 ? 1 : 0,
    hazeOpacity: clamp(t * 0.85, 0, 0.92),
    irradiance: brightness,
    thickness: t,
    windStrength: clamp(params.windSpeedMs / 40, 0, 1),
  };
}

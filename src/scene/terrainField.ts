import { fbm2D, ridged2D, createRandom } from '../lib/noise';
import { clamp, smoothstep } from '../lib/math';
import type { TerrainKind } from '../types/planet';

/**
 * A single source of truth for ground elevation. The terrain mesh is built by
 * sampling this, and the walking figure queries the same function so its feet
 * always sit on the visible surface.
 */

export interface TerrainProfile {
  /** Large-scale hill height, metres. */
  relief: number;
  /** Fine detail strength, metres. */
  detail: number;
  /** Noise frequency of the main layer. */
  scale: number;
  /** How sharp the crests are, 0 = rolling, 1 = ridged. */
  ridge: number;
  /** Number of impact craters to stamp. */
  craters: number;
  /** Crater depth relative to relief. */
  craterDepth: number;
  /** Directional bias, radians, for dune fields. */
  direction: number;
}

const PROFILES: Record<TerrainKind, TerrainProfile> = {
  regolith: { relief: 2.4, detail: 0.34, scale: 0.048, ridge: 0.22, craters: 38, craterDepth: 0.95, direction: 0 },
  basalt: { relief: 2.0, detail: 0.35, scale: 0.075, ridge: 0.5, craters: 14, craterDepth: 0.4, direction: 0 },
  dune: { relief: 2.4, detail: 0.14, scale: 0.045, ridge: 0.95, craters: 0, craterDepth: 0, direction: 0.9 },
  ice: { relief: 0.7, detail: 0.08, scale: 0.035, ridge: 0.35, craters: 8, craterDepth: 0.2, direction: 0 },
  volcanic: { relief: 3.0, detail: 0.55, scale: 0.09, ridge: 0.85, craters: 6, craterDepth: 0.7, direction: 0 },
  cratered: { relief: 2.4, detail: 0.34, scale: 0.05, ridge: 0.32, craters: 48, craterDepth: 1.05, direction: 0 },
  methane: { relief: 1.5, detail: 0.16, scale: 0.04, ridge: 0.25, craters: 6, craterDepth: 0.3, direction: 0 },
  grass: { relief: 3.0, detail: 0.34, scale: 0.042, ridge: 0.14, craters: 0, craterDepth: 0, direction: 0 },
  gas: { relief: 0.5, detail: 0.06, scale: 0.025, ridge: 0.05, craters: 0, craterDepth: 0, direction: 1.5 },
};

interface Crater {
  x: number;
  z: number;
  radius: number;
  depth: number;
}

export interface TerrainField {
  heightAt: (x: number, z: number) => number;
  /** Range of the generated surface, used to size the camera. */
  minHeight: number;
  maxHeight: number;
  profile: TerrainProfile;
}

const TERRAIN_EXTENT = 90;

export function createTerrainField(terrain: TerrainKind, seed: number): TerrainField {
  const profile = PROFILES[terrain] ?? PROFILES.regolith;
  const random = createRandom(seed * 7919 + 13);

  const craters: Crater[] = [];
  for (let i = 0; i < profile.craters; i += 1) {
    const angle = random() * Math.PI * 2;
    const distance = Math.sqrt(random()) * TERRAIN_EXTENT * 0.85;
    craters.push({
      x: Math.cos(angle) * distance,
      z: Math.sin(angle) * distance,
      radius: 3 + random() * 11,
      depth: profile.relief * profile.craterDepth * (0.4 + random() * 0.6),
    });
  }

  const heightAt = (x: number, z: number): number => {
    // Dune fields stretch along one axis, so squash the sample coordinate.
    const cos = Math.cos(profile.direction);
    const sin = Math.sin(profile.direction);
    const rx = x * cos - z * sin;
    const rz = x * sin + z * cos;
    const squash = profile.ridge > 0.7 ? 0.32 : 1;

    const base = fbm2D(rx * profile.scale, (rz * profile.scale) / squash, {
      octaves: 5,
      seed,
    });

    const ridged = ridged2D(rx * profile.scale * 1.7, rz * profile.scale * 1.7, {
      octaves: 3,
      seed: seed + 31,
    });

    const blended = base * (1 - profile.ridge) + ridged * profile.ridge;
    const detail = fbm2D(x * 0.42, z * 0.42, { octaves: 2, seed: seed + 77 }) - 0.5;

    let height = (blended - 0.5) * 2 * profile.relief + detail * profile.detail * 2;

    for (let i = 0; i < craters.length; i += 1) {
      const crater = craters[i];
      const dx = x - crater.x;
      const dz = z - crater.z;
      const distanceSq = dx * dx + dz * dz;
      const radiusSq = crater.radius * crater.radius;
      if (distanceSq > radiusSq) continue;

      const normalised = Math.sqrt(distanceSq) / crater.radius;
      // Bowl interior, then a raised rim near the edge.
      const bowl = -crater.depth * (1 - smoothstep(normalised * 1.5));
      const rim =
        crater.depth *
        0.45 *
        Math.exp(-Math.pow((normalised - 0.94) * 7, 2));
      height += bowl + rim;
    }

    // Ease the spawn area flat so the figure never starts on a cliff. Kept
    // tight, because a wide plateau reads as a tabletop in the foreground.
    const centreFalloff = 1 - smoothstep(clamp(Math.hypot(x, z) / 2.2, 0, 1));
    return height * (1 - centreFalloff * 0.45);
  };

  let minHeight = Infinity;
  let maxHeight = -Infinity;
  const probe = 28;
  for (let i = 0; i <= probe; i += 1) {
    for (let j = 0; j <= probe; j += 1) {
      const x = (i / probe - 0.5) * TERRAIN_EXTENT * 2;
      const z = (j / probe - 0.5) * TERRAIN_EXTENT * 2;
      const h = heightAt(x, z);
      if (h < minHeight) minHeight = h;
      if (h > maxHeight) maxHeight = h;
    }
  }

  return { heightAt, minHeight, maxHeight, profile };
}

export { TERRAIN_EXTENT };

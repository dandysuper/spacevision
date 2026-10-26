import { GRAVITATIONAL_CONSTANT } from './constants';

/** Radius that produces this surface gravity for this mass, in metres. */
export function radiusFromGravityAndMass(gravity: number, massKg: number): number {
  const safeG = Math.max(gravity, 1e-4);
  const safeM = Math.max(massKg, 1);
  return Math.sqrt((GRAVITATIONAL_CONSTANT * safeM) / safeG);
}

/** Surface gravity from mass and radius, m/s². */
export function gravityFromMassAndRadius(massKg: number, radiusM: number): number {
  if (radiusM <= 0) return 0;
  return (GRAVITATIONAL_CONSTANT * massKg) / (radiusM * radiusM);
}

/** Escape velocity at the surface, m/s. */
export function escapeVelocity(gravity: number, radiusM: number): number {
  return Math.sqrt(2 * Math.max(gravity, 0) * Math.max(radiusM, 0));
}

/** Circular orbit velocity just above the surface, m/s. */
export function orbitalVelocity(gravity: number, radiusM: number): number {
  return Math.sqrt(Math.max(gravity, 0) * Math.max(radiusM, 0));
}

/** Mean bulk density of a sphere, kg/m³. */
export function bulkDensity(massKg: number, radiusM: number): number {
  if (radiusM <= 0) return 0;
  const volume = (4 / 3) * Math.PI * radiusM * radiusM * radiusM;
  return massKg / volume;
}

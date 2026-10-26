import type { WindModel } from '../types/simulation';

export interface WindInput {
  windSpeedMs: number;
  density: number;
  dragCoefficient: number;
  frontalAreaM2: number;
  totalMassKg: number;
  weightN: number;
}

const RAD_TO_DEG = 180 / Math.PI;

/**
 * Steady-wind loading on a standing figure.
 *
 * Dynamic pressure q = ½ρv². The drag force is q·C_d·A, and the angle the
 * body must lean to balance it is atan(F_wind / W). Once F_wind approaches
 * or exceeds the body's own weight, no lean can save you.
 */
export function deriveWind(input: WindInput): WindModel {
  const density = Math.max(input.density, 0);
  const speed = Math.max(input.windSpeedMs, 0);
  const dynamicPressurePa = 0.5 * density * speed * speed;
  const forceN = dynamicPressurePa * input.dragCoefficient * input.frontalAreaM2;
  const mass = Math.max(input.totalMassKg, 1);
  const accelerationMs2 = forceN / mass;
  const weight = Math.max(input.weightN, 1e-3);
  const leanDeg = Math.atan2(forceN, weight) * RAD_TO_DEG;

  return {
    dynamicPressurePa,
    forceN,
    accelerationMs2,
    leanDeg: Math.min(leanDeg, 89.5),
    overpowering: forceN > weight * 0.75,
  };
}

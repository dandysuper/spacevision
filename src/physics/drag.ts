import { NEGLIGIBLE_DENSITY } from './constants';

/** Quadratic drag force, N. F = ½ρv²C_dA. */
export function dragForce(
  density: number,
  dragCoefficient: number,
  frontalAreaM2: number,
  speed: number
): number {
  if (density < NEGLIGIBLE_DENSITY) return 0;
  return 0.5 * density * dragCoefficient * frontalAreaM2 * speed * speed;
}

/**
 * Terminal velocity for a body falling belly-down, m/s.
 * v_t = √(2mg / ρC_dA). Returns Infinity in vacuum or with no area.
 */
export function terminalVelocity(
  massKg: number,
  gravity: number,
  density: number,
  dragCoefficient: number,
  frontalAreaM2: number
): number {
  const areaTerm = density * dragCoefficient * frontalAreaM2;
  if (density < NEGLIGIBLE_DENSITY || areaTerm <= 0) return Infinity;
  const weight = massKg * gravity;
  if (weight <= 0) return 0;
  return Math.sqrt((2 * weight) / areaTerm);
}

/**
 * Exact fall time from rest under quadratic drag, seconds.
 *
 *   y(t) = (v_t²/g)·ln(cosh(g t / v_t))
 *
 * inverted numerically-stably as
 *   t = (v_t/g)·(X + ln(1 + √(1 − e^(−2X)))),  X = g·h / v_t²
 *
 * In vacuum (v_t = ∞) it degenerates to √(2h/g).
 */
export function fallTime(heightM: number, gravity: number, terminalV: number): number {
  if (heightM <= 0) return 0;
  if (gravity <= 0) return Infinity;
  if (!Number.isFinite(terminalV) || terminalV <= 0) {
    return Math.sqrt((2 * heightM) / gravity);
  }
  const x = (gravity * heightM) / (terminalV * terminalV);
  const inside = Math.max(0, 1 - Math.exp(-2 * x));
  const y = x + Math.log(1 + Math.sqrt(inside));
  return (terminalV / gravity) * y;
}

/**
 * Impact speed after falling `heightM` from rest under quadratic drag, m/s.
 *   v = v_t·√(1 − e^(−2gh/v_t²))
 * Degenerates to √(2gh) in vacuum.
 */
export function impactSpeed(
  heightM: number,
  gravity: number,
  terminalV: number
): number {
  if (heightM <= 0 || gravity <= 0) return 0;
  if (!Number.isFinite(terminalV) || terminalV <= 0) {
    return Math.sqrt(2 * gravity * heightM);
  }
  const x = (2 * gravity * heightM) / (terminalV * terminalV);
  const factor = Math.sqrt(Math.max(0, 1 - Math.exp(-x)));
  return terminalV * factor;
}

/**
 * Speed a body reaches in `timeS` of free fall, capped at terminal velocity.
 * Used by the live simulation integrator.
 */
export function velocityAfter(
  timeS: number,
  gravity: number,
  terminalV: number
): number {
  if (timeS <= 0 || gravity <= 0) return 0;
  if (!Number.isFinite(terminalV) || terminalV <= 0) {
    return gravity * timeS;
  }
  return terminalV * Math.tanh((gravity * timeS) / terminalV);
}

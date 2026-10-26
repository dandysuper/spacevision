import {
  BOUND_FROUDE,
  BOUND_GRAVITY_THRESHOLD,
  BRACE_LEAN_DEG,
  EARTH_GRAVITY,
  HEAVY_GRAVITY_THRESHOLD,
  LEG_LENGTH_RATIO,
  WALK_FROUDE,
} from './constants';
import type { GaitProfile, GaitStyle } from '../types/human';

export interface GaitInput {
  gravity: number;
  heightM: number;
  totalMassKg: number;
  weightN: number;
  frontalAreaM2: number;
  dragCoefficient: number;
  density: number;
  mobilityFactor: number;
  canStand: boolean;
  windLeanDeg: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Cadence of a leg swinging as a physical pendulum:
 *   f = (1/2π)·√(g/L)
 * On the Moon this drops to roughly a third of Earth's cadence, which is
 * exactly why Apollo crews bounced instead of walking.
 */
function pendulumFrequency(gravity: number, legLengthM: number): number {
  if (gravity <= 0 || legLengthM <= 0) return 0.6;
  return Math.sqrt(gravity / legLengthM) / (2 * Math.PI);
}

function pickStyle(input: GaitInput): GaitStyle {
  if (!input.canStand) return 'crawl';
  if (input.windLeanDeg > BRACE_LEAN_DEG) return 'brace';
  if (input.gravity < BOUND_GRAVITY_THRESHOLD) return 'bound';
  if (input.gravity > HEAVY_GRAVITY_THRESHOLD) return 'walk';
  return 'walk';
}

/**
 * Froude-number locomotion model. Preferred walking speed scales as
 * √(g·L), so a 1.8 m human walks at 1.9 m/s on Earth and 0.8 m/s on the Moon.
 * Low gravity switches the body to a bouncing gait with a higher Froude
 * number, longer flight fraction and much greater vertical travel.
 */
export function deriveGait(input: GaitInput): GaitProfile {
  const legLength = Math.max(0.35, input.heightM * LEG_LENGTH_RATIO);
  const style = pickStyle(input);
  const mobility = clamp(input.mobilityFactor, 0.05, 1);

  const froude =
    style === 'bound' || style === 'crawl' ? BOUND_FROUDE : WALK_FROUDE;

  const gravityTerm = Math.max(input.gravity, 0.01);
  let speed = Math.sqrt(froude * gravityTerm * legLength) * mobility;

  // Aerodynamic ceiling: never let drag exceed a third of body weight.
  if (input.density > 0.05) {
    const allowableDrag = Math.max(input.weightN, 1) * 0.33;
    const densityArea = 0.5 * input.density * input.dragCoefficient * input.frontalAreaM2;
    if (densityArea > 0) {
      const dragLimited = Math.sqrt(allowableDrag / densityArea);
      speed = Math.min(speed, dragLimited);
    }
  }

  if (style === 'crawl') speed = Math.min(speed, 0.55);
  if (style === 'brace') speed = Math.min(speed, 0.35);

  speed = clamp(speed, 0.12, 9);

  let frequency = pendulumFrequency(gravityTerm, legLength);
  frequency = clamp(frequency * mobility, 0.35, 2.6);

  // Heavy gravity packs strides together; low gravity stretches them out.
  if (input.gravity > EARTH_GRAVITY) {
    frequency *= clamp(EARTH_GRAVITY / input.gravity, 0.55, 1);
  }

  const strideLength = speed / frequency;
  const contactTime = 0.6 * Math.sqrt(legLength / gravityTerm);

  let flightFraction = 0;
  if (style === 'bound') flightFraction = clamp(0.32 + (BOUND_GRAVITY_THRESHOLD - input.gravity) * 0.06, 0.25, 0.62);
  if (style === 'crawl') flightFraction = 0;

  const verticalOscillation =
    style === 'bound'
      ? clamp(strideLength * 0.22, 0.08, 1.4)
      : clamp(strideLength * 0.055 + 0.02, 0.015, 0.4);

  return {
    style,
    speedMs: speed,
    strideFrequencyHz: frequency,
    strideLengthM: strideLength,
    verticalOscillationM: verticalOscillation,
    contactTimeS: clamp(contactTime, 0.05, 2.4),
    flightFraction,
  };
}

/** Peak ground-reaction force the legs are asked to supply, in N. */
export function peakGroundReaction(
  totalMassKg: number,
  gravity: number,
  contactTimeS: number,
  airtimeS: number
): number {
  const weight = totalMassKg * gravity;
  if (weight <= 0) return 0;
  const cycle = Math.max(contactTimeS, 1e-3) * 2 + airtimeS;
  const ratio = clamp(cycle / Math.max(contactTimeS, 1e-3) / 2, 1, 6);
  return weight * Math.min(ratio, 6);
}

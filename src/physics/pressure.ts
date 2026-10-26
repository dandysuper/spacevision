import { CRUSH_LIMIT_KPA, OVERPRESSURE_LIMIT_KPA } from './constants';
import type { PressureModel, RiskLevel } from '../types/simulation';

export interface PressureInput {
  ambientKpa: number;
  suitPressureKpa: number;
}

const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value));

/**
 * Suit structural load. The shell only feels the *difference* between cabin
 * pressure and ambient, so the delta — not the absolute — decides everything.
 *
 * Positive delta (vacuum outside): the suit balloons, joints stiffen, and past
 * about 85 kPa of differential the wearer can barely bend an elbow.
 * Negative delta (thick atmosphere outside): the suit is being crushed, and
 * the figure loses mobility fast.
 */
export function derivePressure(input: PressureInput): PressureModel {
  const ambient = Math.max(input.ambientKpa, 0);
  const suit = Math.max(input.suitPressureKpa, 0);
  const deltaKpa = suit - ambient;

  const mode: PressureModel['mode'] =
    Math.abs(deltaKpa) < 8 ? 'balanced' : deltaKpa > 0 ? 'internal' : 'external';

  let mobilityFactor: number;
  if (mode === 'balanced') {
    mobilityFactor = 0.96;
  } else if (mode === 'internal') {
    // Ballooning: full mobility until ~25 kPa, then decays to a hard floor.
    const excess = Math.max(0, Math.abs(deltaKpa) - 25);
    mobilityFactor = clamp(1 - excess / 130, 0.08, 1);
  } else {
    // An over-pressured environment compresses the shell from outside, so the
    // joints bind far sooner than they do under internal ballooning.
    const excess = Math.abs(deltaKpa);
    mobilityFactor = clamp(1 - excess / 150, 0.04, 1);
  }

  let risk: RiskLevel = 'nominal';
  let failure = '';

  if (deltaKpa < -CRUSH_LIMIT_KPA) {
    risk = 'fail';
    failure = 'HULL CRUSH — ambient pressure exceeds structural limit';
    mobilityFactor = 0;
  } else if (deltaKpa < -260) {
    risk = 'fail';
    failure = 'SUIT COLLAPSE — differential exceeds shell rating';
    mobilityFactor = Math.min(mobilityFactor, 0.05);
  } else if (deltaKpa < -55) {
    risk = 'warn';
    failure = 'EXTERNAL COMPRESSION — joints binding';
  } else if (deltaKpa > OVERPRESSURE_LIMIT_KPA) {
    risk = 'warn';
    failure = 'OVERPRESSURE — limb articulation lost';
    mobilityFactor = Math.min(mobilityFactor, 0.12);
  } else if (deltaKpa > 45) {
    risk = 'warn';
    failure = 'SUIT BALLOONING — grip and reach degraded';
  }

  return { deltaKpa, mode, mobilityFactor, risk, failure };
}

/**
 * The combined physical model: planet + human + environment forces.
 * Everything here is derived, never hand-authored — the UI reads it and
 * the 3D scene is driven from it.
 */

import type { HumanDerived, HumanParams } from './human';
import type { PlanetDerived, PlanetParams } from './planet';

export type RiskLevel = 'nominal' | 'warn' | 'fail';

export interface WindModel {
  /** Stagnation pressure of the wind, in pascals. */
  dynamicPressurePa: number;
  /** Drag the wind exerts on the standing figure, in newtons. */
  forceN: number;
  /** Lateral acceleration the wind imposes, in m/s². */
  accelerationMs2: number;
  /** Angle the body must lean into the wind, in degrees. */
  leanDeg: number;
  /** True when the wind force exceeds the body's own weight. */
  overpowering: boolean;
}

export type ThermalRisk =
  | 'nominal'
  | 'cold'
  | 'extreme-cold'
  | 'hot'
  | 'extreme-hot';

export interface ThermalModel {
  /** Heat radiated away by the suit, in W. */
  radiativeLossW: number;
  /** Heat carried away by the atmosphere, in W. */
  convectiveLossW: number;
  /** Heat conducted into the ground, in W. */
  conductiveLossW: number;
  /** Total heat leaving the body, in W. */
  totalLossW: number;
  /** Metabolic heat minus losses; positive means overheating. */
  netW: number;
  /** Heat the suit's control system must move to stay in band, in W. */
  controlDemandW: number;
  /** Peak heat the suit's control system can move, in W. */
  controlCapacityW: number;
  /** Temperature the suit would settle at with no active control, in °C. */
  equilibriumC: number;
  risk: ThermalRisk;
  /** Rough time until core temperature leaves the safe band, in minutes. */
  survivalMinutes: number;
}

export type PressureMode = 'internal' | 'balanced' | 'external';

export interface PressureModel {
  /** Suit pressure minus ambient pressure, in kPa. Positive = inflating. */
  deltaKpa: number;
  mode: PressureMode;
  /** 0–1 multiplier on limb mobility caused by suit stiffness. */
  mobilityFactor: number;
  risk: RiskLevel;
  /** Human-readable failure mode, empty when nominal. */
  failure: string;
}

export interface Verdict {
  level: RiskLevel;
  /** Short uppercase headline, terminal voice. */
  headline: string;
  /** One sentence of mechanism. */
  detail: string;
}

export interface PhysicsModel {
  planet: PlanetDerived;
  human: HumanDerived;
  wind: WindModel;
  thermal: ThermalModel;
  pressure: PressureModel;
  verdict: Verdict;
  /** Immutable snapshot of the inputs this model was derived from. */
  params: {
    planet: PlanetParams;
    human: HumanParams;
  };
}

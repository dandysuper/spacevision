/**
 * Human + suit parameters, and the biomechanical quantities derived from them
 * once a planet's gravity, atmosphere and terrain are known.
 */

export type GaitStyle = 'walk' | 'lope' | 'bound' | 'crawl' | 'brace';

export interface HumanParams {
  id: string;
  name: string;
  /** Body mass in kg, excluding the suit. */
  bodyMassKg: number;
  /** Standing height in m. */
  heightM: number;
  /** Total mass of the pressure suit and life-support pack in kg. */
  suitMassKg: number;
  /** Drag coefficient of the suited body. */
  dragCoefficient: number;
  /** Mechanical work the legs can deliver in a single jump, in joules. */
  legEnergyJ: number;
  /** Internal suit pressure in kPa. */
  suitPressureKpa: number;
  /** Thermal insulation of the suit in clo (1 clo = 0.155 m²K/W). */
  suitInsulationClo: number;
  /** Metabolic heat output while working, in watts. */
  metabolicRateW: number;
  /** Peak heat the suit's thermal control system can move, in watts. */
  thermalControlW: number;
  /** Peak leg force the wearer can apply, in multiples of body weight. */
  legStrengthRatio: number;
}

export interface GaitProfile {
  style: GaitStyle;
  /** Preferred locomotion speed in m/s. */
  speedMs: number;
  /** Steps per second. */
  strideFrequencyHz: number;
  /** Distance covered per full stride in m. */
  strideLengthM: number;
  /** Peak vertical travel of the centre of mass per stride, in m. */
  verticalOscillationM: number;
  /** Duration of one ground contact in seconds. */
  contactTimeS: number;
  /** Fraction of the cycle spent airborne. */
  flightFraction: number;
}

export interface HumanDerived {
  /** Body + suit mass. */
  totalMassKg: number;
  /** Weight on this planet, in newtons. */
  weightN: number;
  /** Weight the same person would feel on Earth, in newtons. */
  earthWeightN: number;
  /** weightN / earthWeightN. */
  loadFactor: number;
  /** Estimated frontal area of the suited body, in m². */
  frontalAreaM2: number;
  /** Estimated body surface area (Mosteller), in m². */
  bodySurfaceAreaM2: number;
  /** Hip height used as the pendulum length, in m. */
  legLengthM: number;
  /** Take-off speed of a maximal standing jump, m/s. */
  jumpVelocityMs: number;
  /** Apex of a maximal standing jump above the surface, in m. */
  jumpHeightM: number;
  /** Total time airborne for that jump, in s. */
  airtimeS: number;
  /** Terminal velocity in free fall, in m/s (falls back to sonic-ish cap in vacuum). */
  terminalVelocityMs: number;
  /** Drag force at the preferred walking speed, in N. */
  dragAtWalkN: number;
  /** Gait the body settles into under these conditions. */
  gait: GaitProfile;
  /** True when leg force can still support the loaded mass. */
  canStand: boolean;
  /** Seconds to fall 10 m from rest, accounting for drag. */
  fallTime10mS: number;
  /** Impact speed after a 10 m fall, in m/s. */
  impactSpeed10mS: number;
}

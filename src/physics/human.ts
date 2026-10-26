import {
  EARTH_GRAVITY,
  FRONTAL_AREA_RATIO,
  LEG_LENGTH_RATIO,
  NEGLIGIBLE_DENSITY,
  SUIT_AREA_FACTOR,
} from './constants';
import { fallTime, impactSpeed, terminalVelocity } from './drag';
import { deriveGait } from './gait';
import type { HumanDerived, HumanParams } from '../types/human';

export interface HumanInput {
  params: HumanParams;
  gravity: number;
  atmosphereDensity: number;
  mobilityFactor: number;
  windLeanDeg: number;
}

/** Height of the fall used for the "impact test" readout, in metres. */
export const IMPACT_TEST_HEIGHT_M = 10;

/**
 * Body surface area by the Mosteller formula, m².
 * BSA = √(height_cm · mass_kg / 3600)
 */
export function bodySurfaceArea(heightM: number, massKg: number): number {
  const heightCm = heightM * 100;
  const value = (heightCm * massKg) / 3600;
  if (value <= 0) return 1.6;
  return Math.sqrt(value);
}

/**
 * Legs produce a roughly fixed amount of mechanical work per jump, so the
 * apex height is h = E/(m·g). That single relation explains the Apollo
 * footage: same energy, one sixth the weight, six times the height.
 * A stiff pressurised suit wastes part of that work, hence the mobility term.
 */
export function deriveHuman(input: HumanInput): HumanDerived {
  const { params } = input;
  const gravity = Math.max(input.gravity, 1e-3);

  const bodyMass = Math.max(params.bodyMassKg, 5);
  const suitMass = Math.max(params.suitMassKg, 0);
  const totalMassKg = bodyMass + suitMass;

  const bsa = bodySurfaceArea(params.heightM, bodyMass);
  const frontalAreaM2 = bsa * FRONTAL_AREA_RATIO * 1.18;
  const legLengthM = Math.max(params.heightM * LEG_LENGTH_RATIO, 0.3);

  const weightN = totalMassKg * gravity;
  const earthWeightN = totalMassKg * EARTH_GRAVITY;
  const loadFactor = weightN / Math.max(earthWeightN, 1e-6);

  // Leg force ceiling comes from the body, not the suit — it does not scale
  // with the planet. That asymmetry is what breaks high-gravity worlds.
  const maxLegForceN = params.legStrengthRatio * bodyMass * EARTH_GRAVITY;
  const canStand = maxLegForceN > weightN * 1.15;

  const mobility = canStand ? Math.max(input.mobilityFactor, 0.05) : 0.12;
  const usableLegEnergyJ = Math.max(params.legEnergyJ, 0) * mobility;

  const jumpVelocityMs = Math.sqrt((2 * usableLegEnergyJ) / Math.max(totalMassKg, 1));
  const jumpHeightM = usableLegEnergyJ / Math.max(totalMassKg * gravity, 1e-6);
  const airtimeS = (2 * jumpVelocityMs) / gravity;

  const terminalVelocityMs = terminalVelocity(
    totalMassKg,
    gravity,
    input.atmosphereDensity,
    params.dragCoefficient,
    frontalAreaM2
  );

  const gait = deriveGait({
    gravity,
    heightM: params.heightM,
    totalMassKg,
    weightN,
    frontalAreaM2,
    dragCoefficient: params.dragCoefficient,
    density: input.atmosphereDensity,
    mobilityFactor: mobility,
    canStand,
    windLeanDeg: input.windLeanDeg,
  });

  const dragAtWalkN =
    input.atmosphereDensity < NEGLIGIBLE_DENSITY
      ? 0
      : 0.5 *
        input.atmosphereDensity *
        params.dragCoefficient *
        frontalAreaM2 *
        gait.speedMs *
        gait.speedMs;

  return {
    totalMassKg,
    weightN,
    earthWeightN,
    loadFactor,
    frontalAreaM2,
    bodySurfaceAreaM2: bsa,
    legLengthM,
    jumpVelocityMs,
    jumpHeightM,
    airtimeS,
    terminalVelocityMs,
    dragAtWalkN,
    gait,
    canStand,
    fallTime10mS: fallTime(IMPACT_TEST_HEIGHT_M, gravity, terminalVelocityMs),
    impactSpeed10mS: impactSpeed(IMPACT_TEST_HEIGHT_M, gravity, terminalVelocityMs),
  };
}

/** Suit outer area used by the thermal model, m². */
export function suitSurfaceArea(heightM: number, bodyMassKg: number): number {
  return bodySurfaceArea(heightM, bodyMassKg) * SUIT_AREA_FACTOR;
}

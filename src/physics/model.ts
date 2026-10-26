import { deriveHuman, suitSurfaceArea } from './human';
import { derivePlanet } from './planet';
import { derivePressure } from './pressure';
import { deriveThermal } from './thermal';
import { deriveVerdict } from './verdict';
import { deriveWind } from './wind';
import type { HumanParams } from '../types/human';
import type { PlanetParams } from '../types/planet';
import type { PhysicsModel } from '../types/simulation';

/**
 * The single entry point the UI uses.
 *
 * Dependency order is not arbitrary: the wind needs the body's frontal area,
 * the pressure differential needs the planet's ambient pressure, and the gait
 * needs *both* the resulting mobility and the wind lean. So the human is
 * derived twice — once provisionally to size the body, once for real once
 * the environment has had its say.
 */
export function buildModel(planetParams: PlanetParams, humanParams: HumanParams): PhysicsModel {
  const planet = derivePlanet(planetParams);
  const gravity = Math.max(planetParams.surfaceGravityMs2, 1e-3);

  const provisional = deriveHuman({
    params: humanParams,
    gravity,
    atmosphereDensity: planet.atmosphereDensity,
    mobilityFactor: 1,
    windLeanDeg: 0,
  });

  const pressure = derivePressure({
    ambientKpa: planetParams.surfacePressureKpa,
    suitPressureKpa: humanParams.suitPressureKpa,
  });

  const wind = deriveWind({
    windSpeedMs: planetParams.windSpeedMs,
    density: planet.atmosphereDensity,
    dragCoefficient: humanParams.dragCoefficient,
    frontalAreaM2: provisional.frontalAreaM2,
    totalMassKg: provisional.totalMassKg,
    weightN: provisional.weightN,
  });

  const human = deriveHuman({
    params: humanParams,
    gravity,
    atmosphereDensity: planet.atmosphereDensity,
    mobilityFactor: pressure.mobilityFactor,
    windLeanDeg: wind.leanDeg,
  });

  const thermal = deriveThermal({
    surfaceTempC: planetParams.surfaceTempC,
    density: planet.atmosphereDensity,
    windSpeedMs: planetParams.windSpeedMs,
    suitInsulationClo: humanParams.suitInsulationClo,
    metabolicRateW: humanParams.metabolicRateW,
    thermalControlW: humanParams.thermalControlW,
    suitAreaM2: suitSurfaceArea(humanParams.heightM, humanParams.bodyMassKg),
    thermalInertia: planetParams.thermalInertia,
  });

  const verdict = deriveVerdict({ planet, human, wind, thermal, pressure });

  return {
    planet,
    human,
    wind,
    thermal,
    pressure,
    verdict,
    params: { planet: planetParams, human: humanParams },
  };
}

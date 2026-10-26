import {
  EARTH_GRAVITY,
  EARTH_PRESSURE_KPA,
  VACUUM_THRESHOLD_KPA,
} from './constants';
import {
  atmosphereDensity,
  blackbodyEquilibriumC,
  scaleHeightM,
  speedOfSound,
  waterBoilingPointC,
} from './atmosphere';
import {
  bulkDensity,
  escapeVelocity,
  orbitalVelocity,
  radiusFromGravityAndMass,
} from './gravity';
import type { PlanetDerived, PlanetParams } from '../types/planet';

/** Everything the rest of the app knows about a world, from its raw params. */
export function derivePlanet(params: PlanetParams): PlanetDerived {
  const gravity = Math.max(params.surfaceGravityMs2, 1e-3);
  const massKg = Math.max(params.massKg, 1);

  const radiusM = radiusFromGravityAndMass(gravity, massKg);
  const density = atmosphereDensity(
    params.surfacePressureKpa,
    params.molarMassGmol,
    params.surfaceTempC
  );
  const isVacuum = params.surfacePressureKpa < VACUUM_THRESHOLD_KPA;

  return {
    radiusM,
    bulkDensity: bulkDensity(massKg, radiusM),
    escapeVelocityMs: escapeVelocity(gravity, radiusM),
    orbitalVelocityMs: orbitalVelocity(gravity, radiusM),
    atmosphereDensity: density,
    scaleHeightKm: scaleHeightM(gravity, params.molarMassGmol, params.surfaceTempC) / 1000,
    speedOfSoundMs: isVacuum ? 0 : speedOfSound(params.surfaceTempC, params.molarMassGmol),
    waterBoilingC: waterBoilingPointC(params.surfacePressureKpa),
    isVacuum,
    blackbodyEquilibriumC: blackbodyEquilibriumC(params.solarIrradianceWm2),
    pressureKpa: params.surfacePressureKpa,
    gravityEarth: gravity / EARTH_GRAVITY,
    pressureAtm: params.surfacePressureKpa / EARTH_PRESSURE_KPA,
  };
}

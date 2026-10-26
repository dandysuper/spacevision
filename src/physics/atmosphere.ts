import {
  EARTH_AIR_DENSITY,
  HEAT_CAPACITY_RATIO,
  KELVIN_OFFSET,
  STEFAN_BOLTZMANN,
  UNIVERSAL_GAS_CONSTANT,
  VACUUM_THRESHOLD_KPA,
  WATER_BOILING_POINT_K,
  WATER_BOILING_PRESSURE_PA,
  WATER_LATENT_HEAT,
  WATER_VAPOUR_GAS_CONSTANT,
} from './constants';

/**
 * Surface atmospheric density from the ideal gas law.
 * ρ = pM / RT — good to a few percent against real planetary data.
 */
export function atmosphereDensity(
  pressureKpa: number,
  molarMassGmol: number,
  tempC: number
): number {
  if (pressureKpa < VACUUM_THRESHOLD_KPA) return 0;
  const pressurePa = pressureKpa * 1000;
  const molarKg = molarMassGmol / 1000;
  const tempK = tempC + KELVIN_OFFSET;
  if (tempK <= 0 || molarKg <= 0) return 0;
  return (pressurePa * molarKg) / (UNIVERSAL_GAS_CONSTANT * tempK);
}

/** Scale height of an isothermal atmosphere, in metres. */
export function scaleHeightM(
  gravity: number,
  molarMassGmol: number,
  tempC: number
): number {
  if (gravity <= 0) return 0;
  const tempK = tempC + KELVIN_OFFSET;
  const molarKg = molarMassGmol / 1000;
  if (tempK <= 0 || molarKg <= 0) return 0;
  return (UNIVERSAL_GAS_CONSTANT * tempK) / (molarKg * gravity);
}

/** Speed of sound in the surface atmosphere, m/s. */
export function speedOfSound(tempC: number, molarMassGmol: number): number {
  const tempK = tempC + KELVIN_OFFSET;
  const molarKg = molarMassGmol / 1000;
  if (tempK <= 0 || molarKg <= 0) return 0;
  return Math.sqrt((HEAT_CAPACITY_RATIO * UNIVERSAL_GAS_CONSTANT * tempK) / molarKg);
}

/**
 * Boiling point of water at a given pressure, via Clausius–Clapeyron
 * anchored at the normal boiling point. Below the triple point the result is
 * meaningless for liquid water, so we report the sublimation-side value.
 */
export function waterBoilingPointC(pressureKpa: number): number {
  if (pressureKpa <= 0) {
    return -273.15;
  }
  const pressurePa = pressureKpa * 1000;
  const inverse =
    1 / WATER_BOILING_POINT_K -
    (WATER_VAPOUR_GAS_CONSTANT * Math.log(pressurePa / WATER_BOILING_PRESSURE_PA)) /
      WATER_LATENT_HEAT;
  if (inverse <= 0) return 374;
  const tempK = 1 / inverse;
  if (!Number.isFinite(tempK)) return 100;
  return tempK - KELVIN_OFFSET;
}

/** Effective radiative temperature of a fast-rotating airless body, °C. */
export function blackbodyEquilibriumC(
  solarIrradianceWm2: number,
  albedo = 0.3
): number {
  if (solarIrradianceWm2 <= 0) return -273.15;
  const absorbed = solarIrradianceWm2 * (1 - albedo);
  const tempK = Math.pow(absorbed / (4 * STEFAN_BOLTZMANN), 0.25);
  return tempK - KELVIN_OFFSET;
}

/** How much denser the local air is than Earth's, as a dimensionless ratio. */
export function densityRatio(density: number): number {
  return density / EARTH_AIR_DENSITY;
}

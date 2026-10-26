/**
 * Planetary body parameters and the physical quantities derived from them.
 * `surfaceGravityMs2` and `massKg` are the editable sources of truth;
 * radius is always recomputed from them so the three stay consistent.
 */

export type TerrainKind =
  | 'regolith'
  | 'basalt'
  | 'dune'
  | 'ice'
  | 'volcanic'
  | 'cratered'
  | 'methane'
  | 'grass'
  | 'gas';

export type SkyKind = 'vacuum' | 'thin' | 'dense' | 'haze';

export interface PlanetParams {
  id: string;
  name: string;
  /** Catalogue-style tag rendered in the HUD, e.g. "SOL IV". */
  designation: string;
  /** Surface gravity in m/s². Primary control. */
  surfaceGravityMs2: number;
  /** Total mass in kg. Drives radius and escape velocity. */
  massKg: number;
  /** Mean surface temperature in °C. */
  surfaceTempC: number;
  /** Surface pressure in kPa. Zero means hard vacuum. */
  surfacePressureKpa: number;
  /** Mean molar mass of the atmosphere in g/mol. */
  molarMassGmol: number;
  /** Mean surface wind speed in m/s. */
  windSpeedMs: number;
  /** Wind bearing in degrees, 0 = +Z (away from camera). */
  windDirectionDeg: number;
  /** Top-of-atmosphere solar irradiance in W/m². */
  solarIrradianceWm2: number;
  terrain: TerrainKind;
  sky: SkyKind;
  /** 0–1. How strongly the ground stores and reradiates heat. */
  thermalInertia: number;
  /** Human-readable note shown under the planet name. */
  notes: string;
}

export interface PlanetDerived {
  /** Recovered radius from g and M. */
  radiusM: number;
  /** Bulk density in kg/m³. */
  bulkDensity: number;
  /** Escape velocity in m/s. */
  escapeVelocityMs: number;
  /** Circular orbital velocity at the surface in m/s. */
  orbitalVelocityMs: number;
  /** Atmospheric density at the surface in kg/m³. */
  atmosphereDensity: number;
  /** Scale height of the atmosphere in km (0 for vacuum). */
  scaleHeightKm: number;
  /** Speed of sound in the surface atmosphere in m/s. */
  speedOfSoundMs: number;
  /** Boiling point of water at the surface pressure, in °C. */
  waterBoilingC: number;
  /** Whether the surface is effectively a vacuum. */
  isVacuum: boolean;
  /** Equilibrium temperature of a black sphere at this irradiance, in °C. */
  blackbodyEquilibriumC: number;
  /** Surface pressure in kPa, echoed for convenience. */
  pressureKpa: number;
  /** Number of Earth gravities. */
  gravityEarth: number;
  /** Number of Earth atmospheres. */
  pressureAtm: number;
}

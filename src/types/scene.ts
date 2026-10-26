/**
 * Output of the scene-palette derivation: everything the renderer needs to
 * paint a given world. Produced from PlanetParams + PlanetDerived, never
 * authored directly.
 */
export interface ScenePalette {
  skyTop: string;
  skyHorizon: string;
  hazeColor: string;
  fogColor: string;
  fogDensity: number;
  groundColor: string;
  groundAlt: string;
  rockColor: string;
  dustColor: string;
  groundRoughness: number;
  sunColor: string;
  sunIntensity: number;
  ambientColor: string;
  ambientIntensity: number;
  starOpacity: number;
  hazeOpacity: number;
  /** Normalised perceived brightness 0–1.5. */
  irradiance: number;
  /** Normalised atmospheric column thickness 0–1. */
  thickness: number;
  /** Normalised wind strength 0–1. */
  windStrength: number;
}

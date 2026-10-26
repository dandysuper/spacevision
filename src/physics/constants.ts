/** Physical constants. SI unless the name says otherwise. */

export const GRAVITATIONAL_CONSTANT = 6.6743e-11; // m³ kg⁻¹ s⁻²
export const UNIVERSAL_GAS_CONSTANT = 8.314462618; // J mol⁻¹ K⁻¹
export const STEFAN_BOLTZMANN = 5.670374419e-8; // W m⁻² K⁻⁴
export const KELVIN_OFFSET = 273.15;

/** Standard gravity, m/s². */
export const EARTH_GRAVITY = 9.80665;
/** Standard sea-level pressure, kPa. */
export const EARTH_PRESSURE_KPA = 101.325;
/** Standard sea-level air density, kg/m³. */
export const EARTH_AIR_DENSITY = 1.225;
/** Mean molar mass of dry air, g/mol. */
export const EARTH_MOLAR_MASS = 28.96;

/** Ratio of specific heats for diatomic gases. */
export const HEAT_CAPACITY_RATIO = 1.4;

/** Latent heat of vaporisation of water, J/kg. */
export const WATER_LATENT_HEAT = 2.257e6;
/** Specific gas constant of water vapour, J kg⁻¹ K⁻¹. */
export const WATER_VAPOUR_GAS_CONSTANT = 461.5;
/** Water boils at this temperature (K) at this pressure (Pa). */
export const WATER_BOILING_POINT_K = 373.15;
export const WATER_BOILING_PRESSURE_PA = 101325;

/** Emissivity of the suit's outer shell. */
export const SUIT_EMISSIVITY = 0.9;
/** Clothing area factor — a pressure suit is bulkier than bare skin. */
export const SUIT_AREA_FACTOR = 1.18;
/** Thermal resistance of one clo, m²K/W. */
export const CLO_TO_RSI = 0.155;
/** Ground contact coefficient, W per K of suit-to-ground difference. */
export const GROUND_CONDUCTION_COEFFICIENT = 5;
/** Mean skin temperature used for passive heat-balance, °C. */
export const MEAN_SKIN_TEMP_C = 33;
/** Comfortable core temperature band, °C. */
export const COMFORT_LOW_C = 18;
export const COMFORT_HIGH_C = 27;
/** Heat capacity of body plus suit, J/K. Limits how fast core temp moves. */
export const BODY_PLUS_SUIT_HEAT_CAPACITY = 2.9e5;
/** Skin surface area scaling: hip height / standing height. */
export const LEG_LENGTH_RATIO = 0.53;
/** Ratio of frontal area to body surface area for a standing person. */
export const FRONTAL_AREA_RATIO = 0.28;

/** Below this pressure (kPa) the surface counts as vacuum. */
export const VACUUM_THRESHOLD_KPA = 0.05;
/** Below this density (kg/m³) aerodynamic forces are ignored. */
export const NEGLIGIBLE_DENSITY = 0.002;

/** Froude number a human naturally walks at on Earth. */
export const WALK_FROUDE = 0.45;
/** Froude number used when low gravity forces a bouncing gait. */
export const BOUND_FROUDE = 0.95;
/** Gravity below which the body switches from walking to bounding, m/s². */
export const BOUND_GRAVITY_THRESHOLD = 4.2;
/** Gravity above which stride length collapses, m/s². */
export const HEAVY_GRAVITY_THRESHOLD = 16;

/** Maximum wind lean before the figure has to brace, degrees. */
export const BRACE_LEAN_DEG = 34;
/** Instant death threshold for suit differential, kPa. */
export const CRUSH_LIMIT_KPA = 900;
/** Suit overpressure at which joints lock, kPa. */
export const OVERPRESSURE_LIMIT_KPA = 85;

/** Absolute floor for a simulation timestep, seconds. */
export const MIN_DT = 1 / 240;

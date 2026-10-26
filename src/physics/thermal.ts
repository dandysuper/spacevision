import {
  BODY_PLUS_SUIT_HEAT_CAPACITY,
  CLO_TO_RSI,
  EARTH_AIR_DENSITY,
  GROUND_CONDUCTION_COEFFICIENT,
  KELVIN_OFFSET,
  MEAN_SKIN_TEMP_C,
  NEGLIGIBLE_DENSITY,
  STEFAN_BOLTZMANN,
  SUIT_EMISSIVITY,
} from './constants';
import type { ThermalModel, ThermalRisk } from '../types/simulation';

export interface ThermalInput {
  surfaceTempC: number;
  density: number;
  windSpeedMs: number;
  suitInsulationClo: number;
  metabolicRateW: number;
  thermalControlW: number;
  suitAreaM2: number;
  thermalInertia: number;
}

/** Linearised radiative conductance between two grey surfaces, W/(m²·K). */
function radiativeConductance(suitK: number, envK: number): number {
  const mean = Math.max(suitK + envK, 1);
  const squares = suitK * suitK + envK * envK;
  return SUIT_EMISSIVITY * STEFAN_BOLTZMANN * squares * mean;
}

/**
 * Empirical forced-convection coefficient over a clothed body, W/(m²·K).
 * Earth's still-air baseline is ~10.45; wind raises it, and thinning the
 * atmosphere scales it down by the density ratio to the 0.6 power.
 */
function convectiveConductance(windSpeedMs: number, density: number): number {
  if (density < NEGLIGIBLE_DENSITY) return 0;
  const speed = Math.max(windSpeedMs, 0.1);
  const earthValue = Math.max(2, 10.45 - speed + 10 * Math.sqrt(speed));
  const ratio = Math.pow(density / EARTH_AIR_DENSITY, 0.6);
  return earthValue * ratio;
}

function classify(controlDemandW: number, capacityW: number, netW: number): ThermalRisk {
  const ratio = controlDemandW / Math.max(capacityW, 1);
  const cold = netW < 0;
  if (ratio < 0.55) return 'nominal';
  if (ratio < 1) return cold ? 'cold' : 'hot';
  return cold ? 'extreme-cold' : 'extreme-hot';
}

/**
 * Passive heat balance of a suited figure.
 *
 * Losses in series: suit insulation (R_suit) plus the boundary layer formed
 * by radiation and forced convection. Conduction into the ground runs in
 * parallel through the boots and scales with the regolith's thermal inertia.
 */
export function deriveThermal(input: ThermalInput): ThermalModel {
  const envK = Math.max(input.surfaceTempC + KELVIN_OFFSET, 1);
  const skinK = MEAN_SKIN_TEMP_C + KELVIN_OFFSET;
  const area = Math.max(input.suitAreaM2, 0.4);
  const deltaT = MEAN_SKIN_TEMP_C - input.surfaceTempC;

  const hRad = radiativeConductance(skinK, envK);
  const hConv = convectiveConductance(input.windSpeedMs, input.density);
  const boundary = hRad + hConv;

  const rSuit = Math.max(input.suitInsulationClo, 0.05) * CLO_TO_RSI;
  const rTotal = rSuit + (boundary > 1e-6 ? 1 / boundary : 0);

  // Heat crossing the suit shell, W. The radiation/convection split follows
  // each path's share of the boundary conductance.
  const throughSuitW = (area * deltaT) / Math.max(rTotal, 1e-4);
  const radiativeLossW = boundary > 1e-6 ? throughSuitW * (hRad / boundary) : 0;
  const convectiveLossW = boundary > 1e-6 ? throughSuitW * (hConv / boundary) : 0;

  const groundConductance =
    GROUND_CONDUCTION_COEFFICIENT * Math.max(input.thermalInertia, 0.05);
  const conductiveLossW = groundConductance * deltaT;

  const conductance = throughSuitW / Math.max(deltaT, 1e-6) + groundConductance;
  const totalLossW = throughSuitW + conductiveLossW;

  const netW = input.metabolicRateW - totalLossW;
  const controlDemandW = Math.abs(netW);
  const capacityW = Math.max(input.thermalControlW, 1);

  const equilibriumC = input.surfaceTempC + input.metabolicRateW / Math.max(conductance, 1e-3);

  const excess = controlDemandW - capacityW;
  const survivalMinutes =
    excess <= 0
      ? Number.POSITIVE_INFINITY
      : (BODY_PLUS_SUIT_HEAT_CAPACITY * 5) / excess / 60;

  return {
    radiativeLossW: Number.isFinite(radiativeLossW) ? radiativeLossW : totalLossW * 0.95,
    convectiveLossW: Number.isFinite(convectiveLossW) ? convectiveLossW : 0,
    conductiveLossW,
    totalLossW,
    netW,
    controlDemandW,
    controlCapacityW: capacityW,
    equilibriumC,
    risk: classify(controlDemandW, capacityW, netW),
    survivalMinutes: Number.isFinite(survivalMinutes)
      ? survivalMinutes
      : Number.POSITIVE_INFINITY,
  };
}

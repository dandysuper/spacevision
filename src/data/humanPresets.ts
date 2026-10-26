import type { HumanParams } from '../types/human';

/**
 * Crew configurations. Masses and suit pressures follow real EVA hardware
 * (the EMU runs at 29.6 kPa of pure oxygen); leg energy is the mechanical
 * work a fit adult delivers in a maximal standing jump.
 */
export const HUMAN_PRESETS: HumanParams[] = [
  {
    id: 'eva-standard',
    name: 'Standard EVA',
    bodyMassKg: 78,
    heightM: 1.79,
    suitMassKg: 62,
    dragCoefficient: 1.05,
    legEnergyJ: 380,
    suitPressureKpa: 29.6,
    suitInsulationClo: 2.8,
    metabolicRateW: 220,
    thermalControlW: 420,
    legStrengthRatio: 3.2,
  },
  {
    id: 'earth-baseline',
    name: 'Earth Baseline',
    bodyMassKg: 75,
    heightM: 1.78,
    suitMassKg: 4,
    dragCoefficient: 1.0,
    legEnergyJ: 400,
    suitPressureKpa: 101.3,
    suitInsulationClo: 1.3,
    metabolicRateW: 180,
    thermalControlW: 250,
    legStrengthRatio: 3.4,
  },
  {
    id: 'eva-heavy',
    name: 'Heavy EVA',
    bodyMassKg: 92,
    heightM: 1.72,
    suitMassKg: 96,
    dragCoefficient: 1.2,
    legEnergyJ: 320,
    suitPressureKpa: 40,
    suitInsulationClo: 3.4,
    metabolicRateW: 300,
    thermalControlW: 480,
    legStrengthRatio: 2.8,
  },
  {
    id: 'light-frame',
    name: 'Light Frame',
    bodyMassKg: 58,
    heightM: 1.63,
    suitMassKg: 38,
    dragCoefficient: 0.95,
    legEnergyJ: 250,
    suitPressureKpa: 29.6,
    suitInsulationClo: 2.2,
    metabolicRateW: 160,
    thermalControlW: 320,
    legStrengthRatio: 3.6,
  },
  {
    id: 'apollo',
    name: 'Apollo A7L',
    bodyMassKg: 70,
    heightM: 1.75,
    suitMassKg: 55,
    dragCoefficient: 1.15,
    legEnergyJ: 340,
    suitPressureKpa: 25.5,
    suitInsulationClo: 2.4,
    metabolicRateW: 280,
    thermalControlW: 380,
    legStrengthRatio: 3.0,
  },
];

export const DEFAULT_HUMAN_ID = 'eva-standard';

export function findHumanPreset(id: string): HumanParams | undefined {
  return HUMAN_PRESETS.find((preset) => preset.id === id);
}

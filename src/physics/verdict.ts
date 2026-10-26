import type { HumanDerived } from '../types/human';
import type { PlanetDerived } from '../types/planet';
import type {
  PressureModel,
  RiskLevel,
  ThermalModel,
  Verdict,
  WindModel,
} from '../types/simulation';

export interface VerdictInput {
  planet: PlanetDerived;
  human: HumanDerived;
  wind: WindModel;
  thermal: ThermalModel;
  pressure: PressureModel;
}

const fmt = (value: number, digits = 1): string =>
  Number.isFinite(value) ? value.toFixed(digits) : '∞';

/**
 * Final call. Order matters: structural failure outranks everything, then
 * the inability to bear your own weight, then being blown over, then thermal.
 * The verdict always names the mechanism, never just a label.
 */
export function deriveVerdict(input: VerdictInput): Verdict {
  const { planet, human, wind, thermal, pressure } = input;

  if (pressure.risk === 'fail') {
    return {
      level: 'fail',
      headline: 'SUIT INTEGRITY LOST',
      detail: `${pressure.failure}. Ambient pressure is ${fmt(
        planet.pressureKpa,
        1
      )} kPa against a ${fmt(pressure.deltaKpa < 0 ? -pressure.deltaKpa : pressure.deltaKpa, 0)} kPa differential.`,
    };
  }

  if (!human.canStand) {
    return {
      level: 'fail',
      headline: 'CANNOT BEAR OWN WEIGHT',
      detail: `${fmt(human.weightN, 0)} N of load exceeds the ${fmt(
        human.loadFactor * 100,
        0
      )}% body-weight ceiling the legs can hold. Gait collapses to a crawl at best.`,
    };
  }

  if (wind.overpowering) {
    return {
      level: 'fail',
      headline: 'WIND DOMINATES WEIGHT',
      detail: `Aerodynamic load of ${fmt(wind.forceN, 0)} N against ${fmt(
        human.weightN,
        0
      )} N of weight — the figure is pinned or driven downwind.`,
    };
  }

  if (thermal.risk === 'extreme-cold' || thermal.risk === 'extreme-hot') {
    const cold = thermal.risk === 'extreme-cold';
    const minutes = thermal.survivalMinutes;
    return {
      level: 'fail',
      headline: cold ? 'THERMAL CONTROL OVERWHELMED — COLD' : 'THERMAL CONTROL OVERWHELMED — HEAT',
      detail: `${fmt(thermal.controlDemandW, 0)} W of demand against ${fmt(
        thermal.controlCapacityW,
        0
      )} W of suit capacity. Without intervention, core temperature leaves the safe band in ${
        Number.isFinite(minutes) ? fmt(minutes, 0) + ' min' : 'no time at all'
      }.`,
    };
  }

  const warnings: string[] = [];
  let level: RiskLevel = 'nominal';

  if (thermal.risk === 'cold' || thermal.risk === 'hot') {
    level = 'warn';
    warnings.push(
      `thermal control at ${fmt(
        (thermal.controlDemandW / Math.max(thermal.controlCapacityW, 1)) * 100,
        0
      )}% of capacity`
    );
  }

  if (pressure.risk === 'warn') {
    level = 'warn';
    warnings.push(pressure.failure.toLowerCase());
  }

  if (wind.leanDeg > 18) {
    level = level === 'nominal' ? 'warn' : level;
    warnings.push(`sustained lean of ${fmt(wind.leanDeg, 0)}° into the wind`);
  }

  if (human.loadFactor > 2.2) {
    level = level === 'nominal' ? 'warn' : level;
    warnings.push(`${fmt(human.loadFactor, 1)}× body weight underfoot`);
  }

  if (level === 'nominal') {
    const note =
      planet.isVacuum
        ? `Hard vacuum outside, ${fmt(planet.gravityEarth, 2)} g underfoot. Locomotion is ${human.gait.style} at ${fmt(human.gait.speedMs, 2)} m/s.`
        : `${fmt(planet.gravityEarth, 2)} g underfoot, ${fmt(
            planet.atmosphereDensity,
            3
          )} kg/m³ of air at ${fmt(planet.speedOfSoundMs, 0)} m/s of sound. Locomotion settles into a ${human.gait.style} at ${fmt(human.gait.speedMs, 2)} m/s.`;
    return {
      level: 'nominal',
      headline: 'WITHIN OPERATING ENVELOPE',
      detail: note,
    };
  }

  return {
    level,
    headline: 'MARGINAL — DEGRADED PERFORMANCE',
    detail: `Continuing is possible but compromised: ${warnings.join('; ')}.`,
  };
}

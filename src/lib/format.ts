/**
 * Number formatting for a telemetry console. Everything renders as a value
 * plus a unit, tight and tabular, never as a sentence.
 */

export const INFINITE = '∞';

const DEFAULT_DIGITS = 1;

export function formatNumber(value: number, digits = DEFAULT_DIGITS): string {
  if (!Number.isFinite(value)) return INFINITE;
  const abs = Math.abs(value);
  if (abs !== 0 && (abs >= 100000 || abs < 0.01)) {
    const exponent = Math.floor(Math.log10(abs));
    const mantissa = value / Math.pow(10, exponent);
    return `${mantissa.toFixed(Math.max(digits - 1, 0))}e${exponent}`;
  }
  return value.toFixed(digits);
}

export function formatInt(value: number): string {
  if (!Number.isFinite(value)) return INFINITE;
  return Math.round(value).toLocaleString('en-US');
}

export interface Metric {
  value: string;
  unit: string;
}

const metric = (value: string, unit: string): Metric => ({ value, unit });

export function formatGravity(ms2: number): Metric {
  return metric(formatNumber(ms2, 2), 'm/s²');
}

export function formatGravityEarth(ratio: number): Metric {
  return metric(formatNumber(ratio, 2), 'g');
}

export function formatSpeed(ms: number): Metric {
  return metric(formatNumber(ms, Math.abs(ms) >= 100 ? 0 : 2), 'm/s');
}

export function formatDistance(m: number): Metric {
  const abs = Math.abs(m);
  if (abs < 1) return metric(formatNumber(m * 100, 0), 'cm');
  if (abs < 1000) return metric(formatNumber(m, 1), 'm');
  return metric(formatNumber(m / 1000, 1), 'km');
}

export function formatLongDistance(m: number): Metric {
  const abs = Math.abs(m);
  if (abs < 1e6) return metric(formatInt(m / 1000), 'km');
  return metric(formatNumber(m / 1e6, 2), 'Mm');
}

export function formatMass(kg: number): Metric {
  const abs = Math.abs(kg);
  if (abs < 1000) return metric(formatNumber(kg, 0), 'kg');
  if (abs < 1e6) return metric(formatNumber(kg / 1000, 1), 't');
  return metric(formatNumber(kg, 2), 'kg');
}

export function formatPlanetMass(kg: number): Metric {
  if (Math.abs(kg) >= 1e6) return metric(formatNumber(kg, 2), 'kg');
  return metric(formatNumber(kg, 1), 'kg');
}

export function formatTemperature(c: number): Metric {
  return metric(formatNumber(c, Math.abs(c) >= 100 ? 0 : 1), '°C');
}

export function formatPressure(kpa: number): Metric {
  if (kpa <= 0) return metric('0', 'kPa');
  if (kpa < 0.01) return metric(formatNumber(kpa, 1), 'kPa');
  if (kpa < 1) return metric(formatNumber(kpa, 3), 'kPa');
  if (kpa < 1000) return metric(formatNumber(kpa, 1), 'kPa');
  return metric(formatNumber(kpa / 1000, 1), 'MPa');
}

export function formatForce(n: number): Metric {
  if (Math.abs(n) >= 1000) return metric(formatNumber(n / 1000, 1), 'kN');
  return metric(formatNumber(n, 0), 'N');
}

export function formatPower(w: number): Metric {
  if (Math.abs(w) >= 1000) return metric(formatNumber(w / 1000, 1), 'kW');
  return metric(formatNumber(w, 0), 'W');
}

export function formatEnergy(j: number): Metric {
  if (Math.abs(j) >= 1000) return metric(formatNumber(j / 1000, 2), 'kJ');
  return metric(formatNumber(j, 0), 'J');
}

export function formatDensity(kgm3: number): Metric {
  if (kgm3 <= 0) return metric('0', 'kg/m³');
  if (kgm3 < 0.01) return metric(formatNumber(kgm3, 3), 'kg/m³');
  return metric(formatNumber(kgm3, kgm3 < 10 ? 2 : 1), 'kg/m³');
}

export function formatAngle(deg: number): Metric {
  return metric(formatNumber(deg, 1), '°');
}

export function formatDuration(seconds: number): Metric {
  if (!Number.isFinite(seconds)) return metric(INFINITE, '');
  const abs = Math.abs(seconds);
  if (abs < 1) return metric(formatNumber(seconds, 2), 's');
  if (abs < 60) return metric(formatNumber(seconds, 1), 's');
  if (abs < 3600) {
    const minutes = Math.floor(seconds / 60);
    const rest = Math.round(seconds - minutes * 60);
    return metric(`${minutes}m ${rest}s`, '');
  }
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds - hours * 3600) / 60);
  return metric(`${hours}h ${minutes}m`, '');
}

export function formatSurvival(minutes: number): Metric {
  if (!Number.isFinite(minutes)) return metric('indef.', '');
  if (minutes < 1) return metric('<1', 'min');
  if (minutes < 120) return metric(formatNumber(minutes, 0), 'min');
  return metric(formatNumber(minutes / 60, 1), 'h');
}

export function formatPercent(ratio: number, digits = 0): Metric {
  return metric(formatNumber(ratio * 100, digits), '%');
}

export function formatClo(clo: number): Metric {
  return metric(formatNumber(clo, 1), 'clo');
}

/** Human-readable delta, e.g. "+1.42×" or "−18%". */
export function formatDelta(ratio: number, digits = 2): string {
  if (!Number.isFinite(ratio)) return '—';
  const sign = ratio >= 0 ? '+' : '−';
  return `${sign}${Math.abs(ratio).toFixed(digits)}×`;
}

/** Direction hint for a numeric change, used to colour the delta. */
export function deltaDirection(current: number, reference: number): 'up' | 'down' | 'flat' {
  const diff = current - reference;
  if (Math.abs(diff) < Math.max(Math.abs(reference) * 0.005, 1e-9)) return 'flat';
  return diff > 0 ? 'up' : 'down';
}

export function metricText(m: Metric): string {
  return m.unit ? `${m.value} ${m.unit}` : m.value;
}

import { create } from 'zustand';
import type { GaitStyle } from '../types/human';

/**
 * Live values written by the 3D simulation loop and read by the HUD.
 * The scene pushes updates at ~10 Hz — fast enough to feel alive, slow
 * enough that React is not re-rendering at sixty frames a second.
 */
export interface TelemetryState {
  /** Height of the figure's feet above the datum, metres. */
  altitudeM: number;
  /** Horizontal speed of the figure, m/s. */
  speedMs: number;
  /** Vertical speed, m/s. Positive is upward. */
  verticalMs: number;
  /** Current gait phase label, mirrors the physics gait style. */
  gait: GaitStyle;
  /** Lean into the wind actually applied to the figure, degrees. */
  leanDeg: number;
  /** Elapsed seconds since the current manoeuvre began. */
  elapsedS: number;
  /** Peak altitude reached during the current jump/flight. */
  apexM: number;
  /** True while the feet are off the ground. */
  airborne: boolean;
  patch: (next: Partial<Omit<TelemetryState, 'patch'>>) => void;
}

const initial = {
  altitudeM: 0,
  speedMs: 0,
  verticalMs: 0,
  gait: 'walk' as GaitStyle,
  leanDeg: 0,
  elapsedS: 0,
  apexM: 0,
  airborne: false,
};

export const useTelemetryStore = create<TelemetryState>((set) => ({
  ...initial,
  patch: (next) => set(next),
}));

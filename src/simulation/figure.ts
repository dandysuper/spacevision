/**
 * Shared proportions for the suited figure. The renderer builds limbs from
 * these ratios, and the gait engine uses the same numbers to work out how high
 * the pelvis must sit for the feet to rest on the ground. One source of truth
 * means the figure never floats or sinks.
 */

export const RIG = {
  hip: 0.53,
  torso: 0.3,
  head: 0.082,
  shoulder: 0.118,
  upperArm: 0.185,
  forearm: 0.165,
  armRadius: 0.042,
  thigh: 0.245,
  shin: 0.24,
  legRadius: 0.062,
  foot: 0.145,
  footHeight: 0.034,
} as const;

/** Straight-leg distance from hip pivot to the sole of the boot, metres. */
export function legReach(heightM: number): number {
  return (RIG.thigh + RIG.shin) * heightM + RIG.footHeight * heightM;
}

/**
 * Pelvis height above the ground for a given crouch factor.
 * A crouch of 1 is straight-legged; lower values bend the knees, which pulls
 * the pelvis down so the boots stay planted.
 */
export function stanceHeight(heightM: number, crouch = 1): number {
  const straight = legReach(heightM);
  const clamped = Math.min(1, Math.max(0.25, crouch));
  // Knee flexion shortens the leg roughly as cos of the bend; 0.78 at full crouch.
  return straight * (0.78 + 0.22 * clamped);
}

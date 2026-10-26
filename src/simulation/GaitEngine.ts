import { clamp, damp, TAU } from '../lib/math';
import { stanceHeight } from './figure';
import type { TerrainField } from '../scene/terrainField';
import type { PhysicsModel } from '../types/simulation';

export type EngineMode = 'stand' | 'walk' | 'jump' | 'fall' | 'land';

export interface FigurePose {
  /** Pelvis height above the contact point, metres. */
  rootHeight: number;
  leanForward: number;
  leanSide: number;
  hips: [number, number];
  knees: [number, number];
  ankles: [number, number];
  shoulders: [number, number];
  elbows: [number, number];
  torsoTwist: number;
  headPitch: number;
  armRaise: number;
}

export interface EngineSnapshot {
  mode: EngineMode;
  /** World-space position of the feet. */
  x: number;
  y: number;
  z: number;
  /** Height above the local ground, metres. */
  altitudeM: number;
  horizontalSpeedMs: number;
  verticalSpeedMs: number;
  apexM: number;
  airborne: boolean;
  leanDeg: number;
  elapsedS: number;
}

const DROP_HEIGHT_M = 9;
const WORLD_LIMIT = 62;

/**
 * Drives the figure. Every mode is integrated from the planet's own numbers —
 * there is no canned animation anywhere. Gravity and quadratic drag are stepped
 * explicitly, so a jump on the Moon really does hang for nearly three seconds
 * and a jump on Jupiter barely leaves the ground.
 */
export class GaitEngine {
  private model: PhysicsModel;
  private field: TerrainField;

  private mode: EngineMode = 'stand';
  private phase = 0;
  private elapsed = 0;
  private landTimer = 0;

  private x = 0;
  private z = 0;
  /** Height above the local ground, metres. */
  private localY = 0;
  private verticalSpeed = 0;
  private horizontalSpeed = 0;
  private apex = 0;

  private poseState: FigurePose;

  constructor(model: PhysicsModel, field: TerrainField) {
    this.model = model;
    this.field = field;
    this.poseState = this.restPose();
  }

  setModel(model: PhysicsModel): void {
    this.model = model;
  }

  setField(field: TerrainField): void {
    this.field = field;
    this.x = 0;
    this.z = 0;
    this.localY = 0;
    this.verticalSpeed = 0;
    this.mode = 'stand';
    this.elapsed = 0;
  }

  private restPose(): FigurePose {
    return {
      rootHeight: stanceHeight(this.model.params.human.heightM, 1),
      leanForward: 0,
      leanSide: 0,
      hips: [0, 0],
      knees: [0.06, 0.06],
      ankles: [0, 0],
      shoulders: [0, 0],
      elbows: [0.22, 0.22],
      torsoTwist: 0,
      headPitch: 0,
      armRaise: 0,
    };
  }

  startWalk(): void {
    if (this.mode === 'jump' || this.mode === 'fall') return;
    this.mode = 'walk';
    this.elapsed = 0;
  }

  stopWalk(): void {
    if (this.mode === 'walk') this.mode = 'stand';
  }

  /** Maximal standing jump, using the crew's leg energy budget. */
  jump(): void {
    if (this.mode === 'jump' || this.mode === 'fall') return;
    this.mode = 'jump';
    this.elapsed = 0;
    this.apex = 0;
    this.localY = Math.max(this.localY, 0.001);
    this.verticalSpeed = this.model.human.jumpVelocityMs;
  }

  /** Step off a ledge — a pure free-fall test from a fixed height. */
  drop(): void {
    this.mode = 'fall';
    this.elapsed = 0;
    this.apex = DROP_HEIGHT_M;
    this.localY = DROP_HEIGHT_M;
    this.verticalSpeed = 0;
  }

  reset(): void {
    this.x = 0;
    this.z = 0;
    this.localY = 0;
    this.verticalSpeed = 0;
    this.horizontalSpeed = 0;
    this.apex = 0;
    this.mode = 'stand';
    this.elapsed = 0;
  }

  get worldY(): number {
    return this.field.heightAt(this.x, this.z) + this.localY;
  }

  get snapshot(): EngineSnapshot {
    return {
      mode: this.mode,
      x: this.x,
      y: this.worldY,
      z: this.z,
      altitudeM: this.localY,
      horizontalSpeedMs: this.horizontalSpeed,
      verticalSpeedMs: this.verticalSpeed,
      apexM: this.apex,
      airborne: this.localY > 0.02,
      leanDeg: (this.poseState.leanSide * 180) / Math.PI,
      elapsedS: this.elapsed,
    };
  }

  get pose(): FigurePose {
    return this.poseState;
  }

  update(dt: number): void {
    const step = clamp(dt, 0, 0.05);
    const { human } = this.model;
    const gravity = Math.max(this.model.params.planet.surfaceGravityMs2, 1e-3);
    this.elapsed += step;

    const gait = human.gait;

    switch (this.mode) {
      case 'walk':
        this.stepWalk(step, gait.speedMs, gait.strideFrequencyHz);
        break;
      case 'stand':
        this.phase += step * 0.55;
        this.horizontalSpeed = damp(this.horizontalSpeed, 0, 6, step);
        this.localY = damp(this.localY, 0, 8, step);
        break;
      case 'jump':
      case 'fall':
        this.stepAirborne(step, gravity);
        break;
      case 'land':
        this.landTimer -= step;
        this.horizontalSpeed = damp(this.horizontalSpeed, 0, 7, step);
        if (this.landTimer <= 0) this.mode = 'walk';
        break;
      default:
        break;
    }

    this.applyWind(step);
    this.buildPose(step, gravity);
  }

  private stepWalk(dt: number, speed: number, frequency: number): void {
    const bounded = clamp(frequency, 0.25, 3);
    this.phase += TAU * bounded * dt;

    this.horizontalSpeed = damp(this.horizontalSpeed, speed, 5, dt);

    // Forward is −Z.
    this.z -= this.horizontalSpeed * dt;

    if (this.z < -WORLD_LIMIT) this.z = WORLD_LIMIT;
    if (this.z > WORLD_LIMIT) this.z = -WORLD_LIMIT;
    this.x = clamp(this.x, -WORLD_LIMIT, WORLD_LIMIT);

    const gait = this.model.human.gait;
    if (gait.style === 'bound') {
      // One long arc per cycle, feet clear of the ground mid-stride.
      this.localY = Math.max(0, Math.sin(this.phase)) * gait.verticalOscillationM * 1.8;
    } else if (gait.style === 'crawl') {
      this.localY = 0;
    } else {
      this.localY = gait.verticalOscillationM * 0.5 * (1 - Math.cos(2 * this.phase));
    }
  }

  private stepAirborne(dt: number, gravity: number): void {
    const { human, planet } = this.model;
    const mass = Math.max(human.totalMassKg, 1);
    const dragAccel =
      (0.5 * planet.atmosphereDensity * this.model.params.human.dragCoefficient *
        human.frontalAreaM2 *
        this.verticalSpeed *
        Math.abs(this.verticalSpeed)) /
      mass;

    this.verticalSpeed += (-gravity - dragAccel) * dt;
    this.localY += this.verticalSpeed * dt;

    if (this.localY > this.apex) this.apex = this.localY;

    // Horizontal momentum carries through the flight.
    this.z -= this.horizontalSpeed * dt;
    this.z = clamp(this.z, -WORLD_LIMIT, WORLD_LIMIT);

    if (this.localY <= 0 && this.verticalSpeed <= 0) {
      this.localY = 0;
      this.verticalSpeed = 0;
      this.mode = 'land';
      this.landTimer = 0.32;
    }
  }

  /**
   * Wind acts on the figure continuously. It is expressed as a lean the body
   * must hold plus a slow lateral drift it cannot fully resist.
   */
  private applyWind(dt: number): void {
    if (this.mode === 'fall') return;
    const { wind } = this.model;
    if (wind.forceN <= 0) return;

    const driftLimit = 26;
    this.x = clamp(
      this.x + Math.sign(wind.leanDeg) * wind.accelerationMs2 * 0.06 * dt,
      -driftLimit,
      driftLimit
    );
  }

  private buildPose(dt: number, gravity: number): void {
    const { human, wind } = this.model;
    const gait = human.gait;
    const mobility = clamp(this.model.pressure.mobilityFactor, 0.05, 1);
    const targetLean = (wind.leanDeg * Math.PI) / 180;

    const pose = this.poseState;
    pose.leanSide = damp(pose.leanSide, targetLean, 3.5, dt);

    const heightM = this.model.params.human.heightM;
    const upright = stanceHeight(heightM, 1);

    if (this.mode === 'jump' || this.mode === 'fall') {
      // Tuck on the way up, reach for the ground on the way down.
      const rising = this.verticalSpeed > 0;
      const tuck = clamp(Math.abs(this.verticalSpeed) / 4, 0, 1);
      pose.rootHeight = damp(pose.rootHeight, upright * (rising ? 0.9 : 0.97), 9, dt);
      pose.hips = [-0.5 * tuck, -0.42 * tuck];
      pose.knees = [1.15 * tuck, 1.0 * tuck];
      pose.ankles = [-0.25 * tuck, -0.2 * tuck];
      pose.shoulders = [rising ? -1.5 : 0.6, rising ? -1.4 : 0.7];
      pose.elbows = [0.9, 0.9];
      pose.leanForward = damp(pose.leanForward, rising ? 0.12 : -0.06, 6, dt);
      pose.armRaise = rising ? 1 : 0.25;
      pose.headPitch = damp(pose.headPitch, rising ? -0.12 : 0.16, 5, dt);
      pose.torsoTwist = damp(pose.torsoTwist, 0, 5, dt);
      return;
    }

    if (gait.style === 'crawl') {
      pose.rootHeight = damp(pose.rootHeight, upright * 0.42, 4, dt);
      pose.leanForward = damp(pose.leanForward, 1.15, 4, dt);
      pose.hips = [0.9 + Math.sin(this.phase) * 0.35, 0.9 - Math.sin(this.phase) * 0.35];
      pose.knees = [1.5, 1.5];
      pose.ankles = [0.2, 0.2];
      pose.shoulders = [-1.5 + Math.sin(this.phase + 1) * 0.4, -1.5 - Math.sin(this.phase + 1) * 0.4];
      pose.elbows = [1.1, 1.1];
      pose.torsoTwist = damp(pose.torsoTwist, 0, 4, dt);
      pose.headPitch = damp(pose.headPitch, -0.9, 4, dt);
      pose.armRaise = 0;
      return;
    }

    const amplitude = gait.style === 'bound' ? 0.72 : 0.5;
    const swing = Math.sin(this.phase);
    const counterSwing = Math.sin(this.phase + Math.PI);
    const kneeBase = gait.style === 'bound' ? 0.42 : 0.12;

    // Heavy loads shorten the stride and deepen the crouch.
    const crouch = clamp(1 - human.loadFactor * 0.18, 0.55, 1);
    const isMoving = this.mode === 'walk';
    const gaitScale = isMoving ? 1 : 0.18;

    pose.rootHeight = damp(
      pose.rootHeight,
      stanceHeight(heightM, crouch) * (gait.style === 'bound' ? 0.97 : 1),
      8,
      dt
    );

    pose.leanForward = damp(
      pose.leanForward,
      (gait.style === 'bound' ? 0.16 : 0.05) * gaitScale + (1 - crouch) * 0.35,
      6,
      dt
    );

    const boundOffset = gait.style === 'bound' ? 0.35 : 0;

    pose.hips = [
      (-swing * amplitude - boundOffset) * gaitScale * mobility,
      (-counterSwing * amplitude - boundOffset) * gaitScale * mobility,
    ];

    pose.knees = [
      kneeBase + Math.max(0, Math.sin(this.phase + 1.1)) * 0.85 * gaitScale * mobility,
      kneeBase + Math.max(0, Math.sin(this.phase + 1.1 + Math.PI)) * 0.85 * gaitScale * mobility,
    ];

    pose.ankles = [
      (swing * 0.22 - 0.05) * gaitScale,
      (counterSwing * 0.22 - 0.05) * gaitScale,
    ];

    pose.shoulders = [
      (swing * 0.55) * gaitScale * mobility,
      (counterSwing * 0.55) * gaitScale * mobility,
    ];

    // Stiff suits cannot reach across the body.
    pose.elbows = [
      0.22 + 0.3 * (1 - mobility) + Math.abs(swing) * 0.12 * gaitScale,
      0.22 + 0.3 * (1 - mobility) + Math.abs(counterSwing) * 0.12 * gaitScale,
    ];

    pose.torsoTwist = damp(pose.torsoTwist, -swing * 0.14 * gaitScale * mobility, 8, dt);
    pose.headPitch = damp(pose.headPitch, clamp(-gravity * 0.006, -0.1, 0.1), 3, dt);

    // Bracing into a gale: arms out, weight low.
    const braceAmount = clamp((wind.leanDeg - 10) / 40, 0, 1);
    pose.armRaise = braceAmount * 0.9;
    if (braceAmount > 0.05) {
      pose.rootHeight *= 1 - braceAmount * 0.12;
      pose.shoulders = [
        pose.shoulders[0] - braceAmount * 0.9,
        pose.shoulders[1] - braceAmount * 0.9,
      ];
      pose.elbows = [pose.elbows[0] + braceAmount * 0.5, pose.elbows[1] + braceAmount * 0.5];
    }
  }
}

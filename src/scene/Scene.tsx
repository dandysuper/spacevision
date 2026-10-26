import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { GaitEngine } from '../simulation/GaitEngine';
import { useTelemetryStore } from '../state/useTelemetryStore';
import type { SceneAction } from '../state/useConfigStore';
import type { PhysicsModel } from '../types/simulation';
import type { ScenePalette } from '../types/scene';
import { Astronaut } from './Astronaut';
import { Boulders } from './Boulders';
import { Sky, Stars, SunDisc, SUN_DIRECTION } from './Sky';
import { Terrain } from './Terrain';
import { WindField } from './WindField';
import { createTerrainField } from './terrainField';

interface SimulationDriverProps {
  engine: GaitEngine;
  model: PhysicsModel;
}

/** Steps the physics once per frame and pushes throttled telemetry to React. */
function SimulationDriver({ engine, model }: SimulationDriverProps) {
  const patch = useTelemetryStore((state) => state.patch);
  const accumulator = useRef(0);

  useEffect(() => {
    engine.setModel(model);
  }, [engine, model]);

  useFrame((_state, delta) => {
    engine.update(Math.min(delta, 0.05));

    accumulator.current += delta;
    if (accumulator.current < 0.1) return;
    accumulator.current = 0;

    const snap = engine.snapshot;
    patch({
      altitudeM: snap.altitudeM,
      speedMs: snap.horizontalSpeedMs,
      verticalMs: snap.verticalSpeedMs,
      gait: model.human.gait.style,
      leanDeg: snap.leanDeg,
      elapsedS: snap.elapsedS,
      apexM: snap.apexM,
      airborne: snap.airborne,
    });
  }, -1);

  return null;
}

interface CameraRigProps {
  engine: GaitEngine;
  minDistance: number;
  maxDistance: number;
}

/** Keeps the orbit target welded to the figure's chest without fighting input. */
function CameraRig({ engine, minDistance, maxDistance }: CameraRigProps) {
  const controls = useRef<{ target: THREE.Vector3; update: () => void } | null>(null);
  const desired = useMemo(() => new THREE.Vector3(), []);
  const { camera } = useThree();
  const initialised = useRef(false);

  useFrame((_state, delta) => {
    const snap = engine.snapshot;
    const chestY = snap.y + engine.pose.rootHeight + 0.22;
    desired.set(snap.x, chestY, snap.z);

    const ctrl = controls.current;
    if (ctrl) {
      if (!initialised.current) {
        ctrl.target.copy(desired);
        // Stand in front and just above eye level, so the figure fills the
        // frame and the ground still runs away to a visible horizon.
        camera.position.set(snap.x + 2.4, chestY + 0.5, snap.z - 5.4);
        initialised.current = true;
      } else {
        ctrl.target.lerp(desired, 1 - Math.exp(-4 * delta));
      }
      ctrl.update();
    }
  });

  return (
    <OrbitControls
      ref={controls as never}
      enablePan={false}
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.55}
      zoomSpeed={0.7}
      minDistance={minDistance}
      maxDistance={maxDistance}
      maxPolarAngle={Math.PI * 0.495}
      minPolarAngle={0.12}
      makeDefault
    />
  );
}

interface WorldProps {
  model: PhysicsModel;
  palette: ScenePalette;
  seed: number;
  engine: GaitEngine;
  quality: 'low' | 'high';
}

function World({ model, palette, seed, engine, quality }: WorldProps) {
  const field = useMemo(
    () => createTerrainField(model.params.planet.terrain, seed),
    [model.params.planet.terrain, seed]
  );

  useEffect(() => {
    engine.setField(field);
  }, [engine, field]);

  const segments = quality === 'high' ? 208 : 136;
  const boulderCount = quality === 'high' ? 190 : 110;
  const windCount = quality === 'high' ? 260 : 150;
  const shadows = true;

  const sunPosition = useMemo(
    () => SUN_DIRECTION.clone().multiplyScalar(80).toArray() as [number, number, number],
    []
  );

  return (
    <>
      <fogExp2
        attach="fog"
        args={[palette.fogColor, palette.fogDensity]}
      />

      <hemisphereLight
        args={[palette.skyHorizon, palette.groundColor, palette.ambientIntensity * 1.05]}
      />
      <ambientLight intensity={palette.ambientIntensity * 0.3} color={palette.ambientColor} />

      {/* Viewing-side fill so the shaded face of the figure never goes black. */}
      <directionalLight
        position={[3, 4, -9]}
        intensity={palette.sunIntensity * 0.3}
        color={palette.ambientColor}
      />

      <directionalLight
        position={sunPosition}
        intensity={palette.sunIntensity}
        color={palette.sunColor}
        castShadow={shadows}
        shadow-mapSize-width={quality === 'high' ? 2048 : 1024}
        shadow-mapSize-height={quality === 'high' ? 2048 : 1024}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-camera-near={1}
        shadow-camera-far={180}
        shadow-bias={-0.0008}
        shadow-normalBias={0.03}
      />

      <Sky palette={palette} />
      <Stars opacity={palette.starOpacity} count={quality === 'high' ? 1600 : 800} />
      <SunDisc palette={palette} />

      <Terrain field={field} palette={palette} segments={segments} seed={seed} />
      <Boulders field={field} palette={palette} count={boulderCount} seed={seed} />

      <WindField
        field={field}
        palette={palette}
        windSpeedMs={model.params.planet.windSpeedMs}
        windDirectionDeg={model.params.planet.windDirectionDeg}
        count={windCount}
      />

      <Astronaut engine={engine} heightM={model.params.human.heightM} />

      <SimulationDriver engine={engine} model={model} />
      <CameraRig
        engine={engine}
        minDistance={2.2}
        maxDistance={palette.thickness > 0.6 ? 16 : 34}
      />
    </>
  );
}

interface SceneProps {
  model: PhysicsModel;
  palette: ScenePalette;
  seed: number;
  action: SceneAction;
  onActionConsumed: () => void;
}

/**
 * The 3D environment. One Canvas, one engine, one terrain field — the figure,
 * the camera, the wind and the ground all read from the same simulated world.
 */
export function Scene({ model, palette, seed, action, onActionConsumed }: SceneProps) {
  const quality: 'low' | 'high' =
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 819px)').matches
      ? 'low'
      : 'high';

  const initialField = useMemo(
    () => createTerrainField(model.params.planet.terrain, seed),
    // Rebuilt only when the world identity changes; the engine adopts it below.
    [model.params.planet.terrain, seed]
  );

  const engine = useMemo(
    () => new GaitEngine(model, initialField),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  useEffect(() => {
    engine.setModel(model);
  }, [engine, model]);

  useEffect(() => {
    if (action === 'jump') {
      engine.jump();
      onActionConsumed();
    } else if (action === 'drop') {
      engine.drop();
      onActionConsumed();
    } else if (action === 'walk') {
      engine.startWalk();
    } else {
      engine.stopWalk();
    }
  }, [action, engine, onActionConsumed]);

  return (
    <div className="sv-stage-canvas">
      <Canvas
        shadows
        dpr={[1, 1.85]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: 'high-performance',
        }}
        camera={{ fov: 46, near: 0.1, far: 1200, position: [4, 3, 6] }}
        onCreated={({ gl }) => {
          gl.toneMapping = THREE.NoToneMapping;
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <World model={model} palette={palette} seed={seed} engine={engine} quality={quality} />
      </Canvas>
    </div>
  );
}

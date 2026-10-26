import { useEffect, useMemo, useRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { formatDistance, formatDuration, formatNumber } from '../../lib/format';
import { deriveScenePalette } from '../../scene/palette';
import { GaitEngine } from '../../simulation/GaitEngine';
import { Astronaut } from '../../scene/Astronaut';
import { Boulders } from '../../scene/Boulders';
import { Terrain } from '../../scene/Terrain';
import { WindField } from '../../scene/WindField';
import { createTerrainField } from '../../scene/terrainField';
import { useConfigStore } from '../../state/useConfigStore';
import { CameraIcon } from '../ui/Icons';
import { useCameraStream } from './useCameraStream';
import { useDeviceTilt } from './useDeviceTilt';

/** World units are metres, so the diorama is shrunk to tabletop size. */
const DIORAMA_SCALE = 0.075;

interface DioramaProps {
  model: ReturnType<typeof useConfigStore.getState>['model'];
  palette: ReturnType<typeof deriveScenePalette>;
  seed: number;
  tilt: React.MutableRefObject<{ gamma: number; beta: number; heading: number }>;
}

function Diorama({ model, palette, seed, tilt }: DioramaProps) {
  const field = useMemo(
    () => createTerrainField(model.params.planet.terrain, seed),
    [model.params.planet.terrain, seed]
  );

  const engine = useMemo(() => new GaitEngine(model, field), [model, field]);
  useEffect(() => {
    engine.setModel(model);
  }, [engine, model]);

  useEffect(() => {
    engine.startWalk();
  }, [engine]);

  const rig = useRef<THREE.Group>(null);
  const { camera } = useThree();

  useFrame((_state, delta) => {
    engine.update(Math.min(delta, 0.05));

    if (rig.current) {
      const t = tilt.current;
      const targetY = THREE.MathUtils.degToRad(t.heading) * 0.05;
      const targetX = THREE.MathUtils.degToRad(t.gamma) * 0.008;
      rig.current.rotation.y += (targetY - rig.current.rotation.y) * 0.05;
      rig.current.rotation.z += (targetX - rig.current.rotation.z) * 0.05;
    }
  });

  useEffect(() => {
    camera.position.set(0, 3.4, 5.6);
    camera.lookAt(0, 0, 0);
  }, [camera]);

  return (
    <>
      <ambientLight intensity={palette.ambientIntensity * 0.5} color={palette.ambientColor} />
      <hemisphereLight
        args={[palette.skyHorizon, palette.groundColor, palette.ambientIntensity * 0.6]}
      />
      <directionalLight position={[6, 9, 4]} intensity={palette.sunIntensity} color={palette.sunColor} />
      <directionalLight position={[-6, 4, -5]} intensity={palette.sunIntensity * 0.25} color={palette.hazeColor} />

      <group ref={rig} scale={DIORAMA_SCALE}>
        <Terrain field={field} palette={palette} segments={86} seed={seed} />
        <Boulders field={field} palette={palette} count={70} seed={seed} />
        <WindField
          field={field}
          palette={palette}
          windSpeedMs={model.params.planet.windSpeedMs}
          windDirectionDeg={model.params.planet.windDirectionDeg}
          count={110}
        />
        <Astronaut engine={engine} heightM={model.params.human.heightM} />
      </group>

      <OrbitControls
        enablePan={false}
        enableDamping
        dampingFactor={0.1}
        minDistance={2.6}
        maxDistance={11}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI * 0.47}
        target={[0, 0.06, 0]}
      />
    </>
  );
}

/** A thin plinth so the diorama reads as a model sitting on a surface. */
function Plinth() {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.004, 0]}>
      <ringGeometry args={[6.2, 6.6, 64]} />
      <meshBasicMaterial color="#ffb52e" transparent opacity={0.32} side={THREE.DoubleSide} />
    </mesh>
  );
}

export function ARView() {
  const model = useConfigStore((state) => state.model);
  const planet = useConfigStore((state) => state.planet);
  const seed = useConfigStore((state) => state.seed);

  const palette = useMemo(
    () => deriveScenePalette(model.params.planet, model.planet),
    [model]
  );

  const camera = useCameraStream();
  const { tilt, permission, request } = useDeviceTilt();

  const jump = formatDistance(model.human.jumpHeightM);
  const airtime = formatDuration(model.human.airtimeS);

  const live = camera.status === 'live';

  return (
    <div className="sv-ar">
      <video
        ref={camera.videoRef}
        className="sv-ar-video"
        data-live={live}
        playsInline
        muted
        autoPlay
      />

      {live ? (
        <div className="sv-ar-canvas">
          <Canvas
            dpr={[1, 1.8]}
            gl={{ antialias: true, alpha: true }}
            camera={{ fov: 42, near: 0.1, far: 100, position: [0, 3.4, 5.6] }}
            onCreated={({ gl }) => {
              gl.setClearAlpha(0);
              gl.outputColorSpace = THREE.SRGBColorSpace;
            }}
          >
            <Diorama model={model} palette={palette} seed={seed} tilt={tilt} />
            <Plinth />
          </Canvas>
        </div>
      ) : null}

      <div className="sv-ar-hud">
        <div className="sv-hud-block">
          <span className="sv-hud-k">{planet.designation} · live overlay</span>
          <span className="sv-hud-v sv-hud-v--lg">
            {formatNumber(model.planet.gravityEarth, 2)}
            <span className="sv-hud-k"> g</span>
          </span>
          <span className="sv-hud-k">
            {jump.value} {jump.unit} apex · {airtime.value} {airtime.unit} airtime
          </span>
        </div>
      </div>

      {!live ? (
        <div className="sv-ar-prompt">
          <div className="sv-ar-prompt-inner">
            <CameraIcon size={26} />
            <div className="sv-sect-title" style={{ marginTop: 10 }}>
              Place this world in the room
            </div>
            <p className="sv-hint" style={{ marginTop: 8 }}>
              Opens the rear camera and drops the terrain in as a live diorama.
              Nothing is uploaded — the stream stays on the device.
            </p>
            {camera.error ? (
              <p className="sv-hint" style={{ marginTop: 8, color: 'var(--tp-acc-2)' }}>
                {camera.error}
              </p>
            ) : null}
            <button
              type="button"
              className="sv-btn sv-btn--primary sv-btn--block"
              style={{ marginTop: 14 }}
              onClick={() => {
                void camera.start();
                void request();
              }}
            >
              <CameraIcon size={14} />
              {camera.status === 'requesting' ? 'Opening camera' : 'Enable camera'}
            </button>
            {permission === 'denied' ? (
              <p className="sv-hint" style={{ marginTop: 8 }}>
                Motion access was declined — the diorama will still render, it
                just will not follow the phone.
              </p>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="sv-ar-hint">
          Drag to orbit · pinch to zoom
          {permission !== 'granted' ? ' · tilt to parallax' : ''}
        </div>
      )}
    </div>
  );
}

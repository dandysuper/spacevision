import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { clamp, degToRad } from '../lib/math';
import { createRandom } from '../lib/noise';
import type { ScenePalette } from '../types/scene';
import type { TerrainField } from './terrainField';

interface WindFieldProps {
  field: TerrainField;
  palette: ScenePalette;
  windSpeedMs: number;
  windDirectionDeg: number;
  /** Number of airborne streaks. Scales with quality tier. */
  count?: number;
}

const EXTENT = 68;
const CEILING = 14;

/**
 * The wind made visible: instanced dust streaks carried along the actual wind
 * bearing at a speed derived from the actual wind speed. On Titan this is a
 * lazy drift; on the Venus cloud deck it is a horizontal blur.
 */
export function WindField({
  field,
  palette,
  windSpeedMs,
  windDirectionDeg,
  count = 220,
}: WindFieldProps) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);

  const direction = useMemo(() => {
    const radians = degToRad(windDirectionDeg);
    return new THREE.Vector3(Math.sin(radians), 0, -Math.cos(radians));
  }, [windDirectionDeg]);

  const streaks = useMemo(() => {
    const random = createRandom(4471);
    const positions = new Float32Array(count * 3);
    const lengths = new Float32Array(count);
    const heights = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      positions[i * 3] = (random() * 2 - 1) * EXTENT;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = (random() * 2 - 1) * EXTENT;
      lengths[i] = 0.7 + random() * 2.6;
      heights[i] = 0.4 + random() * CEILING;
    }
    return { positions, lengths, heights };
  }, [count]);

  const visible = windSpeedMs > 0.15;

  useFrame((_state, delta) => {
    const instanced = mesh.current;
    if (!instanced || !visible) return;

    const step = clamp(delta, 0, 0.05);
    // Visual speed is deliberately slower than reality so it reads as motion
    // rather than a strobe, but it stays proportional to the real value.
    const travel = clamp(windSpeedMs * 0.35, 0.25, 34) * step;
    const { positions, lengths, heights } = streaks;

    for (let i = 0; i < count; i += 1) {
      let x = positions[i * 3] + direction.x * travel;
      let z = positions[i * 3 + 2] + direction.z * travel;

      if (x > EXTENT) x -= EXTENT * 2;
      if (x < -EXTENT) x += EXTENT * 2;
      if (z > EXTENT) z -= EXTENT * 2;
      if (z < -EXTENT) z += EXTENT * 2;

      positions[i * 3] = x;
      positions[i * 3 + 2] = z;

      const ground = field.heightAt(x, z);
      const y = ground + heights[i];

      dummy.position.set(x, y, z);
      dummy.rotation.set(0, Math.atan2(direction.x, direction.z), 0);
      dummy.scale.set(1, 1, lengths[i] * clamp(1 + windSpeedMs * 0.012, 1, 3.2));
      dummy.updateMatrix();
      instanced.setMatrixAt(i, dummy.matrix);
    }

    instanced.instanceMatrix.needsUpdate = true;
  });

  if (!visible) return null;

  const opacity = clamp(0.1 + palette.windStrength * 0.4, 0.08, 0.5);

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined as unknown as THREE.BufferGeometry, undefined as unknown as THREE.Material, count]}
      frustumCulled={false}
    >
      <boxGeometry args={[0.012, 0.012, 1]} />
      <meshBasicMaterial
        color={palette.dustColor}
        transparent
        opacity={opacity}
        depthWrite={false}
      />
    </instancedMesh>
  );
}

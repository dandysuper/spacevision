import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';
import { createRandom } from '../lib/noise';
import type { ScenePalette } from '../types/scene';
import type { TerrainField } from './terrainField';

interface BouldersProps {
  field: TerrainField;
  palette: ScenePalette;
  count?: number;
  seed: number;
}

const SCATTER_EXTENT = 74;

/**
 * Scattered rock, instanced. Placement is deterministic from the world seed and
 * every boulder is seated on the terrain field, so nothing floats.
 */
export function Boulders({ field, palette, count = 140, seed }: BouldersProps) {
  const mesh = useRef<THREE.InstancedMesh>(null);

  const transforms = useMemo(() => {
    const random = createRandom(seed * 3301 + 17);
    const items: Array<{
      position: [number, number, number];
      rotation: [number, number, number];
      scale: [number, number, number];
    }> = [];

    for (let i = 0; i < count; i += 1) {
      const x = (random() * 2 - 1) * SCATTER_EXTENT;
      const z = (random() * 2 - 1) * SCATTER_EXTENT;
      const distance = Math.hypot(x, z);
      if (distance < 2.8) continue;

      const ground = field.heightAt(x, z);
      const size = 0.14 + Math.pow(random(), 2.6) * 1.05;
      items.push({
        // Sunk slightly into the ground so they read as embedded, not placed.
        position: [x, ground + size * 0.12, z],
        rotation: [random() * Math.PI, random() * Math.PI, random() * Math.PI],
        scale: [
          size * (0.9 + random() * 0.35),
          size * (0.6 + random() * 0.45),
          size * (0.85 + random() * 0.35),
        ],
      });
    }
    return items;
  }, [field, count, seed]);

  useEffect(() => {
    const instanced = mesh.current;
    if (!instanced) return;
    const dummy = new THREE.Object3D();
    transforms.forEach((item, index) => {
      dummy.position.set(...item.position);
      dummy.rotation.set(...item.rotation);
      dummy.scale.set(...item.scale);
      dummy.updateMatrix();
      instanced.setMatrixAt(index, dummy.matrix);
    });
    instanced.instanceMatrix.needsUpdate = true;
    instanced.count = transforms.length;
  }, [transforms]);

  if (transforms.length === 0) return null;

  return (
    <instancedMesh
      ref={mesh}
      args={[undefined as unknown as THREE.BufferGeometry, undefined as unknown as THREE.Material, transforms.length]}
      castShadow
      receiveShadow
    >
      <icosahedronGeometry args={[1, 1]} />
      <meshStandardMaterial
        color={palette.rockColor}
        roughness={0.94}
        metalness={0.02}
        flatShading
      />
    </instancedMesh>
  );
}

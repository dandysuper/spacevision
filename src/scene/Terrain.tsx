import { useMemo } from 'react';
import * as THREE from 'three';
import { clamp, smoothstep } from '../lib/math';
import { fbm2D, hashInt } from '../lib/noise';
import type { ScenePalette } from '../types/scene';
import type { TerrainField } from './terrainField';
import { TERRAIN_EXTENT } from './terrainField';

interface TerrainProps {
  field: TerrainField;
  palette: ScenePalette;
  /** Grid resolution. 96 on phones, 160 on desktop. */
  segments: number;
  seed: number;
}

/**
 * Builds the ground from the shared terrain field: one geometry, vertex-coloured
 * by elevation, slope and a little per-vertex grain so large flats don't read
 * as flat plastic.
 */
export function Terrain({ field, palette, segments, seed }: TerrainProps) {
  const geometry = useMemo(() => {
    const seg = Math.max(24, Math.floor(segments));
    const size = TERRAIN_EXTENT * 2;
    const count = seg + 1;
    const cell = size / seg;

    const heights = new Float32Array(count * count);
    for (let iy = 0; iy < count; iy += 1) {
      const z = (iy / seg - 0.5) * size;
      for (let ix = 0; ix < count; ix += 1) {
        const x = (ix / seg - 0.5) * size;
        heights[iy * count + ix] = field.heightAt(x, z);
      }
    }

    const vertexCount = count * count;
    const positions = new Float32Array(vertexCount * 3);
    const colors = new Float32Array(vertexCount * 3);
    const indices = new Uint32Array(seg * seg * 6);

    const baseColor = new THREE.Color(palette.groundColor);
    const altColor = new THREE.Color(palette.groundAlt);
    const rockColor = new THREE.Color(palette.rockColor);
    const scratch = new THREE.Color();

    const span = Math.max(field.maxHeight - field.minHeight, 0.001);

    for (let iy = 0; iy < count; iy += 1) {
      const z = (iy / seg - 0.5) * size;
      for (let ix = 0; ix < count; ix += 1) {
        const index = iy * count + ix;
        const x = (ix / seg - 0.5) * size;
        const h = heights[index];

        positions[index * 3] = x;
        positions[index * 3 + 1] = h;
        positions[index * 3 + 2] = z;

        const left = heights[iy * count + Math.max(0, ix - 1)];
        const right = heights[iy * count + Math.min(count - 1, ix + 1)];
        const down = heights[Math.max(0, iy - 1) * count + ix];
        const up = heights[Math.min(count - 1, iy + 1) * count + ix];
        const slope = Math.hypot((right - left) / (2 * cell), (up - down) / (2 * cell));

        const heightNorm = smoothstep(clamp((h - field.minHeight) / span, 0, 1));
        const slopeFactor = clamp(slope * 1.9, 0, 1);

        scratch.copy(altColor).lerp(baseColor, heightNorm);
        scratch.lerp(rockColor, slopeFactor * 0.92);

        // Two scales of mottling: broad patches so big flats are not uniform,
        // plus per-vertex grain so close-ups do not band.
        const patch = fbm2D(x * 0.22, z * 0.22, { octaves: 3, seed: seed + 501 }) - 0.5;
        const speckle = fbm2D(x * 0.85, z * 0.85, { octaves: 2, seed: seed + 907 }) - 0.5;
        const grain = hashInt(index * 7 + seed * 131) - 0.5;
        const tint = 1 + patch * 0.26 + speckle * 0.12 + grain * 0.13;

        colors[index * 3] = clamp(scratch.r * tint, 0, 1);
        colors[index * 3 + 1] = clamp(scratch.g * tint, 0, 1);
        colors[index * 3 + 2] = clamp(scratch.b * tint, 0, 1);
      }
    }

    let cursor = 0;
    for (let iy = 0; iy < seg; iy += 1) {
      for (let ix = 0; ix < seg; ix += 1) {
        const a = iy * count + ix;
        const b = a + 1;
        const c = a + count;
        const d = c + 1;

        indices[cursor] = a;
        indices[cursor + 1] = c;
        indices[cursor + 2] = b;

        indices[cursor + 3] = b;
        indices[cursor + 4] = c;
        indices[cursor + 5] = d;
        cursor += 6;
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.setIndex(new THREE.BufferAttribute(indices, 1));
    geo.computeVertexNormals();
    geo.computeBoundingSphere();
    return geo;
  }, [field, palette, segments, seed]);

  return (
    <mesh geometry={geometry} receiveShadow castShadow={false}>
      <meshStandardMaterial
        vertexColors
        roughness={palette.groundRoughness}
        metalness={0.02}
        flatShading={false}
      />
    </mesh>
  );
}

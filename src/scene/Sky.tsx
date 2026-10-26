import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createRandom } from '../lib/noise';
import type { ScenePalette } from '../types/scene';

/**
 * Direction the star sits in, normalised. High and slightly toward the viewer
 * so the camera-facing surfaces are lit and shadows fall away from us.
 */
export const SUN_DIRECTION = new THREE.Vector3(0.52, 0.74, 0.42).normalize();

const vertexShader = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uTop;
  uniform vec3 uHorizon;
  uniform vec3 uHaze;
  uniform float uHazeStrength;
  varying vec3 vDirection;

  void main() {
    vec3 dir = normalize(vDirection);
    // 0 at the nadir, 0.5 at the horizon, 1 at the zenith.
    float h = clamp(dir.y * 0.5 + 0.5, 0.0, 1.0);
    float t = smoothstep(0.5, 0.95, h);
    vec3 colour = mix(uHorizon, uTop, t);

    // A dense band of scattering right at the horizon.
    float band = exp(-pow((h - 0.5) * 8.0, 2.0));
    colour = mix(colour, uHaze, band * uHazeStrength);

    // Slight lift below the horizon so the ground plane doesn't cut to black.
    colour = mix(colour, uHaze * 0.55, smoothstep(0.5, 0.1, h) * 0.6);

    gl_FragColor = vec4(colour, 1.0);
    #include <colorspace_fragment>
  }
`;

interface SkyProps {
  palette: ScenePalette;
}

export function Sky({ palette }: SkyProps) {
  // Created once and mutated in place. Replacing the uniforms object would
  // leave the compiled program holding the old colours, which is how an
  // airless world ends up wearing Mars's sky.
  const uniforms = useMemo(
    () => ({
      uTop: { value: new THREE.Color() },
      uHorizon: { value: new THREE.Color() },
      uHaze: { value: new THREE.Color() },
      uHazeStrength: { value: 0 },
    }),
    []
  );

  uniforms.uTop.value.set(palette.skyTop);
  uniforms.uHorizon.value.set(palette.skyHorizon);
  uniforms.uHaze.value.set(palette.hazeColor);
  uniforms.uHazeStrength.value = palette.hazeOpacity;

  return (
    <mesh renderOrder={-10} frustumCulled={false}>
      <sphereGeometry args={[600, 32, 24]} />
      <shaderMaterial
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

interface StarsProps {
  opacity: number;
  count?: number;
}

export function Stars({ opacity, count = 1400 }: StarsProps) {
  const geometry = useMemo(() => {
    const random = createRandom(90210);
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    for (let i = 0; i < count; i += 1) {
      // Uniform on the upper hemisphere shell, biased away from the horizon.
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(1 - random() * 0.95);
      const radius = 480;
      const x = Math.sin(phi) * Math.cos(theta) * radius;
      const y = Math.abs(Math.cos(phi)) * radius;
      const z = Math.sin(phi) * Math.sin(theta) * radius;
      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;
      sizes[i] = 0.5 + random() * 1.7;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    return geo;
  }, [count]);

  const material = useMemo(() => {
    const mat = new THREE.PointsMaterial({
      color: '#ffffff',
      size: 1.6,
      sizeAttenuation: false,
      transparent: true,
      opacity,
      depthWrite: false,
      fog: false,
    });
    return mat;
  }, []);

  material.opacity = opacity;
  material.visible = opacity > 0.02;

  if (opacity <= 0.02) return null;

  return <points geometry={geometry} material={material} frustumCulled={false} renderOrder={-9} />;
}

interface SunDiscProps {
  palette: ScenePalette;
}

/** A bright disc where the star is. Purely visual, but it anchors the light. */
export function SunDisc({ palette }: SunDiscProps) {
  const ref = useRef<THREE.Mesh>(null);
  const position = useMemo(
    () => SUN_DIRECTION.clone().multiplyScalar(430).toArray() as [number, number, number],
    []
  );

  useFrame(({ camera }) => {
    if (ref.current) ref.current.lookAt(camera.position);
  });

  const size = 9 + palette.sunIntensity * 7;

  return (
    <mesh ref={ref} position={position} renderOrder={-8} frustumCulled={false}>
      <circleGeometry args={[size, 32]} />
      <meshBasicMaterial
        color={palette.sunColor}
        transparent
        opacity={0.92}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  );
}

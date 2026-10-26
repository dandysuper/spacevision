import * as THREE from 'three';

let cached: THREE.Texture | null = null;

/**
 * A radial alpha ramp used as the contact shadow's alphaMap. A hard-edged
 * circle reads as a painted patch; a soft one reads as a shadow. Generated
 * once and shared, since every shadow in the app wants the same ramp.
 */
export function contactShadowTexture(): THREE.Texture {
  if (cached) return cached;

  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const ctx = canvas.getContext('2d');
  if (ctx) {
    const gradient = ctx.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );
    gradient.addColorStop(0, '#ffffff');
    gradient.addColorStop(0.42, '#d8d8d8');
    gradient.addColorStop(0.72, '#4a4a4a');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.NoColorSpace;
  texture.needsUpdate = true;
  cached = texture;
  return texture;
}

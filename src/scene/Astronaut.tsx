import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { RIG } from '../simulation/figure';
import { contactShadowTexture } from './softShadow';
import type { GaitEngine } from '../simulation/GaitEngine';

interface AstronautProps {
  engine: GaitEngine;
  heightM: number;
}

const SUIT_COLOR = '#e6e1d2';
const SUIT_DARK = '#3c3831';
const VISOR_COLOR = '#0d0b06';
const ACCENT_COLOR = '#ffb52e';

/**
 * An articulated figure built from primitives. Nothing here is keyframed —
 * every joint angle comes from the gait engine, which integrates the planet's
 * gravity, the suit's mobility and the wind load each frame.
 */
export function Astronaut({ engine, heightM }: AstronautProps) {
  const H = heightM;

  const dims = useMemo(() => {
    const hipY = RIG.hip * H;
    const torsoLen = RIG.torso * H;
    const torsoW = 0.21 * H;
    const torsoD = 0.14 * H;
    const headR = RIG.head * H;
    const shoulderX = RIG.shoulder * H;
    const upperArmLen = RIG.upperArm * H;
    const forearmLen = RIG.forearm * H;
    const armR = RIG.armRadius * H;
    const thighLen = RIG.thigh * H;
    const shinLen = RIG.shin * H;
    const legR = RIG.legRadius * H;
    const footLen = RIG.foot * H;
    const footH = RIG.footHeight * H;
    return {
      hipY,
      torsoLen,
      torsoW,
      torsoD,
      headR,
      shoulderX,
      upperArmLen,
      forearmLen,
      armR,
      thighLen,
      shinLen,
      legR,
      footLen,
      footH,
    };
  }, [H]);

  const shadowTexture = useMemo(() => contactShadowTexture(), []);

  const root = useRef<THREE.Group>(null);
  const lean = useRef<THREE.Group>(null);
  const pelvis = useRef<THREE.Group>(null);
  const torso = useRef<THREE.Group>(null);
  const head = useRef<THREE.Group>(null);
  const shadow = useRef<THREE.Mesh>(null);

  const hipPivots = useRef<[THREE.Group | null, THREE.Group | null]>([null, null]);
  const kneePivots = useRef<[THREE.Group | null, THREE.Group | null]>([null, null]);
  const anklePivots = useRef<[THREE.Group | null, THREE.Group | null]>([null, null]);
  const shoulderPivots = useRef<[THREE.Group | null, THREE.Group | null]>([null, null]);
  const elbowPivots = useRef<[THREE.Group | null, THREE.Group | null]>([null, null]);

  useFrame(() => {
    const pose = engine.pose;
    const snap = engine.snapshot;

    if (root.current) {
      root.current.position.set(snap.x, snap.y, snap.z);
    }
    if (lean.current) {
      lean.current.rotation.x = pose.leanForward;
      lean.current.rotation.z = -pose.leanSide;
    }
    if (pelvis.current) {
      pelvis.current.position.y = pose.rootHeight;
      pelvis.current.rotation.y = pose.torsoTwist;
    }
    if (torso.current) {
      torso.current.rotation.x = pose.leanForward * 0.35;
    }
    if (head.current) {
      head.current.rotation.x = pose.headPitch;
    }

    for (let side = 0; side < 2; side += 1) {
      const hip = hipPivots.current[side];
      const knee = kneePivots.current[side];
      const ankle = anklePivots.current[side];
      const shoulder = shoulderPivots.current[side];
      const elbow = elbowPivots.current[side];

      if (hip) hip.rotation.x = pose.hips[side];
      if (knee) knee.rotation.x = pose.knees[side];
      if (ankle) ankle.rotation.x = pose.ankles[side];
      if (shoulder) {
        shoulder.rotation.x = pose.shoulders[side];
        shoulder.rotation.z =
          (side === 0 ? -1 : 1) * (0.08 + pose.armRaise * 0.75);
      }
      if (elbow) elbow.rotation.x = -pose.elbows[side];
    }

    if (shadow.current) {
      const altitude = Math.max(snap.altitudeM, 0);
      const scale = 1 + altitude * 0.32;
      shadow.current.scale.setScalar(scale);
      const material = shadow.current.material as THREE.MeshBasicMaterial;
      material.opacity = Math.max(0, 0.72 - altitude * 0.05);
    }
  });

  const legSide = (side: 0 | 1) => {
    const offset = (side === 0 ? -1 : 1) * dims.legR * 1.35;
    return (
      <group
        position={[offset, 0, 0]}
        ref={(node) => {
          hipPivots.current[side] = node;
        }}
      >
        {/* hip ball closes the gap to the pelvis */}
        <mesh castShadow>
          <sphereGeometry args={[dims.legR * 1.06, 14, 12]} />
          <meshStandardMaterial color={SUIT_DARK} roughness={0.88} metalness={0.08} />
        </mesh>
        <mesh position={[0, -dims.thighLen / 2, 0]} castShadow>
          <capsuleGeometry args={[dims.legR, dims.thighLen - dims.legR * 2, 4, 12]} />
          <meshStandardMaterial color={SUIT_COLOR} roughness={0.85} metalness={0.05} />
        </mesh>
        <group
          position={[0, -dims.thighLen, 0]}
          ref={(node) => {
            kneePivots.current[side] = node;
          }}
        >
          {/* knee ball */}
          <mesh castShadow>
            <sphereGeometry args={[dims.legR * 0.95, 14, 12]} />
            <meshStandardMaterial color={SUIT_DARK} roughness={0.88} metalness={0.08} />
          </mesh>
          <mesh position={[0, -dims.shinLen / 2, 0]} castShadow>
            <capsuleGeometry args={[dims.legR * 0.86, dims.shinLen - dims.legR * 1.72, 4, 12]} />
            <meshStandardMaterial color={SUIT_COLOR} roughness={0.8} metalness={0.05} />
          </mesh>
          {/* ankle collar + boot */}
          <mesh position={[0, -dims.shinLen + dims.footH * 0.4, 0]}>
            <cylinderGeometry args={[dims.legR * 0.9, dims.legR * 0.82, dims.footH * 1.3, 12]} />
            <meshStandardMaterial color={SUIT_DARK} roughness={0.9} metalness={0.1} />
          </mesh>
          <group
            position={[0, -dims.shinLen, 0]}
            ref={(node) => {
              anklePivots.current[side] = node;
            }}
          >
            <mesh position={[0, -dims.footH / 2, -dims.footLen * 0.28]} castShadow>
              <boxGeometry args={[dims.legR * 2.1, dims.footH, dims.footLen]} />
              <meshStandardMaterial color={SUIT_DARK} roughness={0.95} metalness={0.1} />
            </mesh>
          </group>
        </group>
      </group>
    );
  };

  const armSide = (side: 0 | 1) => {
    const offset = (side === 0 ? -1 : 1) * dims.shoulderX;
    return (
      <group
        position={[offset, dims.torsoLen * 0.86, 0]}
        ref={(node) => {
          shoulderPivots.current[side] = node;
        }}
      >
        {/* shoulder cap */}
        <mesh castShadow>
          <sphereGeometry args={[dims.armR * 1.22, 14, 12]} />
          <meshStandardMaterial color={SUIT_COLOR} roughness={0.84} metalness={0.06} />
        </mesh>
        <mesh position={[0, -dims.upperArmLen / 2, 0]} castShadow>
          <capsuleGeometry args={[dims.armR, dims.upperArmLen - dims.armR * 2, 4, 10]} />
          <meshStandardMaterial color={SUIT_COLOR} roughness={0.85} metalness={0.05} />
        </mesh>
        <group
          position={[0, -dims.upperArmLen, 0]}
          ref={(node) => {
            elbowPivots.current[side] = node;
          }}
        >
          {/* elbow ball */}
          <mesh castShadow>
            <sphereGeometry args={[dims.armR * 0.98, 12, 10]} />
            <meshStandardMaterial color={SUIT_DARK} roughness={0.9} metalness={0.1} />
          </mesh>
          <mesh position={[0, -dims.forearmLen / 2, 0]} castShadow>
            <capsuleGeometry args={[dims.armR * 0.84, dims.forearmLen - dims.armR * 1.68, 4, 10]} />
            <meshStandardMaterial color={SUIT_DARK} roughness={0.9} metalness={0.1} />
          </mesh>
          <mesh position={[0, -dims.forearmLen - dims.armR, 0]} castShadow>
            <sphereGeometry args={[dims.armR * 1.15, 10, 8]} />
            <meshStandardMaterial color={SUIT_DARK} roughness={0.9} />
          </mesh>
        </group>
      </group>
    );
  };

  return (
    <group ref={root}>
      {/* Contact shadow. A soft radial ramp keeps it reading as shade rather
          than a disc painted on the ground. */}
      <mesh ref={shadow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.016, 0]}>
        <circleGeometry args={[0.46 * H, 28]} />
        <meshBasicMaterial
          color="#000000"
          alphaMap={shadowTexture}
          transparent
          opacity={0.62}
          depthWrite={false}
        />
      </mesh>

      <group ref={lean}>
        <group ref={pelvis} position={[0, dims.hipY, 0]}>
          {/* pelvis block, kept low so the waist does not read as a belt */}
          <mesh position={[0, 0.005 * H, 0]} castShadow>
            <boxGeometry args={[dims.torsoW * 0.86, 0.062 * H, dims.torsoD * 0.88]} />
            <meshStandardMaterial color={SUIT_DARK} roughness={0.9} metalness={0.08} />
          </mesh>

          <group ref={torso} position={[0, 0.04 * H, 0]}>
            {/* chest */}
            <mesh position={[0, dims.torsoLen * 0.5, 0]} castShadow>
              <capsuleGeometry
                args={[dims.torsoW * 0.4, dims.torsoLen * 0.72, 6, 14]}
              />
              <meshStandardMaterial color={SUIT_COLOR} roughness={0.82} metalness={0.06} />
            </mesh>

            {/* shoulder yoke — bridges chest to both arm sockets so the arms
                are attached rather than hovering alongside */}
            <mesh position={[0, dims.torsoLen * 0.84, 0]} castShadow>
              <boxGeometry
                args={[dims.shoulderX * 2, dims.torsoLen * 0.2, dims.torsoD * 0.86]}
              />
              <meshStandardMaterial color={SUIT_COLOR} roughness={0.84} metalness={0.05} />
            </mesh>
            <mesh position={[0, dims.torsoLen * 0.84, 0]} scale={[1, 1, 0.92]}>
              <sphereGeometry args={[dims.shoulderX * 1.02, 16, 12]} />
              <meshStandardMaterial color={SUIT_COLOR} roughness={0.84} metalness={0.05} />
            </mesh>

            {/* life-support pack, sitting proud of the back */}
            <mesh position={[0, dims.torsoLen * 0.56, dims.torsoD * 0.92]} castShadow>
              <boxGeometry args={[dims.torsoW * 0.66, dims.torsoLen * 0.66, dims.torsoD * 0.46]} />
              <meshStandardMaterial color={SUIT_DARK} roughness={0.95} metalness={0.05} />
            </mesh>
            {/* pack end caps read as tanks from the side */}
            <mesh position={[dims.torsoW * 0.24, dims.torsoLen * 0.62, dims.torsoD * 0.92]}>
              <cylinderGeometry args={[dims.torsoD * 0.14, dims.torsoD * 0.14, dims.torsoLen * 0.58, 10]} />
              <meshStandardMaterial color={SUIT_DARK} roughness={0.6} metalness={0.35} />
            </mesh>
            <mesh position={[-dims.torsoW * 0.24, dims.torsoLen * 0.62, dims.torsoD * 0.92]}>
              <cylinderGeometry args={[dims.torsoD * 0.14, dims.torsoD * 0.14, dims.torsoLen * 0.58, 10]} />
              <meshStandardMaterial color={SUIT_DARK} roughness={0.6} metalness={0.35} />
            </mesh>

            {/* chest control panel — the amber accent */}
            <mesh position={[0, dims.torsoLen * 0.58, -dims.torsoD * 0.44]}>
              <boxGeometry args={[dims.torsoW * 0.44, dims.torsoLen * 0.2, 0.012 * H]} />
              <meshStandardMaterial
                color={ACCENT_COLOR}
                emissive={ACCENT_COLOR}
                emissiveIntensity={0.55}
                roughness={0.5}
              />
            </mesh>

            {/* neck ring */}
            <mesh position={[0, dims.torsoLen * 0.96, 0]}>
              <torusGeometry args={[dims.headR * 0.62, dims.headR * 0.16, 8, 20]} />
              <meshStandardMaterial color={SUIT_DARK} roughness={0.7} metalness={0.3} />
            </mesh>

            <group ref={head} position={[0, dims.torsoLen + dims.headR * 0.86, 0]}>
              <mesh castShadow>
                <sphereGeometry args={[dims.headR, 24, 18]} />
                <meshStandardMaterial
                  color={SUIT_COLOR}
                  roughness={0.35}
                  metalness={0.15}
                />
              </mesh>
              {/* visor — big enough to read as a face, wrapping the front */}
              <mesh position={[0, -dims.headR * 0.04, -dims.headR * 0.5]} scale={[0.9, 0.78, 0.7]}>
                <sphereGeometry args={[dims.headR, 24, 18]} />
                <meshStandardMaterial
                  color={VISOR_COLOR}
                  roughness={0.06}
                  metalness={0.92}
                  emissive="#241804"
                  emissiveIntensity={0.6}
                />
              </mesh>
            </group>
          </group>

          {legSide(0)}
          {legSide(1)}
          {armSide(0)}
          {armSide(1)}
        </group>
      </group>
    </group>
  );
}

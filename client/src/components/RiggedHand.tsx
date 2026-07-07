import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useSpring, animated } from '@react-spring/three';
import * as THREE from 'three';

// ------------------------------------------------------------------
// Types (exported for GameScreen)
// ------------------------------------------------------------------
export type HandPose = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type HandState = 'idle' | 'breathing' | 'shaking' | 'reveal' | 'victory' | 'defeat';

interface RiggedHandProps {
  pose: HandPose;
  state: HandState;
  facing: 'up' | 'down';
  colorTheme: 'cyan' | 'pink';
  /** optional scale factor (default: 1) – fine‑tune size */
  scale?: number;
}

// ------------------------------------------------------------------
// Joint rotation data (same as before)
// ------------------------------------------------------------------
type FingerName = 'thumb' | 'index' | 'middle' | 'ring' | 'pinky';
type JointRotations = { mcp: number; pip: number; dip: number };

const POSE_ROTATIONS: Record<HandPose, Record<FingerName, JointRotations>> = {
  0: {
    thumb: { mcp: 60, pip: 65, dip: 45 },
    index: { mcp: 110, pip: 110, dip: 90 },
    middle: { mcp: 110, pip: 115, dip: 90 },
    ring: { mcp: 110, pip: 115, dip: 90 },
    pinky: { mcp: 110, pip: 110, dip: 90 },
  },
  1: {
    thumb: { mcp: 60, pip: 65, dip: 45 },
    index: { mcp: 0, pip: 0, dip: 0 },
    middle: { mcp: 110, pip: 115, dip: 90 },
    ring: { mcp: 110, pip: 115, dip: 90 },
    pinky: { mcp: 110, pip: 110, dip: 90 },
  },
  2: {
    thumb: { mcp: 60, pip: 65, dip: 45 },
    index: { mcp: -10, pip: 0, dip: 0 },
    middle: { mcp: 10, pip: 0, dip: 0 },
    ring: { mcp: 110, pip: 115, dip: 90 },
    pinky: { mcp: 110, pip: 110, dip: 90 },
  },
  3: {
    thumb: { mcp: 60, pip: 65, dip: 45 },
    index: { mcp: -12, pip: 0, dip: 0 },
    middle: { mcp: 0, pip: 0, dip: 0 },
    ring: { mcp: 12, pip: 0, dip: 0 },
    pinky: { mcp: 110, pip: 110, dip: 90 },
  },
  4: {
    thumb: { mcp: 60, pip: 65, dip: 45 },
    index: { mcp: -15, pip: 0, dip: 0 },
    middle: { mcp: -5, pip: 0, dip: 0 },
    ring: { mcp: 5, pip: 0, dip: 0 },
    pinky: { mcp: 15, pip: 0, dip: 0 },
  },
  5: {
    thumb: { mcp: -25, pip: -10, dip: -5 },
    index: { mcp: -15, pip: 0, dip: 0 },
    middle: { mcp: 0, pip: 0, dip: 0 },
    ring: { mcp: 10, pip: 0, dip: 0 },
    pinky: { mcp: 20, pip: 0, dip: 0 },
  },
  6: {
    thumb: { mcp: -30, pip: -15, dip: -10 },
    index: { mcp: 110, pip: 110, dip: 90 },
    middle: { mcp: 110, pip: 115, dip: 90 },
    ring: { mcp: 110, pip: 115, dip: 90 },
    pinky: { mcp: 110, pip: 110, dip: 90 },
  },
};

// ------------------------------------------------------------------
// A single phalanx (capsule) with physically‑based material
// ------------------------------------------------------------------
const Phalanx: React.FC<{
  length: number;
  radius: number;
  color: string;
  glowColor: string;
}> = ({ length, radius, color, glowColor }) => {
  return (
    <mesh position={[0, -length / 2, 0]}>
      <capsuleGeometry args={[radius, length, 12, 16]} />
      <meshPhysicalMaterial
        color={color}
        roughness={0.35}
        metalness={0.0}
        clearcoat={0.15}
        clearcoatRoughness={0.4}
        emissive={glowColor}
        emissiveIntensity={0.04}
      />
    </mesh>
  );
};

// ------------------------------------------------------------------
// A finger – three phalanges with spring‑animated joints
// ------------------------------------------------------------------
const Finger: React.FC<{
  finger: FingerName;
  rotations: JointRotations;
  color: string;
  glowColor: string;
  isThumb?: boolean;
}> = ({ finger, rotations, color, glowColor, isThumb = false }) => {
  const springMCP = useSpring({
    rotation: [0, 0, THREE.MathUtils.degToRad(rotations.mcp)],
    config: { mass: 1.2, tension: 140, friction: 16 },
  });
  const springPIP = useSpring({
    rotation: [0, 0, THREE.MathUtils.degToRad(rotations.pip)],
    config: { mass: 1.2, tension: 140, friction: 16 },
  });
  const springDIP = useSpring({
    rotation: [0, 0, THREE.MathUtils.degToRad(rotations.dip)],
    config: { mass: 1.2, tension: 140, friction: 16 },
  });

  const offsets: Record<FingerName, { x: number; z: number }> = {
    thumb: { x: -1.8, z: 0.8 },
    index: { x: -0.9, z: -0.3 },
    middle: { x: 0, z: -0.5 },
    ring: { x: 0.9, z: -0.3 },
    pinky: { x: 1.6, z: 0.2 },
  };
  const offset = offsets[finger];
  const baseRotation = isThumb ? [0, 0, -Math.PI / 6] : [0, 0, 0];

  return (
    <group position={[offset.x, 0, offset.z]} rotation={baseRotation}>
      <animated.group rotation={springMCP.rotation as any}>
        <Phalanx length={1.2} radius={0.25} color={color} glowColor={glowColor} />
        <group position={[0, -1.2, 0]}>
          <animated.group rotation={springPIP.rotation as any}>
            <Phalanx length={0.9} radius={0.22} color={color} glowColor={glowColor} />
            <group position={[0, -0.9, 0]}>
              <animated.group rotation={springDIP.rotation as any}>
                <Phalanx length={0.7} radius={0.2} color={color} glowColor={glowColor} />
              </animated.group>
            </group>
          </animated.group>
        </group>
      </animated.group>
    </group>
  );
};

// ------------------------------------------------------------------
// The 3D Hand – uses responsive camera and container sizing
// ------------------------------------------------------------------
const RiggedHand3D: React.FC<RiggedHandProps> = ({
  pose,
  state,
  facing,
  colorTheme,
  scale = 1,
}) => {
  const groupRef = useRef<THREE.Group>(null);
  const { camera, size } = useThree();

  // Auto‑adjust camera distance so the hand always fits within the container
  // with a nice margin.
  useEffect(() => {
    const aspect = size.width / size.height;
    // The hand is roughly 4 units tall and 3 wide.
    // We want the hand to occupy about 70% of the viewport height.
    const targetHeight = 4.2 * scale;
    const distance = targetHeight / (2 * Math.tan((camera.fov * Math.PI) / 360));
    camera.position.set(0, 1.2, 9);
    camera.lookAt(0, 0.5, 0);
    camera.updateProjectionMatrix();
  }, [size, scale, camera]);

  // Color palette
  const colors = useMemo(
    () => ({
      cyan: { main: '#00f0ff', glow: '#00f0ff' },
      pink: { main: '#ff6b9d', glow: '#ff6b9d' },
    }),
    []
  );
  const { main, glow } = colors[colorTheme];
  const rotations = POSE_ROTATIONS[pose];
  const facingRotation = facing === 'up' ? 0 : Math.PI;

  // State‑based animations
  useFrame(({ clock }) => {
    if (!groupRef.current) return;
    const elapsed = clock.getElapsedTime();

    if (state === 'idle' || state === 'breathing') {
      const breathe = Math.sin(elapsed * 1.5) * 0.02;
      groupRef.current.position.y = breathe;
      groupRef.current.rotation.z = Math.sin(elapsed * 0.8) * 0.005;
    }

    if (state === 'shaking') {
      const shake = Math.sin(elapsed * 40) * 0.03;
      groupRef.current.rotation.z = shake;
      groupRef.current.position.x = Math.sin(elapsed * 35) * 0.02;
    }

    if (state === 'reveal') {
      const pop = 1 + 0.05 * Math.sin(elapsed * 20);
      groupRef.current.scale.set(pop, pop, pop);
    } else {
      groupRef.current.scale.set(1, 1, 1);
    }

    if (state === 'victory') {
      const bounce = Math.abs(Math.sin(elapsed * 3)) * 0.1;
      groupRef.current.position.y = bounce;
    }

    if (state === 'defeat') {
      groupRef.current.position.y = -0.5;
    }
  });

  return (
    <group
    ref={groupRef}
    position={[0, 0.8, 0]}
    rotation={[facingRotation,0,0]}
    scale={scale * 0.8}
>
      {/* Palm with rounded box */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.4, 0.8, 1.6]} />
        <meshPhysicalMaterial
          color={main}
          roughness={0.4}
          metalness={0.0}
          clearcoat={0.2}
          emissive={glow}
          emissiveIntensity={0.04}
        />
      </mesh>

      <Finger finger="thumb" rotations={rotations.thumb} color={main} glowColor={glow} isThumb />
      <Finger finger="index" rotations={rotations.index} color={main} glowColor={glow} />
      <Finger finger="middle" rotations={rotations.middle} color={main} glowColor={glow} />
      <Finger finger="ring" rotations={rotations.ring} color={main} glowColor={glow} />
      <Finger finger="pinky" rotations={rotations.pinky} color={main} glowColor={glow} />
    </group>
  );
};

// ------------------------------------------------------------------
// Exported component – wraps Canvas and handles container sizing
// ------------------------------------------------------------------
export const RiggedHand: React.FC<RiggedHandProps> = (props) => {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        opacity: props.state === 'defeat' ? 0.4 : 1,
        transition: 'opacity 1000ms ease',
      }}
    >
    <Canvas
  shadows
  camera={{
    position: [0, 1.5, 15],
    fov: 95,
  }}

        style={{ width: '100%', height: '100%' }}
        dpr={[1, 2]} // adapt to device pixel ratio
      >
        <ambientLight intensity={0.6} />
        <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow />
        <directionalLight position={[-5, 3, -5]} intensity={0.4} />
        <pointLight position={[0, 0, 3]} intensity={0.6} />

        <RiggedHand3D {...props} />
      </Canvas>
    </div>
  );
};
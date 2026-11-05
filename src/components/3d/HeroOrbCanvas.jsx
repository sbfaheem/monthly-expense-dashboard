import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Float, ContactShadows, MeshDistortMaterial } from '@react-three/drei'
import * as THREE from 'three'

function PhysicalGlassOrb({ isSurplus, isBouncing, onBounceComplete }) {
  const meshRef = useRef()
  const [bouncePhase, setBouncePhase] = useState(0) // 0: idle, 1: dropping, 2: squashing, 3: rebounding

  // Color tokens based on surplus vs deficit
  const primaryColor = isSurplus ? '#10b981' : '#f43f5e'
  const rimGlowColor = isSurplus ? '#6ee7b7' : '#fda4af'

  useEffect(() => {
    if (isBouncing) {
      setBouncePhase(1)
    }
  }, [isBouncing])

  useFrame((state, delta) => {
    if (!meshRef.current) return

    // Subtle continuous idle rotation
    meshRef.current.rotation.y += delta * 0.4
    meshRef.current.rotation.x += delta * 0.2

    // Real-time bounce physics state machine
    if (bouncePhase === 1) {
      // Phase 1: Dropping & accelerating towards card contact plane
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, -0.65, 0.28)
      meshRef.current.scale.set(0.85, 1.15, 0.85) // vertical stretch

      if (meshRef.current.position.y <= -0.6) {
        setBouncePhase(2)
      }
    } else if (bouncePhase === 2) {
      // Phase 2: Impact squash
      meshRef.current.position.y = -0.72
      meshRef.current.scale.set(1.35, 0.65, 1.35) // horizontal elastic flatten

      setTimeout(() => setBouncePhase(3), 80)
    } else if (bouncePhase === 3) {
      // Phase 3: Rebound launch back to floating rest position
      meshRef.current.position.y = THREE.MathUtils.lerp(meshRef.current.position.y, 0.15, 0.18)
      meshRef.current.scale.set(0.95, 1.05, 0.95)

      if (Math.abs(meshRef.current.position.y - 0.15) < 0.05) {
        meshRef.current.position.y = 0.15
        meshRef.current.scale.set(1, 1, 1)
        setBouncePhase(0)
        if (onBounceComplete) onBounceComplete()
      }
    }
  })

  return (
    <group position={[0, 0, 0]}>
      {/* Real 3D Physical Glass Orb */}
      <mesh ref={meshRef} position={[0, 0.15, 0]} castShadow receiveShadow>
        <sphereGeometry args={[0.92, 64, 64]} />
        <meshPhysicalMaterial
          color={primaryColor}
          transmission={0.92}
          opacity={1}
          transparent
          roughness={0.12}
          ior={1.48}
          thickness={1.6}
          specularIntensity={1.2}
          clearcoat={1}
          clearcoatRoughness={0.08}
          emissive={primaryColor}
          emissiveIntensity={0.15}
        />
      </mesh>

      {/* Floating Orbital Gyro Ring */}
      <mesh rotation={[Math.PI / 3, 0.4, 0]}>
        <torusGeometry args={[1.35, 0.035, 24, 64]} />
        <meshStandardMaterial
          color={rimGlowColor}
          emissive={rimGlowColor}
          emissiveIntensity={0.6}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Soft Ground Contact Shadow */}
      <ContactShadows
        position={[0, -0.95, 0]}
        opacity={0.65}
        scale={4}
        blur={2.4}
        far={2}
        color={isSurplus ? '#064e3b' : '#881337'}
      />
    </group>
  )
}

export default function HeroOrbCanvas({ isSurplus = true, isBouncing = false, onTriggerBounce, onBounceComplete }) {
  return (
    <div
      onClick={onTriggerBounce}
      className="relative size-24 sm:size-28 cursor-pointer select-none group"
      title="Tap 3D Orb to bounce & cycle financial cards"
    >
      {/* 3D WebGL Canvas */}
      <Canvas
        shadows
        dpr={[1, 2]}
        camera={{ position: [0, 0.2, 3.2], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full pointer-events-none"
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[4, 5, 4]} intensity={1.4} castShadow />
        <pointLight position={[-3, -2, -2]} intensity={0.8} color={isSurplus ? '#34d399' : '#f43f5e'} />
        
        <Float speed={2.2} rotationIntensity={0.4} floatIntensity={0.5}>
          <PhysicalGlassOrb
            isSurplus={isSurplus}
            isBouncing={isBouncing}
            onBounceComplete={onBounceComplete}
          />
        </Float>
      </Canvas>
    </div>
  )
}
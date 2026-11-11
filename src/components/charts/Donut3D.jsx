import React, { useMemo, useRef, useEffect, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { ContactShadows, Float } from '@react-three/drei'
import { useReducedMotion } from 'framer-motion'
import * as THREE from 'three'
import SvgDonutFallback from './SvgDonutFallback'
import AnimatedNumber from '../motion/AnimatedNumber'
import { translateMonth } from '../../utils/translations'

function isWebGLAvailable() {
  if (typeof window === 'undefined' || typeof document === 'undefined') return false
  try {
    const canvas = document.createElement('canvas')
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    )
  } catch {
    return false
  }
}

class CanvasErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }
  static getDerivedStateFromError() {
    return { hasError: true }
  }
  componentDidCatch() {
    // Gracefully fall back to oblique SVG donut if WebGL fails
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}

function createDonutSectorGeometry(startDeg, endDeg, rInner = 0.82, rOuter = 1.52, depth = 0.36) {
  const safeSpan = Math.max(2.2, endDeg - startDeg)
  const startRad = Math.PI / 2 - THREE.MathUtils.degToRad(startDeg)
  const endRad = Math.PI / 2 - THREE.MathUtils.degToRad(startDeg + safeSpan)

  const segments = Math.max(10, Math.ceil((safeSpan / 360) * 64))
  const shape = new THREE.Shape()

  const startInnerX = rInner * Math.cos(startRad)
  const startInnerY = rInner * Math.sin(startRad)
  shape.moveTo(startInnerX, startInnerY)

  for (let i = 0; i <= segments; i++) {
    const t = i / segments
    const theta = startRad + (endRad - startRad) * t
    shape.lineTo(rOuter * Math.cos(theta), rOuter * Math.sin(theta))
  }

  for (let i = segments; i >= 0; i--) {
    const t = i / segments
    const theta = startRad + (endRad - startRad) * t
    shape.lineTo(rInner * Math.cos(theta), rInner * Math.sin(theta))
  }

  shape.closePath()

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.055,
    bevelSize: 0.038,
    bevelSegments: 4,
    curveSegments: 32,
  })

  geometry.translate(0, 0, -depth / 2)
  geometry.computeVertexNormals()
  return geometry
}

function DonutSliceMesh({
  item,
  index,
  sliceCount,
  isSelected,
  isDimmed,
  onSelect,
  inView,
  replayKey,
}) {
  const meshRef = useRef(null)
  const materialRef = useRef(null)
  const elapsedRef = useRef(0)

  const gapDeg = sliceCount > 1 ? 2.4 : 0
  const effectiveStart = item.startAngle + gapDeg / 2
  const effectiveEnd = Math.max(effectiveStart + 2.5, item.endAngle - gapDeg / 2)

  const midRad = Math.PI / 2 - THREE.MathUtils.degToRad((effectiveStart + effectiveEnd) / 2)
  const radialX = Math.cos(midRad)
  const radialY = Math.sin(midRad)

  const geometry = useMemo(
    () => createDonutSectorGeometry(effectiveStart, effectiveEnd),
    [effectiveStart, effectiveEnd]
  )

  useEffect(() => {
    return () => {
      geometry.dispose()
    }
  }, [geometry])

  useEffect(() => {
    elapsedRef.current = 0
  }, [replayKey, inView])

  useFrame((_, delta) => {
    const mesh = meshRef.current
    const mat = materialRef.current
    if (!mesh || !mat) return

    if (inView) {
      elapsedRef.current += Math.min(delta, 0.05)
    }

    const introDelay = index * 0.12
    const introDuration = 0.45
    const rawP = inView
      ? THREE.MathUtils.clamp((elapsedRef.current - introDelay) / introDuration, 0, 1)
      : 0
    const easedIntro = 1 - Math.pow(1 - rawP, 3)

    const targetX = isSelected ? radialX * 0.18 : 0
    const targetY = isSelected ? radialY * 0.18 : 0
    const targetZ = isSelected ? 0.22 : 0
    const targetScale = isSelected ? 1.04 : 1.0

    const dampFactor = 1 - Math.exp(-10 * Math.min(delta, 0.05))
    mesh.position.x = THREE.MathUtils.lerp(mesh.position.x, targetX, dampFactor)
    mesh.position.y = THREE.MathUtils.lerp(mesh.position.y, targetY, dampFactor)
    mesh.position.z = THREE.MathUtils.lerp(mesh.position.z, targetZ, dampFactor)

    const s = Math.max(0.001, easedIntro * targetScale)
    mesh.scale.set(s, s, s)
    mesh.visible = rawP > 0.01

    const targetOpacity = isDimmed ? 0.54 : 0.95
    const targetEmissive = isSelected ? 0.36 : isDimmed ? 0.08 : 0.18
    mat.opacity = THREE.MathUtils.lerp(mat.opacity, targetOpacity, dampFactor)
    mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity, targetEmissive, dampFactor)
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      castShadow
      receiveShadow
      onPointerOver={(e) => {
        e.stopPropagation()
        document.body.style.cursor = 'pointer'
        onSelect && onSelect(index)
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'auto'
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect && onSelect(index)
      }}
    >
      <meshPhysicalMaterial
        ref={materialRef}
        color={item.color}
        emissive={item.color}
        emissiveIntensity={0.18}
        attenuationColor={item.color}
        attenuationDistance={1.5}
        transmission={0.38}
        thickness={0.9}
        roughness={0.14}
        metalness={0.04}
        ior={1.45}
        clearcoat={1}
        clearcoatRoughness={0.08}
        specularIntensity={1.2}
        transparent
        opacity={0.95}
      />
    </mesh>
  )
}

function DonutScene({
  categoryData,
  activeCategoryIndex,
  onSelectSlice,
  inView,
  replayKey,
}) {
  return (
    <>
      <ambientLight intensity={0.85} />
      <hemisphereLight args={['#ffffff', '#1e293b', 0.7]} />
      <directionalLight position={[4, 6, 5]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-4, 3, -3]} intensity={0.95} color="#c7d2fe" />
      <pointLight position={[0, -2.5, 2.5]} intensity={0.65} color="#a5f3fc" />

      <Float speed={1.5} rotationIntensity={0.12} floatIntensity={0.22}>
        {/* Tilted ~55deg from vertical so faces and bevel thickness display simultaneously */}
        <group rotation={[-0.95, 0, 0]} position={[0, 0.08, 0]}>
          {categoryData.map((item, idx) => (
            <DonutSliceMesh
              key={item.key}
              item={item}
              index={idx}
              sliceCount={categoryData.length}
              isSelected={activeCategoryIndex === idx}
              isDimmed={activeCategoryIndex !== null && activeCategoryIndex !== idx}
              onSelect={onSelectSlice}
              inView={inView}
              replayKey={replayKey}
            />
          ))}
        </group>
      </Float>

      <ContactShadows
        position={[0, -1.48, 0]}
        opacity={0.42}
        scale={5.2}
        blur={2.4}
        far={3.2}
        resolution={256}
        frames={1}
        color="#0f172a"
      />
    </>
  )
}

export const Donut3D = ({
  categoryData = [],
  activeCategoryIndex = 0,
  onSelectSlice,
  totalCalculated = 0,
  displayCurrency = 'PKR',
  selectedMonth = 'October 2026',
  isUrdu = false,
  inView = true,
  replayKey = 0,
  totalSpendLabel = 'TOTAL SPEND',
}) => {
  const shouldReduceMotion = useReducedMotion()
  const [canWebGL, setCanWebGL] = useState(true)

  useEffect(() => {
    setCanWebGL(isWebGLAvailable())
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.cursor = 'auto'
      }
    }
  }, [])

  const fallbackEl = (
    <SvgDonutFallback
      categoryData={categoryData}
      activeCategoryIndex={activeCategoryIndex}
      onSelectSlice={onSelectSlice}
      totalCalculated={totalCalculated}
      displayCurrency={displayCurrency}
      selectedMonth={selectedMonth}
      isUrdu={isUrdu}
      inView={inView}
      replayKey={replayKey}
      totalSpendLabel={totalSpendLabel}
    />
  )

  if (shouldReduceMotion || !canWebGL) {
    return fallbackEl
  }

  return (
    <CanvasErrorBoundary fallback={fallbackEl}>
      <div className="relative w-full h-[270px] sm:h-[330px] flex items-center justify-center select-none [touch-action:pan-y]">
        <Canvas
          dpr={[1, 2]}
          camera={{ position: [0, 0.34, 4.95], fov: 40 }}
          gl={{
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance',
          }}
          className="w-full h-full"
        >
          <DonutScene
            categoryData={categoryData}
            activeCategoryIndex={activeCategoryIndex}
            onSelectSlice={onSelectSlice}
            inView={inView}
            replayKey={replayKey}
          />
        </Canvas>

        {/* Crisp DOM Overlay Center Cutout TOTAL SPEND Readout */}
        <div className="pointer-events-none absolute inset-0 flex items-center justify-center pb-2">
          <div className="flex flex-col items-center justify-center min-w-[104px] sm:min-w-[118px] px-3 py-2 rounded-full bg-white/82 dark:bg-slate-900/86 backdrop-blur-xl border border-white/85 dark:border-white/15 shadow-[0_12px_30px_-8px_rgba(15,23,42,0.28)] text-center">
            <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
              {totalSpendLabel}
            </span>
            <AnimatedNumber
              value={totalCalculated}
              from={inView ? 0 : totalCalculated}
              prefix={displayCurrency}
              duration={0.95}
              triggerKey={`${replayKey}-${totalCalculated}`}
              className="text-xs sm:text-sm font-black text-slate-900 dark:text-white my-0.5"
            />
            <span className="text-[8px] font-mono font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-500/12 px-2 py-0.5 rounded-full border border-indigo-400/25 truncate max-w-[96px]">
              {isUrdu ? translateMonth(selectedMonth, 'ur') : selectedMonth}
            </span>
          </div>
        </div>
      </div>
    </CanvasErrorBoundary>
  )
}

export default Donut3D

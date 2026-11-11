import React, { useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'

/**
 * 60fps CSS 3D Perspective TiltCard:
 * - Animates only transform and opacity (GPU composited).
 * - Supports base resting orientation (e.g. rotateY: +8 deg for previous cycle)
 *   plus cursor/finger hover-tap tilt & moving specular sheen.
 * - Gracefully simplifies to clean fade/flat card under prefers-reduced-motion.
 */
export const TiltCard = ({
  children,
  className = '',
  style = {},
  restingRotateY = 0,
  restingRotateX = 0,
  restingScale = 1,
  restingZ = 0,
  maxTilt = 7,
  dimmed = false,
  onClick,
  ...rest
}) => {
  const cardRef = useRef(null)
  const shouldReduceMotion = useReducedMotion()
  const [isHovered, setIsHovered] = useState(false)

  const px = useMotionValue(0)
  const py = useMotionValue(0)

  const springCfg = { stiffness: 240, damping: 24, mass: 0.45 }
  const smoothX = useSpring(px, springCfg)
  const smoothY = useSpring(py, springCfg)

  // Tilt deltas relative to resting orientation
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [
    restingRotateY - maxTilt,
    restingRotateY + maxTilt,
  ])
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [
    restingRotateX + maxTilt * 0.75,
    restingRotateX - maxTilt * 0.75,
  ])

  // Specular highlight position in %
  const sheenX = useTransform(smoothX, [-0.5, 0.5], [-40, 40])
  const sheenY = useTransform(smoothY, [-0.5, 0.5], [-30, 30])

  const handlePointerMove = (e) => {
    if (shouldReduceMotion || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const clientX = e.clientX ?? e.touches?.[0]?.clientX
    const clientY = e.clientY ?? e.touches?.[0]?.clientY
    if (clientX === undefined || clientY === undefined) return
    px.set(Math.max(-0.5, Math.min(0.5, (clientX - rect.left) / rect.width - 0.5)))
    py.set(Math.max(-0.5, Math.min(0.5, (clientY - rect.top) / rect.height - 0.5)))
  }

  const handlePointerEnter = () => {
    setIsHovered(true)
  }

  const handlePointerLeave = () => {
    setIsHovered(false)
    px.set(0)
    py.set(0)
  }

  if (shouldReduceMotion) {
    return (
      <div
        onClick={onClick}
        className={`relative transition-opacity duration-200 ${dimmed ? 'opacity-90' : 'opacity-100'} ${className}`}
        style={style}
        {...rest}
      >
        {children}
      </div>
    )
  }

  return (
    <div style={{ perspective: 1300 }} className="w-full h-full [touch-action:pan-y]">
      <motion.div
        ref={cardRef}
        onClick={onClick}
        onPointerEnter={handlePointerEnter}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        onPointerCancel={handlePointerLeave}
        whileTap={{ scale: restingScale * 0.985 }}
        animate={{
          scale: isHovered ? Math.max(restingScale, 1) : restingScale,
          z: isHovered ? restingZ + 12 : restingZ,
          opacity: isHovered ? 1 : dimmed ? 0.88 : 1,
        }}
        transition={{ type: 'spring', stiffness: 260, damping: 24 }}
        style={{
          rotateX,
          rotateY,
          transformStyle: 'preserve-3d',
          willChange: 'transform, opacity',
          ...style,
        }}
        className={`relative w-full h-full rounded-3xl ${className}`}
        {...rest}
      >
        {/* Specular Moving Sheen Layer (transform-only for 60fps) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit] z-20">
          <motion.div
            aria-hidden="true"
            style={{
              x: sheenX,
              y: sheenY,
              opacity: isHovered ? 0.42 : 0.14,
            }}
            transition={{ opacity: { duration: 0.2 } }}
            className="absolute -inset-[45%] bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.65)_0%,rgba(255,255,255,0.14)_28%,transparent_62%)] dark:bg-[radial-gradient(circle_at_35%_25%,rgba(255,255,255,0.22)_0%,rgba(255,255,255,0.05)_30%,transparent_60%)]"
          />
        </div>

        {/* Inner Children */}
        <div
          style={{
            transform: 'translateZ(1px)',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
          }}
          className="relative z-10 h-full"
        >
          {children}
        </div>
      </motion.div>
    </div>
  )
}

export default TiltCard

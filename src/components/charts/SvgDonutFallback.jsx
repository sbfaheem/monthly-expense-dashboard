import React from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import { translateMonth } from '../../utils/translations'
import AnimatedNumber from '../motion/AnimatedNumber'

function describeDonutArc(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const span = Math.min(359.99, Math.max(0.5, endAngle - startAngle))
  const sAngle = startAngle
  const eAngle = startAngle + span

  const startRad = (sAngle - 90) * (Math.PI / 180)
  const endRad = (eAngle - 90) * (Math.PI / 180)

  const x1Outer = cx + rOuter * Math.cos(startRad)
  const y1Outer = cy + rOuter * Math.sin(startRad)
  const x2Outer = cx + rOuter * Math.cos(endRad)
  const y2Outer = cy + rOuter * Math.sin(endRad)

  const x1Inner = cx + rInner * Math.cos(endRad)
  const y1Inner = cy + rInner * Math.sin(endRad)
  const x2Inner = cx + rInner * Math.cos(startRad)
  const y2Inner = cy + rInner * Math.sin(startRad)

  const largeArc = span > 180 ? 1 : 0

  return [
    `M ${x1Outer.toFixed(2)} ${y1Outer.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2Outer.toFixed(2)} ${y2Outer.toFixed(2)}`,
    `L ${x1Inner.toFixed(2)} ${y1Inner.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x2Inner.toFixed(2)} ${y2Inner.toFixed(2)}`,
    'Z',
  ].join(' ')
}

export const SvgDonutFallback = ({
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

  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const smoothX = useSpring(mouseX, { damping: 24, stiffness: 180, mass: 0.35 })
  const smoothY = useSpring(mouseY, { damping: 24, stiffness: 180, mass: 0.35 })

  const rotateX = useTransform(smoothY, [-0.5, 0.5], [28, 18])
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-10, 10])

  const handlePointerMove = (e) => {
    if (shouldReduceMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handlePointerLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const SVG_SIZE = 340
  const CX = 170
  const CY = 170
  const R_OUTER = 128
  const R_INNER = 72

  return (
    <div
      style={{ perspective: 1100 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="relative w-full h-[270px] sm:h-[320px] flex items-center justify-center select-none [touch-action:pan-y]"
    >
      {/* Ground Contact Shadow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-3 w-[200px] sm:w-[240px] h-10 rounded-full bg-slate-900/18 dark:bg-black/55 blur-xl"
      />

      <motion.div
        style={{
          rotateX: shouldReduceMotion ? 0 : rotateX,
          rotateY: shouldReduceMotion ? 0 : rotateY,
          transformStyle: 'preserve-3d',
        }}
        className="relative flex items-center justify-center w-[240px] sm:w-[285px] aspect-square will-change-transform"
      >
        {/* Subtle Extruded Depth Rim Layer behind SVG */}
        {!shouldReduceMotion && (
          <svg
            aria-hidden="true"
            viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
            className="absolute inset-0 w-full h-full overflow-visible pointer-events-none opacity-40"
            style={{ transform: 'translate3d(0, 10px, -18px)' }}
          >
            {categoryData.map((item, idx) => {
              const isSelected = activeCategoryIndex === idx
              const pathData = describeDonutArc(
                CX,
                CY,
                R_OUTER,
                R_INNER,
                item.startAngle + 1,
                item.endAngle - 1
              )
              return (
                <path
                  key={`extrude-${item.key}`}
                  d={pathData}
                  fill={item.color}
                  transform={isSelected ? `translate(${item.explodeX}, ${item.explodeY})` : undefined}
                />
              )
            })}
          </svg>
        )}

        {/* Foreground Translucent Glass Slices */}
        <svg
          viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
          className="w-full h-full overflow-visible drop-shadow-xl"
        >
          <defs>
            {categoryData.map((item) => (
              <linearGradient
                key={`svg-grad-${item.key}`}
                id={`svg-grad-${item.key}`}
                x1="0%"
                y1="0%"
                x2="100%"
                y2="100%"
              >
                <stop offset="0%" stopColor={item.color} stopOpacity="0.96" />
                <stop offset="100%" stopColor={item.color} stopOpacity="0.72" />
              </linearGradient>
            ))}
          </defs>

          {categoryData.map((item, idx) => {
            const isSelected = activeCategoryIndex === idx
            const isDimmed = activeCategoryIndex !== null && !isSelected
            const pathData = describeDonutArc(
              CX,
              CY,
              R_OUTER,
              R_INNER,
              item.startAngle + (categoryData.length > 1 ? 1.2 : 0),
              item.endAngle - (categoryData.length > 1 ? 1.2 : 0)
            )

            return (
              <motion.g
                key={`${item.key}-${replayKey}`}
                onClick={() => onSelectSlice && onSelectSlice(idx)}
                onMouseEnter={() => onSelectSlice && onSelectSlice(idx)}
                initial={
                  shouldReduceMotion
                    ? { opacity: 1 }
                    : { opacity: 0, scale: 0.82 }
                }
                animate={
                  inView
                    ? {
                        opacity: isDimmed ? 0.58 : 1,
                        x: isSelected ? item.explodeX : 0,
                        y: isSelected ? item.explodeY : 0,
                        scale: isSelected ? 1.05 : 1,
                      }
                    : {}
                }
                transition={{
                  type: 'spring',
                  stiffness: 260,
                  damping: 20,
                  delay: shouldReduceMotion ? 0 : idx * 0.08,
                }}
                style={{ transformOrigin: `${CX}px ${CY}px` }}
                className="cursor-pointer"
              >
                <path
                  d={pathData}
                  fill={`url(#svg-grad-${item.key})`}
                  stroke={isSelected ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.45)'}
                  strokeWidth={isSelected ? 3 : 1.5}
                  strokeLinejoin="round"
                  style={{
                    filter: isSelected
                      ? `drop-shadow(0 10px 16px ${item.color}66)`
                      : 'none',
                  }}
                />
              </motion.g>
            )
          })}
        </svg>

        {/* Center TOTAL SPEND Badge */}
        <div
          style={{ transform: 'translateZ(18px)' }}
          className="pointer-events-none absolute flex flex-col items-center justify-center size-[104px] sm:size-[116px] rounded-full bg-white/88 dark:bg-slate-900/90 backdrop-blur-xl border border-white/80 dark:border-white/15 shadow-lg text-center p-2"
        >
          <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {totalSpendLabel}
          </span>
          <AnimatedNumber
            value={totalCalculated}
            from={inView ? 0 : totalCalculated}
            prefix={displayCurrency}
            duration={0.9}
            triggerKey={`${replayKey}-${totalCalculated}`}
            className="text-xs sm:text-sm font-black text-slate-900 dark:text-white my-0.5"
          />
          <span className="text-[8px] font-mono font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-500/12 px-2 py-0.5 rounded-full border border-indigo-400/25 truncate max-w-[92px]">
            {isUrdu ? translateMonth(selectedMonth, 'ur') : selectedMonth}
          </span>
        </div>
      </motion.div>
    </div>
  )
}

export default SvgDonutFallback

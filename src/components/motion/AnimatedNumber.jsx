import React, { useEffect, useRef } from 'react'
import { animate, useMotionValue, useReducedMotion } from 'framer-motion'

/**
 * 60fps Tabular Numeric Counter using Intl.NumberFormat & JetBrains Mono.
 * Updates DOM textContent directly via ref during animation to avoid 60fps React re-renders.
 * Respects prefers-reduced-motion by rendering final state immediately.
 */
function formatFormattedValue(
  rawNum,
  {
    prefix = '',
    suffix = '',
    decimals = 0,
    showPlus = false,
    signBeforeNumber = false,
  } = {}
) {
  const num = Number(rawNum) || 0
  const absVal = Math.abs(num)
  const formatter = new Intl.NumberFormat('en-PK', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
  const formattedAbs = formatter.format(
    decimals > 0 ? Number(absVal.toFixed(decimals)) : Math.round(absVal)
  )
  const sign = num < -0.0001 ? '-' : showPlus && num > 0.0001 ? '+' : ''
  const prefixPart = prefix ? `${prefix} ` : ''

  if (signBeforeNumber && prefixPart) {
    return `${prefixPart}${sign}${formattedAbs}${suffix}`
  }
  return `${sign}${prefixPart}${formattedAbs}${suffix}`
}

export const AnimatedNumber = ({
  value = 0,
  from = 0,
  prefix = '',
  suffix = '',
  decimals = 0,
  showPlus = false,
  signBeforeNumber = false,
  duration = 0.85,
  delay = 0,
  triggerKey = null,
  className = '',
  style = {},
}) => {
  const shouldReduceMotion = useReducedMotion()
  const spanRef = useRef(null)
  const target = Number(value) || 0
  const startVal = Number(from) || 0
  const motionVal = useMotionValue(shouldReduceMotion ? target : startVal)

  useEffect(() => {
    const el = spanRef.current
    if (!el) return

    const opts = { prefix, suffix, decimals, showPlus, signBeforeNumber }

    if (shouldReduceMotion) {
      motionVal.set(target)
      el.textContent = formatFormattedValue(target, opts)
      return
    }

    motionVal.set(startVal)
    el.textContent = formatFormattedValue(startVal, opts)

    const controls = animate(motionVal, target, {
      duration,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (latest) => {
        if (spanRef.current) {
          spanRef.current.textContent = formatFormattedValue(latest, opts)
        }
      },
      onComplete: () => {
        if (spanRef.current) {
          spanRef.current.textContent = formatFormattedValue(target, opts)
        }
      },
    })

    return () => controls.stop()
  }, [
    target,
    startVal,
    prefix,
    suffix,
    decimals,
    showPlus,
    signBeforeNumber,
    duration,
    delay,
    triggerKey,
    shouldReduceMotion,
    motionVal,
  ])

  return (
    <span
      ref={spanRef}
      dir="ltr"
      style={{
        direction: 'ltr',
        unicodeBidi: 'isolate',
        fontVariantNumeric: 'tabular-nums',
        ...style,
      }}
      className={`font-mono tabular-nums whitespace-nowrap inline-block ${className}`}
    >
      {formatFormattedValue(shouldReduceMotion ? target : startVal, {
        prefix,
        suffix,
        decimals,
        showPlus,
        signBeforeNumber,
      })}
    </span>
  )
}

export default AnimatedNumber

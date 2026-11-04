import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]
const URDU_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹']

/**
 * Individual 3D Mechanical Odometer Digit Drum Column
 */
function OdometerDigit({
  digit,
  index,
  totalDigits,
  isUrduDigit = false,
  shouldReduceMotion = false,
}) {
  const digitList = isUrduDigit ? URDU_DIGITS : DIGITS
  const targetIndex = isUrduDigit
    ? URDU_DIGITS.indexOf(digit)
    : parseInt(digit, 10)

  const safeTarget = targetIndex >= 0 ? targetIndex : 0

  // Staggered inertia: lower-place digits settle first, higher-place digits roll slightly longer
  const staggerDelay = (totalDigits - 1 - index) * 0.035

  return (
    <span
      className="relative inline-block overflow-hidden h-[1.18em] leading-[1.18em] align-top select-none font-mono"
      style={{
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
      }}
    >
      {/* 3D Cylindrical Drum Vignette Gradient */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 rounded-xs bg-gradient-to-b from-black/20 via-transparent to-black/20 shadow-[inset_0_1px_2px_rgba(0,0,0,0.25),inset_0_-1px_2px_rgba(0,0,0,0.25)]"
      />

      {/* Vertical Rolling Drum Strip */}
      <motion.span
        initial={shouldReduceMotion ? { y: `${-safeTarget * 10}%` } : { y: '0%' }}
        animate={{ y: `${-safeTarget * 10}%` }}
        transition={{
          type: 'spring',
          stiffness: 110,
          damping: 15,
          mass: 0.6,
          delay: shouldReduceMotion ? 0 : staggerDelay,
        }}
        className="flex flex-col will-change-transform"
      >
        {digitList.map((d) => (
          <span
            key={d}
            className="h-[1.18em] flex items-center justify-center leading-[1.18em] font-mono select-none"
          >
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

/**
 * RollingOdometer Component
 * Animates numerical transitions with a 3D mechanical drum roll effect.
 */
export const RollingOdometer = ({
  value = 0,
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion()
  const strValue = String(value ?? '0')
  const chars = strValue.split('')

  // Detect whether character is an English or Urdu digit
  const isDigit = (c) => /\d/.test(c) || URDU_DIGITS.includes(c)

  // Count total digits for inertia staggering
  const totalDigits = chars.filter(isDigit).length

  // Build digit positions from right to left for stable component keys
  let digitCounter = 0
  const charMeta = chars.map((char, index) => {
    const isNum = isDigit(char)
    const currentDigitIndex = isNum ? digitCounter++ : null
    const placeFromRight = chars.length - 1 - index
    return {
      char,
      isNum,
      currentDigitIndex,
      placeFromRight,
      isUrduNum: URDU_DIGITS.includes(char),
    }
  })

  return (
    <span
      className={`inline-flex items-baseline font-mono tracking-tight ${className}`}
      dir="ltr"
    >
      {prefix && (
        <span className="text-[0.55em] font-semibold mr-1.5 opacity-75 align-baseline select-none">
          {prefix}
        </span>
      )}

      <span className="inline-flex items-baseline">
        {charMeta.map(({ char, isNum, currentDigitIndex, placeFromRight, isUrduNum }) => {
          if (isNum) {
            return (
              <OdometerDigit
                key={`odometer-col-${placeFromRight}`}
                digit={char}
                index={currentDigitIndex}
                totalDigits={totalDigits}
                isUrduDigit={isUrduNum}
                shouldReduceMotion={shouldReduceMotion}
              />
            )
          }

          // Static characters (comma, minus, dot, currency symbols, spaces)
          return (
            <span
              key={`odometer-sep-${placeFromRight}-${char}`}
              className="inline-block px-[0.03em] opacity-85 select-none font-mono"
            >
              {char}
            </span>
          )
        })}
      </span>

      {suffix && (
        <span className="text-[0.55em] font-semibold ml-1.5 opacity-75 align-baseline select-none">
          {suffix}
        </span>
      )}
    </span>
  )
}

export default RollingOdometer

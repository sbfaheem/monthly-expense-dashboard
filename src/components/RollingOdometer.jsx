import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

function OdometerDigit({ char, delay = 0, shouldReduceMotion = false }) {
  const num = parseInt(char, 10)

  // Minus / en-dash / plus sign — shared line-height and clean natural width
  if (char === '-' || char === '−' || char === '+') {
    return (
      <span className="inline-block select-none leading-[1.1] font-bold font-mono w-auto mr-[0.03em]">
        {char}
      </span>
    )
  }

  // Comma or decimal point — same baseline as digits, crisp tight width
  if (isNaN(num)) {
    return (
      <span
        className={`inline-block select-none leading-[1.1] font-bold font-mono text-center ${
          char === ',' ? 'w-[0.34em]' : 'w-auto'
        }`}
      >
        {char}
      </span>
    )
  }

  // Reduced motion fallback
  if (shouldReduceMotion) {
    return (
      <span className="inline-block tabular-nums font-bold font-mono leading-[1.1]">
        {num}
      </span>
    )
  }

  return (
    <span
      className="relative inline-flex items-center justify-center h-[1.1em] w-[0.60em] overflow-hidden align-baseline select-none"
      style={{
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'geometricPrecision',
      }}
    >
      {/* In-flow invisible glyph preserves exact CSS Flexbox baseline alignment with commas and text */}
      <span aria-hidden="true" className="invisible font-bold font-mono leading-[1.1]">
        {num}
      </span>
      <motion.span
        className="absolute left-0 top-0 flex flex-col items-center w-full"
        initial={{ y: 0 }}
        animate={{ y: `-${num * 10}%` }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 26,
          mass: 0.4,
          delay,
        }}
      >
        {DIGITS.map((d) => (
          <span
            key={d}
            className="h-[1.1em] flex items-center justify-center tabular-nums leading-[1.1] font-bold font-mono"
          >
            {d}
          </span>
        ))}
      </motion.span>
    </span>
  )
}

export const RollingOdometer = ({
  value = '0',
  prefix = '',
  suffix = '',
  className = '',
}) => {
  const shouldReduceMotion = useReducedMotion()

  // Normalize numeric inputs via Intl.NumberFormat while still preserving formatted strings
  let normalizedString = String(value ?? 0)
  if (typeof value === 'number' && Number.isFinite(value)) {
    const absFormatted = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 }).format(Math.abs(value))
    normalizedString = value < 0 ? `-${absFormatted}` : absFormatted
  } else {
    // Strip stray spaces around commas (e.g. "279 ,050" -> "279,050")
    normalizedString = normalizedString.replace(/\s*,\s*/g, ',')
  }

  const characters = normalizedString.split('')
  let digitIndex = 0

  return (
    <span
      dir="ltr"
      style={{
        direction: 'ltr',
        unicodeBidi: 'isolate',
        fontVariantNumeric: 'tabular-nums',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'geometricPrecision',
      }}
      className={`inline-flex flex-row items-baseline font-mono tracking-tight tabular-nums whitespace-nowrap ${className}`}
    >
      {prefix && (
        <span
          dir="ltr"
          style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
          className="text-[0.68em] font-extrabold mr-1.5 opacity-80 font-sans select-none tracking-normal inline-block"
        >
          {prefix}
        </span>
      )}

      <span
        dir="ltr"
        style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
        className="inline-flex flex-row items-baseline"
      >
        {characters.map((char, idx) => {
          const isDigit = !isNaN(parseInt(char, 10))
          const delay = isDigit ? digitIndex * 0.045 : 0
          if (isDigit) digitIndex++

          return (
            <OdometerDigit
              key={`${idx}-${char}`}
              char={char}
              delay={delay}
              shouldReduceMotion={shouldReduceMotion}
            />
          )
        })}
      </span>

      {suffix && (
        <span
          dir="ltr"
          style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
          className="text-[0.68em] font-extrabold ml-1 opacity-80 font-sans select-none tracking-normal inline-block"
        >
          {suffix}
        </span>
      )}
    </span>
  )
}

export default RollingOdometer

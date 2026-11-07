import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

function OdometerDigit({ char, delay = 0, shouldReduceMotion = false }) {
  const num = parseInt(char, 10)

  // Minus sign
  if (char === '-') {
    return (
      <span className="inline-block select-none leading-none font-bold font-mono">
        -
      </span>
    )
  }

  // Comma or non-digit separator
  if (isNaN(num)) {
    return (
      <span className="inline-block select-none leading-none font-bold font-mono px-[0.02em]">
        {char}
      </span>
    )
  }

  // Reduced motion fallback
  if (shouldReduceMotion) {
    return (
      <span className="inline-block tabular-nums font-bold font-mono leading-none">
        {num}
      </span>
    )
  }

  return (
    <span
      className="relative inline-flex items-center justify-center h-[1.18em] w-[0.62em] overflow-hidden align-baseline select-none"
      style={{
        verticalAlign: '-0.12em',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'geometricPrecision',
      }}
    >
      <motion.span
        className="absolute left-0 top-0 flex flex-col items-center w-full"
        initial={{ y: 0 }}
        animate={{ y: `-${num * 10}%` }}
        transition={{
          type: 'spring',
          stiffness: 260,
          damping: 26,
          mass: 0.4,
          delay: delay,
        }}
      >
        {DIGITS.map((d) => (
          <span
            key={d}
            className="h-[1.18em] flex items-center justify-center tabular-nums leading-none font-bold font-mono"
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
  const rawString = String(value ?? 0)
  const characters = rawString.split('')

  let digitIndex = 0

  return (
    <span
      dir="ltr"
      style={{
        direction: 'ltr',
        unicodeBidi: 'isolate',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'geometricPrecision',
      }}
      className={`inline-flex flex-row items-baseline font-mono tracking-tight tabular-nums ${className}`}
    >
      {prefix && (
        <span
          dir="ltr"
          style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
          className="text-[0.68em] font-extrabold mr-1.5 opacity-80 font-sans select-none self-center tracking-normal inline-block"
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
          const isNum = !isNaN(parseInt(char, 10))
          const delay = isNum ? digitIndex++ * 0.03 : 0

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
          className="text-[0.68em] font-extrabold ml-1.5 opacity-80 font-sans select-none self-center tracking-normal inline-block"
        >
          {suffix}
        </span>
      )}
    </span>
  )
}

export default RollingOdometer

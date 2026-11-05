import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

function OdometerDigit({ char, delay = 0, shouldReduceMotion = false }) {
  const num = parseInt(char, 10)

  // Minus sign in drum slot
  if (char === '-') {
    return (
      <span
        className="relative inline-flex items-center justify-center h-[1.24em] w-[0.56em] mx-[0.5px] overflow-hidden align-baseline select-none rounded-[4px] bg-slate-100/90 dark:bg-slate-800/90 border border-slate-300/70 dark:border-slate-700 shadow-[inset_0_1px_3px_rgba(0,0,0,0.2),inset_0_-1px_2px_rgba(0,0,0,0.2)]"
        style={{ verticalAlign: '-0.14em' }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/20 via-transparent to-black/20"
        />
        <span className="font-black leading-none">-</span>
      </span>
    )
  }

  // Comma separator
  if (isNaN(num)) {
    return (
      <span className="inline-block px-[0.06em] select-none opacity-85 leading-none font-black">
        {char}
      </span>
    )
  }

  if (shouldReduceMotion) {
    return (
      <span
        className="relative inline-flex items-center justify-center h-[1.24em] w-[0.66em] mx-[0.5px] overflow-hidden align-baseline select-none rounded-[4px] bg-slate-100/90 dark:bg-slate-800/90 border border-slate-300/70 dark:border-slate-700 shadow-[inset_0_1px_3px_rgba(0,0,0,0.2),inset_0_-1px_2px_rgba(0,0,0,0.2)]"
        style={{ verticalAlign: '-0.14em' }}
      >
        <span className="tabular-nums leading-none font-black">{num}</span>
      </span>
    )
  }

  return (
    <span
      className="relative inline-flex items-center justify-center h-[1.24em] w-[0.66em] mx-[0.5px] overflow-hidden align-baseline select-none rounded-[4px] bg-slate-100/90 dark:bg-slate-800/90 border border-slate-300/70 dark:border-slate-700 shadow-[inset_0_1px_3px_rgba(0,0,0,0.2),inset_0_-1px_2px_rgba(0,0,0,0.2)]"
      style={{
        verticalAlign: '-0.14em',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'geometricPrecision',
      }}
    >
      {/* 3D Cylindrical Drum Highlight / Vignette */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/20 via-transparent to-black/20"
      />

      <motion.span
        className="absolute left-0 top-0 flex flex-col items-center w-full"
        initial={{ y: 0 }}
        animate={{ y: `-${num * 10}%` }}
        transition={{
          type: 'spring',
          stiffness: 240,
          damping: 24,
          mass: 0.45,
          delay: delay,
        }}
        style={{
          transform: 'translateZ(0)',
          backfaceVisibility: 'hidden',
        }}
      >
        {DIGITS.map((d) => (
          <span
            key={d}
            className="h-[1.24em] flex items-center justify-center tabular-nums leading-none font-black"
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
    <div
      className={`inline-flex items-baseline font-mono tracking-tight tabular-nums ${className}`}
      style={{
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'geometricPrecision',
        transform: 'translateZ(0)',
      }}
    >
      {prefix && (
        <span className="text-[0.72em] font-bold mr-1.5 opacity-80 font-sans select-none self-center">
          {prefix}
        </span>
      )}

      <div className="inline-flex items-baseline">
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
      </div>

      {suffix && (
        <span className="text-[0.72em] font-bold ml-1.5 opacity-80 font-sans select-none self-center">
          {suffix}
        </span>
      )}
    </div>
  )
}

export default RollingOdometer

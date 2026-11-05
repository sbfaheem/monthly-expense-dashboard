import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9]

function OdometerDigit({ char, delay = 0, shouldReduceMotion = false }) {
  const num = parseInt(char, 10)

  // Minus sign in mechanical tumbler drum slot
  if (char === '-') {
    return (
      <span
        className="relative inline-flex items-center justify-center h-[1.28em] w-[0.62em] mx-[0.5px] overflow-hidden align-baseline select-none rounded-[4px] bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 border border-slate-300 dark:border-slate-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.18)]"
        style={{
          verticalAlign: '-0.14em',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          textRendering: 'geometricPrecision',
        }}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 bg-gradient-to-b from-black/20 via-transparent to-black/20"
        />
        <span className="font-black font-mono leading-none">-</span>
      </span>
    )
  }

  // Comma separator between tumbler drums
  if (isNaN(num)) {
    return (
      <span
        className="inline-block px-[0.05em] select-none opacity-80 leading-none font-black font-mono"
        style={{ verticalAlign: '-0.05em' }}
      >
        {char}
      </span>
    )
  }

  // Reduced motion fallback
  if (shouldReduceMotion) {
    return (
      <span
        className="relative inline-flex items-center justify-center h-[1.28em] w-[0.72em] mx-[0.5px] overflow-hidden align-baseline select-none rounded-[4px] bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 border border-slate-300 dark:border-slate-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.18)]"
        style={{ verticalAlign: '-0.14em' }}
      >
        <span className="tabular-nums font-black font-mono leading-none">{num}</span>
      </span>
    )
  }

  return (
    <span
      className="relative inline-flex items-center justify-center h-[1.28em] w-[0.72em] mx-[0.5px] overflow-hidden align-baseline select-none rounded-[4px] bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200 dark:from-slate-700 dark:via-slate-800 dark:to-slate-900 border border-slate-300 dark:border-slate-600 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9),0_1px_2px_rgba(0,0,0,0.18)]"
      style={{
        verticalAlign: '-0.14em',
        WebkitFontSmoothing: 'antialiased',
        MozOsxFontSmoothing: 'grayscale',
        textRendering: 'geometricPrecision',
      }}
    >
      {/* 3D Cylindrical Drum Highlight Vignette */}
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
            className="h-[1.28em] flex items-center justify-center tabular-nums leading-none font-black font-mono"
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
        transform: 'translateZ(0)',
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

import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ShieldCheck } from 'lucide-react'

/**
 * SealBadge
 * Official frosted indigo glass seal ("Official Handover"):
 * - First-view stamp-down bounce + soft indigo ripple ring
 * - Slow shine sweep + subtle periodic holographic shimmer
 * - Instant settled appearance under prefers-reduced-motion
 */
export const SealBadge = ({ label = 'Official Handover', inView = true, isUrdu = false }) => {
  const shouldReduceMotion = useReducedMotion()

  if (shouldReduceMotion) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wide bg-indigo-500/12 dark:bg-indigo-400/15 text-indigo-700 dark:text-indigo-200 border border-indigo-400/40 dark:border-indigo-300/35 shadow-xs backdrop-blur-md whitespace-nowrap shrink-0 ${
          isUrdu ? 'font-urdu' : ''
        }`}
      >
        <ShieldCheck size={13} className="text-indigo-600 dark:text-indigo-300 shrink-0" />
        <span>{label}</span>
      </span>
    )
  }

  return (
    <div className="relative inline-flex shrink-0 items-center justify-center">
      {/* One-time stamp impact ripple ring */}
      <motion.span
        aria-hidden="true"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={
          inView
            ? { scale: [0.85, 1.48], opacity: [0.45, 0] }
            : { scale: 0.8, opacity: 0 }
        }
        transition={{ duration: 0.75, delay: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-indigo-500/45 dark:ring-indigo-400/50"
      />

      <motion.span
        initial={{ scale: 1.24, y: -8, opacity: 0 }}
        animate={
          inView
            ? {
                scale: [1.24, 0.94, 1.03, 1],
                y: [-8, 2, -1, 0],
                opacity: 1,
              }
            : { scale: 1.24, y: -8, opacity: 0 }
        }
        transition={{ duration: 0.56, delay: 0.16, ease: [0.22, 1, 0.36, 1] }}
        className={`relative overflow-hidden inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black tracking-wide bg-indigo-500/12 dark:bg-indigo-400/18 text-indigo-700 dark:text-indigo-200 border border-indigo-400/40 dark:border-indigo-300/35 shadow-[0_6px_18px_-6px_rgba(79,70,229,0.4)] backdrop-blur-md whitespace-nowrap ${
          isUrdu ? 'font-urdu' : ''
        }`}
      >
        {/* Subtle holographic shimmer sweep every ~4.5s */}
        <motion.span
          aria-hidden="true"
          initial={{ x: '-140%' }}
          animate={inView ? { x: ['-140%', '220%'] } : { x: '-140%' }}
          transition={{
            repeat: Infinity,
            repeatDelay: 4.2,
            duration: 1.4,
            delay: 0.9,
            ease: 'easeInOut',
          }}
          className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/55 dark:via-indigo-200/30 to-transparent"
        />

        {/* Subtle iridescent top specular edge */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-2 top-0 h-px bg-gradient-to-r from-transparent via-indigo-300/80 to-transparent"
        />

        <ShieldCheck size={13} className="relative z-10 text-indigo-600 dark:text-indigo-300 shrink-0" />
        <span className="relative z-10">{label}</span>
      </motion.span>
    </div>
  )
}

export default SealBadge

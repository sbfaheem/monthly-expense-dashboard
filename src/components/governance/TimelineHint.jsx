import React, { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { translateMonth } from '../../utils/translations'

/**
 * TimelineHint
 * Subtle glowing bar extending from Dec 2025 to dynamically computed "Today",
 * with a softly traveling luminous dot signaling ongoing active transparency.
 */
export const TimelineHint = ({ inView = true, isUrdu = false }) => {
  const shouldReduceMotion = useReducedMotion()

  const { startLabel, todayLabel, fullTodayTooltip } = useMemo(() => {
    const now = new Date()
    const enShort = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
    const monthFull = now.toLocaleDateString('en-US', { month: 'long' })
    const urMonth = translateMonth(monthFull, 'ur')
    const dayNum = now.getDate()
    const yearNum = now.getFullYear()

    return {
      startLabel: isUrdu ? 'دسمبر 2025' : 'Dec 2025',
      todayLabel: isUrdu ? `آج · ${urMonth} ${yearNum}` : `Today · ${enShort}`,
      fullTodayTooltip: enShort,
      dayNum,
    }
  }, [isUrdu])

  return (
    <div
      className="px-3.5 py-2.5 rounded-2xl bg-white/45 dark:bg-white/[0.04] border border-slate-200/70 dark:border-white/10 space-y-2"
      title={fullTodayTooltip}
    >
      <div className="flex items-center justify-between gap-2 text-[10px] sm:text-[11px] font-extrabold text-slate-600 dark:text-slate-300">
        <span
          dir="ltr"
          style={{ unicodeBidi: 'isolate' }}
          className="inline-flex items-center gap-1.5 font-mono tabular-nums whitespace-nowrap"
        >
          <span className="size-1.5 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(99,102,241,0.7)]" />
          <span>{startLabel}</span>
        </span>

        <span
          className={`hidden sm:inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 whitespace-nowrap ${
            isUrdu ? 'font-urdu normal-case tracking-normal' : ''
          }`}
        >
          {isUrdu ? 'جاری شفاف ریکارڈ' : 'Active Reporting'}
        </span>

        <span className="inline-flex items-center gap-1.5 font-mono tabular-nums text-emerald-700 dark:text-emerald-300 whitespace-nowrap">
          <span dir="ltr" style={{ unicodeBidi: 'isolate' }}>
            {todayLabel}
          </span>
          <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.85)]" />
        </span>
      </div>

      {/* Glowing timeline track (isolated LTR geometry for deterministic sweep) */}
      <div
        dir="ltr"
        aria-hidden="true"
        className="relative h-2.5 w-full flex items-center"
      >
        <div className="relative h-1.5 w-full rounded-full bg-slate-200/80 dark:bg-slate-800/80 overflow-hidden">
          <motion.div
            initial={shouldReduceMotion ? { scaleX: 1 } : { scaleX: 0 }}
            animate={inView ? { scaleX: 1 } : shouldReduceMotion ? { scaleX: 1 } : { scaleX: 0 }}
            transition={{ duration: 0.75, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformOrigin: isUrdu ? 'right center' : 'left center' }}
            className="absolute inset-0 rounded-full bg-gradient-to-r from-indigo-500 via-teal-400 to-emerald-500 opacity-85"
          />
        </div>

        {!shouldReduceMotion && inView && (
          <motion.div
            initial={{ x: isUrdu ? '95%' : '0%' }}
            animate={{ x: isUrdu ? ['95%', '2%'] : ['0%', '95%'] }}
            transition={{
              repeat: Infinity,
              repeatType: 'loop',
              duration: 3.4,
              ease: 'easeInOut',
              repeatDelay: 0.5,
            }}
            className="absolute inset-y-0 left-0 w-full flex items-center pointer-events-none"
          >
            <span className="size-2.5 rounded-full bg-gradient-to-br from-emerald-300 via-emerald-500 to-indigo-500 shadow-[0_0_10px_2px_rgba(16,185,129,0.75)] ring-2 ring-white/95 dark:ring-slate-900" />
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default TimelineHint

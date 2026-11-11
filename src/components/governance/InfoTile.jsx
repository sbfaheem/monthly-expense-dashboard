import React, { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Calendar, ShieldCheck } from 'lucide-react'

/**
 * Split-flap style entrance for the effective date ("December 01, 2025")
 */
const SplitFlapDate = ({ value = '', inView = true, isUrdu = false }) => {
  const shouldReduceMotion = useReducedMotion()

  const tokens = useMemo(() => {
    const raw = String(value || '').trim()
    if (!raw) return ['December 01, 2025']
    if (isUrdu) {
      // Keep Urdu phrase intact cleanly in 2–3 logical chunks or single flap so Arabic shaping never breaks
      return [raw]
    }
    return raw.split(/\s+/)
  }, [value, isUrdu])

  if (shouldReduceMotion || isUrdu) {
    return (
      <span
        className={`inline-block font-extrabold text-slate-900 dark:text-slate-100 leading-snug ${
          isUrdu ? 'font-urdu text-sm' : 'text-sm font-mono tabular-nums tracking-tight'
        }`}
      >
        {value}
      </span>
    )
  }

  return (
    <span
      dir="ltr"
      style={{ perspective: 600, unicodeBidi: 'isolate' }}
      className="inline-flex flex-wrap items-center gap-1"
    >
      {tokens.map((tok, idx) => (
        <motion.span
          key={`${tok}-${idx}`}
          initial={{ rotateX: -85, opacity: 0, y: -4 }}
          animate={
            inView
              ? { rotateX: 0, opacity: 1, y: 0 }
              : { rotateX: -85, opacity: 0, y: -4 }
          }
          transition={{
            duration: 0.42,
            delay: 0.24 + idx * 0.11,
            ease: [0.22, 1, 0.36, 1],
          }}
          style={{ transformOrigin: 'center bottom', display: 'inline-block' }}
          className="px-1.5 py-0.5 rounded-md bg-white/75 dark:bg-white/[0.08] border border-indigo-200/70 dark:border-indigo-400/20 shadow-[inset_0_-1px_0_rgba(79,70,229,0.12)] font-mono tabular-nums text-[13px] font-extrabold text-slate-900 dark:text-slate-100 leading-tight"
        >
          {tok}
        </motion.span>
      ))}
    </span>
  )
}

/**
 * InfoTile
 * Staggered 3D glass tile (rotateX -20 -> 0) with hover/tap translateZ lift & accent glow,
 * plus one-time icon micro-animations (calendar page flip / shield shine).
 */
export const InfoTile = ({
  iconType = 'calendar', // 'calendar' | 'shield'
  accent = 'indigo', // 'indigo' | 'green'
  label,
  value,
  delay = 0,
  inView = true,
  isSplitFlapDate = false,
  isUrdu = false,
}) => {
  const shouldReduceMotion = useReducedMotion()

  const palette =
    accent === 'green'
      ? {
          iconWrap:
            'bg-emerald-500/12 text-emerald-600 dark:bg-emerald-400/15 dark:text-emerald-300 border-emerald-400/30',
          border:
            'border-emerald-500/20 dark:border-emerald-400/20 hover:border-emerald-500/45 dark:hover:border-emerald-300/45',
          hoverShadow:
            'hover:shadow-[0_14px_28px_-10px_rgba(16,185,129,0.28)]',
          labelText: 'text-emerald-700/80 dark:text-emerald-300/90',
        }
      : {
          iconWrap:
            'bg-indigo-500/12 text-indigo-600 dark:bg-indigo-400/15 dark:text-indigo-300 border-indigo-400/30',
          border:
            'border-indigo-500/20 dark:border-indigo-400/20 hover:border-indigo-500/45 dark:hover:border-indigo-300/45',
          hoverShadow:
            'hover:shadow-[0_14px_28px_-10px_rgba(79,70,229,0.28)]',
          labelText: 'text-indigo-700/80 dark:text-indigo-300/90',
        }

  const renderAnimatedIcon = () => {
    if (iconType === 'calendar') {
      if (shouldReduceMotion) {
        return <Calendar size={13} className="shrink-0" />
      }
      return (
        <motion.span
          initial={{ rotateX: 0 }}
          animate={
            inView
              ? { rotateX: [0, -72, 16, 0], scale: [1, 1.12, 1] }
              : { rotateX: 0 }
          }
          transition={{ duration: 0.65, delay: delay + 0.18, ease: [0.22, 1, 0.36, 1] }}
          style={{ display: 'inline-flex', perspective: 300, transformOrigin: 'top center' }}
        >
          <Calendar size={13} className="shrink-0" />
        </motion.span>
      )
    }

    if (shouldReduceMotion) {
      return <ShieldCheck size={13} className="shrink-0" />
    }

    return (
      <span className="relative inline-flex overflow-hidden rounded">
        <ShieldCheck size={13} className="shrink-0" />
        <motion.span
          aria-hidden="true"
          initial={{ x: '-140%' }}
          animate={inView ? { x: ['-140%', '180%'] } : { x: '-140%' }}
          transition={{ duration: 0.75, delay: delay + 0.25, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-y-0 w-2 bg-gradient-to-r from-transparent via-white/80 to-transparent -skew-x-12"
        />
      </span>
    )
  }

  return (
    <motion.div
      initial={
        shouldReduceMotion
          ? { opacity: 1 }
          : { opacity: 0, rotateX: -20, y: 12 }
      }
      animate={
        inView
          ? { opacity: 1, rotateX: 0, y: 0 }
          : shouldReduceMotion
          ? { opacity: 1 }
          : { opacity: 0, rotateX: -20, y: 12 }
      }
      whileHover={
        shouldReduceMotion
          ? undefined
          : { y: -2, scale: 1.015 }
      }
      whileTap={
        shouldReduceMotion
          ? undefined
          : { y: 0, scale: 0.99 }
      }
      transition={{
        type: 'spring',
        stiffness: 260,
        damping: 22,
        delay: shouldReduceMotion ? 0 : delay,
      }}
      style={{ transformOrigin: 'top center', transformPerspective: 900 }}
      className={`h-full p-3.5 rounded-2xl bg-white/75 dark:bg-white/[0.06] border ${palette.border} ${palette.hoverShadow} shadow-xs transition-shadow duration-300 flex flex-col justify-between gap-2`}
    >
        <div className="flex items-center gap-2">
          <span
            className={`size-6 rounded-lg border flex items-center justify-center shrink-0 ${palette.iconWrap}`}
          >
            {renderAnimatedIcon()}
          </span>
          <span
            className={`text-[10px] font-black uppercase tracking-wider leading-tight ${palette.labelText} ${
              isUrdu ? 'font-urdu text-[11px] normal-case tracking-normal' : ''
            }`}
          >
            {label}
          </span>
        </div>

        <div>
          {isSplitFlapDate ? (
            <SplitFlapDate value={value} inView={inView} isUrdu={isUrdu} />
          ) : (
            <p
              className={`font-extrabold text-slate-900 dark:text-slate-100 leading-snug ${
                isUrdu ? 'font-urdu text-xs sm:text-[13px]' : 'text-xs sm:text-[13px]'
              }`}
            >
              {value}
            </p>
          )}
        </div>
    </motion.div>
  )
}

export default InfoTile

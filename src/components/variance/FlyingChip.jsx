import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { TrendingUp, TrendingDown, Repeat, Ban, Layers } from 'lucide-react'
import { formatNumberPKR } from '../../utils/formatters'
import { translateCategory, translateItemName } from '../../utils/translations'

/**
 * FlyingChip: Interactive chip inside the "How We Got Here" math player track.
 * - Increase chips glow rose and animate a stacking lift.
 * - Standard reduction chips glow emerald and slide out cleanly.
 * - Eliminated (-100.0%) chips ("Shifted" / "Removed") dissolve into particle shards
 *   rather than dropping silently like an efficiency saving.
 * - Remainder bucket renders as a neutral slate chip: "Other small changes (N items)".
 * - Hover/tap links bidirectionally with the VarianceItemCard panels below.
 */
export const FlyingChip = ({
  step,
  state = 'pending', // 'pending' | 'active' | 'done'
  isLinkedHighlighted = false,
  isMobile = false,
  displayCurrency = 'PKR',
  isUrdu = false,
  onSelect,
  onHoverItem,
  onLeaveItem,
}) => {
  const shouldReduceMotion = useReducedMotion()

  const isIncrease = step.type === 'increase'
  const isReduction = step.type === 'reduction'
  const isOther = step.type === 'other'
  const isEliminated = Boolean(step.isEliminated)

  const particleCount = shouldReduceMotion ? 0 : isMobile ? 3 : 7
  const dissolveOffsets = [
    { x: -24, y: -18 },
    { x: 22, y: -20 },
    { x: -16, y: 16 },
    { x: 18, y: 14 },
    { x: 0, y: -26 },
    { x: -30, y: 2 },
    { x: 28, y: -4 },
  ].slice(0, particleCount)

  // Color framing with WCAG AA contrast
  const getToneClass = () => {
    if (isLinkedHighlighted) {
      if (isIncrease) {
        return 'bg-rose-100 dark:bg-rose-950/75 border-rose-500 text-rose-900 dark:text-rose-100 ring-2 ring-rose-400/60 shadow-[0_8px_20px_-4px_rgba(244,63,94,0.4)]'
      }
      if (isReduction) {
        return isEliminated
          ? 'bg-amber-100 dark:bg-amber-950/70 border-amber-500 text-amber-950 dark:text-amber-100 ring-2 ring-amber-400/60 shadow-md'
          : 'bg-emerald-100 dark:bg-emerald-950/75 border-emerald-500 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-400/60 shadow-[0_8px_20px_-4px_rgba(16,185,129,0.4)]'
      }
      return 'bg-slate-200 dark:bg-slate-800 border-slate-500 text-slate-900 dark:text-white ring-2 ring-slate-400/60'
    }

    if (isIncrease) {
      return state === 'active'
        ? 'bg-rose-100/95 dark:bg-rose-950/65 border-rose-400 text-rose-900 dark:text-rose-100 shadow-md'
        : 'bg-rose-50/85 dark:bg-rose-950/35 border-rose-200 dark:border-rose-700/45 text-rose-800 dark:text-rose-200'
    }

    if (isReduction) {
      if (isEliminated) {
        return state === 'done'
          ? 'bg-amber-50/60 dark:bg-amber-950/25 border-dashed border-amber-300/80 dark:border-amber-700/50 text-amber-900/85 dark:text-amber-200/85'
          : 'bg-amber-50/90 dark:bg-amber-950/50 border-amber-300 dark:border-amber-600/60 text-amber-950 dark:text-amber-100 shadow-sm'
      }
      return state === 'active'
        ? 'bg-emerald-100/95 dark:bg-emerald-950/65 border-emerald-400 text-emerald-950 dark:text-emerald-100 shadow-md'
        : 'bg-emerald-50/85 dark:bg-emerald-950/35 border-emerald-200 dark:border-emerald-700/45 text-emerald-900 dark:text-emerald-200'
    }

    // "Other small changes" neutral grey glass chip
    return state === 'active'
      ? 'bg-slate-200/95 dark:bg-slate-800/90 border-slate-400 text-slate-900 dark:text-white shadow-md'
      : 'bg-slate-100/85 dark:bg-slate-800/55 border-slate-300/80 dark:border-slate-700 text-slate-800 dark:text-slate-200'
  }

  // Transform motion variants (GPU transform & opacity only)
  const motionAnimate = shouldReduceMotion
    ? { opacity: state === 'pending' ? 0.55 : 1 }
    : state === 'active'
    ? isIncrease
      ? { y: [14, -5, 0], x: [-8, 0], scale: [0.92, 1.05, 1.02], opacity: 1 }
      : isEliminated
      ? { scale: [1.04, 0.96, 1], opacity: [1, 0.72, 0.92], y: 0 }
      : isReduction
      ? { y: [-6, 4, 0], x: [8, 0], scale: [1.04, 0.98, 1], opacity: 1 }
      : { scale: [0.92, 1.04, 1], opacity: 1, y: 0 }
    : state === 'pending'
    ? { opacity: 0.45, scale: 0.96, y: 0, x: 0 }
    : { opacity: isEliminated ? 0.78 : 0.95, scale: 1, y: 0, x: 0 }

  const displayLabel = isOther
    ? isUrdu
      ? `دیگر معمولی تبدیلیاں (${step.otherCount})`
      : `Other small changes (${step.otherCount} items)`
    : isUrdu
    ? translateItemName(step.name, 'ur')
    : step.name

  const amountVal = Math.abs(step.amount || 0)
  const amountPrefix = step.amount > 0 ? '+' : step.amount < 0 ? '−' : ''

  return (
    <motion.button
      type="button"
      onClick={() => onSelect && onSelect(step)}
      onMouseEnter={() => step.name && onHoverItem && onHoverItem(step.name)}
      onMouseLeave={() => onLeaveItem && onLeaveItem()}
      animate={motionAnimate}
      transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
      style={{ willChange: 'transform, opacity' }}
      className={`relative w-full min-h-[44px] px-2.5 sm:px-3 py-2 rounded-2xl border backdrop-blur-md transition-shadow duration-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-2 text-start cursor-pointer ${getToneClass()}`}
    >
      {/* Dissolving glass particle shards for -100.0% Shifted/Removed items when active */}
      {isEliminated && state === 'active' && !shouldReduceMotion && (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-visible">
          {dissolveOffsets.map((off, idx) => (
            <motion.span
              key={idx}
              initial={{ x: 0, y: 0, scale: 1, opacity: 0.95 }}
              animate={{
                x: off.x,
                y: off.y,
                scale: 0,
                opacity: 0,
              }}
              transition={{ duration: 0.7, delay: idx * 0.04, ease: 'easeOut' }}
              className="absolute left-1/2 top-1/2 size-2 rounded-xs bg-amber-400/90 border border-white/80"
            />
          ))}
        </span>
      )}

      {/* Left: Icon + Name + Optional Tag */}
      <div className="min-w-0 flex items-center gap-2">
        <span
          className={`size-6 rounded-lg flex items-center justify-center shrink-0 ${
            isIncrease
              ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
              : isOther
              ? 'bg-slate-500/15 text-slate-700 dark:text-slate-300'
              : isEliminated
              ? 'bg-amber-500/18 text-amber-800 dark:text-amber-300'
              : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
          }`}
        >
          {isIncrease ? (
            <TrendingUp size={13} />
          ) : isOther ? (
            <Layers size={13} />
          ) : isEliminated ? (
            step.statusTag === 'Shifted' ? (
              <Repeat size={13} />
            ) : (
              <Ban size={13} />
            )
          ) : (
            <TrendingDown size={13} />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] sm:text-xs font-extrabold leading-tight line-clamp-2 sm:truncate sm:max-w-[200px]">
              {displayLabel}
            </span>

            {isEliminated && (
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded-full bg-amber-200/80 dark:bg-amber-900/60 text-amber-900 dark:text-amber-100 whitespace-nowrap">
                {step.statusTag === 'Shifted'
                  ? isUrdu
                    ? 'منتقل'
                    : 'Shifted'
                  : isUrdu
                  ? 'ختم'
                  : 'Removed'}
              </span>
            )}
          </div>

          {step.movedToCategory && (
            <span className="text-[10px] font-semibold opacity-80 block truncate">
              {isUrdu
                ? `→ ${translateCategory(step.movedToCategory, 'ur')}`
                : `→ moved to ${step.movedToCategory}`}
            </span>
          )}
        </div>
      </div>

      {/* Right / Bottom Mobile: Signed Amount */}
      <div
        dir="ltr"
        style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
        className="text-[11px] sm:text-xs font-black font-numeric tabular-nums whitespace-nowrap shrink-0 self-end sm:self-auto"
      >
        <span className="inline-flex items-center gap-0.5">
          <span>{amountPrefix}</span>
          <span dir={isUrdu ? 'rtl' : 'ltr'}>{displayCurrency}</span>
        </span>{' '}
        <span>{formatNumberPKR(amountVal)}</span>
      </div>
    </motion.button>
  )
}

export default FlyingChip

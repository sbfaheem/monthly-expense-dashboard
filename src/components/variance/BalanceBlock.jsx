import React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ArrowUpRight, ArrowDownRight, Sparkles, Layers } from 'lucide-react'
import AnimatedNumber from '../motion/AnimatedNumber'
import { formatNumberPKR } from '../../utils/formatters'
import { translateMonth } from '../../utils/translations'

/**
 * BalanceBlock: Frosted glass 3D architectural pedestal block for "How We Got Here".
 * Drops in at baseline total, grows taller with red stacked glass discs during increases,
 * shrinks during reductions, and settles to the current month total with a soft glow pulse.
 * Animates only transform (scaleY, translateY, scale) and opacity for 60fps.
 */
export const BalanceBlock = ({
  phase = 'settled', // 'start' | 'increase' | 'reduction' | 'other' | 'settled'
  priorMonth = '',
  currentMonth = '',
  totalPrior = 0,
  totalCurrent = 0,
  runningTotal = 0,
  prevRunningTotal = 0,
  activeStep = null, // { type, amount, label, key, isEliminated }
  stackedIncreaseCount = 0,
  peakTotal = 0,
  displayCurrency = 'PKR',
  isUrdu = false,
  compact = false,
  replayKey = 0,
  stepIndex = 0,
}) => {
  const shouldReduceMotion = useReducedMotion()

  const priorShort = (priorMonth || 'Previous').split(' ')[0]
  const currentShort = (currentMonth || 'Current').split(' ')[0]
  const priorDisplay = isUrdu ? translateMonth(priorShort, 'ur') : priorShort
  const currentDisplay = isUrdu ? translateMonth(currentShort, 'ur') : currentShort

  // Calibrate visual height scaleY around baseline so additions visibly lift above baseline
  // and reductions visibly lower below baseline without collapsing to an unreadable sliver.
  const maxRef = Math.max(totalPrior, totalCurrent, peakTotal, 1)
  const minRef = Math.min(totalPrior, totalCurrent, 0)
  const baselineNormalized = 0.72
  const deltaRatio =
    maxRef > minRef
      ? (runningTotal - totalPrior) / Math.max(maxRef - Math.min(totalPrior, totalCurrent), maxRef * 0.25, 1)
      : 0
  const targetScaleY = Math.max(0.48, Math.min(0.96, baselineNormalized + deltaRatio * 0.22))

  const isSettled = phase === 'settled'
  const isReducedNet = totalCurrent < totalPrior
  const isIncreasedNet = totalCurrent > totalPrior

  const blockTitle =
    phase === 'start'
      ? isUrdu
        ? `${priorDisplay} کل اخراجات`
        : `${priorDisplay} total`
      : isSettled
      ? isUrdu
        ? `${currentDisplay} کل اخراجات`
        : `${currentDisplay} total`
      : isUrdu
      ? 'موجودہ مجموعہ'
      : 'Running total'

  const capGradient =
    phase === 'increase'
      ? 'from-rose-500/85 via-rose-400/75 to-rose-600/90 border-rose-300/85'
      : phase === 'reduction'
      ? 'from-emerald-500/85 via-teal-400/75 to-emerald-600/90 border-emerald-300/85'
      : phase === 'other'
      ? 'from-slate-500/80 via-slate-400/70 to-slate-600/85 border-slate-300/80'
      : isSettled && isReducedNet
      ? 'from-emerald-500/90 via-teal-400/80 to-emerald-600/95 border-emerald-300/90'
      : isSettled && isIncreasedNet
      ? 'from-rose-500/85 via-amber-400/75 to-rose-600/90 border-rose-300/85'
      : 'from-indigo-500/85 via-blue-500/75 to-indigo-600/90 border-indigo-300/85'

  const settledGlowClass =
    isSettled && isReducedNet
      ? 'shadow-[0_0_32px_-4px_rgba(16,185,129,0.5)] ring-2 ring-emerald-400/50'
      : isSettled && isIncreasedNet
      ? 'shadow-[0_0_28px_-4px_rgba(244,63,94,0.42)] ring-2 ring-rose-400/45'
      : 'shadow-[0_14px_30px_-8px_rgba(79,70,229,0.3)] ring-1 ring-white/50 dark:ring-white/15'

  // Red coin strata discs visibly stacked on top during increases (up to 3 items)
  const visibleDiscs =
    phase === 'settled' || phase === 'start' ? 0 : Math.min(3, Math.max(0, stackedIncreaseCount))

  return (
    <div
      style={{ perspective: 950 }}
      className={`relative flex flex-col items-center justify-between rounded-2xl bg-white/60 dark:bg-slate-900/55 border border-white/80 dark:border-white/12 backdrop-blur-lg ${
        compact ? 'w-[122px] min-h-[240px] p-2.5' : 'w-full min-h-[256px] p-3.5 sm:p-4'
      } select-none`}
    >
      {/* Top Status Label + Running Total Counter */}
      <div className="w-full text-center space-y-1 z-20">
        <span className="inline-flex items-center justify-center gap-1 text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 whitespace-nowrap">
          {isSettled ? (
            <Sparkles size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
          ) : (
            <Layers size={11} className="text-indigo-600 dark:text-indigo-300 shrink-0" />
          )}
          <span>{blockTitle}</span>
        </span>

        <div
          dir="ltr"
          style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
          className={`flex items-baseline justify-center gap-1.5 pt-0.5 font-black leading-tight font-numeric tabular-nums transition-colors duration-300 ${
            compact ? 'text-sm' : 'text-lg sm:text-xl'
          } ${
            isSettled && isReducedNet
              ? 'text-emerald-800 dark:text-emerald-200'
              : isSettled && isIncreasedNet
              ? 'text-rose-800 dark:text-rose-200'
              : 'text-slate-900 dark:text-white'
          }`}
        >
          <span
            dir={isUrdu ? 'rtl' : 'ltr'}
            className="text-[10px] sm:text-xs font-extrabold opacity-75"
          >
            {displayCurrency}
          </span>
          <AnimatedNumber
            value={runningTotal}
            from={prevRunningTotal}
            duration={0.55}
            triggerKey={`${replayKey}-${stepIndex}-${runningTotal}`}
          />
        </div>
      </div>

      {/* Dedicated Non-Overlapping Floating Delta Pill Row */}
      <div className="w-full h-7 flex items-center justify-center z-30 my-1">
        <AnimatePresence mode="wait">
          {activeStep && activeStep.amount !== 0 && !shouldReduceMotion && (
            <motion.div
              key={`delta-toast-${stepIndex}-${activeStep.key}`}
              initial={{ opacity: 0, y: 6, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -6, scale: 0.9 }}
              transition={{ duration: 0.22 }}
              dir="ltr"
              style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-[11px] font-black font-numeric tabular-nums shadow-sm border whitespace-nowrap ${
                activeStep.amount > 0
                  ? 'bg-rose-100/95 text-rose-900 border-rose-300 dark:bg-rose-950/85 dark:text-rose-200 dark:border-rose-600/60'
                  : activeStep.type === 'other'
                  ? 'bg-slate-200/95 text-slate-900 border-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600'
                  : 'bg-emerald-100/95 text-emerald-900 border-emerald-300 dark:bg-emerald-950/85 dark:text-emerald-200 dark:border-emerald-600/60'
              }`}
            >
              {activeStep.amount > 0 ? (
                <ArrowUpRight size={11} />
              ) : (
                <ArrowDownRight size={11} />
              )}
              <span>
                {activeStep.amount > 0 ? '+' : '−'} {formatNumberPKR(activeStep.amount)}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Center 3D Glass Column Stage (explicit height prevents flex percentage collapse) */}
      <div
        className={`relative w-full flex items-end justify-center pb-1 ${
          compact ? 'h-[126px]' : 'h-[138px]'
        }`}
      >
        {/* Baseline dashed reference mark (Prior month level) */}
        <div
          style={{ bottom: `${Math.round(baselineNormalized * 100)}%` }}
          className="pointer-events-none absolute inset-x-1 border-t border-dashed border-slate-400/60 dark:border-slate-500/60 flex justify-end z-10"
        >
          <span className="text-[9px] font-bold text-slate-500 dark:text-slate-400 bg-white/85 dark:bg-slate-900/85 px-1 rounded -mt-2.5 whitespace-nowrap">
            {priorDisplay}
          </span>
        </div>

        {/* Main 3D Glass Pedestal Column (GPU scaleY from bottom) */}
        <motion.div
          key={`block-drop-${replayKey}`}
          initial={shouldReduceMotion ? { opacity: 1 } : { y: -34, opacity: 0, rotateX: 16 }}
          animate={{ y: 0, opacity: 1, rotateX: 6 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformStyle: 'preserve-3d' }}
          className={`relative flex flex-col items-center justify-end h-full ${
            compact ? 'w-[66px]' : 'w-[96px] sm:w-[112px]'
          }`}
        >
          {/* Red Glass Stacked Coin Discs sitting ON TOP of column during Additions */}
          {visibleDiscs > 0 && !shouldReduceMotion && (
            <div className="flex flex-col-reverse items-center gap-0.5 mb-0.5 z-20 shrink-0">
              {Array.from({ length: visibleDiscs }).map((_, dIdx) => (
                <motion.div
                  key={dIdx}
                  initial={{ y: -18, opacity: 0, scale: 0.75 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                  className={`${
                    compact ? 'w-[58px]' : 'w-[86px] sm:w-[98px]'
                  } h-2.5 rounded-full bg-gradient-to-r from-rose-400/95 via-rose-300 to-rose-500/95 border border-white/80 shadow-[0_2px_8px_rgba(244,63,94,0.45)]`}
                />
              ))}
            </div>
          )}

          {/* Frosted Glass Tower Body scaling strictly with transform: scaleY */}
          <div className="relative w-full flex-1 min-h-[82px] flex items-end justify-center">
            <motion.div
              animate={{
                scaleY: targetScaleY,
                scale: isSettled && !shouldReduceMotion ? [1, 1.03, 1] : 1,
              }}
              transition={{
                scaleY: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
                scale: { duration: 0.5 },
              }}
              style={{
                transformOrigin: 'bottom center',
                willChange: 'transform',
              }}
              className={`relative w-full h-full rounded-t-2xl rounded-b-xl bg-gradient-to-b ${capGradient} border backdrop-blur-md transition-shadow duration-300 ${settledGlowClass}`}
            >
              {/* Top specular frosted highlight cap */}
              <div
                aria-hidden="true"
                className="absolute inset-x-1 top-1 h-2.5 rounded-t-xl bg-gradient-to-b from-white/55 to-transparent pointer-events-none"
              />
              {/* Left glass bevel sheen */}
              <div
                aria-hidden="true"
                className="absolute inset-y-1 left-1 w-2 rounded-l-lg bg-gradient-to-r from-white/35 to-transparent pointer-events-none"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Footer note beneath pedestal */}
      <div className="w-full text-center pt-1.5 mt-1 border-t border-slate-900/[0.06] dark:border-white/[0.08]">
        <div
          dir="ltr"
          style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
          className="text-[10px] font-bold text-slate-700 dark:text-slate-300 font-numeric tabular-nums inline-flex items-center justify-center gap-1 whitespace-nowrap"
        >
          <span dir={isUrdu ? 'rtl' : 'ltr'}>
            {isSettled ? currentDisplay : priorDisplay}:
          </span>
          <span dir={isUrdu ? 'rtl' : 'ltr'}>{displayCurrency}</span>
          <span>{formatNumberPKR(isSettled ? totalCurrent : totalPrior)}</span>
        </div>
      </div>
    </div>
  )
}

export default BalanceBlock

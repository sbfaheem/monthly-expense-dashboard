import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowRight, RotateCcw, ArrowUp, ArrowDown, Sparkles } from 'lucide-react'
import GlassCard from '../motion/GlassCard'
import AnimatedNumber from '../motion/AnimatedNumber'

/**
 * 3D Split-Flap Mini-Panel inside DeltaCapsule
 * Flips along X axis like a mechanical split-flap board when animation replays.
 */
function SplitFlapPanel({
  label,
  pctValue,
  absDiff,
  displayCurrency,
  isPositiveArrow,
  isFavorable,
  isSavingsLabel,
  isUrdu,
  delay = 0,
  replayKey = 0,
  compact = false,
}) {
  const shouldReduceMotion = useReducedMotion()

  const pctNum = Number(pctValue) || 0
  const arrowSign = isPositiveArrow ? '+' : '-'
  const diffSign = isPositiveArrow ? '+' : '-'

  const colorText = isFavorable
    ? 'text-emerald-600 dark:text-emerald-300'
    : 'text-rose-600 dark:text-rose-300'

  const chipBg = isFavorable
    ? 'bg-emerald-500/12 border-emerald-500/35 text-emerald-700 dark:text-emerald-300'
    : 'bg-rose-500/12 border-rose-500/35 text-rose-700 dark:text-rose-300'

  return (
    <motion.div
      key={`${label}-${replayKey}`}
      initial={shouldReduceMotion ? { opacity: 1 } : { rotateX: -88, opacity: 0.25 }}
      animate={shouldReduceMotion ? { opacity: 1 } : { rotateX: 0, opacity: 1 }}
      transition={{
        duration: 0.55,
        delay,
        type: 'spring',
        stiffness: 220,
        damping: 19,
      }}
      style={{
        transformOrigin: '50% 45%',
        transformStyle: 'preserve-3d',
        willChange: 'transform, opacity',
      }}
      className={`relative rounded-2xl border border-slate-200/75 dark:border-white/12 bg-white/75 dark:bg-slate-900/75 backdrop-blur-md shadow-xs overflow-hidden ${
        compact ? 'px-2.5 py-2 flex-1 min-w-0' : 'w-full px-3 py-2.5'
      }`}
    >
      {/* Subtle mechanical split-flap horizontal seam */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-1/2 h-px bg-slate-900/[0.06] dark:bg-white/[0.08]"
      />

      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1 truncate">
        {label}
      </span>

      <div
        dir="ltr"
        style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
        className={`flex flex-col items-center gap-0.5 rounded-xl border px-2 py-1 ${chipBg}`}
      >
        {/* Percentage + One-Time Bounce Arrow */}
        <div className={`inline-flex items-center gap-1 font-mono font-black text-xs sm:text-sm whitespace-nowrap ${colorText}`}>
          <motion.span
            key={`arrow-${replayKey}`}
            initial={shouldReduceMotion ? {} : { y: 0, scale: 1 }}
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: isPositiveArrow ? [0, -5, 0] : [0, 5, 0],
                    scale: [1, 1.24, 1],
                  }
            }
            transition={{ duration: 0.55, delay: delay + 0.28, ease: 'easeOut' }}
            className="inline-flex items-center"
          >
            {isPositiveArrow ? (
              <ArrowUp size={13} className="stroke-[2.75]" />
            ) : (
              <ArrowDown size={13} className="stroke-[2.75]" />
            )}
          </motion.span>
          <span className="inline-flex items-baseline whitespace-nowrap">
            <span>{arrowSign}</span>
            <AnimatedNumber
              value={pctNum}
              from={0}
              decimals={1}
              suffix="%"
              duration={0.75}
              delay={delay + 0.1}
              triggerKey={replayKey}
            />
          </span>
        </div>

        {/* Exact PKR / روپے difference */}
        <span className="text-[10px] font-mono font-bold opacity-85 whitespace-nowrap">
          {diffSign}
          {displayCurrency}{' '}
          <AnimatedNumber
            value={Math.abs(absDiff)}
            from={0}
            duration={0.8}
            delay={delay + 0.12}
            triggerKey={replayKey}
          />
          {isSavingsLabel ? ` ${isUrdu ? 'بچت' : 'Saved'}` : ''}
        </span>
      </div>
    </motion.div>
  )
}

export const DeltaCapsule = ({
  collectionDiff = 0,
  collectionPct = 0,
  isCollectionUp = true,
  expenseDiff = 0,
  expensePct = 0,
  isExpenseUp = false,
  balanceDiff = 0,
  displayCurrency = 'PKR',
  isUrdu = false,
  onReplay,
  replayKey = 0,
  inView = true,
  variant = 'desktop', // 'desktop' | 'mobile'
}) => {
  const shouldReduceMotion = useReducedMotion()

  if (variant === 'mobile') {
    return (
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.45, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
        style={{ perspective: 900 }}
        className="w-full z-20"
      >
        <GlassCard
          glow={balanceDiff >= 0 ? 'green' : 'red'}
          className="rounded-2xl p-2.5 sm:p-3"
        >
          <div className="flex items-stretch gap-2 w-full">
            <SplitFlapPanel
              label={isUrdu ? 'وصولی فرق' : 'Collection'}
              pctValue={collectionPct}
              absDiff={collectionDiff}
              displayCurrency={displayCurrency}
              isPositiveArrow={isCollectionUp}
              isFavorable={isCollectionUp}
              isSavingsLabel={false}
              isUrdu={isUrdu}
              delay={0.05}
              replayKey={replayKey}
              compact
            />

            {/* Center 44px+ Replay Trigger Button */}
            <div className="flex flex-col items-center justify-center shrink-0">
              <button
                type="button"
                onClick={onReplay}
                aria-label={isUrdu ? 'موازنہ اینیمیشن دوبارہ چلائیں' : 'Replay comparison animation'}
                title={isUrdu ? 'اینیمیشن دوبارہ چلائیں' : 'Replay animation'}
                className="min-h-[44px] min-w-[44px] size-11 rounded-2xl bg-indigo-600/15 hover:bg-indigo-600/25 dark:bg-indigo-400/20 dark:hover:bg-indigo-400/30 border border-indigo-500/35 text-indigo-700 dark:text-indigo-200 flex items-center justify-center shadow-xs transition-transform active:scale-90 cursor-pointer"
              >
                <motion.span
                  key={`spin-mob-${replayKey}`}
                  initial={shouldReduceMotion ? {} : { rotate: 0 }}
                  animate={shouldReduceMotion ? {} : { rotate: 360 }}
                  transition={{ duration: 0.55, ease: 'easeOut' }}
                  className="inline-flex"
                >
                  <ArrowRight size={16} className={isUrdu ? '-rotate-90' : 'rotate-90'} />
                </motion.span>
              </button>
              <span className="text-[9px] font-mono font-bold text-slate-400 mt-0.5 whitespace-nowrap">
                {isUrdu ? 'دوبارہ' : 'Replay'}
              </span>
            </div>

            <SplitFlapPanel
              label={isUrdu ? 'اخراجات فرق' : 'Expenses'}
              pctValue={expensePct}
              absDiff={expenseDiff}
              displayCurrency={displayCurrency}
              isPositiveArrow={expenseDiff > 0}
              isFavorable={!isExpenseUp}
              isSavingsLabel={expenseDiff < 0}
              isUrdu={isUrdu}
              delay={0.14}
              replayKey={replayKey}
              compact
            />
          </div>
        </GlassCard>
      </motion.div>
    )
  }

  // Desktop center vertical glass capsule
  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 28, scale: 0.94 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{ duration: 0.55, delay: 0.22, ease: [0.22, 1, 0.36, 1] }}
      style={{ perspective: 1000 }}
      className="hidden lg:flex flex-col items-center justify-center w-[204px] flex-shrink-0 z-20 self-center"
    >
      <GlassCard
        glow={balanceDiff >= 0 ? 'green' : 'red'}
        className="w-full p-4 text-center"
      >
        <div className="flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-300 mb-3">
          <Sparkles size={12} />
          <span className="whitespace-nowrap">
            {isUrdu ? 'ماہانہ فرق / تبدیلی' : 'Variance / Delta'}
          </span>
        </div>

        <div className="space-y-2.5">
          <SplitFlapPanel
            label={isUrdu ? 'وصولی تبدیلی' : 'Collection Shift'}
            pctValue={collectionPct}
            absDiff={collectionDiff}
            displayCurrency={displayCurrency}
            isPositiveArrow={isCollectionUp}
            isFavorable={isCollectionUp}
            isSavingsLabel={false}
            isUrdu={isUrdu}
            delay={0.08}
            replayKey={replayKey}
          />

          <SplitFlapPanel
            label={isUrdu ? 'اخراجات تبدیلی' : 'Expenses Shift'}
            pctValue={expensePct}
            absDiff={expenseDiff}
            displayCurrency={displayCurrency}
            isPositiveArrow={expenseDiff > 0}
            isFavorable={!isExpenseUp}
            isSavingsLabel={expenseDiff < 0}
            isUrdu={isUrdu}
            delay={0.2}
            replayKey={replayKey}
          />
        </div>

        {/* Center Replay Arrow Button (>= 44px touch target) */}
        <div className="mt-3.5 flex flex-col items-center">
          <button
            type="button"
            onClick={onReplay}
            aria-label={isUrdu ? 'موازنہ اینیمیشن دوبارہ چلائیں' : 'Replay comparison animation'}
            title={isUrdu ? 'اینیمیشن دوبارہ چلائیں' : 'Replay delta animation'}
            className="group min-h-[44px] min-w-[44px] size-11 rounded-full bg-indigo-600/12 hover:bg-indigo-600/22 dark:bg-indigo-400/18 dark:hover:bg-indigo-400/28 border border-indigo-500/35 text-indigo-700 dark:text-indigo-200 flex items-center justify-center shadow-sm transition-all active:scale-90 cursor-pointer"
          >
            <motion.span
              key={`spin-desk-${replayKey}`}
              initial={shouldReduceMotion ? {} : { rotate: 0 }}
              animate={shouldReduceMotion ? {} : { rotate: 360 }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="inline-flex items-center justify-center"
            >
              <ArrowRight
                size={16}
                className={`group-hover:hidden ${isUrdu ? 'rotate-180' : ''}`}
              />
              <RotateCcw size={15} className="hidden group-hover:block" />
            </motion.span>
          </button>
          <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 mt-1 whitespace-nowrap">
            {isUrdu ? 'دوبارہ دیکھیں' : 'Replay flow'}
          </span>
        </div>
      </GlassCard>
    </motion.div>
  )
}

export default DeltaCapsule

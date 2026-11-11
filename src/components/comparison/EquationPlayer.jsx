import React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Play, RotateCcw, Plus, Minus, Equal, Sparkles, Coins, ArrowUpRight } from 'lucide-react'
import GlassCard from '../motion/GlassCard'
import AnimatedNumber from '../motion/AnimatedNumber'

/**
 * Visual Glass Coin Stack (+ Collection) or Floating Outflow Coins (- Expenses)
 * Used during step-by-step equation playback so non-technical residents SEE money entering and leaving.
 */
export function CoinStackVisual({ mode = 'inflow', active = false }) {
  const shouldReduceMotion = useReducedMotion()
  if (!active || shouldReduceMotion) return null

  if (mode === 'inflow') {
    const coins = [0, 1, 2, 3, 4]
    return (
      <div
        aria-hidden="true"
        className="pointer-events-none flex items-center gap-1 shrink-0"
      >
        <div className="relative h-7 w-7 flex items-end justify-center">
          {coins.map((c) => (
            <motion.span
              key={c}
              initial={{ y: -28, opacity: 0, scale: 0.7 }}
              animate={{ y: -c * 3.5, opacity: 1, scale: 1 }}
              transition={{
                duration: 0.38,
                delay: c * 0.08,
                type: 'spring',
                stiffness: 320,
                damping: 18,
              }}
              className="absolute bottom-0.5 h-2 w-6 rounded-full bg-gradient-to-r from-emerald-400/90 via-teal-300/95 to-emerald-500/90 border border-white/80 shadow-[0_2px_6px_rgba(16,185,129,0.45)]"
            />
          ))}
        </div>
      </div>
    )
  }

  // Outflow coins lifting off and flying out
  const outCoins = [0, 1, 2]
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none relative h-7 w-7 flex items-center justify-center shrink-0"
    >
      {outCoins.map((c) => (
        <motion.span
          key={c}
          initial={{ y: 2, x: 0, opacity: 0.95, scale: 0.95 }}
          animate={{
            y: [-2, -24 - c * 7],
            x: [0, 14 + c * 6],
            opacity: [0.95, 0.9, 0],
            scale: [1, 0.78],
          }}
          transition={{
            duration: 0.85,
            delay: c * 0.14,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="absolute h-2 w-5 rounded-full bg-gradient-to-r from-rose-400/90 via-amber-300/90 to-rose-500/90 border border-white/75 shadow-[0_2px_6px_rgba(244,63,94,0.4)]"
        />
      ))}
    </div>
  )
}

/**
 * Live Equation Strip below Month-over-Month cards:
 * "Opening + Collected − Spent = Closing"
 * Highlighting whichever term is currently animating (step 1..4), and remaining
 * permanently readable with clickable step pills so users can replay or inspect any step.
 */
export const EquationPlayer = ({
  openingBalance = 0,
  collection = 0,
  expenses = 0,
  cctvExpense = 0,
  closingBalance = 0,
  isImproved = true,
  displayCurrency = 'PKR',
  isUrdu = false,
  activeStep = 4, // 1 = Opening, 2 = + Collection, 3 = - Expenses, 4 = = Closing
  isPlaying = false,
  playCount = 0,
  onShowMeHow,
  onSelectStep,
}) => {
  const shouldReduceMotion = useReducedMotion()

  const steps = [
    {
      step: 1,
      operator: null,
      label: isUrdu ? 'ابتدائی بیلنس' : 'Opening',
      value: openingBalance,
      tone: 'indigo',
      displaySign: false,
    },
    {
      step: 2,
      operator: '+',
      label: isUrdu ? 'ماہانہ وصولی' : 'Collected',
      value: Math.abs(collection),
      tone: 'green',
      displaySign: false,
    },
    {
      step: 3,
      operator: '−',
      label: isUrdu ? 'کل اخراجات' : 'Spent',
      value: Math.abs(expenses),
      tone: 'red',
      displaySign: false,
    },
    ...(cctvExpense > 0
      ? [
          {
            step: 3,
            operator: '−',
            label: isUrdu ? 'کیپیکس / سی سی ٹی وی' : 'CapEx',
            value: Math.abs(cctvExpense),
            tone: 'red',
            displaySign: false,
          },
        ]
      : []),
    {
      step: 4,
      operator: '=',
      label: isUrdu ? 'اختتامی بیلنس' : 'Closing',
      value: closingBalance,
      tone: isImproved ? 'green' : closingBalance >= 0 ? 'green' : 'red',
      displaySign: false,
    },
  ]

  const getTermClasses = (stepNum, tone) => {
    const isCurrent = activeStep === stepNum
    const isCompleted = activeStep > stepNum || activeStep === 4

    if (isCurrent) {
      if (tone === 'green') {
        return 'bg-emerald-500/18 border-emerald-500/65 text-emerald-800 dark:text-emerald-200 shadow-[0_6px_20px_-4px_rgba(16,185,129,0.4)] ring-2 ring-emerald-400/40 scale-[1.03]'
      }
      if (tone === 'red') {
        return 'bg-rose-500/18 border-rose-500/65 text-rose-800 dark:text-rose-200 shadow-[0_6px_20px_-4px_rgba(244,63,94,0.35)] ring-2 ring-rose-400/40 scale-[1.03]'
      }
      return 'bg-indigo-500/18 border-indigo-500/65 text-indigo-900 dark:text-indigo-200 shadow-[0_6px_20px_-4px_rgba(99,102,241,0.4)] ring-2 ring-indigo-400/40 scale-[1.03]'
    }

    if (isCompleted) {
      return 'bg-white/75 dark:bg-white/[0.08] border-slate-200/80 dark:border-white/15 text-slate-800 dark:text-slate-100'
    }

    return 'bg-white/40 dark:bg-white/[0.04] border-slate-200/50 dark:border-white/10 text-slate-400 dark:text-slate-500 opacity-65'
  }

  return (
    <GlassCard
      glow={activeStep === 4 ? (isImproved ? 'green' : 'indigo') : 'indigo'}
      className="mt-5 p-3.5 sm:p-5 rounded-3xl"
    >
      {/* Top Bar: Plain-Language Title + "Show me how" Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-900/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="size-7 rounded-xl bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 flex items-center justify-center shrink-0">
            <Coins size={15} />
          </span>
          <div className="min-w-0">
            <p className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-100 truncate">
              {isUrdu
                ? 'حساب کا فارمولا: ابتدائی + وصولی − اخراجات = اختتامی'
                : 'Live Balance Equation: Opening + Collected − Spent = Closing'}
            </p>
            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {activeStep === 1 && (isUrdu ? 'مرحلہ 1: پچھلے مہینے کا اختتامی بیلنس منتقل ہو رہا ہے...' : 'Step 1 of 4: Previous closing balance becomes Opening Balance')}
              {activeStep === 2 && (isUrdu ? 'مرحلہ 2: رہائشیوں سے جمع شدہ رقم شامل کی جا رہی ہے...' : 'Step 2 of 4: Adding monthly collection from residents')}
              {activeStep === 3 && (isUrdu ? 'مرحلہ 3: ماہانہ اخراجات منہا کیے جا رہے ہیں...' : 'Step 3 of 4: Subtracting monthly operational expenses')}
              {activeStep === 4 &&
                (isImproved
                  ? isUrdu
                    ? 'مرحلہ 4: اختتامی بیلنس گزشتہ ماہ سے بہتر ہوا!'
                    : 'Step 4 of 4: Settled — Closing balance improved vs. previous month!'
                  : isUrdu
                  ? 'مرحلہ 4: اختتامی بیلنس مکمل حساب کے بعد'
                  : 'Step 4 of 4: Final closing reserve after collections & spend')}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onShowMeHow}
          className="min-h-[44px] px-4 py-2 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-600 hover:from-indigo-700 hover:to-cyan-700 text-white text-xs sm:text-sm font-black shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all active:scale-95 cursor-pointer shrink-0 whitespace-nowrap"
        >
          {isPlaying ? (
            <>
              <RotateCcw size={15} className="animate-spin" />
              <span>{isUrdu ? 'دوبارہ چلائیں' : 'Replay Equation'}</span>
            </>
          ) : (
            <>
              <Play size={15} className="fill-current" />
              <span>{isUrdu ? 'حساب کر کے دکھائیں' : 'Show me how'}</span>
            </>
          )}
        </button>
      </div>

      {/* Live Interactive Equation Pills */}
      <div
        dir="ltr"
        style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
        className="pt-3.5 flex flex-col md:flex-row md:flex-wrap items-stretch md:items-center justify-between gap-2 sm:gap-2.5"
      >
        {steps.map((term, idx) => (
          <React.Fragment key={`${term.label}-${idx}`}>
            {/* Operator */}
            {term.operator && (
              <div className="flex items-center justify-center shrink-0 py-0.5 md:py-0">
                <span
                  className={`size-7 rounded-full flex items-center justify-center font-mono font-black text-sm border transition-colors ${
                    activeStep >= term.step
                      ? term.operator === '+'
                        ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-700 dark:text-emerald-300'
                        : term.operator === '−'
                        ? 'bg-rose-500/15 border-rose-500/35 text-rose-700 dark:text-rose-300'
                        : 'bg-indigo-500/15 border-indigo-500/35 text-indigo-700 dark:text-indigo-200'
                      : 'bg-slate-200/50 dark:bg-slate-800/60 border-slate-300/40 text-slate-400'
                  }`}
                >
                  {term.operator === '+' && <Plus size={14} className="stroke-[3]" />}
                  {term.operator === '−' && <Minus size={14} className="stroke-[3]" />}
                  {term.operator === '=' && <Equal size={14} className="stroke-[3]" />}
                </span>
              </div>
            )}

            {/* Term Chip */}
            <motion.button
              type="button"
              onClick={() => onSelectStep && onSelectStep(term.step)}
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
              className={`min-h-[48px] flex-1 min-w-[130px] px-3.5 py-2 rounded-2xl border transition-all duration-300 cursor-pointer flex items-center md:flex-col md:items-start justify-between gap-1 text-left ${getTermClasses(
                term.step,
                term.tone
              )}`}
            >
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-black uppercase tracking-wider opacity-80 whitespace-nowrap">
                  {term.label}
                </span>
                {activeStep === term.step && !shouldReduceMotion && (
                  <motion.span
                    layoutId="activeEquationDot"
                    className="size-1.5 rounded-full bg-current"
                  />
                )}
              </div>

              <div className="text-sm sm:text-base font-black font-mono tabular-nums whitespace-nowrap">
                <AnimatedNumber
                  value={term.value}
                  from={activeStep === term.step ? 0 : term.value}
                  prefix={displayCurrency}
                  signBeforeNumber
                  duration={0.65}
                  triggerKey={`${playCount}-${activeStep === term.step ? term.step : 'idle'}`}
                />
              </div>
            </motion.button>
          </React.Fragment>
        ))}
      </div>

      {/* Step Quick-Scrubber Footer (accessible for manual inspection on desktop & mobile) */}
      <div className="mt-3 pt-2.5 border-t border-slate-900/[0.05] dark:border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className="flex items-center gap-1.5 flex-wrap">
          {[1, 2, 3, 4].map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onSelectStep && onSelectStep(s)}
              className={`min-h-[36px] px-2.5 py-1 rounded-xl font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeStep === s
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white/60 dark:bg-white/[0.07] text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-white/[0.12]'
              }`}
            >
              {s === 1 && (isUrdu ? '1. ابتدائی' : '1. Opening')}
              {s === 2 && (isUrdu ? '2. + وصولی' : '2. + Collected')}
              {s === 3 && (isUrdu ? '3. − اخراجات' : '3. − Spent')}
              {s === 4 && (isUrdu ? '4. = اختتامی' : '4. = Closing')}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.span
            key={activeStep}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.2 }}
            className={`inline-flex items-center gap-1 font-mono font-bold whitespace-nowrap ${
              isImproved
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {isImproved ? (
              <>
                <ArrowUpRight size={13} />
                <span>
                  {isUrdu ? 'بہتری:' : 'Improved by'} {displayCurrency}{' '}
                  {new Intl.NumberFormat('en-PK').format(Math.abs(closingBalance - openingBalance))}
                </span>
              </>
            ) : (
              <>
                <Sparkles size={13} />
                <span>
                  {isUrdu ? 'ماہانہ تبدیلی:' : 'Net change:'}{' '}
                  {closingBalance - openingBalance >= 0 ? '+' : '−'}
                  {displayCurrency}{' '}
                  {new Intl.NumberFormat('en-PK').format(Math.abs(closingBalance - openingBalance))}
                </span>
              </>
            )}
          </motion.span>
        </AnimatePresence>
      </div>
    </GlassCard>
  )
}

export default EquationPlayer

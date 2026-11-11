import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { formatNumberPKR } from '../../utils/formatters'
import { translateMonth } from '../../utils/translations'

/**
 * EquationLine: Live interactive arithmetic line directly beneath the Math Player:
 * e.g. "297,425 + 20,100 − 34,311 − 9,850 = 273,364" (all computed from real data).
 * Highlights whichever term phase is currently executing.
 */
export const EquationLine = ({
  priorMonth = '',
  currentMonth = '',
  totalPrior = 0,
  increasesSum = 0,
  reductionsSum = 0, // signed negative
  otherDiff = 0,
  otherCount = 0,
  totalCurrent = 0,
  activePhase = 'settled', // 'start' | 'increase' | 'reduction' | 'other' | 'settled'
  isUrdu = false,
  onSelectPhase,
}) => {
  const shouldReduceMotion = useReducedMotion()
  const priorShort = (priorMonth || 'Prev').split(' ')[0]
  const currentShort = (currentMonth || 'Curr').split(' ')[0]
  const priorLabel = isUrdu ? translateMonth(priorShort, 'ur') : priorShort.slice(0, 3)
  const currLabel = isUrdu ? translateMonth(currentShort, 'ur') : currentShort.slice(0, 3)

  const terms = [
    {
      phase: 'start',
      operator: null,
      label: isUrdu ? `${priorLabel} کل` : `${priorLabel} total`,
      value: Math.round(totalPrior),
      absText: formatNumberPKR(totalPrior),
      tone: 'indigo',
    },
    ...(increasesSum !== 0
      ? [
          {
            phase: 'increase',
            operator: '+',
            label: isUrdu ? 'اہم اضافہ' : 'Top increases',
            value: increasesSum,
            absText: formatNumberPKR(increasesSum),
            tone: 'rose',
          },
        ]
      : []),
    ...(reductionsSum !== 0
      ? [
          {
            phase: 'reduction',
            operator: '−',
            label: isUrdu ? 'اہم کمی' : 'Top reductions',
            value: reductionsSum,
            absText: formatNumberPKR(reductionsSum),
            tone: 'emerald',
          },
        ]
      : []),
    ...(otherDiff !== 0 || otherCount > 0
      ? [
          {
            phase: 'other',
            operator: otherDiff >= 0 ? '+' : '−',
            label: isUrdu ? `دیگر (${otherCount})` : `Other (${otherCount})`,
            value: otherDiff,
            absText: formatNumberPKR(otherDiff),
            tone: 'slate',
          },
        ]
      : []),
    {
      phase: 'settled',
      operator: '=',
      label: isUrdu ? `${currLabel} کل` : `${currLabel} total`,
      value: Math.round(totalCurrent),
      absText: formatNumberPKR(totalCurrent),
      tone: totalCurrent < totalPrior ? 'emerald' : 'rose',
    },
  ]

  const getTermClass = (phaseKey, tone) => {
    const isActive = activePhase === phaseKey
    if (isActive) {
      if (tone === 'rose') {
        return 'bg-rose-100 dark:bg-rose-950/75 border-rose-400 text-rose-900 dark:text-rose-100 ring-2 ring-rose-400/45 shadow-sm scale-[1.03]'
      }
      if (tone === 'emerald') {
        return 'bg-emerald-100 dark:bg-emerald-950/75 border-emerald-400 text-emerald-950 dark:text-emerald-100 ring-2 ring-emerald-400/45 shadow-sm scale-[1.03]'
      }
      if (tone === 'slate') {
        return 'bg-slate-200 dark:bg-slate-800 border-slate-400 text-slate-900 dark:text-white ring-2 ring-slate-400/45 shadow-sm scale-[1.03]'
      }
      return 'bg-indigo-100 dark:bg-indigo-950/75 border-indigo-400 text-indigo-950 dark:text-indigo-100 ring-2 ring-indigo-400/45 shadow-sm scale-[1.03]'
    }
    return 'bg-white/75 dark:bg-white/[0.06] border-slate-200/80 dark:border-white/12 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-white/[0.12]'
  }

  return (
    <div
      dir="ltr"
      style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
      className="pt-3 border-t border-slate-900/[0.06] dark:border-white/[0.08] flex flex-wrap items-center justify-center sm:justify-start gap-1.5 sm:gap-2"
    >
      {terms.map((term, idx) => (
        <React.Fragment key={`${term.phase}-${idx}`}>
          {term.operator && (
            <span
              className={`inline-flex items-center justify-center size-6 rounded-full text-xs font-black font-numeric shrink-0 ${
                term.operator === '+'
                  ? 'bg-rose-500/15 text-rose-800 dark:text-rose-300'
                  : term.operator === '−'
                  ? 'bg-emerald-500/15 text-emerald-800 dark:text-emerald-300'
                  : 'bg-indigo-500/15 text-indigo-800 dark:text-indigo-200'
              }`}
            >
              {term.operator}
            </span>
          )}

          <motion.button
            type="button"
            onClick={() => onSelectPhase && onSelectPhase(term.phase)}
            whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
            className={`min-h-[44px] sm:min-h-[40px] px-2.5 py-1 rounded-xl border transition-all duration-200 text-start cursor-pointer flex flex-col justify-center ${getTermClass(
              term.phase,
              term.tone
            )}`}
          >
            <span
              dir={isUrdu ? 'rtl' : 'ltr'}
              className="text-[9px] font-bold uppercase tracking-wider opacity-75 leading-none whitespace-nowrap"
            >
              {term.label}
            </span>
            <span className="text-xs sm:text-sm font-black font-numeric tabular-nums leading-tight mt-0.5 whitespace-nowrap">
              {term.absText}
            </span>
          </motion.button>
        </React.Fragment>
      ))}
    </div>
  )
}

export default EquationLine

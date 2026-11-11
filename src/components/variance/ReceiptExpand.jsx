import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { ArrowDownRight, ArrowUpRight, ArrowRight, Sparkles, Repeat, Ban } from 'lucide-react'
import { formatNumberPKR, formatPercent } from '../../utils/formatters'
import { translateCategory, translateMonth } from '../../utils/translations'

/**
 * ReceiptExpand: Inline expandable mini-receipt inside a VarianceItemCard.
 * Shows Previous -> Current -> Difference + two baseline-scaled comparison bars
 * (using transform scaleX for 60fps) + plain-language explanation.
 */
export const ReceiptExpand = ({
  item,
  priorMonth = '',
  currentMonth = '',
  displayCurrency = 'PKR',
  isUrdu = false,
}) => {
  const shouldReduceMotion = useReducedMotion()

  const prevVal = Number(item?.prev || 0)
  const currVal = Number(item?.curr || 0)
  const diffVal = Number(item?.diff || 0)
  const isIncrease = diffVal > 0
  const maxVal = Math.max(prevVal, currVal, 1)

  const prevRatio = prevVal > 0 ? Math.max(0.08, prevVal / maxVal) : 0.02
  const currRatio = currVal > 0 ? Math.max(0.08, currVal / maxVal) : 0.02

  const priorFull = (priorMonth || 'Previous').split(' ')[0]
  const currentFull = (currentMonth || 'Current').split(' ')[0]
  const priorLabel = isUrdu ? translateMonth(priorFull, 'ur') : priorFull
  const currLabel = isUrdu ? translateMonth(currentFull, 'ur') : currentFull
  const priorColLabel = isUrdu ? priorLabel : priorFull.slice(0, 3)
  const currColLabel = isUrdu ? currLabel : currentFull.slice(0, 3)

  // Plain-language sentence
  let plainLine = ''
  if (item.isNew) {
    plainLine = isUrdu
      ? `${priorLabel} میں شامل نہیں تھا — اس ماہ نیا خرچ درج ہوا`
      : `New this month, did not exist in ${priorLabel}`
  } else if (item.isEliminated) {
    if (item.statusTag === 'Shifted') {
      plainLine = item.movedToCategory
        ? isUrdu
          ? `باقاعدہ ماہانہ فہرست سے ${translateCategory(item.movedToCategory, 'ur')} میں منتقل (${displayCurrency} ${formatNumberPKR(prevVal)} ${priorLabel} میں تھا)`
          : `Shifted out of monthly operating spend to ${item.movedToCategory} (was ${displayCurrency} ${formatNumberPKR(prevVal)} in ${priorLabel})`
        : isUrdu
        ? `مخصوص / یک بار کا خرچ منتقل ہوا — ${priorLabel} میں ${displayCurrency} ${formatNumberPKR(prevVal)} تھا`
        : `Shifted / non-recurring capital item (was ${displayCurrency} ${formatNumberPKR(prevVal)} in ${priorLabel})`
    } else {
      plainLine = isUrdu
        ? `اس ماہ یہ خرچ ختم رہا — ${priorLabel} میں ${displayCurrency} ${formatNumberPKR(prevVal)} تھا`
        : `Removed this month — spent ${displayCurrency} ${formatNumberPKR(prevVal)} in ${priorLabel}`
    }
  } else if (isIncrease) {
    plainLine = isUrdu
      ? `${priorLabel} کے مقابلے میں ${displayCurrency} ${formatNumberPKR(diffVal)} زیادہ خرچ ہوئے`
      : `Spent ${displayCurrency} ${formatNumberPKR(diffVal)} more than ${priorLabel}`
  } else {
    plainLine = isUrdu
      ? `${priorLabel} کے مقابلے میں ${displayCurrency} ${formatNumberPKR(diffVal)} کم خرچ ہوئے`
      : `Spent ${displayCurrency} ${formatNumberPKR(diffVal)} less than ${priorLabel}`
  }

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
      transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
      className="overflow-hidden"
    >
      <div style={{ perspective: 1000 }} className="pt-2.5">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, rotateX: -22 }}
          animate={{ opacity: 1, rotateX: 0 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, rotateX: -18 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: 'top center', willChange: 'transform, opacity' }}
          onClick={(e) => e.stopPropagation()}
          className="rounded-2xl p-3 sm:p-3.5 bg-white/85 dark:bg-slate-900/85 border border-slate-200/85 dark:border-white/15 shadow-sm space-y-2.5 text-start"
        >
          {/* Plain-language single sentence */}
          <div
            className={`px-2.5 py-2 rounded-xl border text-xs font-bold flex items-center gap-2 ${
              item.isNew
                ? 'bg-indigo-50/90 dark:bg-indigo-950/50 border-indigo-200 dark:border-indigo-700/50 text-indigo-900 dark:text-indigo-200'
                : item.isEliminated
                ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200 dark:border-amber-700/50 text-amber-900 dark:text-amber-200'
                : isIncrease
                ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200 dark:border-rose-700/50 text-rose-900 dark:text-rose-200'
                : 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-700/50 text-emerald-900 dark:text-emerald-200'
            }`}
          >
            {item.isNew ? (
              <Sparkles size={14} className="shrink-0 text-indigo-600 dark:text-indigo-300" />
            ) : item.isEliminated ? (
              item.statusTag === 'Shifted' ? (
                <Repeat size={14} className="shrink-0 text-amber-700 dark:text-amber-300" />
              ) : (
                <Ban size={14} className="shrink-0 text-slate-600 dark:text-slate-300" />
              )
            ) : isIncrease ? (
              <ArrowUpRight size={14} className="shrink-0 text-rose-700 dark:text-rose-300" />
            ) : (
              <ArrowDownRight size={14} className="shrink-0 text-emerald-700 dark:text-emerald-300" />
            )}
            <span className="leading-snug">{plainLine}</span>
          </div>

          {/* Previous -> Current -> Difference breakdown (responsive: 2 cols + full Diff below on mobile; crisp 3 cols on sm+) */}
          <div className="rounded-xl bg-slate-50/90 dark:bg-slate-950/70 border border-slate-200/70 dark:border-white/10 divide-y sm:divide-y-0 sm:grid sm:grid-cols-3 sm:divide-x divide-slate-200/80 dark:divide-white/10 overflow-hidden">
            {/* Previous */}
            <div className="px-2.5 py-2 flex sm:flex-col items-center sm:justify-center justify-between gap-1 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {priorColLabel}
              </span>
              <span
                dir="ltr"
                style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                className="text-xs font-extrabold text-slate-800 dark:text-slate-200 font-numeric tabular-nums inline-flex items-center gap-0.5 whitespace-nowrap"
              >
                <span dir={isUrdu ? 'rtl' : 'ltr'}>{displayCurrency}</span>
                <span>{prevVal > 0 ? formatNumberPKR(prevVal) : '0'}</span>
              </span>
            </div>

            {/* Current */}
            <div className="px-2.5 py-2 flex sm:flex-col items-center sm:justify-center justify-between gap-1 text-center">
              <span className="text-[10px] font-bold uppercase tracking-wide text-indigo-700 dark:text-indigo-300 whitespace-nowrap">
                {currColLabel}
              </span>
              <span
                dir="ltr"
                style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                className="text-xs font-black text-slate-900 dark:text-white font-numeric tabular-nums inline-flex items-center gap-0.5 whitespace-nowrap"
              >
                <span dir={isUrdu ? 'rtl' : 'ltr'}>{displayCurrency}</span>
                <span>{currVal > 0 ? formatNumberPKR(currVal) : '0'}</span>
              </span>
            </div>

            {/* Difference */}
            <div className="px-2.5 py-2 flex sm:flex-col items-center sm:justify-center justify-between gap-1 text-center bg-white/50 dark:bg-white/[0.02]">
              <span className="text-[10px] font-bold uppercase tracking-wide text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {isUrdu ? 'فرق' : 'Diff'}
              </span>
              <div
                dir="ltr"
                style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                className={`text-xs font-black font-numeric tabular-nums inline-flex items-center flex-wrap justify-center gap-1 whitespace-nowrap ${
                  isIncrease
                    ? 'text-rose-700 dark:text-rose-300'
                    : 'text-emerald-700 dark:text-emerald-300'
                }`}
              >
                <span className="inline-flex items-center gap-0.5">
                  <span>{isIncrease ? '+' : '−'}</span>
                  <span dir={isUrdu ? 'rtl' : 'ltr'}>{displayCurrency}</span>
                  <span>{formatNumberPKR(diffVal)}</span>
                </span>
                {item.pct !== null && item.pct !== undefined && (
                  <span
                    dir="ltr"
                    style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                    className="text-[11px] opacity-90"
                  >
                    ({isIncrease ? '+' : '−'}
                    {formatPercent(item.pct)}%)
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Two baseline comparison bars growing via GPU scaleX */}
          <div className="space-y-1.5 pt-0.5">
            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-16 sm:w-20 text-slate-600 dark:text-slate-300 font-semibold truncate shrink-0">
                {priorLabel}
              </span>
              <div className="flex-1 h-2 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                <motion.div
                  initial={shouldReduceMotion ? { scaleX: prevRatio } : { scaleX: 0 }}
                  animate={{ scaleX: prevRatio }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    transformOrigin: isUrdu ? 'right center' : 'left center',
                    willChange: 'transform',
                  }}
                  className="h-full w-full rounded-full bg-slate-400 dark:bg-slate-500"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 text-[11px]">
              <span className="w-16 sm:w-20 text-slate-900 dark:text-slate-100 font-bold truncate shrink-0">
                {currLabel}
              </span>
              <div className="flex-1 h-2 rounded-full bg-slate-200/80 dark:bg-slate-800 overflow-hidden">
                <motion.div
                  initial={shouldReduceMotion ? { scaleX: currRatio } : { scaleX: 0 }}
                  animate={{ scaleX: currRatio }}
                  transition={{ duration: 0.52, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
                  style={{
                    transformOrigin: isUrdu ? 'right center' : 'left center',
                    willChange: 'transform',
                  }}
                  className={`h-full w-full rounded-full ${
                    item.isEliminated
                      ? 'bg-amber-400/70 dark:bg-amber-500/60'
                      : isIncrease
                      ? 'bg-rose-500 dark:bg-rose-400'
                      : 'bg-emerald-500 dark:bg-emerald-400'
                  }`}
                />
              </div>
            </div>
          </div>

          {item.movedToCategory && (
            <div className="flex items-center gap-1 text-[11px] font-bold text-amber-800 dark:text-amber-200 pt-0.5">
              <ArrowRight size={12} className="shrink-0" />
              <span>
                {isUrdu
                  ? `منتقل شد: ${translateCategory(item.movedToCategory, 'ur')}`
                  : `moved to ${item.movedToCategory}`}
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </motion.div>
  )
}

export default ReceiptExpand

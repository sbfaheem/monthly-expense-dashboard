import React, { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Sparkles, Info } from 'lucide-react'
import { computeMonthlyVariance } from '../utils/variance'
import { useLanguage } from '../context/LanguageContext'
import { translateItemName, translateMonth } from '../utils/translations'

export default function MonthlyVarianceBanner({ selectedMonth, allExpenses = [], currency = 'PKR' }) {
  const { lang, t } = useLanguage()
  const isUrdu = lang === 'ur'
  const displayCurrency = isUrdu ? 'روپے' : currency
  const shouldReduceMotion = useReducedMotion()

  const variance = useMemo(() => {
    return computeMonthlyVariance(selectedMonth, allExpenses, currency)
  }, [selectedMonth, allExpenses, currency])

  if (!variance) return null

  const fmt = (n) => Number(Math.abs(n || 0)).toLocaleString('en-PK')

  if (!variance.hasPriorData) {
    return (
      <motion.div
        initial={shouldReduceMotion ? false : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-slate-850 dark:to-slate-800 border border-blue-100 dark:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-sm flex items-center gap-4"
      >
        <div className="size-11 sm:size-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
          <Info size={22} />
        </div>
        <div>
          <h4 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">
            {isUrdu ? `ابتدائی مالیاتی ریکارڈ: ${translateMonth(selectedMonth, 'ur')}` : `Initial Financial Record: ${selectedMonth}`}
          </h4>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            {isUrdu ? 'یہ ابتدائی ریکارڈ ہے۔ اگلے مہینوں کا تقابلی جائزہ خودکار طور پر ظاہر ہوگا۔' : 'This is the starting ledger cycle. Month-over-month variance analytics will compare subsequent months automatically.'}
          </p>
        </div>
      </motion.div>
    )
  }

  const isTotalIncrease = variance.totalDiff > 0
  const isNeutral = variance.totalDiff === 0

  return (
    <motion.div
      initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 220 }}
      className="relative overflow-hidden rounded-3xl backdrop-blur-xl bg-white/90 dark:bg-slate-850/90 border border-slate-200/90 dark:border-slate-700 p-5 sm:p-7 shadow-lg shadow-slate-200/50 dark:shadow-none space-y-5"
    >
      {/* Decorative subtle background gradient blob */}
      <div className="absolute -top-12 -right-12 size-56 rounded-full bg-gradient-to-br from-primary/10 to-indigo-500/10 blur-2xl pointer-events-none" />

      {/* Banner Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={shouldReduceMotion ? {} : { rotate: 12, scale: 1.08 }}
            transition={{ type: 'spring', damping: 15, stiffness: 280 }}
            className="size-11 sm:size-12 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 text-white flex items-center justify-center shadow-md shadow-primary/30 flex-shrink-0"
          >
            <Sparkles size={22} />
          </motion.div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {isUrdu ? 'اس ماہ کیا تبدیل ہوا؟' : 'What Changed This Month?'}
              </h3>
              <motion.span
                whileHover={shouldReduceMotion ? {} : { scale: 1.04 }}
                className="text-xs sm:text-sm font-extrabold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 shadow-2xs"
              >
                {isUrdu ? `بمقابلہ ${translateMonth(variance.priorMonth, 'ur')}` : `vs. ${variance.priorMonth}`}
              </motion.span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
              {isUrdu ? 'ماہانہ اخراجات کے فرق اور اہم عوامل کا خودکار جائزہ' : 'Automated month-over-month expense variance analysis & top drivers'}
            </p>
          </div>
        </div>

        {/* Total Net Expense Change Floating Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <motion.div
            whileHover={shouldReduceMotion ? {} : { scale: 1.03, y: -2 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.98 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl border-2 flex items-center gap-2 text-xs sm:text-sm md:text-base font-black shadow-xs cursor-default ${
              isNeutral
                ? 'bg-slate-50 dark:bg-slate-800 text-slate-700 border-slate-200'
                : isTotalIncrease
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700/60'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700/60'
            }`}
          >
            {isTotalIncrease ? (
              <ArrowUpRight size={18} className="text-amber-600 dark:text-amber-400 stroke-[3]" />
            ) : (
              <ArrowDownRight size={18} className="text-emerald-600 dark:text-emerald-400 stroke-[3]" />
            )}
            <span>
              {isTotalIncrease ? (isUrdu ? 'کل اضافہ' : 'Total Increase') : (isUrdu ? 'کل بچت / کمی' : 'Total Reduction')}:{' '}
              <span dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }} className="inline-block font-mono">
                {isTotalIncrease ? '+' : '-'}{displayCurrency} {fmt(variance.totalDiff)}
              </span>
              {variance.totalPct ? (
                <span dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }} className="inline-block font-mono ml-1">
                  ({isTotalIncrease ? '+' : ''}{variance.totalPct}%)
                </span>
              ) : ''}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Variance Drivers Grid: Top Increases vs Top Reductions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 relative z-10">
        {/* Top Increases Section */}
        <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <TrendingUp size={16} className="text-rose-600 stroke-[2.5]" />
              {isUrdu ? 'سب سے زیادہ اضافہ' : 'Largest Increases'}
            </span>
            <span className="text-xs font-black text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/50 px-2.5 py-0.5 rounded-full">
              {variance.increases.length} {isUrdu ? 'شعبے' : 'items'}
            </span>
          </div>

          {variance.increases.length === 0 ? (
            <p className="text-sm font-bold text-slate-400 py-3 text-center italic">{isUrdu ? 'کوئی اضافہ درج نہیں ہوا۔' : 'No expense increases recorded.'}</p>
          ) : (
            <div className="space-y-2.5">
              {variance.increases.map((item, idx) => (
                <motion.div
                  key={idx}
                  whileHover={shouldReduceMotion ? {} : { x: isUrdu ? -4 : 4 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-rose-100 dark:border-slate-700 shadow-xs"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate leading-tight">
                      {isUrdu ? translateItemName(item.name, 'ur') : item.name}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {item.isNew 
                        ? (isUrdu ? 'اس ماہ کا نیا خرچ' : 'New expense item this month') 
                        : (isUrdu 
                            ? <span>گزشتہ ماہ ({translateMonth(variance.priorMonth.split(' ')[0], 'ur')}) میں <span dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }} className="inline-block font-mono font-bold text-slate-700 dark:text-slate-300">{displayCurrency} {fmt(item.prev)}</span> تھا</span> 
                            : `Was ${currency} ${fmt(item.prev)} in ${variance.priorMonth.split(' ')[0]}`)}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                    <span className="text-sm sm:text-base md:text-lg font-black text-rose-600 dark:text-rose-400 block leading-tight font-mono">
                      +{displayCurrency} {fmt(item.diff)}
                    </span>
                    {item.pct && (
                      <span className="text-xs sm:text-sm font-black text-rose-500 dark:text-rose-400/90 block mt-0.5 font-mono">
                        +{Math.abs(Number(item.pct))}%
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Top Reductions / Cost Savings Section */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <TrendingDown size={16} className="text-emerald-600 stroke-[2.5]" />
              {isUrdu ? 'سب سے زیادہ بچت اور کمی' : 'Largest Reductions & Savings'}
            </span>
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-0.5 rounded-full">
              {variance.reductions.length} {isUrdu ? 'شعبے' : 'items'}
            </span>
          </div>

          {variance.reductions.length === 0 ? (
            <p className="text-sm font-bold text-slate-400 py-3 text-center italic">{isUrdu ? 'کوئی کمی درج نہیں ہوئی۔' : 'No expense reductions recorded.'}</p>
          ) : (
            <div className="space-y-2.5">
              {variance.reductions.map((item, idx) => (
                <motion.div
                  key={idx}
                  whileHover={shouldReduceMotion ? {} : { x: isUrdu ? -4 : 4 }}
                  transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 shadow-xs"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate leading-tight">
                      {isUrdu ? translateItemName(item.name, 'ur') : item.name}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {isUrdu 
                        ? <span>گزشتہ ماہ ({translateMonth(variance.priorMonth.split(' ')[0], 'ur')}) میں <span dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }} className="inline-block font-mono font-bold text-slate-700 dark:text-slate-300">{displayCurrency} {fmt(item.prev)}</span> تھا</span> 
                        : `Was ${currency} ${fmt(item.prev)} in ${variance.priorMonth.split(' ')[0]}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                    <span className="text-sm sm:text-base md:text-lg font-black text-emerald-600 dark:text-emerald-400 block leading-tight font-mono">
                      -{displayCurrency} {fmt(item.diff)}
                    </span>
                    {item.pct && (
                      <span className="text-xs sm:text-sm font-black text-emerald-500 dark:text-emerald-400/90 block mt-0.5 font-mono">
                        -{Math.abs(Number(item.pct))}%
                      </span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}

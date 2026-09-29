import { useMemo } from 'react'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Sparkles, Info } from 'lucide-react'
import { computeMonthlyVariance } from '../utils/variance'

export default function MonthlyVarianceBanner({ selectedMonth, allExpenses = [], currency = 'PKR' }) {
  const variance = useMemo(() => {
    return computeMonthlyVariance(selectedMonth, allExpenses, currency)
  }, [selectedMonth, allExpenses, currency])

  if (!variance) return null

  const fmt = (n) => Number(Math.abs(n || 0)).toLocaleString('en-PK')

  if (!variance.hasPriorData) {
    return (
      <div className="bg-gradient-to-r from-blue-50/90 to-indigo-50/90 dark:from-slate-850 dark:to-slate-800 border border-blue-100 dark:border-slate-700 rounded-3xl p-5 sm:p-6 shadow-sm flex items-center gap-4">
        <div className="size-11 sm:size-12 rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
          <Info size={22} />
        </div>
        <div>
          <h4 className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100">
            Initial Financial Record: {selectedMonth}
          </h4>
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            This is the starting ledger cycle. Month-over-month variance analytics will compare subsequent months automatically.
          </p>
        </div>
      </div>
    )
  }

  const isTotalIncrease = variance.totalDiff > 0
  const isNeutral = variance.totalDiff === 0

  return (
    <div className="relative overflow-hidden rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/90 dark:border-slate-700 p-5 sm:p-7 shadow-lg shadow-slate-200/50 dark:shadow-none space-y-5">
      {/* Decorative subtle background gradient blob */}
      <div className="absolute -top-12 -right-12 size-56 rounded-full bg-gradient-to-br from-primary/10 to-indigo-500/10 blur-2xl pointer-events-none" />

      {/* Banner Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10 border-b border-slate-100 dark:border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="size-11 sm:size-12 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 text-white flex items-center justify-center shadow-md shadow-primary/30 flex-shrink-0">
            <Sparkles size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h3 className="text-base sm:text-xl md:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                What Changed This Month?
              </h3>
              <span className="text-xs sm:text-sm font-extrabold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200/90 dark:border-slate-700 shadow-2xs">
                vs. {variance.priorMonth}
              </span>
            </div>
            <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1">
              Automated month-over-month expense variance analysis &amp; top drivers
            </p>
          </div>
        </div>

        {/* Total Net Expense Change Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl border-2 flex items-center gap-2 text-xs sm:text-sm md:text-base font-black shadow-xs ${
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
              Total {isTotalIncrease ? 'Increase' : 'Reduction'}: {isTotalIncrease ? '+' : '-'}{currency} {fmt(variance.totalDiff)}
              {variance.totalPct ? ` (${isTotalIncrease ? '+' : ''}${variance.totalPct}%)` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Variance Drivers Grid: Top Increases vs Top Reductions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 relative z-10">
        {/* Top Increases Section */}
        <div className="bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-2">
              <TrendingUp size={16} className="text-rose-600 stroke-[2.5]" />
              Largest Increases
            </span>
            <span className="text-xs font-black text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-900/50 px-2.5 py-0.5 rounded-full">
              {variance.increases.length} items
            </span>
          </div>

          {variance.increases.length === 0 ? (
            <p className="text-sm font-bold text-slate-400 py-3 text-center italic">No expense increases recorded.</p>
          ) : (
            <div className="space-y-2.5">
              {variance.increases.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-rose-100 dark:border-slate-700 shadow-xs"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate leading-tight">
                      {item.name}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {item.isNew ? 'New expense item this month' : `Was ${currency} ${fmt(item.prev)} in ${variance.priorMonth.split(' ')[0]}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm sm:text-base md:text-lg font-black text-rose-600 dark:text-rose-400 block leading-tight">
                      +{currency} {fmt(item.diff)}
                    </span>
                    {item.pct && (
                      <span className="text-xs sm:text-sm font-black text-rose-500 dark:text-rose-400/90 block mt-0.5">
                        +{item.pct}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Reductions / Cost Savings Section */}
        <div className="bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-900/40 rounded-3xl p-4 sm:p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
              <TrendingDown size={16} className="text-emerald-600 stroke-[2.5]" />
              Largest Reductions &amp; Savings
            </span>
            <span className="text-xs font-black text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/50 px-2.5 py-0.5 rounded-full">
              {variance.reductions.length} items
            </span>
          </div>

          {variance.reductions.length === 0 ? (
            <p className="text-sm font-bold text-slate-400 py-3 text-center italic">No expense reductions recorded.</p>
          ) : (
            <div className="space-y-2.5">
              {variance.reductions.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 sm:p-4 rounded-2xl bg-white dark:bg-slate-800 border border-emerald-100 dark:border-slate-700 shadow-xs"
                >
                  <div className="min-w-0 pr-3">
                    <p className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 truncate leading-tight">
                      {item.name}
                    </p>
                    <p className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-slate-400 mt-1 truncate">
                      {item.isEliminated ? `Completed (${currency} ${fmt(item.prev)} saved)` : `Reduced from ${currency} ${fmt(item.prev)}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-sm sm:text-base md:text-lg font-black text-emerald-600 dark:text-emerald-400 block leading-tight">
                      -{currency} {fmt(item.diff)}
                    </span>
                    {item.pct && (
                      <span className="text-xs sm:text-sm font-black text-emerald-600 dark:text-emerald-400/90 block mt-0.5">
                        {item.pct}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

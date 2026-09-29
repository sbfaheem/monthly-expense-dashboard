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
      <div className="bg-gradient-to-r from-blue-50/80 to-indigo-50/80 dark:from-slate-850 dark:to-slate-800 border border-blue-100/80 dark:border-slate-750 rounded-2xl sm:rounded-3xl p-4 sm:p-5 shadow-sm flex items-center gap-3.5">
        <div className="size-9 sm:size-10 rounded-xl sm:rounded-2xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center flex-shrink-0">
          <Info size={18} />
        </div>
        <div className="text-xs">
          <h4 className="font-bold text-slate-800 dark:text-slate-200">
            Initial Financial Record: {selectedMonth}
          </h4>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            This is the starting ledger cycle. Month-over-month variance analytics will compare subsequent months automatically.
          </p>
        </div>
      </div>
    )
  }

  const isTotalIncrease = variance.totalDiff > 0
  const isNeutral = variance.totalDiff === 0

  return (
    <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white dark:bg-slate-850 border border-slate-200/80 dark:border-slate-750 p-4 sm:p-6 shadow-md shadow-slate-200/40 dark:shadow-none space-y-4">
      {/* Decorative subtle background gradient blob */}
      <div className="absolute -top-12 -right-12 size-48 rounded-full bg-gradient-to-br from-primary/10 to-indigo-500/5 blur-2xl pointer-events-none" />

      {/* Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative z-10 border-b border-slate-100 dark:border-slate-800 pb-3.5">
        <div className="flex items-center gap-2.5">
          <div className="size-9 rounded-2xl bg-gradient-to-tr from-primary to-blue-600 text-white flex items-center justify-center shadow-md shadow-primary/20 flex-shrink-0">
            <Sparkles size={18} />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2 flex-wrap">
              <span>What Changed This Month?</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                vs. {variance.priorMonth}
              </span>
            </h3>
            <p className="text-[11px] sm:text-xs text-slate-500 dark:text-slate-400 font-medium">
              Automated month-over-month expense variance analysis &amp; top drivers
            </p>
          </div>
        </div>

        {/* Total Net Expense Change Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div
            className={`px-3 py-1.5 rounded-xl border flex items-center gap-1.5 text-xs font-black ${
              isNeutral
                ? 'bg-slate-50 dark:bg-slate-800 text-slate-600 border-slate-200'
                : isTotalIncrease
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border-amber-200 dark:border-amber-800/50'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/50'
            }`}
          >
            {isTotalIncrease ? (
              <ArrowUpRight size={14} className="text-amber-600 dark:text-amber-400" />
            ) : (
              <ArrowDownRight size={14} className="text-emerald-600 dark:text-emerald-400" />
            )}
            <span>
              Total {isTotalIncrease ? 'Increase' : 'Reduction'}: {isTotalIncrease ? '+' : '-'}{currency} {fmt(variance.totalDiff)}
              {variance.totalPct ? ` (${isTotalIncrease ? '+' : ''}${variance.totalPct}%)` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Variance Drivers Grid: Top Increases vs Top Reductions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 relative z-10">
        {/* Top Increases */}
        <div className="bg-rose-50/40 dark:bg-rose-950/15 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-rose-800 dark:text-rose-300 flex items-center gap-1.5">
              <TrendingUp size={13} className="text-rose-600" />
              Largest Increases
            </span>
            <span className="text-[10px] font-bold text-rose-600/80 bg-rose-100/70 dark:bg-rose-900/40 px-1.5 py-0.5 rounded">
              {variance.increases.length} items
            </span>
          </div>

          {variance.increases.length === 0 ? (
            <p className="text-xs text-slate-400 py-2 text-center italic">No expense increases recorded.</p>
          ) : (
            <div className="space-y-1.5">
              {variance.increases.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/90 border border-rose-100/80 dark:border-slate-750 shadow-2xs text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {item.isNew ? 'New expense item this month' : `Was ${currency} ${fmt(item.prev)} in ${variance.priorMonth.split(' ')[0]}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-black text-rose-600 dark:text-rose-400">
                      +{currency} {fmt(item.diff)}
                    </span>
                    {item.pct && (
                      <span className="block text-[10px] font-bold text-rose-500">
                        +{item.pct}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Reductions / Cost Savings */}
        <div className="bg-emerald-50/40 dark:bg-emerald-950/15 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-3.5 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
              <TrendingDown size={13} className="text-emerald-600" />
              Largest Reductions &amp; Savings
            </span>
            <span className="text-[10px] font-bold text-emerald-600/80 bg-emerald-100/70 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded">
              {variance.reductions.length} items
            </span>
          </div>

          {variance.reductions.length === 0 ? (
            <p className="text-xs text-slate-400 py-2 text-center italic">No expense reductions recorded.</p>
          ) : (
            <div className="space-y-1.5">
              {variance.reductions.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-800/90 border border-emerald-100/80 dark:border-slate-750 shadow-2xs text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <p className="font-bold text-slate-800 dark:text-slate-200 truncate leading-tight">
                      {item.name}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                      {item.isEliminated ? `Completed (${currency} ${fmt(item.prev)} saved)` : `Reduced from ${currency} ${fmt(item.prev)}`}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="font-black text-emerald-600 dark:text-emerald-400">
                      -{currency} {fmt(item.diff)}
                    </span>
                    {item.pct && (
                      <span className="block text-[10px] font-bold text-emerald-600">
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

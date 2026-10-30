import React from 'react'
import { CheckCircle2, AlertCircle, Building2, TrendingUp, ShieldCheck } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function CollectionProgress({
  currentCollection = 282250,
  targetCollection = 320000,
  paidUnits = 78,
  totalUnits = 92,
  currency = 'PKR'
}) {
  const { lang, t, isRtl } = useLanguage()
  const isUrdu = lang === 'ur'
  const displayCurrency = isUrdu ? 'روپے' : currency

  const safeTarget = Number(targetCollection) > 0 ? Number(targetCollection) : 1
  const safeCurrent = Number(currentCollection) || 0
  const percentage = Math.min(100, Math.max(0, Math.round((safeCurrent / safeTarget) * 100)))
  const unpaidUnits = Math.max(0, Number(totalUnits) - Number(paidUnits))
  const remainingAmount = Math.max(0, safeTarget - safeCurrent)

  const fmt = (n) => Number(n || 0).toLocaleString('en-PK')

  return (
    <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-primary/10 shadow-sm space-y-4 transition-all">
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="size-11 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 flex items-center justify-center border border-emerald-200/60 dark:border-emerald-800/50 shadow-xs flex-shrink-0">
            <TrendingUp size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
                {t.collectionProgress || 'Dues Collection Progress'}
              </h3>
              <span className="inline-flex items-center gap-1 text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                <CheckCircle2 size={12} />
                <span>{percentage}%</span>
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
              {isUrdu 
                ? `${t.unitsCollected}: ${paidUnits} از ${totalUnits} مکانات` 
                : `${t.unitsCollected}: ${paidUnits} of ${totalUnits} Units Cleared`}
            </p>
          </div>
        </div>

        {/* Quick Pending Alert Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold ${
            unpaidUnits > 0
              ? 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60'
          }`}>
            <AlertCircle size={14} className={unpaidUnits > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'} />
            <span>
              {t.unpaidUnitsAlert || 'Pending Payments'}: <strong className="font-mono">{unpaidUnits}</strong> {isUrdu ? 'مکانات' : 'Units'}
            </span>
          </div>
        </div>
      </div>

      {/* Progress Bar Container */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs font-bold text-slate-500 dark:text-slate-400">
          <span>{displayCurrency} {fmt(safeCurrent)}</span>
          <span className="font-mono text-emerald-600 dark:text-emerald-400">{percentage}%</span>
          <span>{t.collectionTarget || 'Target'}: {displayCurrency} {fmt(safeTarget)}</span>
        </div>
        <div className="relative w-full h-3.5 bg-slate-100 dark:bg-slate-700/60 rounded-full overflow-hidden p-0.5 border border-slate-200/60 dark:border-slate-700">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-600 rounded-full transition-all duration-700 ease-out shadow-xs"
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* KPI Sub-Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        {/* Metric 1: Received */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
            {t.monthlyCollection || 'Received'}
          </span>
          <p className="font-extrabold text-sm sm:text-base text-emerald-600 dark:text-emerald-400 font-mono">
            {displayCurrency} {fmt(safeCurrent)}
          </p>
        </div>

        {/* Metric 2: Target */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
            {t.collectionTarget || 'Target Collection'}
          </span>
          <p className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 font-mono">
            {displayCurrency} {fmt(safeTarget)}
          </p>
        </div>

        {/* Metric 3: Cleared Units */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
            {t.unitsCollected || 'Units Cleared'}
          </span>
          <p className="font-extrabold text-sm sm:text-base text-slate-800 dark:text-slate-100 font-mono">
            {paidUnits} <span className="text-xs text-slate-400 font-normal">/ {totalUnits}</span>
          </p>
        </div>

        {/* Metric 4: Remaining Balance */}
        <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-0.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 block">
            {isUrdu ? 'بقیہ مطلوبہ رقم' : 'Pending Amount'}
          </span>
          <p className="font-extrabold text-sm sm:text-base text-amber-600 dark:text-amber-400 font-mono">
            {displayCurrency} {fmt(remainingAmount)}
          </p>
        </div>
      </div>
    </div>
  )
}

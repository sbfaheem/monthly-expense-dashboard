import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Calendar,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeftRight
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { translateMonth } from '../utils/translations'
import RollingOdometer from './RollingOdometer'

export const MonthComparison3D = ({
  previousMonth = {
    name: 'August 2026',
    collection: 282250,
    expenses: 306285,
    balance: -4012,
    closingBalance: -4012,
    status: 'Deficit'
  },
  currentMonth = {
    name: 'September 2026',
    collection: 279050,
    expenses: 297425,
    balance: -22387,
    closingBalance: -22387,
    status: 'Deficit'
  },
  currency = 'PKR'
}) => {
  const { lang } = useLanguage ? useLanguage() : { lang: 'en' }
  const isUrdu = lang === 'ur'
  const displayCurrency = isUrdu ? 'روپے' : currency
  const shouldReduceMotion = useReducedMotion()

  // Active focused card on tap (1: prev lifted, 2: curr lifted)
  const [elevatedCard, setElevatedCard] = useState(2)

  // Mobile segmented view: 'split' | 'prev' | 'current'
  const [mobileTab, setMobileTab] = useState('split')

  // Normalized Financial Data
  const prevName = previousMonth?.name || 'August 2026'
  const currName = currentMonth?.name || 'September 2026'

  const prevCollection = Number(previousMonth?.collection ?? 0)
  const currCollection = Number(currentMonth?.collection ?? 0)

  const prevExpenses = Number(previousMonth?.expenses ?? 0)
  const currExpenses = Number(currentMonth?.expenses ?? 0)

  const prevBalance = Number(previousMonth?.closingBalance ?? previousMonth?.balance ?? 0)
  const currBalance = Number(currentMonth?.closingBalance ?? currentMonth?.balance ?? 0)

  const prevNet = Number(previousMonth?.netCashFlow ?? (prevCollection - prevExpenses))
  const currNet = Number(currentMonth?.netCashFlow ?? (currCollection - currExpenses))

  const isPrevSurplus = (previousMonth?.status === 'Surplus') || prevNet >= 0
  const isCurrSurplus = (currentMonth?.status === 'Surplus') || currNet >= 0

  // Delta Computations
  const collectionDiff = currCollection - prevCollection
  const collectionPct = prevCollection > 0
    ? ((collectionDiff / prevCollection) * 100).toFixed(1)
    : '0.0'
  const isCollectionUp = collectionDiff >= 0

  const expenseDiff = currExpenses - prevExpenses
  const expensePct = prevExpenses > 0
    ? ((expenseDiff / prevExpenses) * 100).toFixed(1)
    : '0.0'
  const isExpenseUp = expenseDiff > 0

  const balanceDiff = currBalance - prevBalance
  const absBalanceDiff = Math.abs(balanceDiff).toLocaleString('en-PK')
  const isFavorableVariance = currNet >= prevNet

  return (
    <div className="w-full my-8">
      {/* ─── Header & Top Controls ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 px-1">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-cyan-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 flex-shrink-0">
            <ArrowLeftRight size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {isUrdu ? 'ماہانہ تقابلی جائزہ (3D موازنہ)' : 'Month-over-Month 3D Comparison'}
              </h3>
              <span className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
                {translateMonth(prevName, lang).toUpperCase()} VS {translateMonth(currName, lang).toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              {isUrdu
                ? 'آمدن، اخراجات اور ریزرو فنڈ میں تفصیلی تبدیلیوں کا 3D موازنہ'
                : 'Interactive 3D dual-card perspective comparing collection, burn rate, and reserves'}
            </p>
          </div>
        </div>

        {/* Mobile View Selector */}
        <div className="flex lg:hidden items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-inner self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMobileTab('prev')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              mobileTab === 'prev'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            {translateMonth(prevName, lang).split(' ')[0]}
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('split')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              mobileTab === 'split'
                ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            3D Split
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('current')}
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              mobileTab === 'current'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            {translateMonth(currName, lang).split(' ')[0]}
          </button>
        </div>
      </div>

      {/* ─── 100% RAZOR-SHARP CARD STAGE (ZERO BLUR) ─── */}
      <div className="w-full relative">
        <div className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-5 sm:gap-6">
          
          {/* ================= CARD 1: PREVIOUS CYCLE ================= */}
          <motion.div
            onClick={() => setElevatedCard(1)}
            whileHover={shouldReduceMotion ? {} : { y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-6 sm:p-7 overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-200 ${
              elevatedCard === 1
                ? 'shadow-[0_20px_45px_-10px_rgba(59,130,246,0.18),0_8px_20px_-4px_rgba(0,0,0,0.06)] ring-2 ring-primary/30'
                : 'shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06),0_4px_12px_-2px_rgba(0,0,0,0.04)]'
            } ${mobileTab === 'current' ? 'hidden lg:flex' : 'flex'}`}
            style={{
              transform: 'none',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'optimizeLegibility',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase font-extrabold tracking-wider text-slate-400">
                  {isUrdu ? 'گزشتہ مالیاتی سائیکل' : 'PREVIOUS CYCLE'}
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                  {translateMonth(prevName, lang)}
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Baseline
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                  isPrevSurplus
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}>
                  {isUrdu ? (isPrevSurplus ? 'سرپلس' : 'خسارہ') : (isPrevSurplus ? 'Surplus' : 'Deficit')}
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-3 pt-3.5">
              {/* Collection */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Wallet size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isUrdu ? 'ماہانہ وصولی' : 'Monthly Collection'}
                  </span>
                </div>
                <RollingOdometer
                  value={Math.abs(prevCollection).toLocaleString('en-PK')}
                  prefix={displayCurrency}
                  className="text-sm sm:text-base md:text-lg font-black font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Expenses */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                    <TrendingDown size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isUrdu ? 'کل اخراجات' : 'Total Expenses'}
                  </span>
                </div>
                <RollingOdometer
                  value={Math.abs(prevExpenses).toLocaleString('en-PK')}
                  prefix={displayCurrency}
                  className="text-sm sm:text-base md:text-lg font-black font-mono text-slate-900 dark:text-slate-100"
                />
              </div>

              {/* Closing Balance */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isUrdu ? 'اختتامی بیلنس' : 'Closing Balance'}
                  </span>
                </div>
                <RollingOdometer
                  value={Math.abs(prevBalance).toLocaleString('en-PK')}
                  prefix={prevBalance < 0 ? `-${displayCurrency}` : displayCurrency}
                  className={`text-sm sm:text-base md:text-lg font-black font-mono ${
                    prevBalance >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                />
              </div>
            </div>

            {/* Sub-bar */}
            <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>{isUrdu ? 'مکمل تصدیق شدہ ریکارڈ' : 'Reconciled Audit Record'}</span>
              </span>
              <span className="font-mono text-[11px] text-slate-500 font-bold">100% Settled</span>
            </div>
          </motion.div>

          {/* ================= CENTER PILLAR: FLOATING VARIANCE / DELTA ================= */}
          <div className="hidden lg:flex flex-col items-center justify-center p-4 rounded-3xl bg-[#070b16] border-2 border-cyan-500/40 shadow-xl text-center w-[178px] flex-shrink-0 z-20 self-center relative overflow-hidden">
            {/* Ambient Background Radial Glow */}
            <div className="pointer-events-none absolute -top-10 -left-10 size-32 rounded-full bg-cyan-500/20 blur-2xl" />

            {/* Top Pill Icon */}
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-cyan-400 mb-3">
              <Sparkles size={13} className="text-cyan-400 animate-pulse" />
              <span>Variance / Delta</span>
            </div>

            {/* Collection Shift */}
            <div className="w-full bg-slate-900/90 rounded-2xl p-2.5 mb-2.5 border border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-1">
                {isUrdu ? 'وصولی تبدیلی' : 'Collection'}
              </p>
              <div
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black font-mono ${
                  isCollectionUp
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                    : 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
                }`}
              >
                <span>{isCollectionUp ? '↑ +' : '↓ '}{collectionPct}%</span>
              </div>
            </div>

            {/* Expense Shift */}
            <div className="w-full bg-slate-900/90 rounded-2xl p-2.5 mb-3 border border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-1">
                {isUrdu ? 'اخراجات تبدیلی' : 'Expenses'}
              </p>
              <div
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black font-mono ${
                  !isExpenseUp
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                    : 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
                }`}
              >
                <span>{isExpenseUp ? '↑ +' : '↓ '}{expensePct}%</span>
              </div>
            </div>

            {/* Center Arrow */}
            <div className="size-7 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <ArrowRight size={14} className={isUrdu ? 'rotate-180' : ''} />
            </div>
          </div>

          {/* ================= CARD 2: CURRENT CYCLE ================= */}
          <motion.div
            onClick={() => setElevatedCard(2)}
            whileHover={shouldReduceMotion ? {} : { y: -4 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`relative rounded-3xl border-2 border-indigo-500/50 dark:border-indigo-500/40 bg-gradient-to-b from-indigo-50/40 via-white to-white dark:from-slate-900 dark:via-[#0b1120] dark:to-[#0b1120] p-6 sm:p-7 overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-200 ${
              elevatedCard === 2
                ? 'shadow-[0_25px_50px_-12px_rgba(99,102,241,0.25),0_10px_25px_-5px_rgba(0,0,0,0.08)] ring-2 ring-indigo-500/40'
                : 'shadow-[0_10px_30px_-5px_rgba(0,0,0,0.06),0_4px_12px_-2px_rgba(0,0,0,0.04)]'
            } ${mobileTab === 'prev' ? 'hidden lg:flex' : 'flex'}`}
            style={{
              transform: 'none',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'optimizeLegibility',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-indigo-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase font-extrabold tracking-wider text-indigo-500 dark:text-indigo-400">
                  {isUrdu ? 'موجودہ فعال سائیکل' : 'CURRENT ACTIVE CYCLE'}
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                  {translateMonth(currName, lang)}
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-600 text-white shadow-xs">
                  Live Active
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                  isCurrSurplus
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}>
                  {isUrdu ? (isCurrSurplus ? 'سرپلس' : 'خسارہ') : (isCurrSurplus ? 'Surplus' : 'Deficit')}
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-3 pt-3.5">
              {/* Collection Row */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-indigo-100 dark:border-slate-700/80 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                    <Wallet size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isUrdu ? 'ماہانہ وصولی' : 'Monthly Collection'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <RollingOdometer
                    value={Math.abs(currCollection).toLocaleString('en-PK')}
                    prefix={displayCurrency}
                    className="text-sm sm:text-base md:text-lg font-black font-mono text-slate-900 dark:text-slate-100"
                  />
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                      isCollectionUp
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/40'
                    }`}
                  >
                    {isCollectionUp ? '↑ +' : '↓ '}{collectionPct}%
                  </span>
                </div>
              </div>

              {/* Expenses Row */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-white dark:bg-slate-800/90 border border-indigo-100 dark:border-slate-700/80 shadow-xs">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0">
                    <TrendingDown size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isUrdu ? 'کل اخراجات' : 'Total Expenses'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <RollingOdometer
                    value={Math.abs(currExpenses).toLocaleString('en-PK')}
                    prefix={displayCurrency}
                    className="text-sm sm:text-base md:text-lg font-black font-mono text-slate-900 dark:text-slate-100"
                  />
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded flex items-center gap-0.5 ${
                      !isExpenseUp
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/40'
                    }`}
                  >
                    {isExpenseUp ? '↑ +' : '↓ '}{expensePct}%
                  </span>
                </div>
              </div>

              {/* Closing Balance Row */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/80 border border-indigo-100/70 dark:border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center flex-shrink-0">
                    <Calendar size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isUrdu ? 'اختتامی بیلنس' : 'Closing Balance'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <RollingOdometer
                    value={Math.abs(currBalance).toLocaleString('en-PK')}
                    prefix={currBalance < 0 ? `-${displayCurrency}` : displayCurrency}
                    className={`text-sm sm:text-base md:text-lg font-black font-mono ${
                      currBalance >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  />
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      balanceDiff >= 0
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                    }`}
                  >
                    {balanceDiff >= 0 ? `+${displayCurrency}` : `-${displayCurrency}`} {absBalanceDiff}
                  </span>
                </div>
              </div>
            </div>

            {/* Sub-bar */}
            <div className="mt-5 pt-3.5 border-t border-indigo-500/20 flex items-center justify-between text-xs font-medium">
              <span className="text-slate-400">{isUrdu ? 'ماہانہ خالص تبدیلی:' : 'Net MoM Variance:'}</span>
              <span
                className={`font-black font-mono flex items-center gap-1.5 ${
                  isFavorableVariance ? 'text-emerald-500' : 'text-amber-500'
                }`}
              >
                {isFavorableVariance ? (
                  <>
                    <TrendingUp size={14} />
                    <span>{isUrdu ? 'بہتر کیش فلو ریکوری' : 'Favorable Inflow Recovery'}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown size={14} />
                    <span>{isUrdu ? 'اضافی خسارہ' : 'Higher Deficit Gap'}</span>
                  </>
                )}
              </span>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default MonthComparison3D

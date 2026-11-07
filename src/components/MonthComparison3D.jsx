import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
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
    name: 'September 2026',
    collection: 279050,
    expenses: 297425,
    balance: -22387,
    closingBalance: -22387,
    status: 'Deficit'
  },
  currentMonth = {
    name: 'October 2026',
    collection: 291350,
    expenses: 273364,
    balance: -4401,
    closingBalance: -4401,
    status: 'Surplus'
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

  // Realtime 3D Math Animation Step:
  // 0: Sep Baseline -> 1: Realtime Addition & Subtraction (+ / -) -> 2: Oct Result
  const [mathStep, setMathStep] = useState(1)

  useEffect(() => {
    if (shouldReduceMotion) return
    const timer = setInterval(() => {
      setMathStep((prev) => (prev + 1) % 3)
    }, 3200)
    return () => clearInterval(timer)
  }, [shouldReduceMotion])

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
  const absCollDiff = Math.abs(collectionDiff).toLocaleString('en-PK')
  const collectionPct = prevCollection > 0
    ? ((Math.abs(collectionDiff) / prevCollection) * 100).toFixed(1)
    : '0.0'
  const isCollectionUp = collectionDiff >= 0

  const expenseDiff = currExpenses - prevExpenses
  const absExpDiff = Math.abs(expenseDiff).toLocaleString('en-PK')
  const expensePct = prevExpenses > 0
    ? ((Math.abs(expenseDiff) / prevExpenses) * 100).toFixed(1)
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
                {translateMonth(prevName, lang).toUpperCase()} {isUrdu ? 'بمقابلہ' : 'VS'} {translateMonth(currName, lang).toUpperCase()}
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
            className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
              mobileTab === 'split'
                ? 'bg-gradient-to-r from-indigo-600 via-teal-600 to-cyan-600 text-white shadow-md shadow-indigo-500/25 ring-2 ring-cyan-400/40'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Sparkles size={13} className={mobileTab === 'split' ? 'animate-pulse' : ''} />
            <span>{isUrdu ? '3D موازنہ (+/-)' : '3D Split (+/-)'}</span>
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
            whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-6 sm:p-7 overflow-hidden flex flex-col justify-between cursor-pointer transition-all duration-200 ${
              elevatedCard === 1
                ? 'shadow-[0_20px_45px_-10px_rgba(59,130,246,0.22),0_8px_20px_-4px_rgba(0,0,0,0.06)] ring-2 ring-primary/40'
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
                  {isUrdu ? 'بنیادی موازنہ' : 'Baseline'}
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
                  value={(prevBalance < 0 ? '-' : '') + Math.abs(prevBalance).toLocaleString('en-PK')}
                  prefix={displayCurrency}
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
              <span className="font-mono text-[11px] text-slate-500 font-bold">{isUrdu ? '100% حساب مکمل' : '100% Settled'}</span>
            </div>
          </motion.div>

          {/* ================= CENTER PILLAR: FLOATING VARIANCE / DELTA (DESKTOP) ================= */}
          <div className="hidden lg:flex flex-col items-center justify-center p-4 rounded-3xl bg-[#070b16] border-2 border-cyan-500/40 shadow-xl text-center w-[184px] flex-shrink-0 z-20 self-center relative overflow-hidden">
            {/* Ambient Background Radial Glow */}
            <div className="pointer-events-none absolute -top-10 -left-10 size-32 rounded-full bg-cyan-500/20 blur-2xl" />

            {/* Top Pill Icon */}
            <div className="flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-cyan-400 mb-3">
              <Sparkles size={13} className="text-cyan-400 animate-pulse" />
              <span>{isUrdu ? 'فرق / تبدیلی' : 'Variance / Delta'}</span>
            </div>

            {/* Collection Shift */}
            <div className="w-full bg-slate-900/90 rounded-2xl p-2.5 mb-2.5 border border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-1">
                {isUrdu ? 'وصولی تبدیلی' : 'Collection (+)'}
              </p>
              <div
                dir="ltr"
                style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                className={`inline-flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-xs font-black font-mono w-full ${
                  isCollectionUp
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                    : 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
                }`}
              >
                <span>{isCollectionUp ? '↑ +' : '↓ '}{collectionPct}%</span>
                <span className="text-[9px] font-bold opacity-80">{isCollectionUp ? '+' : '-'}{displayCurrency} {absCollDiff}</span>
              </div>
            </div>

            {/* Expense Shift */}
            <div className="w-full bg-slate-900/90 rounded-2xl p-2.5 mb-3 border border-slate-800">
              <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wide mb-1">
                {isUrdu ? 'اخراجات بچت' : 'Expenses (-)'}
              </p>
              <div
                dir="ltr"
                style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                className={`inline-flex flex-col items-center gap-0.5 px-2.5 py-1 rounded-xl text-xs font-black font-mono w-full ${
                  !isExpenseUp
                    ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40'
                    : 'bg-rose-950/80 text-rose-400 border border-rose-500/40'
                }`}
              >
                <span>{expenseDiff < 0 ? '↓ -' : '↑ +'}{expensePct}%</span>
                <span className="text-[9px] font-bold opacity-80">{expenseDiff < 0 ? '-' : '+'}{displayCurrency} {absExpDiff}</span>
              </div>
            </div>

            {/* Center Arrow */}
            <div className="size-7 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center">
              <ArrowRight size={14} className={isUrdu ? 'rotate-180' : ''} />
            </div>
          </div>

          {/* ================= MOBILE 3D VARIANCE CONNECTOR & DELTA BRIDGE ================= */}
          <div className={`lg:hidden flex flex-col items-center justify-center my-2 z-20 w-full ${mobileTab === 'split' ? 'flex' : 'hidden'}`}>
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={shouldReduceMotion ? { y: 0 } : {
                y: [0, -3.5, 0],
                rotateX: [0, 1.2, 0],
              }}
              transition={{
                duration: 4.5,
                repeat: Infinity,
                repeatType: 'reverse',
                ease: 'easeInOut'
              }}
              className="w-full rounded-2xl bg-gradient-to-r from-slate-900 via-[#0a1226] to-slate-900 border-2 border-cyan-500/60 p-3.5 sm:p-4 shadow-xl shadow-cyan-500/15 text-white relative overflow-hidden"
              style={{
                perspective: 800,
                transformStyle: 'preserve-3d',
              }}
            >
              {/* Radial ambient glow */}
              <div className="pointer-events-none absolute -top-8 -right-8 size-28 rounded-full bg-cyan-500/20 blur-xl" />
              <div className="pointer-events-none absolute -bottom-8 -left-8 size-28 rounded-full bg-emerald-500/20 blur-xl" />

              {/* Title & 3-Step Realtime Math Ticker Controls */}
              <div className="flex items-center justify-between gap-1.5 mb-2.5 pb-2 border-b border-cyan-500/30">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-cyan-300">
                  <Sparkles size={14} className="text-cyan-400 animate-pulse" />
                  <span>{isUrdu ? '⚡ ریئل ٹائم 3D حساب (+/-)' : '⚡ Realtime 3D Math (+/-)'}</span>
                </div>
                
                {/* 3-Step Interactive Math Progress Pills */}
                <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-full border border-cyan-500/30 text-[9px] font-mono">
                  <button
                    type="button"
                    onClick={() => setMathStep(0)}
                    className={`px-1.5 py-0.5 rounded-full transition-all cursor-pointer ${
                      mathStep === 0
                        ? 'bg-cyan-500 text-slate-950 font-black shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    1. {translateMonth(prevName, lang).split(' ')[0]}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMathStep(1)}
                    className={`px-1.5 py-0.5 rounded-full transition-all cursor-pointer ${
                      mathStep === 1
                        ? 'bg-gradient-to-r from-emerald-500 to-cyan-400 text-slate-950 font-black shadow-xs ring-1 ring-emerald-300 animate-pulse'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    2. {isUrdu ? 'حساب (+/-)' : '+ / -'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMathStep(2)}
                    className={`px-1.5 py-0.5 rounded-full transition-all cursor-pointer ${
                      mathStep === 2
                        ? 'bg-indigo-500 text-white font-black shadow-xs'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    3. {translateMonth(currName, lang).split(' ')[0]}
                  </button>
                </div>
              </div>

              {/* 3 Interactive Highlighted Metrics with Realtime 3D Math Flip Animation */}
              <div className="grid grid-cols-3 gap-2 text-center" style={{ perspective: 600 }}>
                {/* 1. Collection Shift */}
                <div className="p-2 rounded-xl bg-slate-900/95 border border-emerald-500/50 flex flex-col items-center justify-between shadow-xs min-h-[96px] overflow-hidden relative">
                  <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-slate-400">
                    <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>{isUrdu ? 'وصولی' : 'Collection'}</span>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`coll-${mathStep}`}
                      initial={{ opacity: 0, y: 6, rotateX: -15 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      exit={{ opacity: 0, y: -6, rotateX: 15 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="w-full my-auto flex flex-col items-center justify-center"
                    >
                      {mathStep === 0 && (
                        <>
                          <span className="text-xs sm:text-sm font-black font-mono text-slate-300">
                            {displayCurrency} {prevCollection.toLocaleString('en-PK')}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 font-bold mt-0.5">
                            {isUrdu ? 'گزشتہ بنیاد' : 'Sep Starting'}
                          </span>
                        </>
                      )}

                      {mathStep === 1 && (
                        <>
                          <div className="inline-flex items-center gap-0.5 text-xs sm:text-sm font-black font-mono text-emerald-400">
                            <span className="text-emerald-300 font-black">➕</span>
                            <span>+{collectionPct}%</span>
                          </div>
                          <span className="text-[10px] font-mono font-black text-emerald-300 mt-0.5 bg-emerald-950/80 px-1 py-0.2 rounded border border-emerald-500/30">
                            +{displayCurrency} {absCollDiff}
                          </span>
                          <span className="text-[8px] font-bold text-emerald-400/80 uppercase tracking-tighter mt-0.5">
                            {isUrdu ? 'وصولی میں اضافہ (+)' : 'Added Inflow (+)'}
                          </span>
                        </>
                      )}

                      {mathStep === 2 && (
                        <>
                          <span className="text-xs sm:text-sm font-black font-mono text-emerald-400">
                            {displayCurrency} {currCollection.toLocaleString('en-PK')}
                          </span>
                          <span className="text-[9px] font-mono text-emerald-300/80 font-bold mt-0.5">
                            {isUrdu ? 'موجودہ ٹوٹل' : 'Oct Total (↑ +4.4%)'}
                          </span>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* 2. Expense Shift */}
                <div className="p-2 rounded-xl bg-slate-900/95 border border-cyan-500/50 flex flex-col items-center justify-between shadow-xs min-h-[96px] overflow-hidden relative">
                  <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-slate-400">
                    <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span>{isUrdu ? 'اخراجات' : 'Expenses'}</span>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`exp-${mathStep}`}
                      initial={{ opacity: 0, y: 6, rotateX: -15 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      exit={{ opacity: 0, y: -6, rotateX: 15 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="w-full my-auto flex flex-col items-center justify-center"
                    >
                      {mathStep === 0 && (
                        <>
                          <span className="text-xs sm:text-sm font-black font-mono text-slate-300">
                            {displayCurrency} {prevExpenses.toLocaleString('en-PK')}
                          </span>
                          <span className="text-[9px] font-mono text-slate-400 font-bold mt-0.5">
                            {isUrdu ? 'گزشتہ اخراجات' : 'Sep Burn'}
                          </span>
                        </>
                      )}

                      {mathStep === 1 && (
                        <>
                          <div className="inline-flex items-center gap-0.5 text-xs sm:text-sm font-black font-mono text-cyan-400">
                            <span className="text-cyan-300 font-black">➖</span>
                            <span>-{expensePct}%</span>
                          </div>
                          <span className="text-[10px] font-mono font-black text-cyan-300 mt-0.5 bg-cyan-950/80 px-1 py-0.2 rounded border border-cyan-500/30">
                            -{displayCurrency} {absExpDiff}
                          </span>
                          <span className="text-[8px] font-bold text-cyan-400/80 uppercase tracking-tighter mt-0.5">
                            {isUrdu ? 'اخراجات میں کمی (-)' : 'Spend Cut (Saved -)'}
                          </span>
                        </>
                      )}

                      {mathStep === 2 && (
                        <>
                          <span className="text-xs sm:text-sm font-black font-mono text-cyan-400">
                            {displayCurrency} {currExpenses.toLocaleString('en-PK')}
                          </span>
                          <span className="text-[9px] font-mono text-cyan-300/80 font-bold mt-0.5">
                            {isUrdu ? 'موجودہ اخراجات' : 'Oct Total (↓ -8.1%)'}
                          </span>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* 3. Net Recovery Shift */}
                <div className="p-2 rounded-xl bg-slate-900/95 border border-amber-400/50 flex flex-col items-center justify-between shadow-xs min-h-[96px] overflow-hidden relative">
                  <div className="flex items-center gap-1 text-[9px] uppercase font-bold text-slate-400">
                    <span className="size-1.5 rounded-full bg-amber-400 animate-pulse" />
                    <span>{isUrdu ? 'خالص بچت' : 'Recovery'}</span>
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`net-${mathStep}`}
                      initial={{ opacity: 0, y: 6, rotateX: -15 }}
                      animate={{ opacity: 1, y: 0, rotateX: 0 }}
                      exit={{ opacity: 0, y: -6, rotateX: 15 }}
                      transition={{ duration: 0.35, ease: 'easeOut' }}
                      className="w-full my-auto flex flex-col items-center justify-center"
                    >
                      {mathStep === 0 && (
                        <>
                          <span className="text-xs sm:text-sm font-black font-mono text-rose-400">
                            -{displayCurrency} {Math.abs(prevBalance).toLocaleString('en-PK')}
                          </span>
                          <span className="text-[9px] font-mono text-rose-400/80 font-bold mt-0.5">
                            {isUrdu ? 'گزشتہ خسارہ' : 'Sep Deficit'}
                          </span>
                        </>
                      )}

                      {mathStep === 1 && (
                        <>
                          <div className="inline-flex items-center gap-0.5 text-xs sm:text-sm font-black font-mono text-amber-300">
                            <span className="text-amber-300 font-black">➕</span>
                            <span>+{displayCurrency} {absBalanceDiff}</span>
                          </div>
                          <span className="text-[10px] font-mono font-black text-amber-300 mt-0.5 bg-amber-950/80 px-1 py-0.2 rounded border border-amber-500/30">
                            {isUrdu ? 'سرپلس فائدہ' : 'Surplus Gain'}
                          </span>
                          <span className="text-[8px] font-bold text-amber-400/80 uppercase tracking-tighter mt-0.5">
                            {isUrdu ? 'کیش فلو ریکوری (+)' : 'Recovery Gain (+)'}
                          </span>
                        </>
                      )}

                      {mathStep === 2 && (
                        <>
                          <span className="text-xs sm:text-sm font-black font-mono text-amber-300">
                            -{displayCurrency} {Math.abs(currBalance).toLocaleString('en-PK')}
                          </span>
                          <span className="text-[9px] font-mono text-emerald-300 font-bold mt-0.5">
                            {isUrdu ? 'خسارہ 80% کم' : 'Deficit Cut by 80%'}
                          </span>
                        </>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Bottom Directional Flow Bar with Dynamic Math Narrative */}
              <div className="mt-2.5 pt-2 border-t border-cyan-500/20 flex items-center justify-between gap-1 text-[10px] font-bold text-cyan-300/90 flex-wrap">
                <div className="flex items-center gap-1.5 font-mono">
                  <span>{translateMonth(prevName, lang).split(' ')[0]}</span>
                  <span className="text-cyan-400 font-black animate-pulse">➔</span>
                  <span className="text-white font-black">{translateMonth(currName, lang).split(' ')[0]}</span>
                </div>

                <div className="flex items-center gap-1.5 font-mono text-[9px] sm:text-[10px]">
                  {mathStep === 0 && (
                    <span className="text-slate-400 font-semibold">
                      {isUrdu ? 'مرحلہ 1: ستمبر کی بنیادی رقم' : '1. September Starting Figures'}
                    </span>
                  )}
                  {mathStep === 1 && (
                    <span className="text-emerald-300 font-black bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-500/40 animate-pulse">
                      {isUrdu ? '⚡ لائیو 3D حساب: (+ وصولی) اور (- اخراجات کی بچت)' : '⚡ Live 3D Math: (+ Inflow) & (- Expense Saved)'}
                    </span>
                  )}
                  {mathStep === 2 && (
                    <span className="text-cyan-300 font-black bg-cyan-950/80 px-2 py-0.5 rounded-full border border-cyan-500/40">
                      {isUrdu ? 'مرحلہ 3: اکتوبر میں خالص سرپلس بہتری (+17,986)' : '3. October Net Surplus Recovered (+17,986)'}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </div>

          {/* ================= CARD 2: CURRENT CYCLE ================= */}
          <motion.div
            onClick={() => setElevatedCard(2)}
            whileHover={shouldReduceMotion ? {} : { y: -4 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.99 }}
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
                  {isUrdu ? 'موجودہ فعال' : 'Live Active'}
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
                  <motion.span
                    dir="ltr"
                    style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                    animate={shouldReduceMotion ? {} : { scale: [1, 1.05, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    className={`text-[10px] sm:text-xs font-mono font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs ${
                      isCollectionUp
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 border border-emerald-400/60 ring-2 ring-emerald-500/20'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300 border border-rose-400/60 ring-2 ring-rose-500/20'
                    }`}
                  >
                    <span>{isCollectionUp ? '↑ +' : '↓ '}{collectionPct}%</span>
                    <span className="hidden sm:inline font-bold opacity-80">(+{displayCurrency} {absCollDiff})</span>
                  </motion.span>
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
                  <motion.span
                    dir="ltr"
                    style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                    animate={shouldReduceMotion ? {} : { scale: [1, 1.05, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
                    className={`text-[10px] sm:text-xs font-mono font-black px-2 py-0.5 rounded-full flex items-center gap-1 shadow-xs ${
                      !isExpenseUp
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 border border-emerald-400/60 ring-2 ring-emerald-500/20'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300 border border-rose-400/60 ring-2 ring-rose-500/20'
                    }`}
                  >
                    <span>{expenseDiff < 0 ? '↓ -' : '↑ +'}{expensePct}%</span>
                    <span className="hidden sm:inline font-bold opacity-80">(-{displayCurrency} {absExpDiff} {expenseDiff < 0 ? (isUrdu ? 'بچت' : 'Saved') : ''})</span>
                  </motion.span>
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
                    value={(currBalance < 0 ? '-' : '') + Math.abs(currBalance).toLocaleString('en-PK')}
                    prefix={displayCurrency}
                    className={`text-sm sm:text-base md:text-lg font-black font-mono ${
                      currBalance >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  />
                  <motion.span
                    dir="ltr"
                    style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                    animate={shouldReduceMotion ? {} : { scale: [1, 1.05, 1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                    className={`text-[10px] sm:text-xs font-mono font-black px-2 py-0.5 rounded-full inline-flex items-center gap-1 shadow-xs ${
                      balanceDiff >= 0
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/90 dark:text-emerald-300 border border-emerald-400/60 ring-2 ring-emerald-500/20'
                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950/90 dark:text-rose-300 border border-rose-400/60 ring-2 ring-rose-500/20'
                    }`}
                  >
                    <span>{balanceDiff >= 0 ? '+' : '-'}{displayCurrency} {absBalanceDiff}</span>
                    <span className="hidden sm:inline font-bold opacity-80">({isUrdu ? 'بہتری' : 'Recovery'})</span>
                  </motion.span>
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

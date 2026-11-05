import React, { useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import { TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Sparkles, Calendar, ArrowLeftRight, ShieldCheck, Wallet, ArrowRight } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { translateMonth } from '../utils/translations'

export const MonthComparison3D = ({
  previousMonth = {
    name: 'July 2026',
    collection: 265000,
    expenses: 284200,
    balance: 8200,
    status: 'Surplus'
  },
  currentMonth = {
    name: 'August 2026',
    collection: 282250,
    expenses: 306285,
    balance: -4012,
    status: 'Deficit'
  },
  currency = 'PKR'
}) => {
  const { lang, isRtl } = useLanguage ? useLanguage() : { lang: 'en', isRtl: false }
  const isUrdu = lang === 'ur'
  const displayCurrency = isUrdu ? 'روپے' : currency
  const shouldReduceMotion = useReducedMotion()

  // Mobile segmented selector view: 'split' | 'prev' | 'current'
  const [mobileTab, setMobileTab] = useState('split')

  // Normalizing input props
  const prevName = previousMonth?.name || 'Previous Month'
  const currName = currentMonth?.name || 'Current Month'

  const prevCollection = Number(previousMonth?.collection ?? 0)
  const currCollection = Number(currentMonth?.collection ?? 0)

  const prevExpenses = Number(previousMonth?.expenses ?? 0)
  const currExpenses = Number(currentMonth?.expenses ?? 0)

  const prevBalance = Number(previousMonth?.balance ?? previousMonth?.closingBalance ?? (prevCollection - prevExpenses))
  const currBalance = Number(currentMonth?.balance ?? currentMonth?.closingBalance ?? (currCollection - currExpenses))

  const prevStatus = previousMonth?.status || (prevBalance >= 0 ? 'Surplus' : 'Deficit')
  const currStatus = currentMonth?.status || (currBalance >= 0 ? 'Surplus' : 'Deficit')

  // Variance & Delta computations
  const collectionDiff = currCollection - prevCollection
  const collectionPct = prevCollection > 0
    ? ((collectionDiff / prevCollection) * 100).toFixed(1)
    : '0.0'
  const isCollectionPositive = collectionDiff >= 0

  const expenseDiff = currExpenses - prevExpenses
  const expensePct = prevExpenses > 0
    ? ((expenseDiff / prevExpenses) * 100).toFixed(1)
    : '0.0'
  const isExpenseIncrease = expenseDiff > 0

  const balanceDiff = currBalance - prevBalance
  const isBalanceFavorable = balanceDiff >= 0

  // 3D Perspective Spring & Tilt Physics (Gentle tilt to ensure zero font blur)
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  // Physics spring config (damping: 24, stiffness: 220)
  const springConfig = { damping: 24, stiffness: 220, mass: 0.35 }
  const smoothX = useSpring(mouseX, springConfig)
  const smoothY = useSpring(mouseY, springConfig)

  // Subtle rotation angles (-4deg to 4deg) to preserve sharp subpixel typography
  const rotateX = useTransform(smoothY, [-0.5, 0.5], [4, -4])
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-4, 4])

  const handlePointerMove = (e) => {
    if (shouldReduceMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handlePointerLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const fmt = (n) => Number(Math.abs(n || 0)).toLocaleString('en-PK')

  return (
    <div className="w-full my-8">
      {/* ─── Header & Top Controls Bar ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 px-1">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-primary to-cyan-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/25 flex-shrink-0">
            <ArrowLeftRight size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {isUrdu ? 'ماہانہ تقابلی جائزہ (3D تجزیہ)' : 'Month-over-Month 3D Comparison'}
              </h3>
              <span className="text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-950/70 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60 shadow-xs">
                {translateMonth(prevName, lang)} vs {translateMonth(currName, lang)}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              {isUrdu
                ? 'آمدن، اخراجات اور نیٹ بیلنس میں تفصیلی تبدیلیوں کا 3D موازنہ'
                : 'Interactive 3D dual-card perspective comparing collection, burn rate, and reserves'}
            </p>
          </div>
        </div>

        {/* Mobile / Tablet Segmented Selector */}
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

      {/* Medium Screen Top Delta Bridge (shows on screens < lg so nothing overlaps) */}
      <div className="lg:hidden mb-4 p-3 rounded-2xl bg-slate-900 text-white border border-indigo-500/30 flex items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-1.5 text-xs font-black text-indigo-300">
          <Sparkles size={14} className="text-cyan-400" />
          <span>{isUrdu ? 'ماہانہ تغیر (ڈیلٹا):' : 'Variance / Delta:'}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black ${
            isCollectionPositive ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40' : 'bg-rose-950/80 text-rose-300 border border-rose-500/40'
          }`}>
            {isCollectionPositive ? '↑ +' : '↓ '}{collectionPct}% {isUrdu ? 'وصولی' : 'Collection'}
          </span>
          <span className={`px-2.5 py-1 rounded-xl text-xs font-mono font-black ${
            isExpenseIncrease ? 'bg-rose-950/80 text-rose-300 border border-rose-500/40' : 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
          }`}>
            {isExpenseIncrease ? '↑ +' : '↓ '}{expensePct}% {isUrdu ? 'اخراجات' : 'Expenses'}
          </span>
        </div>
      </div>

      {/* ─── 3D Perspective Canvas Container (perspective: 1400px) ─── */}
      <div
        style={{ perspective: 1400 }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="w-full relative [touch-action:pan-y]"
      >
        <motion.div
          style={{
            rotateX: shouldReduceMotion ? 0 : rotateX,
            rotateY: shouldReduceMotion ? 0 : rotateY,
          }}
          className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-5 sm:gap-6"
        >
          {/* ================= CARD 1: PREVIOUS MONTH ================= */}
          <div
            className={`relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-[#0f172a] p-6 sm:p-7 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden flex flex-col justify-between transition-all duration-300 ${
              mobileTab === 'current' ? 'hidden sm:flex' : 'flex'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'optimizeLegibility',
              transform: 'translateZ(0)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[10px] font-mono uppercase font-extrabold tracking-wider text-slate-400">
                  {isUrdu ? 'گزشتہ مالیاتی سائیکل' : 'Previous Cycle'}
                </span>
                <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight mt-0.5">
                  {translateMonth(prevName, lang)}
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Baseline
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                  prevStatus === 'Surplus'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}>
                  {isUrdu ? (prevStatus === 'Surplus' ? 'سرپلس' : 'خسارہ') : prevStatus}
                </span>
              </div>
            </div>

            {/* Financial Metrics Stack */}
            <div className="space-y-3 pt-3">
              {/* Monthly Collection (100% visible, unobstructed, razor sharp) */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Wallet size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isUrdu ? 'ماہانہ وصولی' : 'Monthly Collection'}
                  </span>
                </div>
                <span className="text-sm sm:text-base md:text-lg font-black font-mono text-slate-900 dark:text-slate-100">
                  {displayCurrency} {fmt(prevCollection)}
                </span>
              </div>

              {/* Expenses */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <TrendingDown size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isUrdu ? 'کل اخراجات' : 'Total Expenses'}
                  </span>
                </div>
                <span className="text-sm sm:text-base md:text-lg font-black font-mono text-slate-900 dark:text-slate-100">
                  {displayCurrency} {fmt(prevExpenses)}
                </span>
              </div>

              {/* Closing Balance */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/70 dark:border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Calendar size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isUrdu ? 'اختتامی بیلنس' : 'Closing Balance'}
                  </span>
                </div>
                <span
                  className={`text-sm sm:text-base md:text-lg font-black font-mono ${
                    prevBalance >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {prevBalance < 0 ? '-' : ''}{displayCurrency} {fmt(prevBalance)}
                </span>
              </div>
            </div>

            {/* Card Footer Sub-bar */}
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-400 font-medium">
              <span className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-emerald-500" />
                <span>{isUrdu ? 'مکمل تصدیق شدہ ریکارڈ' : 'Reconciled Audit Record'}</span>
              </span>
              <span className="font-mono text-[11px] text-slate-500 font-bold">100% Settled</span>
            </div>
          </div>

          {/* ================= DEDICATED CENTRAL "VARIANCE / DELTA" PILLAR (DESKTOP) ================= */}
          {/* Positioned in its OWN column between the cards: 100% NON-OVERLAPPING */}
          <div
            className="hidden lg:flex flex-col items-center justify-center p-3.5 sm:p-4 rounded-3xl bg-slate-900 dark:bg-slate-950 border border-indigo-500/40 shadow-2xl text-center w-[175px] flex-shrink-0 z-20 self-center"
            style={{
              backfaceVisibility: 'hidden',
              WebkitFontSmoothing: 'antialiased',
              transform: 'translateZ(0)',
            }}
          >
            {/* Header chip */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-extrabold uppercase tracking-wider text-indigo-300 mb-2.5">
              <Sparkles size={13} className="text-cyan-400" />
              <span>{isUrdu ? 'تغیر / ڈیلٹا' : 'Variance / Delta'}</span>
            </div>

            {/* Stacked floating delta chips */}
            <div className="space-y-2 w-full">
              {/* Collection delta */}
              <div className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-black flex flex-col items-center justify-center border ${
                isCollectionPositive
                  ? 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                  : 'bg-rose-950/70 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
              }`}>
                <span className="text-[9px] uppercase font-sans text-slate-300 font-bold tracking-wider">
                  {isUrdu ? 'وصولی' : 'Collection'}
                </span>
                <span className="text-sm font-extrabold mt-0.5">
                  {isCollectionPositive ? '↑ +' : '↓ '}{collectionPct}%
                </span>
              </div>

              {/* Expense delta */}
              <div className={`px-2.5 py-1.5 rounded-xl text-xs font-mono font-black flex flex-col items-center justify-center border ${
                isExpenseIncrease
                  ? 'bg-rose-950/70 text-rose-300 border-rose-500/40 shadow-[0_0_12px_rgba(244,63,94,0.25)]'
                  : 'bg-emerald-950/70 text-emerald-300 border-emerald-500/40 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
              }`}>
                <span className="text-[9px] uppercase font-sans text-slate-300 font-bold tracking-wider">
                  {isUrdu ? 'اخراجات' : 'Expenses'}
                </span>
                <span className="text-sm font-extrabold mt-0.5">
                  {isExpenseIncrease ? '↑ +' : '↓ '}{expensePct}%
                </span>
              </div>
            </div>

            {/* Directional arrow icon */}
            <div className="mt-2.5 text-indigo-400/80 flex items-center justify-center">
              <ArrowRight size={16} />
            </div>
          </div>

          {/* ================= CARD 2: CURRENT MONTH (HERO CARD) ================= */}
          <div
            className={`relative rounded-3xl border-2 border-indigo-500/40 bg-white dark:bg-[#0f172a] p-6 sm:p-7 shadow-2xl shadow-indigo-500/10 overflow-hidden flex flex-col justify-between transition-all duration-300 ${
              mobileTab === 'prev' ? 'hidden sm:flex' : 'flex'
            }`}
            style={{
              backfaceVisibility: 'hidden',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'optimizeLegibility',
              transform: 'translateZ(0)',
            }}
          >
            {/* Subtle top indicator bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-primary to-cyan-500" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-indigo-500/20">
              <div>
                <span className="text-[10px] font-mono uppercase font-extrabold tracking-wider text-indigo-600 dark:text-cyan-400">
                  {isUrdu ? 'موجودہ فعال سائیکل' : 'Current Active Cycle'}
                </span>
                <h4 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {translateMonth(currName, lang)}
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-sm shadow-indigo-500/30">
                  Live Active
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                  currStatus === 'Surplus'
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}>
                  {isUrdu ? (currStatus === 'Surplus' ? 'سرپلس' : 'خسارہ') : currStatus}
                </span>
              </div>
            </div>

            {/* Financial Metrics Stack with Live Delta Badges */}
            <div className="space-y-3 pt-3">
              {/* Collection Row */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/80 border border-indigo-100/70 dark:border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                    <Wallet size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isUrdu ? 'ماہانہ وصولی' : 'Monthly Collection'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base md:text-lg font-black font-mono text-slate-900 dark:text-slate-100">
                    {displayCurrency} {fmt(currCollection)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-black px-2 py-0.5 rounded-md ${
                      isCollectionPositive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40'
                        : 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/40'
                    }`}
                  >
                    {isCollectionPositive ? '↑ +' : '↓ '}{collectionPct}%
                  </span>
                </div>
              </div>

              {/* Expenses Row */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/80 border border-indigo-100/70 dark:border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                    <TrendingDown size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isUrdu ? 'کل اخراجات' : 'Total Expenses'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm sm:text-base md:text-lg font-black font-mono text-slate-900 dark:text-slate-100">
                    {displayCurrency} {fmt(currExpenses)}
                  </span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-black px-2 py-0.5 rounded-md ${
                      isExpenseIncrease
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/80 dark:text-rose-300 border border-rose-300/40'
                        : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/80 dark:text-emerald-300 border border-emerald-300/40'
                    }`}
                  >
                    {isExpenseIncrease ? '↑ +' : '↓ '}{expensePct}%
                  </span>
                </div>
              </div>

              {/* Net Closing Balance Row */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/80 border border-indigo-100/70 dark:border-slate-700/80">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                    <Calendar size={16} />
                  </div>
                  <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300">
                    {isUrdu ? 'اختتامی بیلنس' : 'Closing Balance'}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-sm sm:text-base md:text-lg font-black font-mono ${
                      currBalance >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {currBalance < 0 ? '-' : ''}{displayCurrency} {fmt(currBalance)}
                  </span>
                  <span
                    className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                      isBalanceFavorable
                        ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                        : 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                    }`}
                  >
                    {balanceDiff >= 0 ? '+' : '-'}{displayCurrency} {fmt(balanceDiff)}
                  </span>
                </div>
              </div>
            </div>

            {/* Card Footer Sub-bar */}
            <div className="mt-5 pt-3 border-t border-indigo-500/20 flex items-center justify-between text-xs font-medium">
              <span className="text-slate-400">{isUrdu ? 'ماہانہ خالص تبدیلی' : 'Net MoM Variance:'}</span>
              <span
                className={`font-black font-mono flex items-center gap-1 ${
                  isBalanceFavorable ? 'text-emerald-500' : 'text-amber-500'
                }`}
              >
                {isBalanceFavorable ? (
                  <>
                    <TrendingUp size={14} />
                    <span>{isUrdu ? 'بہتر کارکردگی' : 'Favorable Shift'}</span>
                  </>
                ) : (
                  <>
                    <TrendingDown size={14} />
                    <span>{isUrdu ? 'خسارے میں اضافہ' : 'Higher Deficit Gap'}</span>
                  </>
                )}
              </span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default MonthComparison3D

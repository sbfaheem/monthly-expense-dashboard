import React, { useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Calendar,
  ShieldCheck,
  Sparkles,
  ArrowRight,
  ArrowLeftRight,
  Layers
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

  // Active focused card on tap (0: balanced, 1: prev lifted, 2: curr lifted)
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

  // Interactive Pointer / Touch 3D Physics
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 26, stiffness: 200, mass: 0.4 }
  const smoothX = useSpring(mouseX, springConfig)
  const smoothY = useSpring(mouseY, springConfig)

  const interactiveRotateX = useTransform(smoothY, [-0.5, 0.5], [7, -7])
  const interactiveRotateY = useTransform(smoothX, [-0.5, 0.5], [-7, 7])

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

      {/* ─── 3D Perspective Stage ─── */}
      <div
        style={{ perspective: 1400 }}
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
        className="w-full relative [touch-action:pan-y] select-none"
      >
        {/* Continuous 3D Ambient Levitation (Visible on Mobile & Desktop) */}
        <motion.div
          animate={shouldReduceMotion ? {} : {
            y: [-3, 3, -3],
            rotateZ: [-0.4, 0.4, -0.4],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            rotateX: shouldReduceMotion ? 0 : interactiveRotateX,
            rotateY: shouldReduceMotion ? 0 : interactiveRotateY,
            transformStyle: 'preserve-3d',
          }}
          className="relative grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] items-center gap-5 sm:gap-6 will-change-transform"
        >
          {/* ================= CARD 1: PREVIOUS CYCLE ================= */}
          <motion.div
            onClick={() => setElevatedCard(1)}
            animate={{
              scale: elevatedCard === 1 ? 1.02 : 1,
              z: elevatedCard === 1 ? 30 : 10,
            }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className={`relative rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white/95 dark:bg-[#0f172a] p-6 sm:p-7 shadow-xl shadow-slate-200/40 dark:shadow-none overflow-hidden flex flex-col justify-between cursor-pointer transition-shadow ${
              mobileTab === 'current' ? 'hidden sm:flex' : 'flex'
            }`}
            style={{
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'geometricPrecision',
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

          {/* ================= CENTER PILLAR: ANIMATED 3D VARIANCE / DELTA ================= */}
          <motion.div
            animate={shouldReduceMotion ? {} : {
              scale: [1, 1.03, 1],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="hidden lg:flex flex-col items-center justify-center p-4 rounded-3xl bg-[#070b16] border-2 border-cyan-500/40 shadow-2xl text-center w-[178px] flex-shrink-0 z-20 self-center relative overflow-hidden"
            style={{
              transform: 'translateZ(35px)',
              boxShadow: '0 0 25px rgba(6, 182, 212, 0.25)',
            }}
          >
            {/* Animated Laser Scanline Effect */}
            <motion.div
              animate={{ y: ['-100%', '220%'] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
              className="pointer-events-none absolute inset-x-0 h-10 bg-gradient-to-b from-transparent via-cyan-400/20 to-transparent"
            />

            {/* Header Chip */}
            <div className="flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider text-cyan-400 mb-3 relative z-10">
              <Sparkles size={12} className="text-cyan-300 animate-pulse" />
              <span>{isUrdu ? 'تغیر / ڈیلٹا' : 'VARIANCE / DELTA'}</span>
            </div>

            {/* Collection Delta */}
            <div className="w-full mb-2.5 p-2 rounded-2xl bg-slate-900/95 border border-slate-800 text-center relative z-10 shadow-inner">
              <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5 tracking-wider">
                {isUrdu ? 'وصولی' : 'COLLECTION'}
              </span>
              <span className={`text-xs font-mono font-black ${
                isCollectionUp ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isCollectionUp ? '↑ +' : '↓ '}{collectionPct}%
              </span>
            </div>

            {/* Expenses Delta */}
            <div className="w-full p-2 rounded-2xl bg-slate-900/95 border border-slate-800 text-center relative z-10 shadow-inner">
              <span className="text-[9px] uppercase font-bold text-slate-400 block mb-0.5 tracking-wider">
                {isUrdu ? 'اخراجات' : 'EXPENSES'}
              </span>
              <span className={`text-xs font-mono font-black ${
                !isExpenseUp ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {isExpenseUp ? '↑ +' : '↓ '}{expensePct}%
              </span>
            </div>

            {/* Pulsing Arrow */}
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              className="mt-3 text-cyan-400/90 flex items-center justify-center relative z-10"
            >
              <ArrowRight size={16} />
            </motion.div>
          </motion.div>

          {/* ================= CARD 2: CURRENT ACTIVE CYCLE (HERO CARD) ================= */}
          <motion.div
            onClick={() => setElevatedCard(2)}
            animate={{
              scale: elevatedCard === 2 ? 1.02 : 1,
              z: elevatedCard === 2 ? 30 : 10,
            }}
            transition={{ type: 'spring', stiffness: 280, damping: 24 }}
            className={`relative rounded-3xl border-2 border-indigo-500/50 bg-white/95 dark:bg-[#0f172a] p-6 sm:p-7 shadow-2xl shadow-indigo-500/15 overflow-hidden flex flex-col justify-between cursor-pointer transition-shadow ${
              mobileTab === 'prev' ? 'hidden sm:flex' : 'flex'
            }`}
            style={{
              transform: 'translateZ(0)',
              backfaceVisibility: 'hidden',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'geometricPrecision',
            }}
          >
            {/* Top Indicator Line */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-primary to-cyan-400" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3.5 border-b border-indigo-500/20">
              <div>
                <span className="text-[10px] font-mono uppercase font-extrabold tracking-wider text-indigo-600 dark:text-cyan-400">
                  {isUrdu ? 'موجودہ فعال سائیکل' : 'CURRENT ACTIVE CYCLE'}
                </span>
                <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5">
                  {translateMonth(currName, lang)}
                </h4>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-600 text-white shadow-xs">
                  Live Active
                </span>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${
                  isCurrSurplus
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/70 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-50 text-rose-700 dark:bg-rose-950/70 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                }`}>
                  {isUrdu ? (isCurrSurplus ? 'سرپلس' : 'خسارہ') : (isCurrSurplus ? 'Surplus' : 'Deficit')}
                </span>
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-3 pt-3.5">
              {/* Collection Row */}
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/80 border border-indigo-100/70 dark:border-slate-700/80">
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
                    className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-black px-2 py-0.5 rounded-md ${
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
              <div className="flex items-center justify-between p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/80 border border-indigo-100/70 dark:border-slate-700/80">
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
                    className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-black px-2 py-0.5 rounded-md ${
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
                    <span>{isUrdu ? 'خسارے میں اضافہ' : 'Higher Deficit Gap'}</span>
                  </>
                )}
              </span>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  )
}

export default MonthComparison3D
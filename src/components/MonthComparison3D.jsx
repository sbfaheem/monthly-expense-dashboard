import React, { useState, useEffect, useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import {
  Wallet,
  TrendingDown,
  TrendingUp,
  Calendar,
  ShieldCheck,
  Sparkles,
  ArrowLeftRight,
  RotateCcw,
  Calculator,
  ArrowUp,
  ArrowDown,
  Layers,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { translateMonth } from '../utils/translations'
import { getUrlParam, updateUrlParams } from '../utils/urlState'
import { soundEffects } from '../utils/soundEffects'
import { computeVariancePercent } from '../utils/formatters'
import GlassCard from './motion/GlassCard'
import TiltCard from './motion/TiltCard'
import AnimatedNumber from './motion/AnimatedNumber'
import DeltaCapsule from './comparison/DeltaCapsule'
import EquationPlayer, { CoinStackVisual } from './comparison/EquationPlayer'

export const MonthComparison3D = ({
  previousMonth = {
    name: 'September 2026',
    collection: 279050,
    expenses: 297425,
    balance: -22387,
    closingBalance: -22387,
    status: 'Deficit',
  },
  currentMonth = {
    name: 'October 2026',
    openingBalance: -22387,
    collection: 291350,
    expenses: 273364,
    cctvExpense: 0,
    balance: -4401,
    closingBalance: -4401,
    status: 'Surplus',
  },
  currency = 'PKR',
}) => {
  const { lang, isRtl } = useLanguage ? useLanguage() : { lang: 'en', isRtl: false }
  const isUrdu = lang === 'ur'
  const displayCurrency = isUrdu ? 'روپے' : currency
  const shouldReduceMotion = useReducedMotion()

  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.15 })

  // Replay key for section entrance + delta split-flap + beam animations
  const [replayKey, setReplayKey] = useState(0)

  // Elevated tap selection on mobile / desktop
  const [elevatedCard, setElevatedCard] = useState(2)

  // Mobile segmented view: 'split' | 'prev' | 'current' | 'carousel' (synced with ?compare=)
  const [mobileTab, setMobileTab] = useState(() => {
    const param = getUrlParam('compare')
    if (param === 'split' || param === 'prev' || param === 'current' || param === 'carousel') {
      return param
    }
    return 'split'
  })

  const handleMobileTabChange = (tab) => {
    setMobileTab(tab)
    updateUrlParams({ compare: tab }, true)
  }

  useEffect(() => {
    const handlePopState = () => {
      const param = getUrlParam('compare')
      if (param === 'split' || param === 'prev' || param === 'current' || param === 'carousel') {
        setMobileTab(param)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Normalized Real Financial Data (read directly from props; never hardcoded)
  const prevName = previousMonth?.name || 'Previous Cycle'
  const currName = currentMonth?.name || 'Current Cycle'

  const prevCollection = Number(previousMonth?.collection ?? 0)
  const currCollection = Number(currentMonth?.collection ?? 0)

  const prevExpenses = Number(previousMonth?.expenses ?? 0)
  const currExpenses = Number(currentMonth?.expenses ?? 0)
  const currCctv = Number(currentMonth?.cctvExpense ?? 0)

  const prevBalance = Number(previousMonth?.closingBalance ?? previousMonth?.balance ?? 0)
  const currBalance = Number(currentMonth?.closingBalance ?? currentMonth?.balance ?? 0)
  const currOpening =
    currentMonth?.openingBalance !== undefined && currentMonth?.openingBalance !== null
      ? Number(currentMonth.openingBalance)
      : prevBalance

  const prevNet = Number(previousMonth?.netCashFlow ?? prevCollection - prevExpenses)
  const currNet = Number(currentMonth?.netCashFlow ?? currCollection - currExpenses)

  const isPrevSurplus = previousMonth?.status === 'Surplus' || prevNet >= 0
  const isCurrSurplus = currentMonth?.status === 'Surplus' || currNet >= 0

  // Delta Computations (derived purely from props, unified 1-decimal percentage rounding)
  const collectionDiff = currCollection - prevCollection
  const collectionPctObj = computeVariancePercent(collectionDiff, prevCollection)
  const collectionPctNum = collectionPctObj ? collectionPctObj.absValue : 0
  const isCollectionUp = collectionDiff >= 0

  const expenseDiff = currExpenses - prevExpenses
  const expensePctObj = computeVariancePercent(expenseDiff, prevExpenses)
  const expensePctNum = expensePctObj ? expensePctObj.absValue : 0
  const isExpenseUp = expenseDiff > 0

  const balanceDiff = currBalance - prevBalance
  const isImprovedBalance = currBalance > prevBalance
  const isFavorableVariance = currNet >= prevNet

  // ── Equation Playback State Machine (Steps 1 -> 2 -> 3 -> 4) ──────────────
  // Default settled at Step 4 so all figures remain immediately legible.
  const [mathStep, setMathStep] = useState(4)
  const [isPlayingEquation, setIsPlayingEquation] = useState(false)
  const [equationPlayCount, setEquationPlayCount] = useState(0)
  const equationTimersRef = useRef([])

  const clearEquationTimers = () => {
    equationTimersRef.current.forEach((id) => clearTimeout(id))
    equationTimersRef.current = []
  }

  useEffect(() => {
    return () => clearEquationTimers()
  }, [])

  const runEquationSequence = () => {
    clearEquationTimers()
    soundEffects.playBounce()
    setEquationPlayCount((c) => c + 1)

    if (shouldReduceMotion) {
      setMathStep(4)
      setIsPlayingEquation(false)
      return
    }

    setIsPlayingEquation(true)
    setMathStep(1)

    const t2 = setTimeout(() => setMathStep(2), 1300)
    const t3 = setTimeout(() => setMathStep(3), 2700)
    const t4 = setTimeout(() => {
      setMathStep(4)
      setIsPlayingEquation(false)
    }, 4100)

    equationTimersRef.current = [t2, t3, t4]
  }

  const handleSelectStep = (step) => {
    clearEquationTimers()
    setIsPlayingEquation(false)
    setEquationPlayCount((c) => c + 1)
    setMathStep(step)
  }

  const handleReplayAll = () => {
    soundEffects.playBounce()
    setReplayKey((k) => k + 1)
    runEquationSequence()
  }

  // Running Balance for Current Card live readout during Steps 1..4
  const afterCollectionBalance = currOpening + currCollection
  const runningBalanceValue =
    mathStep === 1
      ? currOpening
      : mathStep === 2
      ? afterCollectionBalance
      : currBalance

  const runningBalanceFrom =
    mathStep === 1
      ? prevBalance
      : mathStep === 2
      ? currOpening
      : mathStep === 3
      ? afterCollectionBalance
      : afterCollectionBalance

  // Helper to format plain number
  const fmtInt = (n) => new Intl.NumberFormat('en-PK').format(Math.round(Math.abs(Number(n) || 0)))

  // Reusable Previous Cycle Card Content
  const renderPreviousCard = ({ forCarousel = false } = {}) => (
    <TiltCard
      restingRotateY={forCarousel ? 0 : isRtl ? -8 : 8}
      restingScale={forCarousel ? 1 : 0.96}
      restingZ={0}
      maxTilt={6}
      dimmed={!forCarousel && elevatedCard !== 1}
      onClick={() => setElevatedCard(1)}
      className="cursor-pointer"
    >
      <GlassCard
        glow="none"
        interactive
        className={`p-5 sm:p-6 flex flex-col justify-between transition-opacity duration-300 ${
          !forCarousel && elevatedCard !== 1 ? 'opacity-90 lg:opacity-90' : 'opacity-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2 pb-3.5 border-b border-slate-900/[0.06] dark:border-white/[0.08]">
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase font-extrabold tracking-wider text-slate-400 block">
              {isUrdu ? 'گزشتہ مالیاتی سائیکل' : 'PREVIOUS CYCLE'}
            </span>
            <h4 className="text-lg sm:text-2xl font-black text-slate-800 dark:text-slate-100 tracking-tight mt-0.5 truncate">
              {translateMonth(prevName, lang)}
            </h4>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-200/70 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-300/60 dark:border-white/10 whitespace-nowrap">
              {isUrdu ? 'بنیاد' : 'Baseline'}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-black whitespace-nowrap border ${
                isPrevSurplus
                  ? 'bg-emerald-500/12 text-emerald-700 dark:text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/12 text-rose-700 dark:text-rose-300 border-rose-500/30'
              }`}
            >
              {isUrdu
                ? isPrevSurplus
                  ? 'سرپلس'
                  : 'خسارہ'
                : isPrevSurplus
                ? 'Surplus'
                : 'Deficit'}
            </span>
          </div>
        </div>

        {/* Metrics Rows */}
        <div className="space-y-2.5 pt-3.5">
          {/* Monthly Collection */}
          <div className="flex items-center justify-between gap-2 p-3 sm:p-3.5 rounded-2xl bg-white/55 dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-xl bg-emerald-500/12 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Wallet size={16} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                {isUrdu ? 'ماہانہ وصولی' : 'Monthly Collection'}
              </span>
            </div>
            <AnimatedNumber
              value={prevCollection}
              from={inView ? 0 : prevCollection}
              prefix={displayCurrency}
              duration={0.85}
              triggerKey={replayKey}
              className="text-sm sm:text-base md:text-lg font-black text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Total Expenses */}
          <div className="flex items-center justify-between gap-2 p-3 sm:p-3.5 rounded-2xl bg-white/55 dark:bg-white/[0.05] border border-slate-200/70 dark:border-white/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-xl bg-rose-500/12 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                <TrendingDown size={16} />
              </div>
              <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 truncate">
                {isUrdu ? 'کل اخراجات' : 'Total Expenses'}
              </span>
            </div>
            <AnimatedNumber
              value={prevExpenses}
              from={inView ? 0 : prevExpenses}
              prefix={displayCurrency}
              duration={0.85}
              delay={0.08}
              triggerKey={replayKey}
              className="text-sm sm:text-base md:text-lg font-black text-slate-800 dark:text-slate-100"
            />
          </div>

          {/* Closing Balance (becomes Next Month Opening) */}
          <div
            className={`flex items-center justify-between gap-2 p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 ${
              mathStep === 1
                ? 'bg-indigo-500/12 border-indigo-400/60 ring-2 ring-indigo-400/35'
                : 'bg-white/55 dark:bg-white/[0.05] border-slate-200/70 dark:border-white/10'
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="size-8 rounded-xl bg-indigo-500/12 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                <Calendar size={16} />
              </div>
              <div className="min-w-0">
                <span className="text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-300 block truncate">
                  {isUrdu ? 'اختتامی بیلنس' : 'Closing Balance'}
                </span>
                {mathStep === 1 && (
                  <span className="text-[10px] font-bold text-indigo-600 dark:text-indigo-300 block">
                    {isUrdu ? '→ اگلے ماہ کا ابتدائی بیلنس' : '→ Carries to Next Opening'}
                  </span>
                )}
              </div>
            </div>
            <AnimatedNumber
              value={prevBalance}
              from={inView ? 0 : prevBalance}
              prefix={displayCurrency}
              signBeforeNumber
              duration={0.85}
              delay={0.14}
              triggerKey={replayKey}
              className={`text-sm sm:text-base md:text-lg font-black ${
                prevBalance >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            />
          </div>
        </div>

        {/* Sub-bar */}
        <div className="mt-4 pt-3 border-t border-slate-900/[0.06] dark:border-white/[0.08] flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400 font-medium">
          <span className="flex items-center gap-1.5 min-w-0 truncate">
            <ShieldCheck size={14} className="text-emerald-500 shrink-0" />
            <span className="truncate">
              {isUrdu ? 'مکمل تصدیق شدہ ریکارڈ' : 'Reconciled Audit Record'}
            </span>
          </span>
          <span className="font-mono text-[11px] font-bold shrink-0 whitespace-nowrap">
            {isUrdu ? '100% حساب مکمل' : '100% Settled'}
          </span>
        </div>
      </GlassCard>
    </TiltCard>
  )

  // Reusable Current Active Cycle Card Content (hosts the interactive Equation Animation)
  const currentCardGlow =
    mathStep === 4 && isPlayingEquation === false && equationPlayCount > 0 && isImprovedBalance
      ? 'green'
      : 'indigo'

  const renderCurrentCard = ({ forCarousel = false } = {}) => (
    <TiltCard
      restingRotateY={forCarousel ? 0 : isRtl ? 4 : -4}
      restingScale={1}
      restingZ={forCarousel ? 0 : 18}
      maxTilt={7}
      dimmed={false}
      onClick={() => setElevatedCard(2)}
      className="cursor-pointer"
    >
      <GlassCard
        glow={currentCardGlow}
        interactive
        className="p-5 sm:p-6 flex flex-col justify-between"
      >
        {/* Header + Inline "Show me how" trigger */}
        <div className="flex items-start justify-between gap-2 pb-3.5 border-b border-indigo-500/15 dark:border-indigo-400/20">
          <div className="min-w-0">
            <span className="text-[10px] font-mono uppercase font-extrabold tracking-wider text-indigo-600 dark:text-indigo-300 block">
              {isUrdu ? 'موجودہ فعال سائیکل' : 'CURRENT ACTIVE CYCLE'}
            </span>
            <h4 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight mt-0.5 truncate">
              {translateMonth(currName, lang)}
            </h4>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
            <span className="px-2.5 py-1 rounded-full text-[11px] font-black bg-indigo-600 text-white shadow-xs whitespace-nowrap">
              {isUrdu ? 'موجودہ' : 'Live Active'}
            </span>
            <span
              className={`px-2.5 py-1 rounded-full text-[11px] font-black whitespace-nowrap border ${
                isCurrSurplus
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35'
              }`}
            >
              {isUrdu
                ? isCurrSurplus
                  ? 'سرپلس'
                  : 'خسارہ'
                : isCurrSurplus
                ? 'Surplus'
                : 'Deficit'}
            </span>
          </div>
        </div>

        {/* Step 1: Opening Balance Chip glides in */}
        <motion.div
          key={`open-chip-${equationPlayCount}-${mathStep === 1}`}
          initial={
            shouldReduceMotion
              ? { opacity: 1 }
              : mathStep === 1
              ? { opacity: 0, x: isRtl ? 36 : -36, scale: 0.92 }
              : { opacity: 1, x: 0, scale: 1 }
          }
          animate={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 22 }}
          className={`mt-3.5 px-3.5 py-2.5 rounded-2xl border flex items-center justify-between gap-2 transition-all duration-300 ${
            mathStep === 1
              ? 'bg-indigo-500/15 border-indigo-400/70 ring-2 ring-indigo-400/40 shadow-md'
              : 'bg-white/60 dark:bg-white/[0.05] border-slate-200/70 dark:border-white/10'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="size-6 rounded-lg bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 flex items-center justify-center text-[11px] font-black shrink-0">
              1
            </span>
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate">
              {isUrdu ? 'ابتدائی بیلنس (گزشتہ سے منتقل)' : 'Opening Balance (from prior closing)'}
            </span>
          </div>
          <AnimatedNumber
            value={currOpening}
            from={mathStep === 1 ? 0 : currOpening}
            prefix={displayCurrency}
            signBeforeNumber
            duration={0.6}
            triggerKey={`open-${equationPlayCount}-${mathStep}`}
            className={`text-xs sm:text-sm font-black shrink-0 ${
              currOpening >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          />
        </motion.div>

        {/* Core Metric Rows on Current Card */}
        <div className="space-y-2.5 pt-2.5">
          {/* Step 2: + Monthly Collection Row with Glass Coin Stack Drop-In */}
          <div
            className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 ${
              mathStep === 2
                ? 'bg-emerald-500/14 border-emerald-400/70 ring-2 ring-emerald-400/40 shadow-md'
                : 'bg-white/75 dark:bg-white/[0.07] border-indigo-200/60 dark:border-white/12'
            }`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                  <Wallet size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 block truncate">
                    {isUrdu ? '+ ماہانہ وصولی' : '+ Monthly Collection'}
                  </span>
                </div>
                <CoinStackVisual mode="inflow" active={mathStep === 2} />
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <AnimatedNumber
                  value={currCollection}
                  from={mathStep === 2 ? 0 : inView ? 0 : currCollection}
                  prefix={displayCurrency}
                  showPlus={mathStep === 2}
                  duration={0.85}
                  triggerKey={`col-${replayKey}-${equationPlayCount}-${mathStep === 2 ? 'step2' : 'rest'}`}
                  className="text-sm sm:text-base md:text-lg font-black text-emerald-700 dark:text-emerald-300"
                />
                {/* Single-line Variance Pill */}
                <motion.span
                  key={`pill-col-${replayKey}`}
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                  initial={shouldReduceMotion ? {} : { scale: 0.9 }}
                  animate={shouldReduceMotion ? {} : { scale: [1, 1.12, 1] }}
                  transition={{ duration: 0.45, delay: 0.35 }}
                  className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-black px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 border ${
                    isCollectionUp
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35'
                  }`}
                >
                  {isCollectionUp ? <ArrowUp size={11} /> : <ArrowDown size={11} />}
                  <span>
                    {isCollectionUp ? '+' : '-'}
                    {collectionPctNum.toFixed(1)}%
                  </span>
                </motion.span>
              </div>
            </div>
          </div>

          {/* Step 3: − Total Expenses Row with Flying Outflow Coins */}
          <div
            className={`p-3 sm:p-3.5 rounded-2xl border transition-all duration-300 ${
              mathStep === 3
                ? 'bg-rose-500/14 border-rose-400/70 ring-2 ring-rose-400/40 shadow-md'
                : 'bg-white/75 dark:bg-white/[0.07] border-indigo-200/60 dark:border-white/12'
            }`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="size-8 rounded-xl bg-rose-500/15 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                  <TrendingDown size={16} />
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 truncate">
                  {isUrdu ? '− کل اخراجات' : '− Total Expenses'}
                </span>
                <CoinStackVisual mode="outflow" active={mathStep === 3} />
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <AnimatedNumber
                  value={mathStep === 3 ? -currExpenses : currExpenses}
                  from={mathStep === 3 ? 0 : inView ? 0 : currExpenses}
                  prefix={displayCurrency}
                  signBeforeNumber={mathStep !== 3}
                  duration={0.85}
                  delay={0.05}
                  triggerKey={`exp-${replayKey}-${equationPlayCount}-${mathStep === 3 ? 'step3' : 'rest'}`}
                  className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-slate-100"
                />
                {/* Single-line Variance Pill (green when saved!) */}
                <motion.span
                  key={`pill-exp-${replayKey}`}
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                  initial={shouldReduceMotion ? {} : { scale: 0.9 }}
                  animate={shouldReduceMotion ? {} : { scale: [1, 1.12, 1] }}
                  transition={{ duration: 0.45, delay: 0.45 }}
                  className={`inline-flex items-center gap-0.5 text-[11px] font-mono font-black px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 border ${
                    !isExpenseUp
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35'
                  }`}
                >
                  {expenseDiff < 0 ? <ArrowDown size={11} /> : <ArrowUp size={11} />}
                  <span>
                    {expenseDiff < 0 ? '-' : '+'}
                    {expensePctNum.toFixed(1)}%
                  </span>
                </motion.span>
              </div>
            </div>
          </div>

          {/* Step 4 (and intermediate running chip for Steps 1-3): Closing / Running Balance */}
          <motion.div
            key={`closing-${equationPlayCount}-${mathStep}`}
            animate={
              mathStep === 4 && !shouldReduceMotion
                ? {
                    scale: [1, 1.02, 1],
                  }
                : {}
            }
            transition={{ duration: 0.55, ease: 'easeOut' }}
            className={`p-3.5 rounded-2xl border transition-all duration-300 ${
              mathStep === 4 && isImprovedBalance
                ? 'bg-emerald-500/12 border-emerald-400/70 ring-2 ring-emerald-400/35 shadow-[0_8px_24px_-6px_rgba(16,185,129,0.35)]'
                : mathStep < 4
                ? 'bg-indigo-500/12 border-indigo-400/60 ring-2 ring-indigo-400/30'
                : 'bg-indigo-500/10 border-indigo-300/60 dark:border-indigo-400/25'
            }`}
          >
            <div className="flex items-center justify-between gap-2 flex-wrap sm:flex-nowrap">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`size-8 rounded-xl flex items-center justify-center shrink-0 ${
                    mathStep === 4 && isImprovedBalance
                      ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                      : 'bg-indigo-500/15 text-indigo-600 dark:text-indigo-300'
                  }`}
                >
                  <Calculator size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-100 block truncate">
                    {mathStep < 4
                      ? isUrdu
                        ? 'جاری بیلنس (حساب جاری)'
                        : 'Running Balance'
                      : isUrdu
                      ? 'اختتامی بیلنس'
                      : 'Closing Balance'}
                  </span>
                  {currCctv > 0 && mathStep >= 3 && (
                    <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 block">
                      {isUrdu ? `کیپیکس: -${displayCurrency} ${fmtInt(currCctv)}` : `Includes CapEx: -${displayCurrency} ${fmtInt(currCctv)}`}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 ml-auto">
                <AnimatedNumber
                  value={runningBalanceValue}
                  from={runningBalanceFrom}
                  prefix={displayCurrency}
                  signBeforeNumber
                  duration={0.85}
                  triggerKey={`bal-${replayKey}-${equationPlayCount}-${mathStep}`}
                  className={`text-sm sm:text-base md:text-lg font-black ${
                    runningBalanceValue >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : isImprovedBalance && mathStep === 4
                      ? 'text-emerald-600 dark:text-emerald-300'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                />
                {/* Recovery / Variance Single-Line Pill */}
                <span
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                  className={`inline-flex items-center gap-1 text-[11px] font-mono font-black px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 border ${
                    balanceDiff >= 0
                      ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35'
                      : 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35'
                  }`}
                >
                  {balanceDiff >= 0 ? '+' : '-'}
                  {displayCurrency} {fmtInt(balanceDiff)}
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sub-bar */}
        <div className="mt-4 pt-3 border-t border-indigo-500/20 flex items-center justify-between gap-2 text-xs font-medium">
          <span className="text-slate-500 dark:text-slate-400 truncate">
            {isUrdu ? 'ماہانہ خالص تبدیلی:' : 'Net MoM Variance:'}
          </span>
          <span
            className={`font-black font-mono flex items-center gap-1.5 whitespace-nowrap ${
              isFavorableVariance
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {isFavorableVariance ? (
              <>
                <TrendingUp size={14} />
                <span>{isUrdu ? 'بہتر کیش فلو ریکوری' : 'Favorable Recovery'}</span>
              </>
            ) : (
              <>
                <TrendingDown size={14} />
                <span>{isUrdu ? 'اضافی خسارہ' : 'Higher Deficit'}</span>
              </>
            )}
          </span>
        </div>
      </GlassCard>
    </TiltCard>
  )

  return (
    <section ref={sectionRef} className="w-full my-8">
      {/* ─── Header, VS Badge, Mobile Tabs & Global Replay Button ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 mb-5 px-1">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="size-10 rounded-2xl bg-gradient-to-tr from-indigo-600 via-teal-500 to-emerald-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <ArrowLeftRight size={20} className="stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {isUrdu
                  ? 'ماہانہ تقابلی جائزہ (3D موازنہ)'
                  : 'Month-over-Month 3D Comparison'}
              </h3>
              <span className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 border border-indigo-400/35 whitespace-nowrap">
                {translateMonth(prevName, lang).toUpperCase()}{' '}
                {isUrdu ? 'بمقابلہ' : 'VS'}{' '}
                {translateMonth(currName, lang).toUpperCase()}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              {isUrdu
                ? 'آمدن، اخراجات اور اختتامی بیلنس کی تبدیلی کا مرحلہ وار 3D مظاہرہ'
                : 'Watch how opening balance, collections, and expenses combine into this month’s balance'}
            </p>
          </div>
        </div>

        {/* Right Controls: Section Replay Button + Mobile Mode Pills */}
        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          {/* Mobile View Switcher (keeps ?compare= URL synced; includes Carousel option) */}
          <div className="flex lg:hidden items-center p-1 rounded-2xl bg-white/70 dark:bg-white/[0.07] backdrop-blur-md border border-slate-200/80 dark:border-white/12 shadow-xs overflow-x-auto max-w-full">
            {[
              { id: 'split', label: isUrdu ? 'اسٹیک 3D' : 'Stack', icon: Layers },
              { id: 'carousel', label: isUrdu ? 'سوائپ' : 'Swipe', icon: Sparkles },
              { id: 'prev', label: translateMonth(prevName, lang).split(' ')[0] },
              { id: 'current', label: translateMonth(currName, lang).split(' ')[0] },
            ].map((tab) => {
              const Icon = tab.icon
              const active = mobileTab === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleMobileTabChange(tab.id)}
                  className={`min-h-[44px] px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1 whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {Icon && <Icon size={13} />}
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={handleReplayAll}
            className="min-h-[44px] px-3.5 py-2 rounded-2xl bg-white/70 hover:bg-white/95 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] border border-slate-200/80 dark:border-white/15 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw size={14} className="text-indigo-600 dark:text-indigo-300" />
            <span>{isUrdu ? 'دوبارہ دیکھیں' : 'Replay'}</span>
          </button>
        </div>
      </div>

      {/* ─── Desktop Perspective Stage (lg+) ─── */}
      <div className="hidden lg:block relative">
        {/* Animated Connecting Beam Arcs (SVG behind cards, linking Prev row -> Delta -> Curr row) */}
        <svg
          key={`beams-${replayKey}`}
          aria-hidden="true"
          viewBox="0 0 1200 320"
          preserveAspectRatio="none"
          className="pointer-events-none absolute inset-0 w-full h-full z-0 opacity-75"
        >
          <defs>
            <linearGradient id="beamCollectionGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.15" />
              <stop offset="50%" stopColor="#10b981" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.25" />
            </linearGradient>
            <linearGradient id="beamExpenseGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={!isExpenseUp ? '#10b981' : '#f43f5e'} stopOpacity="0.15" />
              <stop offset="50%" stopColor={!isExpenseUp ? '#10b981' : '#f43f5e'} stopOpacity="0.85" />
              <stop offset="100%" stopColor={!isExpenseUp ? '#10b981' : '#f43f5e'} stopOpacity="0.25" />
            </linearGradient>
          </defs>

          {/* Collection Beam */}
          <motion.path
            d="M 380 120 C 520 90, 680 90, 820 125"
            fill="none"
            stroke="url(#beamCollectionGrad)"
            strokeWidth="2.5"
            strokeDasharray="6 6"
            initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 0.9, delay: 0.35, ease: 'easeOut' }}
          />
          {/* Expense Beam */}
          <motion.path
            d="M 380 195 C 520 225, 680 225, 820 200"
            fill="none"
            stroke="url(#beamExpenseGrad)"
            strokeWidth="2.5"
            strokeDasharray="6 6"
            initial={shouldReduceMotion ? { pathLength: 1 } : { pathLength: 0, opacity: 0 }}
            animate={inView ? { pathLength: 1, opacity: 1 } : {}}
            transition={{ duration: 0.9, delay: 0.48, ease: 'easeOut' }}
          />
        </svg>

        {/* 3-Column 3D Grid */}
        <div
          style={{ perspective: 1400 }}
          className="relative z-10 grid grid-cols-[1fr_auto_1fr] items-center gap-6"
        >
          {/* Left: Previous Cycle Card slides in from left */}
          <motion.div
            key={`prev-desk-${replayKey}`}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: isRtl ? 44 : -44 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderPreviousCard()}
          </motion.div>

          {/* Center: Delta Capsule rises up */}
          <DeltaCapsule
            variant="desktop"
            collectionDiff={collectionDiff}
            collectionPct={collectionPctNum}
            isCollectionUp={isCollectionUp}
            expenseDiff={expenseDiff}
            expensePct={expensePctNum}
            isExpenseUp={isExpenseUp}
            balanceDiff={balanceDiff}
            displayCurrency={displayCurrency}
            isUrdu={isUrdu}
            onReplay={handleReplayAll}
            replayKey={replayKey}
            inView={inView}
          />

          {/* Right: Current Cycle Card slides in from right */}
          <motion.div
            key={`curr-desk-${replayKey}`}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: isRtl ? -44 : 44 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.55, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          >
            {renderCurrentCard()}
          </motion.div>
        </div>
      </div>

      {/* ─── Mobile / Tablet Stage (< lg) ─── */}
      <div className="lg:hidden relative">
        {mobileTab === 'carousel' ? (
          /* Swipe-Left / Right Snap Carousel Alternative */
          <div className="space-y-3">
            <DeltaCapsule
              variant="mobile"
              collectionDiff={collectionDiff}
              collectionPct={collectionPctNum}
              isCollectionUp={isCollectionUp}
              expenseDiff={expenseDiff}
              expensePct={expensePctNum}
              isExpenseUp={isExpenseUp}
              balanceDiff={balanceDiff}
              displayCurrency={displayCurrency}
              isUrdu={isUrdu}
              onReplay={handleReplayAll}
              replayKey={replayKey}
              inView={inView}
            />
            <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory no-scrollbar pb-2">
              <div className="w-[88vw] max-w-[420px] shrink-0 snap-center">
                {renderPreviousCard({ forCarousel: true })}
              </div>
              <div className="w-[88vw] max-w-[420px] shrink-0 snap-center">
                {renderCurrentCard({ forCarousel: true })}
              </div>
            </div>
            <p className="text-center text-[11px] font-bold text-slate-400">
              {isUrdu ? '← دونوں مہینوں کا موازنہ دیکھنے کے لیے سوائپ کریں →' : '← Swipe sideways between Previous & Current month →'}
            </p>
          </div>
        ) : (
          /* Vertical Stack: Previous (top, scaled/dimmed) -> Horizontal Delta Capsule -> Current (below) */
          <div className="flex flex-col gap-3.5">
            {mobileTab !== 'current' && (
              <motion.div
                key={`prev-mob-${replayKey}`}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -16 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="scale-[0.97] origin-center"
              >
                {renderPreviousCard()}
              </motion.div>
            )}

            {mobileTab === 'split' && (
              <DeltaCapsule
                variant="mobile"
                collectionDiff={collectionDiff}
                collectionPct={collectionPctNum}
                isCollectionUp={isCollectionUp}
                expenseDiff={expenseDiff}
                expensePct={expensePctNum}
                isExpenseUp={isExpenseUp}
                balanceDiff={balanceDiff}
                displayCurrency={displayCurrency}
                isUrdu={isUrdu}
                onReplay={handleReplayAll}
                replayKey={replayKey}
                inView={inView}
              />
            )}

            {mobileTab !== 'prev' && (
              <motion.div
                key={`curr-mob-${replayKey}`}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 18 }}
                animate={inView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.48, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
              >
                {renderCurrentCard()}
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* ─── Always-Visible Live Equation Bar Under the Cards ─── */}
      <EquationPlayer
        openingBalance={currOpening}
        collection={currCollection}
        expenses={currExpenses}
        cctvExpense={currCctv}
        closingBalance={currBalance}
        isImproved={isImprovedBalance || isFavorableVariance}
        displayCurrency={displayCurrency}
        isUrdu={isUrdu}
        activeStep={mathStep}
        isPlaying={isPlayingEquation}
        playCount={equationPlayCount}
        onShowMeHow={runEquationSequence}
        onSelectStep={handleSelectStep}
      />
    </section>
  )
}

export default MonthComparison3D

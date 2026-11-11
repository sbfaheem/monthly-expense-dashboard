import React, { useState, useEffect, useMemo, useRef } from 'react'
import { motion, AnimatePresence, useInView, useReducedMotion } from 'framer-motion'
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Sparkles,
  Info,
  Play,
  Pause,
  RotateCcw,
  Calculator,
  Compass,
  Layers,
  ChevronDown,
} from 'lucide-react'
import { computeMonthlyVariance } from '../utils/variance'
import { useLanguage } from '../context/LanguageContext'
import { translateItemName, translateMonth } from '../utils/translations'
import { formatNumberPKR } from '../utils/formatters'
import { soundEffects } from '../utils/soundEffects'
import GlassCard from './motion/GlassCard'
import TiltCard from './motion/TiltCard'
import BalanceBlock from './variance/BalanceBlock'
import FlyingChip from './variance/FlyingChip'
import EquationLine from './variance/EquationLine'
import VarianceItemCard from './variance/VarianceItemCard'

export default function MonthlyVarianceBanner({
  selectedMonth,
  allExpenses = [],
  currency = 'PKR',
}) {
  return (
    <MonthlyVarianceBannerInner
      key={selectedMonth || 'default'}
      selectedMonth={selectedMonth}
      allExpenses={allExpenses}
      currency={currency}
    />
  )
}

function MonthlyVarianceBannerInner({
  selectedMonth,
  allExpenses = [],
  currency = 'PKR',
}) {
  const { lang } = useLanguage()
  const isUrdu = lang === 'ur'
  const displayCurrency = isUrdu ? 'روپے' : currency
  const shouldReduceMotion = useReducedMotion()

  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.08 })
  const hasAutoPlayedRef = useRef(false)

  // Multi-month baseline override ("vs. September 2026" segmented selector)
  const [selectedBaselineMonth, setSelectedBaselineMonth] = useState(null)

  const variance = useMemo(() => {
    return computeMonthlyVariance(
      selectedMonth,
      allExpenses,
      currency,
      selectedBaselineMonth
    )
  }, [selectedMonth, allExpenses, currency, selectedBaselineMonth])

  // Interactive & Math Player states
  const [replayKey, setReplayKey] = useState(0)
  const [stepIndex, setStepIndex] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackSpeed, setPlaybackSpeed] = useState(1) // 1 or 0.5
  const [settledFlashKey, setSettledFlashKey] = useState(0)

  // Linked hover/focus + single-open receipt + "Other small changes" drawer
  const [linkedHighlightKey, setLinkedHighlightKey] = useState(null)
  const [expandedItemKey, setExpandedItemKey] = useState(null)
  const [showOtherBreakdown, setShowOtherBreakdown] = useState(false)

  // Mobile (< md) segmented swipe tabs + opt-in 3D gyro
  const [mobileTab, setMobileTab] = useState('increases') // 'increases' | 'reductions'
  const [mobileFlipDir, setMobileFlipDir] = useState(1)
  const [gyroEnabled, setGyroEnabled] = useState(false)
  const [isMobileViewport, setIsMobileViewport] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const check = () => setIsMobileViewport(window.innerWidth < 640)
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  // Build ordered timeline steps from real computed variance data
  const mathSteps = useMemo(() => {
    if (!variance || !variance.hasPriorData) return []

    const list = []
    let running = Math.round(variance.totalPrior)
    let stackedCount = 0

    // Step 0: Starting prior month pedestal block
    list.push({
      key: '__start__',
      type: 'start',
      phase: 'start',
      name: variance.priorMonth,
      amount: running,
      prevRunningTotal: 0,
      runningTotal: running,
      stackedIncreaseCount: 0,
    })

    // Phase 1: Increases stack ON TOP as red glass coin discs
    variance.increases.forEach((item) => {
      const prevRunning = running
      const delta = Math.round(item.diff)
      running += delta
      stackedCount += 1
      list.push({
        key: `inc-${item.name}`,
        type: 'increase',
        phase: 'increase',
        name: item.name,
        amount: delta,
        prevRunningTotal: prevRunning,
        runningTotal: running,
        stackedIncreaseCount: stackedCount,
        isNew: item.isNew,
        isEliminated: false,
      })
    })

    // Phase 2: Reductions peel off (or dissolve for -100.0% Shifted/Removed)
    variance.reductions.forEach((item) => {
      const prevRunning = running
      const delta = Math.round(item.diff) // negative
      running += delta
      list.push({
        key: `red-${item.name}`,
        type: 'reduction',
        phase: 'reduction',
        name: item.name,
        amount: delta,
        prevRunningTotal: prevRunning,
        runningTotal: running,
        stackedIncreaseCount: 0,
        isEliminated: item.isEliminated,
        statusTag: item.statusTag,
        movedToCategory: item.movedToCategory,
      })
    })

    // Phase 3: Remainder bucket so arithmetic matches to the exact rupee
    if (variance.otherDiff !== 0 || variance.otherCount > 0) {
      const prevRunning = running
      const remainder = Math.round(variance.totalCurrent) - prevRunning
      running = Math.round(variance.totalCurrent)
      list.push({
        key: '__other__',
        type: 'other',
        phase: 'other',
        name: 'Other small changes',
        otherCount: variance.otherCount,
        otherItems: variance.otherItems,
        amount: remainder,
        prevRunningTotal: prevRunning,
        runningTotal: running,
        stackedIncreaseCount: 0,
      })
    }

    // Final Phase: Settled total matching current month
    const settledTotal = Math.round(variance.totalCurrent)
    list.push({
      key: '__settled__',
      type: 'settled',
      phase: 'settled',
      name: variance.currentMonth,
      amount: 0,
      prevRunningTotal: running,
      runningTotal: settledTotal,
      stackedIncreaseCount: 0,
    })

    return list
  }, [variance])

  const peakTotal = useMemo(() => {
    if (!mathSteps.length) return 0
    return Math.max(...mathSteps.map((s) => s.runningTotal || 0))
  }, [mathSteps])

  // Derived playback flags (respects prefers-reduced-motion synchronously without effect cascades)
  const effectiveIsPlaying = !shouldReduceMotion && isPlaying
  const safeIdx = shouldReduceMotion
    ? Math.max(0, mathSteps.length - 1)
    : Math.min(stepIndex, Math.max(0, mathSteps.length - 1))

  // Trigger auto-play ONCE on first scroll into view; respect prefers-reduced-motion cleanly
  useEffect(() => {
    if (!variance?.hasPriorData || !mathSteps.length || shouldReduceMotion) return
    if (!inView || hasAutoPlayedRef.current) return

    hasAutoPlayedRef.current = true
    const timer = setTimeout(() => {
      setStepIndex(0)
      setIsPlaying(true)
    }, 280)
    return () => clearTimeout(timer)
  }, [inView, shouldReduceMotion, variance?.hasPriorData, mathSteps.length])

  // Timeline playback ticker (cancels cleanly on unmount / pause / baseline change)
  useEffect(() => {
    if (!effectiveIsPlaying || !mathSteps.length || stepIndex >= mathSteps.length - 1) {
      return
    }

    const curr = mathSteps[stepIndex]
    const baseMs = curr?.phase === 'start' ? 880 : 1050
    const delayMs = playbackSpeed === 0.5 ? Math.round(baseMs * 1.8) : baseMs

    const id = setTimeout(() => {
      const next = Math.min(mathSteps.length - 1, stepIndex + 1)
      setStepIndex(next)
      if (next >= mathSteps.length - 1) {
        setIsPlaying(false)
        setSettledFlashKey((k) => k + 1)
      }
    }, delayMs)

    return () => clearTimeout(id)
  }, [effectiveIsPlaying, stepIndex, mathSteps, playbackSpeed])

  if (!variance) return null

  // Fallback card when no prior baseline exists (e.g. Initial Financial Record)
  if (!variance.hasPriorData) {
    return (
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
      >
        <GlassCard
          glow="indigo"
          className="rounded-3xl p-5 sm:p-6 flex items-center gap-4 border border-indigo-200/70 dark:border-white/15"
        >
          <div className="size-11 sm:size-12 rounded-2xl bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 flex items-center justify-center shrink-0">
            <Info size={22} />
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
              {isUrdu
                ? `ابتدائی مالیاتی ریکارڈ: ${translateMonth(selectedMonth, 'ur')}`
                : `Initial Financial Record: ${selectedMonth}`}
            </h4>
            <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300 mt-1">
              {isUrdu
                ? 'یہ ابتدائی ریکارڈ ہے۔ اگلے مہینوں کا تقابلی جائزہ خودکار طور پر ظاہر ہوگا۔'
                : 'This is the starting ledger cycle. Month-over-month variance analytics will compare subsequent months automatically.'}
            </p>
          </div>
        </GlassCard>
      </motion.div>
    )
  }

  const activeStep = mathSteps[safeIdx] || mathSteps[mathSteps.length - 1]
  const activePhase = activeStep?.phase || 'settled'
  const isTotalIncrease = variance.totalDiff > 0
  const isNeutral = variance.totalDiff === 0
  const isSettledNow = activePhase === 'settled'

  // Play/Replay helper triggered cleanly by user button click
  const handleStartHowWeGotHere = () => {
    soundEffects.playBounce()
    setExpandedItemKey(null)
    setShowOtherBreakdown(false)
    setLinkedHighlightKey(null)
    if (shouldReduceMotion) {
      setStepIndex(Math.max(0, mathSteps.length - 1))
      setIsPlaying(false)
      setSettledFlashKey((k) => k + 1)
      return
    }
    setReplayKey((k) => k + 1)
    setStepIndex(0)
    setIsPlaying(true)
  }

  const handlePlayPause = () => {
    soundEffects.playBounce()
    if (shouldReduceMotion) {
      setStepIndex(Math.max(0, mathSteps.length - 1))
      setIsPlaying(false)
      return
    }
    if (effectiveIsPlaying) {
      setIsPlaying(false)
    } else {
      if (safeIdx >= mathSteps.length - 1) {
        setReplayKey((k) => k + 1)
        setStepIndex(0)
      }
      setIsPlaying(true)
    }
  }

  const handleToggleSpeed = () => {
    soundEffects.playBounce()
    setPlaybackSpeed((s) => (s === 1 ? 0.5 : 1))
  }

  const handleBaselineSwitch = (monthStr) => {
    if (!monthStr || monthStr === variance.priorMonth) return
    soundEffects.playBounce()
    setSelectedBaselineMonth(monthStr)
    setExpandedItemKey(null)
    setLinkedHighlightKey(null)
    setShowOtherBreakdown(false)
    setReplayKey((k) => k + 1)
    if (shouldReduceMotion) {
      setIsPlaying(false)
    } else {
      setStepIndex(0)
      setIsPlaying(true)
    }
  }

  const handleSelectChip = (step, idx) => {
    soundEffects.playBounce()
    setIsPlaying(false)
    setStepIndex(idx)

    if (step.type === 'other') {
      setShowOtherBreakdown((v) => !v)
      setLinkedHighlightKey('__other__')
      return
    }

    setShowOtherBreakdown(false)
    if (step.name) {
      setLinkedHighlightKey(step.name)
      setExpandedItemKey((prev) => (prev === step.name ? null : step.name))
      // Automatically switch mobile tab if resident tapped an item in the opposite bucket
      const targetTab = step.type === 'increase' ? 'increases' : 'reductions'
      if (targetTab !== mobileTab) {
        setMobileFlipDir(targetTab === 'reductions' ? 1 : -1)
        setMobileTab(targetTab)
      }
    }
  }

  const handleSelectEquationPhase = (phaseKey) => {
    soundEffects.playBounce()
    setIsPlaying(false)
    const idx = mathSteps.findIndex((s) => s.phase === phaseKey)
    if (idx !== -1) {
      setStepIndex(idx)
    }
    if (phaseKey === 'other') {
      setShowOtherBreakdown(true)
    }
    if (phaseKey === 'settled') {
      setSettledFlashKey((k) => k + 1)
    }
  }

  const handleToggleCardExpand = (itemName) => {
    soundEffects.playBounce()
    setExpandedItemKey((prev) => (prev === itemName ? null : itemName))
    setLinkedHighlightKey(itemName)
  }

  const handleMobileTabClick = (nextTab) => {
    if (nextTab === mobileTab) return
    soundEffects.playBounce()
    setMobileFlipDir(nextTab === 'reductions' ? 1 : -1)
    setMobileTab(nextTab)
  }

  const handleMobileSwipeEnd = (_e, info) => {
    const absX = Math.abs(info.offset.x)
    const absY = Math.abs(info.offset.y)
    if (absX < 46 || absX < absY * 1.2) return
    const swipeLeft = info.offset.x < 0
    if (swipeLeft && mobileTab === 'increases') {
      handleMobileTabClick('reductions')
    } else if (!swipeLeft && mobileTab === 'reductions') {
      handleMobileTabClick('increases')
    }
  }

  const handleToggleGyro = async () => {
    soundEffects.playBounce()
    if (!gyroEnabled && typeof DeviceOrientationEvent !== 'undefined' && typeof DeviceOrientationEvent.requestPermission === 'function') {
      try {
        const res = await DeviceOrientationEvent.requestPermission()
        if (res !== 'granted') return
      } catch {
        return
      }
    }
    setGyroEnabled((g) => !g)
  }

  // Highlight state for panels & chips
  const activeStepName = activeStep?.name || null
  const isIncreaseHighlighted = (name) =>
    linkedHighlightKey === name ||
    (effectiveIsPlaying && activeStep?.type === 'increase' && activeStepName === name)
  const isReductionHighlighted = (name) =>
    linkedHighlightKey === name ||
    (effectiveIsPlaying && activeStep?.type === 'reduction' && activeStepName === name)

  const hasActiveIncreaseCard = variance.increases.some((i) => isIncreaseHighlighted(i.name) || expandedItemKey === i.name)
  const hasActiveReductionCard = variance.reductions.some((i) => isReductionHighlighted(i.name) || expandedItemKey === i.name)

  // Baseline switcher pills (up to 3 concise pills + select overflow if more)
  const segmentedBaselines = (variance.availableBaselines || []).slice(0, 3)
  const extraBaselines = (variance.availableBaselines || []).slice(3)

  // Item steps for the Math Player track (increases, reductions, and remainder)
  const chipSteps = mathSteps
    .map((s, originalIndex) => ({ step: s, originalIndex }))
    .filter((entry) => entry.step.type === 'increase' || entry.step.type === 'reduction' || entry.step.type === 'other')

  const getChipState = (originalIndex) => {
    if (shouldReduceMotion || safeIdx >= mathSteps.length - 1) return 'done'
    if (safeIdx === originalIndex) return 'active'
    if (safeIdx > originalIndex) return 'done'
    return 'pending'
  }

  const formatShortMonthLabel = (mStr) => {
    if (!mStr) return ''
    const parts = mStr.split(' ')
    const mon = parts[0] || ''
    const yr = parts[1] || ''
    if (isUrdu) return `${translateMonth(mon, 'ur')} ${yr}`
    return `${mon.slice(0, 3)} ${yr}`
  }

  return (
    <motion.section
      ref={sectionRef}
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <GlassCard
        glow="none"
        className="rounded-3xl p-3 sm:p-6 lg:p-7 overflow-hidden border border-white/75 dark:border-white/12 space-y-5"
      >
        {/* Ambient decorative gradient accents behind frosted glass */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-10 -right-10 size-52 rounded-full bg-gradient-to-br from-emerald-400/12 via-indigo-400/10 to-rose-400/10 blur-2xl"
        />

        {/* ================================================================= */}
        {/* 1. HEADER BAR: Title + Segmented Baseline Control + Show Me How + Synced Net Pill */}
        {/* ================================================================= */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-900/[0.06] dark:border-white/[0.08]">
          {/* Left: Icon, Heading & Segmented "vs. Month" Switcher */}
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <motion.div
              whileHover={shouldReduceMotion ? {} : { rotate: 10, scale: 1.06 }}
              transition={{ type: 'spring', damping: 16, stiffness: 280 }}
              className="size-11 sm:size-12 rounded-2xl bg-gradient-to-tr from-primary to-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-600/25 shrink-0"
            >
              <Sparkles size={21} />
            </motion.div>

            <div className="min-w-0 space-y-1.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-xl lg:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                  {isUrdu ? 'اس ماہ کیا تبدیل ہوا؟' : 'What Changed This Month?'}
                </h3>

                {/* Baseline Month Segmented Control (when multiple prior months exist) */}
                {variance.availableBaselines && variance.availableBaselines.length > 1 ? (
                  <div
                    role="group"
                    aria-label={isUrdu ? 'موازنہ کا مہینہ منتخب کریں' : 'Baseline month comparison'}
                    className="inline-flex flex-wrap items-center gap-1 p-1 rounded-2xl bg-slate-200/65 dark:bg-white/[0.06] border border-slate-300/60 dark:border-white/10"
                  >
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-600 dark:text-slate-300 px-1.5 whitespace-nowrap">
                      {isUrdu ? 'بمقابلہ' : 'vs.'}
                    </span>
                    {segmentedBaselines.map((mStr) => {
                      const active = mStr === variance.priorMonth
                      return (
                        <button
                          key={mStr}
                          type="button"
                          onClick={() => handleBaselineSwitch(mStr)}
                          aria-pressed={active}
                          className={`min-h-[36px] sm:min-h-[30px] px-2.5 py-1 rounded-xl text-[11px] sm:text-xs font-extrabold transition-all cursor-pointer whitespace-nowrap ${
                            active
                              ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs border border-indigo-400/50'
                              : 'text-slate-700 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-white/10 border border-transparent'
                          }`}
                        >
                          {formatShortMonthLabel(mStr)}
                        </button>
                      )
                    })}

                    {extraBaselines.length > 0 && (
                      <select
                        aria-label={isUrdu ? 'مزید مہینے' : 'More comparison months'}
                        value={
                          extraBaselines.includes(variance.priorMonth) ? variance.priorMonth : ''
                        }
                        onChange={(e) => e.target.value && handleBaselineSwitch(e.target.value)}
                        className="min-h-[36px] sm:min-h-[30px] px-2 py-1 rounded-xl text-[11px] font-bold bg-transparent text-slate-700 dark:text-slate-200 focus:outline-none cursor-pointer"
                      >
                        <option value="" disabled>
                          {isUrdu ? 'مزید...' : 'More...'}
                        </option>
                        {extraBaselines.map((mStr) => (
                          <option key={mStr} value={mStr} className="text-slate-900 bg-white">
                            {formatShortMonthLabel(mStr)}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                ) : (
                  <span className="text-xs sm:text-sm font-extrabold px-3 py-1 rounded-full bg-white/75 dark:bg-white/[0.08] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-white/12 whitespace-nowrap">
                    {isUrdu
                      ? `بمقابلہ ${translateMonth(variance.priorMonth, 'ur')}`
                      : `vs. ${variance.priorMonth}`}
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-300">
                {isUrdu
                  ? 'جانیں گزشتہ ماہ کا خرچ کس طرح جمع اور تفریق ہو کر اس ماہ کا مجموعہ بنا'
                  : 'See step-by-step how last month’s total became this month’s spend'}
              </p>
            </div>
          </div>

          {/* Right: "Show me how" button + Synced Total Reduction / Increase Pill */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <motion.button
              type="button"
              onClick={handleStartHowWeGotHere}
              whileHover={shouldReduceMotion ? {} : { scale: 1.03 }}
              whileTap={shouldReduceMotion ? {} : { scale: 0.97 }}
              className="min-h-[44px] px-3.5 sm:px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-extrabold flex items-center gap-1.5 shadow-md shadow-indigo-600/25 cursor-pointer whitespace-nowrap transition-colors"
            >
              <Calculator size={15} className="shrink-0" />
              <span>{isUrdu ? 'طریقہ دیکھیں' : 'Show me how'}</span>
            </motion.button>

            <motion.div
              key={`net-pill-${settledFlashKey}`}
              initial={false}
              animate={
                isSettledNow && settledFlashKey > 0 && !shouldReduceMotion
                  ? { scale: [1, 1.04, 1] }
                  : { scale: 1 }
              }
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className={`min-h-[44px] px-3.5 sm:px-4 py-2 rounded-2xl border-2 flex items-center gap-2 text-xs sm:text-sm font-black shadow-xs transition-all duration-300 ${
                isNeutral
                  ? 'bg-slate-100/90 dark:bg-slate-800 text-slate-800 dark:text-slate-100 border-slate-300'
                  : isTotalIncrease
                  ? `bg-rose-50/90 dark:bg-rose-950/45 text-rose-900 dark:text-rose-100 border-rose-300 dark:border-rose-700/60 ${
                      isSettledNow && settledFlashKey > 0
                        ? 'ring-2 ring-rose-400/50 shadow-[0_0_24px_-4px_rgba(244,63,94,0.45)]'
                        : ''
                    }`
                  : `bg-emerald-50/90 dark:bg-emerald-950/45 text-emerald-950 dark:text-emerald-100 border-emerald-300 dark:border-emerald-700/60 ${
                      isSettledNow && settledFlashKey > 0
                        ? 'ring-2 ring-emerald-400/60 shadow-[0_0_26px_-4px_rgba(16,185,129,0.5)]'
                        : ''
                    }`
              }`}
            >
              {isTotalIncrease ? (
                <ArrowUpRight size={17} className="text-rose-700 dark:text-rose-300 stroke-[2.75] shrink-0" />
              ) : (
                <ArrowDownRight size={17} className="text-emerald-700 dark:text-emerald-300 stroke-[2.75] shrink-0" />
              )}
              <span className="flex items-center gap-1.5 flex-wrap">
                <span>
                  {isTotalIncrease
                    ? isUrdu
                      ? 'کل اضافہ:'
                      : 'Total Increase:'
                    : isUrdu
                    ? 'کل بچت:'
                    : 'Total Reduction:'}
                </span>
                <span
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                  className="inline-flex items-center gap-1 font-numeric tabular-nums whitespace-nowrap"
                >
                  <span dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                    {isTotalIncrease ? '+' : '-'}
                  </span>
                  <span dir={isUrdu ? 'rtl' : 'ltr'}>{displayCurrency}</span>
                  <span dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                    {formatNumberPKR(variance.totalDiff)}
                  </span>
                  {variance.totalPct !== null && variance.totalPct !== undefined && (
                    <span
                      dir="ltr"
                      style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                      className="opacity-90"
                    >
                      ({isTotalIncrease ? '+' : ''}
                      {variance.totalPct}%)
                    </span>
                  )}
                </span>
              </span>
            </motion.div>
          </div>
        </div>

        {/* ================================================================= */}
        {/* 2. "HOW WE GOT HERE" LIVE MATH PLAYER STRIP                       */}
        {/* ================================================================= */}
        <div className="relative z-10 rounded-3xl glass-surface border border-white/80 dark:border-white/12 p-3 sm:p-5 space-y-4">
          {/* Player Controls Row */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2 min-w-0">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-indigo-500/12 text-indigo-800 dark:text-indigo-200 border border-indigo-400/30 whitespace-nowrap">
                <Layers size={12} />
                <span>{isUrdu ? 'حساب کیسے بنا' : 'How We Got Here'}</span>
              </span>
              <span className="text-xs font-bold text-slate-600 dark:text-slate-300 font-numeric tabular-nums whitespace-nowrap">
                {isUrdu
                  ? `مرحلہ ${safeIdx + 1} / ${mathSteps.length}`
                  : `Step ${safeIdx + 1} / ${mathSteps.length}`}
              </span>
            </div>

            {/* Play / Pause, Replay, 1x / 0.5x Speed */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={handlePlayPause}
                aria-label={effectiveIsPlaying ? 'Pause math animation' : 'Play math animation'}
                className="min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white dark:bg-white/[0.08] dark:hover:bg-white/[0.15] border border-slate-200/80 dark:border-white/15 text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                {effectiveIsPlaying ? <Pause size={13} /> : <Play size={13} />}
                <span>
                  {effectiveIsPlaying
                    ? isUrdu
                      ? 'روکیں'
                      : 'Pause'
                    : isUrdu
                    ? 'چلائیں'
                    : 'Play'}
                </span>
              </button>

              <button
                type="button"
                onClick={handleStartHowWeGotHere}
                aria-label="Replay math animation"
                className="min-h-[44px] sm:min-h-[36px] px-3 py-1.5 rounded-xl bg-white/80 hover:bg-white dark:bg-white/[0.08] dark:hover:bg-white/[0.15] border border-slate-200/80 dark:border-white/15 text-xs font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-1.5 cursor-pointer transition-colors"
              >
                <RotateCcw size={13} className="text-indigo-600 dark:text-indigo-300" />
                <span>{isUrdu ? 'دوبارہ' : 'Replay'}</span>
              </button>

              <button
                type="button"
                onClick={handleToggleSpeed}
                aria-label="Toggle playback speed"
                className="min-h-[44px] sm:min-h-[36px] min-w-[48px] px-2.5 py-1.5 rounded-xl bg-slate-900/5 hover:bg-slate-900/10 dark:bg-white/[0.08] dark:hover:bg-white/[0.15] border border-slate-200/80 dark:border-white/15 text-xs font-black font-numeric tabular-nums text-slate-800 dark:text-slate-100 cursor-pointer transition-colors"
              >
                {playbackSpeed === 1 ? '1x' : '0.5x'}
              </button>
            </div>
          </div>

          {/* Stage Grid:
              - On Mobile (< sm): Compact side-by-side waterfall (compact BalanceBlock left + chips stack right)
              - On Desktop (sm+): Architecture BalanceBlock pedestal left [220px] + interactive FlyingChip grid right */}
          <div className="flex flex-row sm:grid sm:grid-cols-12 gap-3 sm:gap-4 items-stretch">
            {/* BalanceBlock column */}
            <div className="shrink-0 sm:col-span-4 lg:col-span-3 flex">
              <div className="block sm:hidden w-full">
                <BalanceBlock
                  phase={activePhase}
                  priorMonth={variance.priorMonth}
                  currentMonth={variance.currentMonth}
                  totalPrior={variance.totalPrior}
                  totalCurrent={variance.totalCurrent}
                  runningTotal={activeStep?.runningTotal ?? variance.totalCurrent}
                  prevRunningTotal={activeStep?.prevRunningTotal ?? variance.totalPrior}
                  activeStep={activeStep}
                  stackedIncreaseCount={activeStep?.stackedIncreaseCount ?? 0}
                  peakTotal={peakTotal}
                  displayCurrency={displayCurrency}
                  isUrdu={isUrdu}
                  compact
                  replayKey={replayKey}
                  stepIndex={safeIdx}
                />
              </div>

              <div className="hidden sm:flex w-full">
                <BalanceBlock
                  phase={activePhase}
                  priorMonth={variance.priorMonth}
                  currentMonth={variance.currentMonth}
                  totalPrior={variance.totalPrior}
                  totalCurrent={variance.totalCurrent}
                  runningTotal={activeStep?.runningTotal ?? variance.totalCurrent}
                  prevRunningTotal={activeStep?.prevRunningTotal ?? variance.totalPrior}
                  activeStep={activeStep}
                  stackedIncreaseCount={activeStep?.stackedIncreaseCount ?? 0}
                  peakTotal={peakTotal}
                  displayCurrency={displayCurrency}
                  isUrdu={isUrdu}
                  compact={false}
                  replayKey={replayKey}
                  stepIndex={safeIdx}
                />
              </div>
            </div>

            {/* Interactive Step Chips Track */}
            <div className="min-w-0 flex-1 sm:col-span-8 lg:col-span-9 flex flex-col justify-between gap-2.5">
              {/* Group Chips: Desktop 2 columns when space allows, vertical compact stack on mobile */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                {chipSteps.map(({ step, originalIndex }) => {
                  const chipState = getChipState(originalIndex)
                  const isHighlighted =
                    Boolean(linkedHighlightKey) &&
                    (linkedHighlightKey === step.name ||
                      (step.type === 'other' && linkedHighlightKey === '__other__'))
                  return (
                    <FlyingChip
                      key={step.key}
                      step={step}
                      state={chipState}
                      isLinkedHighlighted={isHighlighted}
                      isMobile={isMobileViewport}
                      displayCurrency={displayCurrency}
                      isUrdu={isUrdu}
                      onSelect={() => handleSelectChip(step, originalIndex)}
                      onHoverItem={(name) => setLinkedHighlightKey(name || '__other__')}
                      onLeaveItem={() => setLinkedHighlightKey(null)}
                    />
                  )
                })}
              </div>

              {/* Optional Collapsible "Other small changes" Breakdown Drawer */}
              <AnimatePresence initial={false}>
                {showOtherBreakdown && variance.otherItems && variance.otherItems.length > 0 && (
                  <motion.div
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden"
                  >
                    <div className="rounded-2xl bg-slate-100/90 dark:bg-slate-900/80 border border-slate-300/70 dark:border-white/15 p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-black text-slate-700 dark:text-slate-200">
                        <span>
                          {isUrdu
                            ? `دیگر معمولی تبدیلیاں (${variance.otherCount})`
                            : `Other small changes (${variance.otherCount} remaining line items)`}
                        </span>
                        <button
                          type="button"
                          onClick={() => setShowOtherBreakdown(false)}
                          className="min-h-[40px] sm:min-h-[32px] px-2 inline-flex items-center gap-1 text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:text-white cursor-pointer"
                        >
                          <ChevronDown size={14} className="rotate-180" />
                          <span>{isUrdu ? 'بند' : 'Hide'}</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {variance.otherItems.map((oi) => (
                          <div
                            key={oi.name}
                            className="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-xl bg-white/85 dark:bg-slate-800/80 text-xs"
                          >
                            <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                              {isUrdu ? translateItemName(oi.name, 'ur') : oi.name}
                            </span>
                            <span
                              dir="ltr"
                              style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                              className={`font-black font-numeric tabular-nums whitespace-nowrap ${
                                oi.diff > 0
                                  ? 'text-rose-700 dark:text-rose-300'
                                  : 'text-emerald-700 dark:text-emerald-300'
                              }`}
                            >
                              {oi.diff > 0 ? '+' : '−'} {displayCurrency} {formatNumberPKR(oi.diff)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Live Arithmetic Equation Line beneath stage */}
          <EquationLine
            priorMonth={variance.priorMonth}
            currentMonth={variance.currentMonth}
            totalPrior={variance.totalPrior}
            increasesSum={variance.increasesShownSum}
            reductionsSum={variance.reductionsShownSum}
            otherDiff={variance.otherDiff}
            otherCount={variance.otherCount}
            totalCurrent={variance.totalCurrent}
            activePhase={activePhase}
            isUrdu={isUrdu}
            onSelectPhase={handleSelectEquationPhase}
          />
        </div>

        {/* ================================================================= */}
        {/* 3A. DESKTOP PANELS (md+): Tilted Red Increases vs Emerald Reductions */}
        {/* ================================================================= */}
        <div className="hidden md:grid md:grid-cols-2 gap-5 relative z-10">
          {/* Largest Increases (Rose frosted TiltCard) */}
          <TiltCard
            restingRotateY={isUrdu ? -4 : 4}
            restingRotateX={1}
            maxTilt={6}
            className="h-full"
          >
            <GlassCard
              glow={hasActiveIncreaseCard ? 'red' : 'none'}
              className="h-full rounded-3xl p-5 bg-rose-50/55 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-400/20 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-rose-900 dark:text-rose-200 flex items-center gap-2">
                  <TrendingUp size={16} className="text-rose-700 dark:text-rose-300 stroke-[2.5]" />
                  <span>{isUrdu ? 'سب سے زیادہ اضافہ' : 'Largest Increases'}</span>
                </span>
                <span className="text-xs font-black text-rose-800 dark:text-rose-200 bg-rose-200/70 dark:bg-rose-900/55 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  {variance.increases.length} {isUrdu ? 'شعبے' : 'items'}
                </span>
              </div>

              {variance.increases.length === 0 ? (
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 py-4 text-center italic">
                  {isUrdu ? 'کوئی اضافہ درج نہیں ہوا۔' : 'No expense increases recorded.'}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {variance.increases.map((item, idx) => (
                    <VarianceItemCard
                      key={`desk-inc-${item.name}`}
                      item={item}
                      index={idx}
                      type="increase"
                      priorMonth={variance.priorMonth}
                      currentMonth={variance.currentMonth}
                      displayCurrency={displayCurrency}
                      isUrdu={isUrdu}
                      inView={inView}
                      replayKey={replayKey}
                      isExpanded={expandedItemKey === item.name}
                      isLinkedActive={isIncreaseHighlighted(item.name)}
                      onToggleExpand={handleToggleCardExpand}
                      onHoverItem={(name) => setLinkedHighlightKey(name)}
                      onLeaveItem={() => setLinkedHighlightKey(null)}
                    />
                  ))}
                </div>
              )}
            </GlassCard>
          </TiltCard>

          {/* Largest Reductions & Savings (Emerald frosted TiltCard) */}
          <TiltCard
            restingRotateY={isUrdu ? 4 : -4}
            restingRotateX={1}
            maxTilt={6}
            className="h-full"
          >
            <GlassCard
              glow={hasActiveReductionCard ? 'green' : 'none'}
              className="h-full rounded-3xl p-5 bg-emerald-50/55 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-400/20 space-y-3"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs sm:text-sm font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200 flex items-center gap-2">
                  <TrendingDown size={16} className="text-emerald-700 dark:text-emerald-300 stroke-[2.5]" />
                  <span>{isUrdu ? 'سب سے زیادہ بچت اور کمی' : 'Largest Reductions & Savings'}</span>
                </span>
                <span className="text-xs font-black text-emerald-900 dark:text-emerald-200 bg-emerald-200/70 dark:bg-emerald-900/55 px-2.5 py-0.5 rounded-full whitespace-nowrap">
                  {variance.reductions.length} {isUrdu ? 'شعبے' : 'items'}
                </span>
              </div>

              {variance.reductions.length === 0 ? (
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 py-4 text-center italic">
                  {isUrdu ? 'کوئی کمی درج نہیں ہوئی۔' : 'No expense reductions recorded.'}
                </p>
              ) : (
                <div className="space-y-2.5">
                  {variance.reductions.map((item, idx) => (
                    <VarianceItemCard
                      key={`desk-red-${item.name}`}
                      item={item}
                      index={idx}
                      type="reduction"
                      priorMonth={variance.priorMonth}
                      currentMonth={variance.currentMonth}
                      displayCurrency={displayCurrency}
                      isUrdu={isUrdu}
                      inView={inView}
                      replayKey={replayKey}
                      isExpanded={expandedItemKey === item.name}
                      isLinkedActive={isReductionHighlighted(item.name)}
                      onToggleExpand={handleToggleCardExpand}
                      onHoverItem={(name) => setLinkedHighlightKey(name)}
                      onLeaveItem={() => setLinkedHighlightKey(null)}
                    />
                  ))}
                </div>
              )}
            </GlassCard>
          </TiltCard>
        </div>

        {/* ================================================================= */}
        {/* 3B. MOBILE VIEW (< md): Swipeable Two-Tab 3D Card Flip + Gyro Opt-in */}
        {/* ================================================================= */}
        <div className="block md:hidden relative z-10 space-y-3">
          {/* Two-tab Switcher (>= 44px touch targets) + Optional 3D Gyro Toggle */}
          <div className="flex items-center justify-between gap-2">
            <div
              role="tablist"
              aria-label={isUrdu ? 'تبدیلیوں کی اقسام' : 'Expense change tabs'}
              className="flex-1 grid grid-cols-2 gap-1 p-1 rounded-2xl bg-slate-200/70 dark:bg-white/[0.07] border border-slate-300/60 dark:border-white/12"
            >
              <button
                type="button"
                role="tab"
                aria-selected={mobileTab === 'increases'}
                onClick={() => handleMobileTabClick('increases')}
                className={`min-h-[44px] px-1.5 sm:px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                  mobileTab === 'increases'
                    ? 'bg-rose-500 text-white shadow-sm'
                    : 'text-slate-800 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10'
                }`}
              >
                <TrendingUp size={13} className="shrink-0" />
                <span className="whitespace-nowrap">
                  {isUrdu ? 'اضافہ' : 'Increases'} ({variance.increases.length})
                </span>
              </button>

              <button
                type="button"
                role="tab"
                aria-selected={mobileTab === 'reductions'}
                onClick={() => handleMobileTabClick('reductions')}
                className={`min-h-[44px] px-1.5 sm:px-2.5 py-2 rounded-xl text-[11px] sm:text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer whitespace-nowrap ${
                  mobileTab === 'reductions'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-800 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10'
                }`}
              >
                <TrendingDown size={13} className="shrink-0" />
                <span className="whitespace-nowrap">
                  {isUrdu ? 'بچت' : 'Reductions'} ({variance.reductions.length})
                </span>
              </button>
            </div>

            {/* Optional Opt-In 3D Gyro Tilt Toggle (small touch target >= 44px) */}
            <button
              type="button"
              onClick={handleToggleGyro}
              aria-pressed={gyroEnabled}
              title={isUrdu ? '3D جائرو جھکاؤ' : 'Toggle 3D Gyro tilt'}
              className={`min-h-[44px] min-w-[44px] px-2.5 rounded-2xl border flex items-center justify-center gap-1 text-[11px] font-black cursor-pointer transition-colors shrink-0 ${
                gyroEnabled
                  ? 'bg-indigo-600 text-white border-indigo-500 shadow-sm'
                  : 'bg-white/80 dark:bg-white/[0.08] text-slate-700 dark:text-slate-200 border-slate-300/70 dark:border-white/12'
              }`}
            >
              <Compass size={15} />
              <span className="hidden xs:inline">3D</span>
            </button>
          </div>

          {/* Swipeable 3D Flip Card Stage */}
          <div style={{ perspective: 1100 }} className="w-full">
            <AnimatePresence mode="wait" custom={mobileFlipDir}>
              {mobileTab === 'increases' ? (
                <motion.div
                  key="mob-tab-increases"
                  custom={mobileFlipDir}
                  initial={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, rotateY: mobileFlipDir * -70, scale: 0.96 }
                  }
                  animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                  exit={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, rotateY: mobileFlipDir * 70, scale: 0.96 }
                  }
                  transition={{ duration: shouldReduceMotion ? 0.18 : 0.34, ease: [0.22, 1, 0.36, 1] }}
                  onPanEnd={handleMobileSwipeEnd}
                  style={{ transformStyle: 'preserve-3d', willChange: 'transform, opacity' }}
                  className="[touch-action:pan-y]"
                >
                  <TiltCard
                    restingRotateY={0}
                    mobileMaxTilt={2.5}
                    enableDeviceOrientation={gyroEnabled}
                  >
                    <GlassCard
                      glow={hasActiveIncreaseCard ? 'red' : 'none'}
                      className="rounded-3xl p-2.5 sm:p-3.5 bg-rose-50/55 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-400/20 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                          <TrendingUp size={15} className="text-rose-700 dark:text-rose-300" />
                          <span>{isUrdu ? 'سب سے زیادہ اضافہ' : 'Largest Increases'}</span>
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          {isUrdu ? 'بچت کے لیے سوائپ کریں' : 'Swipe → Reductions'}
                        </span>
                      </div>

                      {variance.increases.length === 0 ? (
                        <p className="text-sm font-bold text-slate-500 py-4 text-center italic">
                          {isUrdu ? 'کوئی اضافہ درج نہیں ہوا۔' : 'No expense increases recorded.'}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {variance.increases.map((item, idx) => (
                            <VarianceItemCard
                              key={`mob-inc-${item.name}`}
                              item={item}
                              index={idx}
                              type="increase"
                              priorMonth={variance.priorMonth}
                              currentMonth={variance.currentMonth}
                              displayCurrency={displayCurrency}
                              isUrdu={isUrdu}
                              inView={inView}
                              replayKey={replayKey}
                              isExpanded={expandedItemKey === item.name}
                              isLinkedActive={isIncreaseHighlighted(item.name)}
                              isMobileCompact
                              onToggleExpand={handleToggleCardExpand}
                            />
                          ))}
                        </div>
                      )}
                    </GlassCard>
                  </TiltCard>
                </motion.div>
              ) : (
                <motion.div
                  key="mob-tab-reductions"
                  custom={mobileFlipDir}
                  initial={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, rotateY: mobileFlipDir * 70, scale: 0.96 }
                  }
                  animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                  exit={
                    shouldReduceMotion
                      ? { opacity: 0 }
                      : { opacity: 0, rotateY: mobileFlipDir * -70, scale: 0.96 }
                  }
                  transition={{ duration: shouldReduceMotion ? 0.18 : 0.34, ease: [0.22, 1, 0.36, 1] }}
                  onPanEnd={handleMobileSwipeEnd}
                  style={{ transformStyle: 'preserve-3d', willChange: 'transform, opacity' }}
                  className="[touch-action:pan-y]"
                >
                  <TiltCard
                    restingRotateY={0}
                    mobileMaxTilt={2.5}
                    enableDeviceOrientation={gyroEnabled}
                  >
                    <GlassCard
                      glow={hasActiveReductionCard ? 'green' : 'none'}
                      className="rounded-3xl p-2.5 sm:p-3.5 bg-emerald-50/55 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-400/20 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-wider text-emerald-950 dark:text-emerald-200 flex items-center gap-1.5">
                          <TrendingDown size={15} className="text-emerald-700 dark:text-emerald-300" />
                          <span>{isUrdu ? 'سب سے زیادہ بچت اور کمی' : 'Largest Reductions & Savings'}</span>
                        </span>
                        <span className="text-[11px] font-bold text-slate-600 dark:text-slate-300">
                          {isUrdu ? 'اضافہ ← سوائپ کریں' : 'Increases ← Swipe'}
                        </span>
                      </div>

                      {variance.reductions.length === 0 ? (
                        <p className="text-sm font-bold text-slate-500 py-4 text-center italic">
                          {isUrdu ? 'کوئی کمی درج نہیں ہوئی۔' : 'No expense reductions recorded.'}
                        </p>
                      ) : (
                        <div className="space-y-2">
                          {variance.reductions.map((item, idx) => (
                            <VarianceItemCard
                              key={`mob-red-${item.name}`}
                              item={item}
                              index={idx}
                              type="reduction"
                              priorMonth={variance.priorMonth}
                              currentMonth={variance.currentMonth}
                              displayCurrency={displayCurrency}
                              isUrdu={isUrdu}
                              inView={inView}
                              replayKey={replayKey}
                              isExpanded={expandedItemKey === item.name}
                              isLinkedActive={isReductionHighlighted(item.name)}
                              isMobileCompact
                              onToggleExpand={handleToggleCardExpand}
                            />
                          ))}
                        </div>
                      )}
                    </GlassCard>
                  </TiltCard>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </GlassCard>
    </motion.section>
  )
}

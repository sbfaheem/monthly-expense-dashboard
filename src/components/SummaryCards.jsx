import React, { useState, useEffect, useRef } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import RollingOdometer from './RollingOdometer'

// ================= ZERO-DEPENDENCY PROCEDURAL SOUND ENGINE =================
const playProceduralSound = (type = 'surplus', isMuted = false) => {
  if (isMuted || typeof window === 'undefined') return
  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) return
    const ctx = new AudioContextClass()
    if (ctx.state === 'suspended') ctx.resume()
    const now = ctx.currentTime

    if (type === 'bounce') {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.setValueAtTime(280, now)
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.08)
      gain.gain.setValueAtTime(0.25, now)
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08)
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start(now)
      osc.stop(now + 0.09)
    } else if (type === 'surplus') {
      const notes = [523.25, 659.25, 783.99, 1046.50]
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        osc.type = 'sine'
        osc.frequency.setValueAtTime(freq, now + idx * 0.07)
        gain.gain.setValueAtTime(0.001, now + idx * 0.07)
        gain.gain.exponentialRampToValueAtTime(0.16, now + idx * 0.07 + 0.03)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.07 + 0.42)
        osc.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + idx * 0.07)
        osc.stop(now + idx * 0.07 + 0.45)
      })
    } else if (type === 'deficit') {
      const tones = [
        { freq: 164.81, time: 0.0, dur: 0.22 },
        { freq: 130.81, time: 0.18, dur: 0.32 }
      ]
      tones.forEach((t) => {
        const osc = ctx.createOscillator()
        const gain = ctx.createGain()
        const filter = ctx.createBiquadFilter()
        osc.type = 'triangle'
        osc.frequency.setValueAtTime(t.freq, now + t.time)
        filter.type = 'lowpass'
        filter.frequency.setValueAtTime(420, now)
        gain.gain.setValueAtTime(0.001, now + t.time)
        gain.gain.exponentialRampToValueAtTime(0.14, now + t.time + 0.04)
        gain.gain.exponentialRampToValueAtTime(0.0001, now + t.time + t.dur)
        osc.connect(filter)
        filter.connect(gain)
        gain.connect(ctx.destination)
        osc.start(now + t.time)
        osc.stop(now + t.time + t.dur + 0.05)
      })
    }
  } catch (e) {
    // Graceful audio fallback
  }
}

export const SummaryCards = ({
  openingBalance = 0,
  monthlyCollection = 0,
  totalExpense = 0,
  saving = 0,
  totalSaving = 0,
  netCashFlow,
  status,
  closingBalance,
  isOverdrawn,
  currency = 'PKR',
  isNoData = false
}) => {
  const { lang, t, isRtl } = useLanguage ? useLanguage() : { lang: 'en', t: {}, isRtl: false }
  const shouldReduceMotion = useReducedMotion()

  // Views & Card state
  const [is3DDeckView, setIs3DDeckView] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('dashboard_cards_view')
      if (stored) return stored === '3d'
    }
    return false // Default to the 5-card Classic Grid as in user screenshot
  })
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(false)
  const [showRipple, setShowRipple] = useState(false)
  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashboard_sound_muted') === 'true'
    }
    return false
  })

  const lastAdvanceRef = useRef(0)

  const isUrdu = lang === 'ur'
  const displayCurrency = isUrdu ? 'روپے' : currency
  const fmt = (n) => Number(n || 0).toLocaleString('en-PK')

  // Financial calculations
  const actualNetCashFlow = typeof netCashFlow === 'number' ? netCashFlow : Number(saving || 0)
  const actualStatus = status || (actualNetCashFlow >= 0 ? 'Surplus' : 'Deficit')
  const actualClosing = typeof closingBalance === 'number' ? closingBalance : Number(totalSaving || 0)
  const actualOverdrawn = typeof isOverdrawn === 'boolean' ? isOverdrawn : actualClosing < 0
  const isSurplus = actualNetCashFlow >= 0

  const safeOpening = Number(openingBalance || 0)
  const openingStr = (safeOpening < 0 ? '-' : '') + fmt(Math.abs(safeOpening))

  const cards = [
    {
      id: 'opening',
      label: t?.openingBalance || 'Opening Balance',
      value: openingStr,
      note: isNoData ? '0%' : (isUrdu ? 'گزشتہ اختتامی' : 'Previous closing'),
      icon: 'account_balance',
      iconColor: 'text-slate-400 dark:text-slate-500',
      noteIcon: 'trending_flat',
      noteColor: 'text-slate-500 dark:text-slate-400',
      valueColor: 'text-slate-900 dark:text-slate-100',
      accentBorder: 'border-slate-300 dark:border-slate-700',
      badgeBg: 'bg-slate-700 text-white',
      gradient: 'from-slate-500/10 via-slate-50/40 dark:via-slate-950/20 to-white dark:to-slate-900',
      cardClass: 'bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 shadow-sm'
    },
    {
      id: 'collection',
      label: t?.monthlyCollection || 'Monthly Collection',
      value: fmt(monthlyCollection),
      note: isNoData ? '0%' : (isUrdu ? 'رہائشیوں سے وصولی' : 'Resident collections'),
      icon: 'payments',
      iconColor: 'text-orange-500',
      noteIcon: 'receipt_long',
      noteColor: 'text-slate-500 dark:text-slate-400',
      valueColor: 'text-slate-900 dark:text-slate-100',
      accentBorder: 'border-orange-500',
      badgeBg: 'bg-orange-500 text-white',
      gradient: 'from-orange-500/10 via-orange-50/40 dark:via-orange-950/20 to-white dark:to-slate-900',
      cardClass: 'bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 border-l-4 border-l-orange-500 shadow-sm'
    },
    {
      id: 'expense',
      label: t?.totalExpense || 'Total Expense',
      value: fmt(totalExpense),
      note: isNoData ? '0%' : (isUrdu ? 'کل آپریشنل اخراجات' : 'Total operational spend'),
      icon: 'shopping_cart',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      noteIcon: 'receipt',
      noteColor: 'text-emerald-700 dark:text-emerald-400 font-semibold',
      valueColor: 'text-slate-900 dark:text-slate-100',
      accentBorder: 'border-emerald-600',
      badgeBg: 'bg-emerald-600 text-white',
      gradient: 'from-emerald-500/10 via-emerald-50/40 dark:via-emerald-950/20 to-white dark:to-slate-900',
      cardClass: 'bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 border-l-4 border-l-emerald-600 shadow-sm'
    },
    {
      id: 'cashflow',
      label: isSurplus ? (t?.netSurplus || 'Net Surplus') : (t?.netDeficit || 'Net Deficit'),
      value: fmt(Math.abs(actualNetCashFlow)),
      note: isNoData ? '0%' : (isSurplus 
        ? (isUrdu ? 'بچت (+ مثبت کیش فلو)' : 'Surplus (+ Cash Flow)') 
        : (isUrdu ? 'خسارہ (- منفی کیش فلو)' : 'Deficit (- Net Outflow)')),
      icon: isSurplus ? 'trending_up' : 'trending_down',
      iconColor: isSurplus ? 'text-emerald-500' : 'text-rose-500',
      noteIcon: isSurplus ? 'check_circle' : 'warning',
      noteColor: isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
      valueColor: isSurplus ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
      accentBorder: isSurplus ? 'border-teal-500' : 'border-rose-500',
      badgeBg: isSurplus ? 'bg-teal-600 text-white' : 'bg-rose-600 text-white',
      gradient: isSurplus 
        ? 'from-teal-500/10 via-teal-50/40 dark:via-teal-950/20 to-white dark:to-slate-900' 
        : 'from-rose-500/15 via-rose-50/60 dark:via-rose-950/30 to-white dark:to-slate-900',
      cardClass: isSurplus 
        ? 'bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 border-l-4 border-l-emerald-500 shadow-sm' 
        : '!bg-rose-50/70 dark:!bg-rose-950/20 !border-rose-200/90 dark:!border-rose-900/50 border-l-4 !border-l-rose-500 shadow-sm'
    },
    {
      id: 'closing',
      label: !actualOverdrawn 
        ? (t?.closingBalance || 'Closing Reserve Fund') 
        : (isUrdu ? `${t?.closingBalance || 'اختتامی ریزرو فنڈ'}\n(${t?.overdrawn || 'خسارہ'})` : 'Closing Reserve Fund\n(Overdrawn)'),
      value: fmt(Math.abs(actualClosing)),
      note: isNoData ? '0%' : (!actualOverdrawn 
        ? (isUrdu ? 'جمع شدہ محفوظ فنڈ' : 'Accumulated Reserve') 
        : (isUrdu ? 'خسارہ / بقایا جات' : 'Overdrawn / Deficit')),
      icon: 'account_balance_wallet',
      iconColor: !actualOverdrawn ? 'text-emerald-500' : 'text-rose-500',
      noteIcon: !actualOverdrawn ? 'stars' : 'warning',
      noteColor: !actualOverdrawn ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400',
      valueColor: !actualOverdrawn ? 'text-slate-900 dark:text-slate-100' : 'text-rose-600 dark:text-rose-400',
      accentBorder: !actualOverdrawn ? 'border-emerald-500' : 'border-rose-500',
      badgeBg: !actualOverdrawn ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white',
      gradient: !actualOverdrawn 
        ? 'from-emerald-500/10 via-emerald-50/40 dark:via-emerald-950/20 to-white dark:to-slate-900' 
        : 'from-rose-500/15 via-rose-50/60 dark:via-rose-950/30 to-white dark:to-slate-900',
      cardClass: !actualOverdrawn 
        ? 'bg-white dark:bg-slate-800 border border-slate-200/90 dark:border-slate-700 border-l-4 border-l-emerald-500 shadow-sm' 
        : '!bg-rose-50/70 dark:!bg-rose-950/20 !border-rose-200/90 dark:!border-rose-900/50 border-l-4 !border-l-rose-600 shadow-sm'
    }
  ]

  const toggleSound = () => {
    const next = !isMuted
    setIsMuted(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem('dashboard_sound_muted', String(next))
    }
    if (!next) {
      playProceduralSound(isSurplus ? 'surplus' : 'deficit', false)
    }
  }

  // ================= GUARANTEED ADVANCE DISPATCHER =================
  const advanceToNextCard = (e) => {
    if (e) {
      if (typeof e.stopPropagation === 'function') e.stopPropagation()
      if (typeof e.preventDefault === 'function') e.preventDefault()
    }

    const now = Date.now()
    if (now - lastAdvanceRef.current < 250) return
    lastAdvanceRef.current = now

    // Shockwave ripple
    setShowRipple(true)
    setTimeout(() => setShowRipple(false), 400)

    // Tactile bounce audio
    playProceduralSound('bounce', isMuted)

    // Advance index
    setActiveCardIndex((prev) => {
      const nextIdx = (prev + 1) % cards.length
      playProceduralSound(isSurplus ? 'surplus' : 'deficit', isMuted)
      return nextIdx
    })
  }

  // Auto-play loop
  useEffect(() => {
    let timer
    if (isAutoPlay && is3DDeckView) {
      timer = setTimeout(() => {
        advanceToNextCard()
      }, 2300)
    }
    return () => clearTimeout(timer)
  }, [isAutoPlay, is3DDeckView, activeCardIndex])

  // Swiping gestures
  const handlePanEnd = (e, info) => {
    if (info.offset.y < -35) {
      advanceToNextCard(e)
    } else if (info.offset.y > 35) {
      if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
      const now = Date.now()
      if (now - lastAdvanceRef.current < 250) return
      lastAdvanceRef.current = now

      setShowRipple(true)
      setTimeout(() => setShowRipple(false), 400)
      playProceduralSound('bounce', isMuted)
      setActiveCardIndex((prev) => (prev - 1 + cards.length) % cards.length)
      playProceduralSound(isSurplus ? 'surplus' : 'deficit', isMuted)
    }
  }

  const handleCardClick = (idx) => {
    if (idx === activeCardIndex) {
      advanceToNextCard()
    } else {
      setActiveCardIndex(idx)
      playProceduralSound(isSurplus ? 'surplus' : 'deficit', isMuted)
    }
  }

  return (
    <div className="w-full my-4">
      {/* View Header & Segmented Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isUrdu ? 'مالیاتی جائزہ (خلاصہ)' : 'Financial Summary'}
          </span>
          {is3DDeckView && (
            <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
              3D Motion
            </span>
          )}
        </div>

        {/* View Switcher, Audio Toggle & Auto-Bounce Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sound FX Toggle Pill */}
          <button
            type="button"
            onClick={toggleSound}
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold transition border ${
              !isMuted
                ? isSurplus
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                  : 'bg-rose-500/20 border-rose-500/50 text-rose-700 dark:text-rose-300 shadow-2xs'
                : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
            }`}
            title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
          >
            <span>{!isMuted ? '🔊' : '🔇'}</span>
            <span>{!isMuted ? (isSurplus ? 'Surplus Audio' : 'Deficit Alert') : 'Muted'}</span>
          </button>

          {/* Auto Bounce Button */}
          {is3DDeckView && (
            <button
              type="button"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition border ${
                isAutoPlay
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-sm animate-pulse'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              <span>{isAutoPlay ? '⏸ Pause' : '▶ Auto Bounce'}</span>
            </button>
          )}

          {/* Dual Segmented View Pill */}
          <div className="inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={() => { setIs3DDeckView(false); setIsAutoPlay(false); if (typeof window !== 'undefined') localStorage.setItem('dashboard_cards_view', 'grid'); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all duration-200 ${
                !is3DDeckView
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <span>▦</span>
              <span>{isUrdu ? 'کلاسک گرڈ' : 'Classic Grid'}</span>
            </button>

            <button
              type="button"
              onClick={() => { setIs3DDeckView(true); if (typeof window !== 'undefined') localStorage.setItem('dashboard_cards_view', '3d'); }}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs transition-all duration-200 ${
                is3DDeckView
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <span>🎴</span>
              <span>{isUrdu ? 'تھری ڈی ڈیک' : '3D Deck'}</span>
            </button>
          </div>
        </div>
      </div>

      {is3DDeckView ? (
        /* ================= 3D REVOLVING DECK VIEW ================= */
        <div className="w-full">
          {/* Quick Category Selector Pills */}
          <div className="flex items-center gap-1.5 mb-2 overflow-x-auto pb-1 scrollbar-none">
            {cards.map((card, i) => (
              <button
                key={card.id}
                type="button"
                onClick={() => handleCardClick(i)}
                className={`px-3 py-1 rounded-full text-xs font-semibold transition-all whitespace-nowrap ${
                  activeCardIndex === i
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm scale-105'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                }`}
              >
                {i + 1}. {card.label.split(' ')[0]}
              </button>
            ))}
          </div>

          <div 
            style={{ perspective: 1200 }}
            className="relative w-full py-4 px-2 overflow-visible min-h-[380px] sm:min-h-[420px] flex items-center justify-center [touch-action:pan-y]"
          >
            {/* Isometric Angled Deck Container */}
            <motion.div
              style={{
                transformStyle: 'preserve-3d',
                rotateX: 16,
                rotateZ: -4,
                rotateY: isRtl ? -10 : 10,
              }}
              className="relative w-full max-w-sm sm:max-w-md mx-auto h-[260px]"
            >
              {/* Cards Stack */}
              {cards.map((card, idx) => {
                const relIndex = (idx - activeCardIndex + cards.length) % cards.length
                const isSelected = relIndex === 0

                const offsetZ = isSelected ? 70 : -relIndex * 24
                const offsetY = isSelected ? -10 : relIndex * 42
                const scale = isSelected ? 1.02 : 1 - relIndex * 0.025
                const cardZIndex = 30 - relIndex

                return (
                  <motion.div
                    key={card.id}
                    onTap={() => handleCardClick(idx)}
                    onPanEnd={handlePanEnd}
                    whileTap={{ scale: 0.985 }}
                    animate={{
                      z: shouldReduceMotion ? 0 : offsetZ,
                      y: shouldReduceMotion ? 0 : offsetY,
                      scale: shouldReduceMotion ? 1 : scale,
                    }}
                    transition={{
                      type: 'spring',
                      stiffness: 300,
                      damping: 26,
                      mass: 0.5,
                    }}
                    style={{
                      transformStyle: 'preserve-3d',
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      zIndex: cardZIndex,
                    }}
                    className="cursor-pointer select-none will-change-transform"
                  >
                    <div
                      className={`rounded-3xl border-2 ${card.accentBorder} bg-gradient-to-b ${card.gradient} p-5 shadow-xl backdrop-blur-md transition-shadow relative overflow-visible`}
                      style={{
                        boxShadow: isSelected
                          ? '0 25px 45px -12px rgba(15, 23, 42, 0.30)'
                          : '0 10px 20px -6px rgba(15, 23, 42, 0.12)',
                      }}
                    >
                      {/* Crisp Vector Typography Layer */}
                      <div 
                        style={{
                          transform: 'translateZ(1px)',
                          WebkitFontSmoothing: 'antialiased',
                          MozOsxFontSmoothing: 'grayscale',
                          textRendering: 'geometricPrecision'
                        }}
                      >
                        {/* Header */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                            {card.label}
                          </span>
                          <div className="flex items-center gap-1.5">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${card.badgeBg}`}>
                              {idx + 1} / {cards.length}
                            </span>
                            <span className={`material-symbols-outlined text-sm ${card.iconColor}`}>
                              {card.icon}
                            </span>
                          </div>
                        </div>

                        {/* Amount with 3D Rolling Odometer */}
                        <div className="my-2">
                          <RollingOdometer
                            value={card.value}
                            prefix={displayCurrency}
                            className={`text-3xl font-extrabold tracking-tight ${card.valueColor}`}
                          />
                        </div>

                        {/* Footer with Active Badge & Bouncing Ball */}
                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60 relative">
                          <span className={`text-xs font-semibold flex items-center gap-1 ${card.noteColor}`}>
                            <span className="material-symbols-outlined text-xs">{card.noteIcon}</span>
                            <span>{card.note}</span>
                          </span>

                          {/* ================= ACTIVE BUTTON WITH CONTINUOUS BOUNCING BALL ================= */}
                          {isSelected ? (
                            <div className="relative flex items-center z-20">
                              {/* Shockwave Ripple */}
                              {showRipple && (
                                <motion.div
                                  initial={{ opacity: 0.9, scale: 0.4 }}
                                  animate={{ opacity: 0, scale: 2 }}
                                  transition={{ duration: 0.4, ease: 'easeOut' }}
                                  className={`pointer-events-none absolute -inset-2 rounded-full border-2 ${
                                    isSurplus ? 'border-emerald-400 bg-emerald-400/30' : 'border-rose-400 bg-rose-400/30'
                                  }`}
                                />
                              )}

                              {/* Clickable Badge Trigger */}
                              <motion.button
                                type="button"
                                aria-label="Advance Card"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.92 }}
                                onTap={advanceToNextCard}
                                onClick={advanceToNextCard}
                                className={`group relative flex items-center gap-2 pl-3 pr-2 py-1 rounded-full border shadow-sm transition-all cursor-pointer pointer-events-auto select-none ${
                                  isSurplus
                                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/25'
                                    : 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-500/25'
                                }`}
                              >
                                <span className="text-xs font-extrabold flex items-center gap-1 pointer-events-none">
                                  <span className="text-[10px]">✦</span>
                                  <span>Active</span>
                                </span>

                                {/* Ball Housing */}
                                <div className="relative size-8 flex items-center justify-center cursor-pointer pointer-events-auto">
                                  {/* Shadow */}
                                  {!shouldReduceMotion && (
                                    <motion.span
                                      animate={{
                                        scale: [1, 0.45, 1],
                                        opacity: [0.65, 0.15, 0.65],
                                      }}
                                      transition={{
                                        duration: 0.85,
                                        repeat: Infinity,
                                        times: [0, 0.5, 1],
                                        ease: 'easeInOut',
                                      }}
                                      className={`absolute bottom-0 inset-x-1 h-1.5 rounded-full blur-[1px] pointer-events-none ${
                                        isSurplus ? 'bg-emerald-900/40' : 'bg-rose-900/40'
                                      }`}
                                    />
                                  )}

                                  {/* CONTINUOUS BOUNCING GLASS BALL */}
                                  <motion.div
                                    animate={shouldReduceMotion ? {} : {
                                      y: [0, -18, 0],
                                      scaleX: [1.22, 0.9, 1.22],
                                      scaleY: [0.8, 1.14, 0.8],
                                    }}
                                    transition={{
                                      duration: 0.85,
                                      repeat: Infinity,
                                      times: [0, 0.5, 1],
                                      ease: ['easeOut', 'easeIn'],
                                    }}
                                    className={`relative size-7 rounded-full border border-white/90 shadow-md backdrop-blur-md flex items-center justify-center cursor-pointer pointer-events-auto ${
                                      isSurplus
                                        ? 'bg-gradient-to-tr from-white/40 via-emerald-200/70 to-white/95'
                                        : 'bg-gradient-to-tr from-white/40 via-rose-200/70 to-white/95'
                                    }`}
                                    style={{
                                      boxShadow: isSurplus
                                        ? '0 6px 16px -2px rgba(16, 185, 129, 0.55), inset 0 2px 4px rgba(255,255,255,0.95)'
                                        : '0 6px 16px -2px rgba(244, 63, 94, 0.55), inset 0 2px 4px rgba(255,255,255,0.95)',
                                    }}
                                  >
                                    <span className="absolute top-0.5 left-1 h-1.5 w-2.5 rounded-full bg-white/90 blur-[0.5px] transform -rotate-25 pointer-events-none" />
                                    <span className={`absolute bottom-0.5 right-1 size-1 rounded-full blur-[0.5px] pointer-events-none ${isSurplus ? 'bg-emerald-400/80' : 'bg-rose-400/80'}`} />
                                  </motion.div>
                                </div>
                              </motion.button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-slate-400 font-medium">
                              {isUrdu ? 'چھو کر دیکھیں' : 'Tap to lift'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </motion.div>
          </div>
        </div>
      ) : (
        /* ================= 100% CRISP 2D CLASSIC GRID ================= */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {cards.map((card) => (
            <div
              key={card.id}
              className={`p-5 rounded-2xl shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between ${card.cardClass}`}
              style={{
                transform: 'none',
                WebkitFontSmoothing: 'antialiased',
                MozOsxFontSmoothing: 'grayscale',
                textRendering: 'optimizeLegibility',
              }}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-600 dark:text-slate-300 text-sm font-medium leading-tight whitespace-pre-line">
                  {card.label}
                </span>
                <span className={`material-symbols-outlined text-xl ${card.iconColor}`}>
                  {card.icon}
                </span>
              </div>

              <div className="my-1">
                <RollingOdometer
                  value={card.value}
                  prefix={displayCurrency}
                  className={`text-2xl font-bold tracking-tight select-all ${card.valueColor}`}
                />
              </div>

              <div className={`mt-2 text-xs font-semibold flex items-center gap-1 ${card.noteColor}`}>
                <span className="material-symbols-outlined text-xs">{card.noteIcon}</span>
                <span>{card.note}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SummaryCards
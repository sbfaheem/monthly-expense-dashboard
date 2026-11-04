import React, { useState, useEffect } from 'react'
import { motion, useAnimation, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'

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
  const [is3DDeckView, setIs3DDeckView] = useState(false) // Defaults to razor-sharp Classic Grid
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const [isBouncing, setIsBouncing] = useState(false)
  const [isAutoPlay, setIsAutoPlay] = useState(false)
  const [showRipple, setShowRipple] = useState(false)

  // Framer Motion Controllers for coordinated physics in 3D mode
  const ballControls = useAnimation()
  const deckControls = useAnimation()

  const isUrdu = lang === 'ur'
  const displayCurrency = isUrdu ? 'روپے' : currency
  const fmt = (n) => Number(n || 0).toLocaleString('en-PK')

  // Financial calculations
  const actualNetCashFlow = typeof netCashFlow === 'number' ? netCashFlow : Number(saving || 0)
  const actualStatus = status || (actualNetCashFlow >= 0 ? 'Surplus' : 'Deficit')
  const actualClosing = typeof closingBalance === 'number' ? closingBalance : Number(totalSaving || 0)
  const actualOverdrawn = typeof isOverdrawn === 'boolean' ? isOverdrawn : actualClosing < 0
  const isSurplus = actualNetCashFlow >= 0

  const cards = [
    {
      id: 'closing',
      label: !actualOverdrawn ? (t?.closingBalance || 'Closing Balance') : `${t?.closingBalance || 'Closing Balance'} (${t?.overdrawn || 'Overdrawn'})`,
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
        ? 'bg-white dark:bg-slate-800 border border-primary/10 border-l-4 border-l-secondary-gold' 
        : '!bg-rose-50 dark:!bg-rose-900/20 !border-rose-200 dark:!border-rose-900/50 border-l-4 !border-l-rose-500'
    },
    {
      id: 'cashflow',
      label: isSurplus ? (t?.netSurplus || 'Monthly Surplus') : (t?.netDeficit || 'Monthly Deficit'),
      value: fmt(Math.abs(actualNetCashFlow)),
      note: isNoData ? '0%' : (isSurplus 
        ? (isUrdu ? 'بچت (+ مثبت کیش فلو)' : 'Surplus (+ Cash Flow)') 
        : (isUrdu ? 'خسارہ (- منفی کیش فلو)' : 'Deficit (- Net Outflow)')),
      icon: isSurplus ? 'savings' : 'trending_down',
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
        ? 'bg-white dark:bg-slate-800 border border-primary/10 border-l-4 border-l-emerald-500' 
        : '!bg-rose-50 dark:!bg-rose-950/20 !border-rose-200 dark:!border-rose-900 border-l-4 !border-l-rose-500'
    },
    {
      id: 'collection',
      label: t?.monthlyCollection || 'Monthly Collection',
      value: fmt(monthlyCollection),
      note: isNoData ? '0%' : (isUrdu ? 'رہائشیوں سے وصولی' : 'Resident collections'),
      icon: 'payments',
      iconColor: 'text-orange-500',
      noteIcon: 'receipt_long',
      noteColor: 'text-slate-500',
      valueColor: 'text-slate-900 dark:text-slate-100',
      accentBorder: 'border-orange-500',
      badgeBg: 'bg-orange-500 text-white',
      gradient: 'from-orange-500/10 via-orange-50/40 dark:via-orange-950/20 to-white dark:to-slate-900',
      cardClass: 'bg-white dark:bg-slate-800 border border-primary/10 border-l-4 border-l-orange-500'
    },
    {
      id: 'expense',
      label: t?.totalExpense || 'Total Expense',
      value: fmt(totalExpense),
      note: isNoData ? '0%' : (isUrdu ? 'کل آپریشنل اخراجات' : 'Total operational spend'),
      icon: 'shopping_cart',
      iconColor: 'text-primary',
      noteIcon: 'receipt',
      noteColor: 'text-primary',
      valueColor: 'text-slate-900 dark:text-slate-100',
      accentBorder: 'border-blue-500',
      badgeBg: 'bg-blue-600 text-white',
      gradient: 'from-blue-500/10 via-blue-50/40 dark:via-blue-950/20 to-white dark:to-slate-900',
      cardClass: 'bg-white dark:bg-slate-800 border border-primary/10 border-l-4 border-l-primary'
    },
    {
      id: 'opening',
      label: t?.openingBalance || 'Opening Balance',
      value: fmt(openingBalance),
      note: isNoData ? '0%' : (isUrdu ? 'گزشتہ اختتامی' : 'Previous closing'),
      icon: 'account_balance',
      iconColor: 'text-slate-400',
      noteIcon: 'trending_flat',
      noteColor: 'text-slate-400',
      valueColor: 'text-slate-900 dark:text-slate-100',
      accentBorder: 'border-slate-400',
      badgeBg: 'bg-slate-700 text-white',
      gradient: 'from-slate-500/10 via-slate-50/40 dark:via-slate-950/20 to-white dark:to-slate-900',
      cardClass: 'bg-white dark:bg-slate-800 border border-primary/10'
    },
  ]

  // ================= 3D BALL BOUNCE PHYSICS ENGINE =================
  const triggerBallBounce = async () => {
    if (isBouncing || shouldReduceMotion) return
    setIsBouncing(true)

    // Phase 1: Ball arcs down toward the card surface
    await ballControls.start({
      y: 95,
      x: isRtl ? 35 : -35,
      scaleX: 0.9,
      scaleY: 1.18,
      transition: { duration: 0.32, ease: [0.45, 0, 0.75, 1] }
    })

    // Phase 2: Impact moment on card!
    setShowRipple(true)
    setActiveCardIndex((prev) => (prev + 1) % cards.length)

    await Promise.all([
      ballControls.start({
        y: 104,
        scaleX: 1.35,
        scaleY: 0.65,
        transition: { duration: 0.08 }
      }),
      deckControls.start({
        rotateX: 22,
        y: 12,
        transition: { duration: 0.08 }
      })
    ])

    setShowRipple(false)

    // Phase 3: Ball rebounds back up into the air & card snaps back
    await Promise.all([
      ballControls.start({
        y: [104, 20, 38, 0],
        x: [isRtl ? 35 : -35, isRtl ? 15 : -15, isRtl ? 5 : -5, 0],
        scaleX: [1.35, 0.95, 1.04, 1],
        scaleY: [0.65, 1.15, 0.96, 1],
        transition: { duration: 0.52, ease: "easeOut" }
      }),
      deckControls.start({
        rotateX: 16,
        y: 0,
        transition: { type: "spring", stiffness: 320, damping: 20 }
      })
    ])

    setIsBouncing(false)
  }

  // Auto-play ball bounce loop
  useEffect(() => {
    let timer
    if (isAutoPlay && is3DDeckView && !isBouncing) {
      timer = setTimeout(() => {
        triggerBallBounce()
      }, 2100)
    }
    return () => clearTimeout(timer)
  }, [isAutoPlay, is3DDeckView, isBouncing, activeCardIndex])

  const handlePanEnd = (e, info) => {
    if (info.offset.y < -35) {
      setActiveCardIndex((prev) => (prev + 1) % cards.length)
    } else if (info.offset.y > 35) {
      setActiveCardIndex((prev) => (prev - 1 + cards.length) % cards.length)
    }
  }

  return (
    <div className="w-full my-4">
      {/* View Header & Dual Segmented Switcher */}
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

        {/* View Switcher and Auto-Bounce Controls */}
        <div className="flex items-center gap-2">
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

          {/* Dual Choice Segmented Pill Switcher */}
          <div className="inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
            <button
              type="button"
              onClick={() => { setIs3DDeckView(false); setIsAutoPlay(false); }}
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
              onClick={() => setIs3DDeckView(true)}
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
                onClick={() => setActiveCardIndex(i)}
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
            className="relative w-full py-4 px-2 overflow-visible min-h-[370px] sm:min-h-[410px] flex items-center justify-center [touch-action:pan-y]"
          >
            {/* Interactive Bouncing Glass Ball */}
            <div className="absolute -top-3 right-4 sm:right-16 z-50 flex flex-col items-center">
              <motion.span 
                animate={{ y: [-2, 2, -2] }} 
                transition={{ duration: 2, repeat: Infinity }}
                className="mb-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-900/80 text-white shadow-sm pointer-events-none select-none backdrop-blur-xs"
              >
                {isUrdu ? "چھوئیں 🎾" : "Tap Ball! 🎾"}
              </motion.span>

              <motion.button
                type="button"
                aria-label="Bounce ball on cards"
                onClick={triggerBallBounce}
                animate={ballControls}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.92 }}
                className="relative h-14 w-14 sm:h-16 sm:w-16 rounded-full border border-white/80 bg-gradient-to-tr from-white/30 via-emerald-200/50 to-white/90 shadow-2xl backdrop-blur-md cursor-pointer focus:outline-hidden"
                style={{
                  boxShadow: "0 15px 35px -5px rgba(16, 185, 129, 0.45), inset 0 2px 6px rgba(255,255,255,0.9)",
                }}
              >
                <span className="absolute top-1.5 left-2 h-4 w-7 rounded-full bg-white/70 blur-2xs transform -rotate-25 pointer-events-none" />
                <span className="absolute bottom-1 right-2 h-3 w-3 rounded-full bg-emerald-400/50 blur-xs pointer-events-none" />
              </motion.button>
            </div>

            {/* Isometric Angled Deck Container */}
            <motion.div
              animate={deckControls}
              style={{
                transformStyle: "preserve-3d",
                rotateX: 16,
                rotateZ: -4,
                rotateY: isRtl ? -10 : 10,
              }}
              className="relative w-full max-w-sm sm:max-w-md mx-auto h-[260px]"
            >
              {showRipple && (
                <motion.div
                  initial={{ opacity: 0.8, scale: 0.2 }}
                  animate={{ opacity: 0, scale: 1.6 }}
                  transition={{ duration: 0.45, ease: "easeOut" }}
                  className="pointer-events-none absolute top-4 right-10 z-50 h-24 w-24 rounded-full border-2 border-emerald-400 bg-emerald-400/20"
                />
              )}

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
                    onTap={() => setActiveCardIndex(idx)}
                    onPanEnd={handlePanEnd}
                    whileTap={{ scale: 0.985 }}
                    animate={{
                      z: shouldReduceMotion ? 0 : offsetZ,
                      y: shouldReduceMotion ? 0 : offsetY,
                      scale: shouldReduceMotion ? 1 : scale,
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 26,
                      mass: 0.5,
                    }}
                    style={{
                      transformStyle: "preserve-3d",
                      position: "absolute",
                      top: 0,
                      left: 0,
                      right: 0,
                      zIndex: cardZIndex,
                    }}
                    className="cursor-pointer select-none will-change-transform"
                  >
                    <div
                      className={`rounded-3xl border-2 ${card.accentBorder} bg-gradient-to-b ${card.gradient} p-5 shadow-xl backdrop-blur-md transition-shadow`}
                      style={{
                        boxShadow: isSelected
                          ? "0 25px 45px -12px rgba(15, 23, 42, 0.30)"
                          : "0 10px 20px -6px rgba(15, 23, 42, 0.12)",
                      }}
                    >
                      <div 
                        style={{
                          transform: "translateZ(1px)",
                          WebkitFontSmoothing: "antialiased",
                          MozOsxFontSmoothing: "grayscale",
                          textRendering: "geometricPrecision"
                        }}
                      >
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

                        <div className="my-2">
                          <div className={`text-3xl font-extrabold tracking-tight ${card.valueColor}`}>
                            <span className="text-sm font-semibold mr-1.5 opacity-75">{displayCurrency}</span>
                            {card.value}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                          <span className={`text-xs font-semibold flex items-center gap-1 ${card.noteColor}`}>
                            <span className="material-symbols-outlined text-xs">{card.noteIcon}</span>
                            <span>{card.note}</span>
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium">
                            {isSelected ? "✦ Active" : (isUrdu ? "چھو کر دیکھیں" : "Tap to lift")}
                          </span>
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
        /* ================= 100% CRISP 2D CLASSIC GRID (ZERO GPU BLUR) ================= */
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
                <span className="text-slate-600 dark:text-slate-300 text-sm font-medium">
                  {card.label}
                </span>
                <span className={`material-symbols-outlined text-xl ${card.iconColor}`}>
                  {card.icon}
                </span>
              </div>

              <div className={`text-2xl font-bold tracking-tight select-all ${card.valueColor}`}>
                {displayCurrency} {card.value}
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
import React, { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import Card3D from './Card3D'

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
  const [is3DDeckView, setIs3DDeckView] = useState(false) // Defaults to Classic Grid
  const [activeCardIndex, setActiveCardIndex] = useState(0)

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

  const handlePanEnd = (e, info) => {
    if (info.offset.y < -35) {
      setActiveCardIndex((prev) => (prev + 1) % cards.length)
    } else if (info.offset.y > 35) {
      setActiveCardIndex((prev) => (prev - 1 + cards.length) % cards.length)
    }
  }

  return (
    <div className="w-full my-4">
      {/* 3D Mode Header & Dual Segmented View Switcher */}
      <div className="flex items-center justify-between mb-3 px-1">
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

        {/* Dual Choice Segmented Pill Switcher */}
        <div className="inline-flex items-center p-1 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-2xs">
          <button
            type="button"
            onClick={() => setIs3DDeckView(false)}
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
            className="relative w-full py-4 px-2 overflow-visible min-h-[360px] sm:min-h-[400px] flex items-center justify-center [touch-action:pan-y]"
          >
            {/* Floating Glass Orb */}
            <motion.div
              animate={shouldReduceMotion ? {} : {
                y: [-8, 12, -8],
                x: [-6, 8, -6],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -top-1 right-2 sm:right-8 z-40 h-14 w-14 sm:h-16 sm:w-16 rounded-full border border-white/80 bg-gradient-to-tr from-white/30 via-emerald-200/40 to-white/80 shadow-2xl backdrop-blur-md"
              style={{
                boxShadow: "0 15px 35px -5px rgba(16, 185, 129, 0.35), inset 0 2px 6px rgba(255,255,255,0.9)",
              }}
            />

            {/* Isometric Angled Deck Container */}
            <motion.div
              style={{
                transformStyle: "preserve-3d",
                rotateX: 16,
                rotateZ: -4,
                rotateY: isRtl ? -10 : 10,
              }}
              className="relative w-full max-w-sm sm:max-w-md mx-auto h-[260px]"
            >
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
        /* ================= CLASSIC RESPONSIVE GRID ================= */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {cards.map((card) => (
            <Card3D
              key={card.id}
              maxTilt={8}
              depthZ={12}
              glareMaxOpacity={0.2}
              className={`p-5 rounded-2xl shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between ${card.cardClass}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-500 dark:text-slate-400 text-sm font-medium">
                  {card.label}
                </span>
                <span className={`material-symbols-outlined ${card.iconColor}`}>
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
            </Card3D>
          ))}
        </div>
      )}
    </div>
  )
}

export default SummaryCards
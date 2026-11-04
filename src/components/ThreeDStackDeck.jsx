import React, { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { Card3D } from './Card3D'

export const ThreeDStackDeck = ({
  openingBalance = 0,
  monthlyCollection = 0,
  totalExpense = 0,
  saving = 0,
  totalSaving = 0,
  netCashFlow,
  status,
  closingBalance = 0,
  isOverdrawn,
  currency = 'PKR',
  isNoData = false,
}) => {
  const { lang, t, isRtl } = useLanguage ? useLanguage() : { lang: 'en', t: {}, isRtl: false }
  const [is3DDeckMode, setIs3DDeckMode] = useState(false)
  const [activeCardIndex, setActiveCardIndex] = useState(0)
  const shouldReduceMotion = useReducedMotion()

  const isUrdu = lang === 'ur'
  const displayCurrency = isUrdu ? 'روپے' : currency
  const fmt = (n) => Number(n || 0).toLocaleString('en-PK')

  const actualNetCashFlow = typeof netCashFlow === 'number' ? netCashFlow : Number(saving || 0)
  const actualClosing = typeof closingBalance === 'number' ? closingBalance : Number(totalSaving || 0)
  const actualOverdrawn = typeof isOverdrawn === 'boolean' ? isOverdrawn : actualClosing < 0
  const isSurplus = actualNetCashFlow >= 0

  // Standardized 5-Card Sequence:
  // 1. Opening Balance
  // 2. Monthly Collection
  // 3. Total Expense
  // 4. Net Surplus / Net Deficit
  // 5. Closing Reserve Fund / Closing Balance
  const cardItems = [
    {
      id: 'opening',
      label: t?.openingBalance || 'Opening Balance',
      value: (Number(openingBalance) < 0 ? '-' : '') + fmt(Math.abs(openingBalance)),
      sub: isNoData ? '0%' : (isUrdu ? 'گزشتہ اختتامی فنڈ' : 'Previous closing balance'),
      icon: 'account_balance',
      gradient: 'from-slate-500/10 via-slate-50/50 to-white dark:from-slate-900 dark:to-slate-800',
      border: 'border-slate-300 dark:border-slate-700',
      badgeColor: 'bg-slate-700 text-white',
      textColor: 'text-slate-800 dark:text-slate-200',
      glowColor: 'rgba(100, 116, 139, 0.20)',
    },
    {
      id: 'collection',
      label: t?.monthlyCollection || 'Monthly Collection',
      value: fmt(monthlyCollection),
      sub: isNoData ? '0%' : (isUrdu ? 'رہائشیوں سے وصولی' : 'Resident collections'),
      icon: 'payments',
      gradient: 'from-amber-500/10 via-amber-50/50 to-white dark:from-amber-950/40 dark:to-slate-800',
      border: 'border-amber-400 dark:border-amber-700',
      badgeColor: 'bg-amber-500 text-white',
      textColor: 'text-amber-700 dark:text-amber-400',
      glowColor: 'rgba(245, 158, 11, 0.22)',
    },
    {
      id: 'expense',
      label: t?.totalExpense || 'Total Expense',
      value: fmt(totalExpense),
      sub: isNoData ? '0%' : (isUrdu ? 'کل آپریشنل اخراجات' : 'Total operational spend'),
      icon: 'shopping_cart',
      gradient: 'from-emerald-500/10 via-emerald-50/50 to-white dark:from-emerald-950/40 dark:to-slate-800',
      border: 'border-emerald-500 dark:border-emerald-700',
      badgeColor: 'bg-emerald-600 text-white',
      textColor: 'text-emerald-700 dark:text-emerald-400',
      glowColor: 'rgba(16, 185, 129, 0.22)',
    },
    {
      id: 'cashflow',
      label: isSurplus ? (t?.netSurplus || 'Monthly Surplus') : (t?.netDeficit || 'Monthly Deficit'),
      value: fmt(Math.abs(actualNetCashFlow)),
      sub: isNoData ? '0%' : (isSurplus ? (isUrdu ? 'بچت (+ مثبت کیش فلو)' : 'Surplus (+ Cash Flow)') : (isUrdu ? 'خسارہ (- منفی کیش فلو)' : 'Deficit (- Net Outflow)')),
      icon: isSurplus ? 'savings' : 'trending_down',
      gradient: !isSurplus ? 'from-rose-500/10 via-rose-50/50 to-white dark:from-rose-950/40 dark:to-slate-800' : 'from-teal-500/10 via-teal-50/50 to-white dark:from-teal-950/40 dark:to-slate-800',
      border: !isSurplus ? 'border-rose-400 dark:border-rose-700' : 'border-teal-400 dark:border-teal-700',
      badgeColor: !isSurplus ? 'bg-rose-500 text-white' : 'bg-teal-600 text-white',
      textColor: !isSurplus ? 'text-rose-600 dark:text-rose-400' : 'text-teal-700 dark:text-teal-400',
      glowColor: isSurplus ? 'rgba(20, 184, 166, 0.22)' : 'rgba(244, 63, 94, 0.25)',
    },
    {
      id: 'closing',
      label: !actualOverdrawn ? (t?.closingBalance || 'Closing Balance') : (isUrdu ? 'اختتامی فنڈ (خسارہ)' : 'Closing Reserve Fund (Overdrawn)'),
      value: fmt(Math.abs(actualClosing)),
      sub: isNoData ? '0%' : (!actualOverdrawn ? (isUrdu ? 'محفوظ ریزرو فنڈ' : 'Accumulated Reserve') : (isUrdu ? 'خسارہ / بقایا جات' : 'Overdrawn / Deficit')),
      icon: 'account_balance_wallet',
      gradient: actualOverdrawn ? 'from-rose-500/10 via-rose-50/50 to-white dark:from-rose-950/40 dark:to-slate-800' : 'from-emerald-500/10 via-emerald-50/50 to-white dark:from-emerald-950/40 dark:to-slate-800',
      border: actualOverdrawn ? 'border-rose-400 dark:border-rose-700' : 'border-emerald-400 dark:border-emerald-700',
      badgeColor: actualOverdrawn ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white',
      textColor: actualOverdrawn ? 'text-rose-600 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400',
      glowColor: actualOverdrawn ? 'rgba(244, 63, 94, 0.25)' : 'rgba(16, 185, 129, 0.25)',
    }
  ]

  return (
    <div className="w-full my-4">
      {/* 3D Mode Switcher Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider">
            {isUrdu ? 'مالیاتی جائزہ (KPI Cards)' : 'Financial Summary'}
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 tracking-wider">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse" />
            3D Tilt
          </span>
        </div>

        {/* View Toggle Button */}
        <motion.button
          whileHover={shouldReduceMotion ? {} : { scale: 1.04 }}
          whileTap={shouldReduceMotion ? {} : { scale: 0.96 }}
          onClick={() => setIs3DDeckMode(!is3DDeckMode)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 bg-white/90 dark:bg-slate-800/90 shadow-2xs text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
          title={is3DDeckMode ? 'Switch to Grid View' : 'Switch to 3D Deck View'}
        >
          <span>{is3DDeckMode ? '▦ Grid' : '🎴 3D Deck'}</span>
        </motion.button>
      </div>

      {is3DDeckMode ? (
        /* 3D PERSPECTIVE STACK DECK */
        <div 
          style={{ perspective: 1400 }}
          className="relative w-full py-8 px-2 overflow-visible min-h-[380px] flex items-center justify-center [touch-action:pan-y]"
        >
          {/* Floating Glass Sphere / Orb with Continuous Physics */}
          {!shouldReduceMotion && (
            <motion.div
              animate={{
                y: [-12, 14, -12],
                x: [-10, 12, -10],
                scale: [1, 1.08, 1],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="pointer-events-none absolute -top-2 right-4 z-40 h-16 w-16 rounded-full border border-white/80 bg-gradient-to-tr from-white/30 via-emerald-200/40 to-white/70 shadow-xl backdrop-blur-md"
              style={{
                boxShadow: '0 15px 30px -5px rgba(16, 185, 129, 0.35), inset 0 2px 6px rgba(255,255,255,0.9)',
              }}
            />
          )}

          {/* Isometric Angled Deck Container */}
          <motion.div
            style={{
              transformStyle: 'preserve-3d',
              rotateX: shouldReduceMotion ? 0 : 16,
              rotateZ: shouldReduceMotion ? 0 : -4,
              rotateY: shouldReduceMotion ? 0 : (isRtl ? -10 : 10),
            }}
            className="relative w-full max-w-sm mx-auto h-[290px]"
          >
            {cardItems.map((card, idx) => {
              const relIndex = (idx - activeCardIndex + cardItems.length) % cardItems.length
              const isSelected = relIndex === 0
              const offsetZ = isSelected ? 80 : -relIndex * 25
              const offsetY = isSelected ? -20 : relIndex * 36
              const scale = isSelected ? 1.03 : 1 - relIndex * 0.035
              const cardZIndex = 30 - relIndex

              return (
                <motion.div
                  key={card.id}
                  drag={shouldReduceMotion ? false : 'y'}
                  dragConstraints={{ top: -50, bottom: 50 }}
                  onDragStart={() => setActiveCardIndex(idx)}
                  onClick={() => setActiveCardIndex(idx)}
                  animate={{
                    z: shouldReduceMotion ? 0 : offsetZ,
                    y: offsetY,
                    scale: scale,
                    opacity: 1,
                  }}
                  transition={{
                    type: 'spring',
                    stiffness: 280,
                    damping: 24,
                  }}
                  style={{
                    transformStyle: 'preserve-3d',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: cardZIndex,
                  }}
                  className="cursor-grab active:cursor-grabbing"
                >
                  <div
                    className={`rounded-3xl border-2 ${card.border} bg-gradient-to-b ${card.gradient} p-5 sm:p-6 shadow-2xl backdrop-blur-xl transition-shadow`}
                    style={{
                      boxShadow: isSelected
                        ? '0 35px 50px -15px rgba(15, 23, 42, 0.35)'
                        : '0 15px 25px -8px rgba(15, 23, 42, 0.15)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                        {card.label}
                      </span>
                      <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${card.badgeColor}`}>
                        {idx + 1} / {cardItems.length}
                      </span>
                    </div>

                    <div className="my-2">
                      <div className={`text-3xl font-black font-mono tracking-tight ${card.textColor}`}>
                        <span className="text-base font-semibold mr-1.5 opacity-80">{displayCurrency}</span>
                        {card.value}
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-200/60 dark:border-slate-700/60">
                      <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">
                        {card.sub}
                      </span>
                      <span className="text-[11px] text-slate-400 font-bold">
                        {isSelected ? '✦ Active' : (isUrdu ? 'دبائیں' : 'Tap to lift')}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </div>
      ) : (
        /* Classic 3D Tilt Grid Mode */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {cardItems.map((card, idx) => (
            <Card3D
              key={card.id}
              glowColor={card.glowColor}
              tiltFactor={8}
              depth={16}
              className={`h-full flex flex-col justify-between border-l-4 ${card.border}`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-semibold tracking-tight">
                  {card.label}
                </span>
                <span className={`material-symbols-outlined text-lg sm:text-xl ${card.textColor}`}>
                  {card.icon}
                </span>
              </div>
              <div className={`text-2xl sm:text-[26px] font-black tracking-tight font-mono py-1 ${card.textColor}`}>
                {displayCurrency} {card.value}
              </div>
              <div className="mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">
                {card.sub}
              </div>
            </Card3D>
          ))}
        </div>
      )}
    </div>
  )
}

export default ThreeDStackDeck

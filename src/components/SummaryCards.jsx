import React, { useState } from 'react'
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
  const { lang, t } = useLanguage ? useLanguage() : { lang: 'en', t: {} }
  const shouldReduceMotion = useReducedMotion()

  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashboard_sound_muted') === 'true'
    }
    return false
  })

  const isUrdu = lang === 'ur'
  const displayCurrency = isUrdu ? 'روپے' : currency
  const fmt = (n) => Number(n || 0).toLocaleString('en-PK')

  // Financial calculations
  const actualNetCashFlow = typeof netCashFlow === 'number' ? netCashFlow : Number(saving || 0)
  const actualClosing = typeof closingBalance === 'number' ? closingBalance : Number(totalSaving || 0)
  const actualOverdrawn = typeof isOverdrawn === 'boolean' ? isOverdrawn : actualClosing < 0
  const isSurplus = actualNetCashFlow >= 0

  const safeOpening = Number(openingBalance || 0)
  const openingStr = (safeOpening < 0 ? '-' : '') + fmt(Math.abs(safeOpening))

  // ================= 5-CARD FINANCIAL SUMMARY SEQUENCE =================
  // 1. Opening Balance
  // 2. Monthly Collection
  // 3. Total Expense
  // 4. Net Deficit / Net Surplus
  // 5. Closing Reserve Fund (Overdrawn) / Closing Balance
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

  return (
    <div className="w-full my-4">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            {isUrdu ? 'مالیاتی جائزہ (خلاصہ)' : 'Financial Summary'}
          </span>
          <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300">
            5 KPI Cards
          </span>
        </div>

        {/* Sound FX Toggle Pill */}
        <button
          type="button"
          onClick={toggleSound}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition border ${
            !isMuted
              ? isSurplus
                ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                : 'bg-rose-500/15 border-rose-500/40 text-rose-700 dark:text-rose-300 shadow-2xs'
              : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-400'
          }`}
          title={isMuted ? 'Unmute Sound Effects' : 'Mute Sound Effects'}
        >
          <span>{!isMuted ? '🔊' : '🔇'}</span>
          <span>{!isMuted ? (isSurplus ? 'Surplus Audio' : 'Deficit Alert') : 'Muted'}</span>
        </button>
      </div>

      {/* ================= 100% CRISP 5-CARD HORIZONTAL GRID ================= */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
        {cards.map((card) => (
          <motion.div
            key={card.id}
            whileHover={shouldReduceMotion ? {} : { y: -3 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className={`p-4 sm:p-5 rounded-2xl sm:rounded-3xl shadow-xs hover:shadow-md transition-shadow duration-200 flex flex-col justify-between ${card.cardClass}`}
            style={{
              transform: 'none',
              WebkitFontSmoothing: 'antialiased',
              MozOsxFontSmoothing: 'grayscale',
              textRendering: 'optimizeLegibility',
            }}
          >
            {/* Top row: Label & Icon */}
            <div className="flex items-start justify-between gap-2 mb-3">
              <span className="text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-bold leading-tight whitespace-pre-line min-h-[2.4em] flex items-center">
                {card.label}
              </span>
              <span className={`material-symbols-outlined text-xl sm:text-2xl flex-shrink-0 ${card.iconColor}`}>
                {card.icon}
              </span>
            </div>

            {/* Middle: Mechanical Rolling Odometer Tumblers */}
            <div className="my-2 select-all">
              <RollingOdometer
                value={card.value}
                prefix={displayCurrency}
                className={`text-xl sm:text-2xl font-black tracking-tight ${card.valueColor}`}
              />
            </div>

            {/* Bottom: Note */}
            <div className={`mt-2 pt-2 border-t border-slate-100 dark:border-slate-700/60 text-[11px] sm:text-xs font-semibold flex items-center gap-1.5 ${card.noteColor}`}>
              <span className="material-symbols-outlined text-xs sm:text-sm">{card.noteIcon}</span>
              <span className="truncate">{card.note}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default SummaryCards

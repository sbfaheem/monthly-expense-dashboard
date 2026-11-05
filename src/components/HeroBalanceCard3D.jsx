import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Card3D } from './Card3D'
import { useLanguage } from '../context/LanguageContext'
import { translateMonth } from '../utils/translations'

export const HeroBalanceCard3D = ({ 
  currentMonth = 'August 2026', 
  collection = 0, 
  expenses = 0, 
  closingBalance = 0, 
  openingBalance = 0,
  currency = 'PKR',
  isNoData = false
}) => {
  const { lang, t } = useLanguage ? useLanguage() : { lang: 'en', t: {} }
  const isUrdu = lang === 'ur'
  const displayCurrency = isUrdu ? 'روپے' : currency
  const shouldReduceMotion = useReducedMotion()

  const safeClosing = Number(closingBalance || 0)
  const isDeficit = safeClosing < 0
  const netCashFlow = Number(collection || 0) - Number(expenses || 0)
  const isNetDeficit = netCashFlow < 0

  const fmt = (n) => Number(Math.abs(n || 0)).toLocaleString('en-PK')

  return (
    <Card3D
      className="rounded-3xl p-6 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white shadow-xl border border-white/10 overflow-hidden"
      maxTilt={10}
      depthZ={22}
      glareMaxOpacity={0.25}
    >
      {/* Background Ambient Glowing Orb */}
      {!shouldReduceMotion && (
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.2, 0.4, 0.2],
            x: [0, 15, 0],
            y: [0, -15, 0]
          }}
          transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
          className="pointer-events-none absolute -top-12 -right-12 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl"
        />
      )}

      {/* Header Layer (translateZ: 25px) */}
      <div style={{ transform: shouldReduceMotion ? 'none' : 'translateZ(25px)' }} className="flex justify-between items-center mb-5">
        <div>
          <span className="text-[11px] uppercase font-semibold tracking-wider text-slate-400">
            {isUrdu ? (t?.appTitle || 'ماہانہ اخراجات ڈیش بورڈ') : (t?.appTitle || 'Monthly Expense Dashboard')}
          </span>
          <h2 className="text-lg font-bold text-white tracking-wide mt-0.5">
            {isUrdu ? translateMonth(currentMonth, 'ur') : currentMonth}
          </h2>
        </div>
        
        {/* Floating Glass Status Badge */}
        <motion.span 
          style={{ transform: shouldReduceMotion ? 'none' : 'translateZ(35px)' }}
          whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
          className={`px-3 py-1 text-xs font-semibold rounded-full backdrop-blur-md border shadow-sm ${
            isNetDeficit 
              ? 'bg-rose-500/20 text-rose-300 border-rose-500/30' 
              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
          }`}
        >
          {isNetDeficit 
            ? (isUrdu ? 'خسارہ' : (t?.netDeficit || 'Deficit')) 
            : (isUrdu ? 'بچت' : (t?.netSurplus || 'Surplus'))}
        </motion.span>
      </div>

      {/* Main Closing Reserve Balance (translateZ: 45px) */}
      <div style={{ transform: shouldReduceMotion ? 'none' : 'translateZ(45px)' }} className="my-3">
        <span className="text-xs text-slate-400 block font-medium">
          {t?.closingBalance || 'Closing Reserve Fund'}
        </span>
        <div dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }} className="flex items-baseline gap-2 mt-1">
          <span className="text-sm font-semibold text-slate-400">{displayCurrency}</span>
          <h1 className={`text-3xl sm:text-4xl font-extrabold tracking-tight font-mono ${isDeficit ? 'text-rose-400' : 'text-emerald-400'}`}>
            {isDeficit ? `-${fmt(safeClosing)}` : fmt(safeClosing)}
          </h1>
        </div>
      </div>

      {/* Cash Flow Sub-Metrics Grid (translateZ: 30px) */}
      <div style={{ transform: shouldReduceMotion ? 'none' : 'translateZ(30px)' }} className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-4 border-t border-white/10 mt-5">
        <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5">
          <span className="text-[11px] font-medium text-slate-400 block">{t?.monthlyCollection || 'Collection'}</span>
          <span dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }} className="text-xs sm:text-sm font-bold text-emerald-300 font-mono mt-0.5 block">
            {displayCurrency} {fmt(collection)}
          </span>
        </div>

        <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5">
          <span className="text-[11px] font-medium text-slate-400 block">{t?.totalExpense || 'Total Expense'}</span>
          <span dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }} className="text-xs sm:text-sm font-bold text-rose-300 font-mono mt-0.5 block">
            {displayCurrency} {fmt(expenses)}
          </span>
        </div>

        <div className="bg-white/5 backdrop-blur-sm p-3 rounded-xl border border-white/5 col-span-2 sm:col-span-1">
          <span className="text-[11px] font-medium text-slate-400 block">{t?.openingBalance || 'Opening Balance'}</span>
          <span dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }} className="text-xs sm:text-sm font-bold text-slate-200 font-mono mt-0.5 block">
            {displayCurrency} {fmt(openingBalance)}
          </span>
        </div>
      </div>
    </Card3D>
  )
}

export default HeroBalanceCard3D

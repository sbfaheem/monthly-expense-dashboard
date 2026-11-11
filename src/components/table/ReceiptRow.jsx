import React, { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Receipt,
  ShieldCheck,
  Copy,
  Check,
  ChevronDown,
  CheckCircle2,
} from 'lucide-react'
import { translateCategory, translateItemName, translateMonth } from '../../utils/translations'
import AnimatedNumber from '../motion/AnimatedNumber'

const CATEGORY_STYLES = {
  'Salaries & Payroll':
    'bg-blue-500/12 text-blue-700 dark:text-blue-300 border-blue-400/30',
  Payroll:
    'bg-blue-500/12 text-blue-700 dark:text-blue-300 border-blue-400/30',
  'Community & Utilities':
    'bg-violet-500/12 text-violet-700 dark:text-violet-300 border-violet-400/30',
  'Electrical & Maintenance':
    'bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-400/30',
  'Electrical & Infrastructure':
    'bg-amber-500/12 text-amber-800 dark:text-amber-300 border-amber-400/30',
  'Supplies & Hardware':
    'bg-cyan-500/12 text-cyan-800 dark:text-cyan-300 border-cyan-400/30',
  'Capital Expenditures (CapEx)':
    'bg-pink-500/12 text-pink-700 dark:text-pink-300 border-pink-400/30',
}

/**
 * SVG Serrated Paper-Tear Edge across receipt top & bottom folds
 */
function SerratedEdge({ flip = false }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 240 8"
      preserveAspectRatio="none"
      className={`w-full h-2 block text-amber-200/80 dark:text-slate-700/90 ${
        flip ? 'rotate-180' : ''
      }`}
    >
      <path
        fill="currentColor"
        d="M0 8 L6 0 L12 8 L18 0 L24 8 L30 0 L36 8 L42 0 L48 8 L54 0 L60 8 L66 0 L72 8 L78 0 L84 8 L90 0 L96 8 L102 0 L108 8 L114 0 L120 8 L126 0 L132 8 L138 0 L144 8 L150 0 L156 8 L162 0 L168 8 L174 0 L180 8 L186 0 L192 8 L198 0 L204 8 L210 0 L216 8 L222 0 L228 8 L234 0 L240 8 L240 8 L0 8 Z"
      />
    </svg>
  )
}

/**
 * Shared Variance Status Pill (strictly single-line, animated delta counter + NEW sparkle burst)
 */
function VariancePill({
  row,
  hasPriorData,
  displayCurrency,
  isUrdu,
  t,
  inView = true,
  replayKey = 0,
}) {
  const shouldReduceMotion = useReducedMotion()
  const absDiff = Math.abs(row.diff || 0)

  if (!hasPriorData) {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
        {isUrdu ? 'ابتدائی بنیاد' : 'Baseline'}
      </span>
    )
  }

  if (row.isNew) {
    return (
      <motion.span
        key={`new-${row.id || row.name}-${replayKey}`}
        initial={shouldReduceMotion ? { opacity: 1 } : { scale: 0.85, opacity: 0.5 }}
        animate={
          shouldReduceMotion
            ? { opacity: 1 }
            : inView
            ? { scale: [0.85, 1.12, 1], opacity: 1 }
            : {}
        }
        transition={{ duration: 0.55, ease: 'easeOut' }}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black bg-blue-500/15 text-blue-700 dark:text-blue-300 border border-blue-400/40 shadow-[0_4px_16px_-4px_rgba(59,130,246,0.35)] whitespace-nowrap shrink-0"
      >
        <motion.span
          animate={shouldReduceMotion ? {} : { rotate: [0, 18, -12, 0] }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="inline-flex"
        >
          <Sparkles size={12} />
        </motion.span>
        <span>{isUrdu ? t.statusNew : 'NEW'}</span>
      </motion.span>
    )
  }

  if (row.diff > 0) {
    return (
      <span
        dir="ltr"
        style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
        className="inline-flex items-center gap-1 font-black text-rose-700 dark:text-rose-300 text-xs bg-rose-500/12 px-2.5 py-1 rounded-xl border border-rose-400/35 whitespace-nowrap shrink-0 font-mono"
      >
        <motion.span
          key={`up-${row.id || row.name}-${replayKey}`}
          initial={shouldReduceMotion ? {} : { y: 4, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.35 }}
          className="inline-flex shrink-0"
        >
          <TrendingUp size={12} className="stroke-[2.5]" />
        </motion.span>
        <span className={`inline-flex items-center ${isUrdu ? 'gap-0.5' : ''}`}>
          <span>+</span>
          <span dir={isUrdu ? 'rtl' : 'ltr'}>{displayCurrency}</span>
        </span>
        <AnimatedNumber
          value={absDiff}
          from={inView ? 0 : absDiff}
          duration={0.75}
          triggerKey={replayKey}
        />
        {row.pct && (
          <span
            className={`inline-flex items-center ${
              isUrdu ? 'gap-1' : ''
            } text-[10.5px] font-extrabold text-rose-600 dark:text-rose-400 whitespace-nowrap`}
          >
            <span>(▲ {row.pct}%</span>
            {isUrdu && <span dir="rtl">{t.statusHigher}</span>}
            <span>)</span>
          </span>
        )}
      </span>
    )
  }

  if (row.diff < 0) {
    return (
      <span
        dir="ltr"
        style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
        className="inline-flex items-center gap-1 font-black text-emerald-700 dark:text-emerald-300 text-xs bg-emerald-500/12 px-2.5 py-1 rounded-xl border border-emerald-400/35 whitespace-nowrap shrink-0 font-mono"
      >
        <motion.span
          key={`down-${row.id || row.name}-${replayKey}`}
          initial={shouldReduceMotion ? {} : { y: -4, opacity: 0 }}
          animate={inView ? { y: 0, opacity: 1 } : {}}
          transition={{ duration: 0.35 }}
          className="inline-flex shrink-0"
        >
          <TrendingDown size={12} className="stroke-[2.5]" />
        </motion.span>
        <span className={`inline-flex items-center ${isUrdu ? 'gap-0.5' : ''}`}>
          <span>-</span>
          <span dir={isUrdu ? 'rtl' : 'ltr'}>{displayCurrency}</span>
        </span>
        <AnimatedNumber
          value={absDiff}
          from={inView ? 0 : absDiff}
          duration={0.75}
          triggerKey={replayKey}
        />
        {row.pct && (
          <span
            className={`inline-flex items-center ${
              isUrdu ? 'gap-1' : ''
            } text-[10.5px] font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap`}
          >
            <span>(▼ {Math.abs(Number(row.pct))}%</span>
            {isUrdu && <span dir="rtl">{t.statusSaved}</span>}
            <span>)</span>
          </span>
        )}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 font-semibold text-slate-500 dark:text-slate-400 text-xs whitespace-nowrap shrink-0">
      <Minus size={12} /> {t.statusUnchanged || 'Unchanged'}
    </span>
  )
}

/**
 * Unfolding 3D Paper-Thin Glass Receipt:
 * rotateX: -90deg -> 0deg from top fold with serrated paper-tear edge,
 * exact calculation (Previous - Current = Difference),
 * animated mini two-bar comparison, % change badge, one-line explanation,
 * plus Verified stamp & Copy Voucher ID.
 */
function Unfolding3DReceipt({
  row,
  hasPriorData,
  displayCurrency,
  fmt,
  isUrdu,
  priorMonthShort,
  curMonthShort,
}) {
  const shouldReduceMotion = useReducedMotion()
  const [copied, setCopied] = useState(false)

  const voucherId = `EXP-2026-${
    (row.id || row.name)
      .toString()
      .replace(/[^a-zA-Z0-9]/g, '')
      .slice(-4)
      .toUpperCase() || '7D01'
  }`

  const handleCopy = (e) => {
    e.stopPropagation()
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(voucherId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const prevVal = Number(row.priorAmount || 0)
  const currVal = Number(row.currentAmount || 0)
  const diffVal = Number(row.diff || 0)
  const maxBar = Math.max(prevVal, currVal, 1)
  const prevWidthPct = Math.max(prevVal > 0 ? 8 : 0, Math.round((prevVal / maxBar) * 100))
  const currWidthPct = Math.max(currVal > 0 ? 8 : 0, Math.round((currVal / maxBar) * 100))

  // Plain-language one-line explanation
  let plainExplanation = ''
  if (!hasPriorData) {
    plainExplanation = isUrdu
      ? `ابتدائی بنیاد کا اندراج: ${displayCurrency} ${fmt(currVal)}`
      : `Baseline month entry recorded at ${displayCurrency} ${fmt(currVal)}`
  } else if (row.isNew) {
    plainExplanation = isUrdu
      ? `اس ماہ نئی مد کا اضافہ ہوا (${displayCurrency} ${fmt(currVal)})`
      : `New expense item added this month (${displayCurrency} ${fmt(currVal)})`
  } else if (diffVal < 0) {
    plainExplanation = isUrdu
      ? `گزشتہ ماہ کے مقابلے میں ${displayCurrency} ${fmt(Math.abs(diffVal))} کم خرچ ہوئے`
      : `Spent ${displayCurrency} ${fmt(Math.abs(diffVal))} less than last month`
  } else if (diffVal > 0) {
    plainExplanation = isUrdu
      ? `گزشتہ ماہ کے مقابلے میں ${displayCurrency} ${fmt(diffVal)} زیادہ خرچ ہوئے`
      : `Spent ${displayCurrency} ${fmt(diffVal)} more than last month`
  } else {
    plainExplanation = isUrdu
      ? `گزشتہ ماہ کے برابر خرچ برقرار رہا (${displayCurrency} ${fmt(currVal)})`
      : `Exact same spend as last month (${displayCurrency} ${fmt(currVal)})`
  }

  const absPct = row.pct ? Math.abs(Number(row.pct)).toFixed(1) : null

  return (
    <motion.div
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: 'auto' }}
      exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, height: 0 }}
      transition={{ duration: 0.36, ease: [0.16, 1, 0.3, 1] }}
      className="w-full overflow-hidden my-2.5 px-1 sm:px-3 select-none"
    >
      <div style={{ perspective: 1400 }} className="w-full max-w-4xl mx-auto py-1">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { rotateX: -90, opacity: 0 }}
          transition={{ duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
          style={{
            transformOrigin: 'top center',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
          className="relative rounded-2xl overflow-hidden shadow-xl border border-amber-300/65 dark:border-white/15 bg-gradient-to-b from-[#fffef9]/95 via-[#fdf9ee]/95 to-[#f8f2e4]/95 dark:from-slate-900/95 dark:via-slate-900/90 dark:to-slate-950/95 backdrop-blur-xl text-slate-800 dark:text-slate-100"
        >
          {/* Serrated Paper-Tear Top Edge */}
          <SerratedEdge />

          <div className="p-4 sm:p-5 space-y-4">
            {/* Top Tear Strip & Voucher Controls */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-dashed border-amber-300/70 dark:border-slate-700/80">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-8 rounded-xl bg-amber-500/15 dark:bg-cyan-500/15 text-amber-700 dark:text-cyan-300 flex items-center justify-center shrink-0">
                  <Receipt size={16} />
                </div>
                <div className="min-w-0">
                  <span className="text-xs sm:text-sm font-black uppercase tracking-tight block truncate">
                    {isUrdu ? translateItemName(row.normName || row.name, 'ur') : row.normName || row.name}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400 block">
                    {isUrdu ? translateCategory(row.category, 'ur') : row.category} • {voucherId}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {absPct !== null && (
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-mono font-black whitespace-nowrap border ${
                      diffVal < 0
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/35'
                        : diffVal > 0
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/35'
                        : 'bg-slate-500/12 text-slate-600 dark:text-slate-300 border-slate-400/30'
                    }`}
                  >
                    {diffVal < 0 ? '▼' : diffVal > 0 ? '▲' : '—'} {absPct}%{' '}
                    {diffVal < 0
                      ? isUrdu
                        ? 'بچت'
                        : 'Saved'
                      : diffVal > 0
                      ? isUrdu
                        ? 'اضافہ'
                        : 'Higher'
                      : isUrdu
                      ? 'برقرار'
                      : 'Flat'}
                  </span>
                )}

                <button
                  type="button"
                  onClick={handleCopy}
                  className="min-h-[36px] inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-[11px] font-mono font-bold bg-white/85 dark:bg-slate-800 border border-amber-300/75 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-amber-50 dark:hover:bg-slate-700 transition-colors cursor-pointer whitespace-nowrap"
                  title="Copy Voucher ID"
                >
                  {copied ? (
                    <Check size={12} className="text-emerald-500" />
                  ) : (
                    <Copy size={12} className="text-amber-600 dark:text-cyan-400" />
                  )}
                  <span>{copied ? (isUrdu ? 'کاپی ہو گیا!' : 'Copied!') : voucherId}</span>
                </button>
              </div>
            </div>

            {/* One-Line Plain-Language Explanation */}
            <div
              className={`px-3.5 py-2.5 rounded-xl border text-xs sm:text-sm font-extrabold flex items-center gap-2 ${
                diffVal < 0
                  ? 'bg-emerald-500/10 border-emerald-400/35 text-emerald-800 dark:text-emerald-200'
                  : row.isNew
                  ? 'bg-blue-500/10 border-blue-400/35 text-blue-800 dark:text-blue-200'
                  : diffVal > 0
                  ? 'bg-rose-500/10 border-rose-400/35 text-rose-800 dark:text-rose-200'
                  : 'bg-white/75 dark:bg-white/[0.06] border-slate-200/70 dark:border-white/10 text-slate-700 dark:text-slate-200'
              }`}
            >
              {diffVal < 0 ? (
                <ArrowDownRight size={16} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
              ) : diffVal > 0 ? (
                <ArrowUpRight size={16} className="shrink-0 text-rose-600 dark:text-rose-400" />
              ) : (
                <CheckCircle2 size={16} className="shrink-0 text-blue-500" />
              )}
              <span>{plainExplanation}</span>
            </div>

            {/* Calculation Strip + Animated Mini Two-Bar Comparison */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-stretch">
              {/* Left: Exact Calculation (Previous − Current = Difference) */}
              <div className="md:col-span-6 p-3.5 rounded-2xl bg-white/80 dark:bg-slate-950/60 border border-amber-200/80 dark:border-white/10 flex flex-col justify-between gap-2">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400">
                  {isUrdu ? 'ماہانہ حساب (گزشتہ بمقابلہ موجودہ)' : 'Calculation Breakdown'}
                </span>

                <div
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                  className="flex flex-wrap items-center gap-1.5 text-xs sm:text-sm font-mono font-black"
                >
                  <span className="px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 whitespace-nowrap">
                    {hasPriorData ? `${displayCurrency} ${fmt(prevVal)}` : `${displayCurrency} 0`}
                  </span>
                  <span className="text-slate-400">−</span>
                  <span className="px-2 py-1 rounded-lg bg-indigo-500/12 text-indigo-800 dark:text-indigo-200 whitespace-nowrap">
                    {displayCurrency} {fmt(currVal)}
                  </span>
                  <span className="text-slate-400">=</span>
                  <span
                    className={`px-2.5 py-1 rounded-lg whitespace-nowrap ${
                      diffVal < 0
                        ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                        : diffVal > 0
                        ? 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
                        : 'bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    {diffVal < 0
                      ? `+${displayCurrency} ${fmt(Math.abs(diffVal))} ${isUrdu ? 'بچت' : 'Saved'}`
                      : diffVal > 0
                      ? `-${displayCurrency} ${fmt(diffVal)} ${isUrdu ? 'اضافہ' : 'Extra'}`
                      : `${displayCurrency} 0`}
                  </span>
                </div>

                <span className="text-[10px] font-medium text-slate-500 dark:text-slate-400">
                  {isUrdu
                    ? 'سابقہ − موجودہ = ماہانہ فرق'
                    : 'Previous − Current = Net Monthly Difference'}
                </span>
              </div>

              {/* Right: Animated Mini Two-Bar Comparison growing from baseline */}
              <div className="md:col-span-6 p-3.5 rounded-2xl bg-white/80 dark:bg-slate-950/60 border border-amber-200/80 dark:border-white/10 space-y-2.5">
                <span className="text-[10px] font-mono font-black uppercase tracking-wider text-slate-400 block">
                  {isUrdu ? 'دو ماہ کا تقابلی گراف' : 'Month-to-Month Bar Comparison'}
                </span>

                {/* Previous Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-slate-500 dark:text-slate-400">
                      {hasPriorData
                        ? translateMonth(priorMonthShort, isUrdu ? 'ur' : 'en')
                        : isUrdu
                        ? 'گزشتہ'
                        : 'Previous'}
                    </span>
                    <span
                      dir="ltr"
                      style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                      className="font-mono text-slate-700 dark:text-slate-200"
                    >
                      {hasPriorData ? `${displayCurrency} ${fmt(prevVal)}` : '—'}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-200/75 dark:bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={
                        shouldReduceMotion ? { width: `${prevWidthPct}%` } : { width: '0%' }
                      }
                      animate={{ width: `${prevWidthPct}%` }}
                      transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
                      className="h-full rounded-full bg-slate-400 dark:bg-slate-500"
                    />
                  </div>
                </div>

                {/* Current Bar */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-bold">
                    <span className="text-indigo-700 dark:text-indigo-300">
                      {translateMonth(curMonthShort, isUrdu ? 'ur' : 'en')}
                    </span>
                    <span
                      dir="ltr"
                      style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                      className="font-mono font-black text-slate-900 dark:text-white"
                    >
                      {displayCurrency} {fmt(currVal)}
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-200/75 dark:bg-slate-800 overflow-hidden">
                    <motion.div
                      initial={
                        shouldReduceMotion ? { width: `${currWidthPct}%` } : { width: '0%' }
                      }
                      animate={{ width: `${currWidthPct}%` }}
                      transition={{ duration: 0.72, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                      className={`h-full rounded-full ${
                        row.isNew
                          ? 'bg-blue-500'
                          : diffVal < 0
                          ? 'bg-emerald-500'
                          : diffVal > 0
                          ? 'bg-rose-500'
                          : 'bg-indigo-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Verification Stamp */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2.5 border-t border-dashed border-amber-300/70 dark:border-slate-700/80 text-[10px] font-mono text-slate-500 dark:text-slate-400">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/12 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 font-black uppercase">
                <ShieldCheck size={13} />
                <span>
                  {isUrdu ? 'سیکٹر 7D/1 مینجمنٹ تصدیق شدہ' : 'Sector 7D/1 Management Verified'}
                </span>
              </div>
              <span>
                {translateMonth(curMonthShort, isUrdu ? 'ur' : 'en')} •{' '}
                {isUrdu ? 'جنرل لیجر ریکارڈ' : 'General Ledger Record'}
              </span>
            </div>
          </div>

          <SerratedEdge flip />
        </motion.div>
      </div>
    </motion.div>
  )
}

/**
 * ReceiptRow: renders both mobile glass card + desktop table row
 * with staggered 3D flip-up entrance, hover Z lift & semantic glow,
 * single-line variance pills, and click-to-unfold 3D paper-thin glass receipt.
 */
export const ReceiptRow = ({
  variant = 'desktop', // 'mobile' | 'desktop'
  row,
  index = 0,
  isExpanded = false,
  onToggle,
  hasPriorData = true,
  displayCurrency = 'PKR',
  fmt,
  isUrdu = false,
  t = {},
  priorMonthShort = 'Prior',
  curMonthShort = 'Current',
  isAdmin = false,
  onEdit,
  onDelete,
  inView = true,
  replayKey = 0,
}) => {
  const shouldReduceMotion = useReducedMotion()
  const catClass = CATEGORY_STYLES[row.category] || CATEGORY_STYLES['Community & Utilities']
  const rowKey = row.id || row.name
  const entranceDelay = shouldReduceMotion ? 0 : Math.min(index * 0.04, 0.45)

  const hoverStatusGlow =
    row.isNew
      ? 'hover:shadow-[0_10px_28px_-10px_rgba(59,130,246,0.35)]'
      : row.diff < 0
      ? 'hover:shadow-[0_10px_28px_-10px_rgba(16,185,129,0.35)]'
      : row.diff > 0
      ? 'hover:shadow-[0_10px_28px_-10px_rgba(244,63,94,0.3)]'
      : 'hover:shadow-[0_10px_26px_-10px_rgba(99,102,241,0.25)]'

  if (variant === 'mobile') {
    return (
      <motion.div
        key={`mob-row-${rowKey}-${replayKey}`}
        initial={
          shouldReduceMotion
            ? { opacity: 1 }
            : { opacity: 0, rotateX: -20, y: 14 }
        }
        animate={inView ? { opacity: 1, rotateX: 0, y: 0 } : {}}
        transition={{
          duration: 0.42,
          delay: entranceDelay,
          ease: [0.22, 1, 0.36, 1],
        }}
        style={{ transformOrigin: 'top center', perspective: 1000 }}
        className={`glass-surface rounded-2xl p-4 border transition-all space-y-3 shadow-sm ${
          isExpanded
            ? 'border-indigo-400/75 ring-2 ring-indigo-400/25'
            : 'border-slate-200/80 dark:border-white/12'
        }`}
      >
        {/* Header: Item + Category */}
        <div className="flex items-start justify-between gap-2.5 flex-wrap">
          <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 leading-snug">
            {isUrdu ? translateItemName(row.normName || row.name, 'ur') : row.normName || row.name}
          </span>
          <span
            className={`text-[11px] font-bold px-2.5 py-0.5 rounded-lg border shrink-0 whitespace-nowrap ${catClass}`}
          >
            {isUrdu ? translateCategory(row.category, 'ur') : row.category}
          </span>
        </div>

        {/* Prior vs Current Side-by-Side Box */}
        <div className="grid grid-cols-2 gap-3 bg-white/75 dark:bg-slate-900/70 p-3 rounded-xl border border-slate-200/70 dark:border-white/10">
          <div>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5 truncate">
              {hasPriorData
                ? translateMonth(priorMonthShort, isUrdu ? 'ur' : 'en')
                : t.colPrevious || 'Prior Month'}
            </span>
            <span
              dir="ltr"
              style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
              className="text-sm font-bold text-slate-600 dark:text-slate-300 font-mono tabular-nums whitespace-nowrap block"
            >
              {hasPriorData && row.priorAmount > 0 ? `${displayCurrency} ${fmt(row.priorAmount)}` : '—'}
            </span>
          </div>

          <div className="border-l border-slate-200/80 dark:border-slate-800 pl-3">
            <span className="text-[10px] font-extrabold text-indigo-600 dark:text-indigo-300 block uppercase tracking-wider mb-0.5 truncate">
              {translateMonth(curMonthShort, isUrdu ? 'ur' : 'en')}
            </span>
            <span
              dir="ltr"
              style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
              className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 font-mono tabular-nums whitespace-nowrap block"
            >
              {displayCurrency} {fmt(row.currentAmount)}
            </span>
          </div>
        </div>

        {/* Single-Line Variance Pill + Optional Admin Buttons */}
        <div className="flex items-center justify-between gap-2 flex-wrap pt-0.5">
          <VariancePill
            row={row}
            hasPriorData={hasPriorData}
            displayCurrency={displayCurrency}
            isUrdu={isUrdu}
            t={t}
            inView={inView}
            replayKey={replayKey}
          />

          {isAdmin && (
            <div className="flex items-center gap-1.5 ml-auto">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit && onEdit(row.expense)
                }}
                className="min-h-[36px] text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-lg font-bold hover:bg-blue-100 cursor-pointer"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete && onDelete(row.id)
                }}
                className="min-h-[36px] text-xs bg-red-50 text-red-600 px-3 py-1 rounded-lg font-bold hover:bg-red-100 cursor-pointer"
              >
                Del
              </button>
            </div>
          )}
        </div>

        {/* >= 44px Unfold Button with single-line clean label */}
        <button
          type="button"
          onClick={() => onToggle(rowKey)}
          className="w-full min-h-[44px] flex items-center justify-between py-2.5 px-3.5 rounded-xl bg-white/85 dark:bg-slate-900/85 border border-slate-200/85 dark:border-white/12 text-xs font-bold text-slate-700 dark:text-slate-200 hover:text-indigo-600 dark:hover:text-indigo-300 transition-colors cursor-pointer active:scale-[0.99]"
        >
          <span className="flex items-center gap-1.5 whitespace-nowrap">
            <Receipt size={14} className="text-amber-500 dark:text-cyan-400 shrink-0" />
            <span className="whitespace-nowrap">
              {isExpanded
                ? isUrdu
                  ? 'آڈٹ رسید بند کریں'
                  : 'Fold 3D receipt'
                : isUrdu
                ? '3D آڈٹ رسید کھولیں'
                : 'Unfold 3D receipt'}
            </span>
          </span>
          <ChevronDown
            size={15}
            className={`transition-transform duration-300 shrink-0 ${
              isExpanded ? 'rotate-180 text-indigo-600 dark:text-indigo-300' : 'text-slate-400'
            }`}
          />
        </button>

        {/* Unfolding 3D Receipt (Mobile) */}
        <AnimatePresence initial={false}>
          {isExpanded && (
            <Unfolding3DReceipt
              row={row}
              hasPriorData={hasPriorData}
              displayCurrency={displayCurrency}
              fmt={fmt}
              isUrdu={isUrdu}
              priorMonthShort={priorMonthShort}
              curMonthShort={curMonthShort}
            />
          )}
        </AnimatePresence>
      </motion.div>
    )
  }

  // Desktop <tr> + Expandable Unfolding 3D Receipt Row
  // Note: Animate block <motion.div> inside each <td> rather than transforming <tr> directly,
  // avoiding Blink 3D transform / overflow-x-auto paint bugs on display:table-row (especially in RTL).
  return (
    <>
      <tr
        onClick={() => onToggle(rowKey)}
        className={`relative transition-all duration-200 cursor-pointer group ${hoverStatusGlow} ${
          isExpanded
            ? 'bg-indigo-500/[0.06] dark:bg-indigo-500/[0.10]'
            : 'hover:bg-white/75 dark:hover:bg-white/[0.05]'
        }`}
      >
        {/* Col 1: Line Item, Normalized Category Badge & Non-Wrapping Receipt Hint */}
        <td className="px-3 lg:px-4 py-3.5 text-start">
          <motion.div
            key={`desk-c1-${rowKey}-${replayKey}`}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.36,
              delay: entranceDelay,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="flex flex-col gap-1.5"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm lg:text-[15px] font-black text-slate-900 dark:text-slate-100 leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors">
                {isUrdu ? translateItemName(row.normName || row.name, 'ur') : row.normName || row.name}
              </span>
              <ChevronDown
                size={15}
                className={`transition-transform duration-300 text-slate-400 group-hover:text-indigo-500 shrink-0 ${
                  isExpanded ? 'rotate-180 text-indigo-600 dark:text-indigo-300' : ''
                }`}
              />
            </div>
            <div className="flex items-center gap-x-2 gap-y-1 flex-wrap">
              <span
                className={`inline-flex items-center w-fit text-[10.5px] font-bold px-2 py-0.5 rounded-md border whitespace-nowrap ${catClass}`}
              >
                {isUrdu ? translateCategory(row.category, 'ur') : row.category}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold text-slate-500 dark:text-slate-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-300 transition-colors whitespace-nowrap shrink-0">
                <Receipt size={11} className="text-amber-500 shrink-0" />
                <span>
                  {isExpanded
                    ? isUrdu
                      ? 'رسید بند کریں'
                      : 'Fold 3D receipt'
                    : isUrdu
                    ? '3D رسید دیکھیں'
                    : 'Unfold 3D receipt'}
                </span>
              </span>
            </div>
          </motion.div>
        </td>

        {/* Col 2: Prior Month */}
        <td className="px-2 lg:px-3 py-3.5 text-end whitespace-nowrap">
          <motion.div
            key={`desk-c2-${rowKey}-${replayKey}`}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.36,
              delay: entranceDelay,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            {hasPriorData && row.priorAmount > 0 ? (
              <span
                dir="ltr"
                style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                className="text-[13px] lg:text-sm font-semibold text-slate-600 dark:text-slate-300 font-mono tabular-nums whitespace-nowrap"
              >
                {displayCurrency} {fmt(row.priorAmount)}
              </span>
            ) : (
              <span className="text-sm font-bold text-slate-300 dark:text-slate-600 font-mono">—</span>
            )}
          </motion.div>
        </td>

        {/* Col 3: Current Month */}
        <td className="px-2 lg:px-3 py-3.5 text-end whitespace-nowrap">
          <motion.div
            key={`desk-c3-${rowKey}-${replayKey}`}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.36,
              delay: entranceDelay,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <span
              dir="ltr"
              style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
              className="text-[13px] lg:text-sm font-black text-slate-900 dark:text-slate-100 font-mono tabular-nums whitespace-nowrap"
            >
              {displayCurrency} {fmt(row.currentAmount)}
            </span>
          </motion.div>
        </td>

        {/* Col 4: Single-Line Variance & Status Pill */}
        <td className="px-2.5 lg:px-4 py-3.5 text-end whitespace-nowrap">
          <motion.div
            key={`desk-c4-${rowKey}-${replayKey}`}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 8 }}
            animate={inView ? { opacity: 1, y: 0 } : {}}
            transition={{
              duration: 0.36,
              delay: entranceDelay,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <VariancePill
              row={row}
              hasPriorData={hasPriorData}
              displayCurrency={displayCurrency}
              isUrdu={isUrdu}
              t={t}
              inView={inView}
              replayKey={replayKey}
            />
          </motion.div>
        </td>

        {/* Col 5 (Admin Actions) */}
        {isAdmin && (
          <td className="px-2.5 py-3.5 border-l border-slate-200/60 dark:border-slate-800 text-center whitespace-nowrap">
            <div className="flex justify-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onEdit && onEdit(row.expense)
                }}
                className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-bold hover:bg-blue-100 transition-colors cursor-pointer"
              >
                Edit
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete && onDelete(row.id)
                }}
                className="text-xs bg-red-50 text-red-600 px-2 py-1 rounded-lg font-bold hover:bg-red-100 transition-colors cursor-pointer"
              >
                Del
              </button>
            </div>
          </td>
        )}
      </tr>

      {/* Expandable 3D Receipt Row */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <tr key={`${rowKey}-receipt`} className="bg-slate-100/40 dark:bg-slate-900/40">
            <td
              colSpan={isAdmin ? 5 : 4}
              className="p-0 border-b border-slate-200/80 dark:border-slate-800"
            >
              <Unfolding3DReceipt
                row={row}
                hasPriorData={hasPriorData}
                displayCurrency={displayCurrency}
                fmt={fmt}
                isUrdu={isUrdu}
                priorMonthShort={priorMonthShort}
                curMonthShort={curMonthShort}
              />
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  )
}

export default ReceiptRow

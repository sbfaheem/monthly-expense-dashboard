import React, { useState, useMemo, useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Zap,
  Trash2,
  Droplets,
  Wrench,
  Sparkles,
  PieChart,
  BarChart3,
  Layers,
  Video
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { soundEffects } from '../utils/soundEffects'
import RollingOdometer from './RollingOdometer'

// Category metadata with localized copy, icons, and theme accents
const CATEGORY_META = {
  security: {
    icon: Shield,
    en: 'Security Staff & Night Patrol',
    ur: 'سیکیورٹی عملہ و گارڈز',
    color: '#3b82f6',
  },
  electric: {
    icon: Zap,
    en: 'K-Electric Common Grid Bills',
    ur: 'کے الیکٹرک بجلی بل (مشترکہ)',
    color: '#f59e0b',
  },
  sanitation: {
    icon: Trash2,
    en: 'Waste & Garbage Disposal',
    ur: 'صفائی و کچرا تلفی',
    color: '#10b981',
  },
  water: {
    icon: Droplets,
    en: 'Water Supply Logistics & Valves',
    ur: 'پانی سپلائی و موٹر اخراجات',
    color: '#06b6d4',
  },
  maintenance: {
    icon: Wrench,
    en: 'General Maintenance & Repairs',
    ur: 'مرمت و دیکھ بھال',
    color: '#8b5cf6',
  },
  capex: {
    icon: Video,
    en: 'CCTV Surveillance & CapEx',
    ur: 'سی سی ٹی وی کیمرے و اثاثہ جات',
    color: '#ec4899',
  },
  other: {
    icon: Sparkles,
    en: 'Operational Contingencies',
    ur: 'دیگر متفرق اخراجات',
    color: '#64748b',
  }
}

// Map expense items to standardized categories
function classifyExpense(item) {
  const str = `${item.category || ''} ${item.name || ''}`.toLowerCase()
  if (str.includes('cctv') || str.includes('capex') || str.includes('camera') || str.includes('fan') || str.includes('furniture')) return 'capex'
  if (str.includes('salary') || str.includes('payroll') || str.includes('security') || str.includes('guard')) return 'security'
  if (str.includes('electric') || str.includes('bulb') || str.includes('light') || str.includes('generator')) return 'electric'
  if (str.includes('water') || str.includes('tanker') || str.includes('hydrant')) return 'water'
  if (str.includes('clean') || str.includes('sanitation') || str.includes('waste') || str.includes('jhado') || str.includes('sweeper')) return 'sanitation'
  if (str.includes('maintenance') || str.includes('hardware') || str.includes('repair') || str.includes('supplies')) return 'maintenance'
  return 'other'
}

// SVG Arc Math Helper
function describeDonutArc(cx, cy, rOuter, rInner, startAngle, endAngle) {
  const span = Math.min(359.99, Math.max(0.01, endAngle - startAngle))
  const sAngle = startAngle
  const eAngle = startAngle + span

  const startRad = (sAngle - 90) * (Math.PI / 180)
  const endRad = (eAngle - 90) * (Math.PI / 180)

  const x1Outer = cx + rOuter * Math.cos(startRad)
  const y1Outer = cy + rOuter * Math.sin(startRad)
  const x2Outer = cx + rOuter * Math.cos(endRad)
  const y2Outer = cy + rOuter * Math.sin(endRad)

  const x1Inner = cx + rInner * Math.cos(endRad)
  const y1Inner = cy + rInner * Math.sin(endRad)
  const x2Inner = cx + rInner * Math.cos(startRad)
  const y2Inner = cy + rInner * Math.sin(startRad)

  const largeArc = span > 180 ? 1 : 0

  return [
    `M ${x1Outer.toFixed(2)} ${y1Outer.toFixed(2)}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 1 ${x2Outer.toFixed(2)} ${y2Outer.toFixed(2)}`,
    `L ${x1Inner.toFixed(2)} ${y1Inner.toFixed(2)}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 0 ${x2Inner.toFixed(2)} ${y2Inner.toFixed(2)}`,
    'Z'
  ].join(' ')
}

export const Charts = ({
  expenses = [],
  totalExpense = 297425,
  currency = 'PKR'
}) => {
  const containerRef = useRef(null)
  const [containerWidth, setContainerWidth] = useState(0)

  useEffect(() => {
    if (!containerRef.current) return
    const updateWidth = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.clientWidth)
      }
    }
    updateWidth()
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  const isWide = containerWidth >= 680

  const { lang, isRtl } = useLanguage ? useLanguage() : { lang: 'en', isRtl: false }
  const isUrdu = lang === 'ur'
  const displayCurrency = isUrdu ? 'روپے' : currency
  const shouldReduceMotion = useReducedMotion()

  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0)
  // View mode: 'donut' | 'split' | 'bars'
  const [viewMode, setViewMode] = useState('split')

  // Aggregate category amounts
  const categoryData = useMemo(() => {
    const defaultData = [
      { key: 'security', amount: 125000, vendor: 'Falcon Guards Security Corp' },
      { key: 'electric', amount: 83500, vendor: 'K-Electric Consumer Unit #882' },
      { key: 'sanitation', amount: 45000, vendor: 'Town Municipal Waste Services' },
      { key: 'water', amount: 26800, vendor: 'Hydrant Logistics & Tankers' },
      { key: 'maintenance', amount: 17125, vendor: 'Street Lighting & Valve Repairs' },
    ]

    const map = {}
    if (Array.isArray(expenses) && expenses.length > 0) {
      expenses.forEach((item) => {
        const catKey = classifyExpense(item)
        const amt = Number(item.amount || item.cost || 0)
        if (!map[catKey]) {
          map[catKey] = {
            key: catKey,
            amount: 0,
            vendor: item.vendor || item.recipient || 'Verified Contractor'
          }
        }
        map[catKey].amount += amt
      })
    }

    const source = Object.keys(map).length > 0 ? Object.values(map) : defaultData
    // Sort descending by amount so largest stream is first
    source.sort((a, b) => b.amount - a.amount)

    const sum = source.reduce((acc, cur) => acc + cur.amount, 0) || totalExpense || 1

    let currentAngle = 0
    return source.map((item, idx) => {
      const pct = (item.amount / sum) * 100
      const sliceAngle = (item.amount / sum) * 360
      const startAngle = currentAngle
      const endAngle = currentAngle + sliceAngle
      const midAngle = startAngle + sliceAngle / 2
      currentAngle = endAngle

      const meta = CATEGORY_META[item.key] || CATEGORY_META.other
      const midRad = (midAngle - 90) * (Math.PI / 180)

      return {
        ...item,
        index: idx,
        percentage: pct.toFixed(1),
        startAngle,
        endAngle: Math.min(endAngle, 359.99),
        midAngle,
        explodeX: Math.cos(midRad) * 14,
        explodeY: Math.sin(midRad) * 14,
        meta,
      }
    })
  }, [expenses, totalExpense])

  const totalCalculated = useMemo(() => {
    return categoryData.reduce((sum, item) => sum + item.amount, 0)
  }, [categoryData])

  const activeCategory = categoryData[activeCategoryIndex] || categoryData[0] || {
    key: 'security',
    percentage: '100',
    amount: totalCalculated,
    vendor: 'Verified Contractor',
    meta: CATEGORY_META.security
  }

  // 3D Perspective Tilt Physics
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 24, stiffness: 180, mass: 0.35 }
  const smoothX = useSpring(mouseX, springConfig)
  const smoothY = useSpring(mouseY, springConfig)

  const rotateX = useTransform(smoothY, [-0.5, 0.5], [16, 6])
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-10, 10])

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

  const handleSelectSlice = (idx) => {
    if (activeCategoryIndex !== idx) {
      soundEffects.playBounce()
      setActiveCategoryIndex(idx)
    }
  }

  // SVG dimensions for Donut Arc
  const SVG_SIZE = 360
  const CX = 180
  const CY = 180
  const R_OUTER = 132
  const R_INNER = 72

  return (
    <div ref={containerRef} className="w-full my-6">
      {/* ─── Header & Segmented View Controls ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 px-1">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <PieChart size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {isUrdu ? 'اخراجات کی تفصیل (3D ڈونٹ)' : 'Expense Breakdown & Allocation'}
              </h3>
              <span className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-xs">
                3D EXPLODED VIEW
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              {isUrdu
                ? 'کسی بھی زمرے پر ٹیپ کر کے تفصیلی خرچ ملاحظہ کریں'
                : 'Tap or hover any slice to explode category details and vendor allocation'}
            </p>
          </div>
        </div>

        {/* Responsive Mode Switcher */}
        <div className="inline-flex items-center p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700 shadow-inner self-start sm:self-auto shrink-0">
          <button
            type="button"
            onClick={() => setViewMode('donut')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              viewMode === 'donut'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <Layers size={13} />
            <span>{isUrdu ? '3D ڈونٹ' : '3D Donut'}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('split')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              viewMode === 'split'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <span>☷</span>
            <span>{isUrdu ? 'مشترکہ' : 'Split'}</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('bars')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
              viewMode === 'bars'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-md'
                : 'text-slate-500 hover:text-slate-800 dark:text-slate-400'
            }`}
          >
            <BarChart3 size={13} />
            <span>{isUrdu ? 'بارز' : 'Progress Bars'}</span>
          </button>
        </div>
      </div>

      {/* ─── Main 3D Display Stage ─── */}
      <div className={isWide && viewMode === 'split' ? 'grid grid-cols-12 gap-6 items-start' : 'flex flex-col gap-4 w-full'}>
        {/* ================= 3D OBLIQUE EXPLODED DONUT ================= */}
        {viewMode !== 'bars' && (
          <div
            style={{ perspective: 1200 }}
            onPointerMove={handlePointerMove}
            onPointerLeave={handlePointerLeave}
            className={`flex flex-col items-center justify-center relative min-h-[300px] sm:min-h-[340px] p-4 sm:p-5 rounded-3xl bg-slate-50/80 dark:bg-slate-900/60 border border-slate-200/90 dark:border-slate-800 [touch-action:pan-y] w-full overflow-hidden ${
              isWide && viewMode === 'split' ? 'col-span-12 xl:col-span-7' : 'w-full'
            }`}
          >
            {/* Oblique Turntable Mount */}
            <motion.div
              style={{
                rotateX: shouldReduceMotion ? 0 : rotateX,
                rotateY: shouldReduceMotion ? 0 : rotateY,
                transformStyle: 'preserve-3d',
              }}
              className="relative flex items-center justify-center w-full max-w-[270px] sm:max-w-[300px] aspect-square will-change-transform my-2"
            >
              {/* Pedestal Floor Shadow */}
              <div
                className="absolute size-[220px] sm:size-[250px] rounded-full bg-slate-900/10 dark:bg-black/50 blur-2xl pointer-events-none"
                style={{ transform: 'translateZ(-30px) scale(0.95)' }}
              />

              {/* Fluid SVG (scales to fit container) */}
              <svg
                viewBox={`0 0 ${SVG_SIZE} ${SVG_SIZE}`}
                className="w-full h-full aspect-square overflow-visible select-none drop-shadow-xl"
                style={{
                  filter: 'drop-shadow(0 14px 20px rgba(15, 23, 42, 0.16))',
                }}
              >
                <defs>
                  {categoryData.map((item) => (
                    <linearGradient key={`grad-${item.key}`} id={`grad-${item.key}`} x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor={item.meta.color} stopOpacity="1" />
                      <stop offset="100%" stopColor={item.meta.color} stopOpacity="0.84" />
                    </linearGradient>
                  ))}
                </defs>

                {/* Slices Group */}
                {categoryData.map((item, idx) => {
                  const isSelected = activeCategoryIndex === idx
                  const pathData = describeDonutArc(CX, CY, R_OUTER, R_INNER, item.startAngle, item.endAngle)

                  return (
                    <motion.g
                      key={item.key}
                      onClick={() => handleSelectSlice(idx)}
                      onMouseEnter={() => handleSelectSlice(idx)}
                      animate={{
                        x: isSelected ? item.explodeX : 0,
                        y: isSelected ? item.explodeY : 0,
                        scale: isSelected ? 1.04 : 1,
                      }}
                      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
                      className="cursor-pointer"
                      style={{
                        transformOrigin: `${CX}px ${CY}px`,
                      }}
                    >
                      <path
                        d={pathData}
                        fill={`url(#grad-${item.key})`}
                        stroke={isSelected ? '#ffffff' : 'rgba(255, 255, 255, 0.4)'}
                        strokeWidth={isSelected ? 3.5 : 1.5}
                        strokeLinejoin="round"
                        className="transition-all duration-200 hover:brightness-110"
                        style={{
                          filter: isSelected
                            ? `drop-shadow(0 10px 14px ${item.meta.color}66)`
                            : 'none',
                        }}
                      />
                    </motion.g>
                  )
                })}
              </svg>

              {/* Center Cutout Cylinder */}
              <motion.div
                style={{
                  transform: 'translateZ(24px)',
                  WebkitFontSmoothing: 'antialiased',
                  MozOsxFontSmoothing: 'grayscale',
                  textRendering: 'geometricPrecision',
                }}
                className="absolute flex flex-col items-center justify-center size-[94px] sm:size-[102px] rounded-full bg-white/95 dark:bg-[#0b1222] border-2 border-slate-200/90 dark:border-slate-700 shadow-lg pointer-events-none text-center p-1.5"
              >
                <span className="text-[8px] sm:text-[9px] font-black uppercase tracking-wider text-slate-400">
                  {isUrdu ? 'کل خرچ' : 'TOTAL SPEND'}
                </span>
                <div className="my-0.5" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                  <RollingOdometer
                    value={totalCalculated.toLocaleString('en-PK')}
                    prefix={displayCurrency}
                    className="text-xs sm:text-sm font-black text-slate-900 dark:text-white"
                  />
                </div>
                <span className="text-[8px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-full border border-emerald-500/20">
                  100% Settled
                </span>
              </motion.div>
            </motion.div>

            {/* Active Slice Summary Card below Turntable */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory.key}
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.95 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="w-full max-w-[320px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-md px-3.5 py-2.5 rounded-2xl border-2 border-slate-200/80 dark:border-slate-700/80 shadow-md flex items-center justify-between gap-3 mt-1"
                style={{
                  borderLeftColor: activeCategory.meta.color,
                  borderLeftWidth: '4px'
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="size-8 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                    style={{ backgroundColor: activeCategory.meta.color }}
                  >
                    <activeCategory.meta.icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                        {isUrdu ? activeCategory.meta.ur : activeCategory.meta.en}
                      </span>
                    </div>
                    <p className="text-[11px] font-medium text-slate-400 truncate">
                      {activeCategory.vendor}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                  <span
                    className="inline-block text-[10px] font-mono font-black px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${activeCategory.meta.color}20`,
                      color: activeCategory.meta.color,
                    }}
                  >
                    {activeCategory.percentage}%
                  </span>
                  <div className="text-xs sm:text-sm font-mono font-black text-slate-900 dark:text-white mt-0.5">
                    {displayCurrency} {activeCategory.amount.toLocaleString('en-PK')}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* ================= INTERACTIVE PROGRESS BARS ================= */}
        {viewMode !== 'donut' && (
          <div
            className={`space-y-3 w-full ${
              isWide && viewMode === 'split' ? 'col-span-12 xl:col-span-5' : 'w-full'
            }`}
          >
            {/* Header Row */}
            <div className="flex items-center justify-between gap-2 px-1 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                {isUrdu ? 'تفصیلی اخراجات بریک ڈاؤن' : 'Breakdown by Stream'}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {categoryData.length} {isUrdu ? 'اقسام' : 'Streams'}
              </span>
            </div>

            {categoryData.map((item, idx) => {
              const isSelected = activeCategoryIndex === idx
              const Icon = item.meta.icon

              return (
                <motion.div
                  key={item.key}
                  onClick={() => handleSelectSlice(idx)}
                  onMouseEnter={() => handleSelectSlice(idx)}
                  whileHover={{ x: isRtl ? -4 : 4 }}
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                  className={`p-3.5 rounded-2xl border transition-all cursor-pointer select-none relative overflow-hidden ${
                    isSelected
                      ? 'bg-white dark:bg-slate-800/95 border-2 shadow-lg shadow-indigo-500/10'
                      : 'bg-white/70 dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-700/80 hover:bg-white dark:hover:bg-slate-800'
                  }`}
                  style={{
                    borderColor: isSelected ? item.meta.color : undefined,
                  }}
                >
                  {/* Active Indicator Line */}
                  {isSelected && (
                    <motion.div
                      layoutId="activeBarIndicator"
                      className="absolute top-0 bottom-0 left-0 w-1.5 rounded-r-full"
                      style={{ backgroundColor: item.meta.color }}
                    />
                  )}

                  {/* Top Row: Icon + Name (left) vs Amount + Badge (right) */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className="size-8 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                        style={{ backgroundColor: item.meta.color }}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 block leading-tight truncate">
                          {isUrdu ? item.meta.ur : item.meta.en}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 block mt-0.5 truncate">
                          {item.vendor}
                        </span>
                      </div>
                    </div>

                    {/* Amount and Share Pill */}
                    <div className="text-right shrink-0" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                      <span className="text-xs sm:text-sm font-black font-mono text-slate-900 dark:text-slate-100 whitespace-nowrap block">
                        {displayCurrency} {item.amount.toLocaleString('en-PK')}
                      </span>
                      <span
                        className="inline-block text-[10px] font-mono font-black px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap"
                        style={{
                          backgroundColor: `${item.meta.color}20`,
                          color: item.meta.color,
                        }}
                      >
                        {item.percentage}% {isUrdu ? 'حصہ' : 'share'}
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Progress Track */}
                  <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-700/60 overflow-hidden relative">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.percentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut', delay: idx * 0.06 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: item.meta.color }}
                    />
                  </div>
                </motion.div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

export default Charts

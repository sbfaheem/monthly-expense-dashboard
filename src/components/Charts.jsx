import React, { useState, useMemo, useRef, useEffect } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Zap,
  Trash2,
  Wrench,
  Sparkles,
  PieChart,
  Layers,
  Video,
  LayoutGrid
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { soundEffects } from '../utils/soundEffects'
import { getParentCategory, normalizeItem } from '../utils/normalizeExpense'
import { translations, translateCategory, translateItemName, translateMonth } from '../utils/translations'
import RollingOdometer from './RollingOdometer'

// Helper to resolve parent category and metadata matching Dashboard standards
function getCategoryInfo(item, isUrdu = false) {
  const normName = normalizeItem(item.name || '')
  const parentCat = getParentCategory(normName, item.category)
  
  const lowerName = (item.name || '').toLowerCase()
  const lowerCat = (item.category || '').toLowerCase()

  // Specific check for dedicated sanitation & waste stream
  if (
    lowerName.includes('gutter') ||
    lowerName.includes('kacha') ||
    lowerName.includes('garbage') ||
    lowerCat.includes('waste') ||
    lowerCat.includes('sanitation')
  ) {
    return {
      key: 'sanitation',
      titleEn: 'Sanitation & Waste Disposal',
      titleUr: 'صفائی اور کچرا تلفی',
      icon: Trash2,
      color: '#10b981',
      defaultItemEn: 'Waste Disposal & Gutter Cleaning',
      defaultItemUr: 'کچرا تلفی و گٹر صفائی'
    }
  }

  if (parentCat === 'Salaries & Payroll') {
    return {
      key: 'salaries',
      titleEn: 'Salaries & Payroll',
      titleUr: 'عملہ اور تنخواہیں',
      icon: Shield,
      color: '#3b82f6',
      defaultItemEn: 'Security Expense, Sweeper Salary',
      defaultItemUr: 'سیکیورٹی گارڈز بل، خاکروب تنخواہ'
    }
  }

  if (parentCat === 'Electrical & Infrastructure') {
    return {
      key: 'electrical',
      titleEn: 'Electrical & Infrastructure',
      titleUr: 'برقی و بجلی کا نظام',
      icon: Zap,
      color: '#f59e0b',
      defaultItemEn: 'Electrical Accessories, Electrician Charges',
      defaultItemUr: 'برقی آلات و سامان، الیکٹریشن چارجز'
    }
  }

  if (parentCat === 'Capital Expenditures (CapEx)') {
    return {
      key: 'capex',
      titleEn: 'Capital Expenditures (CapEx)',
      titleUr: 'بڑے اثاثے (CapEx)',
      icon: Video,
      color: '#ec4899',
      defaultItemEn: 'CCTV Security Cameras',
      defaultItemUr: 'سی سی ٹی وی کیمرے'
    }
  }

  if (parentCat === 'Supplies & Hardware') {
    return {
      key: 'supplies',
      titleEn: 'Supplies & Hardware',
      titleUr: 'صفائی اور ہارڈویئر سامان',
      icon: Wrench,
      color: '#06b6d4',
      defaultItemEn: 'Staff Uniforms, Locks & Cleaning Tools',
      defaultItemUr: 'اسٹاف یونیفارم، تالے و صفائی سامان'
    }
  }

  // Community & Utilities (default)
  return {
    key: 'community',
    titleEn: 'Community & Utilities',
    titleUr: 'باغبانی، پانی اور تقریبات',
    icon: Sparkles,
    color: '#8b5cf6',
    defaultItemEn: 'Water Tanker, Park & Event Expenses',
    defaultItemUr: 'واٹر ٹینکر، پارک اور تقریبات'
  }
}

// SVG Arc Math Helper for 3D Donut
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
  selectedMonth = '',
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

  const { lang, t: contextT, isRtl } = useLanguage ? useLanguage() : { lang: 'en', t: {}, isRtl: false }
  const isUrdu = lang === 'ur'
  const t = contextT && Object.keys(contextT).length > 0 ? contextT : (translations[lang] || translations.en)
  const displayCurrency = isUrdu ? 'روپے' : currency
  const shouldReduceMotion = useReducedMotion()

  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0)
  // View mode: 'donut' | 'split' | 'bars'
  const [viewMode, setViewMode] = useState('split')

  // Aggregate monthly expenses into standard categories from the Monthly Expense Dashboard
  const categoryData = useMemo(() => {
    const map = {}
    
    if (Array.isArray(expenses) && expenses.length > 0) {
      expenses.forEach((item) => {
        const info = getCategoryInfo(item, isUrdu)
        const amt = Number(item.amount || item.cost || 0)
        const normName = normalizeItem(item.name || '')
        const translatedItemName = isUrdu ? translateItemName(normName, 'ur') : normName

        if (!map[info.key]) {
          map[info.key] = {
            key: info.key,
            title: isUrdu ? info.titleUr : info.titleEn,
            titleEn: info.titleEn,
            titleUr: info.titleUr,
            icon: info.icon,
            color: info.color,
            amount: 0,
            itemNames: [],
            defaultSubtitle: isUrdu ? info.defaultItemUr : info.defaultItemEn
          }
        }
        map[info.key].amount += amt
        if (normName && !map[info.key].itemNames.includes(translatedItemName)) {
          map[info.key].itemNames.push(translatedItemName)
        }
      })
    }

    let source = Object.values(map)
    
    // Fallback using official September 2026 expense figures if no items passed
    if (source.length === 0) {
      source = [
        {
          key: 'salaries',
          title: isUrdu ? 'عملہ اور تنخواہیں' : 'Salaries & Payroll',
          icon: Shield,
          color: '#3b82f6',
          amount: 257525,
          defaultSubtitle: isUrdu ? 'سیکیورٹی گارڈز بل، خاکروب تنخواہ' : 'Security Expense, Sweeper Salary',
          itemNames: [isUrdu ? 'سیکیورٹی گارڈز بل، خاکروب تنخواہ' : 'Security Expense, Sweeper Salary']
        },
        {
          key: 'electrical',
          title: isUrdu ? 'برقی و بجلی کا نظام' : 'Electrical & Infrastructure',
          icon: Zap,
          color: '#f59e0b',
          amount: 17700,
          defaultSubtitle: isUrdu ? 'برقی آلات و سامان، الیکٹریشن چارجز' : 'Electrical Accessories, Electrician Charges',
          itemNames: [isUrdu ? 'برقی آلات و سامان، الیکٹریشن چارجز' : 'Electrical Accessories, Electrician Charges']
        },
        {
          key: 'capex',
          title: isUrdu ? 'بڑے اثاثے (CapEx)' : 'Capital Expenditures (CapEx)',
          icon: Video,
          color: '#ec4899',
          amount: 9000,
          defaultSubtitle: isUrdu ? 'سی سی ٹی وی کیمرے' : 'CCTV Security Cameras',
          itemNames: [isUrdu ? 'سی سی ٹی وی کیمرے' : 'CCTV Security Cameras']
        },
        {
          key: 'community',
          title: isUrdu ? 'باغبانی، پانی اور تقریبات' : 'Community & Utilities',
          icon: Sparkles,
          color: '#8b5cf6',
          amount: 7700,
          defaultSubtitle: isUrdu ? 'متفرق اخراجات، واٹر ٹینکر' : 'Miscellaneous Expenses, Water Tanker',
          itemNames: [isUrdu ? 'متفرق اخراجات، واٹر ٹینکر' : 'Miscellaneous Expenses, Water Tanker']
        },
        {
          key: 'supplies',
          title: isUrdu ? 'صفائی اور ہارڈویئر سامان' : 'Supplies & Hardware',
          icon: Wrench,
          color: '#06b6d4',
          amount: 3500,
          defaultSubtitle: isUrdu ? 'اسٹاف یونیفارم' : 'Staff Uniforms',
          itemNames: [isUrdu ? 'اسٹاف یونیفارم' : 'Staff Uniforms']
        },
        {
          key: 'sanitation',
          title: isUrdu ? 'صفائی اور کچرا تلفی' : 'Sanitation & Waste Disposal',
          icon: Trash2,
          color: '#10b981',
          amount: 2000,
          defaultSubtitle: isUrdu ? 'گٹر صفائی' : 'Gutter Cleaning',
          itemNames: [isUrdu ? 'گٹر صفائی' : 'Gutter Cleaning']
        }
      ]
    }

    // Sort descending by amount so the largest allocation leads
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

      const midRad = (midAngle - 90) * (Math.PI / 180)
      const subtitle = (item.itemNames && item.itemNames.length > 0)
        ? item.itemNames.slice(0, 3).join(isUrdu ? '، ' : ', ')
        : item.defaultSubtitle

      return {
        ...item,
        index: idx,
        percentage: pct.toFixed(1),
        startAngle,
        endAngle: Math.min(endAngle, 359.99),
        midAngle,
        explodeX: Math.cos(midRad) * 14,
        explodeY: Math.sin(midRad) * 14,
        subtitle
      }
    })
  }, [expenses, totalExpense, isUrdu])

  const totalCalculated = useMemo(() => {
    return categoryData.reduce((sum, item) => sum + item.amount, 0)
  }, [categoryData])

  const activeCategory = categoryData[activeCategoryIndex] || categoryData[0] || {
    key: 'salaries',
    title: isUrdu ? 'عملہ اور تنخواہیں' : 'Salaries & Payroll',
    subtitle: isUrdu ? 'سیکیورٹی گارڈز بل، خاکروب تنخواہ' : 'Security Expense, Sweeper Salary',
    percentage: '100',
    amount: totalCalculated,
    color: '#3b82f6',
    icon: Shield
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
      {/* ─── Header & Segmented View Controls (Standard Dashboard Text) ─── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 px-1">
        <div className="flex items-center gap-3">
          <div className="size-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <PieChart size={20} className="stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {t.expenseBreakdown || (isUrdu ? 'اخراجات کی تفصیل' : 'Expense Breakdown')}
              </h3>
              <span className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-xs">
                3D EXPLODED VIEW
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              {isUrdu
                ? 'کسی بھی شعبے پر ٹیپ یا ہوور کر کے 3D پاپ آؤٹ سلائس اور تفصیلات دیکھیں'
                : 'Tap or hover on any sector or category item to pop out slices in 3D perspective'}
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
            <LayoutGrid size={13} />
            <span>{isUrdu ? 'شعبہ جات' : 'Categories'}</span>
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
                      <stop offset="0%" stopColor={item.color} stopOpacity="1" />
                      <stop offset="100%" stopColor={item.color} stopOpacity="0.84" />
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
                            ? `drop-shadow(0 10px 14px ${item.color}66)`
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
                  {t.totalSpend || (isUrdu ? 'مجموعی خرچ' : 'TOTAL SPEND')}
                </span>
                <div className="my-0.5" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                  <RollingOdometer
                    value={totalCalculated.toLocaleString('en-PK')}
                    prefix={displayCurrency}
                    className="text-xs sm:text-sm font-black text-slate-900 dark:text-white"
                  />
                </div>
                <span className="text-[8px] font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.2 rounded-full border border-emerald-500/20">
                  {isUrdu ? translateMonth(selectedMonth || 'October 2026', 'ur') : (selectedMonth || 'October 2026')}
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
                  borderLeftColor: activeCategory.color,
                  borderLeftWidth: '4px'
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="size-8 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                    style={{ backgroundColor: activeCategory.color }}
                  >
                    <activeCategory.icon size={16} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate block">
                      {activeCategory.title}
                    </span>
                    <p className="text-[11px] font-medium text-slate-400 truncate">
                      {activeCategory.subtitle}
                    </p>
                  </div>
                </div>
                <div className="text-right shrink-0" dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }}>
                  <span
                    className="inline-block text-[10px] font-mono font-black px-1.5 py-0.5 rounded"
                    style={{
                      backgroundColor: `${activeCategory.color}20`,
                      color: activeCategory.color,
                    }}
                  >
                    {activeCategory.percentage}% {isUrdu ? 'حصہ' : 'share'}
                  </span>
                  <div className="text-xs sm:text-sm font-mono font-black text-slate-900 dark:text-white mt-0.5">
                    {displayCurrency} {activeCategory.amount.toLocaleString('en-PK')}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        )}

        {/* ================= CATEGORY BREAKDOWN CARDS ================= */}
        {viewMode !== 'donut' && (
          <div
            className={`space-y-3 w-full ${
              isWide && viewMode === 'split' ? 'col-span-12 xl:col-span-5' : 'w-full'
            }`}
          >
            {/* Header Row */}
            <div className="flex items-center justify-between gap-2 px-1 mb-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                {isUrdu ? 'شعبہ وار اخراجات کی تفصیل' : 'Expense Breakdown by Category'}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {categoryData.length} {isUrdu ? 'شعبہ جات' : 'Categories'}
              </span>
            </div>

            {categoryData.map((item, idx) => {
              const isSelected = activeCategoryIndex === idx
              const Icon = item.icon

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
                    borderColor: isSelected ? item.color : undefined,
                  }}
                >
                  {/* Active Indicator Line */}
                  {isSelected && (
                    <motion.div
                      layoutId="activeBarIndicator"
                      className="absolute top-0 bottom-0 left-0 w-1.5 rounded-r-full"
                      style={{ backgroundColor: item.color }}
                    />
                  )}

                  {/* Top Row: Icon + Name (left) vs Amount + Badge (right) */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <div
                        className="size-8 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                        style={{ backgroundColor: item.color }}
                      >
                        <Icon size={16} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 block leading-tight truncate">
                          {item.title}
                        </span>
                        <span className="text-[11px] font-medium text-slate-400 block mt-0.5 truncate">
                          {item.subtitle}
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
                          backgroundColor: `${item.color}20`,
                          color: item.color,
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
                      style={{ backgroundColor: item.color }}
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

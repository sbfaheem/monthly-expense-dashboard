import React, { useState, useMemo, useRef, useEffect, Suspense } from 'react'
import { motion, useInView, useReducedMotion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Zap,
  Trash2,
  Wrench,
  Sparkles,
  PieChart,
  Layers,
  Video,
  LayoutGrid,
  RotateCcw,
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { soundEffects } from '../utils/soundEffects'
import { getParentCategory, normalizeItem } from '../utils/normalizeExpense'
import { translations, translateItemName } from '../utils/translations'
import { getUrlParam, updateUrlParams } from '../utils/urlState'
import GlassCard from './motion/GlassCard'
import AnimatedNumber from './motion/AnimatedNumber'
import CategoryCard from './charts/CategoryCard'
import RollUpChips from './charts/RollUpChips'

const Donut3D = React.lazy(() => import('./charts/Donut3D'))

// Helper to resolve parent category and metadata matching Dashboard standards
function getCategoryInfo(item) {
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
      defaultItemUr: 'کچرا تلفی و گٹر صفائی',
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
      defaultItemUr: 'سیکیورٹی گارڈز بل، خاکروب تنخواہ',
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
      defaultItemUr: 'برقی آلات و سامان، الیکٹریشن چارجز',
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
      defaultItemUr: 'سی سی ٹی وی کیمرے',
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
      defaultItemUr: 'اسٹاف یونیفارم، تالے و صفائی سامان',
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
    defaultItemUr: 'واٹر ٹینکر، پارک اور تقریبات',
  }
}

function DonutSkeletonPlaceholder({ isUrdu }) {
  return (
    <div className="w-full h-[270px] sm:h-[330px] flex flex-col items-center justify-center gap-3">
      <div className="size-48 sm:size-56 rounded-full border-[18px] border-indigo-500/20 dark:border-white/10 animate-pulse flex items-center justify-center">
        <span className="text-[11px] font-mono font-bold text-slate-400">
          {isUrdu ? '3D چارٹ لوڈ ہو رہا ہے...' : 'Loading 3D Canvas...'}
        </span>
      </div>
    </div>
  )
}

export const Charts = ({
  expenses = [],
  selectedMonth = '',
  totalExpense = 297425,
  currency = 'PKR',
}) => {
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.12 })
  const [containerWidth, setContainerWidth] = useState(0)
  const [replayKey, setReplayKey] = useState(0)

  useEffect(() => {
    if (!sectionRef.current) return
    const updateWidth = () => {
      if (sectionRef.current) {
        setContainerWidth(sectionRef.current.clientWidth)
      }
    }
    updateWidth()
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerWidth(entry.contentRect.width)
      }
    })
    ro.observe(sectionRef.current)
    return () => ro.disconnect()
  }, [])

  const isWide = containerWidth >= 680

  const { lang, t: contextT, isRtl } = useLanguage ? useLanguage() : { lang: 'en', t: {}, isRtl: false }
  const isUrdu = lang === 'ur'
  const t = contextT && Object.keys(contextT).length > 0 ? contextT : (translations[lang] || translations.en)
  const displayCurrency = isUrdu ? 'روپے' : currency
  const shouldReduceMotion = useReducedMotion()

  const [activeCategoryIndex, setActiveCategoryIndex] = useState(0)

  // View mode: 'donut' | 'split' | 'bars' (synced with URL ?chart=)
  const [viewMode, setViewMode] = useState(() => {
    const param = getUrlParam('chart') || getUrlParam('view')
    if (param === 'donut' || param === 'split' || param === 'bars') {
      return param
    }
    return 'split'
  })

  const handleViewModeChange = (mode) => {
    soundEffects.playBounce()
    setViewMode(mode)
    updateUrlParams({ chart: mode }, true)
  }

  useEffect(() => {
    const handlePopState = () => {
      const mode = getUrlParam('chart') || getUrlParam('view')
      if (mode === 'donut' || mode === 'split' || mode === 'bars') {
        setViewMode(mode)
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  // Aggregate monthly expenses + per-category constituent line items for Roll-Up Animation
  const categoryData = useMemo(() => {
    const map = {}

    if (Array.isArray(expenses) && expenses.length > 0) {
      expenses.forEach((item, idx) => {
        const info = getCategoryInfo(item)
        const amt = Number(item.amount || item.cost || 0)
        const normName = normalizeItem(item.name || '') || item.name || `Item ${idx + 1}`
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
            lineItemsMap: {},
            defaultSubtitle: isUrdu ? info.defaultItemUr : info.defaultItemEn,
          }
        }
        map[info.key].amount += amt

        if (!map[info.key].lineItemsMap[normName]) {
          map[info.key].lineItemsMap[normName] = {
            key: `${info.key}-${normName}`,
            name: normName,
            translatedName: translatedItemName,
            amount: 0,
          }
        }
        map[info.key].lineItemsMap[normName].amount += amt

        if (normName && !map[info.key].itemNames.includes(translatedItemName)) {
          map[info.key].itemNames.push(translatedItemName)
        }
      })
    }

    let source = Object.values(map).map((cat) => {
      const lineItems = Object.values(cat.lineItemsMap || {}).sort((a, b) => b.amount - a.amount)
      return {
        ...cat,
        lineItems,
      }
    })

    // Fallback when expenses array is empty
    if (source.length === 0) {
      source = [
        {
          key: 'salaries',
          title: isUrdu ? 'عملہ اور تنخواہیں' : 'Salaries & Payroll',
          icon: Shield,
          color: '#3b82f6',
          amount: 257525,
          defaultSubtitle: isUrdu ? 'سیکیورٹی گارڈز بل، خاکروب تنخواہ' : 'Security Expense, Sweeper Salary',
          itemNames: [isUrdu ? 'سیکیورٹی گارڈز بل، خاکروب تنخواہ' : 'Security Expense, Sweeper Salary'],
          lineItems: [
            { key: 'sec', name: 'Security Expense', translatedName: 'سیکیورٹی اخراجات', amount: 217525 },
            { key: 'swp', name: 'Sweeper Salary', translatedName: 'خاکروب تنخواہ', amount: 30000 },
            { key: 'elr', name: 'Electrician - Retainer', translatedName: 'الیکٹریشن ماہانہ', amount: 10000 },
          ],
        },
        {
          key: 'electrical',
          title: isUrdu ? 'برقی و بجلی کا نظام' : 'Electrical & Infrastructure',
          icon: Zap,
          color: '#f59e0b',
          amount: 17700,
          defaultSubtitle: isUrdu ? 'برقی آلات و سامان، الیکٹریشن چارجز' : 'Electrical Accessories, Electrician Charges',
          itemNames: [isUrdu ? 'برقی آلات و سامان، الیکٹریشن چارجز' : 'Electrical Accessories, Electrician Charges'],
          lineItems: [
            { key: 'elacc', name: 'Electrical Accessories', translatedName: 'برقی آلات و سامان', amount: 17700 },
          ],
        },
        {
          key: 'capex',
          title: isUrdu ? 'بڑے اثاثے (CapEx)' : 'Capital Expenditures (CapEx)',
          icon: Video,
          color: '#ec4899',
          amount: 9000,
          defaultSubtitle: isUrdu ? 'سی سی ٹی وی کیمرے' : 'CCTV Security Cameras',
          itemNames: [isUrdu ? 'سی سی ٹی وی کیمرے' : 'CCTV Security Cameras'],
          lineItems: [
            { key: 'cctv', name: 'CCTV Cameras', translatedName: 'سی سی ٹی وی کیمرے', amount: 9000 },
          ],
        },
        {
          key: 'community',
          title: isUrdu ? 'باغبانی، پانی اور تقریبات' : 'Community & Utilities',
          icon: Sparkles,
          color: '#8b5cf6',
          amount: 7700,
          defaultSubtitle: isUrdu ? 'متفرق اخراجات، واٹر ٹینکر' : 'Miscellaneous Expenses, Water Tanker',
          itemNames: [isUrdu ? 'متفرق اخراجات، واٹر ٹینکر' : 'Miscellaneous Expenses, Water Tanker'],
          lineItems: [
            { key: 'misc', name: 'Miscellaneous Expenses', translatedName: 'متفرق اخراجات', amount: 7700 },
          ],
        },
        {
          key: 'supplies',
          title: isUrdu ? 'صفائی اور ہارڈویئر سامان' : 'Supplies & Hardware',
          icon: Wrench,
          color: '#06b6d4',
          amount: 3500,
          defaultSubtitle: isUrdu ? 'اسٹاف یونیفارم' : 'Staff Uniforms',
          itemNames: [isUrdu ? 'اسٹاف یونیفارم' : 'Staff Uniforms'],
          lineItems: [
            { key: 'unif', name: 'Uniforms', translatedName: 'اسٹاف یونیفارم', amount: 3500 },
          ],
        },
        {
          key: 'sanitation',
          title: isUrdu ? 'صفائی اور کچرا تلفی' : 'Sanitation & Waste Disposal',
          icon: Trash2,
          color: '#10b981',
          amount: 2000,
          defaultSubtitle: isUrdu ? 'گٹر صفائی' : 'Gutter Cleaning',
          itemNames: [isUrdu ? 'گٹر صفائی' : 'Gutter Cleaning'],
          lineItems: [
            { key: 'gut', name: 'Gutter Cleaning', translatedName: 'گٹر صفائی', amount: 2000 },
          ],
        },
      ]
    }

    // Filter non-positive slices and sort descending so largest allocation leads cleanly
    source = source.filter((c) => Number(c.amount) > 0)
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
      const subtitle =
        item.itemNames && item.itemNames.length > 0
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
        subtitle,
      }
    })
  }, [expenses, totalExpense, isUrdu])

  const totalCalculated = useMemo(() => {
    return categoryData.reduce((sum, item) => sum + item.amount, 0)
  }, [categoryData])

  const safeActiveIdx = activeCategoryIndex < categoryData.length ? activeCategoryIndex : 0
  const activeCategory = categoryData[safeActiveIdx] || categoryData[0] || {
    key: 'salaries',
    title: isUrdu ? 'عملہ اور تنخواہیں' : 'Salaries & Payroll',
    subtitle: isUrdu ? 'سیکیورٹی گارڈز بل، خاکروب تنخواہ' : 'Security Expense, Sweeper Salary',
    percentage: '100',
    amount: totalCalculated,
    color: '#3b82f6',
    icon: Shield,
    lineItems: [],
  }

  const handleSelectSlice = (idx) => {
    if (safeActiveIdx !== idx) {
      soundEffects.playBounce()
      setActiveCategoryIndex(idx)
    }
  }

  const handleReplay = () => {
    soundEffects.playBounce()
    setReplayKey((k) => k + 1)
  }

  const tabs = [
    { id: 'donut', label: isUrdu ? '3D ڈونٹ' : '3D Donut', icon: Layers },
    { id: 'split', label: isUrdu ? 'مشترکہ' : 'Split', icon: Sparkles },
    { id: 'bars', label: isUrdu ? 'شعبہ جات' : 'Categories', icon: LayoutGrid },
  ]

  return (
    <section ref={sectionRef} className="w-full my-8">
      {/* ─── Header, Segmented View Tabs (layoutId pill) & Replay Trigger ─── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5 mb-5 px-1">
        <div className="flex items-start sm:items-center gap-3 min-w-0">
          <div className="size-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20 shrink-0">
            <PieChart size={20} className="stroke-[2.5]" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base sm:text-lg md:text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight whitespace-nowrap">
                {t.expenseBreakdown || (isUrdu ? 'اخراجات کی تفصیل' : 'Expense Breakdown')}
              </h3>
              <span className="text-[10px] font-mono font-extrabold uppercase px-2.5 py-0.5 rounded-full bg-blue-500/12 text-blue-700 dark:text-blue-300 border border-blue-400/35 whitespace-nowrap">
                {isUrdu ? '3D تفصیلی منظر' : '3D GLASS DONUT'}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">
              {isUrdu
                ? 'کسی بھی شعبے پر ٹیپ یا ہوور کر کے 3D سلائس اور مدات کا مجموعہ دیکھیں'
                : 'Tap or hover any 3D slice or category card to see how line items roll up into Total Spend'}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-2 flex-wrap">
          {/* Animated Framer Motion layoutId Tab Switcher */}
          <div className="inline-flex items-center p-1 rounded-2xl bg-white/65 dark:bg-white/[0.07] backdrop-blur-md border border-slate-200/80 dark:border-white/12 shadow-inner max-w-full overflow-x-auto">
            {tabs.map((tab) => {
              const Icon = tab.icon
              const isActive = viewMode === tab.id
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => handleViewModeChange(tab.id)}
                  className={`relative min-h-[44px] sm:min-h-[38px] inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-black transition-colors cursor-pointer whitespace-nowrap z-10 ${
                    isActive
                      ? 'text-slate-900 dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="chartsViewTabPill"
                      transition={{ type: 'spring', stiffness: 360, damping: 28 }}
                      className="absolute inset-0 rounded-xl bg-white dark:bg-slate-800 shadow-sm border border-slate-200/70 dark:border-white/15 -z-10"
                    />
                  )}
                  <Icon size={13} />
                  <span>{tab.label}</span>
                </button>
              )
            })}
          </div>

          <button
            type="button"
            onClick={handleReplay}
            className="min-h-[44px] sm:min-h-[38px] px-3.5 py-1.5 rounded-2xl bg-white/70 hover:bg-white/95 dark:bg-white/[0.08] dark:hover:bg-white/[0.14] border border-slate-200/80 dark:border-white/15 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer whitespace-nowrap"
          >
            <RotateCcw size={14} className="text-blue-600 dark:text-blue-300" />
            <span>{isUrdu ? 'دوبارہ دیکھیں' : 'Replay'}</span>
          </button>
        </div>
      </div>

      {/* ─── Main 3D Display Stage ─── */}
      <div
        className={
          isWide && viewMode === 'split'
            ? 'grid grid-cols-12 gap-6 items-start'
            : 'flex flex-col gap-5 w-full'
        }
      >
        {/* ================= LEFT / TOP: REAL 3D EXTRUDED GLASS DONUT + DETAIL + ROLL-UP ================= */}
        {viewMode !== 'bars' && (
          <GlassCard
            glow="indigo"
            className={`p-4 sm:p-5 rounded-3xl flex flex-col items-center justify-between w-full ${
              isWide && viewMode === 'split' ? 'col-span-12 lg:col-span-7' : 'w-full'
            }`}
          >
            {/* Lazy-Loaded R3F Extruded 3D Donut */}
            <Suspense fallback={<DonutSkeletonPlaceholder isUrdu={isUrdu} />}>
              <Donut3D
                categoryData={categoryData}
                activeCategoryIndex={safeActiveIdx}
                onSelectSlice={handleSelectSlice}
                totalCalculated={totalCalculated}
                displayCurrency={displayCurrency}
                selectedMonth={selectedMonth || 'October 2026'}
                isUrdu={isUrdu}
                inView={inView}
                replayKey={replayKey}
                totalSpendLabel={t.totalSpend || (isUrdu ? 'مجموعی خرچ' : 'TOTAL SPEND')}
              />
            </Suspense>

            {/* Floating Detail Card sliding up under Donut */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory.key}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -8, scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 320, damping: 24 }}
                className="w-full max-w-[440px] bg-white/85 dark:bg-slate-900/85 backdrop-blur-xl px-4 py-3 rounded-2xl border border-white/80 dark:border-white/15 shadow-lg flex items-center justify-between gap-3 mt-1"
                style={{
                  borderLeftColor: activeCategory.color,
                  borderLeftWidth: '4px',
                  boxShadow: `0 12px 28px -12px ${activeCategory.color}55`,
                }}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="size-9 rounded-xl flex items-center justify-center text-white shadow-xs shrink-0"
                    style={{ backgroundColor: activeCategory.color }}
                  >
                    <activeCategory.icon size={17} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate block">
                      {activeCategory.title}
                    </span>
                    <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                      {activeCategory.subtitle}
                    </p>
                  </div>
                </div>

                <div
                  className="text-right shrink-0"
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                >
                  <span
                    className="inline-block text-[10px] font-mono font-black px-2 py-0.5 rounded-full whitespace-nowrap"
                    style={{
                      backgroundColor: `${activeCategory.color}20`,
                      color: activeCategory.color,
                    }}
                  >
                    {activeCategory.percentage}% {isUrdu ? 'حصہ' : 'share'}
                  </span>
                  <AnimatedNumber
                    value={activeCategory.amount}
                    from={activeCategory.amount}
                    prefix={displayCurrency}
                    duration={0.45}
                    className="text-xs sm:text-sm font-black text-slate-900 dark:text-white mt-0.5 block"
                  />
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Real Line-Item Roll-Up Visualization for Active Category */}
            <RollUpChips
              category={activeCategory}
              totalCalculated={totalCalculated}
              displayCurrency={displayCurrency}
              isUrdu={isUrdu}
              replayKey={replayKey}
            />
          </GlassCard>
        )}

        {/* ================= RIGHT / BOTTOM: TWO-WAY LINKED GLASS CATEGORY CARDS ================= */}
        {viewMode !== 'donut' && (
          <div
            className={`w-full space-y-3 ${
              isWide && viewMode === 'split' ? 'col-span-12 lg:col-span-5' : 'w-full'
            }`}
          >
            {/* Header Row */}
            <div className="flex items-center justify-between gap-2 px-1">
              <span className="text-xs font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
                {isUrdu ? 'شعبہ وار اخراجات کی تفصیل' : 'Expense Breakdown by Category'}
              </span>
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {categoryData.length} {isUrdu ? 'شعبہ جات' : 'Categories'}
              </span>
            </div>

            <div
              className={
                viewMode === 'bars' && isWide
                  ? 'grid grid-cols-1 md:grid-cols-2 gap-3'
                  : 'space-y-2.5'
              }
            >
              {categoryData.map((item, idx) => (
                <CategoryCard
                  key={item.key}
                  item={item}
                  index={idx}
                  isSelected={safeActiveIdx === idx}
                  onSelect={handleSelectSlice}
                  displayCurrency={displayCurrency}
                  isUrdu={isUrdu}
                  isRtl={isRtl}
                  inView={inView}
                  replayKey={replayKey}
                />
              ))}
            </div>

            {viewMode === 'bars' && (
              <RollUpChips
                category={activeCategory}
                totalCalculated={totalCalculated}
                displayCurrency={displayCurrency}
                isUrdu={isUrdu}
                replayKey={replayKey}
              />
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default Charts

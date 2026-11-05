import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Line, Bar } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Filler,
} from 'chart.js'

import { getParentCategory } from '../utils/normalizeExpense'
import { getMonthSortKey } from '../utils/finance'
import { useLanguage } from '../context/LanguageContext'
import { translateCategory, translateMonth } from '../utils/translations'

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Filler)

const CATEGORY_COLORS = {
  'Salaries & Payroll': '#1E293B', // Slate Navy
  'Payroll': '#1E293B',
  'Community & Utilities': '#8B5CF6', // Purple
  'Electrical & Maintenance': '#F59E0B', // Amber
  'Electrical & Infrastructure': '#F59E0B', // Amber
  'Supplies & Hardware': '#06B6D4', // Cyan
  'Capital Expenditures (CapEx)': '#EF4444', // Red
}

const FALLBACK_PALETTE = ['#1E293B', '#8B5CF6', '#F59E0B', '#06B6D4', '#EF4444', '#3B82F6', '#EC4899', '#6366F1']

// SVG Donut slice generator
function getDonutSlicePath(cx, cy, rIn, rOut, startAngle, endAngle) {
  const isFullCircle = endAngle - startAngle >= 2 * Math.PI - 0.001
  if (isFullCircle) {
    return [
      `M ${cx} ${cy - rOut}`,
      `A ${rOut} ${rOut} 0 1 0 ${cx} ${cy + rOut}`,
      `A ${rOut} ${rOut} 0 1 0 ${cx} ${cy - rOut}`,
      `M ${cx} ${cy - rIn}`,
      `A ${rIn} ${rIn} 0 1 1 ${cx} ${cy + rIn}`,
      `A ${rIn} ${rIn} 0 1 1 ${cx} ${cy - rIn}`,
      'Z'
    ].join(' ')
  }

  const x1 = cx + rOut * Math.cos(startAngle)
  const y1 = cy + rOut * Math.sin(startAngle)
  const x2 = cx + rOut * Math.cos(endAngle)
  const y2 = cy + rOut * Math.sin(endAngle)
  const x3 = cx + rIn * Math.cos(endAngle)
  const y3 = cy + rIn * Math.sin(endAngle)
  const x4 = cx + rIn * Math.cos(startAngle)
  const y4 = cy + rIn * Math.sin(startAngle)

  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0

  return [
    `M ${x1} ${y1}`,
    `A ${rOut} ${rOut} 0 ${largeArc} 1 ${x2} ${y2}`,
    `L ${x3} ${y3}`,
    `A ${rIn} ${rIn} 0 ${largeArc} 0 ${x4} ${y4}`,
    'Z'
  ].join(' ')
}

// Persistent Peak Callout Badge Plugin for Line Chart
const peakCalloutPlugin = {
  id: 'peakCallout',
  afterDraw(chart) {
    if (!chart.config.options.plugins?.peakCallout?.display) return
    const text = chart.config.options.plugins.peakCallout.text
    if (!text) return

    const datasets = chart.data.datasets
    const expDatasetIdx = datasets.findIndex(d => d.label === 'Total Expenses' || d.label === 'Expense')
    if (expDatasetIdx === -1) return

    const meta = chart.getDatasetMeta(expDatasetIdx)
    if (!meta || !meta.data || meta.data.length === 0) return

    const lastPoint = meta.data[meta.data.length - 1]
    if (!lastPoint) return

    const { x, y } = lastPoint
    const ctx = chart.ctx

    ctx.save()

    // Outer subtle red halo around active node
    ctx.beginPath()
    ctx.arc(x, y, 9, 0, Math.PI * 2)
    ctx.fillStyle = 'rgba(239, 68, 68, 0.25)'
    ctx.fill()

    ctx.font = '700 10.5px Manrope, Inter, sans-serif'
    const textWidth = ctx.measureText(text).width
    const badgePadX = 8
    const badgeWidth = textWidth + badgePadX * 2
    const badgeHeight = 22

    // Clamp badgeX so it doesn't get clipped on mobile viewports
    const chartArea = chart.chartArea
    let badgeX = x - badgeWidth / 2
    if (chartArea) {
      if (badgeX + badgeWidth > chartArea.right) {
        badgeX = chartArea.right - badgeWidth
      }
      if (badgeX < chartArea.left) {
        badgeX = chartArea.left
      }
    }
    const badgeY = y - 32

    // Pointer downward tick
    ctx.beginPath()
    ctx.moveTo(x - 5, badgeY + badgeHeight)
    ctx.lineTo(x, badgeY + badgeHeight + 5)
    ctx.lineTo(x + 5, badgeY + badgeHeight)
    ctx.closePath()
    ctx.fillStyle = '#EF4444'
    ctx.fill()

    // Badge rounded rect
    const radius = 6
    ctx.beginPath()
    if (ctx.roundRect) {
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, radius)
    } else {
      ctx.rect(badgeX, badgeY, badgeWidth, badgeHeight)
    }
    ctx.fillStyle = '#EF4444'
    ctx.fill()

    // Subtle crisp border
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1.2
    ctx.stroke()

    // Badge text
    ctx.fillStyle = '#ffffff'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, badgeX + badgeWidth / 2, badgeY + badgeHeight / 2)

    ctx.restore()
  }
}

function formatShortMonth(monthStr) {
  if (!monthStr || typeof monthStr !== 'string') return ''
  const parts = monthStr.trim().split(/\s+/)
  if (parts.length >= 2) {
    const month = (parts[0] || '').slice(0, 3)
    const year = parts[1]?.length === 4 ? `'${parts[1].slice(2)}` : parts[1] || ''
    return `${month} ${year}`.trim()
  }
  return monthStr
}

const Charts = ({ expenses = [], allExpenses = [], monthlyRecords = [], selectedMonth = '' }) => {
  const { lang, t } = useLanguage()
  const isUrdu = lang === 'ur'
  const displayCurrency = isUrdu ? 'روپے' : 'PKR'
  const [trendTab, setTrendTab] = useState('comparison') // 'comparison' | 'trend'
  const [activeSliceIndex, setActiveSliceIndex] = useState(null) // 3D Donut Pop-out state
  const currentMonth = selectedMonth || expenses[0]?.month || ''
  const shortMonth = formatShortMonth(currentMonth)

  // ── Donut chart: expense by 2-tier parent category for selected month ──
  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)

  const catMap = {}
  expenses.forEach(e => {
    const category = getParentCategory(e.name, e.category)
    catMap[category] = (catMap[category] || 0) + Number(e.amount || 0)
  })

  // Sort categories descending by spend
  const sortedCategories = Object.entries(catMap).sort((a, b) => b[1] - a[1])

  const localizedCategory = (catKey) => {
    const map = {
      "Salaries & Payroll": t.catSalaries,
      "Electrical & Infrastructure": t.catElectrical,
      "Supplies & Hardware": t.catSupplies,
      "Community & Utilities": t.catCommunity,
      "Capital Expenditures": t.catCapEx,
      "Payroll": t.catSalaries,
      "Electrical & Maintenance": t.catElectrical,
      "Capital Expenditures (CapEx)": t.catCapEx,
    };
    return map[catKey] || (isUrdu ? translateCategory(catKey, 'ur') : catKey);
  };

  // ── 3D Donut Slice Calculations ──
  const donutCx = 170
  const donutCy = 170
  const donutROut = 136
  const donutRIn = 88
  const rMid = (donutRIn + donutROut) / 2

  let runningAngle = -Math.PI / 2 // Start from 12 o'clock

  const donutSlices = sortedCategories.map(([cat, amt], i) => {
    const fraction = totalExpense > 0 ? amt / totalExpense : 0
    const spanAngle = fraction * 2 * Math.PI
    const startAngle = runningAngle
    const endAngle = runningAngle + spanAngle
    const midAngle = startAngle + spanAngle / 2
    runningAngle = endAngle

    const pct = (fraction * 100).toFixed(1)
    const color = CATEGORY_COLORS[cat] || FALLBACK_PALETTE[i % FALLBACK_PALETTE.length]
    const label = localizedCategory(cat)
    const path = getDonutSlicePath(donutCx, donutCy, donutRIn, donutROut, startAngle, endAngle)

    // Midpoint for transform-origin
    const midPointX = donutCx + rMid * Math.cos(midAngle)
    const midPointY = donutCy + rMid * Math.sin(midAngle)

    // Tooltip position anchored to slice in 3D plane
    const tooltipX = donutCx + (rMid + 22) * Math.cos(midAngle)
    const tooltipY = donutCy + (rMid + 22) * Math.sin(midAngle)

    return {
      cat,
      label,
      amount: amt,
      pct,
      color,
      startAngle,
      endAngle,
      midAngle,
      midPointX,
      midPointY,
      tooltipX,
      tooltipY,
      path,
    }
  })

  const activeSlice = activeSliceIndex !== null ? donutSlices[activeSliceIndex] : null

  // ── Build grouped data for All Months Comparison (Collection vs Expenses) ──
  const collectionMap = {}
  monthlyRecords.forEach(r => {
    if (r.month) {
      collectionMap[r.month] = Number(r.monthlyCollection || 0)
    }
  })

  const expenseMap = {}
  allExpenses.forEach(e => {
    if (e.month) {
      expenseMap[e.month] = (expenseMap[e.month] || 0) + Number(e.amount || 0)
    }
  })

  const allMonthKeys = Array.from(new Set([...Object.keys(expenseMap), ...Object.keys(collectionMap)]))
  const sortedMonths = allMonthKeys.sort((a, b) => getMonthSortKey(a) - getMonthSortKey(b))

  const monthEntries = sortedMonths.map(m => {
    const expenses = expenseMap[m] || 0
    const collection = collectionMap[m] || 0
    return {
      month: m,
      expenses,
      collection,
      isDeficit: expenses > collection
    }
  })

  const barLabels = monthEntries.map(e => {
    if (!e?.month) return ''
    if (isUrdu) return translateMonth(e.month, 'ur')
    const parts = e.month.trim().split(/\s+/)
    if (parts.length >= 2) {
      const monthAbbr = (parts[0] || '').slice(0, 3)
      const yearAbbr = parts[1]?.length === 4 ? `'${parts[1].slice(2)}` : parts[1] || ''
      return `${monthAbbr} ${yearAbbr}`.trim()
    }
    return e.month
  })

  const collectionData = monthEntries.map(e => e.collection)
  const expenseData = monthEntries.map(e => e.expenses)

  // Conditional deficit highlight: entry.expenses > entry.collection ? '#EF4444' : '#3B82F6'
  const expenseColors = monthEntries.map(entry => (entry.expenses > entry.collection ? '#EF4444' : '#3B82F6'))
  const expenseBorderColors = monthEntries.map(entry => (entry.expenses > entry.collection ? '#DC2626' : '#2563EB'))

  // Chart data objects
  const barChartData = {
    labels: barLabels,
    datasets: [
      {
        label: t.collection || 'Monthly Collection',
        data: collectionData,
        backgroundColor: '#10B981', // Emerald Green
        borderColor: '#059669',
        borderWidth: 1.5,
        borderRadius: 6,
        hoverBackgroundColor: '#059669',
      },
      {
        label: t.expense || 'Total Expenses',
        data: expenseData,
        backgroundColor: expenseColors, // Red (#EF4444) on deficit, Blue (#3B82F6) on surplus
        borderColor: expenseBorderColors,
        borderWidth: 1.5,
        borderRadius: 6,
        hoverBackgroundColor: monthEntries.map(entry => (entry.expenses > entry.collection ? '#DC2626' : '#1D4ED8')),
      }
    ]
  }

  // ── Line chart labels & benchmarks (last 6 months) ──
  const lineLabels = sortedMonths.slice(-6)
  const lineExpense = lineLabels.map(m => expenseMap[m] || 0)
  const lineCollection = lineLabels.map(m => collectionMap[m] || 0)

  // Compute MoM peak calculation for the last data point: PKR 306,285 (+12% MoM)
  const lastLineIdx = lineExpense.length - 1
  const peakExpense = lineExpense[lastLineIdx] || 0
  const prevExpense = lastLineIdx > 0 ? lineExpense[lastLineIdx - 1] : 0
  const peakMomPct = prevExpense > 0 ? Math.round(((peakExpense - prevExpense) / prevExpense) * 100) : 0
  const peakCalloutLabel = `${displayCurrency} ${peakExpense.toLocaleString('en-PK')} (${isUrdu ? (t.peak || 'سب سے زیادہ') : 'Peak'}: ${peakMomPct >= 0 ? `+${peakMomPct}` : peakMomPct}% MoM)`

  const lineChartData = {
    labels: lineLabels.map(l => {
      if (isUrdu) return translateMonth(l, 'ur')
      const parts = l.trim().split(/\s+/)
      return parts.length >= 2 ? `${parts[0].slice(0, 3)} '${parts[1].slice(2)}` : parts[0].slice(0, 3)
    }),
    datasets: [
      {
        label: t.collection || 'Monthly Collection',
        data: lineCollection,
        borderColor: '#10B981', // Emerald Green baseline
        borderWidth: 2.5,
        borderDash: [4, 4], // strokeDasharray: "4 4"
        fill: false,
        tension: 0.3,
        pointRadius: 3.5,
        pointBackgroundColor: '#10B981',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 1.5,
        pointHoverRadius: 6,
      },
      {
        label: t.expense || 'Monthly Expense',
        data: lineExpense,
        borderColor: '#EF4444', // Red Expense Line
        borderWidth: 2.5,
        tension: 0.35,
        fill: {
          target: 0,
          above: 'rgba(239, 68, 68, 0.18)', // Soft red when Expense surges above Collection (August Deficit)
          below: 'rgba(16, 185, 129, 0.18)', // Subtle green when Collection sits higher than Expense (Surplus)
        },
        pointRadius: lineExpense.map((_, i) => (i === lineExpense.length - 1 ? 6.5 : 3.5)),
        pointBackgroundColor: '#EF4444',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointHoverRadius: lineExpense.map((_, i) => (i === lineExpense.length - 1 ? 8.5 : 6)),
      }
    ]
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    categoryPercentage: 0.75,
    barPercentage: 0.85,
    events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
    interaction: {
      mode: 'index',
      intersect: false,
      axis: 'x'
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        boxPadding: 4,
        usePointStyle: true,
        titleFont: { family: 'Manrope', size: 12, weight: '700' },
        bodyFont: { family: 'Manrope', size: 11, weight: '600' },
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${displayCurrency} ${Number(ctx.raw).toLocaleString('en-PK')}`,
          afterBody: (items) => {
            if (!items || items.length === 0) return ''
            const idx = items[0].dataIndex
            const entry = monthEntries[idx]
            if (!entry) return ''
            const net = entry.collection - entry.expenses
            const isDef = net < 0
            const prefix = isUrdu ? (isDef ? '🔴 خالص خسارہ' : '🟢 خالص بچت') : (isDef ? '🔴 Net Deficit' : '🟢 Net Surplus')
            return `\n${prefix}: ${isDef ? '-' : '+'}${displayCurrency} ${Math.abs(net).toLocaleString('en-PK')}`
          }
        }
      }
    },
    scales: {
      y: {
        ticks: {
          callback: v => `${(v / 1000).toFixed(0)}k`,
          font: { family: 'Manrope', size: 10 }
        },
        grid: { color: 'rgba(0,102,0,0.05)' },
        beginAtZero: true
      },
      x: {
        grid: { display: false },
        ticks: {
          font: { family: 'Manrope', size: 10, weight: '600' },
          maxRotation: 0,
          minRotation: 0,
          padding: 6
        }
      }
    }
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
    interaction: {
      mode: 'index',
      intersect: false,
      axis: 'x'
    },
    layout: {
      padding: {
        top: 36, // Headroom for peak callout badge
        right: 16,
        left: 4
      }
    },
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        enabled: true,
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e2e8f0',
        borderColor: '#334155',
        borderWidth: 1,
        padding: 10,
        cornerRadius: 8,
        boxPadding: 4,
        usePointStyle: true,
        titleFont: { family: 'Manrope', size: 12, weight: '700' },
        bodyFont: { family: 'Manrope', size: 11, weight: '600' },
        callbacks: {
          label: ctx => ` ${ctx.dataset.label}: ${displayCurrency} ${Number(ctx.raw).toLocaleString('en-PK')}`,
          afterBody: (items) => {
            if (!items || items.length === 0) return ''
            const idx = items[0].dataIndex
            const coll = lineCollection[idx] || 0
            const exp = lineExpense[idx] || 0
            const net = coll - exp
            const isDef = net < 0
            const prefix = isUrdu ? (isDef ? '🔴 خالص خسارہ' : '🟢 خالص بچت') : (isDef ? '🔴 Net Deficit' : '🟢 Net Surplus')
            return `\n${prefix}: ${isDef ? '-' : '+'}${displayCurrency} ${Math.abs(net).toLocaleString('en-PK')}`
          }
        }
      },
      peakCallout: {
        display: true,
        text: peakCalloutLabel
      }
    },
    scales: {
      y: { ticks: { callback: v => `${(v / 1000).toFixed(0)}k`, font: { family: 'Manrope', size: 10 } }, grid: { color: 'rgba(0,102,0,0.05)' } },
      x: {
        grid: { display: false },
        ticks: {
          font: { family: 'Manrope', size: 10, weight: '600' },
          maxRotation: 0,
          minRotation: 0,
          padding: 6
        }
      }
    }
  }

  return (
    <div className="space-y-6">
      
      {/* ================= 3D EXPLODED POP-OUT EXPENSE BREAKDOWN CHART ================= */}
      <div
        className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden"
        onClick={() => setActiveSliceIndex(null)}
      >
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <span className="material-symbols-outlined text-8xl">donut_large</span>
        </div>
        
        <div className="flex items-center justify-between mb-2">
          <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>{t.expenseBreakdown || 'Expense Breakdown'}</span>
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-cyan-950/20 dark:bg-cyan-950/80 text-cyan-600 dark:text-cyan-300 border border-cyan-500/30">
              <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
              3D Exploded View
            </span>
          </h4>
          <span className="material-symbols-outlined text-primary text-lg">donut_large</span>
        </div>
        <p className="text-xs text-slate-400 dark:text-slate-500 mb-4">
          {isUrdu
            ? 'کسی بھی زمرے پر ٹیپ یا ہوور کر کے 3D پاپ آؤٹ سلائس اور تفصیلات دیکھیں'
            : 'Tap or hover on any sector or legend item to pop out slices in 3D perspective'}
        </p>

        {donutSlices.length > 0 ? (
          <div
            className="flex flex-col items-center justify-center relative touch-manipulation pt-4 pb-2"
            style={{ touchAction: 'pan-y' }}
          >
            {/* 1. 3D Perspective Chart Canvas Container */}
            <div
              className="relative flex items-center justify-center w-full max-w-[340px] sm:max-w-[380px] h-[340px] sm:h-[370px] select-none"
              style={{
                perspective: 1100,
              }}
            >
              {/* Ground Isometric Radial Shadow */}
              <div
                className="absolute pointer-events-none -bottom-4 w-[280px] sm:w-[320px] h-[75px] rounded-[50%] blur-xl -z-10 transition-opacity duration-300"
                style={{
                  background: 'radial-gradient(ellipse at center, rgba(15,23,42,0.45) 0%, rgba(15,23,42,0.18) 45%, transparent 70%)',
                  transform: 'rotateX(55deg) scaleY(0.7) translateY(24px)',
                  opacity: activeSlice ? 0.75 : 0.5,
                }}
              />

              {/* Tilted Donut Ring Plane (rotateX: 24deg, rotateZ: -2deg) */}
              <div
                className="relative w-[340px] h-[340px] flex items-center justify-center transition-transform duration-300 ease-out"
                style={{
                  transformStyle: 'preserve-3d',
                  transform: 'rotateX(24deg) rotateZ(-2deg)',
                }}
              >
                {/* SVG Donut Ring with Slice Elevation & Explosion */}
                <svg
                  className="w-full h-full overflow-visible"
                  viewBox="0 0 340 340"
                  style={{
                    transformStyle: 'preserve-3d',
                  }}
                >
                  <defs>
                    <filter id="donutShadow" x="-20%" y="-20%" width="140%" height="140%">
                      <feDropShadow dx="0" dy="8" stdDeviation="6" floodOpacity="0.3" />
                    </filter>
                    <filter id="elevatedShadow" x="-30%" y="-30%" width="160%" height="160%">
                      <feDropShadow dx="0" dy="16" stdDeviation="10" floodOpacity="0.45" />
                    </filter>
                  </defs>

                  {donutSlices.map((slice, i) => {
                    const isSelected = activeSliceIndex === i
                    const isDimmed = activeSliceIndex !== null && !isSelected

                    // Shift outward along radial angle by 18px
                    const shiftX = isSelected ? Math.cos(slice.midAngle) * 18 : 0
                    const shiftY = isSelected ? Math.sin(slice.midAngle) * 18 : 0

                    return (
                      <motion.g
                        key={slice.cat}
                        animate={{
                          x: shiftX,
                          y: shiftY,
                          scale: isSelected ? 1.05 : 1,
                          opacity: isDimmed ? 0.4 : 1,
                        }}
                        transition={{
                          type: 'spring',
                          stiffness: 300,
                          damping: 22,
                        }}
                        style={{
                          transformOrigin: `${donutCx}px ${donutCy}px`,
                          transformStyle: 'preserve-3d',
                          transform: isSelected ? 'translateZ(28px)' : 'translateZ(0px)',
                        }}
                        className="cursor-pointer transition-opacity duration-300"
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveSliceIndex(isSelected ? null : i)
                        }}
                        onMouseEnter={() => setActiveSliceIndex(i)}
                      >
                        {/* Interactive Sector Path */}
                        <path
                          d={slice.path}
                          fill={slice.color}
                          stroke={isSelected ? '#ffffff' : 'rgba(255,255,255,0.7)'}
                          strokeWidth={isSelected ? 2.5 : 1.5}
                          style={{
                            filter: isSelected
                              ? 'drop-shadow(0 14px 18px rgba(0,0,0,0.45)) brightness(1.08)'
                              : 'drop-shadow(0 4px 6px rgba(0,0,0,0.18))',
                            transition: 'filter 0.3s ease, stroke 0.3s ease, fill 0.3s ease',
                          }}
                        />
                      </motion.g>
                    )
                  })}
                </svg>

                {/* Donut Center Hole Metric Container (translateZ: 10px) */}
                <div
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(10px)',
                  }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[164px] h-[164px] rounded-full bg-white/95 dark:bg-slate-900/95 border border-slate-200/90 dark:border-slate-800 shadow-[inset_0_2px_8px_rgba(0,0,0,0.06),0_8px_24px_rgba(0,0,0,0.12)] backdrop-blur-md flex flex-col items-center justify-center text-center p-3 pointer-events-none"
                >
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 truncate max-w-[140px]">
                    {activeSlice ? activeSlice.label : (t.totalSpend || (isUrdu ? 'مجموعی خرچ' : 'Total Spend'))}
                  </span>
                  <span className="text-base sm:text-lg font-black font-mono text-slate-900 dark:text-white leading-tight mt-0.5">
                    {displayCurrency} {(activeSlice ? activeSlice.amount : totalExpense).toLocaleString('en-PK')}
                  </span>
                  <span className="text-[10px] font-semibold text-slate-400 dark:text-slate-500 mt-1">
                    {activeSlice
                      ? `${activeSlice.pct}% of total`
                      : (isUrdu ? translateMonth(selectedMonth || currentMonth, 'ur') : (selectedMonth || currentMonth))}
                  </span>
                </div>

                {/* 3. 3D Floating Tooltip Pill (translateZ: 45px) */}
                <AnimatePresence>
                  {activeSlice && (
                    <motion.div
                      key={activeSlice.cat}
                      initial={{ opacity: 0, scale: 0.85, z: 20 }}
                      animate={{ opacity: 1, scale: 1, z: 45 }}
                      exit={{ opacity: 0, scale: 0.85, z: 20 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: 'translateZ(45px)',
                        left: activeSlice.tooltipX,
                        top: activeSlice.tooltipY,
                      }}
                      className="absolute -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50 px-3.5 py-2 rounded-2xl bg-slate-900/95 dark:bg-slate-950/95 border border-slate-700/80 text-white shadow-[0_16px_36px_rgba(0,0,0,0.5)] backdrop-blur-md flex flex-col items-center gap-0.5 whitespace-nowrap"
                    >
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-200">
                        <span
                          className="size-2.5 rounded-full shadow-xs"
                          style={{ backgroundColor: activeSlice.color }}
                        />
                        <span>{activeSlice.label}</span>
                      </div>
                      <div className="text-sm font-black font-mono text-cyan-300 flex items-baseline gap-1.5">
                        <span>{displayCurrency} {activeSlice.amount.toLocaleString('en-PK')}</span>
                        <span className="text-[11px] font-bold text-slate-400">({activeSlice.pct}%)</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Synchronized Legend Pills (Tapping / Hovering Pops Out Slices) */}
            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-2.5 mt-8 px-2 max-w-2xl mx-auto">
              {donutSlices.map((slice, i) => {
                const isSelected = activeSliceIndex === i
                const isDimmed = activeSliceIndex !== null && !isSelected

                return (
                  <button
                    key={slice.cat}
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setActiveSliceIndex(isSelected ? null : i)
                    }}
                    onMouseEnter={() => setActiveSliceIndex(i)}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      isSelected
                        ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-md scale-105 border-slate-700 dark:border-white'
                        : isDimmed
                        ? 'opacity-40 bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-transparent hover:opacity-80'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span
                      className="size-2.5 rounded-full flex-shrink-0 shadow-xs"
                      style={{ backgroundColor: slice.color }}
                    />
                    <span className="truncate max-w-[130px] sm:max-w-none">{slice.label}</span>
                    <span className="text-[10px] font-mono font-extrabold opacity-75">
                      {slice.pct}%
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="min-h-[220px] flex items-center justify-center">
            <span className="text-slate-400 font-medium text-xs">
              {isUrdu ? 'منتخب مہینے کے لیے کوئی ڈیٹا نہیں ہے' : 'No data for selected month'}
            </span>
          </div>
        )}
      </div>

      {/* MULTI-MONTH DYNAMICS: DEDUPLICATED TABBED CARD */}
      <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-primary/10 shadow-sm space-y-4">
        {/* Header with Title and Segmented Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-700/60 pb-3.5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-xl">
              {trendTab === 'comparison' ? 'bar_chart' : 'ssid_chart'}
            </span>
            <div>
              <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm sm:text-base leading-tight">
                {trendTab === 'comparison' ? (t.allMonthsComparison || 'All Months Comparison') : (t.monthlyExpenseTrend || 'Monthly Expense Trend (6M)')}
              </h4>
              <p className="text-[11px] text-slate-400 font-medium">
                {trendTab === 'comparison'
                  ? (isUrdu ? 'ماہانہ کلیکشن بمقابلہ اخراجات' : 'Collection vs Expenses by month')
                  : (isUrdu ? 'کلیکشن کے معیار کے ساتھ رجحان اور چوٹی' : 'Collection baseline benchmark with peak indicator')}
              </p>
            </div>
          </div>

          {/* Segmented Switcher [ Grouped Comparison | Trend Line ] */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-750 p-1 rounded-xl self-start sm:self-auto border border-slate-200/60 dark:border-slate-700">
            <button
              type="button"
              onClick={() => setTrendTab('comparison')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                trendTab === 'comparison'
                  ? 'bg-white dark:bg-slate-900 text-primary shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-sm">bar_chart</span>
              {isUrdu ? 'موازنہ' : 'Grouped Comparison'}
            </button>
            <button
              type="button"
              onClick={() => setTrendTab('trend')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                trendTab === 'trend'
                  ? 'bg-white dark:bg-slate-900 text-primary shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              <span className="material-symbols-outlined text-sm">show_chart</span>
              {isUrdu ? 'رجحان' : 'Trend Line'}
            </button>
          </div>
        </div>

        {/* Standard Minimalist Legend Badges */}
        <div className="flex items-center justify-between flex-wrap gap-2.5 pt-1">
          <div className="flex items-center gap-3 sm:gap-4 text-xs font-bold">
            <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
              <span className="size-2.5 rounded-full bg-emerald-500 inline-block shadow-xs"></span>
              {t.collection || 'Monthly Collection'}
            </span>
            <span className="inline-flex items-center gap-1.5 text-slate-700 dark:text-slate-200">
              <span className="size-2.5 rounded-full bg-rose-500 inline-block shadow-xs"></span>
              {trendTab === 'comparison' ? (t.expense || 'Total Expenses') : (t.expense || 'Monthly Expense')}
            </span>
          </div>

          {trendTab === 'trend' && (
            <div className="flex items-center gap-2.5 text-[11px] font-semibold text-slate-400 dark:text-slate-500">
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-1.5 rounded-xs bg-emerald-500/25 border border-emerald-500/60 inline-block"></span>
                {isUrdu ? 'بچت کا علاقہ' : 'Surplus Area'}
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="w-2.5 h-1.5 rounded-xs bg-rose-500/25 border border-rose-500/60 inline-block"></span>
                {isUrdu ? 'خسارے کا علاقہ' : 'Deficit Area'}
              </span>
            </div>
          )}
        </div>

        {/* Chart Viewport */}
        <div
          className="h-64 sm:h-72 flex items-center justify-center touch-manipulation"
          style={{ touchAction: 'pan-y' }}
        >
          {sortedMonths.length === 0 ? (
            <span className="text-slate-400 font-medium text-xs">
              {isUrdu ? 'کوئی کثیر وقتی ڈیٹا دستیاب نہیں ہے' : 'No multi-month data available'}
            </span>
          ) : trendTab === 'comparison' ? (
            <Bar data={barChartData} options={barOptions} />
          ) : (
            <Line data={lineChartData} options={lineOptions} plugins={[peakCalloutPlugin]} />
          )}
        </div>
      </div>

    </div>
  )
}

export default Charts

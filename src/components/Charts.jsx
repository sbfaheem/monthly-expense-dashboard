import React, { useState } from 'react'
import { Doughnut, Line, Bar } from 'react-chartjs-2'
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

// Persistent Center Metric Plugin for Donut Hole
const centerTextPlugin = {
  id: 'centerText',
  afterDraw(chart) {
    if (!chart.config.options.plugins?.centerText?.display) return
    const { ctx, chartArea } = chart
    if (!chartArea) return

    const centerX = (chartArea.left + chartArea.right) / 2
    const centerY = (chartArea.top + chartArea.bottom) / 2

    const primaryText = chart.config.options.plugins.centerText.primaryText || ''
    const subText = chart.config.options.plugins.centerText.subText || ''

    const isDark = typeof document !== 'undefined' && document.documentElement.classList.contains('dark')

    ctx.save()
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'

    // Primary centered text (bold PKR amount)
    ctx.font = '700 18px Manrope, Inter, sans-serif'
    ctx.fillStyle = isDark ? '#f8fafc' : '#0f172a'
    ctx.fillText(primaryText, centerX, centerY - 8)

    // Sub-label text (Total Spend (Month)) in muted gray #6B7280
    if (subText) {
      ctx.font = '600 12px Manrope, Inter, sans-serif'
      ctx.fillStyle = '#6B7280'
      ctx.fillText(subText, centerX, centerY + 14)
    }

    ctx.restore()
  }
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
  if (!monthStr) return ''
  const parts = monthStr.trim().split(/\s+/)
  if (parts.length >= 2) {
    const month = parts[0].slice(0, 3)
    const year = parts[1].length === 4 ? `'${parts[1].slice(2)}` : parts[1]
    return `${month} ${year}`
  }
  return monthStr
}

const Charts = ({ expenses = [], allExpenses = [], monthlyRecords = [], selectedMonth = '' }) => {
  const { lang, t } = useLanguage()
  const isUrdu = lang === 'ur'
  const displayCurrency = isUrdu ? 'روپے' : 'PKR'
  const [trendTab, setTrendTab] = useState('comparison') // 'comparison' | 'trend'
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

  const donutLabels = sortedCategories.map(([cat, amt]) => {
    const pct = totalExpense > 0 ? ((amt / totalExpense) * 100).toFixed(1) : '0.0'
    const catLabel = isUrdu ? translateCategory(cat, 'ur') : cat
    return `${catLabel}: ${displayCurrency} ${amt.toLocaleString('en-PK')} (${pct}%)`
  })
  const donutData = sortedCategories.map(([, amt]) => amt)
  const donutColors = sortedCategories.map(([cat], i) => CATEGORY_COLORS[cat] || FALLBACK_PALETTE[i % FALLBACK_PALETTE.length])

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
    if (isUrdu) return translateMonth(e.month, 'ur')
    const parts = e.month.trim().split(/\s+/)
    if (parts.length >= 2) {
      const monthAbbr = parts[0].slice(0, 3)
      const yearAbbr = parts[1].length === 4 ? `'${parts[1].slice(2)}` : parts[1]
      return `${monthAbbr} ${yearAbbr}`
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

  const donutChartData = {
    labels: donutLabels,
    datasets: [{
      data: donutData,
      backgroundColor: donutColors,
      borderWidth: 2,
      borderColor: '#ffffff',
      hoverOffset: 6,
    }]
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

  // Chart options with mobile-friendly touch & click interaction
  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
    events: ['mousemove', 'mouseout', 'click', 'touchstart', 'touchmove'],
    interaction: {
      mode: 'nearest',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          usePointStyle: true,
          pointStyle: 'rectRounded',
          padding: 14,
          font: { size: 12, family: 'Manrope', weight: '600' },
          boxWidth: 10,
          boxHeight: 10,
        }
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
          label: ctx => ` ${ctx.label}`
        }
      },
      centerText: {
        display: true,
        primaryText: `${displayCurrency} ${totalExpense.toLocaleString('en-PK')}`,
        subText: isUrdu 
          ? `${t.totalSpend || 'مجموعی خرچ'} (${translateMonth(shortMonth, 'ur')})` 
          : (shortMonth ? `${t.totalSpend || 'Total Spend'} (${shortMonth})` : (t.totalSpend || 'Total Spend'))
      }
    }
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
      
      {/* EXPENSE DISTRIBUTION DONUT CHART */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <span className="material-symbols-outlined text-8xl">donut_large</span>
        </div>
        <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center justify-between">
          {t.expenseBreakdown || 'Expense Breakdown'}
          <span className="material-symbols-outlined text-primary text-lg">donut_large</span>
        </h4>
        <div
          className="min-h-[300px] h-80 flex items-center justify-center relative touch-manipulation"
          style={{ touchAction: 'pan-y' }}
        >
          {donutData.length > 0 ? (
            <Doughnut data={donutChartData} options={donutOptions} plugins={[centerTextPlugin]} />
          ) : (
            <span className="text-slate-400 font-medium text-xs">
              {isUrdu ? 'منتخب مہینے کے لیے کوئی ڈیٹا نہیں ہے' : 'No data for selected month'}
            </span>
          )}
        </div>
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

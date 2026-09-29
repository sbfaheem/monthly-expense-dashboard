import React from 'react'
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

const Charts = ({ expenses = [], allExpenses = [], selectedMonth = '' }) => {
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
    return `${cat}: PKR ${amt.toLocaleString('en-PK')} (${pct}%)`
  })
  const donutData = sortedCategories.map(([, amt]) => amt)
  const donutColors = sortedCategories.map(([cat], i) => CATEGORY_COLORS[cat] || FALLBACK_PALETTE[i % FALLBACK_PALETTE.length])

  // ── Build sorted chronological month order for bar + line ──
  const monthOrder = {}
  allExpenses.forEach(e => {
    if (!monthOrder[e.month]) {
      const d = new Date(e.date)
      monthOrder[e.month] = { ts: d.getFullYear() * 100 + (d.getMonth() + 1), total: 0 }
    }
    monthOrder[e.month].total += Number(e.amount || 0)
  })
  const sortedMonths = Object.keys(monthOrder).sort((a, b) => monthOrder[a].ts - monthOrder[b].ts)
  const barLabels = sortedMonths.map(m => {
    const parts = m.split(' ')
    return parts.length >= 2 ? `${parts[0]} '${parts[1].slice(2)}` : m
  })
  const barData = sortedMonths.map(m => monthOrder[m].total)

  // ── Line chart labels (last 6 months) ──
  const lineLabels = sortedMonths.slice(-6)
  const lineExpense = lineLabels.map(m => monthOrder[m].total)

  // Chart data objects
  const barChartData = {
    labels: barLabels,
    datasets: [{
      label: 'Expenses (PKR)',
      data: barData,
      backgroundColor: sortedMonths.map((_, i) =>
        i === sortedMonths.length - 1 ? 'rgba(212,175,55,0.85)' : 'rgba(0,102,0,0.8)'
      ),
      borderColor: sortedMonths.map((_, i) =>
        i === sortedMonths.length - 1 ? '#D4AF37' : '#006600'
      ),
      borderWidth: 2,
      borderRadius: 6,
      hoverBackgroundColor: '#D4AF37',
    }]
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

  const lineChartData = {
    labels: lineLabels.map(l => l.split(' ')[0]),
    datasets: [{
      label: 'Expense',
      data: lineExpense,
      borderColor: '#e53935',
      backgroundColor: 'rgba(229,57,53,0.1)',
      tension: 0.4,
      fill: true,
      pointRadius: 5,
      pointBackgroundColor: '#e53935',
    }]
  }

  // Chart options
  const donutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '70%',
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
        callbacks: {
          label: ctx => ` ${ctx.label}`
        }
      },
      centerText: {
        display: true,
        primaryText: `PKR ${totalExpense.toLocaleString('en-PK')}`,
        subText: shortMonth ? `Total Spend (${shortMonth})` : 'Total Spend'
      }
    }
  }

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { callbacks: { label: ctx => ` ${Number(ctx.raw).toLocaleString('en-PK')} PKR` } }
    },
    scales: {
      y: { ticks: { callback: v => `${(v / 1000).toFixed(0)}k`, font: { family: 'Manrope' } }, grid: { color: 'rgba(0,102,0,0.05)' }, beginAtZero: true },
      x: { grid: { display: false }, ticks: { font: { family: 'Manrope' } } }
    }
  }

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11, family: 'Manrope' } } },
    },
    scales: {
      y: { ticks: { callback: v => `${(v / 1000).toFixed(0)}k`, font: { family: 'Manrope' } }, grid: { color: 'rgba(0,102,0,0.05)' } },
      x: { grid: { display: false }, ticks: { font: { family: 'Manrope' } } }
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
          Expense Breakdown 
          <span className="material-symbols-outlined text-primary text-lg">donut_large</span>
        </h4>
        <div className="min-h-[300px] h-80 flex items-center justify-center relative">
          {donutData.length > 0 ? (
            <Doughnut data={donutChartData} options={donutOptions} plugins={[centerTextPlugin]} />
          ) : (
            <span className="text-slate-400 font-medium">No data for selected month</span>
          )}
        </div>
      </div>

      {/* MONTHLY EXPENSES BAR */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-primary/10 shadow-sm">
        <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center justify-between">
          All Months Comparison
          <span className="material-symbols-outlined text-primary text-lg">bar_chart</span>
        </h4>
        <div className="h-48 flex items-center justify-center">
          {sortedMonths.length > 0 ? (
            <Bar data={barChartData} options={barOptions} />
          ) : (
            <span className="text-slate-400 font-medium">No expense data available</span>
          )}
        </div>
      </div>

      {/* MONTHLY TREND LINE */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-primary/10 shadow-sm">
        <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center justify-between">
          Monthly Expense Trend (6M)
          <span className="material-symbols-outlined text-primary text-lg">ssid_chart</span>
        </h4>
        <div className="h-48 flex items-center justify-center">
          {lineLabels.length > 0 ? (
            <Line data={lineChartData} options={lineOptions} />
          ) : (
             <span className="text-slate-400 font-medium">No trend data available</span>
          )}
        </div>
      </div>

    </div>
  )
}

export default Charts

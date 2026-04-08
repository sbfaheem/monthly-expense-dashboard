import { Pie, Line, Bar } from 'react-chartjs-2'
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

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Filler)

const COLORS = ['#1b5e20','#ffd700','#ff9800','#e53935','#2196f3','#9c27b0','#00bcd4','#8bc34a']

const Charts = ({ expenses, allExpenses }) => {
  // ── Pie chart: expense by category for selected month ──
  const catMap = {}
  expenses.forEach(e => {
    catMap[e.category] = (catMap[e.category] || 0) + Number(e.amount)
  })
  const pieLabels = Object.keys(catMap)
  const pieData = Object.values(catMap)

  // ── Build sorted chronological month order for bar + line ──
  const monthOrder = {}
  allExpenses.forEach(e => {
    if (!monthOrder[e.month]) {
      const d = new Date(e.date)
      monthOrder[e.month] = { ts: d.getFullYear() * 100 + (d.getMonth() + 1), total: 0 }
    }
    monthOrder[e.month].total += Number(e.amount)
  })
  const sortedMonths = Object.keys(monthOrder).sort((a, b) => monthOrder[a].ts - monthOrder[b].ts)
  const barLabels = sortedMonths.map(m => m.split(' ')[0] + ' ' + m.split(' ')[1].slice(2)) // "February 2026" → "February 26"
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

  const pieChartData = {
    labels: pieLabels,
    datasets: [{
      data: pieData,
      backgroundColor: COLORS.slice(0, pieLabels.length),
      borderWidth: 2,
      borderColor: '#ffffff',
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

  const pieOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 11, family: 'Manrope' } } },
      tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${Number(ctx.raw).toLocaleString('en-PK')} PKR` } }
    },
    cutout: '60%',
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
      
      {/* EXPENSE DISTRIBUTION */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-primary/10 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5">
          <span className="material-symbols-outlined text-8xl">pie_chart</span>
        </div>
        <h4 className="font-bold text-slate-800 dark:text-slate-100 mb-6 flex items-center justify-between">
          Expense Breakdown 
          <span className="material-symbols-outlined text-primary text-lg">donut_large</span>
        </h4>
        <div className="h-64 flex items-center justify-center">
          {pieLabels.length > 0 ? (
            <Pie data={pieChartData} options={pieOptions} />
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

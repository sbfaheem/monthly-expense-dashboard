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
import './Charts.css'

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
      label: 'Total Expenses (PKR)',
      data: barData,
      backgroundColor: sortedMonths.map((_, i) =>
        i === sortedMonths.length - 1 ? 'rgba(255,215,0,0.85)' : 'rgba(27,94,32,0.8)'
      ),
      borderColor: sortedMonths.map((_, i) =>
        i === sortedMonths.length - 1 ? '#e6a800' : '#1b5e20'
      ),
      borderWidth: 2,
      borderRadius: 6,
      hoverBackgroundColor: '#ffd700',
    }]
  }

  const pieChartData = {
    labels: pieLabels,
    datasets: [{
      data: pieData,
      backgroundColor: COLORS.slice(0, pieLabels.length),
      borderWidth: 2,
      borderColor: '#fff',
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
      tooltip: {
        callbacks: {
          label: ctx => ` ${Number(ctx.raw).toLocaleString('en-PK')} PKR`
        }
      }
    },
    scales: {
      y: {
        ticks: { callback: v => `${(v / 1000).toFixed(0)}k` },
        grid: { color: '#f0f0f0' },
        beginAtZero: true,
      },
      x: { grid: { display: false } }
    }
  }

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom', labels: { font: { size: 11 } } },
      tooltip: { callbacks: { label: ctx => ` ${ctx.label}: ${Number(ctx.raw).toLocaleString()} PKR` } }
    },
    cutout: '60%',
  }

  const lineOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'top', labels: { font: { size: 11 } } },
    },
    scales: {
      y: { ticks: { callback: v => `${(v / 1000).toFixed(0)}k` }, grid: { color: '#f0f0f0' } },
      x: { grid: { display: false } }
    }
  }

  return (
    <div className="charts-wrapper">
      {/* ── Full-width Bar Chart ── */}
      <div className="chart-card chart-card-full">
        <h3 className="chart-title">MONTHLY EXPENSES – ALL MONTHS</h3>
        <div className="chart-container bar-container">
          {sortedMonths.length > 0 ? (
            <Bar data={barChartData} options={barOptions} />
          ) : (
            <div className="no-data">No expense data available yet</div>
          )}
        </div>
        {sortedMonths.length > 0 && (
          <div className="bar-legend">
            <span className="bar-legend-dot green" /> Previous months &nbsp;&nbsp;
            <span className="bar-legend-dot gold" /> Latest month
          </div>
        )}
      </div>

      {/* ── Pie + Line side by side ── */}
      <div className="charts-panel">
        <div className="chart-card">
          <h3 className="chart-title">EXPENSE DISTRIBUTION</h3>
          <div className="chart-container pie-container">
            {pieLabels.length > 0 ? (
              <Pie data={pieChartData} options={pieOptions} />
            ) : (
              <div className="no-data">No expense data for this month</div>
            )}
          </div>
        </div>
        <div className="chart-card">
          <h3 className="chart-title">MONTHLY TREND</h3>
          <div className="chart-container">
            {lineLabels.length > 0 ? (
              <Line data={lineChartData} options={lineOptions} />
            ) : (
              <div className="no-data">No trend data available</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Charts

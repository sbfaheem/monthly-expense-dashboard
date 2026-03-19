import { useState, useEffect } from 'react'
import { loadData, calculateTotals, getLastDataMonth } from '../utils/storage'
import Header from '../components/Header'
import SummaryCards from '../components/SummaryCards'
import ExpenseTable from '../components/ExpenseTable'
import Charts from '../components/Charts'
import { exportToCSV, printReport } from '../utils/export'
import { Download, Printer, Eye } from 'lucide-react'
import './ViewerDashboard.css'

export default function ViewerDashboard() {
  const [data, setData] = useState({ settings: { currency: 'PKR', cctvExpense: 0, showCctvExpense: true, defaultOpeningBalance: 0, defaultMonthlyCollection: 0 }, monthlyRecords: [], expenses: [] })
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  useEffect(() => {
    loadData().then(freshData => {
      setData(freshData)
      const last = getLastDataMonth(freshData)
      setSelectedMonth(last.month)
      setSelectedYear(last.year)
    }).catch(err => {
      console.error('Failed to load data:', err)
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  const currentMonthKey = `${selectedMonth} ${selectedYear}`
  const monthlyExpenses = data.expenses.filter(e => e.month === currentMonthKey)
  const totals = calculateTotals(data.expenses, data.settings, data.monthlyRecords, currentMonthKey)

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', flexDirection: 'column', gap: '16px', background: '#f8fafc' }}>
        <div style={{ width: 48, height: 48, border: '4px solid #e2e8f0', borderTop: '4px solid #6366f1', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: '#64748b', fontFamily: 'Inter, sans-serif' }}>Loading dashboard…</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  return (
    <div className="viewer-layout">
      <div className="viewer-badge"><Eye size={14}/> Read-Only View</div>
      <Header
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        isAdmin={false}
      />
      <SummaryCards
        openingBalance={totals.record.openingBalance}
        monthlyCollection={totals.record.monthlyCollection}
        totalExpense={totals.totalExpense}
        saving={totals.saving}
        totalSaving={totals.totalSaving}
        currency={data.settings.currency}
      />
      <Charts expenses={monthlyExpenses} allExpenses={data.expenses} />
      <div className="action-bar">
        <button className="btn-action" onClick={() => exportToCSV(monthlyExpenses, totals, currentMonthKey)}>
          <Download size={16}/> Export CSV
        </button>
        <button className="btn-action btn-print" onClick={printReport}>
          <Printer size={16}/> Print Report
        </button>
      </div>
      <ExpenseTable
        expenses={monthlyExpenses}
        settings={data.settings}
        selectedMonth={currentMonthKey}
        totals={totals}
        isAdmin={false}
      />
    </div>
  )
}

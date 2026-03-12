import { useState } from 'react'
import { loadData, calculateTotals, getLastDataMonth } from '../utils/storage'
import Header from '../components/Header'
import SummaryCards from '../components/SummaryCards'
import ExpenseTable from '../components/ExpenseTable'
import Charts from '../components/Charts'
import { exportToCSV, printReport } from '../utils/export'
import { Download, Printer, Eye } from 'lucide-react'
import './ViewerDashboard.css'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

export default function ViewerDashboard() {
  const data = loadData()
  const lastMonth = getLastDataMonth(data)
  const [selectedMonth, setSelectedMonth] = useState(lastMonth.month)
  const [selectedYear, setSelectedYear] = useState(lastMonth.year)
  const currentMonthKey = `${selectedMonth} ${selectedYear}`
  const monthlyExpenses = data.expenses.filter(e => e.month === currentMonthKey)
  const totals = calculateTotals(data.expenses, data.settings, currentMonthKey)

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
        openingBalance={data.settings.openingBalance}
        monthlyCollection={data.settings.monthlyCollection}
        totalExpense={totals.totalExpense}
        saving={totals.saving}
        totalSaving={totals.totalSaving}
        currency={data.settings.currency}
      />
      {/* Charts always visible, full width */}
      <Charts expenses={monthlyExpenses} allExpenses={data.expenses} />
      {/* Actions row */}
      <div className="action-bar">
        <button className="btn-action" onClick={() => exportToCSV(monthlyExpenses, totals, currentMonthKey)}>
          <Download size={16}/> Export CSV
        </button>
        <button className="btn-action btn-print" onClick={printReport}>
          <Printer size={16}/> Print Report
        </button>
      </div>
      {/* Financial table */}
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

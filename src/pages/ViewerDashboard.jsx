import { useState, useEffect } from 'react'
import { loadData, calculateTotals, getLastDataMonth } from '../utils/storage'
import Header from '../components/Header'
import SummaryCards from '../components/SummaryCards'
import ExpenseTable from '../components/ExpenseTable'
import Charts from '../components/Charts'
import { exportToCSV, printReport } from '../utils/export'
import { Download, Printer, Eye } from 'lucide-react'
// CSS import removed

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
      <div className="flex items-center justify-center h-screen flex-col gap-4 bg-background-light">
        <div className="size-12 border-4 border-slate-200 border-t-primary rounded-full animate-spin" />
        <p className="text-slate-500 font-medium">Loading dashboard…</p>
      </div>
    )
  }

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden">
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-primary/10 bg-white/80 dark:bg-background-dark/80 backdrop-blur-md px-6 py-4 lg:px-10">
        <div className="flex items-center gap-4 text-primary">
          <div className="size-8 bg-primary text-white rounded-lg flex items-center justify-center">
            <span className="material-symbols-outlined">account_balance_wallet</span>
          </div>
          <div className="flex flex-col">
            <h2 className="text-slate-900 dark:text-slate-100 text-lg font-bold leading-tight tracking-tight">ExpensePro</h2>
            <span className="text-primary text-xs font-semibold uppercase tracking-wider">Viewer Mode</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-primary/10 px-3 py-1.5 rounded-full">
            <span className="material-symbols-outlined text-sm text-primary">visibility</span>
            <span className="text-xs font-medium text-slate-600 dark:text-slate-300">Read-only Access</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => exportToCSV(monthlyExpenses, totals, currentMonthKey)} className="flex items-center justify-center rounded-lg h-10 w-10 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors" title="Export CSV">
              <span className="material-symbols-outlined">download</span>
            </button>
            <button onClick={printReport} className="flex items-center justify-center rounded-lg h-10 w-10 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors" title="Print Report">
              <span className="material-symbols-outlined">print</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8 space-y-8">
        {/* Header Section with Month Selector */}
        <Header
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          isAdmin={false}
        />

        {/* Summary Cards */}
        <SummaryCards
          openingBalance={totals.record.openingBalance}
          monthlyCollection={totals.record.monthlyCollection}
          totalExpense={totals.totalExpense}
          saving={totals.saving}
          totalSaving={totals.totalSaving}
          currency={data.settings.currency}
          isNoData={totals.record.isNoData}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Table Section */}
          <div className="lg:col-span-2 space-y-6">
            <ExpenseTable
              expenses={monthlyExpenses}
              settings={data.settings}
              selectedMonth={currentMonthKey}
              totals={totals}
              isAdmin={false}
            />
          </div>

          {/* Sidebar Content */}
          <div className="space-y-6">
            <Charts expenses={monthlyExpenses} allExpenses={data.expenses} />
            
            {/* Disclaimer / Report Info Panel */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-primary/10 shadow-sm space-y-5">
              <div>
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">Scope of Responsibility:</h4>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  The management has taken over responsibility effective <strong className="text-slate-700 dark:text-slate-300 font-bold">December 01, 2025</strong>. Therefore, this financial summary only covers collections and expenditures from that date onward.
                </p>
              </div>
              <div className="border-t border-primary/5 pt-4">
                <h4 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1.5">Nature of Report:</h4>
                <p className="text-[13px] text-slate-500 leading-relaxed">
                  This document is a Financial Summary of Collections & Expenditures, providing an overview of total receipts and related expenses during the reporting period.
                </p>
              </div>
            </div>

            {/* Notes/Contact Panel */}
            <div className="bg-primary/5 dark:bg-primary/10 p-6 rounded-2xl border border-primary/20">
              <h4 className="font-bold text-primary mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined">contact_support</span> Management Contacts
              </h4>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded bg-primary text-white flex items-center justify-center font-bold">M</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Mr. Majeed</p>
                    <p className="text-xs text-slate-500">Project Supervisor</p>
                    <p className="text-xs text-primary font-medium">+92 300 1234567</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="size-8 rounded bg-secondary-gold text-white flex items-center justify-center font-bold">F</div>
                  <div>
                    <p className="text-sm font-bold text-slate-800 dark:text-slate-100">Mr. Fahad Rizwan</p>
                    <p className="text-xs text-slate-500">Financial Auditor</p>
                    <p className="text-xs text-primary font-medium">+92 321 7654321</p>
                  </div>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </main>
      
      <footer className="bg-white dark:bg-background-dark border-t border-primary/10 py-6 text-center text-slate-400 text-xs">
         <p>© 2026 ExpensePro Management System.</p>
      </footer>
    </div>
  )
}

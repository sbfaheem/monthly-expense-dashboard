import { useState, useEffect, useMemo } from 'react'
import { loadData, calculateTotals, getLastDataMonth, logVisitor } from '../utils/storage'
import Header from '../components/Header'
import SummaryCards from '../components/SummaryCards'
import ExpenseTable from '../components/ExpenseTable'
import Charts from '../components/Charts'
import WaterSupplyTracker from '../components/WaterSupplyTracker'
import { exportToCSV, printReport } from '../utils/export'
import { UserCheck, User, Search, X, Check, ArrowRight } from 'lucide-react'

// Helper to normalize phone numbers for robust matching (last 10 digits)
const normalizePhone = (p) => (p || '').replace(/[^0-9]/g, '').slice(-10)

export default function ViewerDashboard() {
  const [data, setData] = useState({
    settings: { currency: 'PKR', cctvExpense: 0, showCctvExpense: true, defaultOpeningBalance: 0, defaultMonthlyCollection: 0 },
    monthlyRecords: [],
    expenses: [],
    waterSupply: [],
    contacts: []
  })
  const [loading, setLoading] = useState(true)
  const [selectedMonth, setSelectedMonth] = useState('')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())

  // Resident Identity state
  const [resident, setResident] = useState(null)
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [residentSearchQuery, setResidentSearchQuery] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualPhone, setManualPhone] = useState('')

  useEffect(() => {
    loadData().then(freshData => {
      setData(freshData)
      const last = getLastDataMonth(freshData)
      setSelectedMonth(last.month)
      setSelectedYear(last.year)

      // Resolve resident identity
      const params = new URLSearchParams(window.location.search)
      const queryUser = params.get('u') || params.get('user') || params.get('phone') || params.get('ref')
      const storedIdentity = localStorage.getItem('resident_identity')

      let matched = null

      if (queryUser && freshData.contacts?.length) {
        const cleanQuery = normalizePhone(queryUser)
        if (cleanQuery.length >= 7) {
          matched = freshData.contacts.find(c => normalizePhone(c.phone) === cleanQuery)
        }
        if (!matched) {
          const lowerQuery = queryUser.toLowerCase().trim()
          matched = freshData.contacts.find(c => c.name?.toLowerCase().trim() === lowerQuery)
        }
      }

      if (!matched && storedIdentity) {
        try {
          const parsed = JSON.parse(storedIdentity)
          if (parsed && (parsed.name || parsed.phone)) {
            matched = parsed
          }
        } catch (e) {
          // ignore parsing error
        }
      }

      if (matched) {
        setResident(matched)
        localStorage.setItem('resident_identity', JSON.stringify(matched))
      }
    }).catch(err => {
      console.error('Failed to load data:', err)
    }).finally(() => {
      setLoading(false)
    })
  }, [])

  const currentMonthKey = `${selectedMonth} ${selectedYear}`
  const monthlyExpenses = data.expenses.filter(e => e.month === currentMonthKey)
  const totals = calculateTotals(data.expenses, data.settings, data.monthlyRecords, currentMonthKey)

  // Log visit to Firestore whenever month or resident is loaded/changed
  useEffect(() => {
    if (loading || !selectedMonth) return

    const sessionKey = `visited_${currentMonthKey}_${resident?.phone || 'anon'}`
    if (sessionStorage.getItem(sessionKey)) return

    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    const logPayload = {
      name: resident?.name || 'Guest / Unverified Resident',
      phone: resident?.phone || '',
      houseNo: resident?.houseNo || '',
      tag: resident?.tag || 'Resident',
      monthViewed: currentMonthKey,
      device: isMobile ? 'Mobile' : 'Desktop'
    }

    logVisitor(logPayload).then(() => {
      sessionStorage.setItem(sessionKey, 'true')
    })
  }, [loading, currentMonthKey, resident])

  // Filter contacts for check-in modal
  const filteredDirectoryContacts = useMemo(() => {
    if (!data.contacts) return []
    if (!residentSearchQuery.trim()) return data.contacts.slice(0, 20)
    const q = residentSearchQuery.toLowerCase()
    return data.contacts.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.houseNo?.toLowerCase().includes(q)
    )
  }, [data.contacts, residentSearchQuery])

  const handleSelectResident = (c) => {
    setResident(c)
    localStorage.setItem('resident_identity', JSON.stringify(c))
    setShowCheckInModal(false)

    // Immediately log visit for newly identified resident
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    logVisitor({
      name: c.name,
      phone: c.phone,
      houseNo: c.houseNo || '',
      tag: c.tag || 'Resident',
      monthViewed: currentMonthKey,
      device: isMobile ? 'Mobile' : 'Desktop'
    })
  }

  const handleManualCheckIn = (e) => {
    e.preventDefault()
    if (!manualName.trim()) return
    const customResident = {
      name: manualName.trim(),
      phone: manualPhone.trim() || '',
      houseNo: '7D/1',
      tag: 'Resident'
    }
    handleSelectResident(customResident)
    setManualName('')
    setManualPhone('')
  }

  const handleClearIdentity = () => {
    localStorage.removeItem('resident_identity')
    setResident(null)
  }

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
        {/* Resident Identity / Welcome Banner */}
        {resident ? (
          <div className="bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-600/20 flex-shrink-0">
                <UserCheck size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-extrabold text-emerald-950 dark:text-emerald-100">
                    Welcome, {resident.name}
                  </span>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-200 dark:bg-emerald-800 text-emerald-900 dark:text-emerald-100 border border-emerald-300 dark:border-emerald-700">
                    Verified Resident
                  </span>
                </div>
                <p className="text-xs text-emerald-800/80 dark:text-emerald-300 mt-0.5">
                  {resident.houseNo ? `House: ${resident.houseNo} • ` : ''}WhatsApp: {resident.phone}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto">
              <button
                onClick={() => setShowCheckInModal(true)}
                className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 hover:underline"
              >
                Switch Profile
              </button>
              <span className="text-emerald-300 dark:text-emerald-700 hidden sm:inline">•</span>
              <button
                onClick={handleClearIdentity}
                className="text-xs text-slate-500 hover:text-red-600"
                title="Forget saved profile on this device"
              >
                Logout
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 border border-blue-200/80 dark:border-slate-700 rounded-2xl p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="size-10 rounded-xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md shadow-primary/20 flex-shrink-0">
                <User size={20} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  Resident of NTRC 7D/1 or Asad Hanzalla Street?
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Check in with your name so management knows you have reviewed this month&apos;s financial summary.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowCheckInModal(true)}
              className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 self-start sm:self-auto active:scale-98"
            >
              <UserCheck size={15} /> Identify Yourself
            </button>
          </div>
        )}

        {/* Header Section with Month Selector */}
        <Header
          selectedMonth={selectedMonth}
          selectedYear={selectedYear}
          onMonthChange={setSelectedMonth}
          onYearChange={setSelectedYear}
          isAdmin={false}
        />

        {/* Water Supply Tracker */}
        <WaterSupplyTracker 
          entries={(() => {
            const ws = data.waterSupply?.find(item => item.id === currentMonthKey)
            if (!ws) return []
            if (ws.entries) return ws.entries
            if (ws.start) return [{ id: 'legacy', start: ws.start, end: ws.end }]
            return []
          })()} 
          allWaterSupply={data.waterSupply || []}
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

        {/* Monthly Note / Urdu Management Announcement */}
        {totals.record.note && (
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 rounded-2xl p-6 shadow-sm flex items-start gap-4" dir="rtl">
            <div className="size-10 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300 flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined text-[22px]">campaign</span>
            </div>
            <div className="flex-1 text-right">
              <h4 className="text-sm font-extrabold text-amber-800 dark:text-amber-300 mb-1 tracking-wide">انتظامیہ کی طرف سے اہم نوٹ:</h4>
              <p className="text-[15px] font-semibold text-amber-900 dark:text-amber-200 leading-relaxed font-urdu">{totals.record.note}</p>
            </div>
          </div>
        )}

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

      {/* Resident Identity / Check-in Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Resident Check-In</h3>
                  <p className="text-xs text-slate-500">Select your name to link your device</p>
                </div>
              </div>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Search Box */}
            <div className="py-4">
              <div className="relative">
                <Search size={16} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search your name, phone, or house #..."
                  value={residentSearchQuery}
                  onChange={(e) => setResidentSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs sm:text-sm focus:ring-2 focus:ring-primary outline-none"
                  autoFocus
                />
              </div>
            </div>

            {/* Contact Results List */}
            <div className="flex-1 overflow-y-auto space-y-1.5 max-h-60 pr-1">
              {filteredDirectoryContacts.length === 0 ? (
                <div className="text-center py-6 text-xs text-slate-400">
                  No matching contact found in the directory. You can enter your name below.
                </div>
              ) : (
                filteredDirectoryContacts.map((c) => (
                  <button
                    key={c.id || c.phone}
                    onClick={() => handleSelectResident(c)}
                    className="w-full p-3 rounded-xl border border-slate-100 dark:border-slate-700 hover:border-primary/40 hover:bg-primary/5 transition-all text-left flex items-center justify-between group"
                  >
                    <div>
                      <p className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary">
                        {c.name}
                      </p>
                      <p className="text-[11px] text-slate-500 font-mono">
                        {c.phone} {c.houseNo ? `(${c.houseNo})` : ''}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                      Select <ArrowRight size={12} />
                    </span>
                  </button>
                ))
              )}
            </div>

            {/* Quick Manual Entry Option */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">
                Don&apos;t see your name? Enter manually:
              </p>
              <form onSubmit={handleManualCheckIn} className="flex gap-2">
                <input
                  type="text"
                  placeholder="Your Full Name"
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  className="flex-1 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-primary"
                  required
                />
                <input
                  type="text"
                  placeholder="Phone (optional)"
                  value={manualPhone}
                  onChange={(e) => setManualPhone(e.target.value)}
                  className="w-32 px-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-1 focus:ring-primary"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary text-white text-xs font-bold rounded-xl hover:bg-primary-hover transition-all"
                >
                  Save
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

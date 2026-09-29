import { useState, useEffect, useMemo } from 'react'
import { loadData, calculateTotals, getLastDataMonth, logVisitor, resolveGroupName, submitFeedback } from '../utils/storage'
import Header from '../components/Header'
import SummaryCards from '../components/SummaryCards'
import ExpenseTable from '../components/ExpenseTable'
import Charts from '../components/Charts'
import WaterSupplyTracker from '../components/WaterSupplyTracker'
import { exportToCSV, printReport } from '../utils/export'
import { UserCheck, User, Search, X, Check, ArrowRight, MessageSquare, Building2, Star, Home, Phone, Send, CheckCircle2, Sparkles } from 'lucide-react'

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

  // Resident Identity state & WhatsApp Group tracking
  const [resident, setResident] = useState(null)
  const [detectedGroup, setDetectedGroup] = useState('')
  const [selectedModalGroup, setSelectedModalGroup] = useState('NTRG 2 Asad Hanzalla street')
  const [showCheckInModal, setShowCheckInModal] = useState(false)
  const [residentSearchQuery, setResidentSearchQuery] = useState('')
  const [manualName, setManualName] = useState('')
  const [manualPhone, setManualPhone] = useState('')
  const [manualAddress, setManualAddress] = useState('')

  // Resident Feedback & Rating state
  const [showFeedbackModal, setShowFeedbackModal] = useState(false)
  const [feedbackRating, setFeedbackRating] = useState(5)
  const [feedbackHoverRating, setFeedbackHoverRating] = useState(0)
  const [feedbackName, setFeedbackName] = useState('')
  const [feedbackPhone, setFeedbackPhone] = useState('')
  const [feedbackAddress, setFeedbackAddress] = useState('')
  const [feedbackComment, setFeedbackComment] = useState('')
  const [feedbackSubmitting, setFeedbackSubmitting] = useState(false)
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false)

  useEffect(() => {
    loadData().then(freshData => {
      setData(freshData)
      const last = getLastDataMonth(freshData)
      setSelectedMonth(last.month)
      setSelectedYear(last.year)

      // Resolve resident identity and WhatsApp group
      const params = new URLSearchParams(window.location.search)
      const queryUser = params.get('u') || params.get('user') || params.get('phone') || params.get('ref')
      const queryName = params.get('name') || params.get('wa_name') || params.get('profile') || params.get('resident')
      const queryAddr = params.get('addr') || params.get('address') || params.get('house') || params.get('houseNo')
      const rawGroup = params.get('grp') || params.get('group')
      const resolvedGroup = resolveGroupName(rawGroup)

      if (resolvedGroup) {
        setDetectedGroup(resolvedGroup)
        setSelectedModalGroup(resolvedGroup)
      }

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

      // Check queryName if no contact matched by phone
      if (!matched && queryName && freshData.contacts?.length) {
        const lowerName = queryName.toLowerCase().trim()
        matched = freshData.contacts.find(c => c.name?.toLowerCase().trim() === lowerName)
      }

      // If URL explicitly provides name and/or phone, create or enrich profile directly from WhatsApp link
      if (!matched && (queryName || queryUser)) {
        matched = {
          name: queryName || queryUser || 'Resident',
          phone: queryUser || '',
          houseAddress: queryAddr || '',
          houseNo: queryAddr || '',
          group: resolvedGroup || 'NTRG 2 Asad Hanzalla street',
          tag: 'Resident'
        }
      } else if (matched && (queryAddr || queryName)) {
        matched = {
          ...matched,
          name: queryName || matched.name,
          houseAddress: queryAddr || matched.houseAddress || matched.houseNo || '',
          houseNo: queryAddr || matched.houseNo || ''
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
        const finalGroup = resolvedGroup || matched.group || 'NTRG 2 Asad Hanzalla street'
        const fullResident = {
          ...matched,
          group: finalGroup,
          houseAddress: matched.houseAddress || matched.houseNo || '',
          houseNo: matched.houseNo || matched.houseAddress || ''
        }
        setResident(fullResident)
        localStorage.setItem('resident_identity', JSON.stringify(fullResident))
      } else if (resolvedGroup) {
        // Prompt check-in modal after a brief pause if arriving from WhatsApp group without identity
        setTimeout(() => {
          setShowCheckInModal(true)
        }, 800)
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

    const sessionKey = `visited_${currentMonthKey}_${resident?.phone || resident?.name || 'anon'}_${resident?.group || detectedGroup || 'general'}`
    if (sessionStorage.getItem(sessionKey)) return

    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    const logPayload = {
      name: resident?.name || 'Guest / Unverified Resident',
      phone: resident?.phone || '',
      houseNo: resident?.houseNo || resident?.houseAddress || '',
      houseAddress: resident?.houseAddress || resident?.houseNo || '',
      group: resident?.group || detectedGroup || 'Unspecified Group',
      tag: resident?.tag || 'Resident',
      monthViewed: currentMonthKey,
      device: isMobile ? 'Mobile' : 'Desktop'
    }

    logVisitor(logPayload).then(() => {
      sessionStorage.setItem(sessionKey, 'true')
    })
  }, [loading, currentMonthKey, resident, detectedGroup])

  // Filter contacts for check-in modal based on group & search query
  const filteredDirectoryContacts = useMemo(() => {
    if (!data.contacts) return []
    let list = data.contacts
    if (selectedModalGroup) {
      list = list.filter(c => (c.group || 'NTRG 2 Asad Hanzalla street') === selectedModalGroup)
    }
    if (!residentSearchQuery.trim()) return list.slice(0, 30)
    const q = residentSearchQuery.toLowerCase()
    return list.filter(c =>
      c.name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.houseNo?.toLowerCase().includes(q)
    )
  }, [data.contacts, selectedModalGroup, residentSearchQuery])

  const handleSelectResident = (c) => {
    const fullContact = {
      ...c,
      houseAddress: c.houseAddress || c.houseNo || '',
      houseNo: c.houseAddress || c.houseNo || '',
      group: c.group || selectedModalGroup || detectedGroup || 'Direct Community Resident'
    }
    setResident(fullContact)
    localStorage.setItem('resident_identity', JSON.stringify(fullContact))
    setShowCheckInModal(false)

    // Immediately log visit for newly identified resident with group and address
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    logVisitor({
      name: fullContact.name,
      phone: fullContact.phone,
      houseNo: fullContact.houseNo || '',
      houseAddress: fullContact.houseAddress || fullContact.houseNo || '',
      group: fullContact.group,
      tag: fullContact.tag || 'Resident',
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
      houseAddress: manualAddress.trim() || '',
      houseNo: manualAddress.trim() || '',
      tag: 'Resident',
      group: selectedModalGroup || detectedGroup || 'Direct Community Resident'
    }
    handleSelectResident(customResident)
    setManualName('')
    setManualPhone('')
    setManualAddress('')
  }

  const handleOpenFeedback = () => {
    setFeedbackRating(5)
    setFeedbackHoverRating(0)
    setFeedbackComment('')
    setFeedbackSubmitted(false)
    if (resident) {
      setFeedbackName(resident.name || '')
      setFeedbackPhone(resident.phone || '')
      setFeedbackAddress(resident.houseAddress || resident.houseNo || '')
    } else {
      setFeedbackName(manualName || '')
      setFeedbackPhone(manualPhone || '')
      setFeedbackAddress(manualAddress || '')
    }
    setShowFeedbackModal(true)
  }

  const handleSubmitFeedback = async (e) => {
    e.preventDefault()
    if (!feedbackName.trim()) {
      alert("Please enter your name.")
      return
    }
    setFeedbackSubmitting(true)
    try {
      const payload = {
        name: feedbackName.trim(),
        phone: feedbackPhone.trim(),
        houseAddress: feedbackAddress.trim(),
        rating: Number(feedbackRating || 5),
        comment: feedbackComment.trim(),
        monthViewed: currentMonthKey
      }
      await submitFeedback(payload)

      // If resident wasn't set, remember them as a resident profile
      if (!resident) {
        const fullProfile = {
          name: payload.name,
          phone: payload.phone,
          houseAddress: payload.houseAddress,
          houseNo: payload.houseAddress,
          group: detectedGroup || 'Direct Community Resident',
          tag: 'Resident'
        }
        setResident(fullProfile)
        localStorage.setItem('resident_identity', JSON.stringify(fullProfile))

        const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
        logVisitor({
          name: fullProfile.name,
          phone: fullProfile.phone,
          houseNo: fullProfile.houseNo,
          houseAddress: fullProfile.houseAddress,
          group: fullProfile.group,
          tag: fullProfile.tag,
          monthViewed: currentMonthKey,
          device: isMobile ? 'Mobile' : 'Desktop'
        })
      }

      setFeedbackSubmitted(true)
    } catch (err) {
      console.error("Error submitting feedback:", err)
      alert("Failed to submit feedback. Please try again.")
    } finally {
      setFeedbackSubmitting(false)
    }
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
        
        <div className="flex items-center gap-3">
          <button
            onClick={handleOpenFeedback}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-300 hover:bg-amber-500 hover:text-white transition-all text-xs font-extrabold border border-amber-500/25 shadow-xs active:scale-95"
            title="Give Resident Feedback & Rating"
          >
            <Star size={15} className="fill-amber-400 text-amber-500 group-hover:fill-white" />
            <span>Feedback &amp; Rating</span>
          </button>

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
        {/* Resident Identity & WhatsApp Group Welcome Banner */}
        {resident ? (
          <div className="bg-emerald-50/90 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-2xl p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-600/20 flex-shrink-0">
                <UserCheck size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-slate-100">
                    Welcome, {resident.name}!
                  </span>
                  <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    (resident.group || detectedGroup || '').includes('7D')
                      ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-800'
                      : (resident.group || detectedGroup || '').includes('Hanzalla')
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-800'
                      : 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/60 dark:text-purple-200 dark:border-purple-800'
                  }`}>
                    {resident.group || detectedGroup || 'Community Resident'}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    Verified Resident
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  Community Identity: <strong className="text-slate-800 dark:text-slate-200">{resident.group || detectedGroup || 'Community Resident'}</strong>
                  {(resident.houseAddress || resident.houseNo) ? ` • Address: ${resident.houseAddress || resident.houseNo}` : ''} {resident.phone ? `• Contact: ${resident.phone}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
              <button
                onClick={handleOpenFeedback}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500 hover:text-white text-amber-800 dark:text-amber-300 text-xs font-bold border border-amber-500/25 transition-all shadow-xs active:scale-95"
              >
                <Star size={13} className="fill-amber-400" /> Rate &amp; Feedback
              </button>
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
        ) : detectedGroup ? (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 border border-blue-200/80 dark:border-slate-700 rounded-2xl p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md shadow-primary/20 flex-shrink-0">
                <MessageSquare size={22} />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm sm:text-base font-extrabold text-slate-800 dark:text-slate-100">
                    Welcome! Visiting from WhatsApp Group:
                  </span>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {detectedGroup}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Tap &ldquo;Identify Yourself&rdquo; to link your Name &amp; House Address, or leave a review below.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleOpenFeedback}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Star size={14} className="fill-white" /> Rate &amp; Feedback
              </button>
              <button
                onClick={() => setShowCheckInModal(true)}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
              >
                <UserCheck size={15} /> Identify Yourself
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-800/80 border border-blue-200/80 dark:border-slate-700 rounded-2xl p-4 sm:px-6 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
            <div className="flex items-center gap-3.5">
              <div className="size-11 rounded-2xl bg-primary text-white flex items-center justify-center font-bold text-sm shadow-md shadow-primary/20 flex-shrink-0">
                <User size={22} />
              </div>
              <div>
                <p className="text-sm font-extrabold text-slate-800 dark:text-slate-100">
                  Welcome to the Community Expense Portal
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  No WhatsApp group membership required! Browse monthly financial accounts, check water schedule, and share your feedback.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={handleOpenFeedback}
                className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold px-3.5 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5 active:scale-98"
              >
                <Star size={14} className="fill-white" /> Give Feedback
              </button>
              <button
                onClick={() => setShowCheckInModal(true)}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
              >
                <UserCheck size={15} /> Identify Yourself
              </button>
            </div>
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
            
            {/* Resident Feedback & Rating Trigger Card */}
            <div className="bg-gradient-to-br from-amber-50 via-orange-50/30 to-amber-100/40 dark:from-slate-800 dark:to-slate-800/90 p-5 rounded-2xl border border-amber-200/80 dark:border-amber-900/40 shadow-sm space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm shadow-amber-500/20">
                  <Star size={18} className="fill-white" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-slate-800 dark:text-slate-100">Resident Feedback &amp; Rating</h4>
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-semibold">Your rating helps improve community services</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Have feedback or suggestions regarding water supply, street cleaning, security, or expenses? Share your rating &amp; comments directly with the management committee.
              </p>
              <button
                onClick={handleOpenFeedback}
                className="w-full py-2.5 px-4 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-extrabold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-98"
              >
                <Star size={14} className="fill-white" /> Rate Dashboard &amp; Leave Feedback
              </button>
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
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Resident Check-In</h3>
                  <p className="text-xs text-slate-500">Record your review with the management committee</p>
                </div>
              </div>
              <button
                onClick={() => setShowCheckInModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Non-Coercive Reassurance Notice */}
            <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl">
              <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 leading-relaxed">
                ℹ️ <strong>No WhatsApp group membership required:</strong> You can browse the complete monthly expense dashboard directly. Enter your Name, Phone Number, and House Address so the management knows you have reviewed this financial summary.
              </p>
            </div>

            {/* Quick Household Entry Form */}
            <div className="mt-4 pt-1">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2.5">
                Enter Your Household Details
              </h4>
              <form onSubmit={handleManualCheckIn} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Full Name *</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      placeholder="e.g. Muhammad Asif"
                      value={manualName}
                      onChange={(e) => setManualName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">Phone Number</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="tel"
                        placeholder="e.g. 0300 1234567"
                        value={manualPhone}
                        onChange={(e) => setManualPhone(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 mb-1">House / Flat Address *</label>
                    <div className="relative">
                      <Home size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. House 14-B / St 3"
                        value={manualAddress}
                        onChange={(e) => setManualAddress(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Community / Group Tag */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Area / Street Group (Optional)
                  </label>
                  <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setSelectedModalGroup('NTRG 2 Asad Hanzalla street')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                        selectedModalGroup === 'NTRG 2 Asad Hanzalla street'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Asad Hanzalla
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedModalGroup('N.T.R.C Sector 7D/1')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                        selectedModalGroup === 'N.T.R.C Sector 7D/1'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      Sector 7D/1
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedModalGroup('Direct Resident (No WhatsApp Group)')}
                      className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition-all ${
                        selectedModalGroup === 'Direct Resident (No WhatsApp Group)'
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                      }`}
                    >
                      No Group
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 bg-primary text-white text-xs font-extrabold rounded-xl hover:bg-primary-hover shadow-sm transition-all flex items-center justify-center gap-1.5"
                >
                  <Check size={14} /> Save Profile &amp; Check In
                </button>
              </form>
            </div>

            {/* Collapsible / Optional Directory Search */}
            <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700">
              <p className="text-[11px] font-bold text-slate-500 mb-1.5">
                Or find your name in the registered directory:
              </p>
              <div className="relative mb-2">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search registered directory by name or phone..."
                  value={residentSearchQuery}
                  onChange={(e) => setResidentSearchQuery(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-1 focus:ring-primary"
                />
              </div>

              {residentSearchQuery.trim() && (
                <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                  {filteredDirectoryContacts.length === 0 ? (
                    <p className="text-center py-2 text-[11px] text-slate-400">No matching directory contact.</p>
                  ) : (
                    filteredDirectoryContacts.map((c) => (
                      <button
                        key={c.id || c.phone}
                        onClick={() => handleSelectResident(c)}
                        className="w-full p-2 rounded-lg border border-slate-100 dark:border-slate-700 hover:border-primary/40 hover:bg-primary/5 transition-all text-left flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-primary">
                            {c.name}
                          </p>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {c.phone} {c.houseNo ? `(${c.houseNo})` : ''} • {c.group || 'NTRG 2 Asad Hanzalla street'}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-primary flex items-center gap-0.5">
                          Select <ArrowRight size={10} />
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Resident Feedback & Rating Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-amber-500 text-white flex items-center justify-center font-bold shadow-sm shadow-amber-500/20">
                  <Star size={18} className="fill-white" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">Resident Feedback &amp; Rating</h3>
                  <p className="text-xs text-slate-500">Share your thoughts on community services &amp; accounts</p>
                </div>
              </div>
              <button
                onClick={() => setShowFeedbackModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {feedbackSubmitted ? (
              <div className="py-8 text-center space-y-4">
                <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
                  <CheckCircle2 size={36} />
                </div>
                <div>
                  <h4 className="text-lg font-extrabold text-slate-900 dark:text-slate-100">
                    Thank You for Your Feedback!
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    Your rating and suggestions have been recorded in the Admin Panel for the management committee to review.
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-6 py-2.5 bg-primary text-white text-xs font-extrabold rounded-xl hover:bg-primary-hover shadow-sm transition-all"
                  >
                    Done / Return to Dashboard
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
                {/* Interactive Star Rating */}
                <div className="bg-amber-50/70 dark:bg-slate-900/60 p-4 rounded-2xl border border-amber-200/60 dark:border-slate-700 text-center space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    Overall Satisfaction Rating *
                  </label>
                  
                  <div className="flex items-center justify-center gap-2 py-1">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const active = (feedbackHoverRating || feedbackRating) >= starVal
                      return (
                        <button
                          type="button"
                          key={starVal}
                          onClick={() => setFeedbackRating(starVal)}
                          onMouseEnter={() => setFeedbackHoverRating(starVal)}
                          onMouseLeave={() => setFeedbackHoverRating(0)}
                          className="p-1 transition-transform hover:scale-125 active:scale-95 outline-none"
                          title={`${starVal} Star${starVal > 1 ? 's' : ''}`}
                        >
                          <Star
                            size={32}
                            className={`transition-colors ${
                              active
                                ? 'text-amber-400 fill-amber-400 drop-shadow-sm'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </button>
                      )
                    })}
                  </div>

                  <p className="text-xs font-extrabold text-amber-800 dark:text-amber-300">
                    {feedbackRating === 5 && '⭐⭐⭐⭐⭐ Outstanding Transparency & Work (بہترین)'}
                    {feedbackRating === 4 && '⭐⭐⭐⭐ Good & Satisfactory (تسلی بخش)'}
                    {feedbackRating === 3 && '⭐⭐⭐ Average / Satisfactory (مناسب)'}
                    {feedbackRating === 2 && '⭐⭐ Needs Improvement (بہتری کی ضرورت)'}
                    {feedbackRating === 1 && '⭐ Unsatisfactory / Issues Reported (غیر تسلی بخش)'}
                  </p>
                </div>

                {/* Resident Details Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Your Full Name *
                    </label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder="e.g. Asad Ullah"
                        value={feedbackName}
                        onChange={(e) => setFeedbackName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        Contact Phone
                      </label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="tel"
                          placeholder="e.g. 0300 1234567"
                          value={feedbackPhone}
                          onChange={(e) => setFeedbackPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        House / Flat Address *
                      </label>
                      <div className="relative">
                        <Home size={14} className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder="e.g. House 42-A, St 2"
                          value={feedbackAddress}
                          onChange={(e) => setFeedbackAddress(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  {/* Feedback / Comments textarea */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Comments, Suggestions, or Inquiries
                    </label>
                    <textarea
                      rows={3}
                      placeholder="Share your thoughts on water schedule, sanitation, guards, or any questions regarding expenses..."
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>Reviewing statement: <strong>{currentMonthKey}</strong></span>
                    <span>No WhatsApp join required</span>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={feedbackSubmitting}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-extrabold rounded-xl shadow-sm transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
                  >
                    {feedbackSubmitting ? (
                      <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Send size={14} />
                    )}
                    Submit Feedback &amp; Rating
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

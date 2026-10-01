import { useState, useEffect, useMemo } from 'react'
import { loadData, calculateTotals, getLastDataMonth, logVisitor, resolveGroupName, submitFeedback } from '../utils/storage'
import Header from '../components/Header'
import SummaryCards from '../components/SummaryCards'
import ExpenseTable from '../components/ExpenseTable'
import Charts from '../components/Charts'
import WaterSupplyTracker from '../components/WaterSupplyTracker'
import MonthlyVarianceBanner from '../components/MonthlyVarianceBanner'
import DynamicAlertBanner from '../components/DynamicAlertBanner'
import WhatsAppSnapshotModal from '../components/WhatsAppSnapshotModal'
import { LanguageSwitcher } from '../components/LanguageSwitcher'
import { useLanguage } from '../context/LanguageContext'
import { translateMonth } from '../utils/translations'
import { exportToCSV, printReport } from '../utils/export'
import { APP_VERSION, APP_RELEASE_DATE } from '../config/version'
import { UserCheck, User, Search, X, Check, ArrowRight, MessageSquare, Building2, Star, Home, Phone, Send, CheckCircle2, Sparkles, ShieldCheck, Share2, Calendar } from 'lucide-react'

// Helper to normalize phone numbers for robust matching (last 10 digits)
const normalizePhone = (p) => (p || '').replace(/[^0-9]/g, '').slice(-10)

// Helper for relative timestamps
const timeAgo = (timestamp) => {
  if (!timestamp) return 'Recently'
  const seconds = Math.floor((Date.now() - Number(timestamp)) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  return `${months}mo ago`
}

export default function ViewerDashboard() {
  const { lang, t } = useLanguage()
  const isUrdu = lang === 'ur'
  const [data, setData] = useState({
    settings: { currency: 'PKR', cctvExpense: 0, showCctvExpense: true, defaultOpeningBalance: 0, defaultMonthlyCollection: 0 },
    monthlyRecords: [],
    expenses: [],
    waterSupply: [],
    contacts: [],
    feedback: []
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
  const [showWhatsAppSnapshotModal, setShowWhatsAppSnapshotModal] = useState(false)

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
      } else {
        // Prompt check-in modal immediately if arriving without confirmed identity
        setTimeout(() => {
          setShowCheckInModal(true)
        }, 400)
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

  const feedbackList = data.feedback || []
  const avgRating = useMemo(() => {
    if (!feedbackList.length) return '5.0'
    const total = feedbackList.reduce((acc, f) => acc + (Number(f.rating) || 5), 0)
    return (total / feedbackList.length).toFixed(1)
  }, [feedbackList])

  // Log visit to Firestore ONLY when resident identity is confirmed
  useEffect(() => {
    if (loading || !selectedMonth || !resident) return

    const sessionKey = `visited_${currentMonthKey}_${resident?.phone || resident?.name || 'anon'}_${resident?.group || detectedGroup || 'general'}`
    if (sessionStorage.getItem(sessionKey)) return
    sessionStorage.setItem(sessionKey, 'true')

    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    const logPayload = {
      name: resident.name,
      phone: resident.phone || '',
      houseNo: resident.houseNo || resident.houseAddress || '',
      houseAddress: resident.houseAddress || resident.houseNo || '',
      group: resident.group || detectedGroup || 'NTRG 2 Asad Hanzalla street',
      tag: resident.tag || 'Resident',
      monthViewed: currentMonthKey,
      device: isMobile ? 'Mobile' : 'Desktop'
    }

    logVisitor(logPayload)
  }, [loading, currentMonthKey, resident, detectedGroup])

  // Filter contacts for check-in modal based on group & search query
  const filteredDirectoryContacts = useMemo(() => {
    if (!data.contacts) return []
    let list = data.contacts
    if (selectedModalGroup && selectedModalGroup !== 'Direct Resident (No WhatsApp Group)') {
      list = list.filter(c => (c.group || 'NTRG 2 Asad Hanzalla street') === selectedModalGroup)
    }
    if (!residentSearchQuery.trim()) return list
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
      group: c.group || selectedModalGroup || detectedGroup || 'NTRG 2 Asad Hanzalla street'
    }
    const sessionKey = `visited_${currentMonthKey}_${fullContact.phone || fullContact.name || 'anon'}_${fullContact.group || detectedGroup || 'general'}`
    sessionStorage.setItem(sessionKey, 'true')

    setResident(fullContact)
    localStorage.setItem('resident_identity', JSON.stringify(fullContact))
    setShowCheckInModal(false)

    // Immediately log visit for newly identified resident with group and address
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent)
    logVisitor({
      name: fullContact.name,
      phone: fullContact.phone || '',
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
    if (!manualName.trim() || !manualPhone.trim()) return
    const customResident = {
      name: manualName.trim(),
      phone: manualPhone.trim(),
      houseAddress: manualAddress.trim() || '',
      houseNo: manualAddress.trim() || '',
      tag: 'Resident',
      group: selectedModalGroup || detectedGroup || 'NTRG 2 Asad Hanzalla street'
    }
    handleSelectResident(customResident)
    setManualName('')
    setManualPhone('')
    setManualAddress('')
  }

  const handleDismissModal = () => {
    setShowCheckInModal(false)
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
      const created = await submitFeedback(payload)
      if (created) {
        setData(prev => ({
          ...prev,
          feedback: [created, ...(prev.feedback || [])]
        }))
      }

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
      <header className="sticky top-0 z-50 w-full border-b border-primary/10 bg-white/90 dark:bg-background-dark/90 backdrop-blur-md overflow-x-auto no-scrollbar scroll-smooth">
        <div className="flex items-center justify-between gap-4 px-4 sm:px-6 lg:px-10 py-3 sm:py-4 min-w-max">
          <div className="flex items-center gap-3 text-primary flex-shrink-0">
            <div className="size-8 bg-primary text-white rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="material-symbols-outlined">account_balance_wallet</span>
            </div>
            <div className="flex flex-col">
              <h2 className="text-slate-900 dark:text-slate-100 text-base sm:text-lg font-bold leading-tight tracking-tight whitespace-nowrap">
                {isUrdu ? (t.appTitle || 'ماہانہ اخراجات ڈیش بورڈ') : 'ExpensePro'}
              </h2>
              <span className="text-primary text-[10px] sm:text-xs font-semibold uppercase tracking-wider whitespace-nowrap">
                {isUrdu ? 'مشاہدہ موڈ' : 'Viewer Mode'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <LanguageSwitcher />
            <div className="hidden md:flex items-center gap-2 bg-slate-100 dark:bg-primary/10 px-3 py-1.5 rounded-full flex-shrink-0">
              <span className="material-symbols-outlined text-sm text-primary">visibility</span>
              <span className="text-xs font-medium text-slate-600 dark:text-slate-300 whitespace-nowrap">
                {isUrdu ? 'صرف پڑھنے کی اجازت' : 'Read-only Access'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              <button
                onClick={() => setShowWhatsAppSnapshotModal(true)}
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-black shadow-sm transition-all active:scale-95 flex-shrink-0 whitespace-nowrap"
                title="Download 1080px WhatsApp Card Summary"
              >
                <Share2 size={16} />
                <span className="hidden sm:inline">{t.exportWhatsApp || 'Download WhatsApp Summary'}</span>
                <span className="sm:hidden">{isUrdu ? 'واٹس ایپ سمری' : 'WhatsApp Card'}</span>
              </button>
              <button onClick={() => exportToCSV(monthlyExpenses, totals, currentMonthKey)} className="flex items-center justify-center rounded-xl h-9 w-9 sm:h-10 sm:w-10 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex-shrink-0" title="Export CSV">
                <span className="material-symbols-outlined text-sm sm:text-base">download</span>
              </button>
              <button onClick={printReport} className="flex items-center justify-center rounded-xl h-9 w-9 sm:h-10 sm:w-10 bg-primary/10 text-primary hover:bg-primary hover:text-white transition-colors flex-shrink-0" title="Print Report">
                <span className="material-symbols-outlined text-sm sm:text-base">print</span>
              </button>
            </div>
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
                    {isUrdu ? `خوش آمدید، ${resident.name}!` : `Welcome, ${resident.name}!`}
                  </span>
                  <span className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                    (resident.group || detectedGroup || '').includes('7D')
                      ? 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/60 dark:text-blue-200 dark:border-blue-800'
                      : (resident.group || detectedGroup || '').includes('Hanzalla')
                      ? 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/60 dark:text-emerald-200 dark:border-emerald-800'
                      : 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/60 dark:text-purple-200 dark:border-purple-800'
                  }`}>
                    {resident.group || detectedGroup || (isUrdu ? 'کمیونٹی رہائشی' : 'Community Resident')}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {isUrdu ? 'مصدقہ رہائشی' : 'Verified Resident'}
                  </span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                  {isUrdu ? 'کمیونٹی شناخت:' : 'Community Identity:'} <strong className="text-slate-800 dark:text-slate-200">{resident.group || detectedGroup || (isUrdu ? 'کمیونٹی رہائشی' : 'Community Resident')}</strong>
                  {(resident.houseAddress || resident.houseNo) ? ` • ${isUrdu ? 'پتہ:' : 'Address:'} ${resident.houseAddress || resident.houseNo}` : ''} {resident.phone ? `• ${isUrdu ? 'رابطہ:' : 'Contact:'} ${resident.phone}` : ''}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 self-end sm:self-auto flex-wrap">
              <button
                onClick={() => setShowCheckInModal(true)}
                className="text-xs font-bold text-emerald-800 dark:text-emerald-300 hover:text-emerald-950 hover:underline"
              >
                {isUrdu ? 'پروفائل تبدیل کریں' : 'Switch Profile'}
              </button>
              <span className="text-emerald-300 dark:text-emerald-700 hidden sm:inline">•</span>
              <button
                onClick={handleClearIdentity}
                className="text-xs text-slate-500 hover:text-red-600"
                title="Forget saved profile on this device"
              >
                {isUrdu ? 'لاگ آؤٹ' : 'Logout'}
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
                    {isUrdu ? 'خوش آمدید! واٹس ایپ گروپ سے تشریف لائے ہیں:' : 'Welcome! Visiting from WhatsApp Group:'}
                  </span>
                  <span className="text-xs font-black px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                    {detectedGroup}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  {isUrdu ? 'اپنا نام اور گھر کا پتہ اس ڈیوائس سے لنک کرنے کے لیے "شناخت درج کریں" پر کلک کریں۔' : 'Tap "Identify Yourself" to link your Name & House Address to this device.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setShowCheckInModal(true)}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
              >
                <UserCheck size={15} /> {isUrdu ? 'شناخت درج کریں' : 'Identify Yourself'}
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
                  {isUrdu ? 'کمیونٹی اخراجات پورٹل میں خوش آمدید' : 'Welcome to the Community Expense Portal'}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {isUrdu ? 'واٹس ایپ گروپ ممبر ہونا ضروری نہیں۔ ماہانہ مالیاتی اکاؤنٹس، پانی کا شیڈول اور کمیونٹی ریکارڈ دیکھیں۔' : 'No WhatsApp group membership required! Browse monthly financial accounts, check water schedule, and community records.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setShowCheckInModal(true)}
                className="bg-primary hover:bg-primary-hover text-white text-xs font-extrabold px-4 py-2.5 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
              >
                <UserCheck size={15} /> {isUrdu ? 'شناخت درج کریں' : 'Identify Yourself'}
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

        {/* What Changed This Month? Headline Variance Banner */}
        <MonthlyVarianceBanner
          selectedMonth={currentMonthKey}
          allExpenses={data.expenses || []}
          currency={data.settings?.currency || 'PKR'}
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
          isAdmin={false}
        />

        {/* Summary Cards */}
        <SummaryCards
          openingBalance={totals?.record?.openingBalance ?? 0}
          monthlyCollection={totals?.record?.monthlyCollection ?? 0}
          totalExpense={totals?.totalExpense ?? 0}
          netCashFlow={totals?.netCashFlow ?? 0}
          status={totals?.status || 'Surplus'}
          closingBalance={totals?.closingBalance ?? 0}
          isOverdrawn={totals?.isOverdrawn ?? false}
          saving={totals?.saving ?? 0}
          totalSaving={totals?.totalSaving ?? 0}
          currency={data?.settings?.currency || 'PKR'}
          isNoData={totals?.record?.isNoData ?? false}
        />

        {/* Contextual Dynamic Resident Alert Banner (Deficit vs Surplus) */}
        <DynamicAlertBanner
          netCashFlow={totals?.netCashFlow ?? 0}
          currency={data?.settings?.currency || 'PKR'}
          customNote={totals?.record?.note}
          isNoData={totals?.record?.isNoData ?? false}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          {/* Table Section */}
          <div className="xl:col-span-8 space-y-6">
            <ExpenseTable
              expenses={monthlyExpenses}
              allExpenses={data.expenses}
              settings={data.settings}
              selectedMonth={currentMonthKey}
              totals={totals}
              isAdmin={false}
            />
          </div>

          {/* Sidebar Content */}
          <div className="xl:col-span-4 space-y-6">
            <Charts
              expenses={monthlyExpenses}
              allExpenses={data.expenses}
              monthlyRecords={data.monthlyRecords}
              selectedMonth={currentMonthKey}
            />
            
            {/* Card 2: Report Governance & Audit */}
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-primary/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">assignment_turned_in</span>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                    {t.governanceTitle || 'Governance & Scope'}
                  </h4>
                </div>
                <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck size={12} /> {t.effectiveBadge || 'Official Record'}
                </span>
              </div>

              {/* Compact Metadata Chips */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1">
                    <Calendar size={11} className="text-primary" /> {t.effectiveDateLabel || 'Effective Since'}
                  </span>
                  <p className="font-extrabold text-slate-800 dark:text-slate-100">
                    {t.effectiveDateValue || 'Dec 01, 2025'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-200/70 dark:border-slate-700/60 space-y-0.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-400 flex items-center gap-1">
                    <ShieldCheck size={11} className="text-emerald-500" /> {t.reportTypeLabel || 'Report Nature'}
                  </span>
                  <p className="font-extrabold text-slate-800 dark:text-slate-100">
                    {t.reportTypeValue || 'Monthly Collections & Operational Expenses'}
                  </p>
                </div>
              </div>

              {/* Scope & Purpose Summary Bullets */}
              <ul className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-700/60 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <span><strong>{isUrdu ? 'دائرہ اختیار:' : 'Scope:'}</strong> {isUrdu ? (t.governanceNote || 'انتظامیہ صرف 01 دسمبر 2025 کے بعد کی وصولیوں اور اخراجات کی پابند و جوابدہ ہے۔') : 'Covers collections & expenditures managed from Dec 01, 2025 onward.'}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="size-1.5 rounded-full bg-emerald-500 mt-1.5 flex-shrink-0" />
                  <span><strong>{isUrdu ? 'مقصد:' : 'Purpose:'}</strong> {isUrdu ? 'سوسائٹی کے رہائشیوں کے لیے ماہانہ عوامی مالیاتی شفافیت۔' : 'Monthly public financial transparency for society residents.'}</span>
                </li>
              </ul>
            </div>

            {/* Card 3: Management & Inquiries (Interactive WhatsApp + Call) */}
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-primary/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm sm:text-base">
                  <span className="material-symbols-outlined text-primary text-xl">contact_phone</span>
                  {t.managementContacts || 'Management Contacts'}
                </h4>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                  {isUrdu ? 'براہ راست رابطہ' : 'Direct Contact'}
                </span>
              </div>

              <div className="space-y-3">
                {/* Contact 1: Mr. Majeed */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center justify-center font-black text-base flex-shrink-0 shadow-xs border border-emerald-200/60">
                      M
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 truncate">
                          {isUrdu ? 'جناب عبدالمجید صاحب' : 'Mr. Majeed'}
                        </p>
                        <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200/60">
                          {t.supervisorRole || 'Project Supervisor'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-mono mt-0.5">
                        <a href="tel:03013377675" className="hover:text-emerald-600 dark:hover:text-emerald-400 hover:underline">0301-3377675</a>
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href="tel:03013377675"
                      className="inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition active:scale-95 shadow-2xs border border-slate-200 dark:border-slate-700"
                    >
                      <Phone size={13} className="text-slate-500" />
                      <span>{t.btnCall || 'Call'}</span>
                    </a>
                    <a
                      href="https://wa.me/923013377675?text=Hello%20Mr.%20Majeed,%20regarding%20August%20Expense%20Sheet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl transition active:scale-95 shadow-2xs border border-emerald-200/60 dark:border-emerald-800/40"
                    >
                      <MessageSquare size={13} className="text-emerald-600 dark:text-emerald-400" />
                      <span>{t.btnChat || 'WhatsApp'}</span>
                    </a>
                  </div>
                </div>

                {/* Contact 2: Mr. Fahad Rizwan */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 flex items-center justify-center font-black text-base flex-shrink-0 shadow-xs border border-amber-200/60">
                      F
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <p className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 truncate">
                          {isUrdu ? 'جناب فہد رضوان صاحب' : 'Mr. Fahad Rizwan'}
                        </p>
                        <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200/60">
                          {t.auditorRole || 'Financial Auditor'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-mono mt-0.5">
                        <a href="tel:03443160446" className="hover:text-amber-600 dark:hover:text-amber-400 hover:underline">0344-3160446</a>
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href="tel:03443160446"
                      className="inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition active:scale-95 shadow-2xs border border-slate-200 dark:border-slate-700"
                    >
                      <Phone size={13} className="text-slate-500" />
                      <span>{t.btnCall || 'Call'}</span>
                    </a>
                    <a
                      href="https://wa.me/923443160446?text=Hello%20Mr.%20Fahad,%20regarding%20August%20Expense%20Sheet"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl transition active:scale-95 shadow-2xs border border-emerald-200/60 dark:border-emerald-800/40"
                    >
                      <MessageSquare size={13} className="text-emerald-600 dark:text-emerald-400" />
                      <span>{t.btnChat || 'WhatsApp'}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 4: Dashboard Related Queries */}
            <div className="bg-white dark:bg-slate-800 p-5 sm:p-6 rounded-2xl border border-primary/10 shadow-sm space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-700/60 pb-3">
                <h4 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2 text-sm sm:text-base">
                  <span className="material-symbols-outlined text-primary text-xl">help_outline</span>
                  {t.techSupportTitle || (isUrdu ? 'ڈیش بورڈ سے متعلق سوالات' : 'Dashboard Related Queries')}
                </h4>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-slate-500">
                  {t.directContact || (isUrdu ? 'براہ راست رابطہ' : 'Direct Contact')}
                </span>
              </div>

              <div className="space-y-3">
                {/* Contact: Mr. Syed Bilal Faheem */}
                <div className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-2xl border border-slate-200/70 dark:border-slate-700/60 space-y-3 shadow-2xs">
                  <div className="flex items-center gap-3">
                    <div className="size-11 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300 flex items-center justify-center font-black text-base flex-shrink-0 shadow-xs border border-blue-200/60">
                      B
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm sm:text-base font-black text-slate-800 dark:text-slate-100 truncate">
                        {isUrdu ? 'جناب سید بلال فہیم' : 'Mr. Syed Bilal Faheem'}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 font-medium font-mono mt-0.5">
                        <a href="tel:03362607836" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline">0336-2607836</a>
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                    <a
                      href="tel:03362607836"
                      className="inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition active:scale-95 shadow-2xs border border-slate-200 dark:border-slate-700"
                    >
                      <Phone size={13} className="text-slate-500" />
                      <span>{t.btnCall || 'Call'}</span>
                    </a>
                    <a
                      href="https://wa.me/923362607836?text=Hello%20Mr.%20Bilal,%20regarding%20Dashboard%20Application%20query/issue"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 py-2 px-3 text-xs font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl transition active:scale-95 shadow-2xs border border-emerald-200/60 dark:border-emerald-800/40"
                    >
                      <MessageSquare size={13} className="text-emerald-600 dark:text-emerald-400" />
                      <span>{t.btnChat || 'WhatsApp'}</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* ─── Resident Reviews & Community Feedback Section ─── */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600/10 via-indigo-600/5 to-purple-600/10 dark:from-slate-800/90 dark:to-slate-900/90 rounded-2xl sm:rounded-3xl p-5 sm:p-7 lg:p-9 border border-blue-500/20 dark:border-slate-700 shadow-sm space-y-6">
          {/* Subtle glow decorative background */}
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          {/* Section Header */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-primary/10 dark:border-slate-700/60 pb-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60 shadow-2xs">
                  <Sparkles size={12} className="text-blue-600 dark:text-blue-400" />
                  {t.reviewsBadge}
                </span>
                {feedbackList.length > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <CheckCircle2 size={12} /> {feedbackList.length} {feedbackList.length === 1 ? t.verifiedReviewSingle : t.verifiedReviewsCount}
                  </span>
                )}
              </div>
              <h3 className="text-lg sm:text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {t.reviewsHeading}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                {t.reviewsSubheading}
              </p>
            </div>

            <div className="flex items-center gap-2.5 sm:gap-3 flex-wrap">
              {feedbackList.length > 0 && (
                <div className="flex items-center gap-2 bg-white dark:bg-slate-800 border border-amber-200 dark:border-amber-900/60 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-2xl shadow-xs">
                  <div className="flex items-center gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <div className="border-l border-slate-200 dark:border-slate-700 pl-2 text-left">
                    <p className="text-xs font-black text-slate-800 dark:text-slate-200 leading-none">{avgRating} / 5.0</p>
                    <p className="text-[9px] text-amber-600 dark:text-amber-400 font-bold leading-none mt-0.5">{t.topRated}</p>
                  </div>
                </div>
              )}

              {/* Single ONLY Review Button */}
              <button
                onClick={handleOpenFeedback}
                className="inline-flex items-center gap-2 px-4 py-2 sm:py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-extrabold rounded-2xl shadow-sm shadow-primary/25 transition-all active:scale-95 whitespace-nowrap"
              >
                <Star size={14} className="fill-white" />
                <span>{t.btnLeaveReview}</span>
              </button>
            </div>
          </div>

          {/* Cards Grid or Empty State */}
          {feedbackList.length === 0 ? (
            <div className="relative z-10 text-center py-10 px-4 bg-white/70 dark:bg-slate-800/70 rounded-2xl sm:rounded-3xl border border-dashed border-slate-200 dark:border-slate-700 max-w-lg mx-auto space-y-3">
              <div className="size-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mx-auto">
                <Star size={24} className="fill-amber-400" />
              </div>
              <h4 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                {t.noReviewsTitle}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-md mx-auto">
                {t.noReviewsDesc}
              </p>
            </div>
          ) : (
            <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
              {feedbackList.map((f, idx) => {
                const rating = Number(f.rating) || 5
                const initials = (f.name || 'R').charAt(0).toUpperCase()
                return (
                  <div
                    key={f.id || idx}
                    className="bg-white dark:bg-slate-800 rounded-2xl sm:rounded-3xl p-5 border border-slate-200/80 dark:border-slate-700 shadow-md shadow-blue-500/5 hover:shadow-xl hover:-translate-y-0.5 transition-all duration-300 flex flex-col justify-between"
                  >
                    <div>
                      {/* Card Top: Avatar, Name, House Address & Verified Badge */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          {/* Avatar with Blue Verified Checkmark Overlay */}
                          <div className="relative size-10 sm:size-11 rounded-full bg-gradient-to-tr from-primary to-indigo-600 text-white font-black text-sm flex items-center justify-center shadow-md shadow-primary/20 flex-shrink-0">
                            {initials}
                            <div
                              className="absolute -bottom-1 -right-1 size-4 sm:size-5 bg-blue-500 text-white rounded-full flex items-center justify-center border-2 border-white dark:border-slate-800 shadow-xs"
                              title={isUrdu ? "تصدیق شدہ رہائشی" : "Verified Resident Profile"}
                            >
                              <Check size={10} strokeWidth={3} />
                            </div>
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <p className="font-extrabold text-sm text-slate-800 dark:text-slate-100 leading-tight truncate">
                                {f.name}
                              </p>
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 border border-blue-200/50 flex-shrink-0">
                                {t.verifiedResident}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1 truncate font-medium">
                              <Home size={11} className="text-purple-500 flex-shrink-0" />
                              <span className="truncate">{f.houseAddress || 'Sector 7D/1'}</span>
                            </p>
                          </div>
                        </div>

                        {/* Verified Shield Icon */}
                        <div
                          className="size-7 sm:size-8 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center text-blue-600 dark:text-blue-400 flex-shrink-0"
                          title={isUrdu ? "تصدیق شدہ جائزہ" : "Verified Community Review"}
                        >
                          <ShieldCheck size={16} />
                        </div>
                      </div>

                      {/* Star Rating & Relative Time */}
                      <div className="flex items-center gap-2 my-2.5">
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, sIdx) => (
                            <Star
                              key={sIdx}
                              size={15}
                              className={sIdx < rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 dark:text-slate-600'}
                            />
                          ))}
                        </div>
                        <span className="text-xs font-semibold text-slate-400">
                          {timeAgo(f.timestamp) || translateMonth(f.dateStr, lang) || t.recently}
                        </span>
                      </div>

                      {/* Review Text / Quote */}
                      <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-200 leading-relaxed font-normal mt-2">
                        &ldquo;{f.comment || t.defaultReviewComment}&rdquo;
                      </p>
                    </div>

                    {/* Card Bottom Meta */}
                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-[11px]">
                      <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/60 dark:border-emerald-800/40">
                        <CheckCircle2 size={11} /> {t.verifiedReviewBadge}
                      </span>
                      <span className="text-slate-400 font-semibold">
                        {translateMonth(f.monthViewed || currentMonthKey, lang)}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

      </main>
      
      <footer className="bg-white dark:bg-background-dark border-t border-primary/10 py-6 text-center text-slate-400 text-xs">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-3 text-slate-500 dark:text-slate-400 font-medium">
          <span>© 2026 Sector 7D/1 Residents Management System</span>
          <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-[11px] font-bold border border-slate-200 dark:border-slate-700">
            Version {APP_VERSION} <span className="text-slate-400 font-normal">({APP_RELEASE_DATE})</span>
          </span>
        </div>
      </footer>

      {/* Resident Identity / Check-in Modal */}
      {showCheckInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700 flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
                  <UserCheck size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{t.checkInTitle}</h3>
                  <p className="text-xs text-slate-500">{t.checkInSubtitle}</p>
                </div>
              </div>
              <button
                onClick={handleDismissModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title={t.closeBtn}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Modal Content */}
            <div className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
              {/* Non-Coercive Reassurance Notice */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl">
                <p className="text-xs font-semibold text-emerald-900 dark:text-emerald-200 leading-relaxed">
                  ℹ️ <strong>{t.checkInNoticeBold}</strong> {t.checkInNoticeText}
                </p>
              </div>

              {/* Group Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1.5">
                  {t.selectGroupLabel}
                </label>
                <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setSelectedModalGroup('NTRG 2 Asad Hanzalla street')}
                    className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all ${
                      selectedModalGroup === 'NTRG 2 Asad Hanzalla street'
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {t.grpAsadHanzalla}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedModalGroup('N.T.R.C Sector 7D/1')}
                    className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all ${
                      selectedModalGroup === 'N.T.R.C Sector 7D/1'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {t.grpSector7D}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedModalGroup('Direct Resident (No WhatsApp Group)')}
                    className={`py-2 px-2 rounded-lg text-[11px] font-bold transition-all ${
                      selectedModalGroup === 'Direct Resident (No WhatsApp Group)'
                        ? 'bg-purple-600 text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                    }`}
                  >
                    {t.grpNoGroup}
                  </button>
                </div>
              </div>

              {/* Fast 1-Click Directory Pick */}
              {selectedModalGroup !== 'Direct Resident (No WhatsApp Group)' && data.contacts?.length > 0 && (
                <div className="bg-slate-50 dark:bg-slate-900/60 p-3 rounded-2xl border border-slate-200/80 dark:border-slate-700 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      {t.quickPickTitle}
                    </span>
                    <span className="text-[10px] text-slate-400 font-medium">
                      {filteredDirectoryContacts.length} {isUrdu ? 'رہائشی درج ہیں' : 'residents listed'}
                    </span>
                  </div>

                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder={t.searchDirectoryPlaceholder}
                      value={residentSearchQuery}
                      onChange={(e) => setResidentSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-3 py-1.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs outline-none focus:ring-2 focus:ring-primary"
                    />
                  </div>

                  <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
                    {filteredDirectoryContacts.length === 0 ? (
                      <p className="text-center py-2 text-[11px] text-slate-400">{t.noMatchFound}</p>
                    ) : (
                      filteredDirectoryContacts.map((c) => (
                        <button
                          key={c.id || c.phone}
                          type="button"
                          onClick={() => handleSelectResident(c)}
                          className="w-full p-2 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 hover:border-emerald-400 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/20 transition-all text-left flex items-center justify-between group shadow-2xs"
                        >
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                              {c.name}
                            </p>
                            <p className="text-[10px] text-slate-500 font-mono">
                              {c.phone} {c.houseNo ? `• ${c.houseNo}` : ''}
                            </p>
                          </div>
                          <span className="text-[11px] font-bold text-emerald-600 flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                            {t.selectResidentBtn} <ArrowRight size={11} />
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Manual Household Entry Form */}
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-2">
                  {t.manualEntryHeading}
                </h4>
                <form onSubmit={handleManualCheckIn} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      {t.yourFullName}
                    </label>
                    <div className="relative">
                      <User size={14} className="absolute left-3 top-3 text-slate-400" />
                      <input
                        type="text"
                        placeholder={isUrdu ? "مثلاً: محمد آصف / طارق محمود" : "e.g. Muhammad Asif / Tariq Mehmood"}
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        {t.contactPhoneLabel}
                      </label>
                      <div className="relative">
                        <Phone size={14} className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="tel"
                          placeholder={t.phonePlaceholder}
                          value={manualPhone}
                          onChange={(e) => setManualPhone(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                        {t.houseAddressLabel}
                      </label>
                      <div className="relative">
                        <Home size={14} className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder={t.addressPlaceholder}
                          value={manualAddress}
                          onChange={(e) => setManualAddress(e.target.value)}
                          className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-primary text-white text-xs font-extrabold rounded-xl hover:bg-primary-hover shadow-sm transition-all flex items-center justify-center gap-1.5 active:scale-98"
                  >
                    <Check size={14} /> {t.saveProfileBtn}
                  </button>
                </form>
              </div>
            </div>

            {/* Modal Footer with Dismiss */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-xs flex-shrink-0">
              <span className="text-[11px] text-slate-400">{t.statementLabel} <strong>{translateMonth(currentMonthKey, lang)}</strong></span>
              <button
                type="button"
                onClick={handleDismissModal}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-semibold hover:underline transition-colors text-[11px]"
              >
                {t.closeBtn}
              </button>
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
                  <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">{t.feedbackModalTitle}</h3>
                  <p className="text-xs text-slate-500">{t.feedbackModalSubtitle}</p>
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
                    {t.thankYouTitle}
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto leading-relaxed">
                    {t.thankYouSubtitle}
                  </p>
                </div>
                <div className="pt-2">
                  <button
                    onClick={() => setShowFeedbackModal(false)}
                    className="px-6 py-2.5 bg-primary text-white text-xs font-extrabold rounded-xl hover:bg-primary-hover shadow-sm transition-all"
                  >
                    {t.doneReturnBtn}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitFeedback} className="flex-1 overflow-y-auto py-3 space-y-4 pr-1">
                {/* Interactive Star Rating */}
                <div className="bg-amber-50/70 dark:bg-slate-900/60 p-4 rounded-2xl border border-amber-200/60 dark:border-slate-700 text-center space-y-2">
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-300">
                    {t.overallSatisfaction}
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
                      {t.yourFullName}
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
                        {t.contactPhone}
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
                        {t.houseAddress}
                      </label>
                      <div className="relative">
                        <Home size={14} className="absolute left-3 top-3 text-slate-400" />
                        <input
                          type="text"
                          placeholder="e.g. R-100 Sector 7D/1 or A-4 Sector 7D/1"
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
                      {t.commentsSuggestions}
                    </label>
                    <textarea
                      rows={3}
                      placeholder={t.commentsPlaceholder}
                      value={feedbackComment}
                      onChange={(e) => setFeedbackComment(e.target.value)}
                      className="w-full p-3 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-primary leading-relaxed"
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                    <span>{t.reviewingStatement} <strong>{translateMonth(currentMonthKey, lang)}</strong></span>
                    <span>{isUrdu ? 'واٹس ایپ گروپ لازمی نہیں' : 'No WhatsApp join required'}</span>
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
                    {feedbackSubmitting ? t.submittingBtn : t.submitFeedbackBtn}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* WhatsApp 1080px Summary Snapshot Modal */}
      <WhatsAppSnapshotModal
        isOpen={showWhatsAppSnapshotModal}
        onClose={() => setShowWhatsAppSnapshotModal(false)}
        selectedMonth={currentMonthKey}
        totals={totals}
        allExpenses={data.expenses || []}
        currency={data.settings?.currency || 'PKR'}
      />
    </div>
  )
}

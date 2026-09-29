import { useState, useEffect, useMemo } from 'react'
import {
  Users, Eye, Smartphone, Monitor, Clock, ArrowUpRight,
  Search, Filter, Download, RefreshCw, Send, CheckCircle2,
  AlertCircle, ChevronRight, Sparkles, Trash2, Calendar, UserCheck, MessageSquare, ExternalLink, X, Building2,
  Star, Home, ThumbsUp, MessageSquareHeart
} from 'lucide-react'
import { loadData, clearVisitorLogs, clearFeedback } from '../utils/storage'

// Helper to normalize phone numbers for robust matching (last 10 digits)
const normalizePhone = (p) => (p || '').replace(/[^0-9]/g, '').slice(-10)

// Helper for relative time formatting
const timeAgo = (timestamp) => {
  if (!timestamp) return 'Unknown'
  const seconds = Math.floor((Date.now() - timestamp) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export default function AnalyticsDashboard({ data = {}, setData, showNotif, defaultView = 'tracking' }) {
  const [analyticsView, setAnalyticsView] = useState(defaultView) // 'tracking' | 'feedback'

  // Sync if parent tab changes
  useEffect(() => {
    if (defaultView) setAnalyticsView(defaultView)
  }, [defaultView])
  const [filterTab, setFilterTab] = useState('all') // 'all' | 'visited' | 'unvisited'
  const [groupFilter, setGroupFilter] = useState('all') // 'all' | 'N.T.R.C Sector 7D/1' | 'NTRG 2 Asad Hanzalla street'
  const [searchTerm, setSearchTerm] = useState('')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedContactHistory, setSelectedContactHistory] = useState(null)

  // Feedback specific filters
  const [feedbackSearch, setFeedbackSearch] = useState('')
  const [feedbackRatingFilter, setFeedbackRatingFilter] = useState('all') // 'all' | '5' | '4' | '3' | 'low'

  const contacts = data.contacts || []
  const visitorLogs = data.visitorLogs || []
  const feedbackList = data.feedback || []

  // ─── Feedback Metrics Calculations ───
  const totalFeedbackCount = feedbackList.length
  const avgRating = totalFeedbackCount > 0
    ? (feedbackList.reduce((sum, f) => sum + (f.rating || 5), 0) / totalFeedbackCount).toFixed(1)
    : '5.0'

  const fiveStarCount = feedbackList.filter(f => (f.rating || 5) === 5).length
  const fourStarCount = feedbackList.filter(f => f.rating === 4).length
  const threeStarCount = feedbackList.filter(f => f.rating === 3).length
  const twoStarCount = feedbackList.filter(f => f.rating === 2).length
  const oneStarCount = feedbackList.filter(f => f.rating === 1).length

  const positivePercent = totalFeedbackCount > 0
    ? Math.round(((fiveStarCount + fourStarCount) / totalFeedbackCount) * 100)
    : 100

  const verifiedAddressCount = feedbackList.filter(f => (f.houseAddress || f.houseNo)).length

  // Filtered Feedback
  const filteredFeedback = useMemo(() => {
    return feedbackList.filter(f => {
      // Rating filter
      if (feedbackRatingFilter === '5' && f.rating !== 5) return false
      if (feedbackRatingFilter === '4' && f.rating !== 4) return false
      if (feedbackRatingFilter === '3' && f.rating !== 3) return false
      if (feedbackRatingFilter === 'low' && f.rating > 2) return false

      // Search filter
      if (!feedbackSearch.trim()) return true
      const q = feedbackSearch.toLowerCase()
      return (
        f.name?.toLowerCase().includes(q) ||
        f.phone?.includes(q) ||
        f.houseAddress?.toLowerCase().includes(q) ||
        f.comment?.toLowerCase().includes(q) ||
        f.monthViewed?.toLowerCase().includes(q)
      )
    })
  }, [feedbackList, feedbackRatingFilter, feedbackSearch])

  // Clear Feedback
  const handleClearFeedback = async () => {
    if (!window.confirm('Are you sure you want to clear all resident feedback records? This cannot be undone.')) return
    try {
      const freshData = await clearFeedback()
      setData(freshData)
      if (showNotif) showNotif('All resident feedback records cleared', 'error')
    } catch (err) {
      if (showNotif) showNotif('Failed to clear feedback records', 'error')
    }
  }

  // Export Feedback CSV
  const exportFeedbackCSV = () => {
    const headers = ['Resident Name', 'Phone', 'House Address', 'Rating', 'Comment', 'Month Viewed', 'Date & Time', 'Device']
    const rows = feedbackList.map(f => [
      `"${f.name || 'Anonymous'}"`,
      `"${f.phone || ''}"`,
      `"${f.houseAddress || ''}"`,
      f.rating || 5,
      `"${(f.comment || '').replace(/"/g, '""')}"`,
      `"${f.monthViewed || ''}"`,
      `"${f.dateStr || ''}"`,
      `"${f.device || ''}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `resident_feedback_ratings_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // ─── Refresh Logs ─────────────────────────────────────────────
  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      const freshData = await loadData()
      setData(freshData)
      if (showNotif) showNotif('Analytics data refreshed successfully!')
    } catch (err) {
      if (showNotif) showNotif('Failed to refresh analytics', 'error')
    } finally {
      setIsRefreshing(false)
    }
  }

  // ─── Clear Logs ───────────────────────────────────────────────
  const handleClearLogs = async () => {
    if (!window.confirm('Are you sure you want to clear all visitor tracking logs? This cannot be undone.')) return
    try {
      const freshData = await clearVisitorLogs()
      setData(freshData)
      if (showNotif) showNotif('Visitor logs cleared', 'error')
    } catch (err) {
      if (showNotif) showNotif('Failed to clear logs', 'error')
    }
  }

  // ─── Mapped Contacts with Engagement Data ─────────────────────
  const mappedContacts = useMemo(() => {
    return contacts.map(contact => {
      const cleanPhone = normalizePhone(contact.phone)
      const matchingLogs = visitorLogs.filter(log => {
        const logPhone = normalizePhone(log.phone)
        const phoneMatch = cleanPhone && logPhone && (cleanPhone === logPhone)
        const nameMatch = log.name && contact.name && (log.name.toLowerCase().trim() === contact.name.toLowerCase().trim())
        return phoneMatch || nameMatch
      })

      const hasVisited = matchingLogs.length > 0
      const visitCount = matchingLogs.length
      const sortedLogs = [...matchingLogs].sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      const latestLog = sortedLogs[0] || null

      return {
        ...contact,
        group: contact.group || 'NTRG 2 Asad Hanzalla street',
        hasVisited,
        visitCount,
        latestLog,
        lastVisitedAt: latestLog ? latestLog.timestamp : null,
        lastVisitedDateStr: latestLog ? latestLog.dateStr : null,
        lastDevice: latestLog ? latestLog.device : null,
        lastMonthViewed: latestLog ? latestLog.monthViewed : null,
        history: sortedLogs
      }
    })
  }, [contacts, visitorLogs])

  // ─── Filtered Contacts ────────────────────────────────────────
  const filteredContacts = useMemo(() => {
    return mappedContacts.filter(c => {
      // Tab filter
      if (filterTab === 'visited' && !c.hasVisited) return false
      if (filterTab === 'unvisited' && c.hasVisited) return false

      // Group filter
      if (groupFilter !== 'all') {
        const cGroup = c.group || 'NTRG 2 Asad Hanzalla street'
        if (groupFilter === 'N.T.R.C Sector 7D/1' && !cGroup.includes('7D')) return false
        if (groupFilter === 'NTRG 2 Asad Hanzalla street' && cGroup.includes('7D')) return false
      }

      // Search filter
      if (!searchTerm.trim()) return true
      const q = searchTerm.toLowerCase()
      return (
        c.name?.toLowerCase().includes(q) ||
        c.phone?.includes(q) ||
        c.houseNo?.toLowerCase().includes(q) ||
        c.group?.toLowerCase().includes(q)
      )
    })
  }, [mappedContacts, filterTab, groupFilter, searchTerm])

  // ─── Analytics Summary KPI Computations ───────────────────────
  const totalVisits = visitorLogs.length
  const visitedCount = mappedContacts.filter(c => c.hasVisited).length
  const unvisitedCount = contacts.length - visitedCount
  const engagementRate = contacts.length > 0 ? Math.round((visitedCount / contacts.length) * 100) : 0

  const mobileVisits = visitorLogs.filter(l => l.device === 'Mobile').length
  const desktopVisits = visitorLogs.filter(l => l.device === 'Desktop').length

  const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000
  const activeLast24h = visitorLogs.filter(l => (l.timestamp || 0) >= oneDayAgo).length

  // WhatsApp Group Breakdown Metrics
  const sector7D1Contacts = mappedContacts.filter(c => (c.group || '').includes('7D'))
  const sector7D1Visited = sector7D1Contacts.filter(c => c.hasVisited).length
  const sector7D1Logs = visitorLogs.filter(l => (l.group || '').includes('7D')).length

  const hanzallaContacts = mappedContacts.filter(c => !(c.group || '').includes('7D'))
  const hanzallaVisited = hanzallaContacts.filter(c => c.hasVisited).length
  const hanzallaLogs = visitorLogs.filter(l => !(l.group || '').includes('7D')).length

  // Month frequency
  const monthCounts = useMemo(() => {
    const counts = {}
    visitorLogs.forEach(l => {
      if (l.monthViewed) {
        counts[l.monthViewed] = (counts[l.monthViewed] || 0) + 1
      }
    })
    return counts
  }, [visitorLogs])

  const mostViewedMonthEntry = Object.entries(monthCounts).sort((a, b) => b[1] - a[1])[0]
  const mostViewedMonth = mostViewedMonthEntry ? mostViewedMonthEntry[0] : 'None'
  const mostViewedMonthCount = mostViewedMonthEntry ? mostViewedMonthEntry[1] : 0

  // ─── One-Click WhatsApp Reminder for Unvisited Residents ──────
  const handleSendReminder = (contact) => {
    const cleanPhone = contact.phone.replace(/[^0-9]/g, '')
    const groupName = contact.group || 'NTRG 2 Asad Hanzalla street'
    const groupSlug = groupName.includes('7D') ? '7d1' : 'ntrg2'
    const trackedUrl = `https://monthly-expense-dashboard.vercel.app/view?u=${cleanPhone}&grp=${groupSlug}`
    
    let text = `السلام علیکم ${contact.name} صاحب!\n`
    text += `نارتھ ٹاؤن ریذیڈنٹس (${groupName}) کی انتظامیہ کی طرف سے سلام۔\n\n`
    text += `ماہانہ اخراجات، سیکیورٹی و سویپرز کی کلیکشن اور پانی کی سپلائی کا مکمل حساب کتاب آن لائن پورٹل پر اپ ڈیٹ کر دیا گیا ہے۔\n\n`
    text += `برائے مہربانی اپنا تفصیلی اسٹیٹمنٹ دیکھنے کے لیے نیچے دیے گئے لنک پر کلک فرمائیں:\n${trackedUrl}\n\n`
    text += `جزاکم اللہ خیراً،\nانتظامیہ کمیٹی نارتھ ٹاؤن ریذیڈنٹس`

    const encoded = encodeURIComponent(text)
    window.open(`https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`, '_blank')
  }

  // ─── Export CSV of Resident Engagement ────────────────────────
  const exportEngagementCSV = () => {
    const headers = ['Name', 'Phone', 'WhatsApp Group', 'House No', 'Tag', 'Status', 'Total Visits', 'Last Visited At', 'Last Device', 'Month Viewed']
    const rows = mappedContacts.map(c => [
      `"${c.name}"`,
      `"${c.phone}"`,
      `"${c.group || 'NTRG 2 Asad Hanzalla street'}"`,
      `"${c.houseNo || ''}"`,
      `"${c.tag || 'Resident'}"`,
      c.hasVisited ? 'Visited' : 'Not Visited',
      c.visitCount,
      `"${c.lastVisitedDateStr || 'Never'}"`,
      c.lastDevice || '',
      `"${c.lastMonthViewed || ''}"`
    ])

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `resident_visitor_analytics_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-8">
      {/* ─── Mode Switcher: Visitor Tracking vs. Resident Feedback & Ratings ─── */}
      <div className="flex items-center gap-2 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700 w-fit">
        <button
          onClick={() => setAnalyticsView('tracking')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
            analyticsView === 'tracking'
              ? 'bg-white dark:bg-slate-900 text-primary shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-primary'
          }`}
        >
          <Users size={16} />
          <span>Resident Visitor Tracking</span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            analyticsView === 'tracking' ? 'bg-primary/10 text-primary' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
          }`}>
            {visitorLogs.length}
          </span>
        </button>

        <button
          onClick={() => setAnalyticsView('feedback')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${
            analyticsView === 'feedback'
              ? 'bg-white dark:bg-slate-900 text-amber-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-amber-600'
          }`}
        >
          <Star size={16} className={analyticsView === 'feedback' ? 'fill-amber-400 text-amber-500' : ''} />
          <span>Resident Feedback &amp; Ratings</span>
          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
            analyticsView === 'feedback' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
          }`}>
            {totalFeedbackCount}
          </span>
        </button>
      </div>

      {analyticsView === 'tracking' ? (
        <>
          {/* ─── Top Header & Controls ─── */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="size-10 rounded-xl bg-primary text-white flex items-center justify-center shadow-md shadow-primary/20">
              <Eye size={20} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Resident Visitor Analytics
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Track which resident from which WhatsApp Group visited the Monthly Expense Dashboard.
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-primary' : ''} />
            Refresh Data
          </button>

          <button
            onClick={exportEngagementCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 hover:bg-slate-800 text-xs font-bold transition-all shadow-sm"
          >
            <Download size={14} />
            Export CSV
          </button>

          {visitorLogs.length > 0 && (
            <button
              onClick={handleClearLogs}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30 text-xs font-bold transition-all"
              title="Reset tracking history"
            >
              <Trash2 size={14} />
              Reset Logs
            </button>
          )}
        </div>
      </div>

      {/* ─── WhatsApp Group Comparison Cards ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Group 1: NTRG 2 Asad Hanzalla street */}
        <div className="bg-gradient-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/20 dark:to-slate-800 p-5 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
              <h4 className="text-sm font-extrabold text-emerald-950 dark:text-emerald-100">
                NTRG 2 Asad Hanzalla street
              </h4>
            </div>
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300">
              {hanzallaVisited} of {hanzallaContacts.length} residents visited • {hanzallaLogs} total group visits
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-emerald-700 dark:text-emerald-300">
              {hanzallaContacts.length > 0 ? Math.round((hanzallaVisited / hanzallaContacts.length) * 100) : 0}%
            </span>
            <span className="block text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              Engagement
            </span>
          </div>
        </div>

        {/* Group 2: N.T.R.C Sector 7D/1 */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/20 dark:to-slate-800 p-5 rounded-2xl border border-blue-200/80 dark:border-blue-800/50 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-blue-500 animate-pulse" />
              <h4 className="text-sm font-extrabold text-blue-950 dark:text-blue-100">
                N.T.R.C Sector 7D/1
              </h4>
            </div>
            <p className="text-xs text-blue-800/80 dark:text-blue-300">
              {sector7D1Visited} of {sector7D1Contacts.length} residents visited • {sector7D1Logs} total group visits
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-blue-700 dark:text-blue-300">
              {sector7D1Contacts.length > 0 ? Math.round((sector7D1Visited / sector7D1Contacts.length) * 100) : 0}%
            </span>
            <span className="block text-[10px] font-bold text-blue-600 uppercase tracking-wider">
              Engagement
            </span>
          </div>
        </div>
      </div>

      {/* ─── Summary KPI Cards ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Unique Residents Visited */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-primary/10 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Verified Residents</span>
            <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Users size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {visitedCount}
              </span>
              <span className="text-sm font-bold text-slate-400">
                / {contacts.length} Residents
              </span>
            </div>
            <p className="text-xs text-emerald-600 dark:text-emerald-400 font-bold mt-1">
              {engagementRate}% Community Engagement
            </p>
          </div>
          {/* Progress bar */}
          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, engagementRate)}%` }}
            />
          </div>
        </div>

        {/* KPI 2: Total Dashboard Visits */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-primary/10 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Visits</span>
            <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
              <Eye size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {totalVisits}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Total Impressions
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span className="flex items-center gap-1">
                <Smartphone size={12} className="text-emerald-500" /> {mobileVisits} Mobile
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Monitor size={12} className="text-blue-500" /> {desktopVisits} Desktop
              </span>
            </div>
          </div>
        </div>

        {/* KPI 3: Active in Last 24 Hours */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-primary/10 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active (24 Hours)</span>
            <div className="size-8 rounded-lg bg-amber-500/10 text-amber-600 flex items-center justify-center">
              <Clock size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-slate-900 dark:text-white">
                {activeLast24h}
              </span>
              <span className="text-xs font-semibold text-slate-400">
                Recent Readers
              </span>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
              {activeLast24h > 0 ? 'Live community readership active' : 'No reads in the last 24h'}
            </p>
          </div>
        </div>

        {/* KPI 4: Most Active Statement */}
        <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-primary/10 space-y-3">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Top Statement</span>
            <div className="size-8 rounded-lg bg-indigo-500/10 text-indigo-600 flex items-center justify-center">
              <Calendar size={18} />
            </div>
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-lg font-black text-slate-900 dark:text-white truncate">
                {mostViewedMonth}
              </span>
            </div>
            <p className="text-xs text-indigo-600 dark:text-indigo-400 font-bold mt-1">
              {mostViewedMonthCount} total sheet views
            </p>
          </div>
        </div>
      </div>

      {/* ─── Main Section: Resident Engagement Directory ─── */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
        {/* Table Header & Controls */}
        <div className="p-6 border-b border-slate-100 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              Resident Engagement Directory
              <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {filteredContacts.length}
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Mapped against WhatsApp groups (NTRC Sector 7D/1 &amp; NTRG 2 Asad Hanzalla street).
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
            {/* Group Filter Selector */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setGroupFilter('all')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  groupFilter === 'all'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-primary'
                }`}
              >
                All Groups
              </button>
              <button
                onClick={() => setGroupFilter('NTRG 2 Asad Hanzalla street')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  groupFilter === 'NTRG 2 Asad Hanzalla street'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                }`}
              >
                Asad Hanzalla
              </button>
              <button
                onClick={() => setGroupFilter('N.T.R.C Sector 7D/1')}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  groupFilter === 'N.T.R.C Sector 7D/1'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
                }`}
              >
                Sector 7D/1
              </button>
            </div>

            {/* Visit Status Filter Tabs */}
            <div className="flex items-center bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterTab === 'all'
                    ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-primary'
                }`}
              >
                All ({contacts.length})
              </button>
              <button
                onClick={() => setFilterTab('visited')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterTab === 'visited'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600'
                }`}
              >
                <CheckCircle2 size={12} /> Visited ({visitedCount})
              </button>
              <button
                onClick={() => setFilterTab('unvisited')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  filterTab === 'unvisited'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-slate-300 hover:text-amber-600'
                }`}
              >
                <AlertCircle size={12} /> Not Visited ({unvisitedCount})
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search resident, phone, group..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none w-full sm:w-56"
              />
            </div>
          </div>
        </div>

        {/* Directory Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-750 text-slate-500 uppercase font-extrabold tracking-wider border-b border-slate-100 dark:border-slate-700">
              <tr>
                <th className="p-4">Resident</th>
                <th className="p-4">WhatsApp Contact</th>
                <th className="p-4">WhatsApp Group</th>
                <th className="p-4">House #</th>
                <th className="p-4">Status &amp; Visits</th>
                <th className="p-4">Last Seen</th>
                <th className="p-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {filteredContacts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 italic">
                    No residents found matching the selected filter.
                  </td>
                </tr>
              ) : (
                filteredContacts.map(c => (
                  <tr key={c.id || c.phone} className="hover:bg-slate-50 dark:hover:bg-slate-750 transition-colors">
                    {/* Name & Avatar */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`size-8 rounded-full flex items-center justify-center font-bold text-xs text-white ${
                          c.hasVisited ? 'bg-emerald-600' : 'bg-slate-400'
                        }`}>
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-extrabold text-slate-800 dark:text-slate-100">{c.name}</p>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
                            c.tag === 'Committee' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300' : 'text-slate-400'
                          }`}>
                            {c.tag || 'Resident'}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* WhatsApp */}
                    <td className="p-4 font-mono font-medium">
                      <a
                        href={`https://wa.me/${c.phone.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 flex items-center gap-1 font-bold group"
                        title="Chat on WhatsApp"
                      >
                        {c.phone}
                        <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                    </td>

                    {/* WhatsApp Group */}
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black border ${
                        (c.group || '').includes('7D')
                          ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800'
                      }`}>
                        {(c.group || '').includes('7D') ? 'Sector 7D/1' : 'Asad Hanzalla'}
                      </span>
                    </td>

                    {/* House No */}
                    <td className="p-4 font-semibold text-slate-600 dark:text-slate-300">
                      {c.houseNo || '7D/1'}
                    </td>

                    {/* Engagement Status */}
                    <td className="p-4">
                      {c.hasVisited ? (
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                            <CheckCircle2 size={12} /> Visited ({c.visitCount}x)
                          </span>
                          {c.lastDevice && (
                            <span className="p-1 rounded bg-slate-100 dark:bg-slate-700 text-slate-500" title={`Last seen on ${c.lastDevice}`}>
                              {c.lastDevice === 'Mobile' ? <Smartphone size={12} /> : <Monitor size={12} />}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
                          <AlertCircle size={12} /> Not Visited Yet
                        </span>
                      )}
                    </td>

                    {/* Last Seen */}
                    <td className="p-4 text-slate-500">
                      {c.lastVisitedAt ? (
                        <div>
                          <p className="font-bold text-slate-700 dark:text-slate-300">
                            {timeAgo(c.lastVisitedAt)}
                          </p>
                          <p className="text-[10px] text-slate-400">
                            {c.lastVisitedDateStr}
                          </p>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Never</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="p-4 text-center">
                      {c.hasVisited ? (
                        <button
                          onClick={() => setSelectedContactHistory(c)}
                          className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-primary/10 hover:text-primary text-slate-700 dark:text-slate-200 text-xs font-bold transition-all"
                        >
                          View Logs
                        </button>
                      ) : (
                        <button
                          onClick={() => handleSendReminder(c)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-sm transition-all active:scale-98"
                          title="Send direct invitation link via WhatsApp"
                        >
                          <Send size={12} /> Send Reminder
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Live Recent Visits Activity Stream ─── */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/10 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Clock size={18} className="text-primary" /> Live Activity Stream
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Recent visits recorded in real time on the Monthly Expense Dashboard
            </p>
          </div>
          <span className="text-xs font-bold bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2.5 py-1 rounded-full">
            Last {Math.min(50, visitorLogs.length)} Visits
          </span>
        </div>

        {visitorLogs.length === 0 ? (
          <div className="p-8 text-center text-slate-400 italic bg-slate-50 dark:bg-slate-900/40 rounded-xl">
            No visitor events logged yet. Once residents open the dashboard (e.g. from WhatsApp), their visits will appear here!
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-700 max-h-96 overflow-y-auto pr-1">
            {visitorLogs.slice(0, 50).map((log, idx) => (
              <div key={log.id || idx} className="py-3 flex items-center justify-between gap-4 hover:bg-slate-50/60 dark:hover:bg-slate-750/40 px-2 rounded-xl transition-colors">
                <div className="flex items-center gap-3">
                  <div className="size-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {log.device === 'Mobile' ? <Smartphone size={14} /> : <Monitor size={14} />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-extrabold text-xs text-slate-800 dark:text-slate-100">
                        {log.name || 'Anonymous Resident'}
                      </span>
                      {log.group && (
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                          log.group.includes('7D')
                            ? 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300'
                            : 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                        }`}>
                          {log.group}
                        </span>
                      )}
                      {log.houseNo && (
                        <span className="text-[10px] text-slate-500 font-semibold">
                          ({log.houseNo})
                        </span>
                      )}
                      {log.monthViewed && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                          {log.monthViewed}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {log.phone || 'No phone recorded'} • {log.device}
                    </p>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {timeAgo(log.timestamp)}
                  </p>
                  <p className="text-[10px] text-slate-400">
                    {log.dateStr}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      </>
    ) : (
      <>
        {/* ─── Feedback Header & Controls ─── */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="size-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <Star size={20} className="fill-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                  Resident Feedback &amp; Ratings
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Reviews, ratings, household addresses, and comments submitted by community residents.
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-750 text-xs font-bold text-slate-700 dark:text-slate-200 transition-all shadow-sm"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-amber-500' : ''} />
              Refresh Data
            </button>

            <button
              onClick={exportFeedbackCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 text-white hover:bg-amber-600 text-xs font-bold transition-all shadow-sm"
            >
              <Download size={14} />
              Export Feedback CSV
            </button>

            {totalFeedbackCount > 0 && (
              <button
                onClick={handleClearFeedback}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900/50 dark:hover:bg-red-950/30 text-xs font-bold transition-all"
                title="Clear all feedback records"
              >
                <Trash2 size={14} />
                Clear Feedback
              </button>
            )}
          </div>
        </div>

        {/* ─── Feedback KPI Summary Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Overall Average Rating */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-primary/10 space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Average Rating</span>
              <div className="size-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center">
                <Star size={18} className="fill-amber-400" />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {avgRating}
                </span>
                <span className="text-sm font-bold text-slate-400">/ 5.0</span>
              </div>
              <div className="flex items-center gap-1 mt-1 text-amber-400">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={14}
                    className={star <= Math.round(Number(avgRating)) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}
                  />
                ))}
                <span className="text-xs font-semibold text-slate-500 ml-1">
                  ({totalFeedbackCount} reviews)
                </span>
              </div>
            </div>
          </div>

          {/* KPI 2: Total Feedback Submissions */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-primary/10 space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Reviews</span>
              <div className="size-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <MessageSquareHeart size={18} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {totalFeedbackCount}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  Submissions
                </span>
              </div>
              <p className="text-xs text-blue-600 dark:text-blue-400 font-bold mt-1">
                Community Resident Voice
              </p>
            </div>
          </div>

          {/* KPI 3: Positive Feedback Ratio */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-primary/10 space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Satisfaction Rate</span>
              <div className="size-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <ThumbsUp size={18} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {positivePercent}%
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  4★ &amp; 5★ Ratings
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{ width: `${positivePercent}%` }}
                />
              </div>
            </div>
          </div>

          {/* KPI 4: Verified House Addresses */}
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-primary/10 space-y-3">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Households Captured</span>
              <div className="size-8 rounded-lg bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Home size={18} />
              </div>
            </div>
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-slate-900 dark:text-white">
                  {verifiedAddressCount}
                </span>
                <span className="text-xs font-semibold text-slate-400">
                  House Addresses
                </span>
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 font-bold mt-1">
                Mapped to physical homes
              </p>
            </div>
          </div>
        </div>

        {/* ─── Rating Distribution Breakdown ─── */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-primary/10">
          <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
            <Star size={16} className="text-amber-500 fill-amber-400" />
            Rating Distribution Breakdown
          </h3>
          <div className="space-y-2.5">
            {[
              { stars: 5, label: '5 Stars (Outstanding)', count: fiveStarCount, color: 'bg-emerald-500' },
              { stars: 4, label: '4 Stars (Good)', count: fourStarCount, color: 'bg-blue-500' },
              { stars: 3, label: '3 Stars (Average)', count: threeStarCount, color: 'bg-amber-500' },
              { stars: 2, label: '2 Stars (Needs Work)', count: twoStarCount, color: 'bg-orange-500' },
              { stars: 1, label: '1 Star (Unsatisfactory)', count: oneStarCount, color: 'bg-red-500' }
            ].map(item => {
              const pct = totalFeedbackCount > 0 ? Math.round((item.count / totalFeedbackCount) * 100) : 0
              return (
                <div key={item.stars} className="flex items-center gap-3 text-xs">
                  <span className="w-36 font-bold text-slate-600 dark:text-slate-300">
                    {item.label}
                  </span>
                  <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <span className="w-16 text-right font-mono font-bold text-slate-500">
                    {item.count} ({pct}%)
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* ─── Resident Feedback Feed & Table ─── */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-primary/10 overflow-hidden">
          {/* Filter and Search Bar */}
          <div className="p-6 border-b border-slate-100 dark:border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Resident Reviews &amp; Suggestions
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-300">
                  {filteredFeedback.length}
                </span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Detailed ratings, comments, and household address information from community members.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
              {/* Rating Filter Tabs */}
              <div className="flex items-center bg-slate-100 dark:bg-slate-700/50 p-1 rounded-xl border border-slate-200 dark:border-slate-700">
                <button
                  onClick={() => setFeedbackRatingFilter('all')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    feedbackRatingFilter === 'all'
                      ? 'bg-white dark:bg-slate-800 text-primary shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-primary'
                  }`}
                >
                  All ({totalFeedbackCount})
                </button>
                <button
                  onClick={() => setFeedbackRatingFilter('5')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    feedbackRatingFilter === '5'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-amber-500'
                  }`}
                >
                  5★ ({fiveStarCount})
                </button>
                <button
                  onClick={() => setFeedbackRatingFilter('4')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    feedbackRatingFilter === '4'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-blue-600'
                  }`}
                >
                  4★ ({fourStarCount})
                </button>
                <button
                  onClick={() => setFeedbackRatingFilter('3')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    feedbackRatingFilter === '3'
                      ? 'bg-amber-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-amber-600'
                  }`}
                >
                  3★ ({threeStarCount})
                </button>
                <button
                  onClick={() => setFeedbackRatingFilter('low')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    feedbackRatingFilter === 'low'
                      ? 'bg-red-600 text-white shadow-sm'
                      : 'text-slate-600 dark:text-slate-300 hover:text-red-600'
                  }`}
                >
                  1-2★ ({twoStarCount + oneStarCount})
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search name, phone, address, comment..."
                  value={feedbackSearch}
                  onChange={(e) => setFeedbackSearch(e.target.value)}
                  className="pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:ring-2 focus:ring-primary outline-none w-full sm:w-60"
                />
              </div>
            </div>
          </div>

          {/* Feedback Content List */}
          <div className="p-6 divide-y divide-slate-100 dark:divide-slate-700/60">
            {filteredFeedback.length === 0 ? (
              <div className="text-center py-12 space-y-3">
                <div className="size-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                  <Star size={24} />
                </div>
                <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
                  No resident reviews found
                </p>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  {totalFeedbackCount === 0
                    ? 'Residents can rate the dashboard and provide comments directly from the Viewer Dashboard.'
                    : 'Try adjusting your search query or rating filter.'}
                </p>
              </div>
            ) : (
              filteredFeedback.map((f, idx) => {
                const cleanPhone = f.phone ? f.phone.replace(/[^0-9]/g, '') : ''
                return (
                  <div key={f.id || idx} className="py-5 first:pt-0 last:pb-0 space-y-3">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      {/* Resident Info & House Address */}
                      <div className="flex items-center gap-3">
                        <div className="size-10 rounded-full bg-amber-500/10 text-amber-600 flex items-center justify-center font-black text-sm">
                          {(f.name || 'R').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                              {f.name || 'Anonymous Resident'}
                            </h4>
                            {f.houseAddress && (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/50 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
                                <Home size={11} /> {f.houseAddress}
                              </span>
                            )}
                            {f.monthViewed && (
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                                {f.monthViewed}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-xs text-slate-500 mt-0.5">
                            {f.phone ? (
                              <a
                                href={`https://wa.me/${cleanPhone}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-emerald-600 hover:text-emerald-700 font-bold flex items-center gap-1 hover:underline"
                                title="Reply to resident on WhatsApp"
                              >
                                {f.phone}
                                <ExternalLink size={11} />
                              </a>
                            ) : (
                              <span className="italic text-slate-400">No phone provided</span>
                            )}
                            <span>•</span>
                            <span>{f.device || 'Desktop'}</span>
                          </div>
                        </div>
                      </div>

                      {/* Star Rating & Time */}
                      <div className="flex items-center gap-3 sm:text-right">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1 text-amber-400 justify-end">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                size={16}
                                className={star <= (f.rating || 5) ? 'fill-amber-400 text-amber-400' : 'text-slate-300 dark:text-slate-600'}
                              />
                            ))}
                            <span className="font-black text-xs text-slate-700 dark:text-slate-200 ml-1">
                              {f.rating || 5}/5
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400">
                            {timeAgo(f.timestamp)} • {f.dateStr}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Comment Box */}
                    {f.comment ? (
                      <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-750 text-xs text-slate-700 dark:text-slate-200 leading-relaxed font-medium">
                        &ldquo;{f.comment}&rdquo;
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">
                        No written comment provided with this star rating.
                      </p>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </>
    )}

      {/* ─── Resident History Modal ─── */}
      {selectedContactHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-700 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-100">
                  {selectedContactHistory.name}
                </h3>
                <p className="text-xs text-slate-500 font-mono">
                  {selectedContactHistory.phone} • {selectedContactHistory.group} • House {selectedContactHistory.houseNo || '7D/1'}
                </p>
              </div>
              <button
                onClick={() => setSelectedContactHistory(null)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-4 flex-1 overflow-y-auto space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Visit History ({selectedContactHistory.history.length} records)
              </h4>
              {selectedContactHistory.history.map((log, idx) => (
                <div key={log.id || idx} className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-750 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      Viewed {log.monthViewed || 'Dashboard'}
                    </span>
                    <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                      {log.device === 'Mobile' ? <Smartphone size={11} /> : <Monitor size={11} />}
                      {log.device} • {log.group || 'General'} • {log.dateStr}
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                    {timeAgo(log.timestamp)}
                  </span>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
              <button
                onClick={() => setSelectedContactHistory(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

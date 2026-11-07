// src/components/AdminReconciliationTable.jsx
import React, { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  CheckCircle2,
  Clock,
  XCircle,
  Search,
  ExternalLink,
  ShieldCheck,
  Eye,
  Filter,
  RefreshCw,
  PhoneCall,
  X,
  Lock
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { fetchCycleReceipts, updateReceiptStatus } from '../utils/receiptService'
import { getUrlParam, updateUrlParams } from '../utils/urlState'

export default function AdminReconciliationTable({
  currentMonth = 'September',
  currentYear = 2026,
  previousMonthRevenue = 282250,
  targetDues = 2500
}) {
  const { lang } = useLanguage ? useLanguage() : { lang: 'en' }
  const isUrdu = lang === 'ur'

  const [receipts, setReceipts] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState(() => {
    const param = getUrlParam('status')
    if (param && ['all', 'verified', 'pending', 'rejected'].includes(param)) return param
    return 'all'
  })

  const handleStatusFilterChange = (statusKey) => {
    setStatusFilter(statusKey)
    updateUrlParams({ status: statusKey === 'all' ? null : statusKey }, true)
  }

  useEffect(() => {
    const handlePopState = () => {
      const param = getUrlParam('status')
      if (param && ['all', 'verified', 'pending', 'rejected'].includes(param)) {
        setStatusFilter(param)
      } else {
        setStatusFilter('all')
      }
    }
    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])
  const [activeProof, setActiveProof] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState('')

  const cycleKey = `${currentYear}-${currentMonth}`

  const loadData = async () => {
    setLoading(true)
    try {
      const data = await fetchCycleReceipts(cycleKey)
      setReceipts(data)
    } catch (e) {
      console.error('Failed to load receipts:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
    const handleUpdate = () => loadData()
    window.addEventListener('receipt-updated', handleUpdate)
    return () => window.removeEventListener('receipt-updated', handleUpdate)
  }, [cycleKey])

  const handleStatusChange = async (receiptId, residentId, newStatus) => {
    try {
      setActionInProgress(receiptId)
      await updateReceiptStatus(receiptId, residentId, cycleKey, newStatus, 'Super Admin')
      setReceipts((prev) =>
        prev.map((r) => (r.id === receiptId ? { ...r, status: newStatus } : r))
      )
      if (activeProof && activeProof.id === receiptId) {
        setActiveProof(null)
      }
    } catch (e) {
      console.error('Failed to update receipt status:', e)
    } finally {
      setActionInProgress('')
    }
  }

  // ─── Financial Calculations ───
  const currentMonthVerifiedTotal = useMemo(() => {
    return receipts
      .filter((r) => r.status === 'verified' || r.status === 'paid')
      .reduce((sum, r) => sum + (Number(r.amountPaid) || 0), 0)
  }, [receipts])

  const pendingCount = useMemo(() => {
    return receipts.filter((r) => r.status === 'pending').length
  }, [receipts])

  const verifiedCount = useMemo(() => {
    return receipts.filter((r) => r.status === 'verified' || r.status === 'paid').length
  }, [receipts])

  const momDelta = previousMonthRevenue
    ? (((currentMonthVerifiedTotal - previousMonthRevenue) / previousMonthRevenue) * 100).toFixed(1)
    : 0

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const matchesSearch =
        r.residentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.houseNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.contactNumber?.includes(searchTerm) ||
        r.transactionRef?.toLowerCase().includes(searchTerm.toLowerCase())

      const matchesFilter =
        statusFilter === 'all'
          ? true
          : statusFilter === 'verified'
          ? (r.status === 'verified' || r.status === 'paid')
          : r.status === statusFilter
      return matchesSearch && matchesFilter
    })
  }, [receipts, searchTerm, statusFilter])

  return (
    <div className="w-full my-8 space-y-6">
      {/* ─── 1. Executive Summary Cards (MoM Comparison) ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Verified Collections This Month */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            {isUrdu ? 'موجودہ ماہ کی وصولیاں' : 'CURRENT MONTH COLLECTED'} ({currentMonth} {currentYear})
          </span>
          <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-1">
            PKR {currentMonthVerifiedTotal.toLocaleString('en-PK')}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
              {verifiedCount} {isUrdu ? 'ادائیگی شدہ رہائشی' : 'Paid Residents'}
            </span>
            <span
              className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                Number(momDelta) >= 0
                  ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300'
                  : 'bg-rose-500/15 text-rose-700 dark:text-rose-300'
              }`}
            >
              {Number(momDelta) >= 0 ? `+${momDelta}%` : `${momDelta}%`} vs last mo
            </span>
          </div>
        </div>

        {/* Previous Month Benchmark */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            {isUrdu ? 'گزشتہ ماہ کی کل وصولی' : 'PREVIOUS MONTH REVENUE'}
          </span>
          <div className="text-2xl font-black font-mono text-slate-800 dark:text-slate-100 mt-1">
            PKR {previousMonthRevenue.toLocaleString('en-PK')}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {isUrdu ? 'آڈٹ شدہ بنیادی ریکارڈ' : 'Audited Baseline Record'}
          </span>
        </div>

        {/* Pending Approvals */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block">
              {isUrdu ? 'زیر التواء تصدیق' : 'PENDING RECONCILIATION'}
            </span>
            <button
              onClick={loadData}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
            {pendingCount} {isUrdu ? 'رسیدیں' : 'Receipts'}
          </div>
          <span className="text-xs text-slate-400 mt-1 block">
            {isUrdu ? 'معائنے اور منظوری کے منتظر' : 'Awaiting payment slip inspection'}
          </span>
        </div>
      </div>

      {/* ─── 2. Search & Filter Bar ─── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={isUrdu ? 'مکان نمبر، نام، فون یا TID سے تلاش کریں...' : 'Search house, resident, phone, TID...'}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-bold outline-none focus:border-primary shadow-xs"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { key: 'all', en: 'All Receipts', ur: 'تمام رسیدیں' },
            { key: 'pending', en: 'Pending', ur: 'زیر التواء' },
            { key: 'verified', en: 'Paid Residents', ur: 'ادائیگی شدہ رہائشی' },
            { key: 'rejected', en: 'Rejected', ur: 'مسترد شدہ' }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => handleStatusFilterChange(tab.key)}
              className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all whitespace-nowrap cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
            >
              {isUrdu ? tab.ur : tab.en}
            </button>
          ))}
        </div>
      </div>

      {/* ─── 3. Resident Ledger Table ─── */}
      <div className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-400 uppercase font-black text-[10px]">
              <tr>
                <th className="p-4">{isUrdu ? 'مکان / فلیٹ نمبر' : 'House / Unit'}</th>
                <th className="p-4">{isUrdu ? 'رہائشی کا نام و رابطہ' : 'Resident & Contact'}</th>
                <th className="p-4">{isUrdu ? 'رقم (روپے)' : 'Amount (PKR)'}</th>
                <th className="p-4">{isUrdu ? 'حیثیت' : 'Status'}</th>
                <th className="p-4">{isUrdu ? 'ادائیگی ثبوت' : 'Proof'}</th>
                <th className="p-4 text-right">{isUrdu ? 'انتظامی کارروائی' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredReceipts.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-slate-400 font-bold">
                    {loading
                      ? (isUrdu ? 'رسیدیں لوڈ ہو رہی ہیں...' : 'Loading receipts...')
                      : (isUrdu ? 'اس بلنگ سائیکل کے لیے کوئی رسید نہیں ملی۔' : 'No receipts found for this billing cycle.')}
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Unit Monospace */}
                    <td className="p-4 font-black font-mono text-slate-900 dark:text-white whitespace-nowrap">
                      {row.houseNumber}
                    </td>

                    {/* Resident Info & Contact */}
                    <td className="p-4">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {row.residentName}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="font-mono text-slate-400 text-[11px]">
                          {row.contactNumber}
                        </span>
                        {row.contactNumber && (
                          <a
                            href={`https://wa.me/${row.contactNumber.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-500 hover:text-emerald-600"
                            title="Chat on WhatsApp"
                          >
                            <PhoneCall size={11} />
                          </a>
                        )}
                      </div>
                    </td>

                    {/* Paid Amount */}
                    <td className="p-4 font-mono font-black text-slate-900 dark:text-white whitespace-nowrap">
                      PKR {Number(row.amountPaid || 0).toLocaleString('en-PK')}
                    </td>

                    {/* Status Badge */}
                    <td className="p-4 whitespace-nowrap">
                      {(row.status === 'verified' || row.status === 'paid') && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300 font-black text-[11px] border border-emerald-300/50">
                          <CheckCircle2 size={12} /> {isUrdu ? 'ادائیگی شدہ رہائشی' : 'Paid Resident'}
                        </span>
                      )}
                      {row.status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300 font-black text-[11px] border border-amber-300/50">
                          <Clock size={12} /> {isUrdu ? 'زیر التواء منظوری' : 'Pending Approval'}
                        </span>
                      )}
                      {row.status === 'rejected' && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300 font-black text-[11px] border border-rose-300/50">
                          <XCircle size={12} /> {isUrdu ? 'مسترد شدہ' : 'Rejected'}
                        </span>
                      )}
                    </td>

                    {/* Slip Preview Button */}
                    <td className="p-4 whitespace-nowrap">
                      {row.receiptUrl ? (
                        <button
                          type="button"
                          onClick={() => setActiveProof(row)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold transition cursor-pointer"
                        >
                          <Eye size={12} />
                          <span>{isUrdu ? 'رسید دیکھیں' : 'View Slip'}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">No file</span>
                      )}
                    </td>

                    {/* Quick Approve / Reject Actions - Locked when Approved */}
                    <td className="p-4 text-right whitespace-nowrap">
                      {row.status === 'verified' || row.status === 'paid' ? (
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold text-[11px] border border-slate-200 dark:border-slate-700/80 shadow-2xs select-none">
                          <Lock size={12} className="text-emerald-600 dark:text-emerald-400" />
                          <span>{isUrdu ? 'منظور شدہ (لاک)' : 'Locked & Approved'}</span>
                        </span>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          {row.status === 'pending' && (
                            <button
                              type="button"
                              disabled={actionInProgress === row.id}
                              onClick={() => handleStatusChange(row.id, row.residentId, 'verified')}
                              className="px-3 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-[11px] transition shadow-xs cursor-pointer"
                            >
                              {isUrdu ? 'منظور کریں' : 'Approve'}
                            </button>
                          )}
                          {row.status !== 'rejected' && (
                            <button
                              type="button"
                              disabled={actionInProgress === row.id}
                              onClick={() => handleStatusChange(row.id, row.residentId, 'rejected')}
                              className="px-3 py-1 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-black text-[11px] transition shadow-xs cursor-pointer"
                            >
                              {isUrdu ? 'مسترد کریں' : 'Reject'}
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 4. Image Inspection Lightbox ─── */}
      <AnimatePresence>
        {activeProof && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 p-5 space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h4 className="font-black text-sm text-slate-900 dark:text-white">
                    {activeProof.residentName} ({activeProof.houseNumber})
                  </h4>
                  <span className="text-[11px] font-mono text-slate-400">
                    ID: {activeProof.id}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveProof(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Slip Asset */}
              <div className="max-h-80 overflow-auto rounded-2xl bg-slate-100 dark:bg-slate-950 flex items-center justify-center p-2 border border-slate-200 dark:border-slate-800">
                <img
                  src={activeProof.receiptUrl}
                  alt="Payment Slip Proof"
                  className="max-h-72 w-full object-contain rounded-lg"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-mono font-bold px-1">
                <span className="text-slate-500">
                  TID: <strong className="text-slate-900 dark:text-white">{activeProof.transactionRef || 'N/A'}</strong>
                </span>
                <span className="text-emerald-600 dark:text-emerald-400 font-black">
                  PKR {Number(activeProof.amountPaid || 0).toLocaleString()}
                </span>
              </div>

              {/* Modal Action Footer - Locked when Approved */}
              {activeProof.status === 'verified' || activeProof.status === 'paid' ? (
                <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-black text-xs border border-emerald-300/60">
                    <Lock size={13} className="text-emerald-600 dark:text-emerald-400" />
                    <span>{isUrdu ? 'منظور شدہ اور مقفل' : 'Locked & Approved'}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveProof(null)}
                    className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs transition cursor-pointer"
                  >
                    {isUrdu ? 'بند کریں' : 'Close'}
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(activeProof.id, activeProof.residentId, 'verified')
                    }
                    className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition cursor-pointer"
                  >
                    {isUrdu ? 'بطور ادا شدہ منظور کریں' : 'Approve as Paid'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleStatusChange(activeProof.id, activeProof.residentId, 'rejected')
                    }
                    className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md transition cursor-pointer"
                  >
                    {isUrdu ? 'رسید مسترد کریں' : 'Reject Proof'}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

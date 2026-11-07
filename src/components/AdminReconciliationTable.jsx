// src/components/AdminReconciliationTable.jsx
import React, { useState, useEffect, useMemo, useRef } from 'react'
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
  Lock,
  Pencil,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Home,
  User,
  Save,
  Maximize2,
  RotateCcw,
  Sparkles
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import {
  fetchCycleReceipts,
  updateReceiptStatus,
  updatePaymentReceipt,
  deletePaymentReceipt
} from '../utils/receiptService'
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

  // View Slip & Zoom Lightbox state
  const [activeProof, setActiveProof] = useState(null)
  const [zoomScale, setZoomScale] = useState(1)
  const [rotation, setRotation] = useState(0)

  // Edit Receipt Modal state
  const [editingReceipt, setEditingReceipt] = useState(null)
  const [editForm, setEditForm] = useState({
    residentName: '',
    houseNumber: '',
    contactNumber: '',
    amountPaid: '',
    transactionRef: '',
    status: 'verified'
  })
  const [isSavingEdit, setIsSavingEdit] = useState(false)

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
        setActiveProof((prev) => ({ ...prev, status: newStatus }))
      }
    } catch (e) {
      console.error('Failed to update receipt status:', e)
    } finally {
      setActionInProgress('')
    }
  }

  // ─── Edit Receipt Handler ───
  const handleStartEdit = (row) => {
    setEditingReceipt(row)
    setEditForm({
      residentName: row.residentName || '',
      houseNumber: row.houseNumber || '',
      contactNumber: row.contactNumber || '',
      amountPaid: row.amountPaid || 1700,
      transactionRef: row.transactionRef || '',
      status: row.status || 'verified'
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingReceipt) return
    try {
      setIsSavingEdit(true)
      const updatedFields = {
        residentName: editForm.residentName.trim(),
        houseNumber: editForm.houseNumber.trim(),
        contactNumber: editForm.contactNumber.trim(),
        amountPaid: Number(editForm.amountPaid),
        transactionRef: editForm.transactionRef.trim(),
        status: editForm.status
      }

      await updatePaymentReceipt(
        editingReceipt.id,
        editingReceipt.residentId,
        cycleKey,
        updatedFields
      )

      setReceipts((prev) =>
        prev.map((r) => (r.id === editingReceipt.id ? { ...r, ...updatedFields } : r))
      )

      if (activeProof && activeProof.id === editingReceipt.id) {
        setActiveProof((prev) => ({ ...prev, ...updatedFields }))
      }

      setEditingReceipt(null)
    } catch (err) {
      console.error('Failed to save receipt edit:', err)
      alert('Failed to update receipt: ' + err.message)
    } finally {
      setIsSavingEdit(false)
    }
  }

  // ─── Delete Receipt Handler ───
  const handleDeleteReceipt = async (row) => {
    const promptMsg = isUrdu
      ? `کیا آپ واقعی ${row.residentName || 'اس رہائشی'} (${row.houseNumber || 'مکان'}) کی رسید ڈیلیٹ کرنا چاہتے ہیں؟\n\nاس سے ریکارڈ مستقل طور پر حذف ہو جائے گا اور رہائشی دوبارہ رسید جمع کر سکے گا۔`
      : `Are you sure you want to permanently delete the receipt entry for ${row.residentName || 'this resident'} (${row.houseNumber || 'House N/A'})?\n\nThis will remove the payment proof from the ledger and unlock the resident to re-upload if needed.`

    if (!window.confirm(promptMsg)) return

    try {
      setActionInProgress(row.id)
      await deletePaymentReceipt(row.id, row.residentId, cycleKey)
      setReceipts((prev) => prev.filter((r) => r.id !== row.id))
      if (activeProof && activeProof.id === row.id) {
        setActiveProof(null)
      }
    } catch (err) {
      console.error('Failed to delete receipt:', err)
      alert('Failed to delete receipt: ' + err.message)
    } finally {
      setActionInProgress('')
    }
  }

  // ─── Zoom Controls ───
  const handleZoomIn = () => setZoomScale((prev) => Math.min(Number((prev + 0.3).toFixed(2)), 3.5))
  const handleZoomOut = () => setZoomScale((prev) => Math.max(Number((prev - 0.3).toFixed(2)), 0.6))
  const handleResetZoom = () => {
    setZoomScale(1)
    setRotation(0)
  }
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360)

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
              className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded font-mono ${
                Number(momDelta) >= 0
                  ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-400'
                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
              }`}
            >
              {Number(momDelta) >= 0 ? `+${momDelta}%` : `${momDelta}%`} vs last mo
            </span>
          </div>
        </div>

        {/* Previous Month Reference */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
            {isUrdu ? 'گزشتہ ماہ کی آمدن' : 'PREVIOUS MONTH REVENUE'}
          </span>
          <div className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-1">
            PKR {previousMonthRevenue.toLocaleString('en-PK')}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isUrdu ? 'آڈٹ شدہ بنیادی ریکارڈ' : 'Audited Baseline Record'}
          </p>
        </div>

        {/* Pending Approval / Unverified */}
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-500 block">
              {isUrdu ? 'زیر التواء توثیق' : 'PENDING RECONCILIATION'}
            </span>
            <button
              onClick={loadData}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title="Refresh Receipts"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 dark:text-amber-400 mt-1">
            {pendingCount} {isUrdu ? 'رسیدیں' : 'Receipts'}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {isUrdu ? 'ادائیگی سلپ کی جانچ کا انتظار' : 'Awaiting payment slip inspection'}
          </p>
        </div>
      </div>

      {/* ─── 2. Search & Status Filter Strip ─── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={
              isUrdu
                ? 'مکان، رہائشی، فون، TID سے تلاش کریں...'
                : 'Search house, resident, phone, TID...'
            }
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs font-bold rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 outline-none focus:border-emerald-500 transition shadow-2xs text-slate-800 dark:text-slate-100"
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
                      ? isUrdu
                        ? 'رسیدیں لوڈ ہو رہی ہیں...'
                        : 'Loading receipts...'
                      : isUrdu
                      ? 'اس بلنگ سائیکل کے لیے کوئی رسید نہیں ملی۔'
                      : 'No receipts found for this billing cycle.'}
                  </td>
                </tr>
              ) : (
                filteredReceipts.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    {/* Unit & House Number */}
                    <td className="p-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Home size={14} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
                        <span className="font-black font-mono text-slate-900 dark:text-white text-xs">
                          {row.houseNumber || 'House # N/A'}
                        </span>
                      </div>
                      {(!row.houseNumber || row.houseNumber === 'Sector 7D/1') && (
                        <span className="text-[10px] text-amber-500 font-semibold block mt-0.5">
                          {isUrdu ? 'مکان نمبر درج نہیں' : 'Unit not specified'}
                        </span>
                      )}
                    </td>

                    {/* Resident Info & Contact */}
                    <td className="p-4">
                      <div className="flex items-center gap-1.5">
                        <User size={14} className="text-primary shrink-0" />
                        <span className="font-extrabold text-slate-900 dark:text-slate-100 text-xs">
                          {row.residentName || 'Community Resident'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
                          {row.contactNumber || 'No phone'}
                        </span>
                        {row.contactNumber && (
                          <a
                            href={`https://wa.me/${row.contactNumber.replace(/[^0-9]/g, '')}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-500 hover:text-emerald-600 transition-colors"
                            title="WhatsApp Resident"
                          >
                            <PhoneCall size={12} />
                          </a>
                        )}
                        {row.transactionRef && (
                          <span className="text-[10px] font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                            TID: {row.transactionRef}
                          </span>
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
                          onClick={() => {
                            setZoomScale(1)
                            setRotation(0)
                            setActiveProof(row)
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 hover:text-emerald-600 dark:hover:text-emerald-400 text-slate-700 dark:text-slate-200 font-bold transition cursor-pointer border border-slate-200/80 dark:border-slate-700 shadow-2xs"
                        >
                          <Eye size={13} />
                          <span>{isUrdu ? 'رسید دیکھیں (زوم)' : 'View Slip'}</span>
                        </button>
                      ) : (
                        <span className="text-slate-400 italic">No file</span>
                      )}
                    </td>

                    {/* Quick Approve & Edit & Delete Actions */}
                    <td className="p-4 text-right whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        {row.status === 'verified' || row.status === 'paid' ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-bold text-[10px] border border-emerald-300/60 shadow-2xs select-none">
                            <Lock size={11} className="text-emerald-600 dark:text-emerald-400" />
                            <span>{isUrdu ? 'منظور شدہ (لاک)' : 'Approved'}</span>
                          </span>
                        ) : (
                          <button
                            type="button"
                            disabled={actionInProgress === row.id}
                            onClick={() => handleStatusChange(row.id, row.residentId, 'verified')}
                            className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold text-[11px] transition shadow-xs cursor-pointer"
                          >
                            {isUrdu ? 'منظور کریں' : 'Approve'}
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          type="button"
                          onClick={() => handleStartEdit(row)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-primary hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition cursor-pointer border border-transparent hover:border-slate-200 dark:hover:border-slate-700"
                          title={isUrdu ? 'تفصیلات تبدیل کریں' : 'Edit Resident / Receipt Details'}
                          aria-label="Edit Entry"
                        >
                          <Pencil size={13} />
                        </button>

                        {/* Delete Button */}
                        <button
                          type="button"
                          disabled={actionInProgress === row.id}
                          onClick={() => handleDeleteReceipt(row)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer border border-transparent hover:border-rose-200"
                          title={isUrdu ? 'رسید ڈیلیٹ کریں' : 'Delete Receipt Entry'}
                          aria-label="Delete Entry"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── 4. High-Resolution Zoom-In Slip Lightbox ─── */}
      <AnimatePresence>
        {activeProof && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col my-auto max-h-[92vh]"
            >
              {/* Modal Top Bar: Resident Name, House # & Zoom Controls */}
              <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 dark:bg-slate-850">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="size-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/70 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <ShieldCheck size={20} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="font-black text-base text-slate-900 dark:text-white truncate">
                        {activeProof.residentName || 'Resident'}
                      </h4>
                      <span className="inline-flex items-center gap-1 font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                        <Home size={11} className="text-emerald-500" />
                        {activeProof.houseNumber || 'House # N/A'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400 block truncate">
                      ID: {activeProof.id} • {cycleKey}
                    </span>
                  </div>
                </div>

                {/* Interactive Zoom & Rotate Toolbar */}
                <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800 p-1 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xs">
                  <button
                    type="button"
                    onClick={handleZoomOut}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut size={16} />
                  </button>
                  <span className="text-xs font-mono font-black px-1.5 text-slate-700 dark:text-slate-300 min-w-[48px] text-center select-none">
                    {Math.round(zoomScale * 100)}%
                  </span>
                  <button
                    type="button"
                    onClick={handleZoomIn}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn size={16} />
                  </button>
                  <div className="w-px h-4 bg-slate-200 dark:bg-slate-700 mx-0.5" />
                  <button
                    type="button"
                    onClick={handleResetZoom}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                    title="Reset Zoom & Rotation"
                  >
                    <RotateCcw size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={handleRotate}
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                    title="Rotate 90°"
                  >
                    <RotateCw size={15} />
                  </button>
                  <a
                    href={activeProof.receiptUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition cursor-pointer"
                    title="Open Original Image in New Tab"
                  >
                    <ExternalLink size={15} />
                  </a>
                  <button
                    type="button"
                    onClick={() => setActiveProof(null)}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer ml-1"
                    title="Close"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>

              {/* Main Slip Canvas (Scrollable, Pan-able, Zoomable) */}
              <div className="relative flex-1 min-h-[320px] max-h-[58vh] sm:max-h-[64vh] overflow-auto bg-slate-950 p-4 flex items-center justify-center select-none">
                <div
                  className="transition-transform duration-200 ease-out origin-center flex items-center justify-center"
                  style={{
                    transform: `scale(${zoomScale}) rotate(${rotation}deg)`
                  }}
                  onDoubleClick={() => (zoomScale === 1 ? setZoomScale(2) : setZoomScale(1))}
                  title="Double click to toggle 2x zoom"
                >
                  <img
                    src={activeProof.receiptUrl}
                    alt="Payment Slip Proof"
                    className="max-w-full max-h-[52vh] sm:max-h-[60vh] object-contain rounded-xl shadow-2xl"
                  />
                </div>
              </div>

              {/* Bottom Inspection Card & Management Controls */}
              <div className="p-4 sm:p-5 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Resident Name</span>
                    <span className="font-extrabold text-slate-900 dark:text-white truncate block mt-0.5">
                      {activeProof.residentName || 'N/A'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">House / Unit</span>
                    <span className="font-black font-mono text-slate-900 dark:text-white truncate block mt-0.5">
                      {activeProof.houseNumber || 'N/A'}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Amount Settled</span>
                    <span className="font-black font-mono text-emerald-600 dark:text-emerald-400 truncate block mt-0.5">
                      PKR {Number(activeProof.amountPaid || 0).toLocaleString()}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">Transaction TID</span>
                    <span className="font-mono font-bold text-slate-700 dark:text-slate-300 truncate block mt-0.5">
                      {activeProof.transactionRef || 'N/A'}
                    </span>
                  </div>
                </div>

                {/* Actions: Edit, Delete, Status Toggle */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    {/* Edit Entry Button */}
                    <button
                      type="button"
                      onClick={() => handleStartEdit(activeProof)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition cursor-pointer border border-slate-200 dark:border-slate-700"
                    >
                      <Pencil size={13} />
                      <span>{isUrdu ? 'تفصیلات ایڈٹ کریں' : 'Edit Entry'}</span>
                    </button>

                    {/* Delete Entry Button */}
                    <button
                      type="button"
                      onClick={() => handleDeleteReceipt(activeProof)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 text-rose-600 dark:text-rose-300 font-bold text-xs transition cursor-pointer border border-rose-200 dark:border-rose-900/50"
                    >
                      <Trash2 size={13} />
                      <span>{isUrdu ? 'رسید ڈیلیٹ کریں' : 'Delete Entry'}</span>
                    </button>

                    {activeProof.contactNumber && (
                      <a
                        href={`https://wa.me/${activeProof.contactNumber.replace(/[^0-9]/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 font-bold text-xs border border-emerald-200 dark:border-emerald-800/50"
                      >
                        <PhoneCall size={13} />
                        <span>WhatsApp</span>
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {activeProof.status !== 'verified' && activeProof.status !== 'paid' && (
                      <button
                        type="button"
                        onClick={() =>
                          handleStatusChange(activeProof.id, activeProof.residentId, 'verified')
                        }
                        className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md transition cursor-pointer"
                      >
                        {isUrdu ? 'منظور کریں' : 'Approve as Paid'}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveProof(null)}
                      className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-bold text-xs transition cursor-pointer"
                    >
                      {isUrdu ? 'بند کریں' : 'Close'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 5. Super Admin Edit Receipt Modal ─── */}
      <AnimatePresence>
        {editingReceipt && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-4 my-auto"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <div className="size-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                    <Pencil size={16} />
                  </div>
                  <div>
                    <h4 className="font-black text-base text-slate-900 dark:text-white">
                      {isUrdu ? 'رسید کی تفصیلات تبدیل کریں' : 'Edit Receipt Details'}
                    </h4>
                    <p className="text-[11px] text-slate-400">ID: {editingReceipt.id}</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setEditingReceipt(null)}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3.5">
                {/* Resident Name */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                    {isUrdu ? 'رہائشی کا نام' : 'Resident Name *'}
                  </label>
                  <input
                    type="text"
                    value={editForm.residentName}
                    onChange={(e) => setEditForm({ ...editForm, residentName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold outline-none focus:border-emerald-500 transition"
                    required
                  />
                </div>

                {/* House / Flat Number */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                    {isUrdu ? 'مکان / فلیٹ نمبر' : 'House / Flat # (Required) *'}
                  </label>
                  <input
                    type="text"
                    value={editForm.houseNumber}
                    onChange={(e) => setEditForm({ ...editForm, houseNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold font-mono outline-none focus:border-emerald-500 transition"
                    required
                  />
                </div>

                {/* Contact / Phone */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                    {isUrdu ? 'رابطہ نمبر / واٹس ایپ' : 'Contact / WhatsApp #'}
                  </label>
                  <input
                    type="tel"
                    value={editForm.contactNumber}
                    onChange={(e) => setEditForm({ ...editForm, contactNumber: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold font-mono outline-none focus:border-emerald-500 transition"
                  />
                </div>

                {/* Amount Paid & TID */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                      {isUrdu ? 'رقم (روپے)' : 'Amount (PKR) *'}
                    </label>
                    <input
                      type="number"
                      value={editForm.amountPaid}
                      onChange={(e) => setEditForm({ ...editForm, amountPaid: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono font-bold outline-none focus:border-emerald-500 transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                      {isUrdu ? 'ٹرانزیکشن TID' : 'Transaction TID'}
                    </label>
                    <input
                      type="text"
                      value={editForm.transactionRef}
                      onChange={(e) => setEditForm({ ...editForm, transactionRef: e.target.value })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-mono outline-none focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                {/* Status Selector */}
                <div>
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block mb-1">
                    {isUrdu ? 'حیثیت' : 'Status'}
                  </label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold outline-none focus:border-emerald-500 transition cursor-pointer"
                  >
                    <option value="verified">Verified / Paid Resident</option>
                    <option value="pending">Pending Approval</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    onClick={() => setEditingReceipt(null)}
                    className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer"
                  >
                    {isUrdu ? 'منسوخ' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSavingEdit}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-xs shadow-md transition cursor-pointer"
                  >
                    <Save size={14} />
                    <span>{isSavingEdit ? (isUrdu ? 'محفوظ ہو رہا ہے...' : 'Saving...') : (isUrdu ? 'تبدیلیاں محفوظ کریں' : 'Save Changes')}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

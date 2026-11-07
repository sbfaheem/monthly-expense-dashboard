// src/components/ReceiptUploadModal.jsx
import React, { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  Loader2,
  Check,
  Home,
  User,
  ShieldCheck,
  Lock
} from 'lucide-react'
import {
  uploadReceiptFile,
  submitPaymentReceipt,
  checkResidentApprovedReceipt
} from '../utils/receiptService'
import { scanReceiptForDetails } from '../utils/receiptOcrService'

export default function ReceiptUploadModal({
  isOpen,
  onClose,
  currentUser = {
    id: 'res-7d-42',
    name: 'Syed Bilal Faheem',
    houseNumber: 'House 42, Sector 7D/1',
    phoneNumber: '0346-2650446'
  },
  currentMonth = 'October',
  currentYear = 2026,
  standardDues = 1700,
  paymentChannel = 'easypaisa',
  onSuccess
}) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [houseNumber, setHouseNumber] = useState('')
  const [residentName, setResidentName] = useState('')
  const [amount, setAmount] = useState(standardDues)
  const [transactionRef, setTransactionRef] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState(null)
  const [error, setError] = useState('')
  const [isScanningOcr, setIsScanningOcr] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrDetected, setOcrDetected] = useState(null)
  const [alreadyApprovedData, setAlreadyApprovedData] = useState(null)
  const [isCheckingApproval, setIsCheckingApproval] = useState(true)

  const fileInputRef = useRef(null)
  const cycleKey = `${currentYear}-${currentMonth}`

  // Prefill resident identity & house number when opening modal
  useEffect(() => {
    if (currentUser) {
      if (currentUser.name && currentUser.name !== 'Community Resident' && currentUser.name !== 'Resident') {
        setResidentName(currentUser.name)
      } else {
        setResidentName('')
      }

      if (
        currentUser.houseNumber &&
        currentUser.houseNumber !== 'Sector 7D/1' &&
        !currentUser.houseNumber.includes('res_identified')
      ) {
        setHouseNumber(currentUser.houseNumber)
      } else {
        setHouseNumber('')
      }
    }
  }, [currentUser])

  // Check if resident already uploaded and is approved for this billing cycle
  useEffect(() => {
    let isMounted = true
    const verifyApprovedStatus = async () => {
      setIsCheckingApproval(true)

      // 1. Check local storage cache
      try {
        if (typeof window !== 'undefined') {
          const local = localStorage.getItem(`receipt_approved_${cycleKey}`)
          if (local) {
            const parsed = JSON.parse(local)
            if (parsed && (parsed.status === 'verified' || parsed.status === 'paid')) {
              if (isMounted) {
                setAlreadyApprovedData(parsed)
                setIsCheckingApproval(false)
              }
              return
            }
          }
        }
      } catch (_) {}

      // 2. Check remote Firestore records
      try {
        const approved = await checkResidentApprovedReceipt(
          currentUser?.id,
          currentUser?.houseNumber,
          cycleKey
        )
        if (isMounted && approved && (approved.status === 'verified' || approved.status === 'paid')) {
          setAlreadyApprovedData(approved)
        }
      } catch (err) {
        console.warn('Approval check note:', err)
      } finally {
        if (isMounted) setIsCheckingApproval(false)
      }
    }

    if (isOpen) {
      verifyApprovedStatus()
    }

    return () => {
      isMounted = false
    }
  }, [isOpen, cycleKey, currentUser])

  if (!isOpen) return null

  const handleFileChange = async (e) => {
    const selected = e.target.files[0]
    if (!selected) return

    if (selected.size > 8 * 1024 * 1024) {
      setError('File size exceeds 8MB limit.')
      return
    }

    setError('')
    setFile(selected)
    setOcrDetected(null)

    if (selected.type.startsWith('image/')) {
      const objUrl = URL.createObjectURL(selected)
      setPreviewUrl(objUrl)

      // Automatically scan receipt using browser OCR
      try {
        setIsScanningOcr(true)
        setOcrProgress(15)

        const result = await scanReceiptForDetails(selected, (p) => setOcrProgress(p))

        const detected = {}

        if (result.amount) {
          setAmount(result.amount)
          detected.amount = result.amount
        }
        if (result.transactionRef) {
          setTransactionRef(result.transactionRef)
          detected.tid = result.transactionRef
        }
        if (result.residentName) {
          setResidentName(result.residentName)
          detected.name = result.residentName
        }

        if (Object.keys(detected).length > 0) {
          setOcrDetected(detected)
        }
      } catch (err) {
        console.warn('OCR Auto-fetch note:', err)
      } finally {
        setIsScanningOcr(false)
      }
    } else {
      setPreviewUrl(null)
    }
  }

  const handleClose = () => {
    setFile(null)
    setPreviewUrl(null)
    setSubmittedId(null)
    setError('')
    setOcrDetected(null)
    onClose()
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!file) {
      setError('Please select a payment receipt screenshot or document.')
      return
    }

    const cleanHouse = houseNumber.trim()
    if (!cleanHouse) {
      setError('Please provide your House / Flat Number for detailed receipt reconciliation.')
      return
    }

    const cleanName = residentName.trim()
    if (!cleanName) {
      setError('Please provide the Resident Full Name.')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')

      // 1. Upload & compress file
      const { downloadURL, storagePath } = await uploadReceiptFile(
        file,
        cycleKey,
        currentUser?.id || 'res_user',
        (progress) => setUploadProgress(progress)
      )

      // 2. Save in Firestore with detailed House Number & Resident Name
      const recId = await submitPaymentReceipt({
        residentId: currentUser?.id || 'res_user',
        residentName: cleanName,
        houseNumber: cleanHouse,
        contactNumber: currentUser?.phoneNumber || '',
        billingMonth: currentMonth,
        billingYear: currentYear,
        amountPaid: Number(amount),
        paymentChannel: paymentChannel || 'easypaisa',
        transactionRef: transactionRef.trim(),
        receiptUrl: downloadURL,
        receiptStoragePath: storagePath
      })

      // Update resident profile in localStorage so future receipts pre-populate
      try {
        if (typeof window !== 'undefined') {
          const stored = localStorage.getItem('resident_identity')
          const existing = stored ? JSON.parse(stored) : {}
          localStorage.setItem(
            'resident_identity',
            JSON.stringify({
              ...existing,
              name: cleanName,
              houseAddress: cleanHouse,
              houseNo: cleanHouse
            })
          )
        }
      } catch (_) {}

      // Dispatch real-time event so Super Admin Table updates immediately
      if (typeof window !== 'undefined') {
        window.dispatchEvent(
          new CustomEvent('receipt-updated', {
            detail: {
              receiptId: recId,
              residentName: cleanName,
              houseNumber: cleanHouse,
              amount: Number(amount),
              status: 'verified'
            }
          })
        )
      }

      setSubmittedId(recId)
    } catch (err) {
      setError(err.message || 'Failed to upload receipt. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              {paymentChannel === 'mcb_bank'
                ? 'Upload MCB Bank Payment Receipt'
                : 'Upload Easypaisa / Raast Receipt'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Billing Cycle: {currentMonth} {currentYear}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {/* ============================================================ */}
        {/* CASE A: ALREADY UPLOADED & APPROVED (LOCKED FOR THIS MONTH) */}
        {/* ============================================================ */}
        {alreadyApprovedData ? (
          <div className="p-6 sm:p-7 text-center space-y-4">
            <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-950/30">
              <ShieldCheck size={38} />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                Receipt Already Uploaded & Verified
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Billing Cycle: {currentMonth} {currentYear}
              </p>
            </div>

            {/* Locked Paid Resident Status Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-black text-xs border border-emerald-300/60 shadow-xs">
              <Lock size={14} className="text-emerald-600 dark:text-emerald-400" />
              <span>Status: Paid Resident (Locked & Approved)</span>
            </div>

            {/* Approved Details Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">House / Unit</span>
                <span className="font-black text-slate-900 dark:text-white">
                  {alreadyApprovedData.houseNumber || currentUser.houseNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Resident Name</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {alreadyApprovedData.residentName || currentUser.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Amount Settled</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                  PKR {Number(alreadyApprovedData.amountPaid || standardDues).toLocaleString('en-PK')}
                </span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700/80">
                <span className="text-slate-400 text-[11px]">Audit Record</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                  Confirmed on Super Admin Ledger
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed max-w-sm mx-auto">
              Your payment receipt for this month is already approved. Duplicate uploads are locked for this billing cycle.
            </p>

            <button
              type="button"
              onClick={handleClose}
              className="w-full py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 font-black text-sm shadow-md transition-colors cursor-pointer"
            >
              Done / Close
            </button>
          </div>
        ) : submittedId ? (
          /* ============================================================ */
          /* CASE B: SUCCESS SCREEN DIRECTLY AFTER SUBMISSION             */
          /* ============================================================ */
          <div className="p-6 sm:p-7 text-center space-y-4">
            <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center ring-8 ring-emerald-50 dark:ring-emerald-950/30">
              <CheckCircle2 size={38} />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl font-black text-slate-900 dark:text-white">
                Your Receipt Has Been Updated
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {currentMonth} {currentYear} • Detailed Receipt Logged
              </p>
            </div>

            {/* Paid Resident Status Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 font-black text-xs border border-emerald-300/60 shadow-xs">
              <CheckCircle2 size={15} className="text-emerald-600 dark:text-emerald-400" />
              <span>Status: Paid Resident</span>
            </div>

            {/* Receipt Summary Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 text-left space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">House / Unit</span>
                <span className="font-black text-slate-900 dark:text-white">{houseNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Resident</span>
                <span className="font-bold text-slate-900 dark:text-white">{residentName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-bold">Amount Paid</span>
                <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                  PKR {Number(amount).toLocaleString('en-PK')}
                </span>
              </div>
              {transactionRef && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-bold">Transaction TID</span>
                  <span className="font-mono font-bold text-slate-800 dark:text-slate-200">{transactionRef}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-slate-200 dark:border-slate-700/80">
                <span className="text-slate-400 text-[11px]">Super Admin Ledger</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[11px]">
                  Logged in Receipt Tab
                </span>
              </div>
              <div className="font-mono text-[10px] text-slate-400 truncate pt-1">
                Ref: {submittedId}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Your payment receipt and verification have been recorded in the Super Admin Panel.
            </p>

            <button
              type="button"
              onClick={() => {
                if (onSuccess) onSuccess(submittedId)
                handleClose()
              }}
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md transition-colors cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          /* ============================================================ */
          /* CASE C: ACTIVE UPLOAD FORM WITH HOUSE NUMBER & NAME INPUTS   */
          /* ============================================================ */
          <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
            {/* File Dropzone */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-5 text-center cursor-pointer transition-colors ${
                file
                  ? 'border-emerald-500/60 bg-emerald-50/20 dark:bg-emerald-950/20'
                  : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                className="hidden"
                onChange={handleFileChange}
              />
              {previewUrl ? (
                <div className="space-y-2">
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="max-h-36 mx-auto rounded-xl object-contain border border-slate-200 dark:border-slate-700 shadow-sm"
                  />
                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 block">
                    Change file ({file.name})
                  </span>
                </div>
              ) : file ? (
                <div className="flex items-center justify-center gap-2 py-4 text-slate-700 dark:text-slate-200">
                  <FileText size={24} className="text-emerald-500" />
                  <span className="text-xs font-bold">{file.name}</span>
                </div>
              ) : (
                <div className="space-y-1 text-slate-500 dark:text-slate-400">
                  <UploadCloud size={32} className="mx-auto text-emerald-600 dark:text-emerald-400 opacity-80" />
                  <p className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    Click to select payment screenshot or PDF
                  </p>
                  <p className="text-[10px]">JPG, PNG, WEBP or PDF (Max 8MB)</p>
                </div>
              )}
            </div>

            {/* OCR Live Scanning Status */}
            {isScanningOcr && (
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-indigo-50/90 dark:bg-indigo-950/40 border border-indigo-200/80 dark:border-indigo-900/60 text-xs">
                <Loader2 size={16} className="text-indigo-600 dark:text-indigo-400 animate-spin flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center text-indigo-900 dark:text-indigo-200 font-bold text-[11px] mb-1">
                    <span>Reading receipt (fetching Name, Amount & TID)...</span>
                    <span>{ocrProgress}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-indigo-200 dark:bg-indigo-900 overflow-hidden">
                    <div
                      className="h-full bg-indigo-600 dark:bg-indigo-400 transition-all duration-300"
                      style={{ width: `${ocrProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* OCR Success Auto-Detection Banner */}
            {!isScanningOcr && ocrDetected && (
              <div className="flex items-center gap-2.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/60 text-xs text-emerald-900 dark:text-emerald-200">
                <Sparkles size={16} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                <div className="flex-1 min-w-0 text-[11px] leading-tight">
                  <span className="font-extrabold block text-emerald-700 dark:text-emerald-300">
                    Auto-fetched from receipt:
                  </span>
                  <span className="font-mono font-bold block truncate">
                    {ocrDetected.name ? `Name: ${ocrDetected.name}` : ''}
                    {ocrDetected.name && ocrDetected.amount ? ' • ' : ''}
                    {ocrDetected.amount ? `Amount: PKR ${ocrDetected.amount}` : ''}
                    {ocrDetected.tid ? ` • TID: ${ocrDetected.tid}` : ''}
                  </span>
                </div>
                <div className="size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                  <Check size={12} strokeWidth={3} />
                </div>
              </div>
            )}

            {/* Resident Details: House Number & Name Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* House Number Input (Required for Detailed Receipt) */}
              <div>
                <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase mb-1">
                  <Home size={13} className="text-emerald-600 dark:text-emerald-400" />
                  <span>House / Flat # (Required) *</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. House # 42, Flat B-4"
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  required
                />
              </div>

              {/* Resident Full Name Input (Auto-filled from OCR or user entry) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase">
                    <User size={13} className="text-emerald-600 dark:text-emerald-400" />
                    <span>Resident Name *</span>
                  </label>
                  {ocrDetected?.name && (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded-md">
                      From Slip
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. ABDUL MAJID"
                  value={residentName}
                  onChange={(e) => setResidentName(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white text-xs font-bold outline-none transition ${
                    ocrDetected?.name
                      ? 'border-emerald-500/80 ring-1 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                  }`}
                  required
                />
              </div>
            </div>

            {/* Amount and Ref Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block">
                    Amount Paid (PKR)
                  </label>
                  {ocrDetected?.amount && (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded-md">
                      Auto-filled
                    </span>
                  )}
                </div>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono font-bold text-sm outline-none transition ${
                    ocrDetected?.amount
                      ? 'border-emerald-500/80 ring-1 ring-emerald-500/30'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                  }`}
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase block">
                    Transaction TID (Optional)
                  </label>
                  {ocrDetected?.tid && (
                    <span className="text-[9px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-100/70 dark:bg-emerald-900/40 px-1.5 py-0.5 rounded-md">
                      Auto-filled
                    </span>
                  )}
                </div>
                <input
                  type="text"
                  placeholder="e.g. 2938472910"
                  value={transactionRef}
                  onChange={(e) => setTransactionRef(e.target.value)}
                  className={`w-full px-3 py-2 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-mono text-sm outline-none transition ${
                    ocrDetected?.tid
                      ? 'border-emerald-500/80 ring-1 ring-emerald-500/30 font-bold'
                      : 'border-slate-200 dark:border-slate-700 focus:border-emerald-500'
                  }`}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 text-xs font-bold">
                <AlertCircle size={15} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {isSubmitting && (
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] font-mono font-bold text-slate-500">
                  <span>Uploading to Secure Storage...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 transition-all duration-200"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting || isScanningOcr}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer active:scale-98"
            >
              <UploadCloud size={17} />
              <span>{isSubmitting ? 'Submitting Receipt...' : 'Confirm & Save Receipt'}</span>
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}

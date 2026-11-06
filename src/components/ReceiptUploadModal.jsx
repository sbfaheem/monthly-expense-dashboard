// src/components/ReceiptUploadModal.jsx
import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { X, UploadCloud, CheckCircle2, AlertCircle, FileText, Sparkles, Loader2, Check } from 'lucide-react'
import { uploadReceiptFile, submitPaymentReceipt } from '../utils/receiptService'
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
  onSuccess
}) {
  const [file, setFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState(null)
  const [amount, setAmount] = useState(standardDues)
  const [transactionRef, setTransactionRef] = useState('')
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedId, setSubmittedId] = useState(null)
  const [error, setError] = useState('')
  const [isScanningOcr, setIsScanningOcr] = useState(false)
  const [ocrProgress, setOcrProgress] = useState(0)
  const [ocrDetected, setOcrDetected] = useState(null)
  const fileInputRef = useRef(null)

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

      // Automatically scan receipt using OCR in browser
      try {
        setIsScanningOcr(true)
        setOcrProgress(15)

        const result = await scanReceiptForDetails(selected, (p) => setOcrProgress(p))

        if (result.amount) {
          setAmount(result.amount)
        }
        if (result.transactionRef) {
          setTransactionRef(result.transactionRef)
        }

        if (result.amount || result.transactionRef) {
          setOcrDetected({
            amount: result.amount,
            tid: result.transactionRef
          })
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

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!file) {
      setError('Please select a receipt screenshot or document.')
      return
    }

    try {
      setIsSubmitting(true)
      setError('')
      const cycleKey = `${currentYear}-${currentMonth}`

      // 1. Upload & compress file
      const { downloadURL, storagePath } = await uploadReceiptFile(
        file,
        cycleKey,
        currentUser.id,
        (progress) => setUploadProgress(progress)
      )

      // 2. Save in Firestore with sanitized path
      const recId = await submitPaymentReceipt({
        residentId: currentUser.id,
        residentName: currentUser.name,
        houseNumber: currentUser.houseNumber,
        contactNumber: currentUser.phoneNumber,
        billingMonth: currentMonth,
        billingYear: currentYear,
        amountPaid: amount,
        paymentChannel: 'easypaisa',
        transactionRef,
        receiptUrl: downloadURL,
        receiptStoragePath: storagePath
      })

      setSubmittedId(recId)
      if (onSuccess) onSuccess(recId)
    } catch (err) {
      setError(err.message || 'Failed to upload receipt. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
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
              Upload Easypaisa / Raast Receipt
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Billing Cycle: {currentMonth} {currentYear}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="size-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-800 dark:hover:text-white cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {submittedId ? (
          <div className="p-6 text-center space-y-4">
            <div className="size-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center">
              <CheckCircle2 size={36} />
            </div>
            <h4 className="text-xl font-black text-slate-900 dark:text-white">
              Receipt Submitted!
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Your payment receipt has been linked to <strong>{currentUser.houseNumber}</strong>. Status will update to <strong>Paid Resident</strong> upon admin review.
            </p>
            <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-2xl border border-slate-200/80 dark:border-slate-700 font-mono text-xs font-bold text-slate-600 dark:text-slate-300">
              Receipt ID: {submittedId}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-full py-3 rounded-2xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold text-sm shadow-md cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Resident Context Read-Only Box */}
            <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Resident</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 truncate block">{currentUser.name}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase font-bold block">House / Unit</span>
                <span className="font-bold text-slate-800 dark:text-slate-200 block">{currentUser.houseNumber}</span>
              </div>
            </div>

            {/* Dropzone */}
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
                    <span>Reading receipt (fetching Amount & TID)...</span>
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
                  <span className="font-mono font-bold">
                    {ocrDetected.amount ? `Amount: PKR ${ocrDetected.amount}` : ''}
                    {ocrDetected.amount && ocrDetected.tid ? ' • ' : ''}
                    {ocrDetected.tid ? `TID: ${ocrDetected.tid}` : ''}
                  </span>
                </div>
                <div className="size-5 rounded-full bg-emerald-500 text-white flex items-center justify-center flex-shrink-0">
                  <Check size={12} strokeWidth={3} />
                </div>
              </div>
            )}

            {/* Amount and Ref Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-500 uppercase block">
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
                  <label className="text-[11px] font-bold text-slate-500 uppercase block">
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
              className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-black text-sm shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <UploadCloud size={16} />
              <span>{isSubmitting ? 'Submitting Receipt...' : 'Confirm & Save Receipt'}</span>
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}

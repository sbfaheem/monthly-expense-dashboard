import React, { useState, useEffect } from 'react'
import { Landmark, Copy, Check, X, MessageSquare, AlertCircle, ShieldCheck, QrCode } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export default function BankDetailsModal({ isOpen, onClose }) {
  const { lang, t, isRtl } = useLanguage()
  const isUrdu = lang === 'ur'

  const [copiedKey, setCopiedKey] = useState(null)

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown)
    }
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const bankDetails = [
    {
      key: 'bankName',
      label: t.bankName || 'Bank Name',
      value: 'Meezan Bank Ltd.',
      displayValue: 'Meezan Bank Ltd.',
      badge: 'Premier Islamic Bank'
    },
    {
      key: 'accountTitle',
      label: t.accountTitle || 'Account Title',
      value: 'Sector 7D/1 Welfare Committee',
      displayValue: 'Sector 7D/1 Welfare Committee',
      badge: 'Official Account'
    },
    {
      key: 'accountNumber',
      label: t.accountNumber || 'Account Number / IBAN',
      value: 'PK00MEZN0001234567890101',
      displayValue: 'PK00 MEZN 0001 2345 6789 0101',
      highlight: true
    },
    {
      key: 'raastId',
      label: t.raastId || 'Raast ID',
      value: '03013377675',
      displayValue: '0301-3377675',
      badge: 'Instant Transfer 0% Fee',
      highlight: true
    }
  ]

  const handleCopy = (key, textToCopy) => {
    try {
      if (navigator?.clipboard?.writeText) {
        navigator.clipboard.writeText(textToCopy)
      } else {
        const textArea = document.createElement('textarea')
        textArea.value = textToCopy
        document.body.appendChild(textArea)
        textArea.select()
        document.execCommand('copy')
        document.body.removeChild(textArea)
      }
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch (err) {
      console.error('Copy failed:', err)
    }
  }

  const receiptMsg = isUrdu
    ? 'السلام علیکم! میں نے ماہانہ فیس منتقل کر دی ہے۔ برائے مہربانی رسید ملاحظہ فرمائیں۔'
    : 'Assalam-o-Alaikum! I have transferred the monthly dues. Please find the payment receipt attached.'

  const waReceiptUrl = `https://wa.me/923013377675?text=${encodeURIComponent(receiptMsg)}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative bg-white dark:bg-slate-800 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl border border-slate-100 dark:border-slate-700 max-h-[92vh] flex flex-col z-10 space-y-5 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700/60 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="size-11 rounded-2xl bg-primary/10 text-primary dark:bg-primary/20 flex items-center justify-center font-bold flex-shrink-0 shadow-xs">
              <Landmark size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-tight">
                {t.bankDetailsTitle || 'Community Collection Bank Account'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                {isUrdu ? 'ماہانہ سیکیورٹی و سویپرز فیس کی آن لائن ادائیگی' : 'Online payment for monthly maintenance & security dues'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            title={t.closeBtn || 'Close'}
          >
            <X size={20} />
          </button>
        </div>

        {/* Bank & Raast Details List */}
        <div className="space-y-3">
          {bankDetails.map((item) => {
            const isCopied = copiedKey === item.key
            return (
              <div
                key={item.key}
                className={`p-3.5 sm:p-4 rounded-2xl border transition-all ${
                  item.highlight
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/50'
                    : 'bg-slate-50 dark:bg-slate-900/60 border-slate-200/70 dark:border-slate-700/60'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {item.label}
                  </span>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200/70 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                      {item.badge}
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm sm:text-base font-black font-mono break-all ${
                    item.highlight
                      ? 'text-emerald-700 dark:text-emerald-300'
                      : 'text-slate-900 dark:text-slate-100'
                  }`}>
                    {item.displayValue}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleCopy(item.key, item.value)}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex-shrink-0 ${
                      isCopied
                        ? 'bg-emerald-600 text-white shadow-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                    }`}
                    title={isCopied ? (t.copySuccess || 'Copied!') : 'Copy to Clipboard'}
                  >
                    {isCopied ? (
                      <>
                        <Check size={13} className="text-white" />
                        <span>{t.copySuccess || 'Copied!'}</span>
                      </>
                    ) : (
                      <>
                        <Copy size={13} className="text-slate-500 dark:text-slate-400" />
                        <span>{isUrdu ? 'کاپی' : 'Copy'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* WhatsApp Notice & Share Receipt */}
        <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-800/50 rounded-2xl space-y-3">
          <div className="flex items-start gap-2.5">
            <AlertCircle size={18} className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-amber-900 dark:text-amber-200 leading-relaxed font-medium">
              {isUrdu ? (
                <>
                  <strong>ضروری اطلاع:</strong> فیس کی آن لائن ادائیگی کے بعد ٹرانزیکشن اسکرین شاٹ یا بینک رسید برائے مہربانی واٹس ایپ پر انتظامیہ کو ضرور ارسال فرمائیں تاکہ آپ کے مکان کی فیس کا ریکارڈ اپ ڈیٹ ہو سکے۔
                </>
              ) : (
                <>
                  <strong>Notice:</strong> After transferring your dues, kindly share a screenshot or transaction receipt with the management on WhatsApp to ensure your household record is promptly cleared.
                </>
              )}
            </p>
          </div>

          <a
            href={waReceiptUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-extrabold shadow-sm shadow-emerald-600/20 active:scale-98 transition-all"
          >
            <MessageSquare size={16} />
            <span>{isUrdu ? 'واٹس ایپ پر رسید شیئر کریں' : 'Share Receipt on WhatsApp (0301-3377675)'}</span>
          </a>
        </div>
      </div>
    </div>
  )
}

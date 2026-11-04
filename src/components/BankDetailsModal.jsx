import React, { useState } from 'react'
import { motion, AnimatePresence, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import { Copy, Check, X, RotateCw, Landmark, QrCode, MessageCircle, ExternalLink, ShieldCheck } from 'lucide-react'

export const BankDetailsModal = ({ isOpen, onClose }) => {
  const { lang, t, isRtl } = useLanguage ? useLanguage() : { lang: 'en', t: {}, isRtl: false }
  const isUrdu = lang === 'ur'
  const shouldReduceMotion = useReducedMotion()

  const [isFlipped, setIsFlipped] = useState(false)
  const [copiedKey, setCopiedKey] = useState('')

  // Interactive 3D tilt springs
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 24, stiffness: 260 }
  const tiltX = useSpring(mouseY, springConfig)
  const tiltY = useSpring(mouseX, springConfig)

  const handlePointerMove = (e) => {
    if (isFlipped || shouldReduceMotion) return
    const rect = e.currentTarget.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width - 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5
    // Tilt up to 10°
    mouseX.set(x * 12)
    mouseY.set(-y * 12)
  }

  const handlePointerLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  // Bank Credentials
  const credentials = {
    bankName: 'Meezan Bank Ltd.',
    accountTitle: 'Sector 7D/1 Welfare Committee',
    iban: 'PK00MEZN0001234567890101',
    formattedIban: 'PK00 MEZN 0001 2345 6789 0101',
    raastId: '03013377675',
    formattedRaast: '0301-3377675',
    whatsappNumber: '923013377675',
  }

  const copyToClipboard = async (text, key) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        const ta = document.createElement('textarea')
        ta.value = text
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      }
      setCopiedKey(key)
      setTimeout(() => setCopiedKey(''), 2200)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  const whatsappMessage = encodeURIComponent(
    isUrdu
      ? `السلام علیکم! میں نے سوسائٹی کے ماہانہ فنڈز منتقل کر دیے ہیں۔ ادائیگی کی رسید منسلک ہے۔\nاکاؤنٹ: ${credentials.accountTitle}\nراست: ${credentials.raastId}`
      : `Assalam o Alaikum! I have transferred the monthly society dues. Please find the payment receipt attached.\nAccount: ${credentials.accountTitle}\nRaast ID: ${credentials.raastId}`
  )

  const whatsappUrl = `https://wa.me/${credentials.whatsappNumber}?text=${whatsappMessage}`

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
        {/* Backdrop Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/75 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ scale: 0.94, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.94, opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 320, damping: 26 }}
          className="relative w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-200/90 dark:border-slate-800 z-10 my-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-5">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-2xl bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                <Landmark size={22} />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {t?.bankDetailsTitle || (isUrdu ? 'سوسائٹی بینک اکاؤنٹ کی تفصیلات' : 'Community Collection Bank Account')}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isUrdu
                    ? 'ماہانہ فنڈز و سروسز کی تصدیق شدہ بینک ادائیگی'
                    : 'Official Meezan Bank & Raast Passbook for dues payment'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              aria-label="Close Modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* ================= 3D PERSPECTIVE CONTAINER ================= */}
          <div
            style={{ perspective: 1200 }}
            className="w-full flex justify-center py-2"
          >
            {/* Flipping 3D Card Body */}
            <motion.div
              animate={{
                rotateY: isFlipped ? 180 : 0,
              }}
              style={{
                transformStyle: 'preserve-3d',
                rotateX: isFlipped || shouldReduceMotion ? 0 : tiltX,
                rotateY: isFlipped ? 180 : (shouldReduceMotion ? 0 : tiltY),
              }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 22,
              }}
              onMouseMove={handlePointerMove}
              onMouseLeave={handlePointerLeave}
              className="relative w-full aspect-[1.586/1] min-h-[230px] sm:min-h-[265px] rounded-2xl sm:rounded-3xl shadow-2xl cursor-pointer select-none"
              onClick={() => setIsFlipped(!isFlipped)}
              title={t?.tapToFlip || (isUrdu ? 'رخ پلٹنے کے لیے کلک کریں' : 'Click to flip card')}
            >
              {/* ================= FRONT FACE: EXECUTIVE METAL DEBIT PASSBOOK ================= */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'translateZ(1px)',
                }}
                className="absolute inset-0 rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-gradient-to-tr from-slate-950 via-emerald-950 to-slate-900 border border-emerald-500/40 shadow-2xl flex flex-col justify-between overflow-hidden text-white"
              >
                {/* Brushed Metal Sheen & Radial Glow */}
                <div 
                  className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_25%_25%,_rgba(251,191,36,0.35),_transparent_55%)]" 
                />
                <div 
                  className="pointer-events-none absolute inset-0 opacity-15"
                  style={{
                    backgroundImage: 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
                    backgroundSize: '200% 200%',
                  }}
                />

                {/* Top Row: EMV Chip, NFC Wave & Meezan Bank Logo */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center gap-3">
                    {/* Embossed EMV Chip SVG */}
                    <svg
                      className="w-10 h-8 sm:w-12 sm:h-9 rounded-md shadow-inner"
                      viewBox="0 0 54 44"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect width="54" height="44" rx="6" fill="url(#chipGrad)" stroke="#b45309" strokeWidth="1" />
                      <line x1="0" y1="22" x2="54" y2="22" stroke="#92400e" strokeWidth="1.2" />
                      <line x1="27" y1="0" x2="27" y2="44" stroke="#92400e" strokeWidth="1.2" />
                      <rect x="18" y="14" width="18" height="16" rx="3" stroke="#92400e" strokeWidth="1.2" fill="#fde68a" fillOpacity="0.45" />
                      <defs>
                        <linearGradient id="chipGrad" x1="0" y1="0" x2="54" y2="44" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#fef08a" />
                          <stop offset="0.5" stopColor="#fbbf24" />
                          <stop offset="1" stopColor="#d97706" />
                        </linearGradient>
                      </defs>
                    </svg>

                    {/* Contactless Wave Icon */}
                    <svg className="w-5 h-5 text-amber-200/80 -rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                      <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" />
                    </svg>
                  </div>

                  {/* Meezan Bank Badge */}
                  <div className="flex items-center gap-2 bg-emerald-900/60 border border-emerald-400/30 px-3 py-1.5 rounded-xl backdrop-blur-xs">
                    <div className="size-5 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[10px]">
                      M
                    </div>
                    <div className="flex flex-col text-right">
                      <span className="text-xs font-black tracking-tight text-white leading-tight">
                        {credentials.bankName}
                      </span>
                      <span className="text-[8px] font-bold text-amber-300 uppercase tracking-widest leading-none">
                        Islamic Banking
                      </span>
                    </div>
                  </div>
                </div>

                {/* Middle Row: Formatted IBAN & Copy Button */}
                <div className="my-auto py-1 z-10">
                  <div className="text-[10px] sm:text-xs font-semibold text-emerald-300 uppercase tracking-wider mb-0.5">
                    {t?.accountNumber || (isUrdu ? 'اکاؤنٹ نمبر / IBAN' : 'Account Number / IBAN')}
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="font-mono text-base sm:text-xl font-black tracking-wider text-amber-100 drop-shadow-sm select-all">
                      {credentials.formattedIban}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(credentials.iban, 'iban')
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-400/40 text-emerald-200 text-xs font-bold transition-all active:scale-95 shadow-sm"
                    >
                      {copiedKey === 'iban' ? (
                        <>
                          <Check size={14} className="text-emerald-400" />
                          <span>{t?.copySuccess || (isUrdu ? 'کاپی ہو گیا!' : 'Copied!')}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={14} />
                          <span>{t?.copyBtn || (isUrdu ? 'کاپی' : 'Copy')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Account Title & Flip to Raast Button */}
                <div className="flex items-end justify-between gap-3 pt-2 border-t border-emerald-800/60 z-10">
                  <div>
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      {t?.accountTitle || (isUrdu ? 'اکاؤنٹ ٹائٹل' : 'Account Title')}
                    </span>
                    <span className="text-xs sm:text-sm font-extrabold text-white tracking-wide">
                      {credentials.accountTitle}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsFlipped(true)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 text-xs font-black shadow-lg transition-all active:scale-95 flex-shrink-0"
                  >
                    <RotateCw size={14} />
                    <span>{t?.flipToRaast || (isUrdu ? 'راست کیو آر کوڈ دیکھیں ↺' : 'Flip to Raast QR ↺')}</span>
                  </button>
                </div>
              </div>

              {/* ================= BACK FACE: RAAST QR & WHATSAPP PROOF ================= */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg) translateZ(1px)',
                }}
                className="absolute inset-0 rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-emerald-950 border border-emerald-500/40 shadow-2xl flex flex-col justify-between overflow-hidden text-white"
              >
                {/* Magnetic Stripe */}
                <div className="h-8 sm:h-10 w-[calc(100%+3rem)] -mx-6 -mt-6 bg-gradient-to-r from-neutral-900 via-black to-neutral-900 border-b border-white/10 flex items-center px-6">
                  <span className="text-[8px] tracking-widest text-slate-500 uppercase font-mono font-bold">
                    AUTHORISED WELFARE COMMITTEE PASSBOOK • SECTOR 7D/1
                  </span>
                </div>

                {/* Raast QR Preview Area */}
                <div className="flex items-center gap-4 my-auto py-1">
                  {/* High Contrast Raast QR Container */}
                  <div className="bg-white p-2 sm:p-2.5 rounded-2xl shadow-lg border-2 border-emerald-400/40 flex-shrink-0">
                    <svg className="w-20 h-20 sm:w-24 sm:h-24" viewBox="0 0 100 100" fill="none">
                      {/* Outer boundary */}
                      <rect width="100" height="100" fill="white" />
                      {/* Top-Left Finder */}
                      <rect x="8" y="8" width="28" height="28" rx="4" fill="#064e3b" />
                      <rect x="14" y="14" width="16" height="16" rx="2" fill="white" />
                      <rect x="18" y="18" width="8" height="8" rx="1.5" fill="#064e3b" />
                      {/* Top-Right Finder */}
                      <rect x="64" y="8" width="28" height="28" rx="4" fill="#064e3b" />
                      <rect x="70" y="14" width="16" height="16" rx="2" fill="white" />
                      <rect x="74" y="18" width="8" height="8" rx="1.5" fill="#064e3b" />
                      {/* Bottom-Left Finder */}
                      <rect x="8" y="64" width="28" height="28" rx="4" fill="#064e3b" />
                      <rect x="14" y="70" width="16" height="16" rx="2" fill="white" />
                      <rect x="18" y="74" width="8" height="8" rx="1.5" fill="#064e3b" />
                      {/* QR Matrix Bits */}
                      <rect x="42" y="10" width="6" height="6" fill="#047857" />
                      <rect x="52" y="16" width="6" height="6" fill="#064e3b" />
                      <rect x="42" y="24" width="6" height="6" fill="#047857" />
                      <rect x="52" y="32" width="6" height="6" fill="#064e3b" />
                      <rect x="12" y="44" width="6" height="6" fill="#064e3b" />
                      <rect x="24" y="44" width="6" height="6" fill="#047857" />
                      <rect x="36" y="44" width="6" height="6" fill="#064e3b" />
                      <rect x="48" y="44" width="6" height="6" fill="#047857" />
                      <rect x="60" y="44" width="6" height="6" fill="#064e3b" />
                      <rect x="72" y="44" width="6" height="6" fill="#047857" />
                      <rect x="84" y="44" width="6" height="6" fill="#064e3b" />
                      <rect x="44" y="56" width="6" height="6" fill="#064e3b" />
                      <rect x="56" y="56" width="6" height="6" fill="#047857" />
                      <rect x="44" y="68" width="6" height="6" fill="#047857" />
                      <rect x="56" y="68" width="6" height="6" fill="#064e3b" />
                      <rect x="68" y="68" width="6" height="6" fill="#047857" />
                      <rect x="80" y="68" width="6" height="6" fill="#064e3b" />
                      <rect x="44" y="80" width="6" height="6" fill="#064e3b" />
                      <rect x="56" y="80" width="6" height="6" fill="#047857" />
                      <rect x="68" y="80" width="6" height="6" fill="#064e3b" />
                      <rect x="80" y="80" width="6" height="6" fill="#047857" />
                      {/* Center Raast Badge */}
                      <circle cx="50" cy="50" r="10" fill="#f59e0b" />
                      <text x="50" y="54" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#0f172a">R</text>
                    </svg>
                  </div>

                  {/* Raast Details & Copy Button */}
                  <div className="flex-1 min-w-0">
                    <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400 text-slate-950 mb-1">
                      Raast P2P / Instant
                    </span>
                    <h4 className="text-xs sm:text-sm font-extrabold text-white">
                      {isUrdu ? 'راست آئی ڈی (فوری ٹرانسفر)' : 'Instant Raast Payment'}
                    </h4>
                    <div className="font-mono text-base sm:text-lg font-black text-amber-200 tracking-wider my-0.5 select-all">
                      {credentials.raastId}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(credentials.raastId, 'raast')
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-400/40 text-emerald-200 text-xs font-bold transition-all active:scale-95"
                    >
                      {copiedKey === 'raast' ? (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          <span>{t?.copySuccess || (isUrdu ? 'کاپی ہو گیا!' : 'Copied!')}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>{t?.copyBtn || (isUrdu ? 'کاپی' : 'Copy Raast ID')}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Direct WhatsApp Proof Action & Flip Back */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-emerald-800/60 z-10">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                  >
                    <MessageCircle size={15} />
                    <span>{t?.sendProofWa || (isUrdu ? 'رسید واٹس ایپ کریں' : 'Send Proof on WhatsApp')}</span>
                  </a>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsFlipped(false)
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold shadow-sm transition-all active:scale-95"
                  >
                    <RotateCw size={13} />
                    <span>{t?.flipToBank || (isUrdu ? '↺ اکاؤنٹ تفصیلات' : '↺ Account Details')}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Copy Fields for Fast Mobile Reference */}
          <div className="mt-5 space-y-2.5">
            {/* Bank Name */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                {t?.bankName || (isUrdu ? 'بینک کا نام' : 'Bank Name')}
              </span>
              <strong className="text-slate-800 dark:text-slate-200 font-bold">
                {credentials.bankName}
              </strong>
            </div>

            {/* Account Title */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                {t?.accountTitle || (isUrdu ? 'اکاؤنٹ ٹائٹل' : 'Account Title')}
              </span>
              <div className="flex items-center gap-2">
                <strong className="text-slate-800 dark:text-slate-200 font-bold">
                  {credentials.accountTitle}
                </strong>
                <button
                  type="button"
                  onClick={() => copyToClipboard(credentials.accountTitle, 'title_quick')}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                  title="Copy Title"
                >
                  {copiedKey === 'title_quick' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* IBAN Full */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                {t?.accountNumber || (isUrdu ? 'اکاؤنٹ نمبر / IBAN' : 'IBAN')}
              </span>
              <div className="flex items-center gap-2">
                <strong className="font-mono text-slate-800 dark:text-slate-200 font-bold select-all">
                  {credentials.iban}
                </strong>
                <button
                  type="button"
                  onClick={() => copyToClipboard(credentials.iban, 'iban_quick')}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                  title="Copy IBAN"
                >
                  {copiedKey === 'iban_quick' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Raast ID */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                {t?.raastId || (isUrdu ? 'راست آئی ڈی' : 'Raast ID')}
              </span>
              <div className="flex items-center gap-2">
                <strong className="font-mono text-slate-800 dark:text-slate-200 font-bold select-all">
                  {credentials.raastId}
                </strong>
                <button
                  type="button"
                  onClick={() => copyToClipboard(credentials.raastId, 'raast_quick')}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                  title="Copy Raast ID"
                >
                  {copiedKey === 'raast_quick' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Advisory Notice */}
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
            <span className="text-amber-600 dark:text-amber-400 text-base mt-0.5">ℹ️</span>
            <p className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
              {t?.waNotice ||
                (isUrdu
                  ? 'رقم منتقل کرنے کے بعد رسید کا اسکرین شاٹ واٹس ایپ پر انتظامیہ کو ضرور بھیجیں۔'
                  : 'Kindly share a screenshot of your transfer/receipt with management on WhatsApp for instant confirmation.')}
            </p>
          </div>

          {/* Direct WhatsApp Submission Button */}
          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              {t?.closeBtn || (isUrdu ? 'بند کریں' : 'Close')}
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 transition-all active:scale-95"
            >
              <MessageCircle size={16} />
              <span>{t?.sendProofWa || (isUrdu ? 'ادائیگی رسید واٹس ایپ کریں' : 'Submit Receipt on WhatsApp')}</span>
              <ExternalLink size={14} />
            </a>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}

export default BankDetailsModal

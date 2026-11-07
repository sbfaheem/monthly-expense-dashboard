import React, { useState, useEffect } from 'react'
import QRCode from 'qrcode'
import { motion, AnimatePresence, useMotionValue, useSpring, useReducedMotion } from 'framer-motion'
import { useLanguage } from '../context/LanguageContext'
import {
  Copy,
  Check,
  X,
  RotateCw,
  MessageCircle,
  ExternalLink,
  Smartphone,
  UploadCloud,
  Landmark,
  Building2
} from 'lucide-react'
import { soundEffects } from '../utils/soundEffects'
import ReceiptUploadModal from './ReceiptUploadModal'

// Cyclic Redundancy Check (CRC-16 / CCITT-FALSE) as mandated by State Bank of Pakistan (SBP)
const computeCrc16 = (payload) => {
  let crc = 0xFFFF
  for (let i = 0; i < payload.length; i += 1) {
    crc ^= payload.charCodeAt(i) << 8
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000) ? (((crc << 1) ^ 0x1021) & 0xFFFF) : ((crc << 1) & 0xFFFF)
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

// SBP-compliant Raast P2P payload using official 24-char Pakistani IBAN with Beneficiary Name for full interoperability
const buildRaastP2pPayload = (iban, accountTitle = 'BENEFICIARY') => {
  const cleanIban = iban.trim().toUpperCase().replace(/\s+/g, '')
  const cleanTitle = (accountTitle || 'BENEFICIARY').trim().toUpperCase()
  const titleLen = String(cleanTitle.length).padStart(2, '0')
  // Tag 00: Version 02
  // Tag 01: Initiation 11 (Static open-amount)
  // Tag 02: Scheme 00 (IBAN)
  // Tag 03: Beneficiary Name
  // Tag 04: Official IBAN (24 chars)
  // Tag 10: Checksum
  const base = `00020201021102020003${titleLen}${cleanTitle}0424${cleanIban}1004`
  return base + computeCrc16(base)
}

export const BankDetailsModal = ({
  isOpen,
  onClose,
  currentUser = {
    id: 'res-7d-42',
    name: 'Syed Bilal Faheem',
    houseNumber: 'Sector 7D/1 - House 42',
    phoneNumber: '0346-2650446'
  },
  currentMonth = 'September',
  currentYear = 2026
}) => {
  const { lang, t } = useLanguage ? useLanguage() : { lang: 'en', t: {} }
  const isUrdu = lang === 'ur'
  const shouldReduceMotion = useReducedMotion()

  const [activeAccountTab, setActiveAccountTab] = useState('easypaisa') // 'easypaisa' | 'bank'
  const [isFlipped, setIsFlipped] = useState(false)
  const [copiedKey, setCopiedKey] = useState('')
  const [qrDataUrls, setQrDataUrls] = useState({ easypaisa: '', bank: '' })
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

  // Interactive 3D tilt springs
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)
  const springConfig = { damping: 24, stiffness: 260 }
  const tiltX = useSpring(mouseY, springConfig)
  const tiltY = useSpring(mouseX, springConfig)

  // Pointer & Touch 3D tilt movement
  const handlePointerMove = (e) => {
    if (isFlipped || shouldReduceMotion) return
    const clientX = e.touches && e.touches.length > 0 ? e.touches[0].clientX : e.clientX
    const clientY = e.touches && e.touches.length > 0 ? e.touches[0].clientY : e.clientY
    if (clientX === undefined || clientY === undefined) return

    const rect = e.currentTarget.getBoundingClientRect()
    const x = (clientX - rect.left) / rect.width - 0.5
    const y = (clientY - rect.top) / rect.height - 0.5
    mouseX.set(x * 14)
    mouseY.set(-y * 14)
  }

  const handlePointerLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const handleToggleFlip = () => {
    soundEffects.playBounce()
    setIsFlipped((prev) => !prev)
  }

  // Account Configurations (Easypaisa vs MCB Bank)
  const accounts = {
    easypaisa: {
      id: 'easypaisa',
      tabLabel: isUrdu ? 'ایزی پیسہ اکاؤنٹ' : 'Easypaisa Account',
      badge: 'EP',
      bankName: isUrdu ? 'ایزی پیسہ (ٹیلی نار مائیکرو فنانس بینک)' : 'Easypaisa (Telenor Microfinance Bank)',
      shortName: 'Easypaisa',
      accountTitle: 'Hanzala Muzaffar',
      cardholderName: 'HANZALA MUZAFFAR',
      accountNumber: '03462650446',
      formattedNumber: '0346 2650 446',
      raastId: '03462650446',
      formattedRaast: '0346-2650446',
      iban: 'PK60TMFB0000000039676234',
      formattedIban: 'PK60 TMFB 0000 0000 3967 6234',
      branch: isUrdu ? 'برانچ لیس بینکنگ' : 'Branchless Banking',
      whatsappNumber: '923462650446',
      tagText: isUrdu ? 'برانچ لیس بینکنگ' : 'Branchless Banking',
      cardType: 'easypaisa',
      colorTheme: {
        gradient: 'from-[#022c22] via-[#064e3b] to-[#0f172a]',
        border: 'border-emerald-500/50',
        radialGlow: 'radial-gradient(circle at 25% 25%, rgba(16, 185, 129, 0.4), transparent 60%)',
        accentBg: 'bg-emerald-600',
        accentText: 'text-emerald-400',
        accentLight: 'text-emerald-200',
        chipBorder: '#b45309',
        qrDark: '#064e3b'
      }
    },
    bank: {
      id: 'bank',
      tabLabel: isUrdu ? 'بینک اکاؤنٹ' : 'Bank Account',
      badge: 'MCB',
      bankName: isUrdu ? 'ایم سی بی بینک (یو پی موڑ برانچ)' : 'MCB Bank U.P. More Branch',
      shortName: 'MCB Bank',
      accountTitle: isUrdu ? 'عبدالمجید' : 'ABDUL MAJID',
      cardholderName: 'ABDUL MAJID',
      accountNumber: '0484677071008725',
      formattedNumber: '0484 6770 7100 8725',
      raastId: '0484677071008725',
      formattedRaast: '0484 6770 7100 8725',
      iban: 'PK89MUCB0484677071008725',
      formattedIban: 'PK89 MUCB 0484 6770 7100 8725',
      branch: isUrdu ? 'یو پی موڑ برانچ، کراچی' : 'U.P. More Branch, Karachi',
      whatsappNumber: '923462650446',
      tagText: isUrdu ? 'مسلم کمرشل بینک' : 'Muslim Commercial Bank',
      cardType: 'bank',
      colorTheme: {
        gradient: 'from-[#081b33] via-[#0f2b48] to-[#1e3a8a]',
        border: 'border-amber-400/50',
        radialGlow: 'radial-gradient(circle at 25% 25%, rgba(59, 130, 246, 0.35), transparent 60%)',
        accentBg: 'bg-blue-600',
        accentText: 'text-amber-300',
        accentLight: 'text-blue-200',
        chipBorder: '#d97706',
        qrDark: '#0f2b48'
      }
    }
  }

  const account = activeAccountTab === 'bank' ? accounts.bank : accounts.easypaisa

  // Generate official SBP Raast P2P QR Code for both accounts
  useEffect(() => {
    let isMounted = true

    const generateQrs = async () => {
      try {
        const epPayload = buildRaastP2pPayload(accounts.easypaisa.iban, accounts.easypaisa.cardholderName)
        const epUrl = await QRCode.toDataURL(epPayload, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: { dark: '#064e3b', light: '#ffffff' }
        })

        const bankPayload = buildRaastP2pPayload(accounts.bank.iban, accounts.bank.cardholderName)
        const bankUrl = await QRCode.toDataURL(bankPayload, {
          width: 320,
          margin: 2,
          errorCorrectionLevel: 'H',
          color: { dark: '#0f2b48', light: '#ffffff' }
        })

        if (isMounted) {
          setQrDataUrls({
            easypaisa: epUrl,
            bank: bankUrl
          })
        }
      } catch (err) {
        console.error('Failed to generate Raast QR code', err)
      }
    }

    generateQrs()
    return () => {
      isMounted = false
    }
  }, [])

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
      soundEffects.playBounce()
      setTimeout(() => setCopiedKey(''), 2200)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  // Pre-filled WhatsApp payment proof message tailored to current active tab
  const whatsappMessage = encodeURIComponent(
    isUrdu
      ? `السلام علیکم! میں نے سوسائٹی کے ماہانہ فنڈز منتقل کر دیے ہیں۔ ادائیگی کی رسید منسلک ہے۔\nرہائشی: ${currentUser?.name || ''} (${currentUser?.houseNumber || ''})\nبینک: ${account.bankName}\nاکاؤنٹ ٹائٹل: ${account.accountTitle}\nاکاؤنٹ نمبر: ${account.accountNumber}\nIBAN: ${account.formattedIban}`
      : `Assalam o Alaikum! I have transferred the monthly society dues. Please find the payment receipt attached.\nResident: ${currentUser?.name || ''} (${currentUser?.houseNumber || ''})\nBank: ${account.bankName}\nAccount Title: ${account.accountTitle}\nAccount Number: ${account.accountNumber}\nIBAN: ${account.formattedIban}`
  )

  const whatsappUrl = `https://wa.me/${account.whatsappNumber}?text=${whatsappMessage}`
  const currentQr = qrDataUrls[activeAccountTab] || ''

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
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
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
          <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-4">
            <div className="flex items-center gap-3">
              <div className={`size-10 rounded-2xl flex items-center justify-center shadow-xs ${
                activeAccountTab === 'bank'
                  ? 'bg-blue-600/10 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                  : 'bg-emerald-600/10 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400'
              }`}>
                {activeAccountTab === 'bank' ? <Landmark size={22} /> : <Smartphone size={22} />}
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  {isUrdu ? 'سوسائٹی فنڈز اکاؤنٹ تفصیلات' : 'Community Collection Accounts'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {isUrdu
                    ? (activeAccountTab === 'bank'
                        ? 'ماہانہ فنڈز کی بینک منتقلی کے لیے باقاعدہ ایم سی بی بینک اکاؤنٹ'
                        : 'ماہانہ فنڈز کی فوری ادائیگی کے لیے باقاعدہ ایزی پیسہ اور راست اکاؤنٹ')
                    : (activeAccountTab === 'bank'
                        ? 'Official MCB Bank passbook for direct society dues transfer'
                        : 'Official Easypaisa & Raast passbook for society dues payment')}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              aria-label="Close Modal"
            >
              <X size={20} />
            </button>
          </div>

          {/* ================= TWO TABS: EASYPAISA ACCOUNT & BANK ACCOUNT ================= */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-4">
            {/* Tab 1: Easypaisa Account */}
            <button
              type="button"
              onClick={() => {
                setActiveAccountTab('easypaisa')
                setIsFlipped(false)
                soundEffects.playBounce()
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
                activeAccountTab === 'easypaisa'
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <span className={`size-5 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                activeAccountTab === 'easypaisa'
                  ? 'bg-white text-emerald-700'
                  : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400'
              }`}>
                EP
              </span>
              <span>{isUrdu ? 'ایزی پیسہ اکاؤنٹ' : 'Easypaisa Account'}</span>
            </button>

            {/* Tab 2: Bank Account */}
            <button
              type="button"
              onClick={() => {
                setActiveAccountTab('bank')
                setIsFlipped(false)
                soundEffects.playBounce()
              }}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition-all cursor-pointer ${
                activeAccountTab === 'bank'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/25'
                  : 'text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-white/60 dark:hover:bg-slate-700/60'
              }`}
            >
              <Landmark size={16} />
              <span>{isUrdu ? 'بینک اکاؤنٹ' : 'Bank Account'}</span>
            </button>
          </div>

          {/* ================= 3D PERSPECTIVE CONTAINER ================= */}
          <div
            style={{ perspective: 1400 }}
            className="w-full flex justify-center py-1 sm:py-2"
          >
            {/* Flipping 3D Card Body (Pointer & Touch Interactive) */}
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
                stiffness: 240,
                damping: 22,
              }}
              onMouseMove={handlePointerMove}
              onMouseLeave={handlePointerLeave}
              onTouchMove={handlePointerMove}
              onTouchEnd={handlePointerLeave}
              className="relative w-full aspect-[1.586/1] min-h-[230px] sm:min-h-[265px] rounded-2xl sm:rounded-3xl shadow-2xl cursor-pointer select-none"
              onClick={handleToggleFlip}
              title={isUrdu ? 'رخ پلٹنے کے لیے کلک کریں (180° Flip)' : 'Click to flip card (180° Flip)'}
            >
              {/* ================= FRONT FACE: EXECUTIVE EMBOSSED METAL DEBIT CARD ================= */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'translateZ(1px)',
                }}
                className={`absolute inset-0 rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-gradient-to-tr ${account.colorTheme.gradient} ${account.colorTheme.border} border shadow-2xl flex flex-col justify-between overflow-hidden text-white`}
              >
                {/* Brushed Metal Sheen & Radial Light Effect */}
                <div 
                  className="pointer-events-none absolute inset-0 opacity-25" 
                  style={{
                    background: account.colorTheme.radialGlow
                  }}
                />
                <div 
                  className="pointer-events-none absolute inset-0 opacity-15"
                  style={{
                    backgroundImage: 'linear-gradient(115deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)',
                    backgroundSize: '200% 200%',
                  }}
                />

                {/* Top Row: Official Bank Branding & Contactless / EMV Chip */}
                <div className="flex items-center justify-between z-10" dir="ltr">
                  {/* Branding Badge (Top-Left) */}
                  {activeAccountTab === 'bank' ? (
                    <div className="flex items-center gap-2.5 bg-slate-950/85 border border-amber-400/40 px-3 py-1.5 rounded-2xl backdrop-blur-sm shadow-md">
                      <div className="size-6 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[10px] shadow-xs flex-shrink-0">
                        MCB
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-black tracking-tight text-white leading-none font-sans flex items-center gap-1">
                          <span className="text-amber-300 font-black">MCB</span>
                          <span className="text-white font-extrabold">Bank</span>
                        </span>
                        <span className="text-[8.5px] font-bold text-amber-200/90 tracking-tight leading-tight mt-0.5 font-sans">
                          {isUrdu ? 'یو پی موڑ برانچ • مسلم کمرشل بینک' : 'U.P. More Branch • Karachi'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2.5 bg-slate-950/80 border border-emerald-500/30 px-3 py-1.5 rounded-2xl backdrop-blur-sm shadow-md">
                      <div className="size-6 rounded-full bg-emerald-400 text-slate-950 flex items-center justify-center font-black text-[11px] shadow-xs flex-shrink-0">
                        EP
                      </div>
                      <div className="flex flex-col text-left">
                        <span className="text-sm font-black tracking-tight text-white leading-none font-sans flex items-center gap-0.5">
                          <span className="text-emerald-400 font-black">easy</span>
                          <span className="text-white font-extrabold">paisa</span>
                        </span>
                        <span className="text-[8.5px] font-bold text-emerald-200/90 tracking-tight leading-tight mt-0.5 font-sans">
                          {isUrdu ? 'برانچ لیس بینکنگ' : 'Branchless Banking'}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Top-Right: Contactless Wave & Embossed EMV Chip */}
                  <div className="flex items-center gap-2.5">
                    {/* Contactless Wave Icon */}
                    <svg className="w-5 h-5 text-amber-200/80 -rotate-90" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                      <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                      <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                      <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                      <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" />
                    </svg>

                    {/* Embossed EMV Chip SVG */}
                    <svg
                      className="w-10 h-8 sm:w-12 sm:h-9 rounded-md shadow-inner"
                      viewBox="0 0 54 44"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <rect width="54" height="44" rx="6" fill="url(#chipGrad)" stroke={account.colorTheme.chipBorder} strokeWidth="1" />
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
                  </div>
                </div>

                {/* Middle Row: Formatted Account Number & Copy Button */}
                <div className="my-auto py-1 z-10">
                  <div className={`text-[10px] sm:text-xs font-semibold ${account.colorTheme.accentLight} uppercase tracking-wider mb-0.5`}>
                    {activeAccountTab === 'bank'
                      ? (isUrdu ? 'ایم سی بی بینک اکاؤنٹ نمبر' : 'MCB Bank Account Number')
                      : (isUrdu ? 'ایزی پیسہ اکاؤنٹ نمبر' : 'Easypaisa Account Number')}
                  </div>
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div
                      dir="ltr"
                      style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                      className="font-mono text-base sm:text-xl font-black tracking-wider text-amber-100 drop-shadow-sm select-all"
                    >
                      {account.formattedNumber}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(account.accountNumber, 'acc_num')
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/15 hover:bg-white/25 border border-white/20 text-white text-xs font-bold transition-all active:scale-95 shadow-sm cursor-pointer"
                    >
                      {copiedKey === 'acc_num' ? (
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
                <div className="flex items-end justify-between gap-3 pt-2 border-t border-white/15 z-10">
                  <div className={isUrdu ? 'text-right' : 'text-left'}>
                    <span className="text-[9px] sm:text-[10px] uppercase font-bold text-slate-300 tracking-wider block">
                      {isUrdu ? 'اکاؤنٹ ٹائٹل' : 'Account Title'}
                    </span>
                    <span
                      dir="ltr"
                      style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                      className="text-xs sm:text-sm font-extrabold text-white tracking-wide uppercase font-mono select-all block"
                    >
                      {account.cardholderName}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFlip()
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-700 text-slate-950 text-xs font-black shadow-lg transition-all active:scale-95 shrink-0 cursor-pointer"
                  >
                    <RotateCw size={14} />
                    <span>{isUrdu ? 'راست کیو آر کوڈ دیکھیں ↺' : 'Flip to Raast QR ↺'}</span>
                  </button>
                </div>
              </div>

              {/* ================= BACK FACE: RAAST QR & WHATSAPP CONFIRMATION ================= */}
              <div
                style={{
                  backfaceVisibility: 'hidden',
                  WebkitBackfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg) translateZ(1px)',
                }}
                className="absolute inset-0 rounded-2xl sm:rounded-3xl p-5 sm:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 border border-slate-700/80 shadow-2xl flex flex-col justify-between overflow-hidden text-white"
              >
                {/* Magnetic Stripe with Sector 7D/1 Management branding */}
                <div className="h-8 sm:h-10 w-[calc(100%+3rem)] -mx-6 -mt-6 bg-gradient-to-r from-neutral-900 via-black to-neutral-900 border-b border-white/10 flex items-center px-6">
                  <span className="text-[8px] tracking-widest text-slate-400 uppercase font-mono font-bold">
                    {activeAccountTab === 'bank'
                      ? (isUrdu ? 'سیکٹر 7D/1 مینجمنٹ • آفیشل ایم سی بی ڈپازٹ پاس بک' : 'SECTOR 7D/1 MANAGEMENT • OFFICIAL MCB PASSBOOK')
                      : (isUrdu ? 'سیکٹر 7D/1 مینجمنٹ • آفیشل ایزی پیسہ پاس بک' : 'SECTOR 7D/1 MANAGEMENT • OFFICIAL EASYPAISA PASSBOOK')}
                  </span>
                </div>

                {/* Raast QR Preview Area */}
                <div className="flex items-center gap-4 my-auto py-1">
                  {/* High Contrast Clean Scannable Raast QR Container */}
                  <div className="bg-white p-2 rounded-2xl shadow-lg border-2 border-emerald-400/50 shrink-0 flex items-center justify-center">
                    {currentQr ? (
                      <img
                        src={currentQr}
                        alt="Official SBP Raast QR Code"
                        className="w-20 h-20 sm:w-24 sm:h-24 rounded-lg object-contain block"
                      />
                    ) : (
                      <div className="w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center bg-slate-100 rounded-lg text-slate-400 text-[10px]">
                        QR Loading...
                      </div>
                    )}
                  </div>

                  {/* Raast Details & Copy Button */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-1">
                      <div className="size-4 rounded-full bg-amber-400 text-slate-950 flex items-center justify-center font-black text-[9px] shadow-xs shrink-0">
                        R
                      </div>
                      <span className="inline-flex items-center text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-400 text-slate-950">
                        {isUrdu ? 'راست فوری ادائیگی (P2P)' : 'Raast P2P / Instant'}
                      </span>
                    </div>
                    <h4 className="text-xs sm:text-sm font-extrabold text-white">
                      {isUrdu ? 'راست آئی ڈی / اکاؤنٹ' : 'Instant Raast Payment'}
                    </h4>
                    <div
                      dir="ltr"
                      style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                      className="font-mono text-base sm:text-lg font-black text-amber-200 tracking-wider my-0.5 select-all"
                    >
                      {account.formattedRaast}
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        copyToClipboard(account.raastId, 'raast')
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/25 hover:bg-emerald-500/40 border border-emerald-400/40 text-emerald-200 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      {copiedKey === 'raast' ? (
                        <>
                          <Check size={13} className="text-emerald-400" />
                          <span>{isUrdu ? 'کاپی ہو گیا!' : 'Copied!'}</span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span>{isUrdu ? 'کاپی' : 'Copy ID'}</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Bottom Row: Direct WhatsApp Proof Action & Flip Back */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-700/60 z-10">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                  >
                    <MessageCircle size={15} />
                    <span>{isUrdu ? 'رسید واٹس ایپ کریں' : 'Send Proof on WhatsApp'}</span>
                  </a>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFlip()
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
                  >
                    <RotateCw size={13} />
                    <span>{isUrdu ? '↺ اکاؤنٹ تفصیلات' : '↺ Account Details'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Quick Copy Fields for Fast Mobile Reference */}
          <div className="mt-4 sm:mt-5 space-y-2.5">
            {/* Bank Name */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                {isUrdu ? 'بینک کا نام' : 'Bank Name'}
              </span>
              <strong className="text-slate-800 dark:text-slate-200 font-bold">
                {account.bankName}
              </strong>
            </div>

            {/* Account Title */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                {isUrdu ? 'اکاؤنٹ ٹائٹل' : 'Account Title'}
              </span>
              <div className="flex items-center gap-2">
                <strong
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                  className="text-slate-800 dark:text-slate-200 font-bold select-all font-mono"
                >
                  {account.cardholderName}
                </strong>
                <button
                  type="button"
                  onClick={() => copyToClipboard(account.cardholderName, 'title_quick')}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Copy Title"
                >
                  {copiedKey === 'title_quick' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Account Number */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                {activeAccountTab === 'bank'
                  ? (isUrdu ? 'بینک اکاؤنٹ نمبر' : 'Bank Account Number')
                  : (isUrdu ? 'ایزی پیسہ اکاؤنٹ نمبر' : 'Easypaisa Account Number')}
              </span>
              <div className="flex items-center gap-2">
                <strong
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                  className="font-mono text-slate-800 dark:text-slate-200 font-bold select-all"
                >
                  {account.accountNumber}
                </strong>
                <button
                  type="button"
                  onClick={() => copyToClipboard(account.accountNumber, 'num_quick')}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Copy Account Number"
                >
                  {copiedKey === 'num_quick' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>

            {/* Raast ID / Branch */}
            {activeAccountTab === 'easypaisa' ? (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  {isUrdu ? 'راست آئی ڈی (Raast ID)' : 'Raast ID'}
                </span>
                <div className="flex items-center gap-2">
                  <strong
                    dir="ltr"
                    style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                    className="font-mono text-slate-800 dark:text-slate-200 font-bold select-all"
                  >
                    {account.raastId}
                  </strong>
                  <button
                    type="button"
                    onClick={() => copyToClipboard(account.raastId, 'raast_quick')}
                    className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                    title="Copy Raast ID"
                  >
                    {copiedKey === 'raast_quick' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                <span className="font-semibold text-slate-500 dark:text-slate-400">
                  {isUrdu ? 'برانچ کی تفصیل' : 'Branch Details'}
                </span>
                <strong className="text-slate-800 dark:text-slate-200 font-bold">
                  {account.branch}
                </strong>
              </div>
            )}

            {/* Official IBAN */}
            <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
              <span className="font-semibold text-slate-500 dark:text-slate-400">
                {isUrdu ? 'بین الاقوامی اکاؤنٹ نمبر (IBAN)' : 'Official IBAN'}
              </span>
              <div className="flex items-center gap-2">
                <strong
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                  className="font-mono text-slate-800 dark:text-slate-200 font-bold select-all text-[11px] sm:text-xs"
                >
                  {account.formattedIban}
                </strong>
                <button
                  type="button"
                  onClick={() => copyToClipboard(account.iban, 'iban_quick')}
                  className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition cursor-pointer"
                  title="Copy IBAN"
                >
                  {copiedKey === 'iban_quick' ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                </button>
              </div>
            </div>
          </div>

          {/* Advisory Notice */}
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/60 flex items-start gap-3">
            <span className="text-amber-600 dark:text-amber-400 text-base mt-0.5">ℹ️</span>
            <p className="text-xs text-amber-900 dark:text-amber-200/90 leading-relaxed">
              {isUrdu
                ? (activeAccountTab === 'bank'
                    ? 'ایم سی بی بینک اکاؤنٹ میں رقم منتقل کرنے کے بعد رسید اپلوڈ کریں یا واٹس ایپ پر انتظامیہ کو اسکرین شاٹ بھیجیں۔'
                    : 'ایزی پیسہ یا راست سے رقم منتقل کرنے کے بعد ایپ میں رسید اپلوڈ کریں یا واٹس ایپ پر اسکرین شاٹ بھیجیں۔')
                : (activeAccountTab === 'bank'
                    ? 'After transferring dues to MCB Bank, upload your receipt directly or share a screenshot on WhatsApp for instant confirmation.'
                    : 'After transferring dues via Easypaisa or Raast, upload your receipt directly or share a screenshot on WhatsApp for instant confirmation.')}
            </p>
          </div>

          {/* ================= DUAL-CTA ACTION BAR ================= */}
          <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer text-center"
            >
              {isUrdu ? 'بند کریں' : 'Close'}
            </button>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full sm:w-auto">
              {/* 1. PRIMARY IN-APP ACTION: UPLOAD RECEIPT */}
              <button
                type="button"
                onClick={() => setIsUploadModalOpen(true)}
                className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-white text-xs font-black shadow-md transition-all active:scale-95 cursor-pointer text-center ${
                  activeAccountTab === 'bank'
                    ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-600/20'
                    : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                }`}
              >
                <UploadCloud size={16} />
                <span>{isUrdu ? 'رسید اپلوڈ کریں' : 'Upload Receipt'}</span>
              </button>

              {/* 2. SECONDARY EXTERNAL ACTION: SUBMIT ON WHATSAPP */}
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-black shadow-md transition-all active:scale-95 text-center"
              >
                <MessageCircle size={16} />
                <span>{isUrdu ? 'رسید واٹس ایپ کریں' : 'Submit on WhatsApp'}</span>
                <ExternalLink size={13} className="opacity-80" />
              </a>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Render the In-App Receipt Upload Modal */}
      <ReceiptUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        currentUser={currentUser}
        currentMonth={currentMonth}
        currentYear={currentYear}
        paymentChannel={activeAccountTab === 'bank' ? 'mcb_bank' : 'easypaisa'}
        onSuccess={() => {
          setIsUploadModalOpen(false)
          onClose()
        }}
      />
    </AnimatePresence>
  )
}

export default BankDetailsModal

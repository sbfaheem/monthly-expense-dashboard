import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BellRing,
  CheckCircle2,
  CreditCard,
  Calendar,
  X,
  Clock,
  Sparkles,
  ShieldCheck,
  Lightbulb,
  Trash2,
  Waves,
  ArrowRight,
  ArrowLeft,
  Eye
} from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { translateMonth } from '../utils/translations'
import { soundEffects } from '../utils/soundEffects'

/**
 * MonthlyPaymentReminderModal
 * 
 * Non-intrusive, smart payment reminder modal active between the 1st and 15th of the month.
 * Fully optimized for both Desktop and Mobile views.
 * Supports auto-popup on mount, desktop floating notification dock,
 * manual trigger via Desktop/Mobile bell button, bilingual English/Urdu mapping,
 * and seamless hand-off to BankDetailsModal for receipt upload.
 */
export default function MonthlyPaymentReminderModal({
  isOpen: controlledIsOpen,
  onClose: controlledOnClose,
  onOpen: controlledOnOpen,
  currentMonthKey = '',
  selectedMonth = '',
  selectedYear = '',
  resident = null,
  onPayDues = () => {},
  isAdmin = false
}) {
  const { lang } = useLanguage ? useLanguage() : { lang: 'en' }
  const isUrdu = lang === 'ur'

  const [internalOpen, setInternalOpen] = useState(false)
  const [isThankYou, setIsThankYou] = useState(false)
  const [isFloatingDismissed, setIsFloatingDismissed] = useState(false)

  // Current calendar day check: Active strictly between 1st and 15th
  const today = new Date()
  const currentDay = today.getDate()
  const isInWindow = currentDay >= 1 && currentDay <= 15

  // Month key for scoped localStorage
  const rawMonthKey = currentMonthKey || `${selectedMonth || 'Current'} ${selectedYear || today.getFullYear()}`
  const monthKey = rawMonthKey.trim().replace(/\s+/g, '_')
  const dismissedKey = `reminder_dismissed_${monthKey}`
  const snoozedKey = `reminder_snoozed_${monthKey}`

  // Combined modal open state (controlled prop takes priority if passed)
  const isModalOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalOpen

  // Reset thank you screen if explicitly opened from header
  useEffect(() => {
    if (controlledIsOpen) {
      setIsThankYou(false)
    }
  }, [controlledIsOpen])

  // Initial appearance check with non-intrusive 1.8s delay (Desktop & Mobile)
  useEffect(() => {
    if (!isInWindow) return

    try {
      if (typeof window !== 'undefined') {
        const dismissed =
          localStorage.getItem(dismissedKey) === 'paid' ||
          localStorage.getItem(`reminder_dismissed_${rawMonthKey}`) === 'paid'
        const snoozedUntil = Number(localStorage.getItem(snoozedKey) || 0)
        const now = Date.now()

        // If already marked as paid for this cycle or snoozed within 24h, stay hidden from auto-popup
        if (dismissed || (snoozedUntil && now < snoozedUntil)) {
          return
        }

        // 1.8-second delay allows resident to orient with the dashboard first
        const timer = setTimeout(() => {
          if (controlledOnOpen) {
            controlledOnOpen()
          } else {
            setInternalOpen(true)
          }
        }, 1800)

        return () => clearTimeout(timer)
      }
    } catch (e) {
      // Graceful fallback if localStorage is blocked
    }
  }, [isInWindow, dismissedKey, snoozedKey, rawMonthKey, controlledOnOpen])

  // Handle "Pay Dues / View Bank Details" click
  const handlePayNow = () => {
    try {
      soundEffects.playBounce()
    } catch (e) {}
    closeModal()
    if (onPayDues) {
      onPayDues()
    }
  }

  // Handle "Already Paid" click
  const handleAlreadyPaid = () => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.setItem(dismissedKey, 'paid')
        localStorage.setItem(`reminder_dismissed_${rawMonthKey}`, 'paid')
      }
      soundEffects.playSurplusReaction(isUrdu)
    } catch (e) {}

    setIsThankYou(true)
  }

  // Close helper
  const closeModal = () => {
    if (controlledOnClose) {
      controlledOnClose()
    }
    setInternalOpen(false)
  }

  // Handle modal X or backdrop dismiss (silences auto-popup for 24h to avoid nagging)
  const handleClose = () => {
    try {
      if (typeof window !== 'undefined') {
        const snoozeTimestamp = Date.now() + 24 * 60 * 60 * 1000
        localStorage.setItem(snoozedKey, String(snoozeTimestamp))
      }
      soundEffects.playBounce()
    } catch (e) {}
    closeModal()
  }

  // Auto-dismiss Thank You screen after 4 seconds
  useEffect(() => {
    if (isThankYou) {
      const timer = setTimeout(() => {
        closeModal()
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [isThankYou])

  const displayMonth = isUrdu ? translateMonth(selectedMonth || rawMonthKey, 'ur') : (selectedMonth || rawMonthKey)

  return (
    <>
      {/* ================================================================ */}
      {/* 1. DESKTOP FLOATING NOTIFICATION DOCK (Visible on desktop)        */}
      {/* ================================================================ */}
      {!isModalOpen && !isFloatingDismissed && isInWindow && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.95 }}
          transition={{ type: 'spring', damping: 24, stiffness: 280 }}
          className={`fixed bottom-6 z-40 hidden lg:flex items-center gap-3 p-3.5 pl-4 rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-emerald-500/30 dark:border-emerald-500/20 shadow-2xl shadow-emerald-950/20 max-w-md transition-all hover:border-emerald-500/60 ${
            isUrdu ? 'left-6 font-urdu' : 'right-6'
          }`}
          dir={isUrdu ? 'rtl' : 'ltr'}
        >
          {/* Bell Icon with Radar Ping */}
          <div className="relative shrink-0 p-2.5 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-xl shadow-md shadow-emerald-500/25">
            <motion.div
              animate={{ rotate: [0, -10, 10, -8, 8, 0] }}
              transition={{ repeat: Infinity, repeatDelay: 3, duration: 0.8 }}
            >
              <BellRing size={19} />
            </motion.div>
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
            </span>
          </div>

          {/* Dock Text Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/50">
                <Calendar size={10} />
                <span>{isUrdu ? 'یکم تا 15 تاریخ' : '1st – 15th'}</span>
              </span>
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 truncate">
                {displayMonth}
              </span>
            </div>
            <p className="text-xs font-black text-slate-900 dark:text-white truncate mt-0.5">
              {isUrdu ? 'ماہانہ سوسائٹی فنڈز کی یاد دہانی' : 'Maintenance Due Notice'}
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                if (controlledOnOpen) {
                  controlledOnOpen()
                } else {
                  setInternalOpen(true)
                }
              }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-black shadow-sm transition-all active:scale-95 cursor-pointer"
            >
              <Eye size={13} />
              <span>{isUrdu ? 'دیکھیں' : 'View'}</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFloatingDismissed(true)}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              title={isUrdu ? 'چھپائیں' : 'Dismiss widget'}
              aria-label="Dismiss widget"
            >
              <X size={15} />
            </button>
          </div>
        </motion.div>
      )}

      {/* ================================================================ */}
      {/* 2. FULL INTERACTIVE MODAL (Desktop & Mobile)                      */}
      {/* ================================================================ */}
      <AnimatePresence>
        {isModalOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-sm overflow-y-auto"
            dir={isUrdu ? 'rtl' : 'ltr'}
          >
            {/* Backdrop click to dismiss */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="fixed inset-0 cursor-pointer"
            />

            {/* Modal Dialog Card (Optimized for Desktop & Mobile) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 16 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative z-10 w-full max-w-lg md:max-w-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl shadow-emerald-950/20 overflow-hidden my-auto"
            >
              {/* Top Decorative Emerald Glow Bar */}
              <div className="h-2 w-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-600" />

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors cursor-pointer z-20"
                title={isUrdu ? 'بند کریں' : 'Dismiss'}
                aria-label="Close"
              >
                <X size={18} />
              </button>

              {!isThankYou ? (
                /* -------------------------------------------------------- */
                /* 2A. INITIAL REMINDER NOTICE                              */
                /* -------------------------------------------------------- */
                <div className="p-6 sm:p-7 md:p-8">
                  {/* Header Badge: Active Window (1st – 15th) */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-extrabold tracking-wide bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/60 shadow-xs">
                      <Calendar size={13} className="text-emerald-600 dark:text-emerald-400" />
                      <span className={isUrdu ? 'font-urdu' : ''}>
                        {isUrdu ? 'ادائیگی کی مدت: ماہ کی یکم سے 15 تاریخ' : 'Payment Window: 1st – 15th of the Month'}
                      </span>
                    </span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60">
                      <Clock size={11} />
                      <span className={isUrdu ? 'font-urdu' : ''}>{isUrdu ? 'فعال' : 'Active Cycle'}</span>
                    </span>
                  </div>

                  {/* Title & Icon Header */}
                  <div className="flex items-start gap-3.5 mb-3">
                    <div className="relative shrink-0 p-3 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-2xl shadow-lg shadow-emerald-500/25">
                      <motion.div
                        animate={{ rotate: [0, -12, 12, -8, 8, 0] }}
                        transition={{ repeat: Infinity, repeatDelay: 3.5, duration: 0.8 }}
                      >
                        <BellRing size={24} />
                      </motion.div>
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500" />
                      </span>
                    </div>

                    <div className="flex-1">
                      <h3
                        className={`text-lg sm:text-xl md:text-2xl font-black text-slate-900 dark:text-white leading-tight ${
                          isUrdu ? 'font-urdu' : ''
                        }`}
                      >
                        {isUrdu
                          ? 'ماہانہ سوسائٹی فنڈز کی ادائیگی کی یاد دہانی'
                          : 'Monthly Maintenance Due Reminder'}
                      </h3>
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {displayMonth}
                      </p>
                    </div>
                  </div>

                  {/* Body Text */}
                  <div className="mt-3.5 p-4 sm:p-4.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                    <p
                      className={`text-xs sm:text-[13px] md:text-sm leading-relaxed text-slate-700 dark:text-slate-300 font-medium ${
                        isUrdu ? 'font-urdu text-[14px] md:text-[15px] leading-loose text-slate-800 dark:text-slate-200' : ''
                      }`}
                    >
                      {isUrdu
                        ? 'معزز رہائشی، برائے مہربانی یکم سے 15 تاریخ کے درمیان ماہانہ مینٹیننس فنڈز کی ادائیگی یقینی بنائیں تاکہ سویپنگ و سیوریج، سیکیورٹی، اسٹریٹ لائٹس اور صفائی کے تمام انتظامات بلا تعطل جاری رہ سکیں۔'
                        : 'Dear Resident, kindly clear your monthly maintenance dues between the 1st and 15th to ensure uninterrupted Sweeping & Sewerage, Security, Street Lights, and Sanitation Services.'}
                    </p>
                  </div>

                  {/* Essential Services Highlights */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-blue-700 dark:text-blue-300">
                      <Waves size={14} className="shrink-0 text-blue-600 dark:text-blue-400" />
                      <span className={`text-[11px] font-bold truncate ${isUrdu ? 'font-urdu' : ''}`}>
                        {isUrdu ? 'سویپنگ و سیوریج' : 'Sweeping & Sewerage'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-100 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300">
                      <ShieldCheck size={14} className="shrink-0 text-emerald-600 dark:text-emerald-400" />
                      <span className={`text-[11px] font-bold truncate ${isUrdu ? 'font-urdu' : ''}`}>
                        {isUrdu ? '24/7 سیکیورٹی' : 'Security Guard'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/40 text-amber-700 dark:text-amber-300">
                      <Lightbulb size={14} className="shrink-0 text-amber-600 dark:text-amber-400" />
                      <span className={`text-[11px] font-bold truncate ${isUrdu ? 'font-urdu' : ''}`}>
                        {isUrdu ? 'اسٹریٹ لائٹس' : 'Street Lights'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 p-2 rounded-xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 text-purple-700 dark:text-purple-300">
                      <Trash2 size={14} className="shrink-0 text-purple-600 dark:text-purple-400" />
                      <span className={`text-[11px] font-bold truncate ${isUrdu ? 'font-urdu' : ''}`}>
                        {isUrdu ? 'صفائی کے انتظامات' : 'Sanitation'}
                      </span>
                    </div>
                  </div>

                  {/* Resident Context Badge (if available) */}
                  {resident && (resident.name || resident.houseAddress || resident.houseNo) && (
                    <div className="mt-3.5 flex items-center justify-between px-3 py-1.5 rounded-xl bg-slate-100/70 dark:bg-slate-800/70 text-slate-600 dark:text-slate-300 text-[11px]">
                      <span className="font-semibold truncate">
                        {resident.name ? `👤 ${resident.name}` : '👤 Resident'}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 dark:text-slate-400">
                        {resident.houseAddress || resident.houseNo || 'Sector 7D/1'}
                      </span>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="mt-6 space-y-2.5">
                    {/* Button 1 (Not Paid / Pay Now): Opens Bank Details Modal */}
                    <button
                      onClick={handlePayNow}
                      className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-xs sm:text-sm font-extrabold rounded-2xl shadow-lg shadow-emerald-600/25 hover:shadow-emerald-600/40 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
                    >
                      <CreditCard size={17} />
                      <span className={isUrdu ? 'font-urdu font-bold text-sm' : ''}>
                        {isUrdu ? 'ابھی فنڈز ادا کریں / بینک تفصیلات' : 'Pay Dues / View Bank Details'}
                      </span>
                      {isUrdu ? <ArrowLeft size={16} /> : <ArrowRight size={16} />}
                    </button>

                    {/* Button 2 (Already Paid): Transitions to rewarding Thank You screen */}
                    <button
                      onClick={handleAlreadyPaid}
                      className="w-full py-3 px-4 bg-slate-100 hover:bg-slate-200/90 dark:bg-slate-800 dark:hover:bg-slate-700/80 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-slate-200 dark:border-slate-700 active:scale-98"
                    >
                      <CheckCircle2 size={16} className="text-emerald-600 dark:text-emerald-400" />
                      <span className={isUrdu ? 'font-urdu' : ''}>
                        {isUrdu ? 'میں ادا کر چکا ہوں' : 'Already Paid'}
                      </span>
                    </button>
                  </div>
                </div>
              ) : (
                /* -------------------------------------------------------- */
                /* 2B. REWARDING THANK YOU STATE                            */
                /* -------------------------------------------------------- */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.25 }}
                  className="p-8 text-center"
                >
                  {/* Green Checkmark Celebration Badge */}
                  <div className="relative inline-block mb-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner border border-emerald-300 dark:border-emerald-700">
                      <CheckCircle2 size={36} className="animate-bounce" />
                    </div>
                    <Sparkles size={18} className="absolute -top-1 -right-1 text-amber-400 animate-spin" />
                  </div>

                  {/* Thank You Title */}
                  <h3
                    className={`text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight ${
                      isUrdu ? 'font-urdu' : ''
                    }`}
                  >
                    {isUrdu ? 'آپ کے بروقت تعاون کا بہت شکریہ!' : 'Thank You for Your Cooperation!'}
                  </h3>

                  {/* Thank You Body */}
                  <p
                    className={`mt-2.5 text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-sm mx-auto leading-relaxed ${
                      isUrdu ? 'font-urdu text-sm leading-loose' : ''
                    }`}
                  >
                    {isUrdu
                      ? 'آپ کی بروقت ادائیگی ہمارے محلے کے تمام انتظامات کو بہترین انداز میں چلانے میں مددگار ثابت ہوتی ہے۔'
                      : 'Your contribution keeps our community thriving and running smoothly.'}
                  </p>

                  {/* Recorded Status Pill */}
                  <div className="mt-5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <ShieldCheck size={14} />
                    <span className={isUrdu ? 'font-urdu' : ''}>
                      {isUrdu
                        ? `${displayMonth} کے فنڈز ریکارڈ کر لیے گئے ہیں`
                        : `Recorded as Paid for ${displayMonth}`}
                    </span>
                  </div>

                  {/* Done / Close Button */}
                  <div className="mt-6">
                    <button
                      onClick={closeModal}
                      className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-slate-100 dark:hover:bg-white text-white dark:text-slate-900 text-xs sm:text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer active:scale-98"
                    >
                      <span className={isUrdu ? 'font-urdu' : ''}>
                        {isUrdu ? 'مکمل / بند کریں' : 'Done'}
                      </span>
                    </button>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

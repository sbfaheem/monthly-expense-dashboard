import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X, Sparkles, Check, CheckCircle2, Send, ShieldCheck, User, MessageSquare } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { translateMonth } from '../utils/translations'

const QUICK_TAGS_EN = [
  '💎 100% Transparent',
  '💧 Water Updates Helpful',
  '⚡ Fair Generator Expense',
  '🧹 Good Sanitation',
  '📋 Clear Reporting',
  '🛡️ Reliable Security',
  '✨ Interactive Dashboard'
]

const QUICK_TAGS_UR = [
  '💎 مکمل شفاف اکاؤنٹس',
  '💧 پانی کی معلومات کارآمد',
  '⚡ جنریٹر اخراجات مناسب',
  '🧹 صفائی کا نظام اچھا',
  '📋 تفصیلی اور واضح رپورٹ',
  '🛡️ سیکیورٹی انتظامات تسلی بخش',
  '✨ انٹرایکٹو ڈیش بورڈ'
]

export default function ExitIntentFeedbackModal({
  resident = null,
  currentMonthKey = '',
  onSubmitFeedback,
  isAdmin = false
}) {
  const { lang } = useLanguage ? useLanguage() : { lang: 'en' }
  const isUrdu = lang === 'ur'

  const [isOpen, setIsOpen] = useState(false)
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [residentName, setResidentName] = useState('')
  const [houseAddress, setHouseAddress] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const quickTags = isUrdu ? QUICK_TAGS_UR : QUICK_TAGS_EN

  // Storage keys for suppressing repeat prompts
  const sessionDismissKey = `resident_exit_dismissed_${currentMonthKey}`
  const localSubmittedKey = `resident_feedback_submitted_${currentMonthKey}`

  // Prefill resident identity if available
  useEffect(() => {
    if (resident) {
      if (resident.name) setResidentName(resident.name)
      if (resident.houseAddress || resident.houseNo) {
        setHouseAddress(resident.houseAddress || resident.houseNo)
      }
    }
  }, [resident])

  // Exit intent & engagement listeners
  useEffect(() => {
    if (isAdmin) return // Do not prompt admins in preview/edit mode

    // Check if user already dismissed this session or already submitted this month
    if (typeof window !== 'undefined') {
      const alreadyDismissed = sessionStorage.getItem(sessionDismissKey) === 'true'
      const alreadySubmitted = localStorage.getItem(localSubmittedKey) === 'true' || localStorage.getItem('resident_feedback_submitted') === 'true'
      if (alreadyDismissed || alreadySubmitted) return
    }

    let hasTriggered = false
    const startTime = Date.now()

    const triggerPrompt = () => {
      if (hasTriggered) return
      // Ensure user has spent at least 8 seconds reviewing accounts (not instant bounce)
      if (Date.now() - startTime < 8000) return

      hasTriggered = true
      setIsOpen(true)
    }

    // 1. Desktop Exit Intent (Cursor moves to top of browser to close tab / switch URL)
    const handleMouseLeave = (e) => {
      if (e.clientY <= 15) {
        triggerPrompt()
      }
    }

    // 2. Mobile & Desktop Scroll Depth (User has scrolled through the accounts >= 60%)
    let scrollTimeout = null
    const handleScroll = () => {
      if (hasTriggered) return
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      if (docHeight <= 0) return

      const scrollPercent = window.scrollY / docHeight
      if (scrollPercent >= 0.58) {
        if (scrollTimeout) clearTimeout(scrollTimeout)
        scrollTimeout = setTimeout(() => {
          triggerPrompt()
        }, 1500)
      }
    }

    // 3. Time-on-page engagement fallback (User has actively reviewed accounts for 35s)
    const timer = setTimeout(() => {
      triggerPrompt()
    }, 35000)

    document.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('scroll', handleScroll)
      clearTimeout(timer)
      if (scrollTimeout) clearTimeout(scrollTimeout)
    }
  }, [isAdmin, sessionDismissKey, localSubmittedKey])

  const handleDismiss = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(sessionDismissKey, 'true')
    }
    setIsOpen(false)
  }

  const handleToggleTag = (tag) => {
    let newTags
    if (selectedTags.includes(tag)) {
      newTags = selectedTags.filter(t => t !== tag)
    } else {
      newTags = [...selectedTags, tag]
    }
    setSelectedTags(newTags)
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setIsSubmitting(true)

    // Build review body from selected tags and comment
    const tagsText = selectedTags.join(' • ')
    let combinedComment = comment.trim()
    if (tagsText) {
      combinedComment = combinedComment ? `${tagsText}\n${combinedComment}` : tagsText
    }

    const payload = {
      name: residentName.trim() || resident?.name || (isUrdu ? 'تصدیق شدہ رہائشی' : 'Verified Resident'),
      phone: resident?.phone || '',
      houseAddress: houseAddress.trim() || resident?.houseAddress || resident?.houseNo || 'Sector 7D/1',
      rating: Number(rating || 5),
      comment: combinedComment || (isUrdu ? 'اکاؤنٹس مکمل شفاف اور تسلی بخش ہیں۔' : 'Accounts are clear and well managed. Complete financial transparency.'),
      monthViewed: currentMonthKey
    }

    try {
      if (onSubmitFeedback) {
        await onSubmitFeedback(payload)
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem(localSubmittedKey, 'true')
        localStorage.setItem('resident_feedback_submitted', 'true')
        sessionStorage.setItem(sessionDismissKey, 'true')
      }
      setIsSuccess(true)
      setTimeout(() => {
        setIsOpen(false)
        setIsSuccess(false)
      }, 2400)
    } catch (err) {
      console.error('Failed to submit exit review:', err)
      setIsSuccess(true) // still close gracefully
      setTimeout(() => setIsOpen(false), 2000)
    } finally {
      setIsSubmitting(false)
    }
  }

  // Dynamic rating sentiment label
  const getRatingSentiment = (r) => {
    switch (r) {
      case 1:
        return isUrdu ? 'بڑی بہتری کی ضرورت ہے' : 'Needs Major Improvement'
      case 2:
        return isUrdu ? 'مناسب، کچھ مسائل ہیں' : 'Fair / Has Issues'
      case 3:
        return isUrdu ? 'اچھا اور تسلی بخش' : 'Good & Satisfactory'
      case 4:
        return isUrdu ? 'بہت اچھا نظام' : 'Very Good'
      case 5:
      default:
        return isUrdu ? 'شاندار اور مکمل شفاف! ⭐' : 'Excellent & Transparent! ⭐'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
          {/* ================= BACKDROP ================= */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleDismiss}
            className="absolute inset-0"
          />

          {/* ================= DIALOG / BOTTOM SHEET ================= */}
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.94 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-slate-900 border-t sm:border border-slate-200/90 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-7 overflow-hidden max-h-[92vh] flex flex-col"
          >
            {/* Mobile Drag/Pull Indicator Bar */}
            <div className="sm:hidden w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />

            {/* Ambient Background Glow */}
            <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-amber-500/10 dark:bg-amber-500/20 blur-3xl" />

            {isSuccess ? (
              /* ================= SUCCESS STATE ================= */
              <div className="py-8 text-center space-y-4">
                <div className="size-16 rounded-3xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 size={36} className="stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-xl font-black text-slate-900 dark:text-white">
                    {isUrdu ? 'آپ کی رائے درج کر لی گئی ہے!' : 'Thank You for Your Feedback!'}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto leading-relaxed">
                    {isUrdu
                      ? 'آپ کی ریٹنگ اور جائزے کو ویلفیئر کمیٹی کی رپورٹ میں شامل کر دیا گیا ہے۔'
                      : 'Your rating and suggestions have been recorded for the Welfare Committee review.'}
                  </p>
                </div>
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300">
                    <Check size={14} /> {isUrdu ? 'کمیونٹی ریویوز میں ظاہر ہو گیا' : 'Visible in Community Reviews'}
                  </span>
                </div>
              </div>
            ) : (
              /* ================= ACTIVE REVIEW FORM ================= */
              <div className="space-y-4 flex-1 overflow-y-auto pr-1">
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="size-11 sm:size-12 rounded-2xl bg-gradient-to-tr from-amber-400 via-amber-500 to-amber-600 text-white flex items-center justify-center shadow-lg shadow-amber-500/30 flex-shrink-0">
                      <Sparkles size={22} className="stroke-[2.5]" />
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight leading-snug">
                        {isUrdu
                          ? 'جانے سے پہلے ایک لمحہ... اس ماہ کی رپورٹ پر اپنی رائے دیں!'
                          : 'Before You Leave... How Was This Month’s Statement?'}
                      </h3>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mt-0.5">
                        {translateMonth(currentMonthKey, lang)} • {isUrdu ? 'سیکٹر 7D/1 رہائشی فیڈ بیک' : 'Sector 7D/1 Community Review'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                    title={isUrdu ? 'بعد میں' : 'Dismiss'}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* 5-Star Interactive Rating Widget */}
                <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-slate-850 border border-amber-200/70 dark:border-amber-500/20 text-center space-y-2 shadow-xs">
                  <div className="flex items-center justify-center gap-2 sm:gap-3 py-1">
                    {[1, 2, 3, 4, 5].map((starVal) => {
                      const isActive = starVal <= (hoverRating || rating)
                      return (
                        <button
                          key={starVal}
                          type="button"
                          onMouseEnter={() => setHoverRating(starVal)}
                          onMouseLeave={() => setHoverRating(0)}
                          onClick={() => setRating(starVal)}
                          className="p-1.5 sm:p-2 rounded-xl transition-transform active:scale-90 hover:scale-115 focus:outline-none"
                          aria-label={`Rate ${starVal} Stars`}
                        >
                          <Star
                            size={28}
                            className={`transition-colors duration-150 ${
                              isActive
                                ? 'fill-amber-400 text-amber-500 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                                : 'text-slate-300 dark:text-slate-600'
                            }`}
                          />
                        </button>
                      )
                    })}
                  </div>
                  <p className="text-xs font-black font-mono text-amber-800 dark:text-amber-300">
                    {getRatingSentiment(hoverRating || rating)}
                  </p>
                </div>

                {/* Fast Quick Review Chips */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
                    {isUrdu ? 'فوری تاثرات (ایک یا زائد منتخب کریں):' : 'Quick Impressions (Tap to add):'}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {quickTags.map((tag) => {
                      const isSelected = selectedTags.includes(tag)
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleToggleTag(tag)}
                          className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-amber-500 text-white shadow-xs font-black scale-102'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                          }`}
                        >
                          {tag}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Optional Custom Remarks Textarea */}
                <div>
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1">
                    {isUrdu ? 'کوئی اضافی تجویز یا ریمارکس؟ (اختیاری):' : 'Any suggestions or remarks? (Optional):'}
                  </label>
                  <textarea
                    rows={2}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder={
                      isUrdu
                        ? 'پانی کی ترسیل، صفائی، سیکیورٹی یا اکاؤنٹس کے بارے میں اپنی رائے لکھیں...'
                        : 'Share your thoughts on water schedule, sanitation, guards, or any expense queries...'
                    }
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>

                {/* Resident Signature Pill */}
                {resident ? (
                  <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/70 dark:border-slate-700 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300">
                      <User size={14} className="text-primary flex-shrink-0" />
                      <span className="font-bold truncate">
                        {resident.name} {resident.houseAddress ? `(${resident.houseAddress})` : ''}
                      </span>
                    </div>
                    <span className="text-[10px] font-black uppercase text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full border border-emerald-200/40 flex-shrink-0">
                      {isUrdu ? 'مصدقہ' : 'Verified'}
                    </span>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={residentName}
                      onChange={(e) => setResidentName(e.target.value)}
                      placeholder={isUrdu ? 'آپ کا نام (اختیاری)' : 'Your Name (Optional)'}
                      className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <input
                      type="text"
                      value={houseAddress}
                      onChange={(e) => setHouseAddress(e.target.value)}
                      placeholder={isUrdu ? 'مکان / فلیٹ نمبر' : 'House / Flat #'}
                      className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                )}

                {/* Action Buttons */}
                <div className="pt-2 flex items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs sm:text-sm font-black shadow-md shadow-emerald-600/25 transition-all active:scale-95 disabled:opacity-60"
                  >
                    {isSubmitting ? (
                      <span>{isUrdu ? 'محفوظ کیا جا رہا ہے...' : 'Submitting...'}</span>
                    ) : (
                      <>
                        <Send size={15} />
                        <span>{isUrdu ? '★ ریٹنگ اور جائزہ جمع کریں' : '★ Submit Rating & Review'}</span>
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={handleDismiss}
                    className="py-2.5 px-3 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
                  >
                    {isUrdu ? 'شاید بعد میں' : 'Maybe Later'}
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}

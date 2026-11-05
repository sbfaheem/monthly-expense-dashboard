import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Star, X, Sparkles, Check, CheckCircle2, Send, ShieldCheck, User, MessageSquare, ThumbsUp, ChevronUp } from 'lucide-react'
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

  // Modal & Dock Visibility States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isPromptVisible, setIsPromptVisible] = useState(false)
  const [isMinimized, setIsMinimized] = useState(false)

  // Form States
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [selectedTags, setSelectedTags] = useState([])
  const [residentName, setResidentName] = useState('')
  const [houseAddress, setHouseAddress] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)

  const quickTags = isUrdu ? QUICK_TAGS_UR : QUICK_TAGS_EN

  const hasTriggeredExitRef = useRef(false)
  const lastScrollYRef = useRef(0)
  const maxScrollYRef = useRef(0)

  // Storage key for user dismissing in current tab session
  const sessionDismissKey = `resident_prompt_minimized_${currentMonthKey}`

  // Prefill resident identity
  useEffect(() => {
    if (resident) {
      if (resident.name) setResidentName(resident.name)
      if (resident.houseAddress || resident.houseNo) {
        setHouseAddress(resident.houseAddress || resident.houseNo)
      }
    }
  }, [resident])

  // Initial timer to gently show floating rating prompt while checking dashboard
  useEffect(() => {
    if (isAdmin) return

    // Show prompt after 3 seconds of checking dashboard if not dismissed
    const timer = setTimeout(() => {
      const alreadyMinimized = typeof window !== 'undefined' && sessionStorage.getItem(sessionDismissKey) === 'true'
      if (alreadyMinimized) {
        setIsMinimized(true)
      } else {
        setIsPromptVisible(true)
      }
    }, 3000)

    return () => clearTimeout(timer)
  }, [isAdmin, sessionDismissKey])

  // Exit-Intent Listeners (Desktop MouseLeave & Mobile Scroll-Up Exit Pattern)
  useEffect(() => {
    if (isAdmin) return

    // 1. Desktop: Cursor moves toward browser tabs or close button
    const handleMouseLeave = (e) => {
      if (hasTriggeredExitRef.current) return
      // Top of browser window
      if (!e.clientY || e.clientY <= 25) {
        hasTriggeredExitRef.current = true
        setIsModalOpen(true)
        setIsPromptVisible(false)
      }
    }

    // 2. Mobile & Desktop: Scroll behavior detection
    const handleScroll = () => {
      const currentY = window.scrollY
      if (currentY > maxScrollYRef.current) {
        maxScrollYRef.current = currentY
      }

      // Show docked prompt if user has started scrolling through dashboard
      if (currentY > 200 && !isMinimized && !isModalOpen) {
        setIsPromptVisible(true)
      }

      // Mobile exit pattern: User scrolled down past 400px, then scrolls UP rapidly toward browser bar
      if (
        maxScrollYRef.current > 600 &&
        currentY < lastScrollYRef.current - 70 &&
        !hasTriggeredExitRef.current &&
        !isModalOpen
      ) {
        hasTriggeredExitRef.current = true
        setIsModalOpen(true)
        setIsPromptVisible(false)
      }

      lastScrollYRef.current = currentY
    }

    document.documentElement.addEventListener('mouseleave', handleMouseLeave)
    window.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      document.documentElement.removeEventListener('mouseleave', handleMouseLeave)
      window.removeEventListener('scroll', handleScroll)
    }
  }, [isAdmin, isMinimized, isModalOpen])

  // Handle Quick Star Click from Floating Bar -> Opens detailed modal with that rating
  const handleQuickStarClick = (starVal) => {
    setRating(starVal)
    setIsModalOpen(true)
    setIsPromptVisible(false)
  }

  // Handle minimizing floating prompt
  const handleMinimizePrompt = () => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(sessionDismissKey, 'true')
    }
    setIsPromptVisible(false)
    setIsMinimized(true)
  }

  // Handle closing modal
  const handleCloseModal = () => {
    setIsModalOpen(false)
    setIsMinimized(true)
  }

  // Toggle quick tags
  const handleToggleTag = (tag) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  // Submit Feedback
  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    setIsSubmitting(true)

    // Build comment body
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
      setIsSuccess(true)
      setTimeout(() => {
        setIsModalOpen(false)
        setIsSuccess(false)
        setIsMinimized(true)
      }, 2200)
    } catch (err) {
      console.error('Failed to submit exit review:', err)
      setIsSuccess(true)
      setTimeout(() => {
        setIsModalOpen(false)
        setIsMinimized(true)
      }, 2000)
    } finally {
      setIsSubmitting(false)
    }
  }

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
    <>
      {/* =========================================================================
          1. FLOATING QUICK-RATING DOCK (Appears while reviewing dashboard)
      ========================================================================== */}
      <AnimatePresence>
        {isPromptVisible && !isModalOpen && !isMinimized && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ type: 'spring', damping: 22, stiffness: 260 }}
            className="fixed bottom-3 right-3 left-3 sm:left-auto sm:right-6 sm:bottom-6 z-40 sm:max-w-md bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl border border-amber-300 dark:border-amber-500/30 rounded-2xl sm:rounded-3xl shadow-2xl p-3.5 sm:p-4 text-slate-800 dark:text-slate-100"
          >
            {/* Top Bar: Title & Close Button */}
            <div className="flex items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="size-7 rounded-xl bg-gradient-to-tr from-amber-400 to-amber-600 text-white flex items-center justify-center shadow-sm shadow-amber-500/30 flex-shrink-0 animate-pulse">
                  <Star size={14} className="fill-white" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-xs sm:text-sm font-black text-slate-900 dark:text-white truncate">
                    {isUrdu ? 'شفاف اکاؤنٹس پر اپنی رائے دیں' : 'Rate Before You Leave'}
                  </h4>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none">
                    {translateMonth(currentMonthKey, lang)} • {isUrdu ? '1 سیکنڈ میں فیڈ بیک' : 'Takes 5 seconds'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleMinimizePrompt}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                title={isUrdu ? 'چھپائیں' : 'Minimize'}
              >
                <X size={16} />
              </button>
            </div>

            {/* Middle: 5 Interactive Stars (Tap to rate & expand) */}
            <div className="bg-amber-50/70 dark:bg-slate-800/80 rounded-xl p-2 sm:p-2.5 flex items-center justify-between gap-1 border border-amber-200/60 dark:border-amber-500/20 mb-2.5">
              <span className="text-[11px] font-bold text-amber-900 dark:text-amber-300 pl-1">
                {isUrdu ? 'ریٹنگ منتخب کریں:' : 'Tap to rate:'}
              </span>
              <div className="flex items-center gap-1 sm:gap-1.5">
                {[1, 2, 3, 4, 5].map((starVal) => (
                  <button
                    key={starVal}
                    type="button"
                    onClick={() => handleQuickStarClick(starVal)}
                    className="p-1 rounded-lg transition-transform hover:scale-125 active:scale-95 focus:outline-none"
                    title={`Rate ${starVal} Star${starVal > 1 ? 's' : ''}`}
                  >
                    <Star
                      size={22}
                      className="fill-amber-400 text-amber-500 drop-shadow-xs"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Bottom Row: Expand Button */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(true)
                  setIsPromptVisible(false)
                }}
                className="flex-1 py-1.5 px-3 rounded-xl bg-primary hover:bg-primary-hover text-white text-[11px] sm:text-xs font-black shadow-sm transition-all active:scale-95 text-center"
              >
                {isUrdu ? 'تفصیلی رائے اور تاثرات درج کریں ↗' : 'Leave Review & Suggestions ↗'}
              </button>
              <button
                type="button"
                onClick={handleMinimizePrompt}
                className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold text-slate-500 hover:text-slate-700 dark:text-slate-400"
              >
                {isUrdu ? 'بعد میں' : 'Later'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* =========================================================================
          2. MINIMIZED FLOATING BADGE (Unobtrusive Corner Pill)
      ========================================================================== */}
      <AnimatePresence>
        {isMinimized && !isModalOpen && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => {
              setIsMinimized(false)
              setIsModalOpen(true)
            }}
            className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black text-xs shadow-xl shadow-amber-500/30 hover:scale-105 active:scale-95 transition-all border border-amber-300/40"
            title={isUrdu ? 'ڈیش بورڈ ریٹنگ دیں' : 'Rate Monthly Accounts'}
          >
            <Star size={16} className="fill-white" />
            <span>{isUrdu ? 'ریٹنگ دیں' : 'Rate Accounts'}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* =========================================================================
          3. FULL DETAIL PRE-EXIT REVIEW MODAL (Desktop Dialog / Mobile Bottom Sheet)
      ========================================================================== */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseModal}
              className="absolute inset-0"
            />

            {/* Dialog Container */}
            <motion.div
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 40, scale: 0.94 }}
              transition={{ type: 'spring', damping: 26, stiffness: 320 }}
              className="relative z-10 w-full sm:max-w-lg bg-white dark:bg-slate-900 border-t sm:border border-slate-200/90 dark:border-slate-800 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 sm:p-7 overflow-hidden max-h-[92vh] flex flex-col"
            >
              {/* Mobile Drag Indicator Bar */}
              <div className="sm:hidden w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />

              {/* Ambient Glow */}
              <div className="pointer-events-none absolute -top-16 -right-16 size-48 rounded-full bg-amber-500/10 dark:bg-amber-500/20 blur-3xl" />

              {isSuccess ? (
                /* Success State */
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
                /* Active Form */
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
                      onClick={handleCloseModal}
                      className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors flex-shrink-0"
                      title={isUrdu ? 'بند کریں' : 'Close'}
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

                  {/* Quick Impressions (Tap to add) */}
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

                  {/* Resident Signature */}
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
                      onClick={handleCloseModal}
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
    </>
  )
}

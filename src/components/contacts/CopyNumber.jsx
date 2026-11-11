import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Check, Copy } from 'lucide-react'

/**
 * CopyNumber
 * Monospace tabular-nums phone number display with explicit tap-to-copy.
 * - Never auto-copies on mount/render.
 * - Brief digit lift + frosted glass "Copied" toast that auto-fades cleanly.
 */
export const CopyNumber = ({
  phone = '',
  contactName = '',
  accent = 'emerald', // 'emerald' | 'amber' | 'indigo'
  isUrdu = false,
}) => {
  const shouldReduceMotion = useReducedMotion()
  const [copied, setCopied] = useState(false)
  const [bumpKey, setBumpKey] = useState(0)
  const timerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const accentHover =
    accent === 'amber'
      ? 'hover:text-amber-700 dark:hover:text-amber-300 hover:border-amber-400/40'
      : accent === 'indigo'
      ? 'hover:text-indigo-700 dark:hover:text-indigo-300 hover:border-indigo-400/40'
      : 'hover:text-emerald-700 dark:hover:text-emerald-300 hover:border-emerald-400/40'

  const handleCopy = async (e) => {
    e.stopPropagation()
    if (!phone) return

    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(phone)
      } else {
        throw new Error('Clipboard API unavailable')
      }
    } catch {
      try {
        const ta = document.createElement('textarea')
        ta.value = phone
        ta.setAttribute('readonly', '')
        ta.style.position = 'fixed'
        ta.style.opacity = '0'
        document.body.appendChild(ta)
        ta.select()
        document.execCommand('copy')
        document.body.removeChild(ta)
      } catch {
        // Ignore gracefully if restricted
      }
    }

    setCopied(true)
    setBumpKey((k) => k + 1)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => {
      setCopied(false)
    }, 1800)
  }

  return (
    <div className="relative inline-flex items-center flex-wrap gap-2">
      <button
        type="button"
        onClick={handleCopy}
        aria-label={
          isUrdu
            ? `${contactName} کا نمبر ${phone} کاپی کریں`
            : `Copy phone number ${phone} for ${contactName}`
        }
        title={isUrdu ? 'نمبر کاپی کرنے کے لیے کلک کریں' : 'Click to copy number'}
        className={`group/copy inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/60 dark:bg-white/[0.06] border border-slate-200/80 dark:border-white/12 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${accentHover}`}
      >
        <motion.span
          key={bumpKey}
          dir="ltr"
          style={{ unicodeBidi: 'isolate' }}
          initial={false}
          animate={
            !shouldReduceMotion && bumpKey > 0
              ? { y: [0, -3, 0] }
              : { y: 0 }
          }
          transition={{ duration: 0.28, ease: 'easeOut' }}
          className="font-mono tabular-nums text-xs sm:text-[13px] font-bold tracking-tight"
        >
          {phone}
        </motion.span>

        <span className="text-slate-400 dark:text-slate-400 group-hover/copy:text-current transition-colors">
          {copied ? (
            <Check size={13} className="text-emerald-600 dark:text-emerald-400" />
          ) : (
            <Copy size={12} />
          )}
        </span>
      </button>

      {/* Auto-fading frosted glass Copied toast */}
      <AnimatePresence>
        {copied && (
          <motion.span
            role="status"
            aria-live="polite"
            initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 4, scale: 0.92 }}
            animate={shouldReduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: -3, scale: 0.94 }}
            transition={{ duration: 0.2 }}
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-500/18 dark:bg-emerald-400/20 text-emerald-800 dark:text-emerald-200 border border-emerald-500/35 backdrop-blur-md shadow-xs whitespace-nowrap ${
              isUrdu ? 'font-urdu' : ''
            }`}
          >
            <Check size={11} className="shrink-0" />
            <span>{isUrdu ? 'کاپی ہو گیا' : 'Copied'}</span>
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  )
}

export default CopyNumber

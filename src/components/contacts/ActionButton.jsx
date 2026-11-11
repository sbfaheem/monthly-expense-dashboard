import React, { useState, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Phone, MessageSquare } from 'lucide-react'

/**
 * ActionButton
 * Accessible frosted-glass Call (tel:) & WhatsApp (wa.me/) button pair item:
 * - Minimum 48px touch target height (`min-h-[48px]`)
 * - Call: neutral glass, ring-wiggle hover + pressed-in 3D tap depth
 * - WhatsApp: emerald glass, glow pulse hover, radial pointer/touch ripple + icon bounce
 * - Proper target="_blank" rel="noopener noreferrer" for WhatsApp links
 */
export const ActionButton = ({
  variant = 'call', // 'call' | 'whatsapp'
  href = '#',
  label = 'Call',
  ariaLabel = '',
  isUrdu = false,
}) => {
  const shouldReduceMotion = useReducedMotion()
  const btnRef = useRef(null)
  const [hovered, setHovered] = useState(false)
  const [ripple, setRipple] = useState(null)

  const isWhatsApp = variant === 'whatsapp'

  const triggerFeedback = (e) => {
    if (shouldReduceMotion || !btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const hasCoords = e && typeof e.clientX === 'number' && e.clientX !== 0
    const x = hasCoords ? e.clientX - rect.left : rect.width / 2
    const y = hasCoords ? e.clientY - rect.top : rect.height / 2
    setRipple({ id: Date.now(), x, y, size: Math.max(rect.width, rect.height) * 2.2 })
  }

  return (
    <motion.a
      ref={btnRef}
      href={href}
      target={isWhatsApp ? '_blank' : undefined}
      rel={isWhatsApp ? 'noopener noreferrer' : undefined}
      aria-label={ariaLabel || label}
      onClick={triggerFeedback}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      whileTap={
        shouldReduceMotion
          ? undefined
          : { scale: 0.96, y: 1.5 }
      }
      transition={{ type: 'spring', stiffness: 420, damping: 26 }}
      className={`relative overflow-hidden min-h-[48px] w-full inline-flex items-center justify-center gap-2 px-3.5 py-2.5 rounded-2xl text-xs sm:text-[13px] font-extrabold transition-all select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 ${
        isWhatsApp
          ? 'bg-emerald-500/14 hover:bg-emerald-500/22 dark:bg-emerald-500/16 dark:hover:bg-emerald-500/25 text-emerald-800 dark:text-emerald-200 border border-emerald-500/35 dark:border-emerald-400/35 shadow-[0_6px_16px_-6px_rgba(16,185,129,0.28)] hover:shadow-[0_10px_24px_-6px_rgba(16,185,129,0.45)] focus-visible:ring-emerald-500'
          : 'bg-white/75 hover:bg-white dark:bg-white/[0.08] dark:hover:bg-white/[0.14] text-slate-800 dark:text-slate-100 border border-slate-300/75 dark:border-white/15 shadow-[0_6px_14px_-6px_rgba(15,23,42,0.14),inset_0_1px_0_rgba(255,255,255,0.85)] active:shadow-inner focus-visible:ring-indigo-500'
      } ${isUrdu ? 'font-urdu' : ''}`}
    >
      {/* Top edge specular line */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-3 top-0 h-px bg-gradient-to-r from-transparent via-white/75 dark:via-white/30 to-transparent"
      />

      {/* Pointer / Touch Radial Ripple on WhatsApp tap */}
      <AnimatePresence>
        {isWhatsApp && ripple && !shouldReduceMotion && (
          <motion.span
            key={ripple.id}
            aria-hidden="true"
            initial={{ scale: 0, opacity: 0.45 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.52, ease: 'easeOut' }}
            onAnimationComplete={() => setRipple(null)}
            style={{
              position: 'absolute',
              left: ripple.x - ripple.size / 2,
              top: ripple.y - ripple.size / 2,
              width: ripple.size,
              height: ripple.size,
            }}
            className="pointer-events-none rounded-full bg-emerald-400/40 dark:bg-emerald-300/35"
          />
        )}
      </AnimatePresence>

      {/* Subtle hover glow aura on WhatsApp */}
      {isWhatsApp && hovered && !shouldReduceMotion && (
        <motion.span
          aria-hidden="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.18, 0.36, 0.18] }}
          transition={{ repeat: Infinity, duration: 1.6, ease: 'easeInOut' }}
          className="pointer-events-none absolute inset-0 bg-gradient-to-r from-emerald-400/15 via-teal-300/20 to-emerald-400/15"
        />
      )}

      {/* Icon with tactile micro-animation */}
      <motion.span
        aria-hidden="true"
        animate={
          shouldReduceMotion || !hovered
            ? { rotate: 0, y: 0, scale: 1 }
            : isWhatsApp
            ? { y: [0, -2.5, 0], scale: [1, 1.12, 1] }
            : { rotate: [0, -14, 14, -9, 9, 0] }
        }
        transition={
          hovered && !shouldReduceMotion
            ? { duration: 0.48, ease: 'easeInOut' }
            : { duration: 0.2 }
        }
        className="relative z-10 inline-flex shrink-0"
      >
        {isWhatsApp ? (
          <MessageSquare
            size={15}
            className="text-emerald-700 dark:text-emerald-300 shrink-0"
          />
        ) : (
          <Phone
            size={15}
            className="text-slate-600 dark:text-slate-300 shrink-0"
          />
        )}
      </motion.span>

      <span className="relative z-10 whitespace-nowrap">{label}</span>
    </motion.a>
  )
}

export default ActionButton

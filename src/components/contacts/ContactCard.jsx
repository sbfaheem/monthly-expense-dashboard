import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import TiltCard from '../motion/TiltCard'
import CopyNumber from './CopyNumber'
import ActionButton from './ActionButton'
import { formatTelHref, formatWhatsAppUrl } from '../../utils/phone'

const ACCENT_THEMES = {
  emerald: {
    orbGradient:
      'from-emerald-400/35 via-emerald-500/20 to-teal-500/30 text-emerald-800 dark:text-emerald-200 border-emerald-400/45',
    orbGlow: '0 8px 22px -6px rgba(16, 185, 129, 0.45)',
    haloColor: 'ring-emerald-400/35 dark:ring-emerald-300/25',
    pillClass:
      'bg-emerald-500/12 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200 border-emerald-500/30',
    cardClass:
      'bg-white/75 dark:bg-white/[0.06] border-emerald-500/25 dark:border-emerald-400/20 shadow-[0_12px_28px_-12px_rgba(16,185,129,0.22)]',
  },
  amber: {
    orbGradient:
      'from-amber-400/35 via-amber-500/20 to-yellow-500/30 text-amber-800 dark:text-amber-200 border-amber-400/45',
    orbGlow: '0 8px 22px -6px rgba(245, 158, 11, 0.45)',
    haloColor: 'ring-amber-400/35 dark:ring-amber-300/25',
    pillClass:
      'bg-amber-500/14 text-amber-800 dark:bg-amber-400/15 dark:text-amber-200 border-amber-500/30',
    cardClass:
      'bg-white/75 dark:bg-white/[0.06] border-amber-500/25 dark:border-amber-400/20 shadow-[0_12px_28px_-12px_rgba(245,158,11,0.22)]',
  },
  indigo: {
    orbGradient:
      'from-indigo-400/35 via-indigo-500/20 to-cyan-500/30 text-indigo-800 dark:text-indigo-200 border-indigo-400/45',
    orbGlow: '0 8px 22px -6px rgba(79, 70, 229, 0.45)',
    haloColor: 'ring-indigo-400/35 dark:ring-indigo-300/25',
    pillClass:
      'bg-indigo-500/12 text-indigo-800 dark:bg-indigo-400/15 dark:text-indigo-200 border-indigo-500/30',
    cardClass:
      'bg-white/75 dark:bg-white/[0.06] border-indigo-500/25 dark:border-indigo-400/25 shadow-[0_12px_28px_-12px_rgba(79,70,229,0.24)]',
  },
}

/**
 * ContactCard
 * Frosted glass 3D contact tile with:
 * - Staggered flip-up entrance & subtle hover tilt
 * - Floating glass initial orb with soft glow & purely decorative pulse ring
 * - Mobile-friendly Name + stacked Role pill below (never squeezing or wrapping)
 * - CopyNumber (tap-to-copy only) & >=48px Call / WhatsApp ActionButtons
 */
export const ContactCard = ({
  contact,
  delay = 0,
  inView = true,
  isUrdu = false,
  callLabel = 'Call',
  whatsappLabel = 'WhatsApp',
}) => {
  const shouldReduceMotion = useReducedMotion()
  const accent = ACCENT_THEMES[contact?.accent] || ACCENT_THEMES.emerald

  const telHref = formatTelHref(contact?.phone)
  const waHref = formatWhatsAppUrl(contact?.phone, contact?.whatsappMessage)

  const callAria = isUrdu
    ? `${contact?.name} کو کال کریں`
    : `Call ${contact?.name}`
  const waAria = isUrdu
    ? `${contact?.name} کو واٹس ایپ کریں`
    : `WhatsApp ${contact?.name}`

  return (
    <motion.div
      initial={
        shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0, rotateX: 16, y: 18 }
      }
      animate={
        inView
          ? { opacity: 1, rotateX: 0, y: 0 }
          : shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0, rotateX: 16, y: 18 }
      }
      transition={
        shouldReduceMotion
          ? { duration: 0.2 }
          : {
              type: 'spring',
              stiffness: 220,
              damping: 22,
              delay,
            }
      }
      style={{ transformOrigin: 'center bottom', transformPerspective: 950 }}
    >
      <TiltCard maxTilt={3.5} mobileMaxTilt={1.5} disableTapScale>
        <div
          className={`glass-border-highlight relative rounded-2xl border p-4 sm:p-4.5 transition-shadow duration-300 ${accent.cardClass}`}
        >
            <div className="relative z-10 space-y-3.5">
              {/* Top Row: Floating Avatar Orb + Name + Role Pill + Monospace CopyNumber */}
              <div className="flex items-start gap-3.5">
                {/* Floating Frosted Glass Avatar Orb */}
                <div className="relative shrink-0 mt-0.5">
                  {/* Decorative halo pulse (non-semantic, aria-hidden) */}
                  {!shouldReduceMotion && (
                    <motion.span
                      aria-hidden="true"
                      animate={
                        inView
                          ? { scale: [1, 1.24, 1], opacity: [0.35, 0, 0.35] }
                          : { scale: 1, opacity: 0 }
                      }
                      transition={{
                        repeat: Infinity,
                        duration: 3.4,
                        ease: 'easeInOut',
                      }}
                      className={`pointer-events-none absolute -inset-1 rounded-full ring-2 ${accent.haloColor}`}
                    />
                  )}

                  <motion.div
                    animate={
                      shouldReduceMotion || !inView
                        ? { y: 0 }
                        : { y: [0, -3, 0] }
                    }
                    transition={
                      shouldReduceMotion
                        ? undefined
                        : {
                            repeat: Infinity,
                            duration: 3.8,
                            delay: delay * 1.5,
                            ease: 'easeInOut',
                          }
                    }
                    style={{ boxShadow: accent.orbGlow }}
                    className={`relative size-12 rounded-full bg-gradient-to-br backdrop-blur-md border flex items-center justify-center font-black text-base overflow-hidden ${accent.orbGradient}`}
                  >
                    {/* Specular orb highlight */}
                    <span
                      aria-hidden="true"
                      className="pointer-events-none absolute top-1 left-2 size-3 rounded-full bg-white/55 blur-[1px]"
                    />
                    <span className="relative z-10">{contact?.initial}</span>
                  </motion.div>
                </div>

                {/* Identity & Phone Number */}
                <div className="min-w-0 flex-1 space-y-2">
                  {/* Responsive Name + Role Pill: moves cleanly under name on mobile */}
                  <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-1.5 sm:gap-2">
                    <h5
                      className={`text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 leading-snug break-words ${
                        isUrdu ? 'font-urdu' : ''
                      }`}
                    >
                      {contact?.name}
                    </h5>

                    {contact?.role && (
                      <span
                        className={`relative overflow-hidden inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] sm:text-[11px] font-black border whitespace-nowrap shrink-0 ${accent.pillClass} ${
                          isUrdu ? 'font-urdu' : ''
                        }`}
                      >
                        {/* Gentle one-time entry shimmer sweep across role pill */}
                        {!shouldReduceMotion && inView && (
                          <motion.span
                            aria-hidden="true"
                            initial={{ x: '-140%' }}
                            animate={{ x: '220%' }}
                            transition={{
                              duration: 0.9,
                              delay: delay + 0.35,
                              ease: 'easeInOut',
                            }}
                            className="pointer-events-none absolute inset-y-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/60 dark:via-white/25 to-transparent"
                          />
                        )}
                        <span className="relative z-10">{contact.role}</span>
                      </span>
                    )}
                  </div>

                  {/* Monospace Tabular-Nums Phone + Tap-to-Copy Toast */}
                  <CopyNumber
                    phone={contact?.phone}
                    contactName={contact?.name}
                    accent={contact?.accent}
                    isUrdu={isUrdu}
                  />
                </div>
              </div>

              {/* Equal-width Side-by-Side Accessible Action Buttons */}
              <div className="grid grid-cols-2 gap-2.5 pt-2.5 border-t border-slate-200/70 dark:border-white/10">
                <ActionButton
                  variant="call"
                  href={telHref}
                  label={callLabel}
                  ariaLabel={callAria}
                  isUrdu={isUrdu}
                />
                <ActionButton
                  variant="whatsapp"
                  href={waHref}
                  label={whatsappLabel}
                  ariaLabel={waAria}
                  isUrdu={isUrdu}
                />
              </div>
            </div>
        </div>
      </TiltCard>
    </motion.div>
  )
}

export default ContactCard

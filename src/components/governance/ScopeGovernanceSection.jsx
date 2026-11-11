import React, { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import GlassCard from '../motion/GlassCard'
import TiltCard from '../motion/TiltCard'
import SealBadge from './SealBadge'
import InfoTile from './InfoTile'
import TimelineHint from './TimelineHint'

/**
 * Animated ClipboardCheck SVG:
 * Draws the checkmark stroke cleanly when entering the viewport and pulses once.
 */
const AnimatedClipboardCheckIcon = ({ inView = true, shouldReduceMotion = false }) => {
  return (
    <div className="relative size-9 rounded-xl bg-emerald-500/12 dark:bg-emerald-400/15 border border-emerald-500/30 dark:border-emerald-400/30 flex items-center justify-center text-emerald-700 dark:text-emerald-300 shrink-0 shadow-xs">
      {!shouldReduceMotion && (
        <motion.span
          aria-hidden="true"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={
            inView
              ? { scale: [0.85, 1.45], opacity: [0.55, 0] }
              : { scale: 0.8, opacity: 0 }
          }
          transition={{ duration: 0.7, delay: 0.52, ease: 'easeOut' }}
          className="pointer-events-none absolute inset-0 rounded-xl ring-2 ring-emerald-500/50"
        />
      )}

      <motion.svg
        width="19"
        height="19"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.1"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={shouldReduceMotion ? { scale: 1 } : { scale: 0.92 }}
        animate={
          shouldReduceMotion
            ? { scale: 1 }
            : inView
            ? { scale: [0.92, 1.08, 1] }
            : { scale: 0.92 }
        }
        transition={{ duration: 0.45, delay: 0.45 }}
      >
        {/* Clipboard clip + body */}
        <rect width="8" height="4" x="8" y="2" rx="1" ry="1" />
        <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
        {/* Animated checkmark stroke */}
        <motion.path
          d="m9 14 2 2 4-4"
          initial={shouldReduceMotion ? { pathLength: 1, opacity: 1 } : { pathLength: 0, opacity: 0 }}
          animate={
            inView
              ? { pathLength: 1, opacity: 1 }
              : shouldReduceMotion
              ? { pathLength: 1, opacity: 1 }
              : { pathLength: 0, opacity: 0 }
          }
          transition={{ duration: 0.5, delay: 0.18, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.svg>
    </div>
  )
}

/**
 * ScopeGovernanceSection
 * Frosted glass 3D floating card for "Scope & Governance":
 * - Rises and settles with a soft spring
 * - Hover/finger tilt (~6° desktop, reduced mobile, none if prefers-reduced-motion)
 * - Animated checkmark stroke, Official Handover seal stamp, staggered 3D info tiles,
 *   dynamic TimelineHint, and line-by-line fade-slide bullet reveal
 */
export const ScopeGovernanceSection = ({ t = {}, isUrdu = false }) => {
  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.08 })
  const shouldReduceMotion = useReducedMotion()

  const bullets = [
    {
      id: 'scope',
      dotColor: 'bg-primary ring-primary/35',
      shadowGlow: '0 0 12px rgba(0, 102, 0, 0.55)',
      label: isUrdu ? 'دائرہ اختیار:' : 'Scope:',
      text: isUrdu
        ? t.governanceNote || 'انتظامیہ صرف 01 دسمبر 2025 کے بعد کی وصولیوں اور اخراجات کی پابند و جوابدہ ہے۔'
        : 'Covers collections & expenditures managed from Dec 01, 2025 onward.',
    },
    {
      id: 'purpose',
      dotColor: 'bg-emerald-500 ring-emerald-400/40',
      shadowGlow: '0 0 12px rgba(16, 185, 129, 0.55)',
      label: isUrdu ? 'مقصد:' : 'Purpose:',
      text: isUrdu
        ? 'سوسائٹی کے رہائشیوں کے لیے ماہانہ عوامی مالیاتی شفافیت۔'
        : 'Monthly public financial transparency for society residents.',
    },
  ]

  return (
    <motion.section
      ref={sectionRef}
      aria-labelledby="scope-governance-heading"
      initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 24 }}
      animate={
        inView
          ? { opacity: 1, y: 0 }
          : shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0, y: 24 }
      }
      transition={
        shouldReduceMotion
          ? { duration: 0.25 }
          : { type: 'spring', stiffness: 210, damping: 24 }
      }
      className="w-full"
    >
      <TiltCard
        maxTilt={6}
        mobileMaxTilt={2}
        disableTapScale
      >
        <GlassCard glow="green" className="p-5 sm:p-6">
          <div className="space-y-4 sm:space-y-5 flex flex-col">
            {/* Header Row with animated checkmark + Official Handover Seal */}
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 min-w-0">
                  <AnimatedClipboardCheckIcon
                    inView={inView}
                    shouldReduceMotion={shouldReduceMotion}
                  />
                  <div className="min-w-0">
                    <h4
                      id="scope-governance-heading"
                      className={`text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight ${
                        isUrdu ? 'font-urdu' : ''
                      }`}
                    >
                      {t.governanceTitle || 'Scope & Governance'}
                    </h4>
                  </div>
                </div>

                <div className="self-start sm:self-auto">
                  <SealBadge
                    label={t.effectiveBadge || 'Official Handover'}
                    inView={inView}
                    isUrdu={isUrdu}
                  />
                </div>
              </div>

              {/* Scroll-drawn gradient underline */}
              <div className="h-px w-full bg-slate-200/70 dark:bg-white/10 overflow-hidden rounded-full">
                <motion.div
                  initial={shouldReduceMotion ? { scaleX: 1 } : { scaleX: 0 }}
                  animate={
                    inView
                      ? { scaleX: 1 }
                      : shouldReduceMotion
                      ? { scaleX: 1 }
                      : { scaleX: 0 }
                  }
                  transition={{ duration: 0.65, delay: 0.15, ease: [0.22, 1, 0.36, 1] }}
                  style={{ transformOrigin: isUrdu ? 'right center' : 'left center' }}
                  className="h-full w-full bg-gradient-to-r from-emerald-500 via-primary to-indigo-500"
                />
              </div>
            </div>

            {/* Two Staggered 3D Info Tiles */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <InfoTile
                iconType="calendar"
                accent="indigo"
                label={t.effectiveDateLabel || 'Effective Since'}
                value={t.effectiveDateValue || 'December 01, 2025'}
                delay={0.14}
                inView={inView}
                isSplitFlapDate
                isUrdu={isUrdu}
              />
              <InfoTile
                iconType="shield"
                accent="green"
                label={t.reportTypeLabel || 'Report Nature'}
                value={
                  t.reportTypeValue ||
                  'Public Financial Summary of Collections & Expenditures'
                }
                delay={0.24}
                inView={inView}
                isUrdu={isUrdu}
              />
            </div>

            {/* Ongoing Timeline Bar */}
            <TimelineHint inView={inView} isUrdu={isUrdu} />

            {/* Scope & Purpose Bullets with sequential glowing indicator pulses */}
            <ul className="text-xs sm:text-[13px] text-slate-700 dark:text-slate-200 space-y-2.5 pt-2 border-t border-slate-200/70 dark:border-white/10 leading-relaxed">
              {bullets.map((b, idx) => {
                const delay = 0.42 + idx * 0.16
                return (
                  <motion.li
                    key={b.id}
                    initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 10 }}
                    animate={
                      inView
                        ? { opacity: 1, y: 0 }
                        : shouldReduceMotion
                        ? { opacity: 1 }
                        : { opacity: 0, y: 10 }
                    }
                    transition={{
                      duration: shouldReduceMotion ? 0.15 : 0.4,
                      delay: shouldReduceMotion ? 0 : delay,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className={`flex items-start gap-2.5 ${isUrdu ? 'font-urdu' : ''}`}
                  >
                    <span className="relative mt-1.5 flex size-2 shrink-0 items-center justify-center">
                      {!shouldReduceMotion && inView && (
                        <motion.span
                          aria-hidden="true"
                          initial={{ scale: 0.8, opacity: 0 }}
                          animate={{ scale: [0.9, 2.2], opacity: [0.7, 0] }}
                          transition={{
                            duration: 0.65,
                            delay: delay + 0.08,
                            ease: 'easeOut',
                          }}
                          className={`absolute inset-0 rounded-full ${b.dotColor}`}
                        />
                      )}
                      <motion.span
                        initial={shouldReduceMotion ? { scale: 1 } : { scale: 0.7 }}
                        animate={
                          shouldReduceMotion
                            ? { scale: 1 }
                            : inView
                            ? { scale: [0.7, 1.35, 1] }
                            : { scale: 0.7 }
                        }
                        transition={{ duration: 0.42, delay }}
                        style={{ boxShadow: b.shadowGlow }}
                        className={`size-2 rounded-full ${b.dotColor}`}
                      />
                    </span>
                    <span>
                      <strong className="text-slate-900 dark:text-white">{b.label}</strong>{' '}
                      {b.text}
                    </span>
                  </motion.li>
                )
              })}
            </ul>
          </div>
        </GlassCard>
      </TiltCard>
    </motion.section>
  )
}

export default ScopeGovernanceSection

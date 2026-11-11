import React, { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'framer-motion'
import { PhoneCall, HelpCircle } from 'lucide-react'
import GlassCard from '../motion/GlassCard'
import TiltCard from '../motion/TiltCard'
import ContactCard from './ContactCard'
import { buildManagementContacts, buildDashboardSupportContact } from '../../utils/phone'

/**
 * Shared animated section header:
 * - On narrow mobile (< sm), Direct Contact becomes a compact single-line pill below the title
 *   so long titles like "Dashboard Related Queries" never squeeze or wrap awkwardly.
 * - Gradient underline draws itself smoothly on scroll into view (scaleX 0 -> 1).
 */
const AnimatedSectionHeader = ({
  id,
  icon,
  title,
  pillLabel,
  underlineClass = 'from-emerald-500 via-teal-400 to-amber-500',
  pillClass = 'bg-slate-900/[0.05] dark:bg-white/[0.08] text-slate-600 dark:text-slate-300 border-slate-300/70 dark:border-white/15',
  inView = true,
  isUrdu = false,
  shouldReduceMotion = false,
}) => {
  return (
    <div className="space-y-3">
      <div className="flex flex-col items-start sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2.5 min-w-0">
          {icon}
          <h4
            id={id}
            className={`text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 tracking-tight ${
              isUrdu ? 'font-urdu' : ''
            }`}
          >
            {title}
          </h4>
        </div>

        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border whitespace-nowrap w-fit shrink-0 ${pillClass} ${
            isUrdu ? 'font-urdu normal-case tracking-normal text-[11px]' : ''
          }`}
        >
          {pillLabel}
        </span>
      </div>

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
          transition={{ duration: 0.65, delay: 0.14, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: isUrdu ? 'right center' : 'left center' }}
          className={`h-full w-full bg-gradient-to-r ${underlineClass}`}
        />
      </div>
    </div>
  )
}

/**
 * ManagementContactsSection
 * Renders both "Management Contacts" and the indigo-tinted "Dashboard Related Queries" support card
 * cleanly stacked in the right column on Desktop and naturally below Scope & Governance on Mobile.
 */
export const ManagementContactsSection = ({ settings, t = {}, isUrdu = false }) => {
  const containerRef = useRef(null)
  const inView = useInView(containerRef, { once: true, amount: 0.06 })
  const shouldReduceMotion = useReducedMotion()

  const managementContacts = buildManagementContacts({ settings, t, isUrdu })
  const supportContact = buildDashboardSupportContact({ settings, t, isUrdu })

  const directContactLabel = t.directContact || (isUrdu ? 'براہ راست رابطہ' : 'Direct Contact')
  const callLabel = t.btnCall || (isUrdu ? 'کال کریں' : 'Call')
  const whatsappLabel = t.btnChat || (isUrdu ? 'واٹس ایپ' : 'WhatsApp')

  return (
    <div ref={containerRef} className="space-y-6">
      {/* Card 1: Management Contacts */}
      <motion.section
        aria-labelledby="management-contacts-heading"
        initial={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, y: 22 }}
        animate={
          inView
            ? { opacity: 1, y: 0 }
            : shouldReduceMotion
            ? { opacity: 0 }
            : { opacity: 0, y: 22 }
        }
        transition={
          shouldReduceMotion
            ? { duration: 0.2 }
            : { type: 'spring', stiffness: 210, damping: 24, delay: 0.06 }
        }
      >
        <GlassCard glow="none" className="p-5 sm:p-6">
          <div className="space-y-4">
            <AnimatedSectionHeader
              id="management-contacts-heading"
              title={t.managementContacts || 'Management Contacts'}
              pillLabel={directContactLabel}
              underlineClass="from-emerald-500 via-teal-400 to-amber-500"
              inView={inView}
              isUrdu={isUrdu}
              shouldReduceMotion={shouldReduceMotion}
              icon={
                <span className="size-9 rounded-xl bg-primary/10 dark:bg-emerald-400/15 border border-primary/25 dark:border-emerald-400/25 flex items-center justify-center text-primary dark:text-emerald-300 shrink-0 shadow-xs">
                  <PhoneCall size={17} />
                </span>
              }
            />

            <div className="space-y-3.5">
              {managementContacts.map((person, idx) => (
                <ContactCard
                  key={person.id}
                  contact={person}
                  delay={0.14 + idx * 0.12}
                  inView={inView}
                  isUrdu={isUrdu}
                  callLabel={callLabel}
                  whatsappLabel={whatsappLabel}
                />
              ))}
            </div>
          </div>
        </GlassCard>
      </motion.section>

      {/* Card 2: Dashboard Related Queries (Distinct Floating Indigo Support Card) */}
      <motion.section
        aria-labelledby="dashboard-queries-heading"
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
            ? { duration: 0.2 }
            : { type: 'spring', stiffness: 205, damping: 23, delay: 0.16 }
        }
      >
        <TiltCard maxTilt={5} mobileMaxTilt={1.8} disableTapScale>
          <GlassCard glow="indigo" className="p-5 sm:p-6">
            <div className="space-y-4">
              <AnimatedSectionHeader
                id="dashboard-queries-heading"
                title={
                  t.techSupportTitle ||
                  (isUrdu ? 'ڈیش بورڈ سے متعلق سوالات' : 'Dashboard Related Queries')
                }
                pillLabel={directContactLabel}
                pillClass="bg-indigo-500/12 dark:bg-indigo-400/18 text-indigo-700 dark:text-indigo-200 border-indigo-400/35 dark:border-indigo-300/30"
                underlineClass="from-indigo-500 via-violet-500 to-cyan-400"
                inView={inView}
                isUrdu={isUrdu}
                shouldReduceMotion={shouldReduceMotion}
                icon={
                  <motion.span
                    initial={shouldReduceMotion ? { scale: 1 } : { scale: 0.65, rotate: -14 }}
                    animate={
                      shouldReduceMotion
                        ? { scale: 1 }
                        : inView
                        ? { scale: [0.65, 1.14, 1], rotate: [-14, 8, 0] }
                        : { scale: 0.65, rotate: -14 }
                    }
                    transition={{
                      duration: 0.6,
                      delay: 0.24,
                      ease: [0.22, 1, 0.36, 1],
                    }}
                    className="size-9 rounded-xl bg-indigo-500/14 dark:bg-indigo-400/18 border border-indigo-400/35 dark:border-indigo-300/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 shrink-0 shadow-[0_6px_16px_-6px_rgba(79,70,229,0.45)]"
                  >
                    <HelpCircle size={18} />
                  </motion.span>
                }
              />

              <ContactCard
                contact={supportContact}
                delay={0.28}
                inView={inView}
                isUrdu={isUrdu}
                callLabel={callLabel}
                whatsappLabel={whatsappLabel}
              />
            </div>
          </GlassCard>
        </TiltCard>
      </motion.section>
    </div>
  )
}

export default ManagementContactsSection

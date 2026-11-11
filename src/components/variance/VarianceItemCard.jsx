import React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { ChevronDown, Sparkles, ArrowRight, Repeat, Ban } from 'lucide-react'
import AnimatedNumber from '../motion/AnimatedNumber'
import ReceiptExpand from './ReceiptExpand'
import { formatNumberPKR } from '../../utils/formatters'
import { translateCategory, translateItemName, translateMonth } from '../../utils/translations'

/**
 * VarianceItemCard: Frosted glass row card for top increases / reductions.
 * - Staggers 60ms in 3D (rotateX: -20 -> 0).
 * - Animates amount first, then percentage rounded strictly to 1 decimal.
 * - Shows a one-time sparkle burst for New items & Removed/Shifted pills for -100.0% items.
 * - Links hover/tap focus bidirectionally with the Math Player chip above.
 * - Expands inline into ReceiptExpand on tap/click (min 44px touch target).
 */
export const VarianceItemCard = ({
  item,
  index = 0,
  type = 'increase', // 'increase' | 'reduction'
  priorMonth = '',
  currentMonth = '',
  displayCurrency = 'PKR',
  isUrdu = false,
  inView = true,
  replayKey = 0,
  isExpanded = false,
  isLinkedActive = false,
  isMobileCompact = false,
  onToggleExpand,
  onHoverItem,
  onLeaveItem,
}) => {
  const shouldReduceMotion = useReducedMotion()
  const isIncrease = type === 'increase'
  const staggerDelay = shouldReduceMotion ? 0 : index * 0.06
  const priorMonthName = (priorMonth || '').split(' ')[0] || 'Previous'
  const localizedPriorName = isUrdu ? translateMonth(priorMonthName, 'ur') : priorMonthName

  const sparkleAngles = isMobileCompact ? [30, 150, 270] : [20, 85, 160, 235, 310]

  // Active semantic glow ONLY when hovered/active/linked
  const containerStateClass = isIncrease
    ? isLinkedActive || isExpanded
      ? 'bg-rose-50/90 dark:bg-rose-950/45 border-rose-400 dark:border-rose-400/70 ring-2 ring-rose-400/45 shadow-[0_12px_28px_-8px_rgba(244,63,94,0.35)]'
      : 'bg-white/75 dark:bg-white/[0.06] border-rose-200/80 dark:border-rose-400/20 hover:bg-rose-50/70 dark:hover:bg-rose-950/30 hover:border-rose-300'
    : isLinkedActive || isExpanded
    ? 'bg-emerald-50/90 dark:bg-emerald-950/45 border-emerald-400 dark:border-emerald-400/70 ring-2 ring-emerald-400/45 shadow-[0_12px_28px_-8px_rgba(16,185,129,0.35)]'
    : 'bg-white/75 dark:bg-white/[0.06] border-emerald-200/80 dark:border-emerald-400/20 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/30 hover:border-emerald-300'

  return (
    <motion.div
      key={`vcard-${type}-${item.name}-${replayKey}`}
      initial={
        shouldReduceMotion
          ? { opacity: 0 }
          : { opacity: 0, rotateX: -20, y: 10 }
      }
      animate={
        inView
          ? shouldReduceMotion
            ? { opacity: 1 }
            : { opacity: 1, rotateX: 0, y: 0 }
          : {}
      }
      transition={{
        duration: shouldReduceMotion ? 0.2 : 0.42,
        delay: staggerDelay,
        ease: [0.22, 1, 0.36, 1],
      }}
      style={
        shouldReduceMotion
          ? {}
          : {
              transformPerspective: 900,
              transformOrigin: 'top center',
              willChange: 'transform, opacity',
            }
      }
      onMouseEnter={() => onHoverItem && onHoverItem(item.name)}
      onMouseLeave={() => onLeaveItem && onLeaveItem()}
      className={`relative rounded-2xl border backdrop-blur-md transition-all duration-200 p-3 sm:p-3.5 ${containerStateClass}`}
    >
      {/* Interactive >= 44px button header */}
      <button
        type="button"
        onClick={() => onToggleExpand && onToggleExpand(item.name)}
        aria-expanded={isExpanded}
        className="w-full min-h-[44px] flex items-center justify-between gap-2.5 text-start cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
      >
        <div className="min-w-0 flex-1 space-y-1">
          {/* Item Title + New Sparkle Burst + Removed/Shifted Tag */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <p className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 leading-snug line-clamp-2">
              {isUrdu ? translateItemName(item.name, 'ur') : item.name}
            </p>

            {/* One-time sparkle burst on entry for new items */}
            {item.isNew && (
              <span className="relative inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 dark:bg-indigo-950/70 text-indigo-800 dark:text-indigo-200 border border-indigo-300/80 dark:border-indigo-700/60 shrink-0">
                <motion.span
                  animate={shouldReduceMotion ? {} : { rotate: [0, 20, -14, 0], scale: [1, 1.25, 1] }}
                  transition={{ duration: 0.7, delay: staggerDelay + 0.15 }}
                  className="inline-flex"
                >
                  <Sparkles size={10} />
                </motion.span>
                <span>{isUrdu ? 'نیا' : 'New'}</span>

                {/* Radiating one-time particles */}
                {!shouldReduceMotion &&
                  inView &&
                  sparkleAngles.map((deg, pIdx) => {
                    const rad = (deg * Math.PI) / 180
                    return (
                      <motion.span
                        key={pIdx}
                        aria-hidden="true"
                        initial={{ x: 0, y: 0, scale: 0.4, opacity: 1 }}
                        animate={{
                          x: Math.cos(rad) * 16,
                          y: Math.sin(rad) * 14,
                          scale: 0,
                          opacity: 0,
                        }}
                        transition={{ duration: 0.65, delay: staggerDelay + 0.2, ease: 'easeOut' }}
                        className="pointer-events-none absolute left-2 top-1/2 size-1.5 rounded-full bg-indigo-500"
                      />
                    )
                  })}
              </span>
            )}

            {/* Distinct Removed / Shifted Tag for -100.0% */}
            {item.isEliminated && (
              <span
                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border shrink-0 ${
                  item.statusTag === 'Shifted'
                    ? 'bg-amber-100/95 text-amber-900 border-amber-300 dark:bg-amber-950/60 dark:text-amber-200 dark:border-amber-700/60'
                    : 'bg-slate-200/90 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-600'
                }`}
              >
                {item.statusTag === 'Shifted' ? <Repeat size={10} /> : <Ban size={10} />}
                <span>
                  {item.statusTag === 'Shifted'
                    ? isUrdu
                      ? 'منتقل شدہ'
                      : 'Shifted'
                    : isUrdu
                    ? 'ختم شدہ'
                    : 'Removed'}
                </span>
              </span>
            )}

            {/* Optional Moved to <category> arrow chip */}
            {item.movedToCategory && (
              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50/90 dark:bg-amber-900/30 text-amber-800 dark:text-amber-200 border border-amber-200/70 dark:border-amber-700/40 whitespace-nowrap">
                <ArrowRight size={9} />
                <span>
                  {isUrdu
                    ? translateCategory(item.movedToCategory, 'ur')
                    : `moved to ${item.movedToCategory}`}
                </span>
              </span>
            )}
          </div>

          {/* Subtitle: Was PKR ... or New expense item this month */}
          <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-snug">
            {item.isNew ? (
              <span>{isUrdu ? 'اس ماہ کا نیا خرچ' : 'New expense this month'}</span>
            ) : isUrdu ? (
              <span>
                گزشتہ ماہ ({localizedPriorName}) میں{' '}
                <span
                  dir="ltr"
                  style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                  className="inline-flex items-center gap-0.5 font-numeric tabular-nums font-bold text-slate-800 dark:text-slate-200"
                >
                  <span dir="rtl">{displayCurrency}</span>
                  <span>{formatNumberPKR(item.prev)}</span>
                </span>{' '}
                تھا
              </span>
            ) : (
              <span>
                Was{' '}
                <span className="font-numeric tabular-nums font-bold text-slate-800 dark:text-slate-200">
                  {displayCurrency} {formatNumberPKR(item.prev)}
                </span>{' '}
                in {priorMonthName}
              </span>
            )}
          </p>
        </div>

        {/* Right Side: Count-up Amount + Delayed Count-up 1-Decimal % + Expand Chevron */}
        <div className="flex items-center gap-2 shrink-0">
          <div
            dir="ltr"
            style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
            className="text-right"
          >
            <div
              className={`text-sm sm:text-base font-black leading-tight font-numeric tabular-nums whitespace-nowrap ${
                isIncrease
                  ? 'text-rose-800 dark:text-rose-200'
                  : 'text-emerald-800 dark:text-emerald-200'
              }`}
            >
              <span className={`inline-flex items-center ${isUrdu ? 'gap-0.5' : ''}`}>
                <span>{isIncrease ? '+' : '-'}</span>
                <span dir={isUrdu ? 'rtl' : 'ltr'}>{displayCurrency}</span>
              </span>{' '}
              <AnimatedNumber
                value={Math.abs(item.diff)}
                from={inView && !isMobileCompact ? 0 : Math.abs(item.diff)}
                duration={0.65}
                delay={staggerDelay}
                triggerKey={replayKey}
              />
            </div>

            {item.pctAbs !== null && item.pctAbs !== undefined && (
              <div
                dir="ltr"
                style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
                className={`text-xs font-extrabold mt-0.5 font-numeric tabular-nums whitespace-nowrap ${
                  isIncrease
                    ? 'text-rose-700 dark:text-rose-300'
                    : 'text-emerald-700 dark:text-emerald-300'
                }`}
              >
                <span>{isIncrease ? '+' : '-'}</span>
                <AnimatedNumber
                  value={item.pctAbs}
                  from={inView && !isMobileCompact ? 0 : item.pctAbs}
                  decimals={1}
                  suffix="%"
                  duration={0.55}
                  delay={staggerDelay + 0.16}
                  triggerKey={replayKey}
                />
              </div>
            )}
          </div>

          <ChevronDown
            size={16}
            className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${
              isExpanded
                ? isIncrease
                  ? 'rotate-180 text-rose-700 dark:text-rose-300'
                  : 'rotate-180 text-emerald-700 dark:text-emerald-300'
                : ''
            }`}
          />
        </div>
      </button>

      {/* Inline Expandable Receipt */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <ReceiptExpand
            item={item}
            priorMonth={priorMonth}
            currentMonth={currentMonth}
            displayCurrency={displayCurrency}
            isUrdu={isUrdu}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default VarianceItemCard

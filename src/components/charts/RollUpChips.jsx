import React from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import { Plus, Equal, ArrowRight, Layers, Sparkles } from 'lucide-react'
import GlassCard from '../motion/GlassCard'
import AnimatedNumber from '../motion/AnimatedNumber'

/**
 * Interactive Category Roll-Up Visualization:
 * Shows real constituent line items inside the active category as glass chips
 * gliding into the category subtotal (counting up to category total)
 * and flowing into the overall Monthly Total Spend.
 */
export const RollUpChips = ({
  category,
  totalCalculated = 0,
  displayCurrency = 'PKR',
  isUrdu = false,
  replayKey = 0,
}) => {
  const shouldReduceMotion = useReducedMotion()

  if (!category) return null

  const lineItems = Array.isArray(category.lineItems) && category.lineItems.length > 0
    ? category.lineItems
    : [
        {
          key: category.key,
          name: category.subtitle || category.title,
          translatedName: category.subtitle || category.title,
          amount: category.amount,
        },
      ]

  const categoryPct =
    totalCalculated > 0 ? ((category.amount / totalCalculated) * 100).toFixed(1) : '0.0'

  return (
    <GlassCard className="mt-3 p-3.5 sm:p-4 rounded-2xl w-full">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-slate-900/[0.06] dark:border-white/[0.08]">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="size-6 rounded-lg flex items-center justify-center text-white shrink-0"
            style={{ backgroundColor: category.color }}
          >
            <Layers size={13} />
          </span>
          <span className="text-[11px] sm:text-xs font-black text-slate-800 dark:text-slate-100 truncate">
            {isUrdu
              ? `${category.title} — مدات کا مجموعہ`
              : `${category.title} — Line Item Roll-Up`}
          </span>
        </div>

        <span
          className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full whitespace-nowrap shrink-0"
          style={{
            backgroundColor: `${category.color}1F`,
            color: category.color,
          }}
        >
          {lineItems.length} {isUrdu ? 'مدات' : lineItems.length === 1 ? 'item' : 'items'}
        </span>
      </div>

      {/* Animating Flow: [Glass Line Item Chips] -> [= Category Total] -> [Total Spend] */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`rollup-${category.key}-${replayKey}`}
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0.6 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="pt-3 space-y-3"
        >
          {/* Flying Glass Line-Item Chips */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {lineItems.map((li, idx) => (
              <React.Fragment key={`${li.key || li.name}-${idx}`}>
                {idx > 0 && (
                  <span
                    aria-hidden="true"
                    className="size-5 rounded-full bg-slate-200/70 dark:bg-white/10 text-slate-500 dark:text-slate-300 flex items-center justify-center shrink-0"
                  >
                    <Plus size={11} className="stroke-[2.75]" />
                  </span>
                )}
                <motion.div
                  initial={
                    shouldReduceMotion
                      ? { opacity: 1 }
                      : { opacity: 0, x: -16, y: -10, scale: 0.9 }
                  }
                  animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
                  transition={{
                    type: 'spring',
                    stiffness: 260,
                    damping: 20,
                    delay: shouldReduceMotion ? 0 : idx * 0.08,
                  }}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/75 dark:bg-white/[0.08] border border-slate-200/80 dark:border-white/15 shadow-xs max-w-full"
                >
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 truncate max-w-[140px] sm:max-w-[180px]">
                    {isUrdu ? li.translatedName || li.name : li.name}
                  </span>
                  <AnimatedNumber
                    value={li.amount}
                    from={li.amount}
                    prefix={displayCurrency}
                    duration={0.45}
                    className="text-[11px] font-black text-slate-900 dark:text-white"
                  />
                </motion.div>
              </React.Fragment>
            ))}
          </div>

          {/* Roll-Up Equation Convergence Strip: Category Total -> Total Spend */}
          <div
            dir="ltr"
            style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
            className="flex flex-wrap sm:flex-nowrap items-center justify-between gap-2 pt-2 border-t border-dashed border-slate-300/70 dark:border-white/12"
          >
            {/* Category Total Chip */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { scale: 0.92, opacity: 0.4 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.45, delay: shouldReduceMotion ? 0 : 0.16 }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-xl border bg-white/85 dark:bg-slate-900/80 shadow-xs"
              style={{ borderColor: `${category.color}66` }}
            >
              <Equal size={13} style={{ color: category.color }} className="shrink-0" />
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400 whitespace-nowrap">
                {isUrdu ? 'شعبے کا کل' : 'Category Total'}
              </span>
              <AnimatedNumber
                value={category.amount}
                from={shouldReduceMotion ? category.amount : 0}
                prefix={displayCurrency}
                duration={0.8}
                triggerKey={`${category.key}-${replayKey}`}
                className="text-xs sm:text-sm font-black text-slate-900 dark:text-white"
              />
            </motion.div>

            {/* Flying Arrow into Total Spend */}
            <motion.div
              initial={shouldReduceMotion ? { opacity: 1 } : { x: -10, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ duration: 0.45, delay: shouldReduceMotion ? 0 : 0.35 }}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono font-black px-2.5 py-1.5 rounded-xl bg-indigo-500/12 border border-indigo-400/35 text-indigo-700 dark:text-indigo-200 whitespace-nowrap ml-auto"
            >
              <ArrowRight size={13} className="shrink-0" />
              <span>{categoryPct}%</span>
              <span className="text-slate-400">/</span>
              <AnimatedNumber
                value={totalCalculated}
                from={totalCalculated}
                prefix={displayCurrency}
                duration={0.5}
                className="font-black text-indigo-800 dark:text-white"
              />
              <Sparkles size={11} className="text-indigo-500 shrink-0" />
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>
    </GlassCard>
  )
}

export default RollUpChips

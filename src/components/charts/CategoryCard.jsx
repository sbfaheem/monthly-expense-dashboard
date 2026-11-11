import React from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import GlassCard from '../motion/GlassCard'
import AnimatedNumber from '../motion/AnimatedNumber'

export const CategoryCard = ({
  item,
  index = 0,
  isSelected = false,
  onSelect,
  displayCurrency = 'PKR',
  isUrdu = false,
  isRtl = false,
  inView = true,
  replayKey = 0,
}) => {
  const shouldReduceMotion = useReducedMotion()
  const Icon = item.icon
  const pctNum = Number(item.percentage) || 0

  return (
    <motion.button
      type="button"
      onClick={() => onSelect && onSelect(index)}
      onMouseEnter={() => onSelect && onSelect(index)}
      whileHover={shouldReduceMotion ? {} : { x: isRtl ? -4 : 4, scale: 1.01 }}
      whileTap={shouldReduceMotion ? {} : { scale: 0.985 }}
      initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{
        type: 'spring',
        stiffness: 320,
        damping: 24,
        delay: shouldReduceMotion ? 0 : Math.min(index * 0.05, 0.3),
      }}
      className="w-full text-left block min-h-[44px] cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-2xl"
    >
      <GlassCard
        interactive
        className={`rounded-2xl overflow-hidden transition-all duration-200 ${
          isSelected
            ? 'ring-2 bg-white/85 dark:bg-white/[0.13]'
            : 'opacity-90 hover:opacity-100'
        }`}
        style={{
          borderColor: isSelected ? item.color : undefined,
          boxShadow: isSelected
            ? `0 12px 30px -10px ${item.color}55, 0 0 0 1px ${item.color}66`
            : undefined,
          '--tw-ring-color': isSelected ? item.color : undefined,
        }}
      >
        <div className="relative p-3.5 sm:p-4">
          {/* Active Accent Bar flush against card left edge */}
          {isSelected && (
            <motion.div
              layoutId="activeCategoryBar"
              className="absolute top-2 bottom-2 left-0 w-1 rounded-r-full"
              style={{ backgroundColor: item.color }}
            />
          )}

          {/* Top Row */}
        <div className="flex items-start justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div
              className="size-9 rounded-xl flex items-center justify-center text-white shadow-sm shrink-0 transition-transform duration-200"
              style={{
                backgroundColor: item.color,
                transform: isSelected ? 'scale(1.06)' : 'scale(1)',
                boxShadow: isSelected ? `0 6px 16px -4px ${item.color}88` : undefined,
              }}
            >
              <Icon size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <span className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 block leading-tight truncate">
                {item.title}
              </span>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block mt-0.5 truncate">
                {item.subtitle}
              </span>
            </div>
          </div>

          {/* Right: Animated Amount + Animated % Share */}
          <div
            className="text-right shrink-0"
            dir="ltr"
            style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
          >
            <AnimatedNumber
              value={item.amount}
              from={inView ? 0 : item.amount}
              prefix={displayCurrency}
              duration={0.85}
              delay={index * 0.04}
              triggerKey={replayKey}
              className="text-xs sm:text-sm font-black text-slate-900 dark:text-slate-100 block"
            />
            <span
              className="inline-flex items-center gap-1 text-[10px] font-mono font-black px-2 py-0.5 rounded-full mt-1 whitespace-nowrap"
              style={{
                backgroundColor: `${item.color}20`,
                color: item.color,
              }}
            >
              <AnimatedNumber
                value={pctNum}
                from={inView ? 0 : pctNum}
                decimals={1}
                suffix="%"
                duration={0.85}
                delay={index * 0.04}
                triggerKey={replayKey}
              />
              <span>{isUrdu ? 'حصہ' : 'share'}</span>
            </span>
          </div>
        </div>

        {/* Horizontal Progress Bar with Shimmer Sweep */}
        <div className="w-full h-2 rounded-full bg-slate-200/70 dark:bg-white/10 overflow-hidden relative">
          <motion.div
            key={`bar-${item.key}-${replayKey}`}
            initial={shouldReduceMotion ? { width: `${pctNum}%` } : { width: '0%' }}
            animate={inView ? { width: `${pctNum}%` } : {}}
            transition={{ duration: 0.85, ease: [0.22, 1, 0.36, 1], delay: index * 0.05 }}
            className="h-full rounded-full relative overflow-hidden"
            style={{ backgroundColor: item.color }}
          >
            {isSelected && !shouldReduceMotion && (
              <span
                aria-hidden="true"
                className="animate-glass-shimmer absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/55 to-transparent"
              />
            )}
          </motion.div>
        </div>
        </div>
      </GlassCard>
    </motion.button>
  )
}

export default CategoryCard

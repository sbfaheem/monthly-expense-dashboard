import React from 'react'

/**
 * Shared Frosted Glass Material surface:
 * - Light: rgba(255,255,255,0.55) / Dark: rgba(255,255,255,0.08)
 * - backdrop-filter: blur(20px) saturate(150%)
 * - 1px inner border with top-left white highlight gradient
 * - Soft layered shadows + meaningful semantic glow (green | red | indigo | none)
 */
const GLOW_STYLES = {
  none: {
    boxShadow:
      '0 14px 36px -10px rgba(15, 23, 42, 0.10), 0 4px 12px -2px rgba(15, 23, 42, 0.05)',
    ringClass: 'ring-1 ring-slate-900/[0.06] dark:ring-white/[0.10]',
    tintClass: '',
  },
  indigo: {
    boxShadow:
      '0 22px 48px -12px rgba(79, 70, 229, 0.24), 0 8px 20px -4px rgba(99, 102, 241, 0.14), 0 2px 6px rgba(15, 23, 42, 0.06)',
    ringClass: 'ring-1 ring-indigo-500/35 dark:ring-indigo-400/35',
    tintClass: 'from-indigo-500/[0.06] via-transparent to-cyan-500/[0.04]',
  },
  green: {
    boxShadow:
      '0 20px 44px -12px rgba(16, 185, 129, 0.24), 0 8px 18px -4px rgba(16, 185, 129, 0.12), 0 2px 6px rgba(15, 23, 42, 0.05)',
    ringClass: 'ring-1 ring-emerald-500/35 dark:ring-emerald-400/35',
    tintClass: 'from-emerald-500/[0.07] via-transparent to-teal-500/[0.03]',
  },
  red: {
    boxShadow:
      '0 20px 44px -12px rgba(244, 63, 94, 0.22), 0 8px 18px -4px rgba(244, 63, 94, 0.12), 0 2px 6px rgba(15, 23, 42, 0.05)',
    ringClass: 'ring-1 ring-rose-500/35 dark:ring-rose-400/35',
    tintClass: 'from-rose-500/[0.07] via-transparent to-amber-500/[0.03]',
  },
  amber: {
    boxShadow:
      '0 20px 44px -12px rgba(245, 158, 11, 0.22), 0 8px 18px -4px rgba(245, 158, 11, 0.12), 0 2px 6px rgba(15, 23, 42, 0.05)',
    ringClass: 'ring-1 ring-amber-500/35 dark:ring-amber-400/35',
    tintClass: 'from-amber-500/[0.07] via-transparent to-yellow-500/[0.03]',
  },
}

export const GlassCard = ({
  children,
  glow = 'none',
  className = '',
  style = {},
  interactive = false,
  ...rest
}) => {
  const g = GLOW_STYLES[glow] || GLOW_STYLES.none

  return (
    <div
      className={`glass-surface glass-border-highlight relative rounded-3xl ${g.ringClass} transition-shadow duration-300 ${
        interactive ? 'cursor-pointer' : ''
      } ${className}`}
      style={{
        boxShadow: g.boxShadow,
        ...style,
      }}
      {...rest}
    >
      {/* Semantic Inner Wash */}
      {g.tintClass && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 rounded-[inherit] bg-gradient-to-br ${g.tintClass}`}
        />
      )}

      {/* Content */}
      <div className="relative z-10 h-full">{children}</div>
    </div>
  )
}

export default GlassCard

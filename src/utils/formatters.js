/**
 * Locale-safe numeric formatting helpers using Intl.NumberFormat and tabular spacing.
 * Prevents uneven comma kerning in monospace contexts.
 */

const INTL_PKR_FORMATTER = new Intl.NumberFormat('en-PK', {
  maximumFractionDigits: 0,
})

const INTL_PCT_FORMATTER = new Intl.NumberFormat('en-US', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
})

export function formatNumberPKR(value) {
  const num = Math.round(Number(value) || 0)
  return INTL_PKR_FORMATTER.format(Math.abs(num))
}

export function formatSignedPKR(value, currency = 'PKR', { explicitPlus = false } = {}) {
  const num = Math.round(Number(value) || 0)
  const sign = num < 0 ? '−' : explicitPlus && num > 0 ? '+' : ''
  return `${sign}${currency} ${INTL_PKR_FORMATTER.format(Math.abs(num))}`
}

export function formatAmountWithSign(value, { explicitPlus = false } = {}) {
  const num = Math.round(Number(value) || 0)
  const sign = num < 0 ? '-' : explicitPlus && num > 0 ? '+' : ''
  return `${sign}${INTL_PKR_FORMATTER.format(Math.abs(num))}`
}

export function formatPercent(value) {
  const num = Number(value) || 0
  return INTL_PCT_FORMATTER.format(Math.abs(num))
}

/**
 * Single shared helper for all Month-over-Month variance percentages across the app.
 * Always rounds to 1 decimal place so MonthlyVarianceBanner, MonthComparison3D, Charts,
 * and ExpenseTable match identically (e.g. Security -21,611 / 227,525 -> -9.5%) and
 * never mix rounded and unrounded floats.
 *
 * @param {number} diff - Signed delta (current - prior)
 * @param {number} prior - Prior baseline amount
 * @returns {{ value: number, absValue: number, fixed: string, signed: string } | null}
 */
export function computeVariancePercent(diff, prior) {
  const priorVal = Number(prior || 0)
  if (priorVal <= 0) return null
  const diffVal = Number(diff || 0)
  const rounded = Number(((diffVal / priorVal) * 100).toFixed(1))
  const absRounded = Math.abs(rounded)
  const fixed = INTL_PCT_FORMATTER.format(absRounded)
  const sign = rounded > 0 ? '+' : rounded < 0 ? '-' : ''
  const negSign = rounded < 0 ? '-' : ''
  return {
    value: rounded,
    absValue: absRounded,
    fixed,
    rawFixed: `${negSign}${fixed}`,
    signed: `${sign}${fixed}`,
  }
}

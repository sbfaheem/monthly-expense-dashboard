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

import { normalizeItem } from './normalizeExpense.js'
import { MONTH_NAMES } from './finance.js'

/**
 * Calculates item-by-item and aggregate variances between current and prior months.
 * 
 * @param {string} currentMonth - e.g. "August 2026"
 * @param {Array<Object>} allExpenses - List of all expenses across all months
 * @param {string} [currency='PKR'] - Currency code
 * @returns {Object|null}
 */
export function computeMonthlyVariance(currentMonth, allExpenses = [], currency = 'PKR') {
  if (!currentMonth || !allExpenses || allExpenses.length === 0) {
    return null
  }

  const [mName, yStr] = currentMonth.trim().split(' ')
  const mIndex = MONTH_NAMES.indexOf(mName)
  const year = Number(yStr)

  if (mIndex === -1 || !year) return null

  // Determine prior month
  let priorMIndex = mIndex - 1
  let priorYear = year
  if (priorMIndex < 0) {
    priorMIndex = 11
    priorYear = year - 1
  }
  const priorMonth = `${MONTH_NAMES[priorMIndex]} ${priorYear}`

  const currentExpenses = allExpenses.filter(e => e.month === currentMonth)
  const priorExpenses = allExpenses.filter(e => e.month === priorMonth)

  if (currentExpenses.length === 0 && priorExpenses.length === 0) {
    return null
  }

  // If there are no prior expenses (e.g. first month), signal no prior month baseline
  const hasPriorData = priorExpenses.length > 0

  const totalCurrent = currentExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const totalPrior = priorExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const totalDiff = totalCurrent - totalPrior
  const totalPct = totalPrior > 0 ? ((totalDiff / totalPrior) * 100).toFixed(1) : null

  // Map normalized items for both months
  const currItemMap = {}
  currentExpenses.forEach(e => {
    const norm = normalizeItem(e.name)
    currItemMap[norm] = (currItemMap[norm] || 0) + Number(e.amount || 0)
  })

  const priorItemMap = {}
  priorExpenses.forEach(e => {
    const norm = normalizeItem(e.name)
    priorItemMap[norm] = (priorItemMap[norm] || 0) + Number(e.amount || 0)
  })

  const allItemNames = Array.from(new Set([...Object.keys(currItemMap), ...Object.keys(priorItemMap)]))

  const itemVariances = allItemNames.map(name => {
    const curr = currItemMap[name] || 0
    const prev = priorItemMap[name] || 0
    const diff = curr - prev
    const pct = prev > 0 ? ((diff / prev) * 100).toFixed(0) : null
    return {
      name,
      curr,
      prev,
      diff,
      pct,
      isNew: prev === 0 && curr > 0,
      isEliminated: curr === 0 && prev > 0
    }
  })

  const increases = itemVariances
    .filter(i => i.diff > 0)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 3)

  const reductions = itemVariances
    .filter(i => i.diff < 0)
    .sort((a, b) => a.diff - b.diff) // Most negative first
    .slice(0, 3)

  return {
    currentMonth,
    priorMonth,
    hasPriorData,
    totalCurrent,
    totalPrior,
    totalDiff,
    totalPct,
    increases,
    reductions,
    currency
  }
}

/**
 * Standardized Cash Flow Accounting & Financial Calculation Engine
 * Includes Multi-Month Balance Continuity (Month N Opening = Month N-1 Closing)
 */

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

/**
 * Parses "Month Year" string into chronological integer key YYYYMM (e.g. "May 2026" -> 202605)
 * @param {string} monthStr 
 * @returns {number}
 */
export function getMonthSortKey(monthStr) {
  if (!monthStr) return 0
  const parts = monthStr.trim().split(' ')
  const mName = parts[0]
  const yStr = parts[1]
  const mIndex = MONTH_NAMES.indexOf(mName)
  const year = Number(yStr) || 0
  return year * 100 + (mIndex !== -1 ? mIndex + 1 : 0)
}

/**
 * Calculates monthly financial health, cash flow, and closing balance for a single period.
 * 
 * @param {number|string} openingBalance - Starting balance of the period
 * @param {number|string} collection - Total monthly resident collections
 * @param {Array<{amount: number|string}>} expenses - Array of line item expenses
 * @returns {{
 *   totalExpense: number,
 *   netCashFlow: number,
 *   status: "Surplus" | "Deficit",
 *   closingBalance: number,
 *   isOverdrawn: boolean
 * }}
 */
export function calculateMonthlyFinances(openingBalance = 0, collection = 0, expenses = []) {
  const totalExpense = (expenses || []).reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const netCashFlow = Number(collection || 0) - totalExpense
  const closingBalance = Number(openingBalance || 0) + netCashFlow

  return {
    totalExpense,
    netCashFlow,
    status: netCashFlow >= 0 ? "Surplus" : "Deficit",
    closingBalance,
    isOverdrawn: closingBalance < 0
  }
}

/**
 * Computes programmatic multi-month balance continuity across all months.
 * For Month N (N > 0), sets openingBalance from Month N-1's calculated closingBalance.
 * 
 * @param {Array<Object>} monthlyRecords - List of monthly record objects
 * @param {Array<Object>} expenses - List of expense objects
 * @param {Object} [settings] - System settings (e.g. defaultOpeningBalance)
 * @returns {Map<string, {
 *   month: string,
 *   openingBalance: number,
 *   monthlyCollection: number,
 *   totalExpense: number,
 *   netCashFlow: number,
 *   status: "Surplus" | "Deficit",
 *   cctvExpense: number,
 *   showCctvExpense: boolean,
 *   closingBalance: number,
 *   isOverdrawn: boolean,
 *   record: Object
 * }>}
 */
export function calculateMultiMonthContinuity(monthlyRecords = [], expenses = [], settings = {}) {
  const sortedRecords = [...monthlyRecords].sort(
    (a, b) => getMonthSortKey(a.month) - getMonthSortKey(b.month)
  )
  
  const resultMap = new Map()
  let runningBalance = Number(settings?.defaultOpeningBalance ?? (sortedRecords[0]?.openingBalance || 0))

  sortedRecords.forEach((rec, idx) => {
    const monthKey = rec.month
    const monthExpenses = expenses.filter(e => e.month === monthKey)
    const totalExpense = monthExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0)
    
    // For first month, use record openingBalance if available, otherwise default settings.
    // For consecutive subsequent months, programmatically carry forward previous closing balance.
    const openingBalance = idx === 0 
      ? (typeof rec.openingBalance === 'number' ? rec.openingBalance : runningBalance)
      : runningBalance

    const collection = Number(rec.monthlyCollection || 0)
    const netCashFlow = rec.isManualSaving ? Number(rec.manualSaving) : (collection - totalExpense)
    const cctv = rec.showCctvExpense ? Number(rec.cctvExpense || 0) : 0
    const closingBalance = openingBalance + netCashFlow - cctv

    const monthResult = {
      month: monthKey,
      openingBalance,
      monthlyCollection: collection,
      totalExpense,
      netCashFlow,
      status: netCashFlow >= 0 ? "Surplus" : "Deficit",
      cctvExpense: cctv,
      showCctvExpense: !!rec.showCctvExpense,
      closingBalance,
      isOverdrawn: closingBalance < 0,
      record: {
        ...rec,
        openingBalance
      }
    }

    resultMap.set(monthKey, monthResult)
    // Roll forward closing balance into next month's opening balance
    runningBalance = closingBalance
  })

  return resultMap
}

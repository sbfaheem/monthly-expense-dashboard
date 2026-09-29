/**
 * Standardized Cash Flow Accounting & Financial Calculation Engine
 */

/**
 * Calculates monthly financial health, cash flow, and closing balance.
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

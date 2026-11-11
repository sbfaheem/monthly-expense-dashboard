import { normalizeItem, getParentCategory } from './normalizeExpense.js'
import { MONTH_NAMES, getMonthSortKey } from './finance.js'
import { computeVariancePercent } from './formatters.js'

/**
 * Detects whether an eliminated (-100%) item was shifted to another category
 * based strictly on existing expense metadata/descriptions/cross-category items.
 */
function detectEliminationContext(itemName, prevAmount, priorItems, currentItemEntries) {
  const relatedPrior = priorItems.filter((e) => normalizeItem(e.name) === itemName)
  const descriptions = relatedPrior.map((e) => (e.description || '').toLowerCase()).join(' ')
  const rawNames = relatedPrior.map((e) => (e.name || '').toLowerCase()).join(' ')
  const combinedText = `${rawNames} ${descriptions}`.trim()

  const sourceCategory = getParentCategory(itemName, relatedPrior[0]?.category)

  // 1) Explicit "moved to <category>" or "shifted to <category>" in description
  const movedMatch = combinedText.match(/(?:moved|shifted|transferred)\s+to\s+([a-z0-9\s&/-]+)/i)
  if (movedMatch && movedMatch[1]) {
    const dest = movedMatch[1].trim()
    return { statusTag: 'Shifted', movedToCategory: dest }
  }

  // 2) Description explicitly mentions shift / capex
  if (/(shift|shifted|transferred|capex|capital|moved)/i.test(combinedText)) {
    // Check if any new item in another category matches ~same amount
    const matchingNew = currentItemEntries.find(
      (ci) =>
        ci.isNew &&
        ci.category !== sourceCategory &&
        Math.abs(ci.curr - prevAmount) <= Math.max(100, prevAmount * 0.05)
    )
    return {
      statusTag: 'Shifted',
      movedToCategory: matchingNew ? matchingNew.category : 'CapEx / Separate Reserve',
    }
  }

  // 3) Cross-category match: exact or near-exact new expense in another category when item vanished
  const exactCrossCategoryMatch = currentItemEntries.find(
    (ci) =>
      ci.isNew &&
      ci.category !== sourceCategory &&
      Math.abs(ci.curr - prevAmount) === 0
  )
  if (exactCrossCategoryMatch) {
    return { statusTag: 'Shifted', movedToCategory: exactCrossCategoryMatch.category }
  }

  // 4) CapEx / CCTV Cameras: CapEx items removed from regular monthly expenses are treated as Shifted (one-off/capitalized) rather than operational efficiency savings
  if (sourceCategory === 'Capital Expenditures (CapEx)' || /cctv|camera/i.test(itemName)) {
    return { statusTag: 'Shifted', movedToCategory: null }
  }

  // Default for remaining -100% eliminated items
  return { statusTag: 'Removed', movedToCategory: null }
}

/**
 * Calculates item-by-item and aggregate variances between current and baseline months.
 * Also returns available baseline months, exact reconciliation "Other small changes" bucket,
 * unified 1-decimal percentages (via computeVariancePercent), and -100% Removal/Shift context.
 *
 * @param {string} currentMonth - e.g. "October 2026"
 * @param {Array<Object>} allExpenses - List of all expenses across all months
 * @param {string} [currency='PKR'] - Currency code
 * @param {string|null} [compareMonthOverride=null] - Optional baseline month override from segmented control
 * @returns {Object|null}
 */
export function computeMonthlyVariance(
  currentMonth,
  allExpenses = [],
  currency = 'PKR',
  compareMonthOverride = null
) {
  if (!currentMonth || !allExpenses || allExpenses.length === 0) {
    return null
  }

  const [mName, yStr] = currentMonth.trim().split(/\s+/)
  const mIndex = MONTH_NAMES.indexOf(mName)
  const year = Number(yStr)

  if (mIndex === -1 || !year) return null

  // Discover all months in allExpenses excluding currentMonth, preferring prior months first
  const currentSortKey = getMonthSortKey(currentMonth)
  const distinctMonths = Array.from(
    new Set(allExpenses.map((e) => e.month).filter((m) => m && m !== currentMonth))
  )
  const priorAvailable = distinctMonths
    .filter((m) => getMonthSortKey(m) < currentSortKey)
    .sort((a, b) => getMonthSortKey(b) - getMonthSortKey(a))
  const availableBaselines =
    priorAvailable.length > 0
      ? priorAvailable
      : distinctMonths.sort((a, b) => getMonthSortKey(b) - getMonthSortKey(a))

  // Default baseline = immediate calendar prior month
  let priorMIndex = mIndex - 1
  let priorYear = year
  if (priorMIndex < 0) {
    priorMIndex = 11
    priorYear = year - 1
  }
  const calendarPriorMonth = `${MONTH_NAMES[priorMIndex]} ${priorYear}`

  const priorMonth =
    compareMonthOverride && distinctMonths.includes(compareMonthOverride)
      ? compareMonthOverride
      : calendarPriorMonth

  const currentExpenses = allExpenses.filter((e) => e.month === currentMonth)
  const priorExpenses = allExpenses.filter((e) => e.month === priorMonth)

  if (currentExpenses.length === 0 && priorExpenses.length === 0) {
    return null
  }

  const hasPriorData = priorExpenses.length > 0

  const totalCurrent = currentExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const totalPrior = priorExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0)
  const totalDiff = totalCurrent - totalPrior

  const totalPctObj = computeVariancePercent(totalDiff, totalPrior)
  const totalPct = totalPctObj ? totalPctObj.rawFixed : null
  const totalPctValue = totalPctObj ? totalPctObj.value : null

  // Map normalized items for both months
  const currItemMap = {}
  const currCategoryMap = {}
  currentExpenses.forEach((e) => {
    const norm = normalizeItem(e.name)
    currItemMap[norm] = (currItemMap[norm] || 0) + Number(e.amount || 0)
    currCategoryMap[norm] = getParentCategory(norm, e.category)
  })

  const priorItemMap = {}
  const priorCategoryMap = {}
  priorExpenses.forEach((e) => {
    const norm = normalizeItem(e.name)
    priorItemMap[norm] = (priorItemMap[norm] || 0) + Number(e.amount || 0)
    priorCategoryMap[norm] = getParentCategory(norm, e.category)
  })

  const allItemNames = Array.from(
    new Set([...Object.keys(currItemMap), ...Object.keys(priorItemMap)])
  )

  const rawVariances = allItemNames.map((name) => {
    const curr = currItemMap[name] || 0
    const prev = priorItemMap[name] || 0
    const diff = curr - prev
    const pctObj = computeVariancePercent(diff, prev)
    const category = currCategoryMap[name] || priorCategoryMap[name] || getParentCategory(name)
    const isNew = prev === 0 && curr > 0
    const isEliminated = curr === 0 && prev > 0
    return {
      id: name,
      name,
      category,
      curr,
      prev,
      diff,
      pct: pctObj ? pctObj.rawFixed : null,
      pctValue: pctObj ? pctObj.value : null,
      pctAbs: pctObj ? pctObj.absValue : null,
      pctFixed: pctObj ? pctObj.fixed : null,
      isNew,
      isEliminated,
      statusTag: null,
      movedToCategory: null,
    }
  })

  // Enrich eliminated (-100.0%) items with Removed / Shifted context strictly from real data
  const itemVariances = rawVariances.map((item) => {
    if (!item.isEliminated) return item
    const ctx = detectEliminationContext(
      item.name,
      item.prev,
      priorExpenses,
      rawVariances
    )
    return {
      ...item,
      statusTag: ctx.statusTag,
      movedToCategory: ctx.movedToCategory,
    }
  })

  const increases = itemVariances
    .filter((i) => i.diff > 0)
    .sort((a, b) => b.diff - a.diff)
    .slice(0, 3)

  const reductions = itemVariances
    .filter((i) => i.diff < 0)
    .sort((a, b) => a.diff - b.diff) // Most negative first
    .slice(0, 3)

  const shownNames = new Set([
    ...increases.map((i) => i.name),
    ...reductions.map((i) => i.name),
  ])

  const increasesShownSum = increases.reduce((sum, i) => sum + i.diff, 0)
  const reductionsShownSum = reductions.reduce((sum, i) => sum + i.diff, 0)
  const otherItems = itemVariances
    .filter((i) => !shownNames.has(i.name) && i.diff !== 0)
    .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))

  // Compute remainder strictly from totals so math always closes identically:
  // totalPrior + increasesShownSum + reductionsShownSum + otherDiff === totalCurrent
  const otherDiff = totalDiff - (increasesShownSum + reductionsShownSum)
  const otherCount = otherItems.length

  return {
    currentMonth,
    priorMonth,
    availableBaselines,
    hasPriorData,
    totalCurrent,
    totalPrior,
    totalDiff,
    totalPct,
    totalPctValue,
    increases,
    reductions,
    increasesShownSum,
    reductionsShownSum,
    otherDiff,
    otherCount,
    otherItems,
    allItemVariances: itemVariances,
    currency,
  }
}

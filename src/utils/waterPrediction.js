/**
 * Predictive Model for Water Supply Cadence & Forecasting
 * Analyzes historical supply periods to calculate moving average intervals,
 * cycle consistency, typical duration, and estimated arrival windows for upcoming water supplies.
 */

export const extractAllSupplyPeriods = (waterSupplyDocs = []) => {
  const allPeriods = []
  
  if (!Array.isArray(waterSupplyDocs)) return allPeriods

  waterSupplyDocs.forEach(doc => {
    if (!doc) return
    if (Array.isArray(doc.entries) && doc.entries.length > 0) {
      doc.entries.forEach(e => {
        if (e.start && e.end) {
          const dStart = new Date(e.start)
          const dEnd = new Date(e.end)
          if (!isNaN(dStart.getTime()) && !isNaN(dEnd.getTime()) && dEnd >= dStart) {
            allPeriods.push({
              id: e.id || `${doc.id}-${e.start}`,
              start: dStart,
              end: dEnd,
              startStr: e.start,
              endStr: e.end,
              monthId: doc.id
            })
          }
        }
      })
    } else if (doc.start && doc.end) {
      const dStart = new Date(doc.start)
      const dEnd = new Date(doc.end)
      if (!isNaN(dStart.getTime()) && !isNaN(dEnd.getTime()) && dEnd >= dStart) {
        allPeriods.push({
          id: doc.id,
          start: dStart,
          end: dEnd,
          startStr: doc.start,
          endStr: doc.end,
          monthId: doc.id
        })
      }
    }
  })

  // Sort chronologically ascending
  allPeriods.sort((a, b) => a.start.getTime() - b.start.getTime())
  return allPeriods
}

/**
 * Predict next water supply based on historical data
 */
export const predictNextWaterSupply = (waterSupplyDocs = []) => {
  const periods = extractAllSupplyPeriods(waterSupplyDocs)

  if (periods.length < 2) {
    return {
      hasEnoughData: false,
      message: 'Need at least 2 recorded water supply cycles to generate predictive forecast.'
    }
  }

  // Calculate intervals between consecutive supply starts
  const intervalsMs = []
  const durationsMs = []

  for (let i = 0; i < periods.length; i++) {
    const cur = periods[i]
    durationsMs.push(cur.end.getTime() - cur.start.getTime())

    if (i > 0) {
      const prev = periods[i - 1]
      const interval = cur.start.getTime() - prev.start.getTime()
      if (interval > 0) {
        intervalsMs.push(interval)
      }
    }
  }

  if (intervalsMs.length === 0) {
    return { hasEnoughData: false, message: 'Insufficient interval data.' }
  }

  // Use the last 4-5 cycles for higher recency weighting (or all if fewer)
  const recentIntervals = intervalsMs.slice(-5)
  const recentDurations = durationsMs.slice(-5)

  // Average Interval in ms
  const avgIntervalMs = recentIntervals.reduce((sum, v) => sum + v, 0) / recentIntervals.length
  const avgIntervalDays = (avgIntervalMs / (1000 * 60 * 60 * 24)).toFixed(1)

  // Standard deviation of interval (margin of error)
  const variance = recentIntervals.reduce((acc, v) => acc + Math.pow(v - avgIntervalMs, 2), 0) / recentIntervals.length
  const stdDevMs = Math.sqrt(variance)
  const marginMs = Math.max(stdDevMs, 12 * 60 * 60 * 1000) // Minimum 12 hours margin

  // Average Duration in ms & hours
  const avgDurationMs = recentDurations.reduce((sum, v) => sum + v, 0) / recentDurations.length
  const avgDurationHours = Math.round(avgDurationMs / (1000 * 60 * 60))
  const avgDurationDays = Math.floor(avgDurationHours / 24)
  const avgDurationRemHours = avgDurationHours % 24

  // Last known supply
  const lastSupply = periods[periods.length - 1]
  const lastStartMs = lastSupply.start.getTime()

  // Projected next arrival
  const predictedStartMs = lastStartMs + avgIntervalMs
  const earliestExpectedMs = predictedStartMs - marginMs
  const latestExpectedMs = predictedStartMs + marginMs
  const predictedEndMs = predictedStartMs + avgDurationMs

  const predictedStartDate = new Date(predictedStartMs)
  const earliestDate = new Date(earliestExpectedMs)
  const latestDate = new Date(latestExpectedMs)
  const predictedEndDate = new Date(predictedEndMs)

  // Format Helper
  const formatShortDate = (date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    })
  }

  const formatShortDateTime = (date) => {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Calculate consistency score (0 - 100%)
  const cv = stdDevMs / avgIntervalMs // Coefficient of variation
  const reliabilityScore = Math.max(70, Math.min(98, Math.round((1 - cv) * 100)))

  // Calculate countdown / status
  const now = new Date()
  const isCurrentlyActive = now >= lastSupply.start && now <= lastSupply.end
  const diffFromPredictedHours = Math.round((predictedStartMs - now.getTime()) / (1000 * 60 * 60))
  const diffFromPredictedDays = (diffFromPredictedHours / 24).toFixed(1)

  let statusBadge = {
    label: 'Upcoming Cycle',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300'
  }

  if (isCurrentlyActive) {
    statusBadge = {
      label: 'Supply Currently Active',
      color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 animate-pulse'
    }
  } else if (now > latestDate) {
    statusBadge = {
      label: 'Due Any Moment (Overdue)',
      color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
    }
  } else if (now >= earliestDate && now <= latestDate) {
    statusBadge = {
      label: 'Expected Window Active',
      color: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-300'
    }
  }

  return {
    hasEnoughData: true,
    totalTrackedSupplies: periods.length,
    lastSupply: {
      start: lastSupply.start,
      end: lastSupply.end,
      formattedStart: formatShortDateTime(lastSupply.start),
      formattedEnd: formatShortDateTime(lastSupply.end)
    },
    prediction: {
      predictedStartDate,
      earliestDate,
      latestDate,
      predictedEndDate,
      predictedDateFormatted: formatShortDateTime(predictedStartDate),
      windowFormatted: `${formatShortDate(earliestDate)} – ${formatShortDate(latestDate)}`,
      daysWindow: `${earliestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} to ${latestDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`,
      avgIntervalDays,
      avgDurationHours,
      avgDurationText: `${avgDurationDays > 0 ? `${avgDurationDays}d ` : ''}${avgDurationRemHours}h (~${avgDurationHours} hours)`,
      reliabilityScore,
      statusBadge,
      isCurrentlyActive,
      diffFromPredictedDays,
      diffFromPredictedHours
    },
    recentIntervalsInDays: recentIntervals.map(ms => (ms / (1000 * 60 * 60 * 24)).toFixed(1))
  }
}

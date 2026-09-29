import { useState } from 'react'
import { Droplet, Clock, Calendar, Sparkles, TrendingUp, Share2, Check, Timer } from 'lucide-react'
import { predictNextWaterSupply } from '../utils/waterPrediction'

export default function WaterSupplyTracker({ entries = [], allWaterSupply = [], isAdmin = false }) {
  const [copied, setCopied] = useState(false)

  const formatDateTime = (dateStr) => {
    if (!dateStr) return 'Not Set'
    const dateObj = new Date(dateStr)
    return dateObj.toLocaleString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', 
      hour: 'numeric', minute: '2-digit', hour12: true 
    })
  }

  // Calculate durations for each entry and the cumulative total
  let totalMs = 0
  const processedEntries = (entries || []).map((entry, idx) => {
    const dStart = entry.start ? new Date(entry.start) : null
    const dEnd = entry.end ? new Date(entry.end) : null
    let duration = null

    if (dStart && dEnd && dEnd >= dStart) {
      const diffMs = dEnd - dStart
      totalMs += diffMs
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
      const totalHoursDecimal = (diffMs / (1000 * 60 * 60)).toFixed(2)
      duration = { days, hours, minutes, totalHours, totalHoursDecimal }
    }

    return {
      ...entry,
      dStart,
      dEnd,
      duration,
      label: `Supply ${idx + 1}`
    }
  })

  // Run the predictive model
  const predictionData = predictNextWaterSupply(allWaterSupply)

  // If there are no entries for this month AND not enough prediction data, don't render anything
  if (processedEntries.length === 0 && !predictionData.hasEnoughData) {
    return null
  }

  const handleShareToWhatsApp = () => {
    if (!predictionData.hasEnoughData) return
    const p = predictionData.prediction
    const last = predictionData.lastSupply

    const msg = [
      `💧 *WATER SUPPLY FORECAST & UPDATE*`,
      `📍 *North Town Residents*`,
      ``,
      `✅ *Last Known Supply:* ${last.formattedStart} to ${last.formattedEnd}`,
      `🔮 *Next Predicted Arrival:* *${p.windowFormatted}*`,
      `🎯 *Most Probable Start:* ${p.predictedDateFormatted}`,
      `⏳ *Expected Duration:* ${p.avgDurationText}`,
      `🔄 *Supply Cadence:* Every ~${p.avgIntervalDays} days`,
      `⭐ *Reliability Score:* ${p.reliabilityScore}% (based on ${predictionData.totalTrackedSupplies} tracked cycles)`,
      ``,
      `🌐 *Live Expense & Supply Dashboard:*`,
      `https://monthly-expense-dashboard.vercel.app/view`
    ].join('\n')

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`
    window.open(whatsappUrl, '_blank')

    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="space-y-6 mt-8">
      {/* ─── 1. Current / Selected Month Recorded Supplies ─── */}
      {processedEntries.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
              <Droplet className="text-blue-500" /> Water Supply Tracker
            </h3>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider w-fit">
              {processedEntries.length} {processedEntries.length === 1 ? 'Period Recorded' : 'Periods Recorded'}
            </span>
          </div>
          
          <div className="space-y-4">
            {processedEntries.map((entry, index) => (
              <div key={entry.id || index} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                    <Calendar size={15} />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">Start Date & Time ({entry.label})</span>
                  </div>
                  <p className="font-extrabold text-base md:text-lg text-slate-900 dark:text-white">{formatDateTime(entry.start)}</p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                    <Calendar size={15} />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">End Date & Time ({entry.label})</span>
                  </div>
                  <p className="font-extrabold text-base md:text-lg text-slate-900 dark:text-white">{formatDateTime(entry.end)}</p>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-900/10 px-3 py-2.5 rounded-lg border border-blue-100/50 dark:border-blue-900/30">
                  <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 mb-0.5">
                    <Clock size={15} />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">Duration</span>
                  </div>
                  {entry.duration ? (
                    <>
                      <p className="font-extrabold text-blue-950 dark:text-blue-200 text-sm md:text-base">
                        {entry.duration.days} Days, {entry.duration.hours} Hours, {entry.duration.minutes} Minutes
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 font-bold mt-0.5">
                        {entry.duration.totalHours} hours {entry.duration.minutes} minutes (or {entry.duration.totalHoursDecimal} hours)
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-slate-400">Pending...</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 2. Predictive Forecasting Engine Widget ─── */}
      {predictionData.hasEnoughData && (
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-6 md:p-8 rounded-2xl shadow-lg border border-indigo-500/20">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/30 flex-shrink-0">
                <Sparkles size={22} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
                    Next Water Supply Forecast
                  </h3>
                  <span className="text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 rounded-full">
                    Predictive Model
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Trained on {predictionData.totalTrackedSupplies} recorded supply periods across the last 4–5 months.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${predictionData.prediction.statusBadge.color}`}>
                {predictionData.prediction.statusBadge.label}
              </span>
              <button
                onClick={handleShareToWhatsApp}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm shadow-emerald-900/40 active:scale-95"
                title="Broadcast this prediction to community WhatsApp groups"
              >
                {copied ? <Check size={14} /> : <Share2 size={14} />}
                <span>{copied ? 'Opening WhatsApp...' : 'Share to WhatsApp'}</span>
              </button>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Expected Window */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Calendar size={14} />
                <span>Expected Window</span>
              </div>
              <p className="text-xl md:text-2xl font-black text-white tracking-tight">
                {predictionData.prediction.windowFormatted}
              </p>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                Most likely: <span className="text-indigo-200 font-bold">{predictionData.prediction.predictedDateFormatted}</span>
              </p>
            </div>

            {/* Card 2: Expected Duration */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Timer size={14} />
                <span>Forecasted Duration</span>
              </div>
              <p className="text-xl md:text-2xl font-black text-white tracking-tight">
                {predictionData.prediction.avgDurationText}
              </p>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                Typical range: <span className="text-blue-200 font-bold">55 – 65 hours</span>
              </p>
            </div>

            {/* Card 3: Cycle Cadence */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider mb-2">
                <TrendingUp size={14} />
                <span>Supply Cadence</span>
              </div>
              <p className="text-xl md:text-2xl font-black text-white tracking-tight">
                Every ~{predictionData.prediction.avgIntervalDays} Days
              </p>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                Recent: <span className="text-teal-200 font-bold">{predictionData.recentIntervalsInDays.slice(-3).join('d, ')}d</span>
              </p>
            </div>

            {/* Card 4: Model Confidence */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles size={14} />
                <span>Consistency Score</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-black text-white tracking-tight">
                  {predictionData.prediction.reliabilityScore}%
                </span>
                <span className="text-xs text-emerald-400 font-bold">High Regularity</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                Last recorded: {predictionData.lastSupply.formattedStart.split(',')[0]}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

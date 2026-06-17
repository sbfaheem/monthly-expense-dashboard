import { Droplet, Clock, Calendar } from 'lucide-react'

export default function WaterSupplyTracker({ entries = [] }) {
  if (!entries || entries.length === 0) return null

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
  const processedEntries = entries.map((entry, idx) => {
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

  // Cumulative duration calculation
  const cumDays = Math.floor(totalMs / (1000 * 60 * 60 * 24))
  const cumHours = Math.floor((totalMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const cumMinutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60))
  const cumTotalHours = Math.floor(totalMs / (1000 * 60 * 60))
  const cumTotalHoursDecimal = (totalMs / (1000 * 60 * 60)).toFixed(2)

  return (
    <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm mt-8">
      <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-4">
        <Droplet className="text-blue-500" /> Water Supply Tracker
      </h3>
      
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
  )
}

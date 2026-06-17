import { Droplet, Clock, Calendar } from 'lucide-react'

export default function WaterSupplyTracker({ start, end }) {
  if (!start && !end) return null

  const dStart = start ? new Date(start) : null
  const dEnd = end ? new Date(end) : null
  let duration = null

  if (dStart && dEnd && dEnd >= dStart) {
    const diffMs = dEnd - dStart
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
    const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
    const totalHoursDecimal = (diffMs / (1000 * 60 * 60)).toFixed(2)
    duration = { days, hours, minutes, totalHours, totalHoursDecimal }
  }

  const formatDateTime = (dateObj) => {
    if (!dateObj) return 'Not Set'
    return dateObj.toLocaleString('en-US', { 
      month: 'short', day: 'numeric', year: 'numeric', 
      hour: 'numeric', minute: '2-digit', hour12: true 
    })
  }

  return (
    <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm mt-8">
      <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2 mb-4">
        <Droplet className="text-blue-500" /> Water Supply Tracker
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Calendar size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Start Date & Time</span>
          </div>
          <p className="font-bold text-slate-800 dark:text-slate-100">{formatDateTime(dStart)}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-500 mb-2">
            <Calendar size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">End Date & Time</span>
          </div>
          <p className="font-bold text-slate-800 dark:text-slate-100">{formatDateTime(dEnd)}</p>
        </div>
        <div className="bg-blue-100 dark:bg-blue-900/30 p-4 rounded-xl shadow-sm border border-blue-200 dark:border-blue-700">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-2">
            <Clock size={16} />
            <span className="text-xs font-bold uppercase tracking-wider">Total Duration</span>
          </div>
          <p className="font-extrabold text-blue-900 dark:text-blue-200 text-lg">
            {duration 
              ? `${duration.days} Days, ${duration.hours} Hours, ${duration.minutes} Minutes`
              : 'Pending...'}
          </p>
          {duration && (
            <p className="text-xs text-blue-700 dark:text-blue-400 mt-1 font-medium">
              Total duration = {duration.totalHours} hours {duration.minutes} minutes (or {duration.totalHoursDecimal} hours).
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

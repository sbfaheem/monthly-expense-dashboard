import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const Header = ({ selectedMonth, selectedYear, onMonthChange, onYearChange, isAdmin, title }) => {
  const currentDate = new Date()
  const isEndOfMonth = () => {
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    return currentDate.getDate() === lastDay
  }

  const years = []
  for (let y = 2024; y <= 2030; y++) years.push(y)

  const goToPrev = () => {
    const monthIdx = MONTHS.indexOf(selectedMonth)
    if (monthIdx === 0) { onMonthChange(MONTHS[11]); onYearChange(selectedYear - 1) }
    else onMonthChange(MONTHS[monthIdx - 1])
  }

  const goToCurrent = () => {
    onMonthChange(MONTHS[currentDate.getMonth()])
    onYearChange(currentDate.getFullYear())
  }

  const monthShort = selectedMonth?.substring(0, 3).toUpperCase()

  return (
    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
      <div className="space-y-2">
        <h1 className="text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight flex items-center gap-2">
          {isEndOfMonth() && !isAdmin
            ? <>MONTHLY EXPENSE SHEET – <span className="text-primary">{monthShort} {selectedYear}</span></>
            : title || <>MONTHLY EXPENSE SHEET – <span className="text-primary">{monthShort} {selectedYear}</span></>}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 font-medium">Detailed financial overview for the current billing cycle.</p>
      </div>

      <div className="flex items-center gap-3">
        {/* Month/Year Dropdowns */}
        <div className="flex items-center border border-primary/20 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm h-10">
          <select 
            value={selectedMonth} 
            onChange={e => onMonthChange(e.target.value)}
            className="px-3 py-2 text-sm font-bold bg-transparent text-slate-700 dark:text-slate-300 outline-none border-none cursor-pointer"
          >
            {MONTHS.map(m => <option key={m}>{m}</option>)}
          </select>
          <div className="w-px h-full bg-primary/10"></div>
          <select 
            value={selectedYear} 
            onChange={e => onYearChange(Number(e.target.value))}
            className="px-3 py-2 text-sm font-bold bg-transparent text-slate-700 dark:text-slate-300 outline-none border-none cursor-pointer"
          >
            {years.map(y => <option key={y}>{y}</option>)}
          </select>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center border border-primary/20 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm h-10">
          <button 
            className="px-4 h-full flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-primary hover:bg-primary/5 transition-colors" 
            onClick={goToPrev}
          >
            <ChevronLeft size={16}/> Prev
          </button>
          <div className="w-px h-full bg-primary/10"></div>
          <button 
            className="px-4 h-full flex items-center gap-1 text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors" 
            onClick={goToCurrent}
          >
            <Calendar size={14}/> Current
          </button>
        </div>
      </div>
    </div>
  )
}

export default Header

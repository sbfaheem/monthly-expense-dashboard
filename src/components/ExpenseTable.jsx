import { normalizeItem, getParentCategory } from '../utils/normalizeExpense'
import { MONTH_NAMES } from '../utils/finance'
import { Sparkles, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react'

const CATEGORY_STYLES = {
  'Salaries & Payroll': 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
  'Payroll': 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
  'Community & Utilities': 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300 border-purple-200/60 dark:border-purple-800/50',
  'Electrical & Maintenance': 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/50',
  'Electrical & Infrastructure': 'bg-amber-50 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200/60 dark:border-amber-800/50',
  'Supplies & Hardware': 'bg-cyan-50 text-cyan-800 dark:bg-cyan-950/60 dark:text-cyan-300 border-cyan-200/60 dark:border-cyan-800/50',
  'Capital Expenditures (CapEx)': 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200/60 dark:border-rose-800/50'
}

const ExpenseTable = ({
  expenses = [],
  allExpenses = [],
  settings = {},
  selectedMonth = '',
  totals = {},
  onEdit,
  onDelete,
  isAdmin = false
}) => {
  const currency = settings.currency || 'PKR'
  const fmt = (n) => Number(Math.abs(n || 0)).toLocaleString('en-PK')

  // Determine prior month
  let priorMonth = ''
  let priorMonthShort = 'Prior'
  let curMonthShort = 'Current'

  if (selectedMonth) {
    const parts = selectedMonth.trim().split(' ')
    const mName = parts[0]
    const year = Number(parts[1])
    const mIndex = MONTH_NAMES.indexOf(mName)
    curMonthShort = `${mName.slice(0, 3)} ${year}`

    if (mIndex !== -1 && year) {
      let priorMIndex = mIndex - 1
      let priorYear = year
      if (priorMIndex < 0) {
        priorMIndex = 11
        priorYear = year - 1
      }
      priorMonth = `${MONTH_NAMES[priorMIndex]} ${priorYear}`
      priorMonthShort = `${MONTH_NAMES[priorMIndex].slice(0, 3)} ${priorYear}`
    }
  }

  const priorExpenses = (allExpenses || []).filter(e => e.month === priorMonth)
  const hasPriorData = priorExpenses.length > 0

  // Pre-aggregate prior month expenses by normalized item name
  const priorMap = {}
  priorExpenses.forEach(e => {
    const norm = normalizeItem(e.name)
    priorMap[norm] = (priorMap[norm] || 0) + Number(e.amount || 0)
  })

  // Build current month rows with MoM comparison
  const tableRows = expenses.map(e => {
    const normName = normalizeItem(e.name)
    const category = getParentCategory(normName, e.category)
    const currentAmount = Number(e.amount || 0)
    const priorAmount = priorMap[normName] || 0
    const isNew = !hasPriorData ? false : (priorAmount === 0 && currentAmount > 0)
    const diff = currentAmount - priorAmount
    const pct = priorAmount > 0 ? ((diff / priorAmount) * 100).toFixed(1) : null

    return {
      id: e.id,
      name: e.name,
      normName,
      category,
      currentAmount,
      priorAmount,
      isNew,
      diff,
      pct,
      expense: e
    }
  })

  return (
    <div className="space-y-5">
      {/* Container Card */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl shadow-md shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-750 overflow-hidden">
        {/* Table / Section Top Title Bar */}
        <div className="px-5 sm:px-6 py-4 bg-slate-50/90 dark:bg-slate-800/90 border-b border-slate-200/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 flex-wrap">
            <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-slate-100">
              Month-over-Month Expense Breakdown
            </h3>
            <span className="text-[11px] sm:text-xs font-black bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
              {tableRows.length} Line Items
            </span>
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {hasPriorData ? (
              <span>Comparing <strong>{curMonthShort}</strong> vs. <strong>{priorMonthShort}</strong></span>
            ) : (
              <span>Baseline period for <strong>{curMonthShort}</strong></span>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 📱 MOBILE VIEW: Layman-Friendly Vertically Stacked Cards (NO horizontal scroll) */}
        {/* ========================================================================= */}
        <div className="block md:hidden p-3 sm:p-4 space-y-3">
          {tableRows.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-bold text-xs">
              No expense records found for {selectedMonth}.
            </div>
          ) : (
            tableRows.map((row) => {
              const catClass = CATEGORY_STYLES[row.category] || CATEGORY_STYLES['Community & Utilities']
              return (
                <div
                  key={row.id || row.name}
                  className="bg-slate-50/70 dark:bg-slate-800/60 rounded-2xl p-3.5 border border-slate-200/80 dark:border-slate-700/80 space-y-2.5 shadow-2xs"
                >
                  {/* Card Header: Item Name + Category */}
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100 leading-tight">
                      {row.name}
                    </span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md border flex-shrink-0 ${catClass}`}>
                      {row.category}
                    </span>
                  </div>

                  {/* Side-by-Side Comparison Box */}
                  <div className="grid grid-cols-2 gap-2 bg-white dark:bg-slate-900/80 p-2.5 rounded-xl border border-slate-100 dark:border-slate-750 text-xs">
                    {/* Prior Month */}
                    <div>
                      <span className="text-[10px] font-extrabold text-slate-400 block uppercase">
                        {hasPriorData ? priorMonthShort : 'Prior Month'}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 font-mono mt-0.5 block">
                        {hasPriorData && row.priorAmount > 0 ? `${currency} ${fmt(row.priorAmount)}` : '—'}
                      </span>
                    </div>

                    {/* Current Month */}
                    <div className="border-l border-slate-100 dark:border-slate-800 pl-2">
                      <span className="text-[10px] font-extrabold text-primary block uppercase">
                        {curMonthShort} (Current)
                      </span>
                      <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 font-mono mt-0.5 block">
                        {currency} {fmt(row.currentAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Variance Status Pill & Actions */}
                  <div className="flex items-center justify-between gap-2 pt-0.5">
                    {!hasPriorData ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                        Starting Baseline
                      </span>
                    ) : row.isNew ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-black bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                        <Sparkles size={12} /> ✨ New this month
                      </span>
                    ) : row.diff > 0 ? (
                      <span className="inline-flex items-center gap-1 font-black text-rose-600 dark:text-rose-400 text-xs bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-xl border border-rose-200/80 dark:border-rose-900/60">
                        <ArrowUpRight size={13} className="stroke-[3]" />
                        +{currency} {fmt(row.diff)}
                        {row.pct && <span className="text-[10px] font-extrabold text-rose-500">(+{row.pct}%)</span>}
                      </span>
                    ) : row.diff < 0 ? (
                      <span className="inline-flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400 text-xs bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60">
                        <ArrowDownRight size={13} className="stroke-[3]" />
                        -{currency} {fmt(row.diff)}
                        {row.pct && <span className="text-[10px] font-extrabold text-emerald-600">({row.pct}%)</span>}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-400 dark:text-slate-500 text-[11px]">
                        <Minus size={12} /> — Unchanged
                      </span>
                    )}

                    {/* Mobile Admin Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => onEdit && onEdit(row.expense)}
                          className="text-[11px] bg-blue-50 text-blue-600 px-2 py-1 rounded-lg font-black hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete && onDelete(row.id)}
                          className="text-[11px] bg-red-50 text-red-600 px-2 py-1 rounded-lg font-black hover:bg-red-100"
                        >
                          Del
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* ========================================================================= */}
        {/* 💻 DESKTOP / TABLET VIEW: Spacious 4-Column Table */}
        {/* ========================================================================= */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="text-xs font-black text-slate-400 uppercase tracking-wider bg-slate-50/50 dark:bg-slate-900/50 border-b border-slate-100 dark:border-slate-800">
              <tr>
                <th className="px-6 py-4">Line Item</th>
                <th className="px-6 py-4 text-right">
                  {hasPriorData ? `Prior (${priorMonthShort})` : 'Prior Month'}
                </th>
                <th className="px-6 py-4 text-right">
                  {`Current (${curMonthShort})`}
                </th>
                <th className="px-6 py-4 text-right">Variance &amp; Status</th>
                {isAdmin && <th className="px-6 py-4 text-center w-24 border-l border-slate-100 dark:border-slate-800">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-8 text-center text-slate-400 font-bold text-sm">
                    No expense records found for {selectedMonth}.
                  </td>
                </tr>
              ) : (
                tableRows.map((row) => {
                  const catClass = CATEGORY_STYLES[row.category] || CATEGORY_STYLES['Community & Utilities']
                  return (
                    <tr key={row.id || row.name} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Column 1: Line Item & Normalized Parent Category Tag */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm font-black text-slate-900 dark:text-slate-100">
                            {row.name}
                          </span>
                          <span className={`inline-flex items-center w-fit text-[10px] font-bold px-2 py-0.5 rounded-md border ${catClass}`}>
                            {row.category}
                          </span>
                        </div>
                      </td>

                      {/* Column 2: Prior Month (PKR) */}
                      <td className="px-6 py-4 text-right">
                        {hasPriorData && row.priorAmount > 0 ? (
                          <span className="text-sm font-semibold text-slate-600 dark:text-slate-300 font-mono">
                            {currency} {fmt(row.priorAmount)}
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-slate-300 dark:text-slate-600 font-mono">
                            —
                          </span>
                        )}
                      </td>

                      {/* Column 3: Current Month (PKR) */}
                      <td className="px-6 py-4 text-right">
                        <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100 font-mono">
                          {currency} {fmt(row.currentAmount)}
                        </span>
                      </td>

                      {/* Column 4: Variance & Status Badge */}
                      <td className="px-6 py-4 text-right">
                        {!hasPriorData ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                            Baseline
                          </span>
                        ) : row.isNew ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-2xs">
                            <Sparkles size={12} /> NEW
                          </span>
                        ) : row.diff > 0 ? (
                          <span className="inline-flex items-center gap-1 font-black text-rose-600 dark:text-rose-400 text-xs sm:text-sm bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1 rounded-xl border border-rose-200/80 dark:border-rose-900/60">
                            <TrendingUp size={13} className="stroke-[2.5]" />
                            +{currency} {fmt(row.diff)}
                            {row.pct && <span className="text-[11px] font-extrabold text-rose-500">(▲ {row.pct}%)</span>}
                          </span>
                        ) : row.diff < 0 ? (
                          <span className="inline-flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60">
                            <TrendingDown size={13} className="stroke-[2.5]" />
                            -{currency} {fmt(row.diff)}
                            {row.pct && <span className="text-[11px] font-extrabold text-emerald-600">(▼ {Math.abs(row.pct)}%)</span>}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-400 dark:text-slate-500 text-xs">
                            <Minus size={12} /> — Unchanged
                          </span>
                        )}
                      </td>

                      {/* Actions column for Admin */}
                      {isAdmin && (
                        <td className="px-6 py-4 border-l border-slate-100 dark:border-slate-800 text-center">
                          <div className="flex justify-center gap-1.5">
                            <button
                              onClick={() => onEdit && onEdit(row.expense)}
                              className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg font-bold hover:bg-blue-100 transition-colors"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => onDelete && onDelete(row.id)}
                              className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-lg font-bold hover:bg-red-100 transition-colors"
                            >
                              Del
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {/* Aggregate Financial Metrics Embedded Bottom Area */}
      <div className="bg-white dark:bg-slate-850 rounded-3xl shadow-md shadow-slate-200/50 dark:shadow-none border border-slate-200/80 dark:border-slate-750 overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
         <div className="px-5 sm:px-6 py-4 flex justify-between items-center bg-slate-50/60 dark:bg-slate-900/40">
           <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
             TOTAL MONTHLY EXPENSE
           </span>
           <span className="text-base sm:text-xl font-black text-primary font-mono">
             {currency} {fmt(totals.totalExpense)}
           </span>
         </div>
         
         <div className="px-5 sm:px-6 py-4 flex justify-between items-center">
           <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
             {(totals.netCashFlow ?? totals.saving) >= 0 ? 'MONTHLY CASH FLOW (SURPLUS)' : 'MONTHLY CASH FLOW (DEFICIT)'}
           </span>
           <span className={`text-base sm:text-xl font-black font-mono ${(totals.netCashFlow ?? totals.saving) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
             {(totals.netCashFlow ?? totals.saving) < 0 ? '-' : '+'} {currency} {fmt(totals.netCashFlow ?? totals.saving)}
           </span>
         </div>

         {totals.record?.showCctvExpense && (
           <div className="px-5 sm:px-6 py-4 flex justify-between items-center text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20">
             <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">Capital Expenditure (CCTV)</span>
             <span className="text-base sm:text-lg font-black font-mono">- {currency} {fmt(totals.record.cctvExpense)}</span>
           </div>
         )}

         <div className="px-5 sm:px-6 py-4 flex justify-between items-center bg-slate-900 dark:bg-black text-white">
           <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
             {(totals.closingBalance ?? totals.totalSaving) >= 0 ? 'CLOSING BALANCE (ACCUMULATED SURPLUS)' : 'CLOSING BALANCE (OVERDRAWN DEFICIT)'}
           </span>
           <span className={`text-base sm:text-xl font-black font-mono ${(totals.closingBalance ?? totals.totalSaving) >= 0 ? 'text-secondary-gold' : 'text-red-400'}`}>
             {(totals.closingBalance ?? totals.totalSaving) < 0 ? '-' : ''} {currency} {fmt(totals.closingBalance ?? totals.totalSaving)}
           </span>
         </div>
      </div>
    </div>
  )
}

export default ExpenseTable

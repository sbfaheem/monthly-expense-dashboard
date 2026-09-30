import { normalizeItem, getParentCategory } from '../utils/normalizeExpense'
import { MONTH_NAMES } from '../utils/finance'
import { Sparkles, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { translateCategory, translateItemName, translateMonth } from '../utils/translations'

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
  const { lang, t } = useLanguage()
  const isUrdu = lang === 'ur'
  const currency = settings.currency || 'PKR'
  const displayCurrency = isUrdu ? 'روپے' : currency
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
              {t.tableTitle || 'Month-over-Month Expense Breakdown'}
            </h3>
            <span className="text-[11px] sm:text-xs font-black bg-primary/10 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
              {tableRows.length} {isUrdu ? 'اخراجات کی مدیں' : 'Line Items'}
            </span>
          </div>
          <div className="text-xs font-bold text-slate-500 dark:text-slate-400">
            {hasPriorData ? (
              <span>{isUrdu ? 'موازنہ:' : 'Comparing'} <strong>{translateMonth(curMonthShort, isUrdu ? 'ur' : 'en')}</strong> {isUrdu ? 'بمقابلہ' : 'vs.'} <strong>{translateMonth(priorMonthShort, isUrdu ? 'ur' : 'en')}</strong></span>
            ) : (
              <span>{isUrdu ? 'ابتدائی دورانیہ برائے' : 'Baseline period for'} <strong>{translateMonth(curMonthShort, isUrdu ? 'ur' : 'en')}</strong></span>
            )}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 📱 MOBILE VIEW: Layman-Friendly Vertically Stacked Cards (NO horizontal scroll) */}
        {/* ========================================================================= */}
        <div className="block md:hidden p-3.5 sm:p-5 space-y-3.5">
          {tableRows.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-bold text-xs">
              {isUrdu ? `${translateMonth(selectedMonth, 'ur')} کے لیے کوئی اخراجات نہیں ملے۔` : `No expense records found for ${selectedMonth}.`}
            </div>
          ) : (
            tableRows.map((row) => {
              const catClass = CATEGORY_STYLES[row.category] || CATEGORY_STYLES['Community & Utilities']
              return (
                <div
                  key={row.id || row.name}
                  className="bg-slate-50/90 dark:bg-slate-800/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 dark:border-slate-700/80 space-y-3 shadow-xs transition-all"
                >
                  {/* Card Header: Item Name + Category */}
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 leading-snug">
                      {isUrdu ? translateItemName(row.name, 'ur') : row.name}
                    </span>
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex-shrink-0 ${catClass}`}>
                      {isUrdu ? translateCategory(row.category, 'ur') : row.category}
                    </span>
                  </div>

                  {/* Side-by-Side Comparison Box */}
                  <div className="grid grid-cols-2 gap-3 bg-white dark:bg-slate-900/90 p-3 sm:p-3.5 rounded-xl border border-slate-100 dark:border-slate-750">
                    {/* Prior Month */}
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block uppercase tracking-wider mb-0.5">
                        {hasPriorData ? translateMonth(priorMonthShort, isUrdu ? 'ur' : 'en') : (t.colPrevious || 'Prior Month')}
                      </span>
                      <span className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300 font-mono block">
                        {hasPriorData && row.priorAmount > 0 ? `${displayCurrency} ${fmt(row.priorAmount)}` : '—'}
                      </span>
                    </div>

                    {/* Current Month */}
                    <div className="border-l border-slate-100 dark:border-slate-800 pl-3">
                      <span className="text-[11px] font-extrabold text-primary block uppercase tracking-wider mb-0.5">
                        {translateMonth(curMonthShort, isUrdu ? 'ur' : 'en')} ({isUrdu ? 'موجودہ' : 'Current'})
                      </span>
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 font-mono block">
                        {displayCurrency} {fmt(row.currentAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Variance Status Pill & Actions */}
                  <div className="flex items-center justify-between gap-2 pt-1 flex-wrap">
                    {!hasPriorData ? (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-400">
                        {isUrdu ? 'ابتدائی بنیاد' : 'Starting Baseline'}
                      </span>
                    ) : row.isNew ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs sm:text-sm font-black bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-2xs">
                        <Sparkles size={14} /> ✨ {isUrdu ? t.statusNew : 'New this month'}
                      </span>
                    ) : row.diff > 0 ? (
                      <span className="inline-flex items-center gap-1.5 font-black text-rose-600 dark:text-rose-400 text-xs sm:text-sm bg-rose-50 dark:bg-rose-950/50 px-3 py-1.5 rounded-xl border border-rose-200/80 dark:border-rose-900/60">
                        <ArrowUpRight size={15} className="stroke-[3]" />
                        +{displayCurrency} {fmt(row.diff)}
                        {row.pct && <span className="text-xs font-extrabold text-rose-500">({isUrdu ? `${t.statusHigher} ` : ''}+{row.pct}%)</span>}
                      </span>
                    ) : row.diff < 0 ? (
                      <span className="inline-flex items-center gap-1.5 font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60">
                        <ArrowDownRight size={15} className="stroke-[3]" />
                        -{displayCurrency} {fmt(row.diff)}
                        {row.pct && <span className="text-xs font-extrabold text-emerald-600">({isUrdu ? `${t.statusSaved} ` : ''}{row.pct}%)</span>}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 font-bold text-slate-400 dark:text-slate-500 text-xs sm:text-sm">
                        <Minus size={14} /> — {t.statusUnchanged || 'Unchanged'}
                      </span>
                    )}

                    {/* Mobile Admin Actions */}
                    {isAdmin && (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onEdit && onEdit(row.expense)}
                          className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => onDelete && onDelete(row.id)}
                          className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold hover:bg-red-100"
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
          <table className="w-full text-left">
            <thead className="text-xs font-black text-slate-500 uppercase tracking-wider bg-slate-50/70 dark:bg-slate-900/60 border-b border-slate-200/80 dark:border-slate-800">
              <tr>
                <th className="px-4 lg:px-5 py-4 w-[34%]">{t.colItem || 'Line Item'}</th>
                <th className="px-3 lg:px-4 py-4 text-right w-[20%]">
                  {hasPriorData ? `${t.colPrevious || 'Prior'} (${translateMonth(priorMonthShort, isUrdu ? 'ur' : 'en')})` : (t.colPrevious || 'Prior Month')}
                </th>
                <th className="px-3 lg:px-4 py-4 text-right w-[22%]">
                  {`${t.colCurrent || 'Current'} (${translateMonth(curMonthShort, isUrdu ? 'ur' : 'en')})`}
                </th>
                <th className="px-4 lg:px-5 py-4 text-right w-[24%]">{isUrdu ? `${t.colVariance || 'فرق'} اور ${t.colStatus || 'حیثیت'}` : 'Variance & Status'}</th>
                {isAdmin && <th className="px-4 py-4 text-center w-24 border-l border-slate-100 dark:border-slate-800">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {tableRows.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} className="px-6 py-8 text-center text-slate-400 font-bold text-sm">
                    {isUrdu ? `${translateMonth(selectedMonth, 'ur')} کے لیے کوئی اخراجات نہیں ملے۔` : `No expense records found for ${selectedMonth}.`}
                  </td>
                </tr>
              ) : (
                tableRows.map((row) => {
                  const catClass = CATEGORY_STYLES[row.category] || CATEGORY_STYLES['Community & Utilities']
                  return (
                    <tr key={row.id || row.name} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Column 1: Line Item & Normalized Parent Category Tag */}
                      <td className="px-4 lg:px-5 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-sm lg:text-base font-black text-slate-900 dark:text-slate-100 leading-snug">
                            {isUrdu ? translateItemName(row.name, 'ur') : row.name}
                          </span>
                          <span className={`inline-flex items-center w-fit text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${catClass}`}>
                            {isUrdu ? translateCategory(row.category, 'ur') : row.category}
                          </span>
                        </div>
                      </td>

                      {/* Column 2: Prior Month (PKR) */}
                      <td className="px-3 lg:px-4 py-4 text-right">
                        {hasPriorData && row.priorAmount > 0 ? (
                          <span className="text-sm lg:text-base font-semibold text-slate-600 dark:text-slate-300 font-mono whitespace-nowrap">
                            {displayCurrency} {fmt(row.priorAmount)}
                          </span>
                        ) : (
                          <span className="text-sm font-bold text-slate-300 dark:text-slate-600 font-mono">
                            —
                          </span>
                        )}
                      </td>

                      {/* Column 3: Current Month (PKR) */}
                      <td className="px-3 lg:px-4 py-4 text-right">
                        <span className="text-sm lg:text-base font-black text-slate-900 dark:text-slate-100 font-mono whitespace-nowrap">
                          {displayCurrency} {fmt(row.currentAmount)}
                        </span>
                      </td>

                      {/* Column 4: Variance & Status Badge */}
                      <td className="px-4 lg:px-5 py-4 text-right">
                        {!hasPriorData ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400">
                            {isUrdu ? 'ابتدائی بنیاد' : 'Baseline'}
                          </span>
                        ) : row.isNew ? (
                          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 shadow-2xs">
                            <Sparkles size={13} /> {isUrdu ? t.statusNew : 'NEW'}
                          </span>
                        ) : row.diff > 0 ? (
                          <span className="inline-flex items-center gap-1 font-black text-rose-600 dark:text-rose-400 text-xs lg:text-sm bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1.5 rounded-xl border border-rose-200/80 dark:border-rose-900/60 whitespace-nowrap">
                            <TrendingUp size={14} className="stroke-[2.5]" />
                            +{displayCurrency} {fmt(row.diff)}
                            {row.pct && <span className="text-[11px] font-extrabold text-rose-500">({isUrdu ? `${t.statusHigher} ` : ''}▲ {row.pct}%)</span>}
                          </span>
                        ) : row.diff < 0 ? (
                          <span className="inline-flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400 text-xs lg:text-sm bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 whitespace-nowrap">
                            <TrendingDown size={14} className="stroke-[2.5]" />
                            -{displayCurrency} {fmt(row.diff)}
                            {row.pct && <span className="text-[11px] font-extrabold text-emerald-600">({isUrdu ? `${t.statusSaved} ` : ''}▼ {Math.abs(row.pct)}%)</span>}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-400 dark:text-slate-500 text-xs">
                            <Minus size={12} /> — {t.statusUnchanged || 'Unchanged'}
                          </span>
                        )}
                      </td>

                      {/* Actions column for Admin */}
                      {isAdmin && (
                        <td className="px-4 py-4 border-l border-slate-100 dark:border-slate-800 text-center">
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
             {isUrdu ? 'کل ماہانہ اخراجات' : 'TOTAL MONTHLY EXPENSE'}
           </span>
           <span className="text-base sm:text-xl font-black text-primary font-mono">
             {displayCurrency} {fmt(totals.totalExpense)}
           </span>
         </div>
         
         <div className="px-5 sm:px-6 py-4 flex justify-between items-center">
           <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
             {(totals.netCashFlow ?? totals.saving) >= 0 
               ? (isUrdu ? 'ماہانہ کیش فلو (سرپلس / بچت)' : 'MONTHLY CASH FLOW (SURPLUS)') 
               : (isUrdu ? 'ماہانہ کیش فلو (خسارہ)' : 'MONTHLY CASH FLOW (DEFICIT)')}
           </span>
           <span className={`text-base sm:text-xl font-black font-mono ${(totals.netCashFlow ?? totals.saving) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
             {(totals.netCashFlow ?? totals.saving) < 0 ? '-' : '+'} {displayCurrency} {fmt(totals.netCashFlow ?? totals.saving)}
           </span>
         </div>

         {totals.record?.showCctvExpense && (
           <div className="px-5 sm:px-6 py-4 flex justify-between items-center text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20">
             <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
               {isUrdu ? 'بڑے اثاثے (سی سی ٹی وی کیمرے)' : 'Capital Expenditure (CCTV)'}
             </span>
             <span className="text-base sm:text-lg font-black font-mono">- {displayCurrency} {fmt(totals.record.cctvExpense)}</span>
           </div>
         )}

         <div className="px-5 sm:px-6 py-4 flex justify-between items-center bg-slate-900 dark:bg-black text-white">
           <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
             {(totals.closingBalance ?? totals.totalSaving) >= 0 
               ? (isUrdu ? 'اختتامی بیلنس (محفوظ فنڈ)' : 'CLOSING BALANCE (ACCUMULATED SURPLUS)') 
               : (isUrdu ? 'اختتامی بیلنس (خسارہ / بقایا جات)' : 'CLOSING BALANCE (OVERDRAWN DEFICIT)')}
           </span>
           <span className={`text-base sm:text-xl font-black font-mono ${(totals.closingBalance ?? totals.totalSaving) >= 0 ? 'text-secondary-gold' : 'text-red-400'}`}>
             {(totals.closingBalance ?? totals.totalSaving) < 0 ? '-' : ''} {displayCurrency} {fmt(totals.closingBalance ?? totals.totalSaving)}
           </span>
         </div>
      </div>
    </div>
  )
}

export default ExpenseTable

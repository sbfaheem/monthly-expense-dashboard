import React, { useState, useRef } from 'react'
import { useInView } from 'framer-motion'
import { Receipt, RotateCcw } from 'lucide-react'
import { soundEffects } from '../utils/soundEffects'
import { normalizeItem, getParentCategory } from '../utils/normalizeExpense'
import { MONTH_NAMES } from '../utils/finance'
import { useLanguage } from '../context/LanguageContext'
import { translateMonth } from '../utils/translations'
import GlassCard from './motion/GlassCard'
import AnimatedNumber from './motion/AnimatedNumber'
import ReceiptRow from './table/ReceiptRow'

const pkrFormatter = new Intl.NumberFormat('en-PK', { maximumFractionDigits: 0 })

const ExpenseTable = ({
  expenses = [],
  allExpenses = [],
  settings = {},
  selectedMonth = '',
  totals = {},
  onEdit,
  onDelete,
  isAdmin = false,
}) => {
  const { lang, t } = useLanguage()
  const isUrdu = lang === 'ur'
  const currency = settings.currency || 'PKR'
  const displayCurrency = isUrdu ? 'روپے' : currency
  const fmt = (n) => pkrFormatter.format(Math.round(Math.abs(Number(n) || 0)))

  const sectionRef = useRef(null)
  const inView = useInView(sectionRef, { once: true, amount: 0.06 })
  const [replayKey, setReplayKey] = useState(0)

  // Expandable Row State (strictly one unfolded 3D receipt at a time)
  const [expandedRowId, setExpandedRowId] = useState(null)
  const toggleRow = (id) => {
    setExpandedRowId((prev) => {
      const isOpening = prev !== id
      if (isOpening) {
        soundEffects.playBounce()
      }
      return isOpening ? id : null
    })
  }

  const handleReplay = () => {
    soundEffects.playBounce()
    setReplayKey((k) => k + 1)
  }

  // Determine prior month cleanly (data calculation untouched)
  let priorMonth = ''
  let priorMonthShort = 'Prior'
  let curMonthShort = 'Current'

  if (selectedMonth && typeof selectedMonth === 'string') {
    const parts = selectedMonth.trim().split(/\s+/)
    const mName = parts[0] || ''
    const year = Number(parts[1])
    const mIndex = MONTH_NAMES.indexOf(mName)
    curMonthShort = `${mName.slice(0, 3)} ${year || ''}`.trim()

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

  const priorExpenses = (allExpenses || []).filter((e) => e.month === priorMonth)
  const hasPriorData = priorExpenses.length > 0

  // Pre-aggregate prior month expenses by normalized item name
  const priorMap = {}
  priorExpenses.forEach((e) => {
    const norm = normalizeItem(e.name)
    priorMap[norm] = (priorMap[norm] || 0) + Number(e.amount || 0)
  })

  // Build current month rows with MoM comparison
  const tableRows = expenses.map((e) => {
    const normName = normalizeItem(e.name)
    const category = getParentCategory(normName, e.category)
    const currentAmount = Number(e.amount || 0)
    const priorAmount = priorMap[normName] || 0
    const isNew = !hasPriorData ? false : priorAmount === 0 && currentAmount > 0
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
      expense: e,
    }
  })

  return (
    <section ref={sectionRef} className="space-y-5">
      {/* Main Glass Table Container (overflow-x-clip keeps sticky thead working cleanly) */}
      <GlassCard glow="none" className="rounded-3xl overflow-x-clip">
        {/* Title Bar + Replay Control */}
        <div className="px-4 sm:px-6 py-4 bg-white/60 dark:bg-white/[0.04] border-b border-slate-200/80 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base md:text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                {t.tableTitle || 'Month-over-Month Expense Comparison'}
              </h3>
              <span className="text-[11px] font-black bg-indigo-500/12 text-indigo-700 dark:text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-400/30 whitespace-nowrap">
                {tableRows.length} {isUrdu ? 'اخراجات کی مدیں' : 'Line Items'}
              </span>
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs font-bold text-slate-500 dark:text-slate-400">
              {hasPriorData ? (
                <span>
                  {isUrdu ? 'موازنہ:' : 'Comparing'}{' '}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {translateMonth(curMonthShort, isUrdu ? 'ur' : 'en')}
                  </strong>{' '}
                  {isUrdu ? 'بمقابلہ' : 'vs.'}{' '}
                  <strong className="text-slate-700 dark:text-slate-200">
                    {translateMonth(priorMonthShort, isUrdu ? 'ur' : 'en')}
                  </strong>
                </span>
              ) : (
                <span>
                  {isUrdu ? 'ابتدائی دورانیہ برائے' : 'Baseline period for'}{' '}
                  <strong>{translateMonth(curMonthShort, isUrdu ? 'ur' : 'en')}</strong>
                </span>
              )}
              <span className="hidden sm:inline text-slate-300 dark:text-slate-600">•</span>
              <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500 dark:text-slate-400 whitespace-nowrap">
                <Receipt size={12} className="text-amber-500 shrink-0" />
                <span>
                  {isUrdu ? 'رسید دیکھنے کے لیے قطار پر کلک کریں' : 'Click row to unfold 3D receipt'}
                </span>
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleReplay}
            className="min-h-[44px] sm:min-h-[38px] px-3.5 py-1.5 rounded-2xl bg-white/75 hover:bg-white dark:bg-white/[0.08] dark:hover:bg-white/[0.14] border border-slate-200/80 dark:border-white/15 text-slate-700 dark:text-slate-200 text-xs font-extrabold flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer self-start sm:self-auto shrink-0 whitespace-nowrap"
          >
            <RotateCcw size={14} className="text-indigo-600 dark:text-indigo-300" />
            <span>{isUrdu ? 'دوبارہ دیکھیں' : 'Replay'}</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* MOBILE VIEW (< md): Vertically Stacked Glass Cards + Inline 3D Receipts    */}
        {/* ========================================================================= */}
        <div className="block md:hidden p-3.5 sm:p-5 space-y-3.5">
          {tableRows.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-bold text-xs">
              {isUrdu
                ? `${translateMonth(selectedMonth, 'ur')} کے لیے کوئی اخراجات نہیں ملے۔`
                : `No expense records found for ${selectedMonth}.`}
            </div>
          ) : (
            tableRows.map((row, idx) => {
              const rowKey = row.id || row.name
              return (
                <ReceiptRow
                  key={`${rowKey}-mob`}
                  variant="mobile"
                  row={row}
                  index={idx}
                  isExpanded={expandedRowId === rowKey}
                  onToggle={toggleRow}
                  hasPriorData={hasPriorData}
                  displayCurrency={displayCurrency}
                  fmt={fmt}
                  isUrdu={isUrdu}
                  t={t}
                  priorMonthShort={priorMonthShort}
                  curMonthShort={curMonthShort}
                  isAdmin={isAdmin}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  inView={inView}
                  replayKey={replayKey}
                />
              )
            })
          )}
        </div>

        {/* ========================================================================= */}
        {/* DESKTOP VIEW (md+): Sticky Glass Header Table with 3D Flip & Unfold Rows */}
        {/* ========================================================================= */}
        <div className="hidden md:block">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 z-10 text-xs font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200/80 dark:border-white/12">
              <tr>
                <th className="px-4 lg:px-5 py-3.5 w-[35%]">{t.colItem || 'Line Item'}</th>
                <th className="px-3 lg:px-4 py-3.5 text-right w-[18%] whitespace-nowrap">
                  {hasPriorData
                    ? `${t.colPrevious || 'Prior'} (${translateMonth(
                        priorMonthShort,
                        isUrdu ? 'ur' : 'en'
                      )})`
                    : t.colPrevious || 'Prior Month'}
                </th>
                <th className="px-3 lg:px-4 py-3.5 text-right w-[19%] whitespace-nowrap">
                  {`${t.colCurrent || 'Current'} (${translateMonth(
                    curMonthShort,
                    isUrdu ? 'ur' : 'en'
                  )})`}
                </th>
                <th className="px-4 lg:px-5 py-3.5 text-right w-[28%] whitespace-nowrap">
                  {isUrdu ? `${t.colVariance || 'فرق'} اور ${t.colStatus || 'حیثیت'}` : 'Variance & Status'}
                </th>
                {isAdmin && (
                  <th className="px-4 py-3.5 text-center w-24 border-l border-slate-200/60 dark:border-slate-800">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/60 dark:divide-white/[0.07]">
              {tableRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={isAdmin ? 5 : 4}
                    className="px-6 py-8 text-center text-slate-400 font-bold text-sm"
                  >
                    {isUrdu
                      ? `${translateMonth(selectedMonth, 'ur')} کے لیے کوئی اخراجات نہیں ملے۔`
                      : `No expense records found for ${selectedMonth}.`}
                  </td>
                </tr>
              ) : (
                tableRows.map((row, idx) => {
                  const rowKey = row.id || row.name
                  return (
                    <ReceiptRow
                      key={`${rowKey}-desk`}
                      variant="desktop"
                      row={row}
                      index={idx}
                      isExpanded={expandedRowId === rowKey}
                      onToggle={toggleRow}
                      hasPriorData={hasPriorData}
                      displayCurrency={displayCurrency}
                      fmt={fmt}
                      isUrdu={isUrdu}
                      t={t}
                      priorMonthShort={priorMonthShort}
                      curMonthShort={curMonthShort}
                      isAdmin={isAdmin}
                      onEdit={onEdit}
                      onDelete={onDelete}
                      inView={inView}
                      replayKey={replayKey}
                    />
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Aggregate Financial Metrics Summary Strip */}
      <GlassCard glow="none" className="rounded-3xl overflow-hidden divide-y divide-slate-200/70 dark:divide-white/[0.08]">
        <div className="px-5 sm:px-6 py-4 flex justify-between items-center bg-white/50 dark:bg-white/[0.03] gap-3">
          <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            {isUrdu ? 'کل ماہانہ اخراجات' : 'TOTAL MONTHLY EXPENSE'}
          </span>
          <AnimatedNumber
            value={totals.totalExpense || 0}
            from={inView ? 0 : totals.totalExpense || 0}
            prefix={displayCurrency}
            duration={0.85}
            triggerKey={replayKey}
            className="text-base sm:text-xl font-black text-primary"
          />
        </div>

        <div className="px-5 sm:px-6 py-4 flex justify-between items-center gap-3">
          <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
            {(totals.netCashFlow ?? totals.saving) >= 0
              ? isUrdu
                ? 'ماہانہ کیش فلو (سرپلس / بچت)'
                : 'MONTHLY CASH FLOW (SURPLUS)'
              : isUrdu
              ? 'ماہانہ کیش فلو (خسارہ)'
              : 'MONTHLY CASH FLOW (DEFICIT)'}
          </span>
          <AnimatedNumber
            value={totals.netCashFlow ?? totals.saving ?? 0}
            from={inView ? 0 : totals.netCashFlow ?? totals.saving ?? 0}
            prefix={displayCurrency}
            showPlus
            duration={0.85}
            triggerKey={replayKey}
            className={`text-base sm:text-xl font-black ${
              (totals.netCashFlow ?? totals.saving) >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          />
        </div>

        {totals.record?.showCctvExpense && (
          <div className="px-5 sm:px-6 py-4 flex justify-between items-center text-rose-600 dark:text-rose-400 bg-rose-500/8 gap-3">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
              {isUrdu ? 'بڑے اثاثے (سی سی ٹی وی کیمرے)' : 'Capital Expenditure (CCTV)'}
            </span>
            <span
              dir="ltr"
              style={{ direction: 'ltr', unicodeBidi: 'isolate' }}
              className="text-base sm:text-lg font-black font-mono tabular-nums whitespace-nowrap"
            >
              - {displayCurrency} {fmt(totals.record.cctvExpense)}
            </span>
          </div>
        )}

        <div className="px-5 sm:px-6 py-4 flex justify-between items-center bg-slate-900/95 dark:bg-black/85 text-white gap-3">
          <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
            {(totals.closingBalance ?? totals.totalSaving) >= 0
              ? isUrdu
                ? 'اختتامی بیلنس (محفوظ فنڈ)'
                : 'CLOSING BALANCE (ACCUMULATED SURPLUS)'
              : isUrdu
              ? 'اختتامی بیلنس (خسارہ / بقایا جات)'
              : 'CLOSING BALANCE (OVERDRAWN DEFICIT)'}
          </span>
          <AnimatedNumber
            value={totals.closingBalance ?? totals.totalSaving ?? 0}
            from={inView ? 0 : totals.closingBalance ?? totals.totalSaving ?? 0}
            prefix={displayCurrency}
            signBeforeNumber
            duration={0.85}
            triggerKey={replayKey}
            className={`text-base sm:text-xl font-black ${
              (totals.closingBalance ?? totals.totalSaving) >= 0
                ? 'text-secondary-gold'
                : 'text-rose-400'
            }`}
          />
        </div>
      </GlassCard>
    </section>
  )
}

export default ExpenseTable

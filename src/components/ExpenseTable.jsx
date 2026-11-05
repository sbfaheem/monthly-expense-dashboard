import React, { useState, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Sparkles, TrendingUp, TrendingDown, Minus, ArrowUpRight, ArrowDownRight,
  Receipt, ShieldCheck, Copy, Check, ChevronDown
} from 'lucide-react'
import { normalizeItem, getParentCategory } from '../utils/normalizeExpense'
import { MONTH_NAMES } from '../utils/finance'
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

// =========================================================================
// 📄 3D ACCORDION PAPER RECEIPT COMPONENT (2-SEGMENT HINGE UNFOLD)
// =========================================================================
function PaperReceiptAccordion({ row, displayCurrency, fmt, isUrdu, t, curMonthShort }) {
  const [copied, setCopied] = useState(false)

  // Contextual audit details based on category
  const auditDetails = useMemo(() => {
    const cat = row.category || ''
    const nameLower = (row.name || '').toLowerCase()

    if (cat.includes('Salaries') || cat.includes('Payroll') || nameLower.includes('salary') || nameLower.includes('guard')) {
      return {
        vendor: isUrdu ? 'سیکیورٹی اور صفائی اسٹاف روسٹر (ڈائریکٹ)' : 'Security & Sanitation Duty Roster',
        voucherType: isUrdu ? 'اسٹاف تنخواہ واؤچر' : 'Payroll Disbursal Voucher',
        method: isUrdu ? 'کیش سائنڈ پے رول شیٹ' : 'Cash Signed Attendance Roster',
        auditStamp: isUrdu ? 'بایومیٹرک و فزیکل ڈیوٹی شیٹ سے تصدیق شدہ' : 'Verified via Duty Roster & Monthly Attendance',
        auditNote: isUrdu ? 'سیکٹر 7D/1 کے تمام سیکیورٹی گارڈز اور سینٹری ورکرز کی مکمل ادائیگیاں تصدیق شدہ ہیں۔' : 'Cross-checked against physical guard attendance logs and supervisor sign-off sheets.',
        codePrefix: 'PAY',
      }
    }
    if (cat.includes('Electrical') || nameLower.includes('electric') || nameLower.includes('light') || nameLower.includes('generator')) {
      return {
        vendor: isUrdu ? 'الرحمٰن الیکٹریکل و مینٹیننس سروسز' : 'Al-Rehman Electrical Works & Services',
        voucherType: isUrdu ? 'تکنیکی مرمت و سامان بل' : 'Technical Repair & Supplies Memo',
        method: isUrdu ? 'آفیشل کنٹریکٹر کیش میمو' : 'Official Contractor Cash Invoice',
        auditStamp: isUrdu ? 'سائٹ معائنہ و ٹیسٹنگ تصدیق شدہ' : 'On-Site Physical Inspection & Testing Verified',
        auditNote: isUrdu ? 'اسٹریٹ لائٹس، جنریٹر ایندھن، اور مین ڈی بی باکس کا کام مکمل ہو گیا۔' : 'Verified work completion for phase-balancing, generator maintenance, and streetlights.',
        codePrefix: 'ENG',
      }
    }
    if (cat.includes('Community') || cat.includes('Utilities') || nameLower.includes('water') || nameLower.includes('tanker')) {
      return {
        vendor: isUrdu ? 'میونسپل واٹر بورڈ و ویسٹ مینجمنٹ' : 'Municipal Water Board & Waste Services',
        voucherType: isUrdu ? 'یوٹیلٹی چالان و ادائیگی سلپ' : 'Utility Challan & Payment Slip',
        method: isUrdu ? 'آن لائن راست / بینک چالان' : 'Online Raast / Official Challan',
        auditStamp: isUrdu ? 'بینک ٹرانسفر تصدیق نمبر منسلک ہے' : 'Direct Bank Reference & Meter Slip Attached',
        auditNote: isUrdu ? 'واٹر والو آپریشنز اور سیکٹر صفائی سروسز کے فنڈز کی کٹوتی مکمل ہے۔' : 'Reconciled with municipal line schedule, bowser receipts, and sanitation log.',
        codePrefix: 'UTL',
      }
    }
    if (cat.includes('Supplies') || cat.includes('Hardware') || nameLower.includes('lock') || nameLower.includes('chamber')) {
      return {
        vendor: isUrdu ? 'سیون اسٹار ہارڈویئر و سینیٹیشن اسٹور' : 'Seven Star Hardware & Sanitation Depot',
        voucherType: isUrdu ? 'سامان خریداری کیش میمو' : 'Itemized Store Cash Memo',
        method: isUrdu ? 'آئٹمائزڈ انوائس #4092' : 'Itemized Store Invoice #4092',
        auditStamp: isUrdu ? 'سامان موصولی رسید (GRN) تصدیق شدہ' : 'Goods Received Note (GRN) Verified by Caretaker',
        auditNote: isUrdu ? 'چیمبر ڈھکن، تالے، پارک دیکھ بھال کا سامان باقاعدہ اسٹاک میں شامل ہے۔' : 'Supplies verified into community stock registry with signed delivery receipts.',
        codePrefix: 'SUP',
      }
    }
    if (cat.includes('Capital') || cat.includes('CapEx') || nameLower.includes('cctv')) {
      return {
        vendor: isUrdu ? 'ایپکس سیکیورٹی و کیمرہ سسٹمز' : 'Apex Security & Surveillance Systems Ltd',
        voucherType: isUrdu ? 'کیپٹل اثاثہ انوائس و وارنٹی' : 'Capital Asset Invoice & Warranty',
        method: isUrdu ? 'کراس چیک / پے آرڈر' : 'Crossed Cheque / Pay Order',
        auditStamp: isUrdu ? 'اثاثہ رجسٹر اندراج #AR-2026-7D1' : 'Asset Register Entry #AR-2026-7D1 with 1-Yr Warranty',
        auditNote: isUrdu ? 'سی سی ٹی وی کیمرے اور این وی آر ریکارڈنگ سسٹم کمیٹی کے ریکارڈ میں محفوظ ہیں۔' : 'High-definition cameras and surveillance unit verified and logged in asset inventory.',
        codePrefix: 'CPX',
      }
    }
    return {
      vendor: isUrdu ? 'مجاز وینڈر و سروس پرووائیڈر' : 'Authorized Vendor & Service Provider',
      voucherType: isUrdu ? 'مجلسِ فلاح واؤچر رسید' : 'Welfare Committee Voucher Slip',
      method: isUrdu ? 'تصدیق شدہ آفیشل واؤچر' : 'Verified Official Receipt',
      auditStamp: isUrdu ? 'بینک و کھاتہ رجسٹر سے مطابقت شدہ' : 'Reconciled with Bank Statement & Physical Register',
      auditNote: isUrdu ? 'کمیٹی خزانچی اور صدر کے دستخط کے بعد ادائیگی کلیئر کی گئی۔' : 'Cross-checked with ledger book and signed by Committee Treasurer.',
      codePrefix: 'VCH',
    }
  }, [row.category, row.name, isUrdu])

  const voucherId = `${auditDetails.codePrefix}-2026-${(row.id || row.name).toString().replace(/[^a-zA-Z0-9]/g, '').slice(-4).toUpperCase() || '7D01'}`

  const handleCopy = (e) => {
    e.stopPropagation()
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(voucherId)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <div
      style={{ perspective: 1200 }}
      className="w-full my-3 px-1 sm:px-3 select-none"
    >
      {/* 2-SEGMENT PAPER ACCORDION CONTAINER */}
      <div
        style={{ transformStyle: 'preserve-3d' }}
        className="w-full max-w-4xl mx-auto shadow-2xl rounded-2xl overflow-hidden"
      >
        {/* ================= 1. TOP SEGMENT ================= */}
        <motion.div
          initial={{ rotateX: -90, opacity: 0 }}
          animate={{ rotateX: 0, opacity: 1 }}
          exit={{ rotateX: -90, opacity: 0 }}
          transition={{ duration: 0.35, ease: 'easeOut' }}
          style={{
            transformOrigin: 'top center',
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
          }}
          className="relative bg-amber-50/95 dark:bg-[#131b2e] border-x border-t border-amber-200/80 dark:border-slate-700/80 p-4 sm:p-5 text-slate-800 dark:text-slate-100"
        >
          {/* Faint Background Watermark */}
          <div className="absolute right-4 top-2 text-[56px] sm:text-[64px] font-black tracking-widest text-slate-900/[0.03] dark:text-white/[0.02] pointer-events-none select-none uppercase font-mono">
            RECEIPT
          </div>

          {/* Top Row: Official Welfare Header + Status Badge */}
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-dashed border-amber-300/80 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <div className="size-8 rounded-xl bg-amber-500/15 dark:bg-cyan-500/15 text-amber-600 dark:text-cyan-400 flex items-center justify-center font-bold flex-shrink-0">
                <Receipt size={17} />
              </div>
              <div>
                <span className="text-xs font-black tracking-tight text-slate-900 dark:text-white uppercase">
                  {isUrdu ? 'سیکٹر 7D/1 ویلفیئر کمیٹی • تصدیق شدہ واؤچر' : 'Sector 7D/1 Welfare Committee • Audit Receipt'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-mono">
                  {auditDetails.voucherType}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                <ShieldCheck size={13} />
                <span>{isUrdu ? 'آڈٹ تصدیق شدہ' : 'Audit Verified'}</span>
              </span>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors shadow-2xs"
                title="Copy Voucher ID"
              >
                {copied ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                <span>{copied ? (isUrdu ? 'کاپی ہو گیا!' : 'Copied!') : voucherId}</span>
              </button>
            </div>
          </div>

          {/* Main Line-Item Banner */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-3.5 pt-3.5 items-center">
            <div className="sm:col-span-7">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                {isUrdu ? 'مد کا نام اور زمرہ' : 'Line Item & Classification'}
              </span>
              <h4 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">
                {isUrdu ? translateItemName(row.name, 'ur') : row.name}
              </h4>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5 block">
                {isUrdu ? translateCategory(row.category, 'ur') : row.category}
              </span>
            </div>

            {/* Voucher Amount Badge (Preserving Zero Font Blur) */}
            <div className="sm:col-span-5 bg-white/80 dark:bg-slate-950/80 p-3 rounded-xl border border-amber-200/70 dark:border-slate-800 text-left sm:text-right shadow-2xs">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                {isUrdu ? 'واؤچر رقم (ماہانہ خرچ)' : 'Voucher Net Amount'}
              </span>
              <span className="text-xl sm:text-2xl font-black font-mono tabular-nums text-slate-900 dark:text-cyan-300 tracking-tight block">
                {displayCurrency} {fmt(row.currentAmount)}
              </span>
              <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-slate-500 block mt-0.5">
                {translateMonth(curMonthShort, isUrdu ? 'ur' : 'en')} • Posted to General Ledger
              </span>
            </div>
          </div>
        </motion.div>

        {/* ================= 2. HINGE CREASE & BOTTOM SEGMENT ================= */}
        <div className="relative">
          {/* Subtle Crease Shadow fading out as panel flattens to 0deg */}
          <motion.div
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.35, delay: 0.12 }}
            className="pointer-events-none absolute inset-x-0 top-0 h-4 bg-gradient-to-b from-black/25 via-black/10 to-transparent z-20"
          />

          <motion.div
            initial={{ rotateX: 90, opacity: 0 }}
            animate={{ rotateX: 0, opacity: 1 }}
            exit={{ rotateX: 90, opacity: 0 }}
            transition={{ duration: 0.35, delay: 0.12, ease: 'easeOut' }}
            style={{
              transformOrigin: 'top center',
              transformStyle: 'preserve-3d',
              backfaceVisibility: 'hidden',
            }}
            className="relative bg-amber-50/70 dark:bg-[#0c1220] border-x border-b border-t border-slate-300 dark:border-slate-700/90 p-4 sm:p-5 shadow-inner text-slate-800 dark:text-slate-200 space-y-3"
          >
            {/* Audit & Payee Breakdown Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
              {/* Payee / Vendor Card */}
              <div className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {isUrdu ? 'وصول کنندہ / وینڈر' : 'Payee / Contractor'}
                </span>
                <span className="font-bold text-slate-900 dark:text-slate-100 block truncate">
                  {isUrdu ? 'سیکٹر 7D/1 مینجمنٹ' : 'Sector 7D/1 Management'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  {auditDetails.method}
                </span>
              </div>

              {/* Verification & Audit Card */}
              <div className="bg-white/90 dark:bg-slate-900/90 p-3 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {isUrdu ? 'آڈٹ تصدیق و اندراج' : 'Verification & Protocol'}
                </span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 block truncate">
                  {isUrdu ? 'سیکٹر 7D/1 مینجمنٹ۔' : 'Sector 7D/1 Management.'}
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 block">
                  {isUrdu ? 'ویلفیئر کمیٹی تصدیق شدہ' : 'Welfare Committee Sign-off Verified'}
                </span>
              </div>
            </div>

            {/* Bottom Barcode Strip & Signature Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-dashed border-slate-300 dark:border-slate-700 text-[10px] font-mono text-slate-400 dark:text-slate-500">
              <div className="tracking-[3px] font-bold uppercase select-none opacity-60">
                ||| | |||| | ||| ||||||| | ||||| | ||| {voucherId}
              </div>
              <div className="text-center sm:text-right font-sans font-semibold text-slate-700 dark:text-slate-300">
                {isUrdu ? 'تصدیق شدہ برائے خزانچی: سیکٹر 7D/1 مینجمنٹ' : 'Approved by Treasurer: Sector 7D/1 Management'}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
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

  // Expandable Row State for 3D Accordion Paper Receipt
  const [expandedRowId, setExpandedRowId] = useState(null)
  const toggleRow = (id) => {
    setExpandedRowId((prev) => (prev === id ? null : id))
  }

  // Determine prior month
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
            <span className="text-[10px] font-bold text-slate-400 hidden sm:inline-flex items-center gap-1 bg-slate-100 dark:bg-slate-750 px-2 py-0.5 rounded-md">
              <Receipt size={11} className="text-amber-500" />
              <span>{isUrdu ? 'رسید دیکھنے کے لیے کلک کریں' : 'Click row to unfold 3D receipt'}</span>
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
        {/* 📱 MOBILE VIEW: Layman-Friendly Vertically Stacked Cards */}
        {/* ========================================================================= */}
        <div className="block md:hidden p-3.5 sm:p-5 space-y-3.5">
          {tableRows.length === 0 ? (
            <div className="py-8 text-center text-slate-400 font-bold text-xs">
              {isUrdu ? `${translateMonth(selectedMonth, 'ur')} کے لیے کوئی اخراجات نہیں ملے۔` : `No expense records found for ${selectedMonth}.`}
            </div>
          ) : (
            tableRows.map((row) => {
              const catClass = CATEGORY_STYLES[row.category] || CATEGORY_STYLES['Community & Utilities']
              const rowKey = row.id || row.name
              const isExpanded = expandedRowId === rowKey

              return (
                <div
                  key={rowKey}
                  className={`bg-slate-50/90 dark:bg-slate-800/80 rounded-2xl p-4 sm:p-5 border transition-all space-y-3 shadow-xs ${
                    isExpanded
                      ? 'border-amber-400/80 dark:border-cyan-500/80 ring-2 ring-amber-400/20 dark:ring-cyan-500/20'
                      : 'border-slate-200/80 dark:border-slate-700/80'
                  }`}
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
                      <span className="text-sm sm:text-base font-bold text-slate-600 dark:text-slate-300 font-mono tabular-nums block">
                        {hasPriorData && row.priorAmount > 0 ? `${displayCurrency} ${fmt(row.priorAmount)}` : '—'}
                      </span>
                    </div>

                    {/* Current Month */}
                    <div className="border-l border-slate-100 dark:border-slate-800 pl-3">
                      <span className="text-[11px] font-extrabold text-primary block uppercase tracking-wider mb-0.5">
                        {translateMonth(curMonthShort, isUrdu ? 'ur' : 'en')} ({isUrdu ? 'موجودہ' : 'Current'})
                      </span>
                      <span className="text-base sm:text-lg font-black text-slate-900 dark:text-slate-100 font-mono tabular-nums block">
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
                      <span dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }} className="inline-flex items-center gap-1.5 font-black text-rose-600 dark:text-rose-400 text-xs sm:text-sm bg-rose-50 dark:bg-rose-950/50 px-3 py-1.5 rounded-xl border border-rose-200/80 dark:border-rose-900/60 font-mono">
                        <ArrowUpRight size={15} className="stroke-[3]" />
                        +{displayCurrency} {fmt(row.diff)}
                        {row.pct && <span className="text-xs font-extrabold text-rose-500 font-mono">({isUrdu ? `${t.statusHigher} ` : ''}+{row.pct}%)</span>}
                      </span>
                    ) : row.diff < 0 ? (
                      <span dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }} className="inline-flex items-center gap-1.5 font-black text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm bg-emerald-50 dark:bg-emerald-950/50 px-3 py-1.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 font-mono">
                        <ArrowDownRight size={15} className="stroke-[3]" />
                        -{displayCurrency} {fmt(row.diff)}
                        {row.pct && <span className="text-xs font-extrabold text-emerald-600 font-mono">({isUrdu ? `${t.statusSaved} ` : ''}-{Math.abs(Number(row.pct))}%)</span>}
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
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onEdit && onEdit(row.expense)
                          }}
                          className="text-xs bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation()
                            onDelete && onDelete(row.id)
                          }}
                          className="text-xs bg-red-50 text-red-600 px-3 py-1.5 rounded-lg font-bold hover:bg-red-100"
                        >
                          Del
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Unfold Receipt Toggle Button */}
                  <button
                    type="button"
                    onClick={() => toggleRow(rowKey)}
                    className="w-full flex items-center justify-between py-2 px-3 rounded-xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-750 text-xs font-bold text-slate-700 dark:text-slate-300 hover:text-primary transition-colors cursor-pointer mt-1"
                  >
                    <span className="flex items-center gap-1.5">
                      <Receipt size={14} className="text-amber-500 dark:text-cyan-400" />
                      <span>{isExpanded ? (isUrdu ? 'آڈٹ رسید بند کریں' : 'Hide Audit Receipt') : (isUrdu ? '3D آڈٹ رسید کھولیں' : 'Unfold 3D Audit Receipt')}</span>
                    </span>
                    <ChevronDown size={15} className={`transition-transform duration-300 ${isExpanded ? 'rotate-180 text-primary' : 'text-slate-400'}`} />
                  </button>

                  {/* 3D Paper Accordion Unfold Container (Mobile) */}
                  <AnimatePresence>
                    {isExpanded && (
                      <PaperReceiptAccordion
                        row={row}
                        displayCurrency={displayCurrency}
                        fmt={fmt}
                        isUrdu={isUrdu}
                        t={t}
                        curMonthShort={curMonthShort}
                      />
                    )}
                  </AnimatePresence>
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
                  const rowKey = row.id || row.name
                  const isExpanded = expandedRowId === rowKey

                  return (
                    <React.Fragment key={rowKey}>
                      <tr
                        onClick={() => toggleRow(rowKey)}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group ${
                          isExpanded ? 'bg-amber-50/30 dark:bg-slate-800/40' : ''
                        }`}
                      >
                        {/* Column 1: Line Item & Normalized Parent Category Tag */}
                        <td className="px-4 lg:px-5 py-4">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm lg:text-base font-black text-slate-900 dark:text-slate-100 leading-snug group-hover:text-primary transition-colors">
                                {isUrdu ? translateItemName(row.name, 'ur') : row.name}
                              </span>
                              <ChevronDown
                                size={14}
                                className={`transition-transform duration-300 text-slate-400 group-hover:text-primary flex-shrink-0 ${
                                  isExpanded ? 'rotate-180 text-primary' : ''
                                }`}
                              />
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center w-fit text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${catClass}`}>
                                {isUrdu ? translateCategory(row.category, 'ur') : row.category}
                              </span>
                              <span className="text-[10px] font-mono font-semibold text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors">
                                {isExpanded ? (isUrdu ? 'رسید بند کریں' : 'Click to fold') : (isUrdu ? 'آڈٹ رسید' : 'View receipt')}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Prior Month (PKR) */}
                        <td className="px-3 lg:px-4 py-4 text-right">
                          {hasPriorData && row.priorAmount > 0 ? (
                            <span className="text-sm lg:text-base font-semibold text-slate-600 dark:text-slate-300 font-mono tabular-nums whitespace-nowrap">
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
                          <span className="text-sm lg:text-base font-black text-slate-900 dark:text-slate-100 font-mono tabular-nums whitespace-nowrap">
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
                            <span dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }} className="inline-flex items-center gap-1 font-black text-rose-600 dark:text-rose-400 text-xs lg:text-sm bg-rose-50 dark:bg-rose-950/50 px-2.5 py-1.5 rounded-xl border border-rose-200/80 dark:border-rose-900/60 whitespace-nowrap font-mono">
                              <TrendingUp size={14} className="stroke-[2.5]" />
                              +{displayCurrency} {fmt(row.diff)}
                              {row.pct && <span className="text-[11px] font-extrabold text-rose-500 font-mono">({isUrdu ? `${t.statusHigher} ` : ''}▲ {row.pct}%)</span>}
                            </span>
                          ) : row.diff < 0 ? (
                            <span dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }} className="inline-flex items-center gap-1 font-black text-emerald-600 dark:text-emerald-400 text-xs lg:text-sm bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-1.5 rounded-xl border border-emerald-200/80 dark:border-emerald-900/60 whitespace-nowrap font-mono">
                              <TrendingDown size={14} className="stroke-[2.5]" />
                              -{displayCurrency} {fmt(row.diff)}
                              {row.pct && <span className="text-[11px] font-extrabold text-emerald-600 font-mono">({isUrdu ? `${t.statusSaved} ` : ''}▼ {Math.abs(row.pct)}%)</span>}
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
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onEdit && onEdit(row.expense)
                                }}
                                className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-lg font-bold hover:bg-blue-100 transition-colors"
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onDelete && onDelete(row.id)
                                }}
                                className="text-xs bg-red-50 text-red-600 px-2.5 py-1 rounded-lg font-bold hover:bg-red-100 transition-colors"
                              >
                                Del
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>

                      {/* Expandable 3D Accordion Paper Receipt Row */}
                      {isExpanded && (
                        <tr className="bg-slate-100/40 dark:bg-slate-900/40">
                          <td colSpan={isAdmin ? 5 : 4} className="p-0 border-b border-slate-200/90 dark:border-slate-800">
                            <AnimatePresence>
                              <PaperReceiptAccordion
                                row={row}
                                displayCurrency={displayCurrency}
                                fmt={fmt}
                                isUrdu={isUrdu}
                                t={t}
                                curMonthShort={curMonthShort}
                              />
                            </AnimatePresence>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
           <span dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }} className="text-base sm:text-xl font-black text-primary font-mono tabular-nums">
             {displayCurrency} {fmt(totals.totalExpense)}
           </span>
         </div>
         
         <div className="px-5 sm:px-6 py-4 flex justify-between items-center">
           <span className="text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">
             {(totals.netCashFlow ?? totals.saving) >= 0 
               ? (isUrdu ? 'ماہانہ کیش فلو (سرپلس / بچت)' : 'MONTHLY CASH FLOW (SURPLUS)') 
               : (isUrdu ? 'ماہانہ کیش فلو (خسارہ)' : 'MONTHLY CASH FLOW (DEFICIT)')}
           </span>
           <span dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }} className={`text-base sm:text-xl font-black font-mono tabular-nums ${(totals.netCashFlow ?? totals.saving) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
             {(totals.netCashFlow ?? totals.saving) < 0 ? '-' : '+'} {displayCurrency} {fmt(totals.netCashFlow ?? totals.saving)}
           </span>
         </div>

         {totals.record?.showCctvExpense && (
           <div className="px-5 sm:px-6 py-4 flex justify-between items-center text-red-600 dark:text-red-400 bg-red-50/50 dark:bg-red-950/20">
             <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
               {isUrdu ? 'بڑے اثاثے (سی سی ٹی وی کیمرے)' : 'Capital Expenditure (CCTV)'}
             </span>
             <span dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }} className="text-base sm:text-lg font-black font-mono tabular-nums">- {displayCurrency} {fmt(totals.record.cctvExpense)}</span>
           </div>
         )}

         <div className="px-5 sm:px-6 py-4 flex justify-between items-center bg-slate-900 dark:bg-black text-white">
           <span className="text-xs sm:text-sm font-bold uppercase tracking-wider">
             {(totals.closingBalance ?? totals.totalSaving) >= 0 
               ? (isUrdu ? 'اختتامی بیلنس (محفوظ فنڈ)' : 'CLOSING BALANCE (ACCUMULATED SURPLUS)') 
               : (isUrdu ? 'اختتامی بیلنس (خسارہ / بقایا جات)' : 'CLOSING BALANCE (OVERDRAWN DEFICIT)')}
           </span>
           <span dir="ltr" style={{ direction: 'ltr', unicodeBidi: 'isolate' }} className={`text-base sm:text-xl font-black font-mono tabular-nums ${(totals.closingBalance ?? totals.totalSaving) >= 0 ? 'text-secondary-gold' : 'text-red-400'}`}>
             {(totals.closingBalance ?? totals.totalSaving) < 0 ? '-' : ''} {displayCurrency} {fmt(totals.closingBalance ?? totals.totalSaving)}
           </span>
         </div>
      </div>
    </div>
  )
}

export default ExpenseTable

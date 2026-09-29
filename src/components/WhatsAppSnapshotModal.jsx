import { useRef, useState } from 'react'
import html2canvas from 'html2canvas'
import {
  Download,
  Share2,
  X,
  Sparkles,
  Phone,
  UserCheck,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { computeMonthlyVariance } from '../utils/variance'
import { APP_VERSION, APP_RELEASE_DATE } from '../config/version'

export default function WhatsAppSnapshotModal({
  isOpen,
  onClose,
  selectedMonth,
  totals = {},
  allExpenses = [],
  currency = 'PKR'
}) {
  const cardRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadSuccess, setDownloadSuccess] = useState(false)

  if (!isOpen) return null

  const fmt = (n) => Number(Math.abs(n || 0)).toLocaleString('en-PK')

  const variance = computeMonthlyVariance(selectedMonth, allExpenses, currency)
  const netCashFlow = totals.netCashFlow ?? totals.saving ?? 0
  const isDeficit = Number(netCashFlow) < 0
  const closingBalance = totals.closingBalance ?? totals.totalSaving ?? 0
  const isOverdrawn = Number(closingBalance) < 0

  const handleDownload = async () => {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      // Allow fonts and SVGs to render fully
      await new Promise(r => setTimeout(r, 200))
      
      const canvas = await html2canvas(cardRef.current, {
        scale: 2, // 2x high resolution
        useCORS: true,
        backgroundColor: '#0f172a',
        logging: false
      })

      const image = canvas.toDataURL('image/png')
      const link = document.createElement('a')
      const cleanMonth = (selectedMonth || 'Statement').replace(/\s+/g, '_')
      link.download = `Sector_7D1_WhatsApp_Summary_${cleanMonth}.png`
      link.href = image
      link.click()

      setDownloadSuccess(true)
      setTimeout(() => setDownloadSuccess(false), 3000)
    } catch (err) {
      console.error('Failed to generate snapshot:', err)
      alert('Could not export snapshot. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl flex flex-col max-h-[95vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <Share2 size={20} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-black text-white">WhatsApp Summary Card</h3>
              <p className="text-xs text-slate-400">1080px mobile-optimized financial snapshot</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Preview Container (Scrollable) */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          <div className="flex justify-center">
            {/* The 1080px Target Snapshot Card (Scaled for responsive preview) */}
            <div
              ref={cardRef}
              style={{ width: '100%', maxWidth: '580px' }}
              className="bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-7 border-2 border-slate-700 shadow-2xl space-y-5"
            >
              {/* Card Header Branding */}
              <div className="flex items-start justify-between border-b border-slate-800 pb-4">
                <div className="space-y-1">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                    <Building2 size={12} /> Sector 7D/1 Residents
                  </span>
                  <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
                    Monthly Financial Summary
                  </h2>
                  <p className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                    <Calendar size={14} /> Statement Period: {selectedMonth}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Verified By</span>
                  <span className="text-xs font-black text-emerald-400 flex items-center justify-end gap-1">
                    <CheckCircle2 size={13} /> Management
                  </span>
                </div>
              </div>

              {/* KPI Grid (Opening, Inflow, Expense, Net Cash Flow, Closing) */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {/* Opening Balance */}
                <div className="bg-slate-800/80 p-3 rounded-2xl border border-slate-700/80">
                  <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
                    Opening Balance
                  </span>
                  <p className="text-sm sm:text-base font-black text-white font-mono mt-0.5">
                    {currency} {fmt(totals.record?.openingBalance)}
                  </p>
                </div>

                {/* Monthly Collection (Inflow) */}
                <div className="bg-slate-800/80 p-3 rounded-2xl border border-orange-500/30 border-l-4 border-l-orange-500">
                  <span className="text-[10px] font-black uppercase tracking-wider text-orange-400 block">
                    Inflow (Collection)
                  </span>
                  <p className="text-sm sm:text-base font-black text-white font-mono mt-0.5">
                    {currency} {fmt(totals.record?.monthlyCollection)}
                  </p>
                </div>

                {/* Total Expense */}
                <div className="bg-slate-800/80 p-3 rounded-2xl border border-blue-500/30 border-l-4 border-l-blue-500 col-span-2 sm:col-span-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-400 block">
                    Total Expenses
                  </span>
                  <p className="text-sm sm:text-base font-black text-white font-mono mt-0.5">
                    {currency} {fmt(totals.totalExpense)}
                  </p>
                </div>

                {/* Net Cash Flow (Surplus / Deficit) */}
                <div
                  className={`p-3 rounded-2xl border ${
                    isDeficit
                      ? 'bg-rose-950/40 border-rose-500/40 border-l-4 border-l-rose-500'
                      : 'bg-emerald-950/40 border-emerald-500/40 border-l-4 border-l-emerald-500'
                  }`}
                >
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider block ${
                      isDeficit ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {isDeficit ? 'Monthly Deficit' : 'Monthly Surplus'}
                  </span>
                  <p
                    className={`text-sm sm:text-base font-black font-mono mt-0.5 ${
                      isDeficit ? 'text-rose-400' : 'text-emerald-400'
                    }`}
                  >
                    {isDeficit ? '-' : '+'} {currency} {fmt(netCashFlow)}
                  </p>
                </div>

                {/* Closing Reserve Balance */}
                <div
                  className={`p-3 rounded-2xl border col-span-1 sm:col-span-2 ${
                    isOverdrawn
                      ? 'bg-rose-950/50 border-rose-600/50 border-l-4 border-l-rose-500'
                      : 'bg-amber-950/40 border-amber-500/40 border-l-4 border-l-amber-500'
                  }`}
                >
                  <span
                    className={`text-[10px] font-black uppercase tracking-wider block ${
                      isOverdrawn ? 'text-rose-400' : 'text-amber-400'
                    }`}
                  >
                    {isOverdrawn ? 'Closing Balance (Deficit)' : 'Closing Balance (Reserve)'}
                  </span>
                  <p
                    className={`text-sm sm:text-base font-black font-mono mt-0.5 ${
                      isOverdrawn ? 'text-rose-400' : 'text-amber-300'
                    }`}
                  >
                    {isOverdrawn ? '-' : ''} {currency} {fmt(closingBalance)}
                  </p>
                </div>
              </div>

              {/* Dynamic Contextual Resident Notice (Urdu & English) */}
              <div
                className={`p-4 rounded-2xl border-2 space-y-1.5 ${
                  isDeficit
                    ? 'bg-amber-950/30 border-amber-500/50 text-amber-200'
                    : 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-black">
                  <span>{isDeficit ? '⚠️ Cash Flow Alert' : '✅ Treasury Status'}</span>
                  <span className="font-urdu text-sm">
                    {isDeficit
                      ? 'اس ماہ اخراجات کلیکشن سے تجاوز کر گئے۔'
                      : 'اس ماہ کا سرپلس ریونیو ریزرو فنڈ میں جمع کر دیا گیا ہے۔'}
                  </span>
                </div>
                <p className="text-xs font-bold leading-relaxed text-slate-300">
                  {isDeficit
                    ? `Expenses exceeded collections by ${currency} ${fmt(netCashFlow)}. Prompt dues clearance requested.`
                    : `Operating surplus of ${currency} ${fmt(netCashFlow)} retained in community reserves.`}
                </p>
              </div>

              {/* Top 3 Cost Drivers / Variance Callouts */}
              {variance && variance.increases.length > 0 && (
                <div className="bg-slate-800/60 p-4 rounded-2xl border border-slate-700 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                      <TrendingUp size={14} className="text-rose-400" />
                      Top Month-over-Month Drivers
                    </span>
                    <span className="text-[10px] font-bold text-slate-400">
                      vs. {variance.priorMonth}
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {variance.increases.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-xl bg-slate-900/80 border border-slate-700/80 text-xs"
                      >
                        <span className="font-bold text-slate-200">{item.name}</span>
                        <span className="font-black text-rose-400 font-mono">
                          +{currency} {fmt(item.diff)} {item.pct ? `(+${item.pct}%)` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Management Contact Details */}
              <div className="bg-slate-800/90 p-4 rounded-2xl border border-slate-700 space-y-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 block">
                  Management Committee Contacts
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div className="flex items-center gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80">
                    <div className="size-7 rounded-lg bg-primary/20 text-primary flex items-center justify-center font-bold flex-shrink-0">
                      M
                    </div>
                    <div>
                      <p className="font-bold text-slate-100">Mr. Majeed</p>
                      <p className="text-[10px] text-slate-400">Committee / Finance</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 bg-slate-900/90 p-2.5 rounded-xl border border-slate-700/80">
                    <div className="size-7 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
                      F
                    </div>
                    <div>
                      <p className="font-bold text-slate-100">Mr. Fahad Rizwan</p>
                      <p className="text-[10px] text-slate-400">Committee / Admin</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Watermark */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-[10px] text-slate-500">
                <span>Sector 7D/1 Residents Portal • {APP_VERSION}</span>
                <span>{APP_RELEASE_DATE}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div className="pt-3 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-xs text-slate-400">
            {downloadSuccess ? (
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <CheckCircle2 size={14} /> Downloaded successfully to your device!
              </span>
            ) : (
              'Ready for instant WhatsApp broadcast sharing'
            )}
          </span>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="w-1/2 sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-xl transition-all"
            >
              Close
            </button>
            <button
              type="button"
              onClick={handleDownload}
              disabled={downloading}
              className="w-1/2 sm:w-auto px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-xl shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-50 active:scale-98"
            >
              {downloading ? (
                <div className="size-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Download size={15} />
              )}
              Download WhatsApp Summary
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

import { useRef, useState } from 'react'
import {
  Download,
  Share2,
  X,
  Sparkles,
  TrendingUp,
  Building2,
  Calendar,
  CheckCircle2,
  AlertTriangle
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
      // Dynamically load html2canvas
      const html2canvasModule = await import('html2canvas')
      const html2canvas = html2canvasModule.default || html2canvasModule

      // Wait a tick for DOM stabilization
      await new Promise(r => setTimeout(r, 150))

      const element = cardRef.current

      // html2canvas config with onclone to ensure all OKLCH colors are sanitized to hex/rgb
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#0f172a',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1080,
        onclone: (clonedDoc) => {
          // Ensure cloned card is fully visible and rendered with standard colors
          const clonedCard = clonedDoc.querySelector('[data-snapshot-card="true"]')
          if (clonedCard) {
            clonedCard.style.width = '580px'
            clonedCard.style.maxWidth = '580px'
            clonedCard.style.backgroundColor = '#0f172a'
            clonedCard.style.color = '#ffffff'
          }
        }
      })

      // Convert to blob for robust mobile download & Web Share support
      canvas.toBlob(async (blob) => {
        if (!blob) {
          throw new Error('Canvas toBlob failed')
        }

        const cleanMonth = (selectedMonth || 'Statement').replace(/\s+/g, '_')
        const filename = `Sector_7D1_WhatsApp_Summary_${cleanMonth}.png`

        // Check if Mobile Web Share API is available with image sharing
        const file = new File([blob], filename, { type: 'image/png' })
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              title: `Sector 7D/1 Financial Summary - ${selectedMonth}`,
              text: `Monthly Financial Statement for ${selectedMonth} - Sector 7D/1 Residents`,
              files: [file]
            })
            setDownloadSuccess(true)
            setTimeout(() => setDownloadSuccess(false), 3000)
            return
          } catch (shareErr) {
            // If user cancelled share, fall back to standard file download
            if (shareErr.name !== 'AbortError') {
              console.warn('Web Share failed, falling back to download:', shareErr)
            }
          }
        }

        // Standard link download fallback for Android Chrome / Desktop
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        setTimeout(() => URL.revokeObjectURL(url), 2000)

        setDownloadSuccess(true)
        setTimeout(() => setDownloadSuccess(false), 3000)
      }, 'image/png', 0.95)

    } catch (err) {
      console.error('Failed to generate snapshot:', err)
      alert(`Could not export snapshot directly. Error: ${err.message || 'Rendering error'}. Please try again.`)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-4 animate-in fade-in">
      <div className="bg-[#0f172a] border border-slate-700 rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl flex flex-col max-h-[95vh] text-white">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 flex-shrink-0">
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

        {/* Scrollable Preview Container */}
        <div className="flex-1 overflow-y-auto py-3 space-y-3 pr-1">
          <div className="flex justify-center">
            {/* The 1080px Target Snapshot Card (Styled with standard HEX colors for 100% html2canvas compatibility) */}
            <div
              ref={cardRef}
              data-snapshot-card="true"
              style={{
                width: '100%',
                maxWidth: '540px',
                backgroundColor: '#0f172a',
                color: '#ffffff',
                fontFamily: "'Manrope', system-ui, sans-serif"
              }}
              className="rounded-3xl p-5 sm:p-6 border-2 border-slate-700 shadow-2xl space-y-4 text-white"
            >
              {/* Card Header */}
              <div style={{ borderBottom: '1px solid #1e293b' }} className="pb-3.5 flex items-start justify-between">
                <div className="space-y-1">
                  <span
                    style={{
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#10b981',
                      border: '1px solid rgba(16, 185, 129, 0.3)'
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider"
                  >
                    <Building2 size={12} /> Sector 7D/1 Residents
                  </span>
                  <h2 className="text-lg sm:text-xl font-black text-white tracking-tight pt-1">
                    Monthly Financial Summary
                  </h2>
                  <p style={{ color: '#f59e0b' }} className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                    <Calendar size={13} /> Statement Period: {selectedMonth}
                  </p>
                </div>
                <div className="text-right">
                  <span style={{ color: '#94a3b8' }} className="text-[10px] uppercase font-bold block">Status</span>
                  <span style={{ color: '#10b981' }} className="text-xs font-black flex items-center justify-end gap-1">
                    <CheckCircle2 size={13} /> Verified
                  </span>
                </div>
              </div>

              {/* KPI Grid (Inflow vs. Expense vs. Net Cash Flow vs. Closing Balance) */}
              <div className="grid grid-cols-2 gap-2">
                {/* Opening Balance */}
                <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} className="p-3 rounded-2xl">
                  <span style={{ color: '#94a3b8' }} className="text-[10px] font-black uppercase tracking-wider block">
                    Opening Balance
                  </span>
                  <p className="text-sm sm:text-base font-black text-white font-mono mt-0.5">
                    {currency} {fmt(totals.record?.openingBalance)}
                  </p>
                </div>

                {/* Monthly Collection (Inflow) */}
                <div style={{ backgroundColor: '#1e293b', border: '1px solid #f97316', borderLeftWidth: '4px' }} className="p-3 rounded-2xl">
                  <span style={{ color: '#fb923c' }} className="text-[10px] font-black uppercase tracking-wider block">
                    Inflow (Collection)
                  </span>
                  <p className="text-sm sm:text-base font-black text-white font-mono mt-0.5">
                    {currency} {fmt(totals.record?.monthlyCollection)}
                  </p>
                </div>

                {/* Total Expense */}
                <div style={{ backgroundColor: '#1e293b', border: '1px solid #3b82f6', borderLeftWidth: '4px' }} className="p-3 rounded-2xl">
                  <span style={{ color: '#60a5fa' }} className="text-[10px] font-black uppercase tracking-wider block">
                    Total Expenses
                  </span>
                  <p className="text-sm sm:text-base font-black text-white font-mono mt-0.5">
                    {currency} {fmt(totals.totalExpense)}
                  </p>
                </div>

                {/* Monthly Cash Flow (Surplus / Deficit) */}
                <div
                  style={{
                    backgroundColor: isDeficit ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                    border: isDeficit ? '1px solid #ef4444' : '1px solid #10b981',
                    borderLeftWidth: '4px'
                  }}
                  className="p-3 rounded-2xl"
                >
                  <span
                    style={{ color: isDeficit ? '#f87171' : '#34d399' }}
                    className="text-[10px] font-black uppercase tracking-wider block"
                  >
                    {isDeficit ? 'Monthly Deficit' : 'Monthly Surplus'}
                  </span>
                  <p
                    style={{ color: isDeficit ? '#f87171' : '#34d399' }}
                    className="text-sm sm:text-base font-black font-mono mt-0.5"
                  >
                    {isDeficit ? '-' : '+'} {currency} {fmt(netCashFlow)}
                  </p>
                </div>
              </div>

              {/* Closing Reserve Balance Banner */}
              <div
                style={{
                  backgroundColor: isOverdrawn ? 'rgba(239, 68, 68, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                  border: isOverdrawn ? '1px solid #ef4444' : '1px solid #f59e0b',
                  borderLeftWidth: '4px'
                }}
                className="p-3 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <span
                    style={{ color: isOverdrawn ? '#f87171' : '#fbbf24' }}
                    className="text-[10px] font-black uppercase tracking-wider block"
                  >
                    {isOverdrawn ? 'Closing Balance (Deficit / Overdrawn)' : 'Closing Balance (Accumulated Surplus)'}
                  </span>
                  <p
                    style={{ color: isOverdrawn ? '#f87171' : '#fbbf24' }}
                    className="text-base sm:text-lg font-black font-mono mt-0.5"
                  >
                    {isOverdrawn ? '-' : ''} {currency} {fmt(closingBalance)}
                  </p>
                </div>
                <div style={{ color: isOverdrawn ? '#f87171' : '#fbbf24' }}>
                  {isOverdrawn ? <AlertTriangle size={20} /> : <Sparkles size={20} />}
                </div>
              </div>

              {/* Contextual Notice (Urdu & English) */}
              <div
                style={{
                  backgroundColor: isDeficit ? 'rgba(245, 158, 11, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                  border: isDeficit ? '1px solid #f59e0b' : '1px solid #10b981',
                  color: isDeficit ? '#fef3c7' : '#d1fae5'
                }}
                className="p-3 rounded-2xl space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] font-black">
                  <span>{isDeficit ? '⚠️ Cash Flow Notice' : '✅ Treasury Status'}</span>
                  <span style={{ fontFamily: "'Noto Naskh Arabic', serif" }} className="text-xs">
                    {isDeficit
                      ? 'اس ماہ اخراجات کلیکشن سے تجاوز کر گئے۔'
                      : 'اس ماہ کا سرپلس ریونیو ریزرو فنڈ میں جمع کر دیا گیا ہے۔'}
                  </span>
                </div>
                <p style={{ color: '#cbd5e1' }} className="text-[11px] font-semibold leading-relaxed">
                  {isDeficit
                    ? `Expenses exceeded collections by ${currency} ${fmt(netCashFlow)}. Prompt dues clearance requested.`
                    : `Operating surplus of ${currency} ${fmt(netCashFlow)} retained in community reserves.`}
                </p>
              </div>

              {/* Top 3 Month-over-Month Drivers */}
              {variance && variance.increases.length > 0 && (
                <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} className="p-3 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span style={{ color: '#cbd5e1' }} className="text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                      <TrendingUp size={13} style={{ color: '#f87171' }} />
                      Top Month-over-Month Drivers
                    </span>
                    <span style={{ color: '#94a3b8' }} className="text-[10px] font-bold">
                      vs. {variance.priorMonth}
                    </span>
                  </div>
                  <div className="space-y-1">
                    {variance.increases.slice(0, 3).map((item, idx) => (
                      <div
                        key={idx}
                        style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }}
                        className="flex items-center justify-between p-2 rounded-xl text-xs"
                      >
                        <span style={{ color: '#e2e8f0' }} className="font-bold">{item.name}</span>
                        <span style={{ color: '#f87171' }} className="font-black font-mono">
                          +{currency} {fmt(item.diff)} {item.pct ? `(+${item.pct}%)` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Management Contact Details */}
              <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} className="p-3 rounded-2xl space-y-2">
                <span style={{ color: '#f59e0b' }} className="text-[10px] font-black uppercase tracking-wider block">
                  Management Committee Contacts
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} className="flex items-center gap-2 p-2 rounded-xl">
                    <div style={{ backgroundColor: 'rgba(0, 102, 0, 0.3)', color: '#4ade80' }} className="size-6 rounded-lg flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                      M
                    </div>
                    <div>
                      <p className="font-bold text-white text-[11px]">Mr. Majeed</p>
                      <p style={{ color: '#94a3b8' }} className="text-[9px]">Committee / Finance</p>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155' }} className="flex items-center gap-2 p-2 rounded-xl">
                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.3)', color: '#34d399' }} className="size-6 rounded-lg flex items-center justify-center font-bold text-[11px] flex-shrink-0">
                      F
                    </div>
                    <div>
                      <p className="font-bold text-white text-[11px]">Mr. Fahad Rizwan</p>
                      <p style={{ color: '#94a3b8' }} className="text-[9px]">Committee / Admin</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Card Footer Watermark */}
              <div style={{ borderTop: '1px solid #1e293b', color: '#64748b' }} className="pt-2 flex items-center justify-between text-[9px]">
                <span>Sector 7D/1 Residents Portal • {APP_VERSION}</span>
                <span>{APP_RELEASE_DATE}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Action Buttons */}
        <div style={{ borderTop: '1px solid #1e293b' }} className="pt-3 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <span className="text-xs text-slate-400">
            {downloadSuccess ? (
              <span style={{ color: '#34d399' }} className="font-bold flex items-center gap-1">
                <CheckCircle2 size={14} /> Ready / Saved successfully!
              </span>
            ) : (
              '1-Click WhatsApp Community Snapshot'
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

import { AlertTriangle, CheckCircle2, Sparkles, Megaphone } from 'lucide-react'

export default function DynamicAlertBanner({
  netCashFlow = 0,
  currency = 'PKR',
  customNote = '',
  isNoData = false
}) {
  if (isNoData) return null

  const isDeficit = Number(netCashFlow) < 0
  const absFormatted = Number(Math.abs(netCashFlow || 0)).toLocaleString('en-PK')

  const defaultUrdu = isDeficit
    ? 'اس ماہ اخراجات کلیکشن سے تجاوز کر گئے۔ بقایا جات کی بروقت ادائیگی یقینی بنائیں۔'
    : 'اس ماہ کا سرپلس ریونیو ریزرو فنڈ میں جمع کر دیا گیا ہے۔'

  const defaultEnglish = isDeficit
    ? `Expenses exceeded collections by ${currency} ${absFormatted}. Prompt dues clearance requested.`
    : `Operating surplus of ${currency} ${absFormatted} retained in community reserves.`

  return (
    <div
      className={`rounded-3xl p-5 sm:p-6 border transition-all duration-300 shadow-sm ${
        isDeficit
          ? 'bg-amber-50/90 dark:bg-amber-950/25 border-amber-300/80 dark:border-amber-800/60 shadow-amber-500/5'
          : 'bg-emerald-50/90 dark:bg-emerald-950/25 border-emerald-300/80 dark:border-emerald-800/60 shadow-emerald-500/5'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Side: Icon & English Notice */}
        <div className="flex items-start sm:items-center gap-3.5 flex-1">
          <div
            className={`size-11 sm:size-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${
              isDeficit
                ? 'bg-amber-500 text-white shadow-amber-500/20'
                : 'bg-emerald-600 text-white shadow-emerald-600/20'
            }`}
          >
            {isDeficit ? <AlertTriangle size={22} className="stroke-[2.5]" /> : <Sparkles size={22} />}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`text-[11px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                  isDeficit
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-300'
                    : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-emerald-300'
                }`}
              >
                {isDeficit ? '⚠️ Cash Flow Alert' : '✅ Treasury Status'}
              </span>
              <span className="text-xs sm:text-sm font-black text-slate-800 dark:text-slate-200">
                {isDeficit ? 'Deficit Notice' : 'Surplus Transferred'}
              </span>
            </div>
            <p
              className={`text-xs sm:text-sm font-bold leading-relaxed ${
                isDeficit ? 'text-amber-950 dark:text-amber-200' : 'text-emerald-950 dark:text-emerald-200'
              }`}
            >
              {defaultEnglish}
            </p>
          </div>
        </div>

        {/* Right Side: Urdu Notice */}
        <div className="border-t md:border-t-0 md:border-l border-amber-200/80 dark:border-amber-800/40 md:pl-5 pt-3 md:pt-0 text-right flex-1" dir="rtl">
          <p
            className={`text-sm sm:text-base font-bold leading-relaxed font-urdu ${
              isDeficit ? 'text-amber-950 dark:text-amber-100' : 'text-emerald-950 dark:text-emerald-100'
            }`}
          >
            {defaultUrdu}
          </p>
          {customNote && customNote !== defaultUrdu && (
            <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-slate-300 mt-1.5 font-urdu">
              {customNote}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

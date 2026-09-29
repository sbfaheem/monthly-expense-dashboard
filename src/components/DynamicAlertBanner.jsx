import { AlertTriangle, Sparkles } from 'lucide-react'

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
      className={`rounded-3xl p-5 sm:p-7 border-2 transition-all duration-300 shadow-md ${
        isDeficit
          ? 'bg-amber-50/95 dark:bg-amber-950/30 border-amber-300 dark:border-amber-700/70 shadow-amber-500/10'
          : 'bg-emerald-50/95 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700/70 shadow-emerald-500/10'
      }`}
    >
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
        {/* Left Side: Icon & English Notice */}
        <div className="flex items-start sm:items-center gap-4 flex-1">
          <div
            className={`size-12 sm:size-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md ${
              isDeficit
                ? 'bg-amber-500 text-white shadow-amber-500/30'
                : 'bg-emerald-600 text-white shadow-emerald-600/30'
            }`}
          >
            {isDeficit ? <AlertTriangle size={26} className="stroke-[2.5]" /> : <Sparkles size={26} />}
          </div>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span
                className={`text-xs sm:text-sm font-black uppercase tracking-wider px-3 py-1 rounded-full border-2 ${
                  isDeficit
                    ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                    : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                }`}
              >
                {isDeficit ? '⚠️ Cash Flow Alert' : '✅ Treasury Status'}
              </span>
              <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                {isDeficit ? 'Deficit Notice' : 'Surplus Transferred'}
              </span>
            </div>
            <p
              className={`text-sm sm:text-base md:text-lg font-black leading-snug tracking-tight ${
                isDeficit ? 'text-amber-950 dark:text-amber-100' : 'text-emerald-950 dark:text-emerald-100'
              }`}
            >
              {defaultEnglish}
            </p>
          </div>
        </div>

        {/* Right Side: Urdu Notice */}
        <div
          className={`border-t md:border-t-0 md:border-l ${
            isDeficit ? 'border-amber-200 dark:border-amber-800/60' : 'border-emerald-200 dark:border-emerald-800/60'
          } md:pl-6 pt-3 md:pt-0 text-right flex-1`}
          dir="rtl"
        >
          <p
            className={`text-base sm:text-lg md:text-xl font-black leading-relaxed font-urdu ${
              isDeficit ? 'text-amber-950 dark:text-amber-100' : 'text-emerald-950 dark:text-emerald-100'
            }`}
          >
            {defaultUrdu}
          </p>
          {customNote && customNote !== defaultUrdu && (
            <p className="text-xs sm:text-sm md:text-base font-bold text-slate-700 dark:text-slate-200 mt-2 font-urdu leading-relaxed">
              {customNote}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

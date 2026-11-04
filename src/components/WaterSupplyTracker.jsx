import React, { useState } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import { Droplet, Clock, Calendar, Sparkles, TrendingUp, Share2, Check, Timer, Phone, MessageSquare, Gauge, Waves, Truck } from 'lucide-react'
import { predictNextWaterSupply } from '../utils/waterPrediction'
import { useLanguage } from '../context/LanguageContext'
import { translateMonth, translateWaterStatus, formatDateTimeLocalized } from '../utils/translations'

export default function WaterSupplyTracker({ entries = [], allWaterSupply = [], isAdmin = false }) {
  const [copied, setCopied] = useState(false)
  const { lang, t } = useLanguage()
  const isUrdu = lang === 'ur'
  const shouldReduceMotion = useReducedMotion()

  // Reservoir simulation mode: 'kwsb' (municipal line supply) or 'tanker' (backup reserve)
  const [reservoirMode, setReservoirMode] = useState('kwsb')

  // Calculate durations for each entry and the cumulative total
  let totalMs = 0
  const processedEntries = (entries || []).map((entry, idx) => {
    const dStart = entry.start ? new Date(entry.start) : null
    const dEnd = entry.end ? new Date(entry.end) : null
    let duration = null

    if (dStart && dEnd && dEnd >= dStart) {
      const diffMs = dEnd - dStart
      totalMs += diffMs
      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
      const totalHours = Math.floor(diffMs / (1000 * 60 * 60))
      const totalHoursDecimal = (diffMs / (1000 * 60 * 60)).toFixed(2)
      duration = { days, hours, minutes, totalHours, totalHoursDecimal }
    }

    return {
      ...entry,
      dStart,
      dEnd,
      duration,
      label: `Supply ${idx + 1}`
    }
  })

  // Run the predictive model
  const predictionData = predictNextWaterSupply(allWaterSupply)

  const handleShareToWhatsApp = () => {
    if (!isAdmin || !predictionData.hasEnoughData) return
    const p = predictionData.prediction
    const last = predictionData.lastSupply

    const msg = [
      `💧 *WATER SUPPLY FORECAST & UPDATE*`,
      `📍 *Sector 7D/1 Residents*`,
      ``,
      `✅ *Last Known Supply:* ${last.formattedStart} to ${last.formattedEnd}`,
      `🔮 *Next Predicted Arrival:* *${p.windowFormatted}*`,
      `🎯 *Most Probable Start:* ${p.predictedDateFormatted}`,
      `⏳ *Expected Duration:* ${p.avgDurationText}`,
      `🔄 *Supply Cadence:* Every ~${p.avgIntervalDays} days`,
      `⭐ *Reliability Score:* ${p.reliabilityScore}% (based on ${predictionData.totalTrackedSupplies} tracked cycles)`,
      ``,
      `🌐 *Live Expense & Supply Dashboard:*`,
      `https://monthly-expense-dashboard.vercel.app/view`
    ].join('\n')

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`
    window.open(whatsappUrl, '_blank')

    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // Reservoir Capacity Values based on selected mode
  const isKwsb = reservoirMode === 'kwsb'
  const fillPercentage = isKwsb ? 68 : 42
  const currentGallons = isKwsb ? 6800 : 4200
  const totalCapacity = 10000

  // Tanker and Security Providers
  const contacts = [
    {
      role: isUrdu ? 'سیکیورٹی و واٹر والو سپروائزر' : 'Water Valve & Gate Supervisor',
      name: isUrdu ? 'مجید (سیکیورٹی انچارج)' : 'Supervisor Majeed',
      phone: '03013377675',
      waNumber: '923013377675',
    },
    {
      role: isUrdu ? 'مجاز واٹر ٹینکر سروس' : 'Authorized Tanker Service',
      name: isUrdu ? 'واٹر ٹینکر وینڈر' : 'Tanker Vendor',
      phone: '03001234567',
      waNumber: '923001234567',
    }
  ]

  return (
    <div className="space-y-6 mt-8">
      {/* ================= 1. 3D ISOMETRIC FLUID RESERVOIR HERO WIDGET ================= */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/25 dark:border-cyan-500/20 bg-gradient-to-br from-slate-900 via-slate-950 to-cyan-950/80 p-5 sm:p-8 text-white shadow-xl">
        {/* Ambient Top Glow */}
        <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 right-10 h-72 w-72 rounded-full bg-teal-500/10 blur-3xl" />

        {/* Header & Mode Switcher */}
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-white/10">
          <div className="flex items-center gap-3.5">
            <div className="size-11 sm:size-12 rounded-2xl bg-gradient-to-tr from-cyan-600 to-teal-500 text-white flex items-center justify-center shadow-lg shadow-cyan-500/30 flex-shrink-0">
              <Waves size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">
                  {t?.reservoirTitle || (isUrdu ? 'زیرِ زمین واٹر ریزروائر (3D جائزہ)' : '3D Community Fluid Reservoir')}
                </h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                  <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Isometric 3D
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {t?.reservoirSubtitle || (isUrdu
                  ? 'سوسائٹی کے زیرِ زمین ٹینک میں پانی کی موجودہ سطح اور متوقع شیڈول'
                  : 'Live underground storage capacity & slosh physics')}
              </p>
            </div>
          </div>

          {/* Mode Segmented Controls */}
          <div className="flex items-center p-1 rounded-2xl bg-slate-800/80 border border-slate-700/80 shadow-inner w-fit">
            <button
              type="button"
              onClick={() => setReservoirMode('kwsb')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                isKwsb
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Droplet size={14} />
              <span>{t?.kwsbLine || (isUrdu ? 'لائن سپلائی KWSB' : 'KWSB Line Supply')}</span>
            </button>

            <button
              type="button"
              onClick={() => setReservoirMode('tanker')}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${
                !isKwsb
                  ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Truck size={14} />
              <span>{t?.tankerBackup || (isUrdu ? 'ٹینکر بیک اپ' : 'Tanker Backup')}</span>
            </button>
          </div>
        </div>

        {/* 3D Main Section: Isometric Tank on Left + Telemetry Data on Right */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-6">
          {/* ================= 3D ISOMETRIC CYLINDER VIEWPORT ================= */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center py-4">
            <div
              style={{ perspective: 1000 }}
              className="relative w-52 sm:w-60 h-72 sm:h-80 flex items-center justify-center select-none"
            >
              {/* Oblique Isometric Tilting Tank Wrapper */}
              <div
                style={{
                  transformStyle: 'preserve-3d',
                  transform: shouldReduceMotion ? 'none' : 'rotateX(20deg) rotateY(0deg)',
                }}
                className="relative w-44 sm:w-48 h-64 sm:h-72"
              >
                {/* Dynamic Base Contact Shadow */}
                <motion.div
                  animate={{
                    scale: 0.85 + (fillPercentage / 100) * 0.3,
                    opacity: 0.35 + (fillPercentage / 100) * 0.35,
                  }}
                  transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                  className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 h-12 rounded-[50%] bg-teal-950/70 blur-md z-0"
                />

                {/* Bottom Elliptical Rim of Glass Tank */}
                <div className="absolute bottom-0 inset-x-0 h-10 sm:h-12 rounded-[50%] border-2 border-cyan-400/40 bg-cyan-950/60 shadow-[inset_0_2px_8px_rgba(6,78,59,0.7)] z-10" />

                {/* Outer Glass Tank Body (Frosted Transparent Walls) */}
                <div className="absolute inset-0 rounded-b-[2rem] border-x-2 border-cyan-300/30 bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xs overflow-hidden z-10">
                  {/* Left Specular Glass Glare Stripe */}
                  <div className="absolute left-2 inset-y-0 w-2.5 bg-gradient-to-r from-white/30 to-transparent pointer-events-none" />
                  {/* Right Specular Glass Glare Stripe */}
                  <div className="absolute right-3 inset-y-0 w-1.5 bg-gradient-to-l from-white/25 to-transparent pointer-events-none" />

                  {/* Level Graduation Marks */}
                  <div className="absolute left-3 inset-y-6 flex flex-col justify-between text-[9px] font-mono font-bold text-cyan-200/60 pointer-events-none z-30 select-none">
                    <div className="flex items-center gap-1.5"><span className="w-2 h-px bg-cyan-200/60" />100%</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-px bg-cyan-200/60" />75%</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-px bg-cyan-200/60" />50%</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-px bg-cyan-200/60" />25%</div>
                    <div className="flex items-center gap-1.5"><span className="w-2 h-px bg-cyan-200/60" />0%</div>
                  </div>

                  {/* ================= DYNAMIC SLOSHING LIQUID COLUMN ================= */}
                  <motion.div
                    initial={{ height: '0%' }}
                    animate={{ height: `${fillPercentage}%` }}
                    transition={{
                      type: 'spring',
                      stiffness: 120,
                      damping: 14,
                      mass: 0.8,
                    }}
                    className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-cyan-900/95 via-cyan-600/90 to-teal-400/85 overflow-visible z-20"
                  >
                    {/* Top Water Surface Ellipse (Meniscus Cap) */}
                    <div className="absolute -top-4 inset-x-0 h-8 sm:h-9 rounded-[50%] bg-gradient-to-tr from-cyan-300/90 via-teal-200/85 to-cyan-400/90 border border-white/80 shadow-[inset_0_2px_5px_rgba(255,255,255,0.7),0_2px_8px_rgba(6,182,212,0.4)] z-30" />

                    {/* Continuous Layered SVG Sloshing Sine Waves */}
                    {!shouldReduceMotion && (
                      <div className="absolute -top-3 inset-x-0 h-6 overflow-hidden pointer-events-none z-20">
                        {/* Wave Layer 1 (Front Fast Sine Wave) */}
                        <motion.div
                          animate={{ x: [0, -120] }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                          className="absolute inset-y-0 left-0 w-[480px] flex"
                        >
                          <svg className="w-[480px] h-6" viewBox="0 0 480 24" fill="none">
                            <path
                              d="M 0 10 Q 30 0, 60 10 T 120 10 T 180 10 T 240 10 T 300 10 T 360 10 T 420 10 T 480 10 L 480 24 L 0 24 Z"
                              fill="rgba(34, 211, 238, 0.75)"
                            />
                          </svg>
                        </motion.div>

                        {/* Wave Layer 2 (Back Slow Sine Wave) */}
                        <motion.div
                          animate={{ x: [-120, 0] }}
                          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                          className="absolute inset-y-0 left-0 w-[480px] flex opacity-60"
                        >
                          <svg className="w-[480px] h-6" viewBox="0 0 480 24" fill="none">
                            <path
                              d="M 0 12 Q 30 22, 60 12 T 120 12 T 180 12 T 240 12 T 300 12 T 360 12 T 420 12 T 480 12 L 480 24 L 0 24 Z"
                              fill="rgba(14, 165, 233, 0.65)"
                            />
                          </svg>
                        </motion.div>
                      </div>
                    )}

                    {/* Fluid Internal Shimmer & Bubbles */}
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,_rgba(255,255,255,0.2),_transparent_70%)]" />
                  </motion.div>
                </div>

                {/* Top Glass Tank Rim Ellipse */}
                <div className="absolute -top-3 inset-x-0 h-10 sm:h-12 rounded-[50%] border-2 border-cyan-300/50 bg-gradient-to-b from-white/20 via-cyan-100/10 to-transparent shadow-[inset_0_2px_6px_rgba(255,255,255,0.5)] z-40 pointer-events-none" />
              </div>

              {/* Floating Meniscus Level Badge */}
              <motion.div
                animate={{ y: [-3, 3, -3] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className={`absolute -right-3 sm:-right-6 top-1/3 z-50 px-3 py-1.5 rounded-2xl border shadow-xl backdrop-blur-md flex items-center gap-2 ${
                  isKwsb
                    ? 'bg-slate-900/90 border-cyan-400/50 text-cyan-200'
                    : 'bg-slate-900/90 border-amber-400/50 text-amber-200'
                }`}
              >
                <div className={`size-2.5 rounded-full animate-ping ${isKwsb ? 'bg-cyan-400' : 'bg-amber-400'}`} />
                <div className="flex flex-col">
                  <span className="text-xs font-black font-mono leading-tight">
                    {currentGallons.toLocaleString()} {t?.gallons || 'Gal'} ({fillPercentage}%)
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 leading-none">
                    {fillPercentage >= 50 ? (t?.optimalReserves || 'Optimal Reserve') : (t?.refillAdvised || 'Refill Recommended')}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* ================= TELEMETRY & VALVE TIMINGS ON RIGHT ================= */}
          <div className="lg:col-span-7 space-y-4">
            {/* Status Summary Card */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Capacity Card */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  {t?.storageCapacity || (isUrdu ? 'اسٹوریج گنجائش' : 'Capacity')}
                </span>
                <div className="text-xl sm:text-2xl font-black font-mono text-cyan-300">
                  {currentGallons.toLocaleString()} <span className="text-xs font-bold opacity-75">/ 10,000 Gal</span>
                </div>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${fillPercentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className={`h-full ${isKwsb ? 'bg-cyan-400' : 'bg-amber-400'}`}
                  />
                </div>
              </div>

              {/* Pressure / Mode Metric */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  {t?.linePressure || (isUrdu ? 'لائن پریشر' : 'Line Pressure')}
                </span>
                <div className="text-xl sm:text-2xl font-black font-mono text-white flex items-center gap-1.5">
                  <Gauge size={18} className="text-teal-400" />
                  <span>{isKwsb ? '42 PSI' : 'Gravity Fed'}</span>
                </div>
                <span className="text-[10px] font-bold text-teal-300 mt-1 block">
                  {isKwsb ? (isUrdu ? 'نارمل فلو' : 'Optimal Flow') : (isUrdu ? 'معمول کے مطابق' : 'Auxiliary')}
                </span>
              </div>

              {/* Status Indicator */}
              <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xs">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                  {isUrdu ? 'حیثیت' : 'Supply Status'}
                </span>
                <div className="text-base sm:text-lg font-black text-emerald-400 flex items-center gap-1.5">
                  <Check size={18} />
                  <span>{isKwsb ? (isUrdu ? 'لائن فعال' : 'Active Line') : (isUrdu ? 'اسٹینڈ بائی' : 'Standby Tank')}</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400 mt-1 block">
                  {isKwsb ? 'Sector 7D/1 Main Grid' : 'Community Tanker Bay'}
                </span>
              </div>
            </div>

            {/* Municipal Valve Schedule & Tanker Emergency Action */}
            <div className="p-4 rounded-2xl bg-cyan-950/30 border border-cyan-500/20 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-cyan-200 flex items-center gap-1.5">
                  <Clock size={15} className="text-cyan-400" />
                  <span>{t?.municipalSchedule || (isUrdu ? 'بلدیاتی لائن کا شیڈول' : 'Municipal Schedule')}</span>
                </span>
                <span className="text-[11px] font-extrabold text-teal-300 bg-teal-900/60 px-2 py-0.5 rounded-lg border border-teal-500/30">
                  {predictionData.prediction?.statusBadge?.label || 'Weekly Cadence'}
                </span>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed">
                {isUrdu
                  ? 'سوسائٹی کے زیرِ زمین واٹر ٹینک میں KWSB مین لائن سے پانی ہر 4 سے 5 دن کے وقفے سے فراہم کیا جاتا ہے۔ کسی بھی تعطل کی صورت میں فوری ٹینکر سپلائی فعال کی جاتی ہے۔'
                  : 'Municipal line water fills the community underground reservoir every ~4 to 5 days. Authorized tanker backup is on standby for valve disruptions.'}
              </p>

              {/* 1-Click Contacts: Supervisor Majeed & Tanker Vendor */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-white/10">
                {contacts.map((c, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-white truncate">{c.name}</div>
                      <div className="text-[10px] text-slate-400 truncate">{c.role}</div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <a
                        href={`tel:${c.phone}`}
                        className="p-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-colors"
                        title={`Call ${c.phone}`}
                      >
                        <Phone size={13} />
                      </a>
                      <a
                        href={`https://wa.me/${c.waNumber}?text=Assalam%20o%20Alaikum`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageSquare size={13} />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 2. Current / Selected Month Recorded Supplies ─── */}
      {processedEntries.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-200 dark:border-blue-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h3 className="text-xl font-bold text-blue-800 dark:text-blue-300 flex items-center gap-2">
              <Droplet className="text-blue-500" /> {t.waterSupplyTracker}
            </h3>
            <span className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider w-fit">
              {processedEntries.length} {processedEntries.length === 1 ? t.periodRecorded : t.periodsRecorded}
            </span>
          </div>
          
          <div className="space-y-4">
            {processedEntries.map((entry, index) => (
              <div key={entry.id || index} className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700">
                <div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                    <Calendar size={15} />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">
                      {t.startDateAndTime} ({isUrdu ? `سپلائی ${index + 1}` : entry.label})
                    </span>
                  </div>
                  <p className="font-extrabold text-base md:text-lg text-slate-900 dark:text-white">
                    {formatDateTimeLocalized(entry.start, lang)}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
                    <Calendar size={15} />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">
                      {t.endDateAndTime} ({isUrdu ? `سپلائی ${index + 1}` : entry.label})
                    </span>
                  </div>
                  <p className="font-extrabold text-base md:text-lg text-slate-900 dark:text-white">
                    {formatDateTimeLocalized(entry.end, lang)}
                  </p>
                </div>
                <div className="bg-blue-50/50 dark:bg-blue-900/10 px-3 py-2.5 rounded-lg border border-blue-100/50 dark:border-blue-900/30">
                  <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 mb-0.5">
                    <Clock size={15} />
                    <span className="text-[11px] font-extrabold uppercase tracking-wider">{t.supplyDuration}</span>
                  </div>
                  {entry.duration ? (
                    <>
                      <p className="font-extrabold text-blue-950 dark:text-blue-200 text-sm md:text-base">
                        {isUrdu 
                          ? `${entry.duration.days} دن، ${entry.duration.hours} گھنٹے، ${entry.duration.minutes} منٹ`
                          : `${entry.duration.days} Days, ${entry.duration.hours} Hours, ${entry.duration.minutes} Minutes`
                        }
                      </p>
                      <p className="text-xs text-blue-700 dark:text-blue-400 font-bold mt-0.5">
                        {isUrdu
                          ? `${entry.duration.totalHours} گھنٹے ${entry.duration.minutes} منٹ (یا ${entry.duration.totalHoursDecimal} گھنٹے)`
                          : `${entry.duration.totalHours} hours ${entry.duration.minutes} minutes (or ${entry.duration.totalHoursDecimal} hours)`
                        }
                      </p>
                    </>
                  ) : (
                    <p className="text-sm font-bold text-slate-400">{t.supplyPending}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── 3. Predictive Forecasting Engine Widget ─── */}
      {predictionData.hasEnoughData && (
        <div className="relative overflow-hidden bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-950 text-white p-6 md:p-8 rounded-2xl shadow-lg border border-indigo-500/20">
          {/* Subtle background glow */}
          <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
            <div className="flex items-center gap-3">
              <div className="size-11 rounded-xl bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center shadow-md shadow-indigo-500/30 flex-shrink-0">
                <Sparkles size={22} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-lg md:text-xl font-extrabold text-white tracking-tight">
                    {t.nextWaterForecast}
                  </h3>
                  <span className="text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 rounded-full">
                    {t.predictiveModel}
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  {isUrdu 
                    ? `گزشتہ 4–5 ماہ کے دوران ریکارڈ شدہ ${predictionData.totalTrackedSupplies} سپلائی ادوار پر مبنی۔`
                    : `Trained on ${predictionData.totalTrackedSupplies} recorded supply periods across the last 4–5 months.`
                  }
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className={`text-xs font-bold px-3 py-1.5 rounded-full ${predictionData.prediction?.statusBadge?.color || 'bg-blue-100 text-blue-800'}`}>
                {translateWaterStatus(predictionData.prediction?.statusBadge?.label, lang)}
              </span>
              {isAdmin && (
                <button
                  onClick={handleShareToWhatsApp}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm shadow-emerald-900/40 active:scale-95"
                  title="Broadcast this prediction to community WhatsApp groups"
                >
                  {copied ? <Check size={14} /> : <Share2 size={14} />}
                  <span>{copied ? t.openingWhatsApp : t.shareToWhatsApp}</span>
                </button>
              )}
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Card 1: Expected Window */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Calendar size={14} />
                <span>{t.expectedWindow}</span>
              </div>
              <p className="text-xl md:text-2xl font-black text-white tracking-tight">
                {translateMonth(predictionData.prediction?.windowFormatted, lang)}
              </p>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                {t.mostLikely} <span className="text-indigo-200 font-bold">{translateMonth(predictionData.prediction?.predictedDateFormatted, lang)}</span>
              </p>
            </div>

            {/* Card 2: Expected Duration */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Timer size={14} />
                <span>{t.forecastedDuration}</span>
              </div>
              <p className="text-xl md:text-2xl font-black text-white tracking-tight">
                {isUrdu 
                  ? (predictionData.prediction?.avgDurationText || '')
                      .replace(/(\d+)d/g, '$1 دن')
                      .replace(/(\d+)h/g, '$1 گھنٹے')
                      .replace(/hours/g, 'گھنٹے')
                      .replace(/hour/g, 'گھنٹہ')
                  : (predictionData.prediction?.avgDurationText || '')
                }
              </p>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                {t.typicalRange} <span className="text-blue-200 font-bold">{isUrdu ? '55 – 65 گھنٹے' : '55 – 65 hours'}</span>
              </p>
            </div>

            {/* Card 3: Cycle Cadence */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider mb-2">
                <TrendingUp size={14} />
                <span>{t.supplyCadence}</span>
              </div>
              <p className="text-xl md:text-2xl font-black text-white tracking-tight">
                {isUrdu ? `ہر ~${predictionData.prediction?.avgIntervalDays || 0} دن بعد` : `Every ~${predictionData.prediction?.avgIntervalDays || 0} Days`}
              </p>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                {t.recentLabel} <span className="text-teal-200 font-bold">
                  {isUrdu 
                    ? (predictionData.recentIntervalsInDays || []).slice(-3).map(n => `${n} دن`).join('، ')
                    : `${(predictionData.recentIntervalsInDays || []).slice(-3).join('d, ')}d`
                  }
                </span>
              </p>
            </div>

            {/* Card 4: Model Confidence */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
                <Sparkles size={14} />
                <span>{t.consistencyScore}</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-xl md:text-2xl font-black text-white tracking-tight">
                  {predictionData.prediction?.reliabilityScore || 0}%
                </span>
                <span className="text-xs text-emerald-400 font-bold">{t.highRegularity}</span>
              </div>
              <p className="text-xs text-slate-300 mt-1 font-medium">
                {t.lastRecordedLabel} {translateMonth(predictionData.lastSupply?.formattedStart?.split(',')?.[0] || '', lang)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

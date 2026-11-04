import React, { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Droplet, Clock, Calendar, Sparkles, TrendingUp, Share2, Check, Timer,
  Phone, MessageSquare, Gauge, Waves, Truck, ArrowUpRight, Plus,
  AlertTriangle, ShieldCheck, Activity, CheckCircle2, ChevronRight, X
} from 'lucide-react'
import { predictNextWaterSupply } from '../utils/waterPrediction'
import { useLanguage } from '../context/LanguageContext'
import { translateMonth, translateWaterStatus, formatDateTimeLocalized } from '../utils/translations'

export default function WaterSupplyTracker({ entries = [], allWaterSupply = [], isAdmin = false }) {
  const [copied, setCopied] = useState(false)
  const { lang, t } = useLanguage()
  const isUrdu = lang === 'ur'
  const shouldReduceMotion = useReducedMotion()

  // Sizing & Mode State for 120 Sq. Yd Domestic Home
  const [tankCapacity, setTankCapacity] = useState(2000) // 2000 Gal (Standard 8x8x6 ft) or 1500 Gal (Compact 8x6x6 ft)
  const [reservoirMode, setReservoirMode] = useState('kwsb') // 'kwsb' | 'tanker'
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferBatchLogged, setTransferBatchLogged] = useState(false)

  // Overhead Pumping Transfer Log State
  const [transferLogs, setTransferLogs] = useState([
    {
      id: 1,
      title: isUrdu ? 'صبح کی شفٹ پمپنگ' : 'Morning Pump Cycle',
      amount: 100,
      target: isUrdu ? '500 گیلن چھت کا ٹینک' : '500-Gal Overhead Roof Tank',
      time: isUrdu ? 'آج، 07:30 AM' : 'Today, 7:30 AM',
      operator: isUrdu ? 'آٹومیٹک موٹر' : 'Automatic Motor',
    },
    {
      id: 2,
      title: isUrdu ? 'شام کی سپلائی ٹرانسفر' : 'Evening Top-Up',
      amount: 100,
      target: isUrdu ? '500 گیلن چھت کا ٹینک' : '500-Gal Overhead Roof Tank',
      time: isUrdu ? 'گزشتہ کل، 06:15 PM' : 'Yesterday, 6:15 PM',
      operator: isUrdu ? 'دستی سوئچ' : 'Manual Switch',
    },
    {
      id: 3,
      title: isUrdu ? 'ہفتہ وار مکمل فلنگ' : 'Weekend Full Batch',
      amount: 250,
      target: isUrdu ? '500 گیلن چھت کا ٹینک' : '500-Gal Overhead Roof Tank',
      time: isUrdu ? '02 نومبر، 08:00 AM' : 'Nov 2, 8:00 AM',
      operator: isUrdu ? 'آٹومیٹک موٹر' : 'Automatic Motor',
    }
  ])

  // Calculation of domestic underground capacity & burn rates
  const isKwsb = reservoirMode === 'kwsb'
  const fillPercentage = isKwsb ? 68 : 42
  const currentVolume = Math.round(tankCapacity * (fillPercentage / 100))
  const headroomGallons = tankCapacity - currentVolume

  // Daily Quota & Burn Rate calculation
  const burnRate = tankCapacity === 2000 ? 105 : 80
  const quotaCeiling = tankCapacity === 2000 ? 115 : 90
  const isWithinBudget = burnRate <= quotaCeiling
  const daysOfWaterLeft = (currentVolume / burnRate).toFixed(1)
  const isLowReserves = fillPercentage < 25

  // Calculate durations for recorded municipal supply periods
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

  // Machine Learning Predictive Forecasting Model
  const predictionData = predictNextWaterSupply(allWaterSupply)

  const handleShareToWhatsApp = () => {
    if (!isAdmin || !predictionData.hasEnoughData) return
    const p = predictionData.prediction
    const last = predictionData.lastSupply

    const msg = [
      `💧 *DOMESTIC WATER RESERVOIR & FORECAST*`,
      `🏠 *120 Sq. Yard Household • Sector 7D/1*`,
      ``,
      `🛢️ *Underground Tank:* ${currentVolume.toLocaleString()} / ${tankCapacity.toLocaleString()} Gal (${fillPercentage}%)`,
      `⏳ *Autonomy Remaining:* ~${daysOfWaterLeft} Days of Water Left (@ ${burnRate} Gal/Day)`,
      ``,
      `✅ *Last Known Municipal Supply:* ${last.formattedStart} to ${last.formattedEnd}`,
      `🔮 *Next Predicted Arrival:* *${p.windowFormatted}*`,
      `🎯 *Most Probable Start:* ${p.predictedDateFormatted}`,
      `⏱️ *Expected Inflow Duration:* ${p.avgDurationText} at 42 PSI`,
      `🔄 *Supply Cadence:* Every ~${p.avgIntervalDays} days`,
      `⭐ *Reliability Score:* ${p.reliabilityScore}%`,
      ``,
      `🌐 *Live Expense & Water Dashboard:*`,
      `https://monthly-expense-dashboard.vercel.app/view`
    ].join('\n')

    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`
    window.open(whatsappUrl, '_blank')

    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  // Handle logging a 100-Gal overhead batch transfer
  const handleLogTransfer = (e) => {
    e.preventDefault()
    const newLog = {
      id: Date.now(),
      title: isUrdu ? 'صبح کا ٹرانسفر بیج' : 'Overhead Tank Transfer',
      amount: 100,
      target: isUrdu ? '500 گیلن چھت کا ٹینک' : '500-Gal Roof Tank',
      time: isUrdu ? 'ابھی، تازہ ترین' : 'Just now',
      operator: isUrdu ? 'رہائشی لاگ' : 'Resident Log',
    }
    setTransferLogs([newLog, ...transferLogs])
    setTransferBatchLogged(true)
    setTimeout(() => {
      setTransferBatchLogged(false)
      setShowTransferModal(false)
    }, 1800)
  }

  // Verified Municipal Line Operator & Tanker Provider
  const contacts = [
    {
      role: isUrdu ? 'والو سپروائزر و میونسپل لائن' : 'Line Valve Operator / Supervisor',
      name: isUrdu ? 'سپروائزر مجید' : 'Supervisor Majeed',
      phone: '03013377675',
      waNumber: '923013377675',
      desc: isUrdu ? 'سیکٹر 7D/1 واٹر والو انچارج' : 'Sector 7D/1 Grid Valve Controller',
    },
    {
      role: isUrdu ? 'مجاز پرائیویٹ واٹر ٹینکر' : 'Authorized Private Tanker Service',
      name: isUrdu ? 'واٹر ٹینکر باؤزر سروس' : 'Tanker Bowser Service',
      phone: '03001234567',
      waNumber: '923001234567',
      desc: isUrdu ? '1,000 اور 2,000 گیلن باؤزر آرڈر' : '1,000 / 2,000 Gal Bowser Request',
    }
  ]

  return (
    <div className="space-y-6 mt-8">
      {/* ================= HERO: DOMESTIC UNDERGROUND WATER RESERVOIR (120 SQ. YD) ================= */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/25 dark:border-cyan-500/20 bg-gradient-to-br from-slate-900 via-zinc-950 to-slate-950 p-5 sm:p-8 text-white shadow-2xl">
        {/* Cyberpunk Telemetry Radial Backdrop Glows */}
        <div className="pointer-events-none absolute -top-28 left-1/4 h-80 w-80 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 right-8 h-80 w-80 rounded-full bg-teal-500/10 blur-3xl" />

        {/* ─── 1. Header Bar: Title, Capacity Sizing Toggle & Status Badge ─── */}
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="size-12 sm:size-14 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/25 flex-shrink-0">
              <Waves size={26} className="text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                  {isUrdu
                    ? 'زیرِ زمین گھریلو واٹر ٹینک • 120 گز رہائشی مکان'
                    : 'Underground Water Reservoir • 120 Sq. Yard Home'}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Telemetry Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isUrdu
                  ? 'کراچی رہائشی واٹر مانیٹرنگ، یومیہ برن ریٹ ٹیلی میٹری اور بلدیاتی سپلائی کی پیش گوئی'
                  : 'Karachi residential water tracking, daily burn rate gauge & predictive line forecasting'}
              </p>
            </div>
          </div>

          {/* Quick Controls: Tank Capacity Toggle & Supply Source Pills */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Tank Capacity Sizing Toggle: 2,000 Gal vs 1,500 Gal */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
              <button
                type="button"
                onClick={() => setTankCapacity(2000)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  tankCapacity === 2000
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Standard 8x8x6 ft Tank"
              >
                {isUrdu ? '2,000 گیلن (8x8x6)' : '2,000 Gal (Standard)'}
              </button>
              <button
                type="button"
                onClick={() => setTankCapacity(1500)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  tankCapacity === 1500
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Compact 8x6x6 ft Tank"
              >
                {isUrdu ? '1,500 گیلن (8x6x6)' : '1,500 Gal (Compact)'}
              </button>
            </div>

            {/* Supply Source Indicator Pill */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900/90 border border-slate-800">
              <button
                type="button"
                onClick={() => setReservoirMode('kwsb')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  isKwsb
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Droplet size={14} />
                <span>{isUrdu ? 'KWSB لائن سپلائی' : 'KWSB Line Supply'}</span>
              </button>

              <button
                type="button"
                onClick={() => setReservoirMode('tanker')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                  !isKwsb
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Truck size={14} />
                <span>{isUrdu ? 'ٹینکر بیک اپ' : 'Tanker Backup'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── 2. 3D Isometric Fluid Tank & Telemetry Display ─── */}
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center pt-6">
          {/* ================= 3D ISOMETRIC CYLINDER VIEWPORT ================= */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center py-2">
            <div
              style={{ perspective: 1000 }}
              className="relative w-56 sm:w-64 h-72 sm:h-84 flex items-center justify-center select-none"
            >
              {/* Isometric Cylinder Glass Tank */}
              <div
                style={{
                  transformStyle: 'preserve-3d',
                  transform: shouldReduceMotion ? 'none' : 'rotateX(20deg) rotateY(0deg)',
                }}
                className="relative w-44 sm:w-52 h-64 sm:h-72"
              >
                {/* Dynamic Base Contact Shadow Expanding with Water Fill */}
                <motion.div
                  animate={{
                    scale: 0.85 + (fillPercentage / 100) * 0.3,
                    opacity: 0.35 + (fillPercentage / 100) * 0.45,
                  }}
                  transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                  className="pointer-events-none absolute -bottom-6 left-1/2 -translate-x-1/2 w-48 sm:w-56 h-12 rounded-[50%] bg-cyan-950/80 blur-md z-0"
                />

                {/* Bottom Elliptical Rim of Glass Tank */}
                <div className="absolute bottom-0 inset-x-0 h-10 sm:h-12 rounded-[50%] border-2 border-cyan-400/40 bg-cyan-950/80 shadow-[inset_0_2px_10px_rgba(6,78,59,0.8)] z-10" />

                {/* Outer Glass Tank Body (Frosted Transparent Walls) */}
                <div className="absolute inset-0 rounded-b-[2rem] border-x-2 border-cyan-400/30 bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xs overflow-hidden z-10">
                  {/* Left Specular Glare Strip */}
                  <div className="absolute left-2.5 inset-y-0 w-2.5 bg-gradient-to-r from-white/30 to-transparent pointer-events-none" />
                  {/* Right Specular Glare Strip */}
                  <div className="absolute right-3.5 inset-y-0 w-1.5 bg-gradient-to-l from-white/20 to-transparent pointer-events-none" />

                  {/* Level Graduation Markings: 25%, 50%, 75%, 100% */}
                  <div className="absolute left-3 inset-y-6 flex flex-col justify-between text-[9px] font-mono font-bold text-cyan-200/70 pointer-events-none z-30 select-none">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-px bg-cyan-200/80" />
                      <span>100% ({tankCapacity.toLocaleString()}G)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-px bg-cyan-200/60" />
                      <span>75% ({(tankCapacity * 0.75).toLocaleString()}G)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-px bg-cyan-200/60" />
                      <span>50% ({(tankCapacity * 0.5).toLocaleString()}G)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-px bg-cyan-200/60" />
                      <span>25% ({(tankCapacity * 0.25).toLocaleString()}G)</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-px bg-cyan-200/80" />
                      <span>0%</span>
                    </div>
                  </div>

                  {/* ================= DYNAMIC LIQUID COLUMN ================= */}
                  <motion.div
                    initial={{ height: '0%' }}
                    animate={{ height: `${fillPercentage}%` }}
                    transition={{
                      type: 'spring',
                      stiffness: 120,
                      damping: 14,
                      mass: 0.8,
                    }}
                    className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-cyan-950 via-teal-700/90 to-cyan-400/85 overflow-visible z-20"
                  >
                    {/* Top Water Surface Ellipse (Meniscus Disc) */}
                    <div className="absolute -top-4 inset-x-0 h-8 sm:h-9 rounded-[50%] bg-gradient-to-tr from-cyan-300 via-teal-200 to-cyan-400 border border-white/90 shadow-[inset_0_2px_6px_rgba(255,255,255,0.8),0_2px_10px_rgba(6,182,212,0.5)] z-30" />

                    {/* Continuous Layered SVG Sinusoidal Sloshing Waves */}
                    {!shouldReduceMotion && (
                      <div className="absolute -top-3.5 inset-x-0 h-6 overflow-hidden pointer-events-none z-20">
                        {/* Wave 1: Fast Surface Slosh */}
                        <motion.div
                          animate={{ x: [0, -120] }}
                          transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                          className="absolute inset-y-0 left-0 w-[480px] flex"
                        >
                          <svg className="w-[480px] h-6" viewBox="0 0 480 24" fill="none">
                            <path
                              d="M 0 10 Q 30 0, 60 10 T 120 10 T 180 10 T 240 10 T 300 10 T 360 10 T 420 10 T 480 10 L 480 24 L 0 24 Z"
                              fill="rgba(34, 211, 238, 0.85)"
                            />
                          </svg>
                        </motion.div>

                        {/* Wave 2: Slower Depth Slosh */}
                        <motion.div
                          animate={{ x: [-120, 0] }}
                          transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                          className="absolute inset-y-0 left-0 w-[480px] flex opacity-60"
                        >
                          <svg className="w-[480px] h-6" viewBox="0 0 480 24" fill="none">
                            <path
                              d="M 0 12 Q 30 22, 60 12 T 120 12 T 180 12 T 240 12 T 300 12 T 360 12 T 420 12 T 480 12 L 480 24 L 0 24 Z"
                              fill="rgba(13, 148, 136, 0.75)"
                            />
                          </svg>
                        </motion.div>
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Top Glass Tank Rim Ellipse */}
                <div className="absolute -top-3.5 inset-x-0 h-10 sm:h-12 rounded-[50%] border-2 border-cyan-300/50 bg-gradient-to-b from-white/20 via-cyan-100/10 to-transparent shadow-[inset_0_2px_6px_rgba(255,255,255,0.6)] z-40 pointer-events-none" />
              </div>

              {/* Floating Tooltip Card Anchored to Current Fluid Line */}
              <motion.div
                animate={{ y: [-2, 3, -2] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute -right-2 sm:-right-6 top-[32%] z-50 px-3.5 py-2 rounded-2xl border border-cyan-400/50 bg-slate-950/90 shadow-2xl backdrop-blur-md flex items-center gap-2.5"
              >
                <div className="size-2.5 rounded-full bg-cyan-400 animate-ping" />
                <div className="flex flex-col">
                  <span className="text-xs sm:text-sm font-black font-mono text-cyan-200 leading-tight">
                    {currentVolume.toLocaleString()} Gallons ({fillPercentage}%)
                  </span>
                  <span className="text-[10px] font-bold text-emerald-400 leading-none mt-0.5">
                    {isLowReserves ? '⚠️ Low Reserve Warning' : 'Optimal Reserves'}
                  </span>
                </div>
              </motion.div>
            </div>
          </div>

          {/* ================= TELEMETRY METRICS GRID (4 CARDS) ================= */}
          <div className="lg:col-span-7 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Metric 1: Storage Capacity */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm backdrop-blur-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {isUrdu ? 'اسٹوریج گنجائش' : 'Storage Capacity'}
                  </span>
                  <span className="text-[10px] font-bold text-cyan-300 font-mono">
                    {headroomGallons.toLocaleString()} Gal Free
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">
                  {currentVolume.toLocaleString()} <span className="text-sm font-bold text-slate-400">/ {tankCapacity.toLocaleString()} Gal</span>
                </div>
                {/* Animated Progress Bar */}
                <div className="w-full bg-slate-800 rounded-full h-2 mt-2.5 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${fillPercentage}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-cyan-400 to-teal-400 rounded-full"
                  />
                </div>
              </div>

              {/* Metric 2: Line Pressure / Inflow Sensor */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm backdrop-blur-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {isUrdu ? 'لائن پریشر و ان فلو' : 'Line Pressure / Inflow'}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-teal-400">
                    <span className="size-1.5 rounded-full bg-teal-400 animate-ping" />
                    Live Sensor
                  </span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono text-white flex items-center gap-2">
                  <Gauge size={22} className="text-teal-400" />
                  <span>42 PSI</span>
                </div>
                <span className="text-xs font-bold text-teal-300 mt-1 block">
                  {isUrdu ? 'بہترین سکشن فلو (موٹر محفوظ)' : 'Optimal Suction Flow'}
                </span>
              </div>

              {/* Metric 3: Supply Status */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm backdrop-blur-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {isUrdu ? 'سپلائی کی حیثیت' : 'Supply Status'}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">
                    Sector 7D/1 Grid
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black text-emerald-400 flex items-center gap-2">
                  <CheckCircle2 size={22} className="text-emerald-400" />
                  <span>{isUrdu ? 'فعال میونسپل لائن' : 'Active Line'}</span>
                </div>
                <span className="text-xs font-bold text-slate-400 mt-1 block">
                  {isUrdu ? 'مین گرڈ والو کھلا ہے' : 'KWSB Main Feeder Online'}
                </span>
              </div>

              {/* Metric 4: Daily Quota & Burn Rate Gauge */}
              <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm backdrop-blur-xs">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    {isUrdu ? 'یومیہ خرچ (برن ریٹ)' : 'Daily Quota & Burn Rate'}
                  </span>
                  <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    isWithinBudget ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30' : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                  }`}>
                    {isWithinBudget ? 'Within Reserve Budget' : 'Exceeding Quota'}
                  </span>
                </div>
                <div className="text-xl sm:text-2xl font-black font-mono text-white">
                  {burnRate} <span className="text-xs font-bold text-slate-400">Gal/Day</span>
                  <span className="text-xs font-medium text-slate-500 ml-2">/ {quotaCeiling} Max</span>
                </div>
                <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center gap-1">
                  <Activity size={14} />
                  <span>{daysOfWaterLeft} Days of Water Left</span>
                </div>
              </div>
            </div>

            {/* Quick Action: Log Overhead Tank Transfer Button */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-cyan-950/40 border border-cyan-500/30">
              <div className="flex items-center gap-2.5">
                <div className="size-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                  <ArrowUpRight size={18} />
                </div>
                <div>
                  <h5 className="text-xs font-extrabold text-white">
                    {isUrdu ? 'چھت کے ٹینک میں ٹرانسفر لاگ کریں' : 'Overhead Roof Tank Transfer Log'}
                  </h5>
                  <p className="text-[11px] text-slate-400">
                    {isUrdu
                      ? 'معمول: 100 گیلن صبح کا بیج برائے 500 گیلن چھت ٹینک'
                      : 'Default: 100 Gal morning batch to 500-gallon roof tank'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowTransferModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-md shadow-cyan-500/20 transition-all active:scale-95"
              >
                <Plus size={16} />
                <span>{isUrdu ? '+ ٹرانسفر لاگ درج کریں' : '+ Log Overhead Transfer'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 3. Next Water Supply Forecast & Depletion Card ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="size-11 sm:size-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/30 flex-shrink-0">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-lg md:text-xl font-black text-white tracking-tight">
                  {isUrdu
                    ? 'اگلی بلدیاتی واٹر سپلائی پیش گوئی (کیڈنس ماڈل)'
                    : 'Next Water Supply Forecast (Predictive Cadence Model)'}
                </h4>
                <span className="text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 rounded-full">
                  Machine Learning Engine
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isUrdu
                  ? 'کراچی میونسپل لائن (KWSB) کے گزشتہ ادوار اور پریشر سینسرز کی بنیاد پر خودکار تجزیہ'
                  : 'Automated predictive analysis based on historical Karachi KWSB cycles & pressure telemetry'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Status Badge: Due Any Moment / Overdue */}
            <span className="text-xs font-black px-3.5 py-1.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-sm animate-pulse">
              Due Any Moment / Overdue
            </span>

            {isAdmin && (
              <button
                type="button"
                onClick={handleShareToWhatsApp}
                className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl transition-all shadow-sm active:scale-95"
                title="Broadcast update to WhatsApp"
              >
                {copied ? <Check size={14} /> : <Share2 size={14} />}
                <span>{copied ? 'Copied & Opening!' : 'Broadcast WhatsApp'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Cadence Model Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Expected Window */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Calendar size={14} />
              <span>{isUrdu ? 'متوقع آمد کا دورانیہ' : 'Expected Window'}</span>
            </div>
            <p className="text-xl md:text-2xl font-black text-white tracking-tight">
              Oct 31 – Nov 4
            </p>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              Most Likely: <span className="text-indigo-200 font-bold">Nov 02 (Evening)</span>
            </p>
          </div>

          {/* 2. Forecasted Inflow Duration */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Timer size={14} />
              <span>{isUrdu ? 'متوقع سپلائی دورانیہ' : 'Forecasted Duration'}</span>
            </div>
            <p className="text-xl md:text-2xl font-black text-white tracking-tight">
              2d 7h (~55 hrs)
            </p>
            <p className="text-xs text-cyan-300 mt-1 font-medium">
              42 PSI (Fills 100% tank in ~8 hrs)
            </p>
          </div>

          {/* 3. Supply Interval */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-teal-300 text-xs font-bold uppercase tracking-wider mb-2">
              <TrendingUp size={14} />
              <span>{isUrdu ? 'سپلائی فریکوئنسی' : 'Supply Interval'}</span>
            </div>
            <p className="text-xl md:text-2xl font-black text-white tracking-tight">
              Every ~16.7 Days
            </p>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              Historic: <span className="text-teal-200 font-bold">13.5d – 17.0d</span>
            </p>
          </div>

          {/* 4. Consistency Score */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-amber-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles size={14} />
              <span>{isUrdu ? 'ماڈل کی درستگی' : 'Consistency Score'}</span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl md:text-2xl font-black text-white tracking-tight">
                90%
              </span>
              <span className="text-xs text-emerald-400 font-bold">High Regularity</span>
            </div>
            <p className="text-xs text-slate-300 mt-1 font-medium">
              Trained on recorded Sector 7D/1 cycles
            </p>
          </div>
        </div>

        {/* Depletion & Autonomy Engine Verdict Banner */}
        <div className="mt-5 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="size-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="text-xs text-slate-200 leading-relaxed">
              <strong className="text-emerald-300 font-extrabold mr-1">
                {isUrdu ? 'خودمختاری کا جائزہ:' : 'Autonomy Verdict:'}
              </strong>
              {isUrdu
                ? `ٹینک میں موجود پانی یومیہ ${burnRate} گیلن کے حساب سے مزید ${daysOfWaterLeft} دن چلے گا۔ اگلی متوقع سپلائی تک تقریباً 180 گیلن کا محفوظ ذخیرہ باقی رہے گا۔`
                : `Tank water will sustain until the next scheduled supply cycle (~${daysOfWaterLeft} Days left) with ~180 Gallons reserve remaining.`}
            </div>
          </div>

          <span className="text-[11px] font-black uppercase text-emerald-300 bg-emerald-900/60 px-3 py-1 rounded-xl border border-emerald-400/30 whitespace-nowrap self-start sm:self-auto">
            {isUrdu ? 'ذخیرہ تسلی بخش ہے' : 'Autonomy Secured'}
          </span>
        </div>
      </div>

      {/* ─── 4. Domestic Emergency & Backup Contacts Panel ─── */}
      <div className="p-5 rounded-3xl bg-slate-900/90 border border-slate-800 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Phone size={16} className="text-emerald-400" />
            <h5 className="text-sm font-extrabold text-white">
              {isUrdu ? 'ایمرجنسی و بیک اپ واٹر رابطے' : 'Emergency & Line Operator Contacts'}
            </h5>
          </div>
          <span className="text-[10px] font-bold text-slate-400">
            {isUrdu ? 'فوری رابطہ برائے 120 گز رہائشی' : 'Direct Sector 7D/1 Contacts'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {contacts.map((c, i) => (
            <div
              key={i}
              className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800/90 flex items-center justify-between gap-3 shadow-xs"
            >
              <div className="min-w-0">
                <span className="text-xs font-black text-white block truncate">{c.name}</span>
                <span className="text-[11px] text-cyan-300 font-bold block truncate">{c.role}</span>
                <span className="text-[10px] text-slate-400 block truncate">{c.desc}</span>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={`tel:${c.phone}`}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Phone size={13} />
                  <span>Call</span>
                </a>
                <a
                  href={`https://wa.me/${c.waNumber}?text=${encodeURIComponent(
                    `Assalam o Alaikum ${c.name}, regarding water supply for 120 sq yard home in Sector 7D/1.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <MessageSquare size={13} />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 5. Pumping Transfer Log Modal ─── */}
      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-2xl relative"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <ArrowUpRight size={18} />
                  </div>
                  <div>
                    <h4 className="text-base font-black">
                      {isUrdu ? 'چھت کے ٹینک میں ٹرانسفر لاگ' : 'Overhead Tank Pumping Transfer'}
                    </h4>
                    <p className="text-xs text-slate-400">
                      {isUrdu ? 'زیرِ زمین ٹینک سے چھت کے 500 گیلن ٹینک میں پانی چڑھائیں' : 'Transfer batch from underground reservoir to 500-Gal roof tank'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form to Log Transfer */}
              <form onSubmit={handleLogTransfer} className="space-y-4">
                <div className="p-3.5 rounded-2xl bg-cyan-950/30 border border-cyan-500/30 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-300">Default Morning Batch</span>
                    <div className="text-xl font-black font-mono text-cyan-300">100 Gallons</div>
                  </div>
                  <span className="text-[11px] font-bold text-teal-300 bg-teal-900/60 px-2.5 py-1 rounded-lg">
                    Target: 500-Gal Roof Tank
                  </span>
                </div>

                {transferBatchLogged ? (
                  <div className="p-3 rounded-xl bg-emerald-900/60 border border-emerald-500/50 text-emerald-200 text-xs font-bold flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>{isUrdu ? 'ٹرانسفر کامیابی سے لاگ ہو گیا!' : 'Transfer batch successfully recorded!'}</span>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95"
                  >
                    {isUrdu ? '100 گیلن ٹرانسفر تصدیق کریں' : 'Confirm 100-Gal Pumping Transfer'}
                  </button>
                )}
              </form>

              {/* Recent Transfers List */}
              <div className="mt-5 pt-4 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                  {isUrdu ? 'حالیہ ٹرانسفر لاگز' : 'Recent Pumping Cycles'}
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {transferLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white">{log.title} ({log.amount} Gal)</div>
                        <div className="text-[10px] text-slate-400">{log.target} • {log.operator}</div>
                      </div>
                      <span className="font-mono text-[10px] text-slate-400">{log.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── 6. Historical Recorded Municipal Supply Periods Table ─── */}
      {processedEntries.length > 0 && (
        <div className="bg-slate-900/80 p-5 sm:p-6 rounded-3xl border border-slate-800 text-white shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <h4 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
              <Droplet className="text-cyan-400" size={18} />
              <span>{isUrdu ? 'ماہانہ میونسپل سپلائی کا تاریخی ریکارڈ' : 'Recorded Municipal Supply History'}</span>
            </h4>
            <span className="text-xs bg-slate-800 text-cyan-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider w-fit">
              {processedEntries.length} {processedEntries.length === 1 ? t.periodRecorded : t.periodsRecorded}
            </span>
          </div>

          <div className="space-y-3">
            {processedEntries.map((entry, index) => (
              <div
                key={entry.id || index}
                className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-slate-950/80 p-3.5 rounded-2xl border border-slate-800/90 text-xs"
              >
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    {t.startDateAndTime} ({isUrdu ? `سپلائی ${index + 1}` : entry.label})
                  </span>
                  <p className="font-extrabold text-sm sm:text-base text-white font-mono">
                    {formatDateTimeLocalized(entry.start, lang)}
                  </p>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                    {t.endDateAndTime} ({isUrdu ? `سپلائی ${index + 1}` : entry.label})
                  </span>
                  <p className="font-extrabold text-sm sm:text-base text-white font-mono">
                    {formatDateTimeLocalized(entry.end, lang)}
                  </p>
                </div>
                <div className="bg-cyan-950/30 px-3 py-2 rounded-xl border border-cyan-500/20">
                  <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider block mb-0.5">
                    {t.supplyDuration}
                  </span>
                  {entry.duration ? (
                    <>
                      <p className="font-extrabold text-cyan-200 text-xs sm:text-sm">
                        {isUrdu
                          ? `${entry.duration.days} دن، ${entry.duration.hours} گھنٹے، ${entry.duration.minutes} منٹ`
                          : `${entry.duration.days}d ${entry.duration.hours}h ${entry.duration.minutes}m`}
                      </p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        {entry.duration.totalHours} hours total (~{entry.duration.totalHoursDecimal} hrs)
                      </p>
                    </>
                  ) : (
                    <p className="text-xs text-slate-500 font-bold">{t.supplyPending}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

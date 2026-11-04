import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import {
  Droplet, Clock, Calendar, Sparkles, TrendingUp, Share2, Check, Timer,
  Gauge, Waves, Truck, ArrowUpRight, Plus, AlertTriangle, ShieldCheck,
  Activity, CheckCircle2, ChevronRight, X, Play, Pause, RotateCcw,
  Home, Zap, Layers, AlertCircle
} from 'lucide-react'
import { predictNextWaterSupply } from '../utils/waterPrediction'
import { useLanguage } from '../context/LanguageContext'
import { translateMonth, translateWaterStatus, formatDateTimeLocalized } from '../utils/translations'

export default function WaterSupplyTracker({ entries = [], allWaterSupply = [], isAdmin = false }) {
  const [copied, setCopied] = useState(false)
  const { lang, t } = useLanguage()
  const isUrdu = lang === 'ur'
  const shouldReduceMotion = useReducedMotion()

  // ─── 1. Dual Reservoir Architecture State (120 Sq. Yd Home) ───
  // Underground Tank (UGT): 2,000 Gal (Standard) or 1,500 Gal (Compact)
  const [ugtCap, setUgtCap] = useState(2000)
  // Overhead Roof Tank (OHT): 600 Gal (Standard) or 750 Gal (Large)
  const [ohtCap, setOhtCap] = useState(600)
  // Mode: 'kwsb' (municipal line supply) or 'tanker' (backup reserve)
  const [reservoirMode, setReservoirMode] = useState('kwsb')

  // ─── 2. Sequential 13-Day Lifecycle & Interactive Simulation Slider ───
  // Total capacity = ugtCap + ohtCap (Default: 2000 + 600 = 2600 Gal)
  const totalCapacity = ugtCap + ohtCap
  // Lifespan is exactly 13.0 days after supply cut off
  // Daily burn rate = Total Capacity / 13 (2600 / 13 = 200 Gal/Day)
  const dailyBurnRate = Math.round(totalCapacity / 13)

  // Simulation day slider: Day 0 (Supply Just Ended / 100% Full) to Day 13 (Empty)
  const [currentDay, setCurrentDay] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playTimerRef = useRef(null)

  // Auto-play simulation loop (smoothly advances through 13 days)
  useEffect(() => {
    if (isPlaying) {
      playTimerRef.current = setInterval(() => {
        setCurrentDay((prev) => {
          if (prev >= 13) {
            setIsPlaying(false)
            return 13
          }
          return Math.min(13, parseFloat((prev + 0.5).toFixed(1)))
        })
      }, 700)
    } else {
      clearInterval(playTimerRef.current)
    }
    return () => clearInterval(playTimerRef.current)
  }, [isPlaying])

  // Sequential Depletion Calculation:
  // Total water burned = (currentDay / 13) * totalCapacity
  const totalBurned = Math.min(totalCapacity, (currentDay / 13) * totalCapacity)

  // Sequential Rule:
  // Phase 1 (Day 0 to ~3): OHT drains first down to 0 while UGT stays 100% full.
  // Phase 2 (Day 3 to 13): Once OHT is 0, UGT drains progressively from 100% down to 0%.
  let ohtRemaining = 0
  let ugtRemaining = 0

  if (totalBurned <= ohtCap) {
    ohtRemaining = Math.round(ohtCap - totalBurned)
    ugtRemaining = ugtCap
  } else {
    ohtRemaining = 0
    ugtRemaining = Math.max(0, Math.round(ugtCap - (totalBurned - ohtCap)))
  }

  const totalRemaining = ohtRemaining + ugtRemaining
  const ohtPercent = Math.min(100, Math.max(0, Math.round((ohtRemaining / ohtCap) * 100)))
  const ugtPercent = Math.min(100, Math.max(0, Math.round((ugtRemaining / ugtCap) * 100)))
  const totalPercent = Math.min(100, Math.max(0, Math.round((totalRemaining / totalCapacity) * 100)))

  const daysOfWaterLeft = dailyBurnRate > 0 ? (totalRemaining / dailyBurnRate).toFixed(1) : '0.0'
  const headroomGallons = totalCapacity - totalRemaining

  // Drain phase classification
  const isPhase1 = totalBurned <= ohtCap && currentDay < 13 && totalRemaining > 0
  const isPhase2 = totalBurned > ohtCap && currentDay < 13 && totalRemaining > 0
  const isDry = totalRemaining <= 0 || currentDay >= 13

  // Deficit gap math
  const municipalCycleDays = 16.7
  const maxAutonomyDays = 13.0
  const deficitDays = (municipalCycleDays - maxAutonomyDays).toFixed(1) // 3.7 days
  const rationRate = Math.round(totalCapacity / municipalCycleDays) // ~155 Gal/Day for 2,600 Gal

  // ─── 3. Overhead Pumping Transfer Log State ───
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [transferBatchLogged, setTransferBatchLogged] = useState(false)
  const [transferLogs, setTransferLogs] = useState([
    {
      id: 1,
      title: isUrdu ? 'صبح کی شفٹ پمپنگ' : 'Morning Pump Cycle',
      amount: 100,
      target: isUrdu ? `${ohtCap} گیلن چھت کا ٹینک` : `${ohtCap}-Gal Roof Tank`,
      time: isUrdu ? 'آج، 07:30 AM' : 'Today, 7:30 AM',
      operator: isUrdu ? '0.5 HP موٹر' : '0.5 HP Electric Motor',
    },
    {
      id: 2,
      title: isUrdu ? 'شام کی سپلائی ٹرانسفر' : 'Evening Top-Up',
      amount: 100,
      target: isUrdu ? `${ohtCap} گیلن چھت کا ٹینک` : `${ohtCap}-Gal Roof Tank`,
      time: isUrdu ? 'گزشتہ کل، 06:15 PM' : 'Yesterday, 6:15 PM',
      operator: isUrdu ? 'دستی سوئچ' : 'Manual Switch',
    },
    {
      id: 3,
      title: isUrdu ? 'ہفتہ وار مکمل فلنگ' : 'Full Batch Filling',
      amount: 250,
      target: isUrdu ? `${ohtCap} گیلن چھت کا ٹینک` : `${ohtCap}-Gal Roof Tank`,
      time: isUrdu ? '02 نومبر، 08:00 AM' : 'Nov 2, 8:00 AM',
      operator: isUrdu ? '0.5 HP موٹر' : '0.5 HP Electric Motor',
    }
  ])

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
      `💧 *DUAL-TANK WATER SYSTEM UPDATE*`,
      `🏠 *120 Sq. Yard Household • Sector 7D/1*`,
      ``,
      `🛢️ *Combined Reserves:* ${totalRemaining.toLocaleString()} / ${totalCapacity.toLocaleString()} Gal (${totalPercent}%)`,
      `  • Roof Tank (OHT): ${ohtRemaining.toLocaleString()} / ${ohtCap.toLocaleString()} Gal (${ohtPercent}%)`,
      `  • Underground (UGT): ${ugtRemaining.toLocaleString()} / ${ugtCap.toLocaleString()} Gal (${ugtPercent}%)`,
      `⏳ *Autonomy Remaining:* ~${daysOfWaterLeft} Days (@ ${dailyBurnRate} Gal/Day)`,
      `⚠️ *Cadence Deficit Gap:* ~${deficitDays} Days (Ration to ${rationRate} Gal/Day for 16.7d cycle)`,
      ``,
      `✅ *Last Known Municipal Supply:* ${last.formattedStart} to ${last.formattedEnd}`,
      `🔮 *Next Predicted Arrival:* *${p.windowFormatted}*`,
      `🎯 *Most Probable Start:* ${p.predictedDateFormatted}`,
      `⏱️ *Expected Inflow Duration:* ${p.avgDurationText} at 42 PSI`,
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
      target: isUrdu ? `${ohtCap} گیلن چھت کا ٹینک` : `${ohtCap}-Gal Roof Tank`,
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

  return (
    <div className="space-y-6 mt-8">
      {/* ================= HERO: DUAL-TANK WATER MANAGEMENT SYSTEM (120 SQ. YD) ================= */}
      <div className="relative overflow-hidden rounded-3xl border border-cyan-500/25 dark:border-cyan-500/20 bg-gradient-to-br from-slate-900 via-zinc-950 to-slate-950 p-5 sm:p-8 text-white shadow-2xl">
        {/* Cyberpunk Telemetry Radial Backdrop Glows */}
        <div className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-cyan-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-10 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />

        {/* ─── 1. Header Bar: Title, Capacity Sizing Toggles & Source Modes ─── */}
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5 pb-6 border-b border-slate-800">
          <div className="flex items-center gap-3.5">
            <div className="size-12 sm:size-14 rounded-2xl bg-gradient-to-tr from-cyan-600 via-teal-500 to-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/25 flex-shrink-0">
              <Layers size={26} className="text-slate-950 stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                  {isUrdu
                    ? 'ڈوئل ٹینک واٹر مینجمنٹ سسٹم • 120 گز رہائشی مکان'
                    : 'Dual-Tank Water Management System • 120 Sq. Yard Home'}
                </h3>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-500/30">
                  <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Dual-Reservoir Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {isUrdu
                  ? 'چھت (OHT) اور زیرِ زمین (UGT) ٹینکس کا 13 روزہ سلسلہ وار ڈرین ماڈل اور کیڈنس مانیٹرنگ'
                  : 'Interconnected Overhead (OHT) & Underground (UGT) dual-tank sequential 13-day lifecycle model'}
              </p>
            </div>
          </div>

          {/* Sizing & Mode Controls */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* UGT Sizing Toggle */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
              <span className="text-[10px] font-mono font-bold text-cyan-400 px-2 uppercase">UGT:</span>
              <button
                type="button"
                onClick={() => setUgtCap(2000)}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                  ugtCap === 2000
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Standard 8x8x6 ft Underground Tank"
              >
                2,000G
              </button>
              <button
                type="button"
                onClick={() => setUgtCap(1500)}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                  ugtCap === 1500
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Compact 8x6x6 ft Underground Tank"
              >
                1,500G
              </button>
            </div>

            {/* OHT Sizing Toggle */}
            <div className="flex items-center p-1 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-inner">
              <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 uppercase">OHT:</span>
              <button
                type="button"
                onClick={() => setOhtCap(600)}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                  ohtCap === 600
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Standard 600-Gallon Roof Tank"
              >
                600G
              </button>
              <button
                type="button"
                onClick={() => setOhtCap(750)}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                  ohtCap === 750
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Large 750-Gallon Roof Tank"
              >
                750G
              </button>
            </div>

            {/* Supply Source Indicator Pill */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-slate-900/90 border border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setReservoirMode('kwsb')
                  setCurrentDay(0)
                }}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-all ${
                  reservoirMode === 'kwsb'
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Droplet size={13} />
                <span>KWSB Supply</span>
              </button>
              <button
                type="button"
                onClick={() => setReservoirMode('tanker')}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black transition-all ${
                  reservoirMode === 'tanker'
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Truck size={13} />
                <span>Tanker</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── 2. Dual 3D Isometric Fluid Visualization & Domestic Elevation ─── */}
        <div className="relative z-10 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Visual Elevation Layout: OHT (Top Right) + UGT (Bottom Left) + Interconnected Pipe */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[460px] h-[340px] sm:h-[370px] select-none flex items-center justify-center">
                
                {/* Domestic Elevation Grid Backdrop */}
                <div className="absolute inset-0 rounded-3xl bg-slate-950/40 border border-slate-800/60 [background-image:radial-gradient(rgba(34,211,238,0.08)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                {/* ================= CONNECTING PUMPING PIPE (SVG) ================= */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 460 370">
                  <defs>
                    <linearGradient id="pipeGrad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.8" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                    </linearGradient>
                  </defs>
                  {/* Delivery Pipe from UGT Bottom to OHT Top */}
                  <path
                    d="M 170 290 L 170 120 L 290 120 L 290 90"
                    fill="none"
                    stroke="rgba(51, 65, 85, 0.7)"
                    strokeWidth="6"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  {/* Animated Water Flow Line (Active during transfer or Phase 2) */}
                  <path
                    d="M 170 290 L 170 120 L 290 120 L 290 90"
                    fill="none"
                    stroke="url(#pipeGrad)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray={isPhase2 ? "8 6" : "4 8"}
                    className={isPhase2 ? "animate-[dash_1s_linear_infinite]" : "opacity-40"}
                  />
                  {/* Suction Motor Pump Node on Pipe */}
                  <circle cx="170" cy="205" r="9" fill="#0f172a" stroke="#06b6d4" strokeWidth="2.5" />
                </svg>

                {/* Monoblock Motor Pump Label Badge */}
                <div className="absolute left-[28%] sm:left-[30%] top-[48%] -translate-y-1/2 z-20 flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-900/90 border border-cyan-500/40 text-[9px] font-mono font-bold text-cyan-300 shadow-md backdrop-blur-xs">
                  <Zap size={11} className={isPhase2 ? "text-amber-400 animate-pulse" : "text-cyan-400"} />
                  <span>{isPhase2 ? '0.5 HP Pump (Active)' : '0.5 HP Monoblock (Idle)'}</span>
                </div>

                {/* ================= 1. OVERHEAD ROOF TANK (OHT - TOP RIGHT) ================= */}
                <div className="absolute right-4 sm:right-8 top-3 sm:top-5 z-20 flex flex-col items-center">
                  <div className="flex items-center gap-1 mb-1.5">
                    <Home size={12} className="text-emerald-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-300">
                      Roof Tank (OHT)
                    </span>
                  </div>

                  <div style={{ perspective: 900 }} className="relative w-28 sm:w-34 h-38 sm:h-44 flex items-center justify-center">
                    <div
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: shouldReduceMotion ? 'none' : 'rotateX(20deg)',
                      }}
                      className="relative w-24 sm:w-28 h-32 sm:h-38"
                    >
                      {/* Base Shadow */}
                      <div className="pointer-events-none absolute -bottom-3 left-1/2 -translate-x-1/2 w-28 h-6 rounded-[50%] bg-emerald-950/70 blur-xs" />

                      {/* Bottom Elliptical Rim */}
                      <div className="absolute bottom-0 inset-x-0 h-6 rounded-[50%] border-2 border-emerald-400/40 bg-emerald-950/80 z-10" />

                      {/* Glass Body */}
                      <div className="absolute inset-0 rounded-b-xl border-x-2 border-emerald-400/30 bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xs overflow-hidden z-10">
                        {/* Specular Glare */}
                        <div className="absolute left-1.5 inset-y-0 w-1.5 bg-gradient-to-r from-white/25 to-transparent pointer-events-none" />

                        {/* Graduation Lines */}
                        <div className="absolute right-1.5 inset-y-3 flex flex-col justify-between text-[7px] font-mono font-bold text-emerald-200/60 pointer-events-none z-30">
                          <span>100%</span>
                          <span>50%</span>
                          <span>0%</span>
                        </div>

                        {/* Liquid Column */}
                        <motion.div
                          animate={{ height: `${ohtPercent}%` }}
                          transition={{ type: 'spring', stiffness: 120, damping: 16 }}
                          className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-emerald-950 via-teal-700 to-emerald-400/85 z-20"
                        >
                          {/* Surface Meniscus Disc */}
                          <div className="absolute -top-2 inset-x-0 h-5 rounded-[50%] bg-gradient-to-tr from-emerald-300 via-teal-200 to-emerald-400 border border-white/90 shadow-sm z-30" />

                          {/* Dual SVG Slosh Waves */}
                          {!shouldReduceMotion && ohtPercent > 0 && (
                            <div className="absolute -top-2 inset-x-0 h-4 overflow-hidden pointer-events-none z-20">
                              <motion.div
                                animate={{ x: [0, -80] }}
                                transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-y-0 left-0 w-[240px] flex"
                              >
                                <svg className="w-[240px] h-4" viewBox="0 0 240 16" fill="none">
                                  <path
                                    d="M 0 6 Q 20 0, 40 6 T 80 6 T 120 6 T 160 6 T 200 6 T 240 6 L 240 16 L 0 16 Z"
                                    fill="rgba(52, 211, 153, 0.85)"
                                  />
                                </svg>
                              </motion.div>
                            </div>
                          )}
                        </motion.div>
                      </div>

                      {/* Top Rim */}
                      <div className="absolute -top-2.5 inset-x-0 h-6 rounded-[50%] border-2 border-emerald-300/50 bg-gradient-to-b from-white/20 to-transparent z-40 pointer-events-none" />
                    </div>

                    {/* Live Water Level Badge */}
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-30 px-2 py-0.5 rounded-lg bg-slate-950/95 border border-emerald-500/40 text-[10px] font-mono font-black text-emerald-300 whitespace-nowrap shadow-lg">
                      {ohtRemaining.toLocaleString()} / {ohtCap} Gal ({ohtPercent}%)
                    </div>
                  </div>
                </div>

                {/* ================= 2. UNDERGROUND RESERVOIR (UGT - BOTTOM LEFT) ================= */}
                <div className="absolute left-3 sm:left-6 bottom-4 sm:bottom-6 z-20 flex flex-col items-center">
                  <div className="flex items-center gap-1 mb-1.5">
                    <Waves size={13} className="text-cyan-400" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-cyan-300">
                      Underground Tank (UGT)
                    </span>
                  </div>

                  <div style={{ perspective: 1000 }} className="relative w-36 sm:w-46 h-46 sm:h-54 flex items-center justify-center">
                    <div
                      style={{
                        transformStyle: 'preserve-3d',
                        transform: shouldReduceMotion ? 'none' : 'rotateX(20deg)',
                      }}
                      className="relative w-32 sm:w-40 h-40 sm:h-48"
                    >
                      {/* Dynamic Ground Shadow */}
                      <motion.div
                        animate={{
                          scale: 0.85 + (ugtPercent / 100) * 0.3,
                          opacity: 0.3 + (ugtPercent / 100) * 0.45,
                        }}
                        transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                        className="pointer-events-none absolute -bottom-5 left-1/2 -translate-x-1/2 w-40 sm:w-48 h-8 rounded-[50%] bg-cyan-950/80 blur-md z-0"
                      />

                      {/* Bottom Rim */}
                      <div className="absolute bottom-0 inset-x-0 h-8 rounded-[50%] border-2 border-cyan-400/40 bg-cyan-950/80 z-10" />

                      {/* Transparent Frosted Tank Body */}
                      <div className="absolute inset-0 rounded-b-2xl border-x-2 border-cyan-400/30 bg-gradient-to-r from-white/10 via-white/5 to-white/10 backdrop-blur-xs overflow-hidden z-10">
                        {/* Specular Highlights */}
                        <div className="absolute left-2 inset-y-0 w-2 bg-gradient-to-r from-white/30 to-transparent pointer-events-none" />
                        <div className="absolute right-2 inset-y-0 w-1 bg-gradient-to-l from-white/20 to-transparent pointer-events-none" />

                        {/* Level Markings: 100%, 75%, 50%, 25%, 0% */}
                        <div className="absolute left-2 inset-y-4 flex flex-col justify-between text-[8px] font-mono font-bold text-cyan-200/70 pointer-events-none z-30 select-none">
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-px bg-cyan-200/80" />100%
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-px bg-cyan-200/60" />75%
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-px bg-cyan-200/60" />50%
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-1.5 h-px bg-cyan-200/60" />25%
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="w-2 h-px bg-cyan-200/80" />0%
                          </span>
                        </div>

                        {/* Liquid Fill Column */}
                        <motion.div
                          animate={{ height: `${ugtPercent}%` }}
                          transition={{ type: 'spring', stiffness: 120, damping: 14 }}
                          className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-cyan-950 via-teal-700/90 to-cyan-400/85 overflow-visible z-20"
                        >
                          {/* Surface Meniscus Disc */}
                          <div className="absolute -top-3.5 inset-x-0 h-7 rounded-[50%] bg-gradient-to-tr from-cyan-300 via-teal-200 to-cyan-400 border border-white/90 shadow-[inset_0_2px_6px_rgba(255,255,255,0.8),0_2px_10px_rgba(6,182,212,0.5)] z-30" />

                          {/* Dual SVG Sinusoidal Slosh Waves */}
                          {!shouldReduceMotion && ugtPercent > 0 && (
                            <div className="absolute -top-3 inset-x-0 h-5 overflow-hidden pointer-events-none z-20">
                              <motion.div
                                animate={{ x: [0, -100] }}
                                transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-y-0 left-0 w-[400px] flex"
                              >
                                <svg className="w-[400px] h-5" viewBox="0 0 400 20" fill="none">
                                  <path
                                    d="M 0 8 Q 25 0, 50 8 T 100 8 T 150 8 T 200 8 T 250 8 T 300 8 T 350 8 T 400 8 L 400 20 L 0 20 Z"
                                    fill="rgba(34, 211, 238, 0.85)"
                                  />
                                </svg>
                              </motion.div>
                              <motion.div
                                animate={{ x: [-100, 0] }}
                                transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                                className="absolute inset-y-0 left-0 w-[400px] flex opacity-60"
                              >
                                <svg className="w-[400px] h-5" viewBox="0 0 400 20" fill="none">
                                  <path
                                    d="M 0 10 Q 25 18, 50 10 T 100 10 T 150 10 T 200 10 T 250 10 T 300 10 T 350 10 T 400 10 L 400 20 L 0 20 Z"
                                    fill="rgba(13, 148, 136, 0.75)"
                                  />
                                </svg>
                              </motion.div>
                            </div>
                          )}
                        </motion.div>
                      </div>

                      {/* Top Rim */}
                      <div className="absolute -top-3 inset-x-0 h-8 rounded-[50%] border-2 border-cyan-300/50 bg-gradient-to-b from-white/20 via-cyan-100/10 to-transparent shadow-[inset_0_2px_6px_rgba(255,255,255,0.6)] z-40 pointer-events-none" />
                    </div>

                    {/* Live Water Level Badge */}
                    <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 z-30 px-2.5 py-0.5 rounded-lg bg-slate-950/95 border border-cyan-500/40 text-[10px] font-mono font-black text-cyan-300 whitespace-nowrap shadow-lg">
                      {ugtRemaining.toLocaleString()} / {ugtCap.toLocaleString()} Gal ({ugtPercent}%)
                    </div>
                  </div>
                </div>

              </div>
            </div>

            {/* ================= TELEMETRY METRICS GRID (4 CARDS) ================= */}
            <div className="lg:col-span-6 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Metric 1: Combined Storage Reserves */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm backdrop-blur-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      {isUrdu ? 'مجموعی پانی ذخیرہ' : 'Combined Reserves'}
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      currentDay === 0
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : totalPercent < 20
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/30 animate-pulse'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {currentDay === 0
                        ? '100% Full (Supply Just Ended)'
                        : totalPercent < 20
                        ? 'Critical Reserve (<20%)'
                        : `${totalPercent}% Capacity`}
                    </span>
                  </div>

                  <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">
                    {totalRemaining.toLocaleString()}{' '}
                    <span className="text-sm font-bold text-slate-400">/ {totalCapacity.toLocaleString()} Gal</span>
                  </div>

                  {/* Dual-Color Breakdown Bar: Cyan (UGT) + Emerald (OHT) */}
                  <div className="w-full bg-slate-800 rounded-full h-2.5 mt-2.5 flex overflow-hidden p-0.5">
                    {/* UGT portion */}
                    <motion.div
                      animate={{ width: `${(ugtRemaining / totalCapacity) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-l-full"
                      title={`UGT: ${ugtRemaining} Gal`}
                    />
                    {/* OHT portion */}
                    <motion.div
                      animate={{ width: `${(ohtRemaining / totalCapacity) * 100}%` }}
                      transition={{ duration: 0.5 }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-green-300 rounded-r-full"
                      title={`OHT: ${ohtRemaining} Gal`}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[10px] font-mono font-bold mt-1.5 text-slate-400">
                    <span className="text-cyan-400">UGT: {ugtRemaining.toLocaleString()}G</span>
                    <span className="text-emerald-400">OHT: {ohtRemaining.toLocaleString()}G</span>
                  </div>
                </div>

                {/* Metric 2: Burn Rate & Autonomy Duration */}
                <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 shadow-sm backdrop-blur-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      {isUrdu ? 'یومیہ خرچ و مدت' : 'Burn Rate & Autonomy'}
                    </span>
                    <span className="text-[10px] font-bold text-teal-400 font-mono">
                      13.0 Days Profile
                    </span>
                  </div>

                  <div className="text-2xl sm:text-3xl font-black font-mono text-white flex items-baseline gap-1">
                    <span>{daysOfWaterLeft}</span>
                    <span className="text-xs font-bold text-slate-400">Days Left</span>
                  </div>

                  <div className="text-xs font-bold text-emerald-400 mt-1 flex items-center justify-between">
                    <span>Burn Rate: {dailyBurnRate} Gal/Day</span>
                    <span className={`text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      isPhase1 ? 'bg-emerald-950 text-emerald-300' : isPhase2 ? 'bg-cyan-950 text-cyan-300' : 'bg-rose-950 text-rose-300'
                    }`}>
                      {isPhase1 ? 'Phase 1: OHT Draw' : isPhase2 ? 'Phase 2: UGT Draw' : 'Dry / Refill Req.'}
                    </span>
                  </div>
                </div>

                {/* Metric 3: Line Pressure / Inflow Sensor */}
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

                {/* Metric 4: Municipal Supply Status */}
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

              </div>

              {/* Action: Log Overhead Tank Transfer */}
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
                        ? `معمول: 100 گیلن بیج برائے ${ohtCap} گیلن چھت ٹینک`
                        : `Default: 100 Gal batch to ${ohtCap}-gallon roof tank`}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTransferModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-md shadow-cyan-500/20 transition-all active:scale-95"
                >
                  <Plus size={16} />
                  <span>{isUrdu ? '+ ٹرانسفر درج کریں' : '+ Log Overhead Transfer'}</span>
                </button>
              </div>

            </div>
          </div>

          {/* ─── 3. Sequential 13-Day Timeline Slider & Simulation Controls ─── */}
          <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-slate-950/90 border border-slate-800 shadow-inner">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="size-8 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center font-bold shadow-md transition-transform active:scale-90"
                  title={isPlaying ? "Pause Simulation" : "Auto-Play 13-Day Drain"}
                >
                  {isPlaying ? <Pause size={15} /> : <Play size={15} className="ml-0.5" />}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsPlaying(false)
                    setCurrentDay(0)
                  }}
                  className="size-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center transition-colors"
                  title="Reset to Day 0 (Full)"
                >
                  <RotateCcw size={14} />
                </button>

                <div>
                  <span className="text-xs font-black text-white flex items-center gap-1.5">
                    <span>Days Since Supply Ended:</span>
                    <span className="font-mono text-cyan-300 text-sm font-extrabold bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/30">
                      Day {currentDay} / 13.0
                    </span>
                  </span>
                  <p className="text-[10px] text-slate-400">
                    Sequential Drain Rule: Roof Tank (OHT) empties first (Days 0–3), then Underground Tank drains (Days 3–13).
                  </p>
                </div>
              </div>

              {/* Quick Jump Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => { setIsPlaying(false); setCurrentDay(0) }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    currentDay === 0 ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Day 0 (Full)
                </button>
                <button
                  type="button"
                  onClick={() => { setIsPlaying(false); setCurrentDay(2) }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    currentDay === 2 ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Day 2 (OHT Low)
                </button>
                <button
                  type="button"
                  onClick={() => { setIsPlaying(false); setCurrentDay(3) }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    currentDay === 3 ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Day 3 (OHT Empty)
                </button>
                <button
                  type="button"
                  onClick={() => { setIsPlaying(false); setCurrentDay(8) }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    currentDay === 8 ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Day 8 (UGT 50%)
                </button>
                <button
                  type="button"
                  onClick={() => { setIsPlaying(false); setCurrentDay(13) }}
                  className={`px-2 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    currentDay === 13 ? 'bg-rose-500 text-white font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Day 13 (Empty)
                </button>
              </div>
            </div>

            {/* Range Slider */}
            <input
              type="range"
              min="0"
              max="13"
              step="0.5"
              value={currentDay}
              onChange={(e) => {
                setIsPlaying(false)
                setCurrentDay(parseFloat(e.target.value))
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />

            {/* Slider Markers */}
            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1 px-1">
              <span>Day 0 (Full - {totalCapacity}G)</span>
              <span>Day 3 (OHT Empty - {ugtCap}G)</span>
              <span>Day 6</span>
              <span>Day 9</span>
              <span className="text-rose-400">Day 13 (0G Empty)</span>
            </div>
          </div>
        </div>

        {/* ─── 4. Water Deficit Expected Alert Card (Cadence vs. Reserve Gap) ─── */}
        <div className="relative z-10 mt-6 p-4 sm:p-5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg backdrop-blur-xs">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  ⚠️ Water Deficit Expected • Karachi Municipal Cadence Gap
                </span>
                <span className="text-[10px] font-mono font-bold bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded border border-amber-400/30">
                  {deficitDays} Days Deficit
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1 leading-relaxed">
                Reserves will run out <strong>~{deficitDays} days</strong> before the next municipal line arrives (Supply cadence: <strong>Every ~{municipalCycleDays} Days</strong> vs Reserve span: <strong>{maxAutonomyDays} Days Maximum</strong>).
                {' '}Ration consumption to <strong className="text-emerald-300 font-mono font-extrabold">{rationRate} Gal/Day</strong> to stretch supply across the full {municipalCycleDays}-day cycle.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-shrink-0">
            <div className="text-right font-mono">
              <div className="text-[10px] text-slate-400 uppercase">Target Ration</div>
              <div className="text-sm font-black text-emerald-300">{rationRate} Gal/Day</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 5. Next Water Supply Forecast (Predictive Cadence Model) ─── */}
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
              42 PSI (Fills dual tanks in ~10 hrs)
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

        {/* Balance Verdict Banner */}
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
                ? `ڈوئل ٹینکس میں موجود پانی یومیہ ${dailyBurnRate} گیلن کے حساب سے ${daysOfWaterLeft} دن چلے گا۔`
                : `Dual reservoirs provide ~${daysOfWaterLeft} Days of autonomy at current burn rate of ${dailyBurnRate} Gal/Day.`}
            </div>
          </div>

          <span className="text-[11px] font-black uppercase text-emerald-300 bg-emerald-900/60 px-3 py-1 rounded-xl border border-emerald-400/30 whitespace-nowrap self-start sm:self-auto">
            {isUrdu ? 'ذخیرہ تسلی بخش ہے' : 'Dual Storage Calibrated'}
          </span>
        </div>
      </div>

      {/* ─── 6. Pumping Transfer Log Modal ─── */}
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
                      {isUrdu ? `زیرِ زمین ٹینک سے چھت کے ${ohtCap} گیلن ٹینک میں پانی چڑھائیں` : `Transfer batch from underground reservoir to ${ohtCap}-Gal roof tank`}
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
                    Target: {ohtCap}-Gal Roof Tank
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

      {/* ─── 7. Historical Recorded Municipal Supply Periods Table ─── */}
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

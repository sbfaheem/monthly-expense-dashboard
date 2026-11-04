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
import { translateMonth, formatDateTimeLocalized } from '../utils/translations'

export default function WaterSupplyTracker({ entries = [], allWaterSupply = [], isAdmin = false }) {
  const [copied, setCopied] = useState(false)
  const { lang, t } = useLanguage()
  const isUrdu = lang === 'ur'
  const shouldReduceMotion = useReducedMotion()

  // ─── 1. Dual Reservoir Architecture State (120 Sq. Yd Home) ───
  // Default: 1,500 Gal UGT + 600 Gal OHT = 2,100 Gal Combined Reserves
  const [ugtCap, setUgtCap] = useState(1500) // 1,500G (default) vs 2,000G
  const [ohtCap, setOhtCap] = useState(600)  // 600G (default) vs 750G
  const [reservoirMode, setReservoirMode] = useState('kwsb') // 'kwsb' | 'tanker'

  // Total capacity = ugtCap + ohtCap
  const totalCapacity = ugtCap + ohtCap
  // Lifespan is exactly 13.0 days after supply cut off
  const dailyBurnRate = Math.round(totalCapacity / 13)

  // Simulation day slider: Day 0.0 (Full) to Day 13.0 (Empty)
  const [currentDay, setCurrentDay] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const playTimerRef = useRef(null)

  // Sequential Depletion Calculation
  // Total water burned = (currentDay / 13) * totalCapacity
  const totalBurned = Math.min(totalCapacity, (currentDay / 13) * totalCapacity)

  // Phase 1: OHT drains first until it hits 0 Gal. UGT remains 100% full.
  // Phase 2: Once OHT reaches 0, UGT drains progressively from 100% to 0 Gal at Day 13.0.
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

  // Phase transition day (e.g., 600 / 161.54 = ~3.7 days for 2,100 Gal)
  const phase1Days = parseFloat(((ohtCap / totalCapacity) * 13).toFixed(1))
  const isPhase1 = currentDay <= phase1Days && totalRemaining > 0
  const isPhase2 = currentDay > phase1Days && currentDay < 13 && totalRemaining > 0
  const isDry = totalRemaining <= 0 || currentDay >= 13

  // Municipal cadence deficit metrics
  const municipalCycleDays = 16.7
  const maxAutonomyDays = 13.0
  const deficitDays = (municipalCycleDays - maxAutonomyDays).toFixed(1) // 3.7 days
  const rationRate = Math.round(totalCapacity / municipalCycleDays) // ~126 Gal/Day for 2,100 Gal

  // Auto-play simulation loop
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
      }, 650)
    } else {
      clearInterval(playTimerRef.current)
    }
    return () => clearInterval(playTimerRef.current)
  }, [isPlaying])

  // ─── 2. HTML5 Canvas Dual-Tank Slosh Simulation ───
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationId
    let time = 0

    // High DPI scaling
    const dpr = window.devicePixelRatio || 1
    const displayWidth = 520
    const displayHeight = 350

    canvas.width = displayWidth * dpr
    canvas.height = displayHeight * dpr
    ctx.scale(dpr, dpr)

    const render = () => {
      time += 0.035
      ctx.clearRect(0, 0, displayWidth, displayHeight)

      // ─── A. Interconnected Plumbing & Monoblock Pump ───
      ctx.save()
      // Pipe path: from UGT bottom (150, 290) -> (150, 105) -> (360, 105) -> OHT top (360, 75)
      ctx.beginPath()
      ctx.moveTo(150, 290)
      ctx.lineTo(150, 105)
      ctx.lineTo(360, 105)
      ctx.lineTo(360, 75)
      ctx.strokeStyle = 'rgba(51, 65, 85, 0.65)'
      ctx.lineWidth = 5
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.stroke()

      // Flow pulses inside pipe when pump is active
      if (isPhase2 || isPlaying) {
        ctx.beginPath()
        ctx.moveTo(150, 290)
        ctx.lineTo(150, 105)
        ctx.lineTo(360, 105)
        ctx.lineTo(360, 75)
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.85)'
        ctx.lineWidth = 3
        ctx.setLineDash([8, 6])
        ctx.lineDashOffset = -time * 28
        ctx.stroke()
        ctx.setLineDash([])
      }

      // Monoblock Suction Pump node at (150, 195)
      ctx.beginPath()
      ctx.arc(150, 195, 11, 0, Math.PI * 2)
      ctx.fillStyle = '#090d16'
      ctx.fill()
      ctx.lineWidth = 2.5
      ctx.strokeStyle = isPhase2 ? '#06b6d4' : '#475569'
      ctx.stroke()

      if (isPhase2) {
        // Pulsing glow halo around active pump
        ctx.beginPath()
        ctx.arc(150, 195, 16 + Math.sin(time * 6) * 3, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)'
        ctx.lineWidth = 1.5
        ctx.stroke()
      }
      ctx.restore()

      // Helper to draw an ellipse
      const drawEllipse = (cx, cy, rx, ry, fill, stroke) => {
        ctx.beginPath()
        ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2)
        if (fill) {
          ctx.fillStyle = fill
          ctx.fill()
        }
        if (stroke) {
          ctx.strokeStyle = stroke
          ctx.stroke()
        }
      }

      // ─── B. Underground Tank (UGT - Lower Left) ───
      // Center: (135, 220), Base Y: 305, Top Y: 165 (Height: 140), RadiusX: 72, RadiusY: 20
      const ugtX = 135
      const ugtBaseY = 305
      const ugtHeight = 140
      const ugtTopY = ugtBaseY - ugtHeight
      const ugtRx = 72
      const ugtRy = 20
      const ugtFillHeight = Math.max(0, (ugtPercent / 100) * ugtHeight)

      // Dynamic Base Contact Shadow
      const shadowScale = 0.85 + (ugtPercent / 100) * 0.3
      drawEllipse(ugtX, ugtBaseY + 6, ugtRx * shadowScale, ugtRy * 0.7 * shadowScale, 'rgba(8, 51, 68, 0.55)', null)

      // Bottom Glass Rim
      drawEllipse(ugtX, ugtBaseY, ugtRx, ugtRy, 'rgba(12, 74, 96, 0.4)', 'rgba(6, 182, 212, 0.4)')

      // Glass Body Cylinder Background
      ctx.save()
      const ugtGlassGrad = ctx.createLinearGradient(ugtX - ugtRx, 0, ugtX + ugtRx, 0)
      ugtGlassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)')
      ugtGlassGrad.addColorStop(0.3, 'rgba(255, 255, 255, 0.02)')
      ugtGlassGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.04)')
      ugtGlassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.09)')
      ctx.fillStyle = ugtGlassGrad
      ctx.fillRect(ugtX - ugtRx, ugtTopY, ugtRx * 2, ugtHeight)

      // Glass Wall Borders
      ctx.beginPath()
      ctx.moveTo(ugtX - ugtRx, ugtTopY)
      ctx.lineTo(ugtX - ugtRx, ugtBaseY)
      ctx.moveTo(ugtX + ugtRx, ugtTopY)
      ctx.lineTo(ugtX + ugtRx, ugtBaseY)
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Specular Glare Highlights
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)'
      ctx.fillRect(ugtX - ugtRx + 6, ugtTopY + 4, 3, ugtHeight - 8)
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)'
      ctx.fillRect(ugtX + ugtRx - 9, ugtTopY + 4, 2, ugtHeight - 8)

      // Level graduation markings (0%, 25%, 50%, 75%, 100%)
      ctx.font = '8px monospace'
      ctx.fillStyle = 'rgba(103, 232, 249, 0.75)'
      const marks = [
        { label: '100%', y: ugtTopY },
        { label: '75%', y: ugtTopY + ugtHeight * 0.25 },
        { label: '50%', y: ugtTopY + ugtHeight * 0.5 },
        { label: '25%', y: ugtTopY + ugtHeight * 0.75 },
        { label: '0%', y: ugtBaseY },
      ]
      marks.forEach(m => {
        ctx.fillRect(ugtX - ugtRx + 3, m.y, 6, 1)
        ctx.fillText(m.label, ugtX - ugtRx + 12, m.y + 3)
      })

      // UGT Liquid Column & Meniscus Slosh Waves
      if (ugtFillHeight > 0) {
        const ugtSurfaceY = ugtBaseY - ugtFillHeight
        const fluidGrad = ctx.createLinearGradient(0, ugtBaseY, 0, ugtSurfaceY)
        fluidGrad.addColorStop(0, 'rgba(8, 47, 73, 0.95)')
        fluidGrad.addColorStop(0.4, 'rgba(13, 148, 136, 0.88)')
        fluidGrad.addColorStop(1, 'rgba(6, 182, 212, 0.82)')

        // Fluid body fill
        ctx.beginPath()
        ctx.moveTo(ugtX - ugtRx, ugtBaseY)
        ctx.lineTo(ugtX - ugtRx, ugtSurfaceY)

        // Sinusoidal wave across top liquid surface
        const waveAmp = shouldReduceMotion ? 0 : Math.min(3.5, ugtFillHeight * 0.1)
        for (let x = ugtX - ugtRx; x <= ugtX + ugtRx; x += 3) {
          const wave = Math.sin((x - ugtX) * 0.08 + time * 3) * waveAmp +
                       Math.cos((x - ugtX) * 0.05 - time * 2) * (waveAmp * 0.5)
          ctx.lineTo(x, ugtSurfaceY + wave)
        }

        ctx.lineTo(ugtX + ugtRx, ugtBaseY)
        ctx.closePath()
        ctx.fillStyle = fluidGrad
        ctx.fill()

        // Top surface meniscus ellipse disc
        drawEllipse(
          ugtX,
          ugtSurfaceY,
          ugtRx - 1,
          ugtRy * (ugtFillHeight / ugtHeight * 0.3 + 0.7),
          'rgba(34, 211, 238, 0.7)',
          'rgba(255, 255, 255, 0.85)'
        )
      }

      // Top Glass Rim
      drawEllipse(ugtX, ugtTopY, ugtRx, ugtRy, 'rgba(255, 255, 255, 0.05)', 'rgba(6, 182, 212, 0.45)')
      ctx.restore()

      // ─── C. Overhead Roof Tank (OHT - Upper Right) ───
      // Center: (375, 105), Base Y: 165, Top Y: 65 (Height: 100), RadiusX: 52, RadiusY: 15
      const ohtX = 375
      const ohtBaseY = 165
      const ohtHeight = 100
      const ohtTopY = ohtBaseY - ohtHeight
      const ohtRx = 52
      const ohtRy = 15
      const ohtFillHeight = Math.max(0, (ohtPercent / 100) * ohtHeight)

      ctx.save()
      // Shadow
      drawEllipse(ohtX, ohtBaseY + 4, ohtRx * 0.85, ohtRy * 0.65, 'rgba(6, 78, 59, 0.45)', null)

      // Bottom Glass Rim
      drawEllipse(ohtX, ohtBaseY, ohtRx, ohtRy, 'rgba(6, 95, 70, 0.3)', 'rgba(52, 211, 153, 0.4)')

      // Glass Wall Body
      const ohtGlassGrad = ctx.createLinearGradient(ohtX - ohtRx, 0, ohtX + ohtRx, 0)
      ohtGlassGrad.addColorStop(0, 'rgba(255, 255, 255, 0.08)')
      ohtGlassGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.02)')
      ohtGlassGrad.addColorStop(1, 'rgba(255, 255, 255, 0.08)')
      ctx.fillStyle = ohtGlassGrad
      ctx.fillRect(ohtX - ohtRx, ohtTopY, ohtRx * 2, ohtHeight)

      // Borders
      ctx.beginPath()
      ctx.moveTo(ohtX - ohtRx, ohtTopY)
      ctx.lineTo(ohtX - ohtRx, ohtBaseY)
      ctx.moveTo(ohtX + ohtRx, ohtTopY)
      ctx.lineTo(ohtX + ohtRx, ohtBaseY)
      ctx.strokeStyle = 'rgba(52, 211, 153, 0.35)'
      ctx.lineWidth = 2
      ctx.stroke()

      // Specular Glare
      ctx.fillStyle = 'rgba(255, 255, 255, 0.22)'
      ctx.fillRect(ohtX - ohtRx + 5, ohtTopY + 3, 2.5, ohtHeight - 6)

      // Markings on Right (25%, 50%, 75%, 100%)
      ctx.font = '8px monospace'
      ctx.fillStyle = 'rgba(110, 231, 183, 0.75)'
      const ohtMarks = [
        { label: '100%', y: ohtTopY },
        { label: '75%', y: ohtTopY + ohtHeight * 0.25 },
        { label: '50%', y: ohtTopY + ohtHeight * 0.5 },
        { label: '25%', y: ohtTopY + ohtHeight * 0.75 },
      ]
      ohtMarks.forEach(m => {
        ctx.fillRect(ohtX + ohtRx - 9, m.y, 6, 1)
        ctx.fillText(m.label, ohtX + ohtRx - 32, m.y + 3)
      })

      // OHT Liquid Column & Meniscus Slosh
      if (ohtFillHeight > 0) {
        const ohtSurfaceY = ohtBaseY - ohtFillHeight
        const ohtFluidGrad = ctx.createLinearGradient(0, ohtBaseY, 0, ohtSurfaceY)
        ohtFluidGrad.addColorStop(0, 'rgba(6, 78, 59, 0.95)')
        ohtFluidGrad.addColorStop(0.4, 'rgba(16, 185, 129, 0.88)')
        ohtFluidGrad.addColorStop(1, 'rgba(52, 211, 153, 0.82)')

        ctx.beginPath()
        ctx.moveTo(ohtX - ohtRx, ohtBaseY)
        ctx.lineTo(ohtX - ohtRx, ohtSurfaceY)

        const ohtWaveAmp = shouldReduceMotion ? 0 : Math.min(2.8, ohtFillHeight * 0.1)
        for (let x = ohtX - ohtRx; x <= ohtX + ohtRx; x += 3) {
          const wave = Math.sin((x - ohtX) * 0.1 + time * 3.5) * ohtWaveAmp
          ctx.lineTo(x, ohtSurfaceY + wave)
        }

        ctx.lineTo(ohtX + ohtRx, ohtBaseY)
        ctx.closePath()
        ctx.fillStyle = ohtFluidGrad
        ctx.fill()

        drawEllipse(
          ohtX,
          ohtSurfaceY,
          ohtRx - 1,
          ohtRy * (ohtFillHeight / ohtHeight * 0.3 + 0.7),
          'rgba(52, 211, 153, 0.75)',
          'rgba(255, 255, 255, 0.85)'
        )
      }

      // Top Glass Rim
      drawEllipse(ohtX, ohtTopY, ohtRx, ohtRy, 'rgba(255, 255, 255, 0.05)', 'rgba(52, 211, 153, 0.45)')
      ctx.restore()

      animationId = requestAnimationFrame(render)
    }

    render()
    return () => cancelAnimationFrame(animationId)
  }, [ugtPercent, ohtPercent, isPhase2, isPlaying, shouldReduceMotion])

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
      operator: isUrdu ? '0.5 HP موٹر' : '0.5 HP Monoblock',
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
      operator: isUrdu ? '0.5 HP موٹر' : '0.5 HP Monoblock',
    }
  ])

  // Processed recorded municipal supply entries (with default recorded periods)
  const defaultHistoryEntries = [
    {
      id: 'ws-hist-1',
      start: '2026-09-17T01:35:00',
      end: '2026-09-19T09:00:00',
      label: 'Supply 1'
    },
    {
      id: 'ws-hist-2',
      start: '2026-09-30T14:20:00',
      end: '2026-10-02T21:10:00',
      label: 'Supply 2'
    }
  ]

  const activeEntries = (entries && entries.length > 0) ? entries : defaultHistoryEntries
  const processedEntries = activeEntries.map((entry, idx) => {
    const dStart = entry.start ? new Date(entry.start) : null
    const dEnd = entry.end ? new Date(entry.end) : null
    let duration = null

    if (dStart && dEnd && dEnd >= dStart) {
      const diffMs = dEnd - dStart
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
      label: entry.label || `Supply Period ${idx + 1}`
    }
  })

  // Machine Learning Predictive Forecasting Model
  const predictionData = predictNextWaterSupply(allWaterSupply)

  const handleShareToWhatsApp = () => {
    if (!isAdmin || !predictionData.hasEnoughData) return
    const p = predictionData.prediction
    const last = predictionData.lastSupply

    const msg = [
      `💧 *DUAL-TANK WATER MANAGEMENT UPDATE*`,
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
      {/* ================= HERO: DUAL-TANK WATER MANAGEMENT SYSTEM ================= */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-800/80 bg-[#0a0f1d] p-5 sm:p-8 text-white shadow-2xl backdrop-blur-md">
        {/* Telemetry Ambient Glows */}
        <div className="pointer-events-none absolute -top-32 left-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 right-10 h-96 w-96 rounded-full bg-teal-500/10 blur-3xl" />

        {/* ─── 1. Header Bar & Interactive Configuration Controls ─── */}
        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center justify-between gap-5 pb-6 border-b border-slate-800/80">
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
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-cyan-950/90 text-cyan-300 border border-cyan-500/30 shadow-[0_0_12px_rgba(6,182,212,0.3)]">
                  <span className="size-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  ● DUAL-RESERVOIR ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 font-medium">
                {isUrdu
                  ? 'چھت (OHT) اور زیرِ زمین (UGT) ٹینکس کا 13 روزہ سلسلہ وار ڈرین ماڈل اور کیڈنس مانیٹرنگ'
                  : 'Interconnected Overhead (OHT) & Underground (UGT) dual-tank sequential 13-day lifecycle model'}
              </p>
            </div>
          </div>

          {/* Configuration Controls: UGT, OHT Sizing & Supply Badges */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* UGT Size Toggle: 1,500G (Selected by default) vs 2,000G */}
            <div className="flex items-center p-1 rounded-2xl bg-[#0f172a]/90 border border-slate-800 shadow-inner">
              <span className="text-[10px] font-mono font-bold text-cyan-400 px-2 uppercase">UGT:</span>
              <button
                type="button"
                onClick={() => setUgtCap(1500)}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                  ugtCap === 1500
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="1,500 Gallons (Compact 8x6x6 ft) - Default"
              >
                1,500G
              </button>
              <button
                type="button"
                onClick={() => setUgtCap(2000)}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                  ugtCap === 2000
                    ? 'bg-cyan-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="2,000 Gallons (Standard 8x8x6 ft)"
              >
                2,000G
              </button>
            </div>

            {/* OHT Size Toggle: 600G (Selected by default) vs 750G */}
            <div className="flex items-center p-1 rounded-2xl bg-[#0f172a]/90 border border-slate-800 shadow-inner">
              <span className="text-[10px] font-mono font-bold text-emerald-400 px-2 uppercase">OHT:</span>
              <button
                type="button"
                onClick={() => setOhtCap(600)}
                className={`px-2.5 py-1 rounded-xl text-xs font-black transition-all ${
                  ohtCap === 600
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="600 Gallons (Standard) - Default"
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
                title="750 Gallons (Large)"
              >
                750G
              </button>
            </div>

            {/* Supply Mode Badges */}
            <div className="flex items-center gap-1 p-1 rounded-2xl bg-[#0f172a]/90 border border-slate-800">
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
                    : 'text-slate-400 hover:text-slate-200 border border-transparent hover:border-slate-700'
                }`}
              >
                <Truck size={13} />
                <span>Tanker</span>
              </button>
            </div>
          </div>
        </div>

        {/* ─── 2. Dual 3D Isometric Fluid Reservoir Visualization ─── */}
        <div className="relative z-10 pt-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Visualizer Canvas & Live Badges */}
            <div className="lg:col-span-6 flex flex-col items-center justify-center">
              <div className="relative w-full max-w-[520px] aspect-[520/350] rounded-3xl bg-[#060a14]/60 border border-slate-800/80 p-2 overflow-hidden flex items-center justify-center shadow-inner">
                {/* Background Grid Pattern */}
                <div className="absolute inset-0 [background-image:radial-gradient(rgba(6,182,212,0.08)_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

                {/* HTML5 Canvas Rendering Cylinders & Slosh Physics */}
                <canvas
                  ref={canvasRef}
                  className="w-full h-full block relative z-10 pointer-events-none"
                />

                {/* Live Badge: Roof Tank (OHT - Upper Right) */}
                <div className="absolute right-4 sm:right-6 top-3 sm:top-4 z-20 flex flex-col items-end pointer-events-none">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase text-emerald-400 mb-1">
                    <Home size={12} />
                    <span>Roof Tank (OHT)</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-xl bg-[#0a0f1d]/95 border border-emerald-500/40 text-[11px] font-mono font-black text-emerald-300 shadow-lg">
                    {ohtRemaining.toLocaleString()} / {ohtCap} Gal ({ohtPercent}%)
                  </div>
                </div>

                {/* Live Badge: Monoblock Suction Pump */}
                <div className="absolute left-[26%] sm:left-[27%] top-[54%] -translate-y-1/2 z-20 pointer-events-none">
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-mono font-bold shadow-md backdrop-blur-xs border ${
                    isPhase2
                      ? 'bg-cyan-950/90 border-cyan-400 text-cyan-200 animate-pulse'
                      : 'bg-slate-900/90 border-slate-700 text-slate-400'
                  }`}>
                    <Zap size={11} className={isPhase2 ? 'text-amber-400' : 'text-slate-500'} />
                    <span>{isPhase2 ? 'Monoblock (Pumping)' : 'Monoblock (Idle)'}</span>
                  </div>
                </div>

                {/* Live Badge: Underground Tank (UGT - Lower Left) */}
                <div className="absolute left-4 sm:left-6 bottom-3 sm:bottom-4 z-20 flex flex-col items-start pointer-events-none">
                  <div className="flex items-center gap-1 text-[10px] font-black uppercase text-cyan-400 mb-1">
                    <Waves size={12} />
                    <span>Underground Tank (UGT)</span>
                  </div>
                  <div className="px-2.5 py-1 rounded-xl bg-[#0a0f1d]/95 border border-cyan-500/40 text-[11px] font-mono font-black text-cyan-300 shadow-lg">
                    {ugtRemaining.toLocaleString()} / {ugtCap.toLocaleString()} Gal ({ugtPercent}%)
                  </div>
                </div>
              </div>
            </div>

            {/* ─── 3. Telemetry Metrics Cards Grid (4 Cards + Quick Transfer) ─── */}
            <div className="lg:col-span-6 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                
                {/* Metric 1: Combined Reserves Card */}
                <div className="p-4 rounded-2xl bg-[#0f172a]/70 border border-slate-800/80 shadow-sm backdrop-blur-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Combined Reserves
                    </span>
                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                      currentDay === 0
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : totalPercent < 20
                        ? 'bg-rose-950 text-rose-300 border border-rose-500/30 animate-pulse'
                        : 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                    }`}>
                      {currentDay === 0
                        ? '100% FULL (SUPPLY JUST ENDED)'
                        : totalPercent < 20
                        ? 'CRITICAL DEFICIT'
                        : 'DEPLETING'}
                    </span>
                  </div>

                  <div className="text-2xl sm:text-3xl font-black font-mono text-cyan-300">
                    {totalRemaining.toLocaleString()}{' '}
                    <span className="text-sm font-bold text-slate-400">/ {totalCapacity.toLocaleString()} Gal</span>
                  </div>

                  {/* Dual Segmented Breakdown Bar */}
                  <div className="w-full bg-slate-800 rounded-full h-2.5 mt-2.5 flex overflow-hidden p-0.5">
                    <motion.div
                      animate={{ width: `${(ugtRemaining / totalCapacity) * 100}%` }}
                      transition={{ duration: 0.4 }}
                      className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-l-full"
                      title={`UGT: ${ugtRemaining} Gal`}
                    />
                    <motion.div
                      animate={{ width: `${(ohtRemaining / totalCapacity) * 100}%` }}
                      transition={{ duration: 0.4 }}
                      className="h-full bg-gradient-to-r from-emerald-400 to-green-300 rounded-r-full"
                      title={`OHT: ${ohtRemaining} Gal`}
                    />
                  </div>

                  {/* Capacity Split Breakdown */}
                  <div className="flex items-center justify-between text-[10px] font-mono font-bold mt-1.5 text-slate-400">
                    <span className="text-cyan-400">UGT: {ugtRemaining.toLocaleString()}G</span>
                    <span className="text-emerald-400">OHT: {ohtRemaining.toLocaleString()}G</span>
                  </div>
                </div>

                {/* Metric 2: Burn Rate & Autonomy Card */}
                <div className="p-4 rounded-2xl bg-[#0f172a]/70 border border-slate-800/80 shadow-sm backdrop-blur-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Burn Rate & Autonomy
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
                    <span className={`text-[9px] font-black uppercase px-1.5 py-0.5 rounded ${
                      isPhase1
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                        : isPhase2
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/30'
                        : 'bg-rose-950 text-rose-300 border border-rose-500/30'
                    }`}>
                      {isPhase1
                        ? `PHASE 1: OHT DRAW (Days 0–${phase1Days})`
                        : isPhase2
                        ? `PHASE 2: UGT DRAW (Days ${phase1Days}–13.0)`
                        : 'RESERVES EMPTY'}
                    </span>
                  </div>
                </div>

                {/* Metric 3: Line Pressure / Inflow Sensor */}
                <div className="p-4 rounded-2xl bg-[#0f172a]/70 border border-slate-800/80 shadow-sm backdrop-blur-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Line Pressure / Inflow
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
                    Optimal Suction Flow
                  </span>
                </div>

                {/* Metric 4: Supply Status Card */}
                <div className="p-4 rounded-2xl bg-[#0f172a]/70 border border-slate-800/80 shadow-sm backdrop-blur-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                      Supply Status
                    </span>
                    <span className="text-[10px] font-bold text-slate-400 font-mono">
                      Sector 7D/1 Grid
                    </span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 size={22} className="text-emerald-400" />
                    <span>✓ Active Line</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400 mt-1 block">
                    KWSB Main Feeder Online
                  </span>
                </div>

              </div>

              {/* Overhead Roof Tank Transfer Log Strip */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#061e29]/40 border border-cyan-500/30">
                <div className="flex items-center gap-2.5">
                  <div className="size-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold">
                    <ArrowUpRight size={18} />
                  </div>
                  <div>
                    <h5 className="text-xs font-extrabold text-white">
                      Overhead Roof Tank Transfer Log
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      Default: 100 Gal morning batch to {ohtCap}-gallon roof tank
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowTransferModal(true)}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 text-xs font-black shadow-md shadow-cyan-500/20 transition-all active:scale-95"
                >
                  <Plus size={16} />
                  <span>+ Log Overhead Transfer</span>
                </button>
              </div>

            </div>
          </div>

          {/* ─── 4. Day Counter & Sequential Depletion Controller ─── */}
          <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-[#070b16] border border-slate-800 shadow-inner">
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
                    <span className="font-mono text-cyan-300 text-sm font-extrabold bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-500/30">
                      Day {currentDay} / 13.0
                    </span>
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Sequential Drain Rule: Roof Tank (OHT) empties first (Days 0–3), then Underground Tank drains (Days 3–13).
                  </p>
                </div>
              </div>

              {/* Quick Select Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => { setIsPlaying(false); setCurrentDay(0) }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    currentDay === 0 ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-850 text-slate-400 hover:text-white bg-slate-800'
                  }`}
                >
                  Day 0 (Full)
                </button>
                <button
                  type="button"
                  onClick={() => { setIsPlaying(false); setCurrentDay(2) }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    currentDay === 2 ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Day 2 (OHT Low)
                </button>
                <button
                  type="button"
                  onClick={() => { setIsPlaying(false); setCurrentDay(phase1Days) }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    currentDay === phase1Days ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Day 3 (OHT Empty)
                </button>
                <button
                  type="button"
                  onClick={() => { setIsPlaying(false); setCurrentDay(8) }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    currentDay === 8 ? 'bg-cyan-500 text-slate-950 font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Day 8 (UGT 50%)
                </button>
                <button
                  type="button"
                  onClick={() => { setIsPlaying(false); setCurrentDay(13) }}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
                    currentDay === 13 ? 'bg-rose-500 text-white font-black' : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  Day 13 (Empty)
                </button>
              </div>
            </div>

            {/* Smooth Scrubber Slider */}
            <input
              type="range"
              min="0"
              max="13"
              step="0.1"
              value={currentDay}
              onChange={(e) => {
                setIsPlaying(false)
                setCurrentDay(parseFloat(e.target.value))
              }}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />

            {/* Slider Ticks */}
            <div className="flex justify-between text-[9px] font-mono text-slate-500 mt-1 px-1">
              <span>Day 0 (Full - {totalCapacity}G)</span>
              <span>Day 3</span>
              <span>Day 6</span>
              <span>Day 9</span>
              <span className="text-rose-400">Day 13 (0G Empty)</span>
            </div>
          </div>
        </div>

        {/* ─── 5. Municipal Cadence Gap & Water Deficit Banner ─── */}
        <div className="relative z-10 mt-6 p-4 sm:p-5 rounded-2xl bg-amber-950/20 border border-amber-500/40 text-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg backdrop-blur-xs">
          <div className="flex items-start gap-3">
            <div className="size-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center flex-shrink-0 mt-0.5">
              <AlertTriangle size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs font-black uppercase tracking-wider text-amber-300">
                  ⚠ WATER DEFICIT EXPECTED • KARACHI MUNICIPAL CADENCE GAP
                </span>
                <span className="text-[10px] font-mono font-bold bg-amber-900/60 text-amber-200 px-2 py-0.5 rounded border border-amber-400/30">
                  3.7 Days Deficit
                </span>
              </div>
              <p className="text-xs text-slate-200 mt-1.5 leading-relaxed">
                Reserves will run out ~3.7 days before the next municipal line arrives (Supply cadence: Every ~16.7 Days vs Reserve span: 13 Days Maximum).
                {' '}Ration consumption to <strong className="text-emerald-300 font-mono font-extrabold">{rationRate} Gal/Day</strong> to stretch supply across the full 16.7-day cycle.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto flex-shrink-0 bg-[#0a0f1d]/80 px-3.5 py-2 rounded-xl border border-amber-500/30">
            <div className="text-right font-mono">
              <div className="text-[9px] text-slate-400 uppercase font-bold">TARGET RATION</div>
              <div className="text-sm font-black text-emerald-300">{rationRate} Gal/Day</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── 6. Next Water Supply Forecast (Predictive Cadence Model) ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white p-6 md:p-8 rounded-3xl shadow-xl border border-indigo-500/20">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-6">
          <div className="flex items-center gap-3">
            <div className="size-11 sm:size-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-500/30 flex-shrink-0">
              <Sparkles size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-lg md:text-xl font-black text-white tracking-tight">
                  Next Water Supply Forecast (Predictive Cadence Model)
                </h4>
                <span className="text-[11px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30 px-2.5 py-0.5 rounded-full">
                  Machine Learning Engine
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Automated predictive analysis based on historical Karachi KWSB cycles & pressure telemetry
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

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Expected Window */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-sm">
            <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-2">
              <Calendar size={14} />
              <span>Expected Window</span>
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
              <span>Forecasted Duration</span>
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
              <span>Supply Interval</span>
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
              <span>Consistency Score</span>
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

        {/* Footer Verdict Banner */}
        <div className="mt-5 p-4 rounded-2xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start sm:items-center gap-3">
            <div className="size-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold flex-shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div className="text-xs text-slate-200 leading-relaxed">
              <strong className="text-emerald-300 font-extrabold mr-1">
                Autonomy Verdict:
              </strong>
              Dual reservoirs provide ~13.0 Days of autonomy at current burn rate of {dailyBurnRate} Gal/Day.
            </div>
          </div>

          <span className="text-[11px] font-black uppercase text-emerald-300 bg-emerald-900/60 px-3 py-1 rounded-xl border border-emerald-400/30 whitespace-nowrap self-start sm:self-auto">
            DUAL STORAGE CALIBRATED
          </span>
        </div>
      </div>

      {/* ─── 7. Recorded Municipal Supply History ─── */}
      <div className="bg-[#0f172a]/70 p-5 sm:p-6 rounded-3xl border border-slate-800/80 text-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <h4 className="text-base sm:text-lg font-bold text-slate-100 flex items-center gap-2">
            <Droplet className="text-cyan-400" size={18} />
            <span>Recorded Municipal Supply History</span>
          </h4>
          <span className="text-xs bg-slate-800 text-cyan-300 font-extrabold px-3 py-1 rounded-full uppercase tracking-wider w-fit">
            {processedEntries.length} {processedEntries.length === 1 ? 'PERIOD RECORDED' : 'PERIODS RECORDED'}
          </span>
        </div>

        <div className="space-y-3">
          {processedEntries.map((entry, index) => (
            <div
              key={entry.id || index}
              className="grid grid-cols-1 md:grid-cols-3 gap-3.5 bg-[#0a0f1d]/80 p-3.5 rounded-2xl border border-slate-800/90 text-xs"
            >
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  Start Date & Time ({entry.label || `Supply Period ${index + 1}`})
                </span>
                <p className="font-extrabold text-sm sm:text-base text-white font-mono">
                  {formatDateTimeLocalized(entry.start, lang)}
                </p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-0.5">
                  End Date & Time ({entry.label || `Supply Period ${index + 1}`})
                </span>
                <p className="font-extrabold text-sm sm:text-base text-white font-mono">
                  {formatDateTimeLocalized(entry.end, lang)}
                </p>
              </div>
              <div className="bg-cyan-950/30 px-3 py-2 rounded-xl border border-cyan-500/20">
                <span className="text-[10px] font-extrabold text-cyan-400 uppercase tracking-wider block mb-0.5">
                  Duration
                </span>
                {entry.duration ? (
                  <>
                    <p className="font-extrabold text-cyan-200 text-xs sm:text-sm">
                      {`${entry.duration.days}d ${entry.duration.hours}h ${entry.duration.minutes}m`}
                    </p>
                    <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                      {entry.duration.totalHours} hours total (~{entry.duration.totalHoursDecimal} hrs)
                    </p>
                  </>
                ) : (
                  <p className="text-xs text-slate-500 font-bold">Pending...</p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── 8. Pumping Transfer Log Modal ─── */}
      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ scale: 0.94, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.94, opacity: 0, y: 16 }}
              className="w-full max-w-lg bg-[#0f172a] border border-slate-800 rounded-3xl p-6 text-white shadow-2xl relative"
            >
              {/* Modal Header */}
              <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                    <ArrowUpRight size={18} />
                  </div>
                  <div>
                    <h4 className="text-base font-black">
                      Overhead Tank Pumping Transfer
                    </h4>
                    <p className="text-xs text-slate-400">
                      Transfer batch from underground reservoir to {ohtCap}-Gal roof tank
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
                    <span>Transfer batch successfully recorded!</span>
                  </div>
                ) : (
                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-500 hover:from-cyan-400 hover:to-teal-400 text-slate-950 font-black text-xs sm:text-sm shadow-md transition-all active:scale-95"
                  >
                    Confirm 100-Gal Pumping Transfer
                  </button>
                )}
              </form>

              {/* Recent Transfers List */}
              <div className="mt-5 pt-4 border-t border-slate-800">
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
                  Recent Pumping Cycles
                </span>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {transferLogs.map((log) => (
                    <div
                      key={log.id}
                      className="p-2.5 rounded-xl bg-[#070b16] border border-slate-800/80 flex items-center justify-between text-xs"
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
    </div>
  )
}

import React, { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, useSpring, useTransform, useReducedMotion } from 'framer-motion'
import { AlertTriangle, Sparkles, Volume2, VolumeX, RotateCw } from 'lucide-react'
import { soundEffects } from '../utils/soundEffects'
import RollingOdometer from './RollingOdometer'
import { useLanguage } from '../context/LanguageContext'

export default function DynamicAlertBanner({
  netCashFlow = 0,
  currency = 'PKR',
  customNote = '',
  isNoData = false
}) {
  const { lang } = useLanguage ? useLanguage() : { lang: 'en' }
  const isUrdu = lang === 'ur'
  const shouldReduceMotion = useReducedMotion()

  const [isMuted, setIsMuted] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('dashboard_sound_muted') === 'true'
    }
    return false
  })

  const prevNetRef = useRef(null)
  const cardRef = useRef(null)

  const isDeficit = Number(netCashFlow) < 0
  const absFormatted = Number(Math.abs(netCashFlow || 0)).toLocaleString('en-PK')

  // 3D Perspective Tilt Physics
  const mouseX = useMotionValue(0)
  const mouseY = useMotionValue(0)

  const springConfig = { damping: 24, stiffness: 200, mass: 0.35 }
  const smoothX = useSpring(mouseX, springConfig)
  const smoothY = useSpring(mouseY, springConfig)

  const rotateX = useTransform(smoothY, [-0.5, 0.5], [5, -5])
  const rotateY = useTransform(smoothX, [-0.5, 0.5], [-5, 5])

  // Automatic crowd reaction sound on net cash flow change
  useEffect(() => {
    if (isNoData) return

    if (prevNetRef.current !== null && prevNetRef.current !== netCashFlow) {
      if (isDeficit) {
        soundEffects.playDeficitReaction(isUrdu)
      } else {
        soundEffects.playSurplusReaction(isUrdu)
      }
    }
    prevNetRef.current = netCashFlow
  }, [netCashFlow, isDeficit, isNoData, isUrdu])

  if (isNoData) return null

  const handlePointerMove = (e) => {
    if (shouldReduceMotion || !cardRef.current) return
    const rect = cardRef.current.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    mouseX.set((e.clientX - rect.left) / rect.width - 0.5)
    mouseY.set((e.clientY - rect.top) / rect.height - 0.5)
  }

  const handlePointerLeave = () => {
    mouseX.set(0)
    mouseY.set(0)
  }

  const handlePlayReaction = (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
    if (isDeficit) {
      soundEffects.playDeficitReaction(isUrdu)
    } else {
      soundEffects.playSurplusReaction(isUrdu)
    }
  }

  const toggleSound = (e) => {
    if (e && typeof e.stopPropagation === 'function') e.stopPropagation()
    const next = soundEffects.toggleMute()
    setIsMuted(next)
    if (!next) {
      handlePlayReaction()
    }
  }

  const defaultUrdu = isDeficit
    ? 'اس ماہ اخراجات کلیکشن سے تجاوز کر گئے۔ بقایا جات کی بروقت ادائیگی یقینی بنائیں۔'
    : 'اس ماہ کا سرپلس ریونیو ریزرو فنڈ میں جمع کر دیا گیا ہے۔'

  return (
    <div
      style={{ perspective: 1200 }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
      className="w-full my-6 select-none [touch-action:pan-y]"
    >
      <motion.div
        ref={cardRef}
        initial={shouldReduceMotion ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 24, stiffness: 220 }}
        style={{
          rotateX: shouldReduceMotion ? 0 : rotateX,
          rotateY: shouldReduceMotion ? 0 : rotateY,
          transformStyle: 'preserve-3d',
        }}
        whileHover={shouldReduceMotion ? {} : { scale: 1.008 }}
        className={`relative overflow-hidden rounded-3xl p-5 sm:p-7 border-2 backdrop-blur-xl transition-shadow duration-300 shadow-xl will-change-transform ${
          isDeficit
            ? 'bg-gradient-to-br from-amber-50/95 via-white/90 to-amber-100/60 dark:from-amber-950/40 dark:via-slate-900/90 dark:to-slate-950 border-amber-300/80 dark:border-amber-700/70 shadow-amber-500/10'
            : 'bg-gradient-to-br from-emerald-50/95 via-white/90 to-emerald-100/60 dark:from-emerald-950/40 dark:via-slate-900/90 dark:to-slate-950 border-emerald-300/80 dark:border-emerald-700/70 shadow-emerald-500/10'
        }`}
      >
        {/* Ambient Top Glow */}
        <div
          className={`pointer-events-none absolute -top-16 -right-16 size-48 rounded-full blur-3xl opacity-35 ${
            isDeficit ? 'bg-amber-400 dark:bg-amber-600' : 'bg-emerald-400 dark:bg-emerald-600'
          }`}
        />

        {/* Content Container (Razor-sharp anti-rasterization layer) */}
        <div
          style={{
            transform: 'translateZ(1px)',
            WebkitFontSmoothing: 'antialiased',
            MozOsxFontSmoothing: 'grayscale',
            textRendering: 'geometricPrecision',
          }}
          className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5"
        >
          {/* Left Side: Icon & Notice */}
          <div className="flex items-start sm:items-center gap-4 flex-1">
            <motion.div
              whileHover={shouldReduceMotion ? {} : { rotate: isDeficit ? -8 : 8, scale: 1.08 }}
              transition={{ type: 'spring', damping: 16, stiffness: 300 }}
              onClick={handlePlayReaction}
              className={`size-12 sm:size-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md cursor-pointer ${
                isDeficit
                  ? 'bg-amber-500 text-white shadow-amber-500/30'
                  : 'bg-emerald-600 text-white shadow-emerald-600/30'
              }`}
              title="Tap to hear reaction sound"
            >
              {isDeficit ? <AlertTriangle size={26} className="stroke-[2.5]" /> : <Sparkles size={26} />}
            </motion.div>

            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span
                  className={`text-xs sm:text-sm font-black uppercase tracking-wider px-3 py-1 rounded-full border-2 shadow-2xs ${
                    isDeficit
                      ? 'bg-amber-100 dark:bg-amber-900/60 text-amber-900 dark:text-amber-200 border-amber-300 dark:border-amber-700'
                      : 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-900 dark:text-emerald-200 border-emerald-300 dark:border-emerald-700'
                  }`}
                >
                  {isDeficit ? (isUrdu ? '⚠️ کیش فلو انتباہ' : '⚠️ Cash Flow Alert') : (isUrdu ? '✅ خزانہ اسٹیٹس' : '✅ Treasury Status')}
                </span>

                <span className="text-sm sm:text-base font-black text-slate-900 dark:text-slate-100">
                  {isDeficit ? (isUrdu ? 'خسارہ نوٹس' : 'Deficit Notice') : (isUrdu ? 'سرپلس منتقل' : 'Surplus Transferred')}
                </span>

                {/* Interactive Crowd Audio Replay Pill */}
                <button
                  type="button"
                  onClick={handlePlayReaction}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-extrabold border transition-all active:scale-95 shadow-xs ${
                    isDeficit
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/25'
                      : 'bg-emerald-500/15 border-emerald-500/40 text-emerald-800 dark:text-emerald-300 hover:bg-emerald-500/25'
                  }`}
                  title="Replay crowd audio reaction"
                >
                  <span>{isDeficit ? (isUrdu ? "🚀 بہتری کی طرف!" : "🚀 Let's Do Better!") : (isUrdu ? "👏 شاندار!" : "👏 Outstanding!")}</span>
                  <RotateCw size={11} className="opacity-70" />
                </button>

                {/* Mute/Unmute Quick Toggle */}
                <button
                  type="button"
                  onClick={toggleSound}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
                  title={isMuted ? 'Unmute sounds' : 'Mute sounds'}
                >
                  {isMuted ? <VolumeX size={15} /> : <Volume2 size={15} />}
                </button>
              </div>

              {/* Dynamic Notice with Rolling Odometer */}
              {isUrdu ? (
                <div
                  dir="rtl"
                  className={`text-sm sm:text-base md:text-lg font-black leading-snug tracking-tight flex items-baseline gap-2 flex-wrap font-urdu ${
                    isDeficit ? 'text-amber-950 dark:text-amber-100' : 'text-emerald-950 dark:text-emerald-100'
                  }`}
                >
                  <span>
                    {isDeficit ? 'اس ماہ اخراجات کلیکشن سے ' : 'اس ماہ کا سرپلس ریونیو '}
                  </span>
                  <RollingOdometer
                    value={absFormatted}
                    prefix="روپے"
                    className="font-black text-inherit"
                  />
                  <span>
                    {isDeficit ? ' تجاوز کر گئے۔ بقایا جات کی ادائیگی یقینی بنائیں۔' : ' محفوظ فنڈ میں منتقل کر دیا گیا۔'}
                  </span>
                </div>
              ) : (
                <div
                  dir="ltr"
                  style={{ direction: 'ltr' }}
                  className={`text-sm sm:text-base md:text-lg font-black leading-snug tracking-tight flex items-baseline gap-1.5 flex-wrap ${
                    isDeficit ? 'text-amber-950 dark:text-amber-100' : 'text-emerald-950 dark:text-emerald-100'
                  }`}
                >
                  <span>
                    {isDeficit ? 'Expenses exceeded collections by' : 'Operating surplus of'}
                  </span>
                  <RollingOdometer
                    value={absFormatted}
                    prefix={currency}
                    className="font-black text-inherit"
                  />
                  <span>
                    {isDeficit ? '. Prompt dues clearance requested.' : ' retained in community reserves.'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Side: Translation Notice */}
          <div
            className={`border-t md:border-t-0 ${isUrdu ? 'md:border-r md:pr-6 text-left' : 'md:border-l md:pl-6 text-right'} ${
              isDeficit ? 'border-amber-200 dark:border-amber-800/60' : 'border-emerald-200 dark:border-emerald-800/60'
            } pt-3 md:pt-0 flex-1`}
          >
            <p
              dir={isUrdu ? 'ltr' : 'rtl'}
              className={`text-sm sm:text-base md:text-lg font-bold leading-relaxed ${
                isUrdu ? 'font-sans' : 'font-urdu'
              } ${
                isDeficit ? 'text-amber-900/80 dark:text-amber-200/80' : 'text-emerald-900/80 dark:text-emerald-200/80'
              }`}
            >
              {isUrdu
                ? (isDeficit
                    ? `Net Deficit: ${currency} ${absFormatted} — Operating gap recorded.`
                    : `Net Surplus: ${currency} ${absFormatted} — Added to reserve fund.`)
                : defaultUrdu}
            </p>
            {customNote && customNote !== defaultUrdu && (
              <p className="text-xs sm:text-sm md:text-base font-bold text-slate-700 dark:text-slate-200 mt-2 font-urdu leading-relaxed">
                {customNote}
              </p>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}
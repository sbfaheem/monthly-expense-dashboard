import React, { useState, useEffect } from 'react'
import { Calendar, ChevronLeft, ChevronRight, Volume2, VolumeX } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'
import { URDU_MONTHS } from '../utils/translations'
import { soundEffects } from '../utils/soundEffects'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const Header = ({ selectedMonth, selectedYear, onMonthChange, onYearChange, isAdmin, title }) => {
  const { lang, t, isRtl } = useLanguage()
  const currentDate = new Date()

  // ─── Universal Sound Reactions Setting Sync ───
  const [soundEnabled, setSoundEnabled] = useState(!soundEffects.isMuted())

  useEffect(() => {
    const handleToggle = (e) => {
      if (e?.detail) {
        setSoundEnabled(!e.detail.isMuted)
      }
    }
    window.addEventListener('dashboard_sound_toggle', handleToggle)
    return () => window.removeEventListener('dashboard_sound_toggle', handleToggle)
  }, [])

  const toggleSound = () => {
    const nextMuted = soundEffects.toggleMute()
    setSoundEnabled(!nextMuted)
  }

  const years = []
  for (let y = 2024; y <= 2030; y++) years.push(y)

  const goToPrev = () => {
    const monthIdx = MONTHS.indexOf(selectedMonth)
    if (monthIdx === 0) {
      onMonthChange(MONTHS[11])
      onYearChange(selectedYear - 1)
    } else {
      onMonthChange(MONTHS[monthIdx - 1])
    }
  }

  const goToNext = () => {
    const monthIdx = MONTHS.indexOf(selectedMonth)
    if (monthIdx === 11) {
      onMonthChange(MONTHS[0])
      onYearChange(selectedYear + 1)
    } else {
      onMonthChange(MONTHS[monthIdx + 1])
    }
  }

  const goToCurrent = () => {
    onMonthChange(MONTHS[currentDate.getMonth()])
    onYearChange(currentDate.getFullYear())
  }

  const isUrdu = lang === 'ur'
  const monthDisplay = isUrdu
    ? (URDU_MONTHS[selectedMonth] || selectedMonth)
    : selectedMonth?.substring(0, 3).toUpperCase()

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6">
      {/* Title & Subtitle */}
      <div className="space-y-1.5 min-w-0">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
          {title ? (
            title
          ) : (
            <>
              {t.appTitle || (isUrdu ? 'ماہانہ اخراجات شیٹ' : 'MONTHLY EXPENSE SHEET')}{' '}
              <span className="text-primary whitespace-nowrap">– {monthDisplay} {selectedYear}</span>
            </>
          )}
        </h1>
        <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm font-medium">
          {isUrdu
            ? 'موجودہ بلنگ سائیکل کا تفصیلی مالیاتی جائزہ۔'
            : 'Detailed financial overview for the current billing cycle.'}
        </p>
      </div>

      {/* Controls: Sound Toggle, Date Dropdowns & Action Buttons */}
      <div className="flex items-center gap-2 sm:gap-2.5 overflow-x-auto no-scrollbar py-1 max-w-full flex-nowrap shrink-0">
        
        {/* Universal Sound Reaction Setting Toggle Button */}
        <button
          type="button"
          onClick={toggleSound}
          className={`h-10 px-2.5 sm:px-3 flex items-center gap-1.5 rounded-xl border transition-all text-xs sm:text-sm font-bold shadow-sm shrink-0 cursor-pointer ${
            soundEnabled
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700/70 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100'
              : 'bg-white dark:bg-slate-800 border-primary/20 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
          title={
            soundEnabled
              ? (isUrdu ? 'ردعمل کی آواز بند کریں' : 'Mute Crowd Reactions')
              : (isUrdu ? 'ردعمل کی آواز فعال کریں' : 'Enable Crowd Reactions')
          }
          aria-label="Toggle Sound Reactions"
        >
          {soundEnabled ? (
            <>
              <Volume2 size={16} className="text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline text-xs font-black">
                {isUrdu ? 'آواز' : 'Audio'}
              </span>
            </>
          ) : (
            <>
              <VolumeX size={16} className="text-slate-400" />
              <span className="hidden sm:inline text-xs font-black text-slate-400">
                {isUrdu ? 'بند' : 'Muted'}
              </span>
            </>
          )}
        </button>

        {/* Month/Year Dropdowns */}
        <div className="flex items-center border border-primary/20 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm h-10 shrink-0 relative z-20">
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
            className="w-[88px] sm:w-auto px-2 sm:px-3 py-2 text-xs sm:text-sm font-bold bg-transparent text-slate-700 dark:text-slate-300 outline-none border-none cursor-pointer text-center"
          >
            {MONTHS.map((m) => (
              <option key={m} value={m} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                {isUrdu ? URDU_MONTHS[m] || m : m}
              </option>
            ))}
          </select>
          <div className="w-px h-full bg-primary/10" />
          <select
            value={selectedYear}
            onChange={(e) => onYearChange(Number(e.target.value))}
            className="w-[66px] sm:w-auto px-2 sm:px-3 py-2 text-xs sm:text-sm font-bold bg-transparent text-slate-700 dark:text-slate-300 outline-none border-none cursor-pointer text-center"
          >
            {years.map((y) => (
              <option key={y} value={y} className="bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                {y}
              </option>
            ))}
          </select>
        </div>

        {/* Action Buttons: Prev, Current, Next */}
        <div className="flex items-center border border-primary/20 rounded-xl overflow-hidden bg-white dark:bg-slate-800 shadow-sm h-10 shrink-0">
          <button
            type="button"
            className="px-2.5 sm:px-3.5 h-full flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-primary/5 transition-colors"
            onClick={goToPrev}
            title={isUrdu ? 'پچھلا مہینہ' : 'Previous Month'}
          >
            <ChevronLeft size={15} /> <span>{isUrdu ? 'گزشتہ' : 'Prev'}</span>
          </button>
          <div className="w-px h-full bg-primary/10" />
          <button
            type="button"
            className="px-2.5 sm:px-3.5 h-full flex items-center gap-1 text-xs sm:text-sm font-bold bg-primary text-white hover:bg-primary/90 transition-colors"
            onClick={goToCurrent}
            title={isUrdu ? 'موجودہ مہینہ' : 'Current Month'}
          >
            <Calendar size={13} /> <span>{isUrdu ? 'موجودہ' : 'Current'}</span>
          </button>
          <div className="w-px h-full bg-primary/10" />
          <button
            type="button"
            className="px-2.5 sm:px-3.5 h-full flex items-center gap-1 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300 hover:text-primary hover:bg-primary/5 transition-colors"
            onClick={goToNext}
            title={isUrdu ? 'اگلا مہینہ' : 'Next Month'}
          >
            <span>{isUrdu ? 'اگلا' : 'Next'}</span> <ChevronRight size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}

export default Header
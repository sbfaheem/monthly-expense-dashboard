import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'
import './Header.css'

const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December']

const Header = ({ selectedMonth, selectedYear, onMonthChange, onYearChange, isAdmin, title }) => {
  const currentDate = new Date()
  const isEndOfMonth = () => {
    const lastDay = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate()
    return currentDate.getDate() === lastDay
  }

  const years = []
  for (let y = 2024; y <= 2030; y++) years.push(y)

  const goToPrev = () => {
    const monthIdx = MONTHS.indexOf(selectedMonth)
    if (monthIdx === 0) { onMonthChange(MONTHS[11]); onYearChange(selectedYear - 1) }
    else onMonthChange(MONTHS[monthIdx - 1])
  }

  const goToCurrent = () => {
    onMonthChange(MONTHS[currentDate.getMonth()])
    onYearChange(currentDate.getFullYear())
  }

  const monthShort = selectedMonth?.substring(0, 3).toUpperCase()

  return (
    <header className="site-header">
      <div className="header-left">
        <div className="header-icon"><Calendar size={22} /></div>
        <div>
          <h1 className="header-title">
            {isEndOfMonth() && !isAdmin
              ? `Monthly Expense Sheet – ${monthShort} ${selectedYear}`
              : title || `Monthly Expense Sheet – ${monthShort} ${selectedYear}`}
          </h1>
          <p className="header-subtitle">Manage and track your monthly financial health</p>
        </div>
      </div>
      <div className="header-controls">
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap' }}>
          <div className="selector-group">
            <label>MONTH</label>
            <select value={selectedMonth} onChange={e => onMonthChange(e.target.value)}>
              {MONTHS.map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          <div className="selector-group">
            <label>YEAR</label>
            <select value={selectedYear} onChange={e => onYearChange(Number(e.target.value))}>
              {years.map(y => <option key={y}>{y}</option>)}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'nowrap', marginTop: 'auto' }}>
          <button className="btn-outline" onClick={goToPrev}><ChevronLeft size={16}/> Previous</button>
          <button className="btn-primary" onClick={goToCurrent}><Calendar size={16}/> Current</button>
        </div>
      </div>
    </header>
  )
}

export default Header

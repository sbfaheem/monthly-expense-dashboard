import { supabase } from './supabase'

// ─── Helpers ────────────────────────────────────────────────

export const getMonthYear = (dateString) => {
  // Parse date parts directly to avoid UTC timezone shift.
  // new Date('YYYY-MM-DD') is UTC midnight — in UTC+5 (Pakistan) that
  // shifts March 1 back to Feb 28. Local construction avoids this.
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export const getLastDataMonth = (data) => {
  if (data.monthlyRecords && data.monthlyRecords.length > 0) {
    const sorted = [...data.monthlyRecords].sort((a, b) => new Date(b.month) - new Date(a.month))
    const parts = sorted[0].month.split(' ')
    return { month: parts[0], year: Number(parts[1]) }
  }
  const now = new Date()
  const [m, y] = now.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).split(' ')
  return { month: m, year: Number(y) }
}

export const calculateTotals = (expenses, settings, monthlyRecords, selectedMonth) => {
  const monthlyExpenses = expenses.filter(e => e.month === selectedMonth)
  const totalExpense = monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const monthRecord = monthlyRecords.find(r => r.month === selectedMonth)
  const isNoData = !monthRecord && monthlyExpenses.length === 0
  
  const record = monthRecord || {
    openingBalance: 0,
    monthlyCollection: 0,
    isManualSaving: false,
    manualSaving: 0,
  }

  const saving = record.isManualSaving
    ? Number(record.manualSaving)
    : Number(record.monthlyCollection) - totalExpense

  const totalSaving = isNoData 
    ? 0 
    : Number(record.openingBalance) + saving - (settings.showCctvExpense ? settings.cctvExpense || 0 : 0)

  return { totalExpense, saving, totalSaving, record: { ...record, isNoData } }
}

// ─── Map DB row → app shape ──────────────────────────────────

const toSettings = (row) => ({
  currency: row.currency,
  cctvExpense: Number(row.cctv_expense),
  showCctvExpense: row.show_cctv_expense,
  defaultOpeningBalance: Number(row.default_opening_balance),
  defaultMonthlyCollection: Number(row.default_monthly_collection),
})

const toMonthlyRecord = (row) => ({
  id: row.id,
  month: row.month,
  openingBalance: Number(row.opening_balance),
  monthlyCollection: Number(row.monthly_collection),
  isManualSaving: row.is_manual_saving,
  manualSaving: Number(row.manual_saving),
})

const toExpense = (row) => ({
  id: row.id,
  date: row.date,
  month: row.month,
  category: row.category,
  name: row.name,
  amount: Number(row.amount),
  description: row.description || '',
})

// ─── Load all data ───────────────────────────────────────────

export const loadData = async () => {
  const [settingsRes, recordsRes, expensesRes] = await Promise.all([
    supabase.from('settings').select('*').eq('id', 1).single(),
    supabase.from('monthly_records').select('*').order('created_at', { ascending: true }),
    supabase.from('expenses').select('*').order('date', { ascending: true }),
  ])

  // Default settings in case the row doesn't exist yet
  const defaultSettings = {
    currency: 'PKR',
    cctvExpense: 38800,
    showCctvExpense: true,
    defaultOpeningBalance: 50400,
    defaultMonthlyCollection: 284750,
  }

  return {
    settings: settingsRes.data ? toSettings(settingsRes.data) : defaultSettings,
    monthlyRecords: (recordsRes.data || []).map(toMonthlyRecord),
    expenses: (expensesRes.data || []).map(toExpense),
  }
}

// ─── Settings ────────────────────────────────────────────────

export const updateSettings = async (newSettings) => {
  const { error } = await supabase.from('settings').upsert({
    id: 1,
    currency: newSettings.currency,
    cctv_expense: newSettings.cctvExpense,
    show_cctv_expense: newSettings.showCctvExpense,
    default_opening_balance: newSettings.defaultOpeningBalance,
    default_monthly_collection: newSettings.defaultMonthlyCollection,
  })
  if (error) throw error
  return loadData()
}

// ─── Monthly Records CRUD ────────────────────────────────────

export const addMonthlyRecord = async (record) => {
  const { error } = await supabase.from('monthly_records').insert({
    month: record.month,
    opening_balance: record.openingBalance,
    monthly_collection: record.monthlyCollection,
    is_manual_saving: record.isManualSaving || false,
    manual_saving: record.manualSaving || 0,
  })
  if (error) throw error
  return loadData()
}

export const updateMonthlyRecord = async (record) => {
  const { error } = await supabase.from('monthly_records').update({
    month: record.month,
    opening_balance: record.openingBalance,
    monthly_collection: record.monthlyCollection,
    is_manual_saving: record.isManualSaving || false,
    manual_saving: record.manualSaving || 0,
  }).eq('id', record.id)
  if (error) throw error
  return loadData()
}

export const deleteMonthlyRecord = async (id) => {
  const { error } = await supabase.from('monthly_records').delete().eq('id', id)
  if (error) throw error
  return loadData()
}

// ─── Expenses CRUD ───────────────────────────────────────────

export const addExpense = async (expense) => {
  const { error } = await supabase.from('expenses').insert({
    date: expense.date,
    month: getMonthYear(expense.date),
    category: expense.category,
    name: expense.name,
    amount: expense.amount,
    description: expense.description || '',
  })
  if (error) throw error
  return loadData()
}

export const updateExpense = async (expense) => {
  const { error } = await supabase.from('expenses').update({
    date: expense.date,
    month: getMonthYear(expense.date),
    category: expense.category,
    name: expense.name,
    amount: expense.amount,
    description: expense.description || '',
  }).eq('id', expense.id)
  if (error) throw error
  return loadData()
}

export const deleteExpense = async (id) => {
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) throw error
  return loadData()
}

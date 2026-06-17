import { db } from './firebase'
import { collection, doc, getDoc, getDocs, query, orderBy, setDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore'

// ─── Helpers ────────────────────────────────────────────────

export const getMonthYear = (dateString) => {
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
  const [selMonthName, selYearStr] = selectedMonth.split(' ')
  const selYear = Number(selYearStr)
  
  const today = new Date()
  const curMonthName = today.toLocaleDateString('en-US', { month: 'long' })
  const curYear = today.getFullYear()
  const lastDayOfMonth = new Date(curYear, today.getMonth() + 1, 0).getDate()
  
  const isCurrentMonth = selMonthName === curMonthName && selYear === curYear
  const isPendingCurrentMonth = isCurrentMonth && today.getDate() !== lastDayOfMonth

  const monthlyExpenses = expenses.filter(e => e.month === selectedMonth)
  const totalExpense = isPendingCurrentMonth ? 0 : monthlyExpenses.reduce((sum, e) => sum + Number(e.amount), 0)

  const monthRecord = monthlyRecords.find(r => r.month === selectedMonth)
  const isNoData = isPendingCurrentMonth || (!monthRecord && monthlyExpenses.length === 0)
  
  const record = (isPendingCurrentMonth || !monthRecord) ? {
    openingBalance: 0,
    monthlyCollection: 0,
    isManualSaving: false,
    manualSaving: 0,
    cctvExpense: 0,
    showCctvExpense: false,
  } : monthRecord

  const saving = record.isManualSaving
    ? Number(record.manualSaving)
    : Number(record.monthlyCollection) - totalExpense

  const totalSaving = isNoData 
    ? 0 
    : Number(record.openingBalance) + saving - (record.showCctvExpense ? record.cctvExpense || 0 : 0)

  return { totalExpense, saving, totalSaving, record: { ...record, isNoData } }
}

// ─── Load all data ───────────────────────────────────────────

export const loadData = async () => {
  const settingsDocRef = doc(db, 'settings', '1')
  const settingsDocPromise = getDoc(settingsDocRef)

  const recordsCol = collection(db, 'monthly_records')
  const recordsQuery = query(recordsCol, orderBy('createdAt', 'asc'))
  const recordsPromise = getDocs(recordsQuery)

  const expensesCol = collection(db, 'expenses')
  const expensesQuery = query(expensesCol, orderBy('date', 'asc'))
  const expensesPromise = getDocs(expensesQuery)

  const [settingsDoc, recordsSnapshot, expensesSnapshot] = await Promise.all([
    settingsDocPromise,
    recordsPromise,
    expensesPromise
  ]).catch(err => {
    console.error("Firebase data load error:", err)
    return [null, null, null]
  })

  let settings = {
    currency: 'PKR',
    cctvExpense: 38800,
    showCctvExpense: true,
    defaultOpeningBalance: 50400,
    defaultMonthlyCollection: 284750,
    waterSupplyStart: '',
    waterSupplyEnd: '',
  }

  if (settingsDoc && settingsDoc.exists()) {
    const data = settingsDoc.data()
    settings = {
      ...settings,
      currency: data.currency || settings.currency,
      defaultOpeningBalance: Number(data.defaultOpeningBalance || settings.defaultOpeningBalance),
      defaultMonthlyCollection: Number(data.defaultMonthlyCollection || settings.defaultMonthlyCollection),
      waterSupplyStart: data.waterSupplyStart || '',
      waterSupplyEnd: data.waterSupplyEnd || '',
    }
  }

  const monthlyRecords = recordsSnapshot ? recordsSnapshot.docs.map(d => {
    const data = d.data()
    return {
      id: d.id,
      month: data.month,
      openingBalance: Number(data.openingBalance),
      monthlyCollection: Number(data.monthlyCollection),
      isManualSaving: data.isManualSaving || false,
      manualSaving: Number(data.manualSaving || 0),
      cctvExpense: Number(data.cctvExpense || 0),
      showCctvExpense: data.showCctvExpense || false,
    }
  }) : []

  const expenses = expensesSnapshot ? expensesSnapshot.docs.map(d => {
    const data = d.data()
    return {
      id: d.id,
      date: data.date,
      month: data.month,
      category: data.category,
      name: data.name,
      amount: Number(data.amount),
      description: data.description || '',
    }
  }) : []

  return { settings, monthlyRecords, expenses }
}

// ─── Settings ────────────────────────────────────────────────

export const updateSettings = async (newSettings) => {
  const settingsDocRef = doc(db, 'settings', '1')
  await setDoc(settingsDocRef, {
    currency: newSettings.currency,
    defaultOpeningBalance: newSettings.defaultOpeningBalance,
    defaultMonthlyCollection: newSettings.defaultMonthlyCollection,
    waterSupplyStart: newSettings.waterSupplyStart || '',
    waterSupplyEnd: newSettings.waterSupplyEnd || '',
  }, { merge: true })
  return loadData()
}

// ─── Monthly Records CRUD ────────────────────────────────────

export const addMonthlyRecord = async (record) => {
  const recordsCol = collection(db, 'monthly_records')
  await addDoc(recordsCol, {
    month: record.month,
    openingBalance: Number(record.openingBalance),
    monthlyCollection: Number(record.monthlyCollection),
    isManualSaving: record.isManualSaving || false,
    manualSaving: Number(record.manualSaving || 0),
    cctvExpense: Number(record.cctvExpense || 0),
    showCctvExpense: record.showCctvExpense || false,
    createdAt: Date.now(),
  })
  return loadData()
}

export const updateMonthlyRecord = async (record) => {
  const recordDocRef = doc(db, 'monthly_records', record.id)
  await updateDoc(recordDocRef, {
    month: record.month,
    openingBalance: Number(record.openingBalance),
    monthlyCollection: Number(record.monthlyCollection),
    isManualSaving: record.isManualSaving || false,
    manualSaving: Number(record.manualSaving || 0),
    cctvExpense: Number(record.cctvExpense || 0),
    showCctvExpense: record.showCctvExpense || false,
  })
  return loadData()
}

export const deleteMonthlyRecord = async (id) => {
  const recordDocRef = doc(db, 'monthly_records', id)
  await deleteDoc(recordDocRef)
  return loadData()
}

// ─── Expenses CRUD ───────────────────────────────────────────

export const addExpense = async (expense) => {
  const expensesCol = collection(db, 'expenses')
  await addDoc(expensesCol, {
    date: expense.date,
    month: getMonthYear(expense.date),
    category: expense.category,
    name: expense.name,
    amount: Number(expense.amount),
    description: expense.description || '',
    createdAt: Date.now(),
  })
  return loadData()
}

export const updateExpense = async (expense) => {
  const expenseDocRef = doc(db, 'expenses', expense.id)
  await updateDoc(expenseDocRef, {
    date: expense.date,
    month: getMonthYear(expense.date),
    category: expense.category,
    name: expense.name,
    amount: Number(expense.amount),
    description: expense.description || '',
  })
  return loadData()
}

export const deleteExpense = async (id) => {
  const expenseDocRef = doc(db, 'expenses', id)
  await deleteDoc(expenseDocRef)
  return loadData()
}

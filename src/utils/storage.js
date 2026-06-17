import { db } from './firebase'
import { collection, doc, getDoc, getDocs, query, orderBy, setDoc, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore'

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

  const waterSupplyCol = collection(db, 'water_supply')
  const waterSupplyPromise = getDocs(waterSupplyCol)

  const [settingsDoc, recordsSnapshot, expensesSnapshot, waterSupplySnapshot] = await Promise.all([
    settingsDocPromise,
    recordsPromise,
    expensesPromise,
    waterSupplyPromise
  ]).catch(err => {
    console.error("Firebase data load error:", err)
    return [null, null, null, null]
  })

  let settings = {
    currency: 'PKR',
    cctvExpense: 38800,
    showCctvExpense: true,
    defaultOpeningBalance: 50400,
    defaultMonthlyCollection: 284750,
  }

  if (settingsDoc && settingsDoc.exists()) {
    const data = settingsDoc.data()
    settings = {
      ...settings,
      currency: data.currency || settings.currency,
      defaultOpeningBalance: Number(data.defaultOpeningBalance || settings.defaultOpeningBalance),
      defaultMonthlyCollection: Number(data.defaultMonthlyCollection || settings.defaultMonthlyCollection),
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

  const waterSupply = waterSupplySnapshot ? waterSupplySnapshot.docs.map(d => {
    const data = d.data()
    return {
      id: d.id,
      start: data.start || '',
      end: data.end || '',
    }
  }) : []

  return { settings, monthlyRecords, expenses, waterSupply }
}

// ─── Settings ────────────────────────────────────────────────

export const updateSettings = async (newSettings) => {
  const settingsDocRef = doc(db, 'settings', '1')
  await setDoc(settingsDocRef, {
    currency: newSettings.currency,
    defaultOpeningBalance: newSettings.defaultOpeningBalance,
    defaultMonthlyCollection: newSettings.defaultMonthlyCollection,
  }, { merge: true })
  return loadData()
}

export const updateWaterSupply = async (monthKey, start, end) => {
  const docRef = doc(db, 'water_supply', monthKey)
  await setDoc(docRef, {
    start: start || '',
    end: end || '',
    updatedAt: Date.now()
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

export const migrateSupabaseToFirebase = async (supRecords, supExpenses) => {
  const freshData = await loadData()
  const existingRecords = freshData.monthlyRecords
  const existingExpenses = freshData.expenses

  const batch = writeBatch(db)
  let recordsAdded = 0
  let expensesAdded = 0

  const safeGetTime = (dateStr) => {
    if (!dateStr) return Date.now()
    const parsed = new Date(dateStr).getTime()
    return isNaN(parsed) ? Date.now() : parsed
  }

  // Migrate monthly_records
  for (const r of supRecords) {
    const exists = existingRecords.some(er => er.month.toLowerCase() === r.month.toLowerCase())
    if (!exists) {
      const docRef = doc(collection(db, 'monthly_records'))
      batch.set(docRef, {
        month: r.month,
        openingBalance: Number(r.opening_balance || 0),
        monthlyCollection: Number(r.monthly_collection || 0),
        isManualSaving: r.is_manual_saving || false,
        manualSaving: Number(r.manual_saving || 0),
        cctvExpense: Number(r.cctv_expense || 0),
        showCctvExpense: r.show_cctv_expense || false,
        createdAt: safeGetTime(r.created_at),
      })
      recordsAdded++
    }
  }

  // Migrate expenses
  for (const e of supExpenses) {
    const exists = existingExpenses.some(ee => 
      ee.date === e.date && 
      ee.name.toLowerCase() === e.name.toLowerCase() && 
      Number(ee.amount) === Number(e.amount)
    )
    if (!exists) {
      const docRef = doc(collection(db, 'expenses'))
      batch.set(docRef, {
        date: e.date,
        month: e.month,
        category: e.category,
        name: e.name,
        amount: Number(e.amount || 0),
        description: e.description || '',
        createdAt: safeGetTime(e.created_at),
      })
      expensesAdded++
    }
  }

  if (recordsAdded > 0 || expensesAdded > 0) {
    await batch.commit()
  }

  return {
    recordsAdded,
    expensesAdded,
    freshData: await loadData()
  }
}


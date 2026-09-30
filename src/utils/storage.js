import { db } from './firebase'
import { collection, doc, getDoc, getDocs, query, orderBy, limit, setDoc, addDoc, updateDoc, deleteDoc, writeBatch } from 'firebase/firestore'
import { calculateMonthlyFinances, calculateMultiMonthContinuity, getMonthSortKey } from './finance'
export { calculateMonthlyFinances, calculateMultiMonthContinuity, getMonthSortKey }

// ─── Helpers ────────────────────────────────────────────────

export const getMonthYear = (dateString) => {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export const resolveGroupName = (grpStr) => {
  if (!grpStr) return null
  const s = grpStr.toLowerCase()
  if (s.includes('7d') || s.includes('ntrc') || s.includes('sector 7d/1')) {
    return 'N.T.R.C Sector 7D/1'
  }
  if (s.includes('hanzalla') || s.includes('ntrg') || s.includes('asad')) {
    return 'NTRG 2 Asad Hanzalla street'
  }
  return grpStr
}

export const getLastDataMonth = (data) => {
  if (data?.monthlyRecords && data.monthlyRecords.length > 0) {
    const sorted = [...data.monthlyRecords].sort((a, b) => {
      const bKey = typeof getMonthSortKey === 'function' ? getMonthSortKey(b?.month) : 0
      const aKey = typeof getMonthSortKey === 'function' ? getMonthSortKey(a?.month) : 0
      return bKey - aKey
    })
    const parts = (sorted[0]?.month || '').trim().split(/\s+/)
    if (parts.length >= 2) {
      return { month: parts[0], year: Number(parts[1]) || new Date().getFullYear() }
    }
  }
  const now = new Date()
  const m = now.toLocaleDateString('en-US', { month: 'long' })
  const y = now.getFullYear()
  return { month: m, year: y }
}

export const calculateTotals = (expenses, settings, monthlyRecords, selectedMonth) => {
  const defaultRecord = {
    openingBalance: 0,
    monthlyCollection: 0,
    isManualSaving: false,
    manualSaving: 0,
    cctvExpense: 0,
    showCctvExpense: false,
    note: '',
    isNoData: true
  }

  if (!selectedMonth || typeof selectedMonth !== 'string') {
    return {
      totalExpense: 0,
      netCashFlow: 0,
      status: "Surplus",
      closingBalance: 0,
      isOverdrawn: false,
      saving: 0,
      totalSaving: 0,
      record: defaultRecord
    }
  }

  const parts = selectedMonth.trim().split(/\s+/)
  const selMonthName = parts[0] || ''
  const selYear = Number(parts[1]) || 0
  
  const today = new Date()
  const curMonthName = today.toLocaleDateString('en-US', { month: 'long' })
  const curYear = today.getFullYear()
  const lastDayOfMonth = new Date(curYear, today.getMonth() + 1, 0).getDate()
  
  const isCurrentMonth = selMonthName === curMonthName && selYear === curYear
  const isPendingCurrentMonth = isCurrentMonth && today.getDate() !== lastDayOfMonth

  const continuityMap = calculateMultiMonthContinuity(monthlyRecords || [], expenses || [], settings || {})
  const continuityData = continuityMap.get(selectedMonth)

  const monthlyExpenses = (expenses || []).filter(e => e.month === selectedMonth)
  const monthRecord = (monthlyRecords || []).find(r => r.month === selectedMonth)
  const isNoData = isPendingCurrentMonth || (!monthRecord && monthlyExpenses.length === 0)
  
  if (isPendingCurrentMonth) {
    return {
      totalExpense: 0,
      netCashFlow: 0,
      status: "Surplus",
      closingBalance: 0,
      isOverdrawn: false,
      saving: 0,
      totalSaving: 0,
      record: defaultRecord
    }
  }

  if (continuityData) {
    return {
      totalExpense: continuityData.totalExpense || 0,
      netCashFlow: continuityData.netCashFlow || 0,
      status: continuityData.status || (continuityData.netCashFlow >= 0 ? "Surplus" : "Deficit"),
      closingBalance: continuityData.closingBalance || 0,
      isOverdrawn: !!continuityData.isOverdrawn,
      // Backwards-compatible aliases
      saving: continuityData.netCashFlow || 0,
      totalSaving: continuityData.closingBalance || 0,
      record: {
        ...defaultRecord,
        ...(continuityData.record || {}),
        note: continuityData.record?.note || monthRecord?.note || '',
        isNoData
      }
    }
  }

  const record = !monthRecord ? defaultRecord : {
    ...defaultRecord,
    ...monthRecord
  }

  const finances = calculateMonthlyFinances(
    record.openingBalance || 0,
    record.monthlyCollection || 0,
    monthlyExpenses
  )

  const netCashFlow = record.isManualSaving ? Number(record.manualSaving) : finances.netCashFlow
  const status = netCashFlow >= 0 ? "Surplus" : "Deficit"
  const closingBalance = isNoData 
    ? 0 
    : Number(record.openingBalance) + netCashFlow - (record.showCctvExpense ? record.cctvExpense || 0 : 0)
  const isOverdrawn = closingBalance < 0

  return {
    totalExpense: finances.totalExpense || 0,
    netCashFlow,
    status,
    closingBalance,
    isOverdrawn,
    saving: netCashFlow,
    totalSaving: closingBalance,
    record: { ...record, isNoData }
  }
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

  const contactsCol = collection(db, 'whatsapp_contacts')
  const contactsQuery = query(contactsCol, orderBy('createdAt', 'desc'))
  const contactsPromise = getDocs(contactsQuery).catch(() => null)

  const groupsDocRef = doc(db, 'settings', 'whatsapp_groups')
  const groupsPromise = getDoc(groupsDocRef).catch(() => null)

  const visitorLogsCol = collection(db, 'visitor_logs')
  const visitorLogsQuery = query(visitorLogsCol, orderBy('timestamp', 'desc'), limit(500))
  const visitorLogsPromise = getDocs(visitorLogsQuery).catch(() => null)

  const feedbackCol = collection(db, 'resident_feedback')
  const feedbackQuery = query(feedbackCol, orderBy('timestamp', 'desc'), limit(300))
  const feedbackPromise = getDocs(feedbackQuery).catch(() => null)

  const [settingsDoc, recordsSnapshot, expensesSnapshot, waterSupplySnapshot, contactsSnapshot, groupsDoc, visitorLogsSnapshot, feedbackSnapshot] = await Promise.all([
    settingsDocPromise,
    recordsPromise,
    expensesPromise,
    waterSupplyPromise,
    contactsPromise,
    groupsPromise,
    visitorLogsPromise,
    feedbackPromise
  ]).catch(err => {
    console.error("Firebase data load error:", err)
    return [null, null, null, null, null, null, null, null]
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
      adminPassword: data.adminPassword || 'admin123',
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
      note: data.note || '',
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
      entries: data.entries || [],
    }
  }) : []

  const contacts = contactsSnapshot ? contactsSnapshot.docs.map(d => {
    const data = d.data()
    return {
      id: d.id,
      name: data.name || '',
      phone: data.phone || '',
      houseNo: data.houseNo || '',
      tag: data.tag || 'Resident',
      group: data.group || 'NTRG 2 Asad Hanzalla street',
      createdAt: data.createdAt || 0
    }
  }) : []

  const defaultGroups = [
    { id: '1', name: 'N.T.R.C Sector 7D/1', link: '' },
    { id: '2', name: 'NTRG 2 Asad Hanzalla street', link: '' }
  ]

  let groups = defaultGroups
  if (groupsDoc && groupsDoc.exists()) {
    const gData = groupsDoc.data()
    if (Array.isArray(gData.groups) && gData.groups.length > 0) {
      groups = gData.groups
    }
  }

  const visitorLogs = visitorLogsSnapshot ? visitorLogsSnapshot.docs.map(d => {
    const data = d.data()
    return {
      id: d.id,
      name: data.name || '',
      phone: data.phone || '',
      houseNo: data.houseNo || data.houseAddress || '',
      houseAddress: data.houseAddress || data.houseNo || '',
      group: data.group || '',
      tag: data.tag || 'Resident',
      device: data.device || 'Desktop',
      monthViewed: data.monthViewed || '',
      userAgent: data.userAgent || '',
      timestamp: data.timestamp || 0,
      dateStr: data.dateStr || ''
    }
  }) : []

  const feedback = feedbackSnapshot ? feedbackSnapshot.docs.map(d => {
    const data = d.data()
    return {
      id: d.id,
      name: data.name || 'Anonymous Resident',
      phone: data.phone || '',
      houseAddress: data.houseAddress || data.houseNo || '',
      rating: Number(data.rating || 5),
      comment: data.comment || data.feedback || '',
      monthViewed: data.monthViewed || '',
      device: data.device || 'Desktop',
      timestamp: data.timestamp || 0,
      dateStr: data.dateStr || ''
    }
  }) : []

  return { settings, monthlyRecords, expenses, waterSupply, contacts, groups, visitorLogs, feedback }
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

export const getAdminPassword = async () => {
  const settingsDocRef = doc(db, 'settings', '1')
  const snap = await getDoc(settingsDocRef)
  if (snap.exists()) {
    return snap.data().adminPassword || 'admin123'
  }
  return 'admin123'
}

export const updateAdminPassword = async (newPassword) => {
  const settingsDocRef = doc(db, 'settings', '1')
  await setDoc(settingsDocRef, { adminPassword: newPassword }, { merge: true })
}

export const updateWaterSupply = async (monthKey, entries) => {
  const docRef = doc(db, 'water_supply', monthKey)
  await setDoc(docRef, {
    entries: entries || [],
    start: null,
    end: null,
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
    note: record.note || '',
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
    note: record.note || '',
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
        note: r.note || '',
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

// ─── WhatsApp Contacts & Groups CRUD ──────────────────────────

export const addWhatsAppContact = async (contact) => {
  const col = collection(db, 'whatsapp_contacts')
  await addDoc(col, {
    name: contact.name || '',
    phone: contact.phone || '',
    houseNo: contact.houseNo || '',
    tag: contact.tag || 'Resident',
    group: contact.group || 'NTRG 2 Asad Hanzalla street',
    createdAt: Date.now()
  })
  return loadData()
}

export const updateWhatsAppContact = async (contact) => {
  const docRef = doc(db, 'whatsapp_contacts', contact.id)
  await updateDoc(docRef, {
    name: contact.name || '',
    phone: contact.phone || '',
    houseNo: contact.houseNo || '',
    tag: contact.tag || 'Resident',
    group: contact.group || 'NTRG 2 Asad Hanzalla street'
  })
  return loadData()
}

export const deleteWhatsAppContact = async (id) => {
  const docRef = doc(db, 'whatsapp_contacts', id)
  await deleteDoc(docRef)
  return loadData()
}

export const bulkAddWhatsAppContacts = async (contactsList = []) => {
  if (!contactsList.length) return loadData()
  const batch = writeBatch(db)
  const col = collection(db, 'whatsapp_contacts')
  contactsList.forEach(c => {
    const newDoc = doc(col)
    batch.set(newDoc, {
      name: c.name || '',
      phone: c.phone || '',
      houseNo: c.houseNo || '',
      tag: c.tag || 'Resident',
      group: c.group || 'NTRG 2 Asad Hanzalla street',
      createdAt: Date.now()
    })
  })
  await batch.commit()
  return loadData()
}

export const updateWhatsAppGroups = async (groups) => {
  const docRef = doc(db, 'settings', 'whatsapp_groups')
  await setDoc(docRef, { groups, updatedAt: Date.now() }, { merge: true })
  return loadData()
}

// ─── Resident Visitor Analytics CRUD ─────────────────────────

export const logVisitor = async (visitorData = {}) => {
  try {
    const col = collection(db, 'visitor_logs')
    const now = new Date()
    const docData = {
      name: visitorData.name || 'Anonymous Resident',
      phone: visitorData.phone || '',
      houseNo: visitorData.houseNo || visitorData.houseAddress || '',
      houseAddress: visitorData.houseAddress || visitorData.houseNo || '',
      group: visitorData.group || '',
      tag: visitorData.tag || 'Resident',
      device: visitorData.device || (window.innerWidth < 768 ? 'Mobile' : 'Desktop'),
      monthViewed: visitorData.monthViewed || '',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: Date.now(),
      dateStr: now.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
    await addDoc(col, docData)
    return docData
  } catch (err) {
    console.warn("Could not log visitor event to Firestore:", err)
    return null
  }
}

export const clearVisitorLogs = async () => {
  try {
    const col = collection(db, 'visitor_logs')
    const snapshot = await getDocs(query(col, limit(100)))
    const batch = writeBatch(db)
    snapshot.docs.forEach(d => batch.delete(d.ref))
    await batch.commit()
    return loadData()
  } catch (err) {
    console.error("Failed to clear visitor logs:", err)
    return loadData()
  }
}

export const updateVisitorLog = async (logId, updatedData = {}) => {
  try {
    const docRef = doc(db, 'visitor_logs', logId)
    await updateDoc(docRef, updatedData)
    return loadData()
  } catch (err) {
    console.error("Failed to update visitor log:", err)
    return loadData()
  }
}

export const deleteVisitorLog = async (logId) => {
  try {
    const docRef = doc(db, 'visitor_logs', logId)
    await deleteDoc(docRef)
    return loadData()
  } catch (err) {
    console.error("Failed to delete visitor log:", err)
    return loadData()
  }
}


// ─── Resident Feedback & Rating CRUD ─────────────────────────

export const submitFeedback = async (feedbackData = {}) => {
  try {
    const col = collection(db, 'resident_feedback')
    const now = new Date()
    const docData = {
      name: feedbackData.name || 'Anonymous Resident',
      phone: feedbackData.phone || '',
      houseAddress: feedbackData.houseAddress || feedbackData.houseNo || '',
      rating: Number(feedbackData.rating || 5),
      comment: feedbackData.comment || '',
      monthViewed: feedbackData.monthViewed || '',
      device: feedbackData.device || (window.innerWidth < 768 ? 'Mobile' : 'Desktop'),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      timestamp: Date.now(),
      dateStr: now.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    }
    await addDoc(col, docData)
    return docData
  } catch (err) {
    console.warn("Could not submit feedback to Firestore:", err)
    return null
  }
}

export const clearFeedback = async () => {
  try {
    const col = collection(db, 'resident_feedback')
    const snapshot = await getDocs(query(col, limit(100)))
    const batch = writeBatch(db)
    snapshot.docs.forEach(d => batch.delete(d.ref))
    await batch.commit()
    return loadData()
  } catch (err) {
    console.error("Failed to clear feedback:", err)
    return loadData()
  }
}



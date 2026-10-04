import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, deleteDoc, updateDoc } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAmPPWHr8Jlht8sd3p5lX1vghW3I4q_dgI",
  authDomain: "monthly-expense-dashboard.firebaseapp.com",
  projectId: "monthly-expense-dashboard",
  storageBucket: "monthly-expense-dashboard.firebasestorage.app",
  messagingSenderId: "650498516936",
  appId: "1:650498516936:web:536f0bf0e57b8c914182fd"
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

const normalizePhone = (p) => (p || '').replace(/[^0-9]/g, '').slice(-10)

async function consolidateSameDayLogs() {
  console.log('Fetching all visitor_logs from Firestore...')
  const snap = await getDocs(collection(db, 'visitor_logs'))
  console.log(`Found ${snap.size} total visitor logs.`)

  // Group by resident + calendar date
  const groups = {}

  snap.docs.forEach(d => {
    const data = d.data()
    const ts = data.timestamp || Date.now()
    const dateObj = new Date(ts)
    const dateKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`
    
    const cleanPhone = normalizePhone(data.phone)
    const cleanName = (data.name || 'guest').toLowerCase().trim()
    const residentKey = cleanPhone || cleanName
    const groupKey = `${residentKey}_${dateKey}`

    if (!groups[groupKey]) {
      groups[groupKey] = []
    }

    groups[groupKey].push({
      id: d.id,
      ...data,
      dateKey,
      timestamp: ts
    })
  })

  let deletedCount = 0
  let updatedCount = 0

  for (const [key, logs] of Object.entries(groups)) {
    if (logs.length > 1) {
      // Sort so newest visit is first
      logs.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))
      
      const latest = logs[0]
      const toDelete = logs.slice(1)

      console.log(`\nConsolidating ${logs.length} visits for "${latest.name}" on ${latest.dateKey}:`)
      console.log(`  Keeping latest visit: ID ${latest.id} (${latest.dateStr || new Date(latest.timestamp).toLocaleString()}, month: ${latest.monthViewed})`)

      // Delete the older duplicate entries
      for (const oldLog of toDelete) {
        console.log(`  Deleting duplicate: ID ${oldLog.id} (${oldLog.dateStr || new Date(oldLog.timestamp).toLocaleString()}, month: ${oldLog.monthViewed})`)
        await deleteDoc(doc(db, 'visitor_logs', oldLog.id))
        deletedCount++
      }

      // Update the keeper log with total visit count for the day
      await updateDoc(doc(db, 'visitor_logs', latest.id), {
        visitCount: logs.length,
        visitDate: latest.dateKey,
        lastVisitedAt: latest.timestamp
      })
      updatedCount++
    }
  }

  console.log(`\n🎉 Consolidation complete! Removed ${deletedCount} duplicate same-day entries. Updated ${updatedCount} primary records.`)
}

consolidateSameDayLogs()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Error consolidating logs:', err)
    process.exit(1)
  })

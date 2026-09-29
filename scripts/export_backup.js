import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs } from 'firebase/firestore'
import fs from 'fs'
import path from 'path'

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

const COLLECTIONS = [
  'settings',
  'monthly_records',
  'expenses',
  'water_supply',
  'whatsapp_contacts',
  'visitor_logs',
  'resident_feedback'
]

async function runBackup() {
  console.log('Starting full database backup...')
  const backupData = {
    version: '2.4.0',
    timestamp: new Date().toISOString(),
    backupDate: '2026-09-30',
    collections: {}
  }

  for (const colName of COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, colName))
      backupData.collections[colName] = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      console.log(`✓ Exported ${colName}: ${snap.size} documents`)
    } catch (err) {
      console.error(`✗ Error exporting ${colName}:`, err.message)
    }
  }

  const backupDir = path.resolve('backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  const filename = `backup_firestore_v2.4.0_2026_09_30.json`
  const filePath = path.join(backupDir, filename)
  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8')
  console.log(`\n🎉 Full backup saved to: ${filePath}`)
  process.exit(0)
}

runBackup().catch(err => {
  console.error('Backup failed:', err)
  process.exit(1)
})

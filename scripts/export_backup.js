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
  const now = new Date()
  const dateStr = now.toISOString().slice(0, 10)
  const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '-')
  const timestampISO = now.toISOString()

  console.log(`[${timestampISO}] Starting scheduled database backup...`)

  const backupData = {
    version: '2.4.0',
    timestamp: timestampISO,
    backupDate: dateStr,
    scheduledCron: 'Every Friday Night 12:30 AM PKT (UTC 19:30)',
    totalDocuments: 0,
    collections: {}
  }

  let totalDocs = 0

  for (const colName of COLLECTIONS) {
    try {
      const snap = await getDocs(collection(db, colName))
      backupData.collections[colName] = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      totalDocs += snap.size
      console.log(`  ✓ Exported ${colName}: ${snap.size} documents`)
    } catch (err) {
      console.error(`  ✗ Error exporting ${colName}:`, err.message)
      backupData.collections[colName] = []
    }
  }

  backupData.totalDocuments = totalDocs

  const backupDir = path.resolve('backups')
  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true })
  }

  // 1. Save timestamped backup file
  const filename = `backup_firestore_${dateStr}_${timeStr}.json`
  const filePath = path.join(backupDir, filename)
  fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8')

  // 2. Also update latest pointer
  const latestPath = path.join(backupDir, 'backup_firestore_latest.json')
  fs.writeFileSync(latestPath, JSON.stringify(backupData, null, 2), 'utf8')

  // 3. Automatic retention management: Keep the last 15 backups, prune older files
  try {
    const files = fs.readdirSync(backupDir)
      .filter(f => f.startsWith('backup_firestore_') && f.endsWith('.json') && f !== 'backup_firestore_latest.json')
      .map(f => ({ name: f, time: fs.statSync(path.join(backupDir, f)).mtime.getTime() }))
      .sort((a, b) => b.time - a.time)

    if (files.length > 15) {
      const toDelete = files.slice(15)
      for (const f of toDelete) {
        fs.unlinkSync(path.join(backupDir, f.name))
        console.log(`  ℹ Cleaned up old archive: ${f.name}`)
      }
    }
  } catch (pruneErr) {
    console.warn('  ⚠ Backup pruning warning:', pruneErr.message)
  }

  console.log(`\n🎉 Full backup completed successfully!`)
  console.log(`   Total Records: ${totalDocs} across ${COLLECTIONS.length} collections`)
  console.log(`   Saved Archive: ${filePath}`)
  console.log(`   Latest Pointer: ${latestPath}`)
  process.exit(0)
}

runBackup().catch(err => {
  console.error('Backup process failed:', err)
  process.exit(1)
})

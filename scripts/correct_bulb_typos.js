import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore'

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

// Correction dictionary for common typos like "Blub" -> "Bulb"
const CORRECTIONS = {
  'New Blub': 'New Bulb',
  'Blub Repair': 'Bulb Repair',
  'Blub': 'Bulb',
  'new blub': 'New Bulb',
  'blub repair': 'Bulb Repair'
}

async function fixBulbTypos() {
  console.log('Scanning expenses collection for "Blub" typos...')
  const col = collection(db, 'expenses')
  const snap = await getDocs(col)

  let updatedCount = 0

  for (const d of snap.docs) {
    const data = d.data()
    const originalName = data.name || ''
    const originalDesc = data.description || ''

    let newName = originalName
    let newDesc = originalDesc
    let needsUpdate = false

    // Check name
    if (CORRECTIONS[originalName]) {
      newName = CORRECTIONS[originalName]
      needsUpdate = true
    } else if (/blub/i.test(originalName)) {
      newName = originalName.replace(/blub/gi, (match) => {
        if (match === 'BLUB') return 'BULB'
        if (match === 'Blub') return 'Bulb'
        return 'bulb'
      })
      needsUpdate = true
    }

    // Check description
    if (/blub/i.test(originalDesc)) {
      newDesc = originalDesc.replace(/blub/gi, (match) => {
        if (match === 'BLUB') return 'BULB'
        if (match === 'Blub') return 'Bulb'
        return 'bulb'
      })
      needsUpdate = true
    }

    if (needsUpdate) {
      console.log(`Updating Doc ID ${d.id} (${data.month || 'Unknown Month'}): "${originalName}" -> "${newName}"`)
      await updateDoc(doc(db, 'expenses', d.id), {
        name: newName,
        description: newDesc
      })
      updatedCount++
    }
  }

  console.log(`\n🎉 Successfully corrected ${updatedCount} expense document(s) in Firestore!`)
}

fixBulbTypos()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Failed to correct bulb typos:', err)
    process.exit(1)
  })

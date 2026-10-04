import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc, getDocs, query, where } from 'firebase/firestore'

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

const MONTH_KEY = 'September 2026'

const SEPTEMBER_RECORD = {
  month: MONTH_KEY,
  openingBalance: -4012,
  monthlyCollection: 279050,
  isManualSaving: false,
  manualSaving: 0,
  cctvExpense: 0,
  showCctvExpense: false,
  note: 'نوٹ: یہ اطلاع دی جاتی ہے کہ اس ماہ کی کلیکشن میں کمی اس لیے آئی ہے کیونکہ کچھ افراد نے اپنی ماہانہ رقم ادا نہیں کی، جس کی وجہ سے مجموعی کلیکشن اور سیونگ متاثر ہوئی ہے۔ براہ کرم آئندہ وقت پر ادائیگی یقینی بنائیں۔ شکریہ۔',
  createdAt: Date.now()
}

const SEPTEMBER_EXPENSES = [
  {
    name: 'Security Expense',
    amount: 227525,
    category: 'Security',
    date: '2026-09-05',
    month: MONTH_KEY,
    description: 'Monthly security guard charges for September'
  },
  {
    name: 'Electrician Charges',
    amount: 9000,
    category: 'Maintenance',
    date: '2026-09-10',
    month: MONTH_KEY,
    description: 'Street lighting and electrical maintenance'
  },
  {
    name: 'Sweeper Salary',
    amount: 30000,
    category: 'Maintenance',
    date: '2026-09-30',
    month: MONTH_KEY,
    description: 'Monthly sanitation & street sweeping payroll'
  },
  {
    name: 'Extra Sweeper Amount',
    amount: 2000,
    category: 'Maintenance',
    date: '2026-09-28',
    month: MONTH_KEY,
    description: 'Additional sanitation compensation'
  },
  {
    name: 'New Blub',
    amount: 2200,
    category: 'Maintenance',
    date: '2026-09-15',
    month: MONTH_KEY,
    description: 'New street light bulbs purchased'
  },
  {
    name: 'Blub Repair',
    amount: 6500,
    category: 'Maintenance',
    date: '2026-09-18',
    month: MONTH_KEY,
    description: 'Street light bulb repair & fixture replacements'
  },
  {
    name: 'Welder Charges',
    amount: 3000,
    category: 'Maintenance',
    date: '2026-09-12',
    month: MONTH_KEY,
    description: 'Welding work on gate / street fixtures'
  },
  {
    name: 'Pulley',
    amount: 500,
    category: 'Maintenance',
    date: '2026-09-14',
    month: MONTH_KEY,
    description: 'Pulley hardware replacement'
  },
  {
    name: 'Panaflex + Dori',
    amount: 3000,
    category: 'Miscellaneous',
    date: '2026-09-20',
    month: MONTH_KEY,
    description: 'Community banner Panaflex and rope/dori'
  },
  {
    name: 'CCTV Camera (Shifted Patli Gali)',
    amount: 1000,
    category: 'Security',
    date: '2026-09-22',
    month: MONTH_KEY,
    description: 'CCTV Camera relocation at Patli Gali'
  },
  {
    name: 'CCTV Camera (Shifted)',
    amount: 8000,
    category: 'Security',
    date: '2026-09-25',
    month: MONTH_KEY,
    description: 'CCTV Camera shifting, rewiring and re-installation'
  },
  {
    name: 'Misc Expense',
    amount: 4700,
    category: 'Miscellaneous',
    date: '2026-09-27',
    month: MONTH_KEY,
    description: 'Miscellaneous operational expenses'
  }
]

async function addSeptemberData() {
  console.log(`Checking existing records for ${MONTH_KEY}...`)

  // 1. Check if monthly record exists
  const recCol = collection(db, 'monthly_records')
  const qRec = query(recCol, where('month', '==', MONTH_KEY))
  const existingRecs = await getDocs(qRec)

  if (existingRecs.empty) {
    console.log(`Adding Monthly Record for ${MONTH_KEY}...`)
    const addedRec = await addDoc(recCol, SEPTEMBER_RECORD)
    console.log(`✓ Monthly record added with ID: ${addedRec.id}`)
  } else {
    console.log(`ℹ Monthly record for ${MONTH_KEY} already exists (${existingRecs.size} found). Skipping creation.`)
  }

  // 2. Check if expenses exist
  const expCol = collection(db, 'expenses')
  const qExp = query(expCol, where('month', '==', MONTH_KEY))
  const existingExp = await getDocs(qExp)

  if (existingExp.empty) {
    console.log(`Adding ${SEPTEMBER_EXPENSES.length} expenses for ${MONTH_KEY}...`)
    let totalAdded = 0
    let totalAmt = 0
    for (const exp of SEPTEMBER_EXPENSES) {
      await addDoc(expCol, {
        ...exp,
        createdAt: Date.now()
      })
      totalAdded++
      totalAmt += exp.amount
      console.log(`  ✓ Added: ${exp.name} - PKR ${exp.amount.toLocaleString()}`)
    }
    console.log(`\n🎉 Successfully added all ${totalAdded} expenses (Total: PKR ${totalAmt.toLocaleString()})`)
  } else {
    console.log(`ℹ ${existingExp.size} expenses already exist for ${MONTH_KEY}. Skipping.`)
  }
}

addSeptemberData()
  .then(() => {
    console.log('\nData insertion complete.')
    process.exit(0)
  })
  .catch((err) => {
    console.error('Failed to add September 2026 data:', err)
    process.exit(1)
  })

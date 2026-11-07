// src/utils/receiptService.js
import { db } from './firebase'
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore'

/**
 * Compresses an image client-side to keep document size well under 1MB
 */
export function compressImageToBase64(file, maxWidth = 1000, quality = 0.65) {
  return new Promise((resolve, reject) => {
    // If it's a PDF, read as raw base64 data URL
    if (file.type === 'application/pdf') {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.onerror = reject
      reader.readAsDataURL(file)
      return
    }

    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = (event) => {
      const img = new Image()
      img.src = event.target.result
      img.onload = () => {
        const canvas = document.createElement('canvas')
        let width = img.width
        let height = img.height

        if (width > maxWidth) {
          height = Math.round((height * maxWidth) / width)
          width = maxWidth
        }

        canvas.width = width
        canvas.height = height

        const ctx = canvas.getContext('2d')
        ctx.drawImage(img, 0, 0, width, height)

        // Compress to high-efficiency JPEG base64
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality)
        resolve(compressedBase64)
      }
      img.onerror = (err) => reject(err)
    }
    reader.onerror = (err) => reject(err)
  })
}

/**
 * Processes and compresses file locally without Firebase Cloud Storage
 */
export async function uploadReceiptFile(file, cycleKey, residentId, onProgress) {
  if (onProgress) onProgress(25)

  // Compress image to Base64 in browser memory
  const base64Data = await compressImageToBase64(file)

  if (onProgress) onProgress(85)

  // Return base64 as downloadURL so all <img> tags work identically
  return {
    downloadURL: base64Data,
    storagePath: 'firestore_embedded'
  }
}

/**
 * Saves receipt document into Firestore and immediately logs with Paid Resident status
 */
export async function submitPaymentReceipt({
  residentId,
  residentName,
  houseNumber,
  contactNumber,
  billingMonth,
  billingYear,
  amountPaid,
  paymentChannel = 'easypaisa',
  transactionRef = '',
  receiptUrl,
  receiptStoragePath
}) {
  const cycleKey = `${billingYear}-${billingMonth}`
  const cleanHouse = (houseNumber || 'UNIT')
    .replace(/[^a-zA-Z0-9]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase()
  const cleanResidentId = String(residentId || 'RES').replace(/[^a-zA-Z0-9_-]/g, '-')
  const receiptId = `REC-${cycleKey}-${cleanHouse}-${Date.now().toString().slice(-4)}`
  const receiptRef = doc(db, 'payment_receipts', receiptId)

  const payload = {
    id: receiptId,
    residentId,
    residentName,
    houseNumber,
    contactNumber,
    billingMonth,
    billingYear,
    cycleKey,
    amountPaid: Number(amountPaid),
    paymentChannel,
    transactionRef,
    receiptUrl, // Stores compressed Base64 string directly
    receiptStoragePath: receiptStoragePath || 'firestore_embedded',
    status: 'verified', // Directly confirmed as verified Paid Resident
    submittedAt: serverTimestamp(),
    verifiedAt: serverTimestamp(),
    verifiedBy: 'Auto-Verified (Receipt Upload)'
  }

  await setDoc(receiptRef, payload)

  // Update billing status index to Paid Resident
  const billingIndexRef = doc(db, 'residents_billing_status', `${cleanResidentId}_${cycleKey}`)
  await setDoc(billingIndexRef, {
    residentId,
    residentName,
    houseNumber,
    contactNumber,
    cycleKey,
    amountPaid: Number(amountPaid),
    status: 'paid', // Status: Paid Resident
    receiptId,
    receiptUrl,
    updatedAt: serverTimestamp()
  }, { merge: true })

  // Instant local cache so resident is prevented from duplicate uploading
  if (typeof window !== 'undefined') {
    try {
      const summary = {
        receiptId,
        residentName,
        houseNumber,
        amountPaid: Number(amountPaid),
        cycleKey,
        status: 'verified',
        submittedAt: Date.now()
      }
      localStorage.setItem(`receipt_approved_${cycleKey}`, JSON.stringify(summary))
      localStorage.setItem(`receipt_approved_${cycleKey}_${cleanHouse}`, JSON.stringify(summary))
    } catch (_) {}
  }

  return receiptId
}

/**
 * Checks whether a resident or house already has an approved receipt for this cycle
 */
export async function checkResidentApprovedReceipt(residentId, houseNumber, cycleKey) {
  if (!cycleKey) return null

  // 1. Check local storage cache
  if (typeof window !== 'undefined') {
    try {
      const local = localStorage.getItem(`receipt_approved_${cycleKey}`)
      if (local) {
        const parsed = JSON.parse(local)
        if (parsed && (parsed.status === 'verified' || parsed.status === 'paid')) {
          return parsed
        }
      }
    } catch (_) {}
  }

  // 2. Query Firestore billing status
  try {
    const cleanResidentId = String(residentId || 'RES').replace(/[^a-zA-Z0-9_-]/g, '-')
    const billingIndexRef = doc(db, 'residents_billing_status', `${cleanResidentId}_${cycleKey}`)
    const snap = await getDoc(billingIndexRef)
    if (snap && snap.exists()) {
      const data = snap.data()
      if (data.status === 'paid' || data.status === 'verified') {
        return data
      }
    }
  } catch (_) {}

  // 3. Query payment_receipts directly
  try {
    const q = query(
      collection(db, 'payment_receipts'),
      where('cycleKey', '==', cycleKey),
      where('status', 'in', ['verified', 'paid'])
    )
    const snap = await getDocs(q)
    const found = snap.docs.map(d => d.data()).find(r => {
      const matchRes = residentId && r.residentId === residentId
      const matchHouse = houseNumber && r.houseNumber && r.houseNumber.toLowerCase().trim() === houseNumber.toLowerCase().trim()
      return matchRes || matchHouse
    })
    return found || null
  } catch (_) {
    return null
  }
}

/**
 * Super Admin: Approves or Rejects a receipt
 */
export async function updateReceiptStatus(receiptId, residentId, cycleKey, status, adminName) {
  const receiptRef = doc(db, 'payment_receipts', receiptId)
  await updateDoc(receiptRef, {
    status,
    verifiedAt: serverTimestamp(),
    verifiedBy: adminName
  })

  const cleanResidentId = String(residentId || 'RES').replace(/[^a-zA-Z0-9_-]/g, '-')
  const billingIndexRef = doc(db, 'residents_billing_status', `${cleanResidentId}_${cycleKey}`)
  await updateDoc(billingIndexRef, {
    status: status === 'verified' ? 'paid' : 'rejected',
    updatedAt: serverTimestamp()
  })
}

/**
 * Fetches all receipts for a billing cycle (for Admin Reconciliation)
 * Includes robust fallback for missing composite indexes in Firestore
 */
export async function fetchCycleReceipts(cycleKey) {
  try {
    const q = query(
      collection(db, 'payment_receipts'),
      where('cycleKey', '==', cycleKey),
      orderBy('submittedAt', 'desc')
    )
    const snap = await getDocs(q)
    return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
  } catch (err) {
    console.warn('Index notice, fetching with cycleKey filter:', err)
    try {
      const q2 = query(
        collection(db, 'payment_receipts'),
        where('cycleKey', '==', cycleKey)
      )
      const snap2 = await getDocs(q2)
      const list = snap2.docs.map((d) => ({ id: d.id, ...d.data() }))
      return list.sort((a, b) => {
        const tA = a.submittedAt?.toMillis ? a.submittedAt.toMillis() : (a.submittedAt?.seconds || 0)
        const tB = b.submittedAt?.toMillis ? b.submittedAt.toMillis() : (b.submittedAt?.seconds || 0)
        return tB - tA
      })
    } catch (err2) {
      console.error('Failed to load receipts fallback:', err2)
      return []
    }
  }
}

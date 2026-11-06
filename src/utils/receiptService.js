// src/utils/receiptService.js
import { db } from './firebase'
import {
  collection,
  doc,
  setDoc,
  updateDoc,
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
 * Saves receipt document into Firestore
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
  const cycleKey = `${billingYear}-${String(billingMonth).padStart(2, '0')}`
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
    status: 'pending', // 'pending' | 'verified' | 'rejected'
    submittedAt: serverTimestamp(),
    verifiedAt: null,
    verifiedBy: null
  }

  await setDoc(receiptRef, payload)

  // Update billing status index
  const billingIndexRef = doc(db, 'residents_billing_status', `${cleanResidentId}_${cycleKey}`)
  await setDoc(billingIndexRef, {
    residentId,
    residentName,
    houseNumber,
    contactNumber,
    cycleKey,
    amountPaid: Number(amountPaid),
    status: 'pending',
    receiptId,
    receiptUrl,
    updatedAt: serverTimestamp()
  }, { merge: true })

  return receiptId
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
 */
export async function fetchCycleReceipts(cycleKey) {
  const q = query(
    collection(db, 'payment_receipts'),
    where('cycleKey', '==', cycleKey),
    orderBy('submittedAt', 'desc')
  )
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

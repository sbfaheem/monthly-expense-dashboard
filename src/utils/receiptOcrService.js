// src/utils/receiptOcrService.js
import { createWorker } from 'tesseract.js'

/**
 * Parses raw text from a Pakistani payment receipt (Easypaisa, JazzCash, Raast,
 * Faysal Bank, Meezan, JS Bank/Zindigi, HBL, Bank Alfalah, etc.)
 * to extract Amount and Transaction ID / TID.
 */
export function parseReceiptText(text) {
  if (!text || typeof text !== 'string') {
    return { amount: null, transactionRef: null }
  }

  let foundAmount = null
  let foundTid = null

  // Normalize lines and trim whitespace
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean)

  // 1. Transaction ID / Reference Regex Patterns
  const tidPatterns = [
    /(?:Transaction\s*(?:ID|Id|No|Number|#)|TRX\s*(?:ID|Id|No|#)|TID|Txn\s*(?:ID|Id)|Ref(?:erence)?\s*(?:ID|No|Number|#)|Receipt\s*(?:ID|No|#)|STAN|Trace\s*No)\s*[:#\-\s]+([A-Za-z0-9_-]{4,30})/i,
    /(?:TID|TRX|REF|STAN)\s*[:#\-\s]+([0-9A-Z]{4,25})/i
  ]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!foundTid) {
      for (const pattern of tidPatterns) {
        const match = line.match(pattern)
        if (match && match[1]) {
          foundTid = match[1].trim()
          break
        }
      }

      // Handle cases where label is on one line and value is on the next line
      if (!foundTid && /^(?:Transaction\s*(?:ID|Id|No|#)|TRX\s*ID|TID|Reference\s*No|Receipt\s*ID)$/i.test(line)) {
        if (i + 1 < lines.length && /^[A-Za-z0-9_-]{4,30}$/.test(lines[i + 1])) {
          foundTid = lines[i + 1].trim()
        }
      }
    }
  }

  // 2. Amount Patterns (PKR / Rs. / Amount Paid)
  const amountPatterns = [
    /(?:PKR|Rs\.?)\s*[:#\-\s]*([0-9,]+(?:\.\d{1,2})?)/i,
    /([0-9,]+(?:\.\d{1,2})?)\s*(?:PKR|Rs\.?)/i,
    /(?:Amount|Total|Paid|Transferred)\s*(?:Paid)?\s*[:#\-\s]*(?:PKR|Rs\.?)?\s*([0-9,]+(?:\.\d{1,2})?)/i
  ]

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    if (!foundAmount) {
      for (const pattern of amountPatterns) {
        const match = line.match(pattern)
        if (match && match[1]) {
          const val = match[1].replace(/,/g, '')
          const num = parseFloat(val)
          // Filter out tiny values (like 0.00 fee) or abnormally huge values
          if (num >= 50 && num <= 500000) {
            foundAmount = num
            break
          }
        }
      }
    }
  }

  return { amount: foundAmount, transactionRef: foundTid }
}

/**
 * Runs Tesseract OCR on a receipt image in client browser memory
 * and auto-extracts the Amount and Transaction TID.
 *
 * @param {File|string} imageSource - File object or image URL
 * @param {Function} [onProgress] - Optional callback (0 to 100)
 * @returns {Promise<{ amount: number|null, transactionRef: string|null, rawText: string, success: boolean }>}
 */
export async function scanReceiptForDetails(imageSource, onProgress) {
  let worker = null
  try {
    if (onProgress) onProgress(15)

    worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          const pct = Math.round(15 + m.progress * 75)
          onProgress(Math.min(pct, 90))
        }
      }
    })

    if (onProgress) onProgress(35)
    const ret = await worker.recognize(imageSource)
    const rawText = ret?.data?.text || ''

    if (onProgress) onProgress(95)
    const { amount, transactionRef } = parseReceiptText(rawText)

    if (onProgress) onProgress(100)
    await worker.terminate()
    worker = null

    return {
      amount,
      transactionRef,
      rawText,
      success: Boolean(amount || transactionRef)
    }
  } catch (err) {
    console.warn('Receipt OCR Scan error (will allow manual entry):', err)
    if (worker) {
      try {
        await worker.terminate()
      } catch (_) {}
    }
    return {
      amount: null,
      transactionRef: null,
      rawText: '',
      success: false,
      error: err.message
    }
  }
}

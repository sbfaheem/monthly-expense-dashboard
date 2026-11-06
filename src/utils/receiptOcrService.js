// src/utils/receiptOcrService.js
import { createWorker } from 'tesseract.js'

/**
 * Parses raw text from a Pakistani payment receipt (Easypaisa, JazzCash, Raast,
 * Faysal Bank, Meezan, JS Bank/Zindigi, HBL, Bank Alfalah, etc.)
 * to extract Amount and Transaction ID / TID / Reference Number.
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
      if (
        !foundTid &&
        /^(?:Transaction\s*(?:ID|Id|No|#)|TRX\s*ID|TID|Reference\s*No|Receipt\s*ID)$/i.test(line)
      ) {
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
 * Loads an image file or URL into an HTML5 Image element
 */
function loadHtmlImage(fileOrUrl) {
  return new Promise((resolve, reject) => {
    if (typeof fileOrUrl === 'string') {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = reject
      img.src = fileOrUrl
    } else {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => resolve(img)
        img.onerror = reject
        img.src = e.target.result
      }
      reader.onerror = reject
      reader.readAsDataURL(fileOrUrl)
    }
  })
}

/**
 * Extracts a vertical slice of an image using canvas (targeting badge/TID areas)
 */
function cropImageSlice(img, topRatio = 0.35, heightRatio = 0.50) {
  try {
    const canvas = document.createElement('canvas')
    const naturalW = img.naturalWidth || img.width
    const naturalH = img.naturalHeight || img.height
    const sy = Math.round(naturalH * topRatio)
    const sh = Math.round(naturalH * heightRatio)

    canvas.width = naturalW
    canvas.height = sh
    const ctx = canvas.getContext('2d')

    // Optional subtle contrast enhancement for badge/pill readability
    ctx.drawImage(img, 0, sy, naturalW, sh, 0, 0, naturalW, sh)
    return canvas.toDataURL('image/jpeg', 0.92)
  } catch (err) {
    console.warn('Canvas slice error:', err)
    return null
  }
}

/**
 * Runs multi-pass smart OCR on a receipt image in client browser memory:
 * Pass 1: Full image scan (captures Amount, headers, status)
 * Pass 2: Focused Middle Slice scan (captures encapsulated Transaction ID badges/pills)
 *
 * @param {File|string} imageSource - File object or image URL
 * @param {Function} [onProgress] - Optional callback (0 to 100)
 * @returns {Promise<{ amount: number|null, transactionRef: string|null, rawText: string, success: boolean }>}
 */
export async function scanReceiptForDetails(imageSource, onProgress) {
  let worker = null
  try {
    if (onProgress) onProgress(15)

    // Load image element for dimension-aware slicing
    let loadedImg = null
    try {
      loadedImg = await loadHtmlImage(imageSource)
    } catch (_) {}

    worker = await createWorker('eng', 1, {
      logger: (m) => {
        if (m.status === 'recognizing text' && onProgress) {
          const pct = Math.round(15 + m.progress * 45)
          onProgress(Math.min(pct, 60))
        }
      }
    })

    if (onProgress) onProgress(30)
    // Pass 1: Full image OCR
    const pass1Ret = await worker.recognize(imageSource)
    let fullText = pass1Ret?.data?.text || ''
    let parsed = parseReceiptText(fullText)

    if (onProgress) onProgress(65)

    // Pass 2: If Transaction ID is missing, scan middle 50% slice where bank TID pills reside
    if (!parsed.transactionRef && loadedImg) {
      const middleSliceUrl = cropImageSlice(loadedImg, 0.35, 0.50)
      if (middleSliceUrl) {
        if (onProgress) onProgress(75)
        const pass2Ret = await worker.recognize(middleSliceUrl)
        const midText = pass2Ret?.data?.text || ''
        fullText += '\n' + midText
        const midParsed = parseReceiptText(midText)

        if (midParsed.transactionRef) {
          parsed.transactionRef = midParsed.transactionRef
        }
        if (!parsed.amount && midParsed.amount) {
          parsed.amount = midParsed.amount
        }
      }
    }

    // Pass 3: If still missing TID, try bottom half (50% to 100%)
    if (!parsed.transactionRef && loadedImg) {
      const bottomSliceUrl = cropImageSlice(loadedImg, 0.50, 0.50)
      if (bottomSliceUrl) {
        if (onProgress) onProgress(85)
        const pass3Ret = await worker.recognize(bottomSliceUrl)
        const btmText = pass3Ret?.data?.text || ''
        fullText += '\n' + btmText
        const btmParsed = parseReceiptText(btmText)

        if (btmParsed.transactionRef) {
          parsed.transactionRef = btmParsed.transactionRef
        }
      }
    }

    if (onProgress) onProgress(100)
    await worker.terminate()
    worker = null

    return {
      amount: parsed.amount,
      transactionRef: parsed.transactionRef,
      rawText: fullText,
      success: Boolean(parsed.amount || parsed.transactionRef)
    }
  } catch (err) {
    console.warn('Receipt OCR Scan error (falling back to manual entry):', err)
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

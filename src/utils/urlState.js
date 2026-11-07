// src/utils/urlState.js

/**
 * Get current search params as an object
 */
export function getUrlParams() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  const result = {}
  for (const [k, v] of params.entries()) {
    result[k] = v
  }
  return result
}

/**
 * Get a specific search parameter value
 */
export function getUrlParam(key) {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get(key)
}

/**
 * Update URL search parameters without reloading the page.
 * Merges new params with existing params.
 * If a value is null, undefined, or empty string, it removes that parameter.
 * @param {Record<string, string|number|null|undefined>} updates
 * @param {boolean} [push=true] If true, use pushState (creates browser history entry); if false, use replaceState.
 */
export function updateUrlParams(updates, push = true) {
  if (typeof window === 'undefined') return
  try {
    const url = new URL(window.location.href)
    let changed = false

    Object.entries(updates).forEach(([key, value]) => {
      const current = url.searchParams.get(key)
      if (value === null || value === undefined || value === '') {
        if (current !== null) {
          url.searchParams.delete(key)
          changed = true
        }
      } else {
        const strVal = String(value)
        if (current !== strVal) {
          url.searchParams.set(key, strVal)
          changed = true
        }
      }
    })

    if (changed) {
      const stateObj = { ...window.history.state, ...updates }
      if (push) {
        window.history.pushState(stateObj, '', url.pathname + url.search + url.hash)
      } else {
        window.history.replaceState(stateObj, '', url.pathname + url.search + url.hash)
      }
    }
  } catch (e) {
    console.warn('Failed to update URL parameters:', e)
  }
}

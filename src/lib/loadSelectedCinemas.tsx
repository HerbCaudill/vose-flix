import { STORAGE_KEY_CINEMAS } from "./constants"

export function loadSelectedCinemas(): Set<string> | null {
  const stored = localStorage.getItem(STORAGE_KEY_CINEMAS)
  if (stored === null) return null
  try {
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) {
      return new Set(parsed)
    }
  } catch {
    // Invalid JSON, return null
  }
  return null
}

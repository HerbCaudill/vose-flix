import { STORAGE_KEY_CINEMAS } from "./constants"

export function loadDeselectedCinemas(): Set<string> {
  const stored = localStorage.getItem(STORAGE_KEY_CINEMAS)
  if (stored === null) return new Set()
  try {
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) {
      return new Set(parsed)
    }
  } catch {
    // Invalid JSON, return an empty set
  }
  return new Set()
}

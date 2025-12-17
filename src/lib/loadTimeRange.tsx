import { STORAGE_KEY_TIME_RANGE } from "./constants"

export function loadTimeRange(): [number, number] | null {
  const stored = localStorage.getItem(STORAGE_KEY_TIME_RANGE)
  if (stored === null) return null
  try {
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed) && parsed.length === 2) {
      return [parsed[0], parsed[1]]
    }
  } catch {
    // Invalid JSON, return null
  }
  return null
}

import { STORAGE_KEY_MIN_SCORE } from "./constants"

export function loadMinScore(): number | null {
  const stored = localStorage.getItem(STORAGE_KEY_MIN_SCORE)
  if (stored === null) return null
  const parsed = parseInt(stored, 10)
  return isNaN(parsed) ? null : parsed
}

import type { OmdbData } from "./fetchOmdbData"

const CACHE_KEY = "omdb-cache"
const CACHE_VERSION = 1

interface CacheEntry {
  data: OmdbData
  timestamp: number
}

interface OmdbCache {
  version: number
  entries: Record<string, CacheEntry>
}

function getCache(): OmdbCache {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached) as OmdbCache
      if (parsed.version === CACHE_VERSION) {
        return parsed
      }
    }
  } catch {
    // Ignore parse errors
  }
  return { version: CACHE_VERSION, entries: {} }
}

function setCache(cache: OmdbCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

export function getCachedOmdbData(title: string): OmdbData | null {
  const cache = getCache()
  const entry = cache.entries[title.toLowerCase()]
  if (entry) {
    return entry.data
  }
  return null
}

export function setCachedOmdbData(title: string, data: OmdbData): void {
  const cache = getCache()
  cache.entries[title.toLowerCase()] = {
    data,
    timestamp: Date.now(),
  }
  setCache(cache)
}

export function clearOmdbCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY)
  } catch {
    // Ignore storage errors
  }
}

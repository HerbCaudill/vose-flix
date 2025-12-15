const CACHE_KEY = "ecb-html-cache"
const CACHE_TTL = 8 * 60 * 60 * 1000 // 8 hours

interface CacheEntry {
  html: string
  timestamp: number
}

interface HtmlCache {
  entries: Record<string, CacheEntry>
}

function getCache(): HtmlCache {
  try {
    const cached = localStorage.getItem(CACHE_KEY)
    if (cached) {
      return JSON.parse(cached) as HtmlCache
    }
  } catch {
    // Ignore parse errors
  }
  return { entries: {} }
}

function setCache(cache: HtmlCache): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage errors (quota exceeded, etc.)
  }
}

export function getCachedHtml(url: string): string | null {
  const cache = getCache()
  const entry = cache.entries[url]
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.html
  }
  return null
}

export function setCachedHtml(url: string, html: string): void {
  const cache = getCache()
  cache.entries[url] = {
    html,
    timestamp: Date.now(),
  }
  setCache(cache)
}

import { CORS_PROXY } from "./constants"

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

function getCachedHtml(url: string): string | null {
  const cache = getCache()
  const entry = cache.entries[url]
  if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
    return entry.html
  }
  return null
}

function setCachedHtml(url: string, html: string): void {
  const cache = getCache()
  cache.entries[url] = {
    html,
    timestamp: Date.now(),
  }
  setCache(cache)
}

export async function fetchHtml(url: string): Promise<string> {
  // Check cache first
  const cached = getCachedHtml(url)
  if (cached) {
    return cached
  }

  console.log(`[fetch] ${url}`)
  const response = await fetch(CORS_PROXY + encodeURIComponent(url))
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: ${response.status}`)
  }
  const html = await response.text()

  // Cache the response
  setCachedHtml(url, html)

  return html
}

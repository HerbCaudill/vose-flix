import { OMDB_API_KEY } from "./constants"

export interface OmdbData {
  imdb?: { score: number; votes: number }
  rottenTomatoes?: { critics: number }
  metacritic?: number
  posterUrl?: string
  year?: number
}

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

function getCachedData(title: string): OmdbData | null {
  const cache = getCache()
  const entry = cache.entries[title.toLowerCase()]
  if (entry) {
    return entry.data
  }
  return null
}

function setCachedData(title: string, data: OmdbData): void {
  const cache = getCache()
  cache.entries[title.toLowerCase()] = {
    data,
    timestamp: Date.now(),
  }
  setCache(cache)
}

export async function fetchOmdbData(title: string): Promise<OmdbData> {
  // Check cache first
  const cached = getCachedData(title)
  if (cached) {
    return cached
  }

  const result: OmdbData = {}
  try {
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}`
    console.log(`[fetch] OMDB: ${title}`)
    const response = await fetch(url)
    const data = await response.json()

    if (data.Response === "True") {
      // Extract IMDB rating
      if (data.imdbRating && data.imdbRating !== "N/A") {
        result.imdb = {
          score: parseFloat(data.imdbRating),
          votes: parseInt(data.imdbVotes?.replace(/,/g, "") || "0", 10),
        }
      }

      // Extract ratings from the Ratings array (includes RT and Metacritic)
      if (data.Ratings && Array.isArray(data.Ratings)) {
        for (const rating of data.Ratings) {
          if (rating.Source === "Rotten Tomatoes" && rating.Value) {
            const rtMatch = rating.Value.match(/(\d+)%/)
            if (rtMatch) {
              result.rottenTomatoes = { critics: parseInt(rtMatch[1], 10) }
            }
          }
          if (rating.Source === "Metacritic" && rating.Value) {
            const mcMatch = rating.Value.match(/(\d+)\/100/)
            if (mcMatch) {
              result.metacritic = parseInt(mcMatch[1], 10)
            }
          }
        }
      }

      // Also check Metascore field as fallback
      if (!result.metacritic && data.Metascore && data.Metascore !== "N/A") {
        result.metacritic = parseInt(data.Metascore, 10)
      }

      if (data.Poster && data.Poster !== "N/A") {
        result.posterUrl = data.Poster
      }

      if (data.Year && data.Year !== "N/A") {
        // Year can be "2024" or "2024–" (for series), extract first year
        const yearMatch = data.Year.match(/(\d{4})/)
        if (yearMatch) {
          result.year = parseInt(yearMatch[1], 10)
        }
      }

      // Cache successful response
      setCachedData(title, result)
    }
  } catch (error) {
    console.error("Failed to fetch OMDB data:", error)
  }
  return result
}

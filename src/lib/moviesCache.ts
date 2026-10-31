import type { Movie } from "@/types"

const MOVIES_CACHE_KEY = "sensacine-movies-cache-v2"
const MOVIES_CACHE_TTL = 8 * 60 * 60 * 1000 // 8 hours
// Left behind by earlier versions; the HTML cache could fill localStorage
const LEGACY_CACHE_KEYS = ["movies-cache", "ecb-html-cache", "sensacine-movies-cache"]

interface MoviesCache {
  movies: Movie[]
  timestamp: number
}

export function getCachedMovies(): Movie[] | null {
  try {
    const cached = localStorage.getItem(MOVIES_CACHE_KEY)
    if (cached) {
      const parsed = JSON.parse(cached) as MoviesCache
      if (Date.now() - parsed.timestamp < MOVIES_CACHE_TTL) {
        return parsed.movies
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null
}

export function setCachedMovies(movies: Movie[]): void {
  try {
    LEGACY_CACHE_KEYS.forEach(key => localStorage.removeItem(key))
    const cache: MoviesCache = { movies, timestamp: Date.now() }
    localStorage.setItem(MOVIES_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage errors
  }
}

export function clearMoviesCache(): void {
  try {
    localStorage.removeItem(MOVIES_CACHE_KEY)
  } catch {
    // Ignore storage errors
  }
}

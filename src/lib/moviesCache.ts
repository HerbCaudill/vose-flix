import type { Movie } from "@/types"

const MOVIES_CACHE_KEY = "movies-cache"
const MOVIES_CACHE_TTL = 8 * 60 * 60 * 1000 // 8 hours

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
    const cache: MoviesCache = { movies, timestamp: Date.now() }
    localStorage.setItem(MOVIES_CACHE_KEY, JSON.stringify(cache))
  } catch {
    // Ignore storage errors
  }
}

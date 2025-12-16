import { useState, useEffect, useCallback } from "react"
import type { Movie } from "@/types"
import { fetchMovieList } from "@/lib/fetchMovieList"
import { fetchMovieDetails } from "@/lib/fetchMovieDetails"
import { fetchOmdbData, type OmdbData } from "@/lib/fetchOmdbData"
import { fetchTmdbTrailer } from "@/lib/fetchTmdbTrailer"
import { getCachedMovies, setCachedMovies, clearMoviesCache } from "@/lib/moviesCache"
import { clearOmdbCache } from "@/lib/omdbCache"
import { clearHtmlCache } from "@/lib/htmlCache"
import { sortMovies } from "@/lib/sortMovies"

const BATCH_SIZE = 3

function mergeOmdbData(movie: Movie, omdb: OmdbData): Movie {
  // Ratings (use OMDB as fallback if not scraped from website)
  if (omdb.imdb) movie.ratings.imdb = omdb.imdb
  if (omdb.rottenTomatoes && !movie.ratings.rottenTomatoes) {
    movie.ratings.rottenTomatoes = omdb.rottenTomatoes
  }
  if (omdb.metacritic && !movie.ratings.metacritic) {
    movie.ratings.metacritic = omdb.metacritic
  }

  return {
    ...movie,
    ...omdb,
    imdbId: omdb.imdb?.id,
  }
}

async function enrichMovieDetails(slug: string): Promise<Movie | null> {
  const movie = await fetchMovieDetails(slug)
  if (!movie) return null

  // Fetch trailer from TMDB
  movie.trailerKey = (await fetchTmdbTrailer(movie.title, movie.year)) || undefined

  // Fetch and merge OMDB data
  const omdbData = await fetchOmdbData(movie.title)
  return mergeOmdbData(movie, omdbData)
}

interface UseMoviesResult {
  movies: Movie[]
  loading: boolean
  error: string | null
  refresh: () => void
}

export function useMovies(): UseMoviesResult {
  const [movies, setMovies] = useState<Movie[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadMovies = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Check for cached movies first
      const cached = getCachedMovies()
      if (cached) {
        setMovies(cached)
        setLoading(false)
        return
      }

      const movieList = await fetchMovieList()
      const detailedMovies: Movie[] = []

      // Process in batches to avoid overwhelming servers
      for (let i = 0; i < movieList.length; i += BATCH_SIZE) {
        const batch = movieList.slice(i, i + BATCH_SIZE)
        const results = await Promise.all(batch.map(item => enrichMovieDetails(item.slug)))

        for (const movie of results) {
          if (movie) detailedMovies.push(movie)
        }

        // Update progressively so user sees results faster
        setMovies(sortMovies(detailedMovies))
      }

      setCachedMovies(sortMovies(detailedMovies))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load movies")
    } finally {
      setLoading(false)
    }
  }, [])

  const refresh = useCallback(() => {
    clearMoviesCache()
    clearOmdbCache()
    clearHtmlCache()
    loadMovies()
  }, [loadMovies])

  useEffect(() => {
    loadMovies()
  }, [loadMovies])

  return { movies, loading, error, refresh }
}

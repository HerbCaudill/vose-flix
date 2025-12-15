import { useState, useEffect, useCallback } from "react"
import type { Movie } from "@/types"
import { fetchMovieList, fetchMovieDetails, fetchOmdbData } from "@/lib/scraper"
import { getCachedMovies, setCachedMovies } from "@/lib/moviesCache"
import { sortMovies } from "@/lib/sortMovies"

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
      // Check for cached movies first - instant load
      const cached = getCachedMovies()
      if (cached) {
        setMovies(cached)
        setLoading(false)
        return
      }

      // First, get the list of movies
      const movieList = await fetchMovieList()

      // Process movies - use smaller batches to avoid overwhelming servers
      const detailedMovies: Movie[] = []
      const batchSize = 3

      for (let i = 0; i < movieList.length; i += batchSize) {
        const batch = movieList.slice(i, i + batchSize)
        const results = await Promise.all(
          batch.map(async item => {
            const details = await fetchMovieDetails(item.slug)
            if (details) {
              // Fetch OMDB data for ratings and poster
              const omdbData = await fetchOmdbData(details.title)
              if (omdbData.imdb) {
                details.ratings.imdb = omdbData.imdb
              }
              // Use OMDB Rotten Tomatoes if not scraped from website
              if (omdbData.rottenTomatoes && !details.ratings.rottenTomatoes) {
                details.ratings.rottenTomatoes = omdbData.rottenTomatoes
              }
              // Use OMDB Metacritic if not scraped from website
              if (omdbData.metacritic && !details.ratings.metacritic) {
                details.ratings.metacritic = omdbData.metacritic
              }
              // Prefer OMDB poster as it's usually better quality
              if (omdbData.posterUrl) {
                details.posterUrl = omdbData.posterUrl
              }
              // Add year
              if (omdbData.year) {
                details.year = omdbData.year
              }
            }
            return details
          })
        )

        for (const movie of results) {
          if (movie) {
            detailedMovies.push(movie)
          }
        }

        // Update state progressively so user sees results faster
        setMovies(sortMovies(detailedMovies))
      }

      // Cache the final result
      setCachedMovies(sortMovies(detailedMovies))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load movies")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadMovies()
  }, [loadMovies])

  return { movies, loading, error, refresh: loadMovies }
}

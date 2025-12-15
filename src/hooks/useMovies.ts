import { useState, useEffect, useCallback } from "react"
import type { Movie } from "@/types"
import { fetchMovieList, fetchMovieDetails, fetchOmdbData } from "@/lib/scraper"

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
      // First, get the list of movies
      const movieList = await fetchMovieList()

      // Then fetch details for each movie (in parallel, but limited)
      const detailedMovies: Movie[] = []

      // Process in batches of 5 to avoid overwhelming the server
      const batchSize = 5
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
            }
            return details
          })
        )

        for (const movie of results) {
          if (movie) {
            detailedMovies.push(movie)
          }
        }

        // Update state progressively
        setMovies([...detailedMovies])
      }
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

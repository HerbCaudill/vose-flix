import { useState, useEffect, useCallback } from "react"
import type { Movie, Ratings } from "@/types"
import { fetchMovieList, fetchMovieDetails, fetchOmdbData } from "@/lib/scraper"

// Calculate normalized score from 0-100 based on available ratings
function calculateNormalizedScore(ratings: Ratings): number | null {
  const scores: number[] = []

  if (ratings.rottenTomatoes?.critics != null) {
    scores.push(ratings.rottenTomatoes.critics) // Already 0-100
  }
  if (ratings.metacritic != null) {
    scores.push(ratings.metacritic) // Already 0-100
  }
  if (ratings.imdb?.score != null) {
    scores.push(ratings.imdb.score * 10) // Convert 0-10 to 0-100
  }

  if (scores.length === 0) return null
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

// Sort movies by year (descending) then by normalized score (descending)
function sortMovies(movies: Movie[]): Movie[] {
  return [...movies].sort((a, b) => {
    // First sort by year (descending, with no-year movies at the end)
    const yearA = a.year ?? 0
    const yearB = b.year ?? 0
    if (yearA !== yearB) {
      return yearB - yearA
    }

    // Then sort by normalized score (descending, with no-score movies at the end)
    const scoreA = calculateNormalizedScore(a.ratings) ?? -1
    const scoreB = calculateNormalizedScore(b.ratings) ?? -1
    return scoreB - scoreA
  })
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

        // Update state progressively (sorted)
        setMovies(sortMovies(detailedMovies))
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

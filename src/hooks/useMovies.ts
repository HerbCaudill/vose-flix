import { useState, useEffect, useCallback } from "react"
import type { Movie } from "@/types"
import { fetchMovieList } from "@/lib/fetchMovieList"
import { fetchMovieDetails } from "@/lib/fetchMovieDetails"
import { fetchOmdbData } from "@/lib/fetchOmdbData"
import { fetchTmdbTrailer } from "@/lib/fetchTmdbTrailer"
import { getCachedMovies, setCachedMovies, clearMoviesCache } from "@/lib/moviesCache"
import { clearOmdbCache } from "@/lib/omdbCache"
import { clearHtmlCache } from "@/lib/htmlCache"
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
              // Add additional OMDB fields
              if (omdbData.rated) {
                details.rated = omdbData.rated
              }
              if (omdbData.released) {
                details.released = omdbData.released
              }
              if (omdbData.director) {
                details.director = omdbData.director
              }
              if (omdbData.writer) {
                details.writer = omdbData.writer
              }
              if (omdbData.actors) {
                details.actors = omdbData.actors
              }
              if (omdbData.plot) {
                details.plot = omdbData.plot
              }
              if (omdbData.language) {
                details.language = omdbData.language
              }
              if (omdbData.country) {
                details.country = omdbData.country
              }
              if (omdbData.awards) {
                details.awards = omdbData.awards
              }
              if (omdbData.boxOffice) {
                details.boxOffice = omdbData.boxOffice
              }
              if (omdbData.imdb?.id) {
                details.imdbId = omdbData.imdb.id
              }

              // Fetch trailer from TMDB
              const trailerKey = await fetchTmdbTrailer(details.title, details.year)
              if (trailerKey) {
                details.trailerKey = trailerKey
              }
            }
            return details
          }),
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

import { useState, useEffect, useCallback, useMemo } from "react"
import { useMovies } from "@/hooks/useMovies"
import { MovieGrid } from "@/components/MovieGrid"
import { MovieDetail } from "@/components/MovieDetail"
import { DateSelector } from "@/components/DateSelector"
import { Button } from "@/components/ui/button"
import type { Movie } from "@/types"
import { RefreshCw, Film } from "lucide-react"

function getToday(): string {
  return new Date().toISOString().split("T")[0]
}

function getStateFromUrl(): { movieSlug: string | null; date: string } {
  const path = window.location.pathname

  // URL format: /{date}/{movie-slug}
  const movieMatch = path.match(/^\/(\d{4}-\d{2}-\d{2})\/(.+)$/)
  if (movieMatch) {
    return {
      date: movieMatch[1],
      movieSlug: decodeURIComponent(movieMatch[2]),
    }
  }

  // URL format: /{date}
  const dateMatch = path.match(/^\/(\d{4}-\d{2}-\d{2})\/?$/)
  if (dateMatch) {
    return {
      date: dateMatch[1],
      movieSlug: null,
    }
  }

  // Default to today
  return { movieSlug: null, date: getToday() }
}

export default function App() {
  const { movies, loading, error, refresh } = useMovies()
  const [urlState, setUrlState] = useState(getStateFromUrl)

  // Get all available dates from all movies
  const today = getToday()
  const availableDates = useMemo(() => {
    const dates = new Set<string>()
    for (const movie of movies) {
      for (const showtime of movie.showtimes) {
        if (showtime.date >= today) {
          dates.add(showtime.date)
        }
      }
    }
    return [...dates].sort()
  }, [movies, today])

  // Ensure selected date is valid
  const selectedDate =
    availableDates.includes(urlState.date) ? urlState.date : availableDates[0] || today

  // Find movie by slug
  const selectedMovie =
    urlState.movieSlug ? movies.find(m => m.slug === urlState.movieSlug) || null : null

  // Filter movies that have showtimes on selected date
  const moviesForDate = useMemo(() => {
    return movies.filter(movie => movie.showtimes.some(s => s.date === selectedDate))
  }, [movies, selectedDate])

  // Redirect to today's date on initial load if at root
  useEffect(() => {
    if (window.location.pathname === "/" && availableDates.length > 0) {
      const targetDate = availableDates.includes(today) ? today : availableDates[0]
      window.history.replaceState({}, "", `/${targetDate}`)
      setUrlState({ movieSlug: null, date: targetDate })
    }
  }, [availableDates, today])

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      setUrlState(getStateFromUrl())
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const setSelectedDate = useCallback(
    (date: string) => {
      if (urlState.movieSlug) {
        window.history.pushState({}, "", `/${date}/${encodeURIComponent(urlState.movieSlug)}`)
      } else {
        window.history.pushState({}, "", `/${date}`)
      }
      setUrlState(prev => ({ ...prev, date }))
    },
    [urlState.movieSlug],
  )

  const selectMovie = useCallback(
    (movie: Movie | null) => {
      if (movie) {
        window.history.pushState({}, "", `/${selectedDate}/${encodeURIComponent(movie.slug)}`)
        setUrlState(prev => ({ ...prev, movieSlug: movie.slug }))
      } else {
        window.history.pushState({}, "", `/${selectedDate}`)
        setUrlState(prev => ({ ...prev, movieSlug: null }))
      }
    },
    [selectedDate],
  )

  if (selectedMovie) {
    return (
      <MovieDetail
        movie={selectedMovie}
        selectedDate={selectedDate}
        availableDates={availableDates}
        onDateChange={setSelectedDate}
        onBack={() => selectMovie(null)}
      />
    )
  }

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <header className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="text-primary h-6 w-6" />
              <h1 className="text-xl font-bold">VOSEflix</h1>
              <span className="text-muted-foreground hidden text-sm sm:inline">
                Barcelona movies with the original audio
              </span>
            </div>
            <div className="flex items-center gap-4">
              <DateSelector
                availableDates={availableDates}
                selectedDate={selectedDate}
                onDateChange={setSelectedDate}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={refresh}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="bg-destructive/10 text-destructive mb-6 rounded-lg p-4">
            <p className="font-medium">Error loading movies</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            {loading ? "Loading movies..." : `${moviesForDate.length} movies showing`}
          </p>
        </div>

        <MovieGrid movies={moviesForDate} loading={loading} onMovieClick={selectMovie} />
      </main>

      {/* Footer */}
      <footer className="text-muted-foreground border-t py-6 text-center text-sm">
        <p>
          Data from{" "}
          <a
            href="https://englishcinemabarcelona.com"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-foreground underline"
          >
            English Cinema Barcelona
          </a>
        </p>
        <p className="mt-1">Ratings from Rotten Tomatoes, Metacritic, and IMDB</p>
      </footer>
    </div>
  )
}

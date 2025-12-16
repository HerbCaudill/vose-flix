import { useState, useEffect, useCallback, useMemo } from "react"
import { useMovies } from "@/hooks/useMovies"
import { MovieGrid } from "@/components/MovieGrid"
import { MovieDetail } from "@/components/MovieDetail"
import { Header } from "@/components/Header"
import type { Cinema, Movie } from "@/types"
import { calculateNormalizedScore } from "@/lib/calculateNormalizedScore"

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

const STORAGE_KEY_MIN_SCORE = "voseflix-minScore"
const STORAGE_KEY_CINEMAS = "voseflix-selectedCinemas"
const STORAGE_KEY_TIME_RANGE = "voseflix-timeRange"

// Default time range: 12:00 (720 min) to 24:00 (1440 min)
const DEFAULT_TIME_RANGE: [number, number] = [720, 1440]

function loadMinScore(): number | null {
  const stored = localStorage.getItem(STORAGE_KEY_MIN_SCORE)
  if (stored === null) return null
  const parsed = parseInt(stored, 10)
  return isNaN(parsed) ? null : parsed
}

function loadSelectedCinemas(): Set<string> | null {
  const stored = localStorage.getItem(STORAGE_KEY_CINEMAS)
  if (stored === null) return null
  try {
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed)) {
      return new Set(parsed)
    }
  } catch {
    // Invalid JSON, return null
  }
  return null
}

function loadTimeRange(): [number, number] | null {
  const stored = localStorage.getItem(STORAGE_KEY_TIME_RANGE)
  if (stored === null) return null
  try {
    const parsed = JSON.parse(stored)
    if (Array.isArray(parsed) && parsed.length === 2) {
      return [parsed[0], parsed[1]]
    }
  } catch {
    // Invalid JSON, return null
  }
  return null
}

// Convert "HH:MM" to minutes from midnight
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

export default function App() {
  const { movies, loading, error, refresh } = useMovies()
  const [urlState, setUrlState] = useState(getStateFromUrl)
  const [minScore, setMinScore] = useState<number | null>(loadMinScore)
  const [selectedCinemas, setSelectedCinemas] = useState<Set<string>>(
    () => loadSelectedCinemas() ?? new Set(),
  )
  const [timeRange, setTimeRange] = useState<[number, number]>(
    () => loadTimeRange() ?? DEFAULT_TIME_RANGE,
  )

  // Get all unique cinemas from movies
  const allCinemas = useMemo(() => {
    const cinemaMap = new Map<string, Cinema>()
    for (const movie of movies) {
      for (const showtime of movie.showtimes) {
        cinemaMap.set(showtime.cinema.id, showtime.cinema)
      }
    }
    return [...cinemaMap.values()].sort((a, b) => a.name.localeCompare(b.name))
  }, [movies])

  // Initialize selected cinemas when cinemas are loaded (only if no stored preference)
  useEffect(() => {
    if (allCinemas.length > 0 && selectedCinemas.size === 0 && loadSelectedCinemas() === null) {
      setSelectedCinemas(new Set(allCinemas.map(c => c.id)))
    }
  }, [allCinemas, selectedCinemas.size])

  // Persist minScore to localStorage
  useEffect(() => {
    if (minScore === null) {
      localStorage.removeItem(STORAGE_KEY_MIN_SCORE)
    } else {
      localStorage.setItem(STORAGE_KEY_MIN_SCORE, String(minScore))
    }
  }, [minScore])

  // Persist selectedCinemas to localStorage
  useEffect(() => {
    if (selectedCinemas.size === 0) {
      localStorage.removeItem(STORAGE_KEY_CINEMAS)
    } else {
      localStorage.setItem(STORAGE_KEY_CINEMAS, JSON.stringify([...selectedCinemas]))
    }
  }, [selectedCinemas])

  // Persist timeRange to localStorage
  useEffect(() => {
    if (timeRange[0] === DEFAULT_TIME_RANGE[0] && timeRange[1] === DEFAULT_TIME_RANGE[1]) {
      localStorage.removeItem(STORAGE_KEY_TIME_RANGE)
    } else {
      localStorage.setItem(STORAGE_KEY_TIME_RANGE, JSON.stringify(timeRange))
    }
  }, [timeRange])

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

  // Filter movies that have showtimes on selected date, meet minimum score, are at selected cinemas, and within time range
  const moviesForDate = useMemo(() => {
    return movies.filter(movie => {
      // Check if movie has showtimes on selected date at selected cinemas within time range
      const hasShowtimes = movie.showtimes.some(s => {
        if (s.date !== selectedDate) return false
        if (!selectedCinemas.has(s.cinema.id)) return false
        const startMinutes = timeToMinutes(s.time)
        const endMinutes = startMinutes + movie.duration
        return startMinutes >= timeRange[0] && endMinutes <= timeRange[1]
      })
      if (!hasShowtimes) return false
      if (minScore === null) return true
      const score = calculateNormalizedScore(movie.ratings)
      return score !== null && score >= minScore
    })
  }, [movies, selectedDate, minScore, selectedCinemas, timeRange])

  // Update URL to reflect today's date (but don't redirect if at root for PWA compatibility)
  useEffect(() => {
    if (window.location.pathname === "/" && availableDates.length > 0) {
      const targetDate = availableDates.includes(today) ? today : availableDates[0]
      // Only update state, don't change URL - keeps "/" for PWA home screen
      setUrlState(prev => prev.date !== targetDate ? { ...prev, date: targetDate } : prev)
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
      window.scrollTo(0, 0)
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
        minScore={minScore}
        onMinScoreChange={setMinScore}
        cinemas={allCinemas}
        selectedCinemas={selectedCinemas}
        onSelectedCinemasChange={setSelectedCinemas}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        loading={loading}
        onRefresh={refresh}
        onBack={() => selectMovie(null)}
      />
    )
  }

  return (
    <div className="bg-background min-h-screen">
      <Header
        availableDates={availableDates}
        selectedDate={selectedDate}
        onDateChange={setSelectedDate}
        minScore={minScore}
        onMinScoreChange={setMinScore}
        cinemas={allCinemas}
        selectedCinemas={selectedCinemas}
        onSelectedCinemasChange={setSelectedCinemas}
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
        loading={loading}
        onRefresh={refresh}
      />

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

        <MovieGrid
          movies={moviesForDate}
          loading={loading}
          onMovieClick={selectMovie}
          selectedDate={selectedDate}
          selectedCinemas={selectedCinemas}
          timeRange={timeRange}
        />
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
      </footer>
    </div>
  )
}

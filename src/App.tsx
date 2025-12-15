import { useState, useEffect, useCallback } from "react"
import { useMovies } from "@/hooks/useMovies"
import { MovieGrid } from "@/components/MovieGrid"
import { MovieDetail } from "@/components/MovieDetail"
import { Button } from "@/components/ui/button"
import type { Movie } from "@/types"
import { RefreshCw, Film } from "lucide-react"

function getStateFromUrl(): { movieSlug: string | null; date: string | null } {
  const params = new URLSearchParams(window.location.search)
  return {
    movieSlug: params.get("movie"),
    date: params.get("date"),
  }
}

export default function App() {
  const { movies, loading, error, refresh } = useMovies()
  const [urlState, setUrlState] = useState(getStateFromUrl)

  // Find movie by slug
  const selectedMovie = urlState.movieSlug
    ? movies.find(m => m.slug === urlState.movieSlug) || null
    : null

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      setUrlState(getStateFromUrl())
    }
    window.addEventListener("popstate", handlePopState)
    return () => window.removeEventListener("popstate", handlePopState)
  }, [])

  const selectMovie = useCallback((movie: Movie | null) => {
    if (movie) {
      const today = new Date().toISOString().split("T")[0]
      const params = new URLSearchParams({ movie: movie.slug, date: today })
      window.history.pushState({}, "", `?${params}`)
      setUrlState({ movieSlug: movie.slug, date: today })
    } else {
      window.history.pushState({}, "", window.location.pathname)
      setUrlState({ movieSlug: null, date: null })
    }
  }, [])

  const setSelectedDate = useCallback((date: string) => {
    if (urlState.movieSlug) {
      const params = new URLSearchParams({ movie: urlState.movieSlug, date })
      window.history.pushState({}, "", `?${params}`)
      setUrlState(prev => ({ ...prev, date }))
    }
  }, [urlState.movieSlug])

  if (selectedMovie) {
    return (
      <MovieDetail
        movie={selectedMovie}
        selectedDate={urlState.date}
        onDateChange={setSelectedDate}
        onBack={() => selectMovie(null)}
      />
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Film className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">Vose-Flix</h1>
              <span className="hidden sm:inline text-sm text-muted-foreground">
                Non-dubbed movies in Barcelona
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={refresh} disabled={loading} className="gap-2">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-6">
        {error && (
          <div className="mb-6 rounded-lg bg-destructive/10 p-4 text-destructive">
            <p className="font-medium">Error loading movies</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        <div className="mb-4 flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {loading ? "Loading movies..." : `${movies.length} movies showing in VOSE`}
          </p>
        </div>

        <MovieGrid movies={movies} loading={loading} onMovieClick={selectMovie} />
      </main>

      {/* Footer */}
      <footer className="border-t py-6 text-center text-sm text-muted-foreground">
        <p>
          Data from{" "}
          <a
            href="https://englishcinemabarcelona.com"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-foreground"
          >
            English Cinema Barcelona
          </a>
        </p>
        <p className="mt-1">
          Ratings from Rotten Tomatoes, Metacritic, and IMDB
        </p>
      </footer>
    </div>
  )
}

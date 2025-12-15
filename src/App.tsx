import { useState } from "react"
import { useMovies } from "@/hooks/useMovies"
import { MovieGrid } from "@/components/MovieGrid"
import { MovieDetail } from "@/components/MovieDetail"
import { Button } from "@/components/ui/button"
import type { Movie } from "@/types"
import { RefreshCw, Film } from "lucide-react"

export default function App() {
  const { movies, loading, error, refresh } = useMovies()
  const [selectedMovie, setSelectedMovie] = useState<Movie | null>(null)

  if (selectedMovie) {
    return <MovieDetail movie={selectedMovie} onBack={() => setSelectedMovie(null)} />
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

        <MovieGrid movies={movies} loading={loading} onMovieClick={setSelectedMovie} />
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

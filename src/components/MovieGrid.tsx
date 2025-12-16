import { MovieCard } from "./MovieCard"
import { Skeleton } from "@/components/ui/skeleton"
import type { Movie } from "@/types"

interface MovieGridProps {
  movies: Movie[]
  loading: boolean
  onMovieClick: (movie: Movie) => void
  selectedDate: string
  selectedCinemas: Set<string>
}

export function MovieGrid({ movies, loading, onMovieClick, selectedDate, selectedCinemas }: MovieGridProps) {
  if (loading && movies.length === 0) {
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {Array.from({ length: 12 }).map((_, i) => (
          <MovieCardSkeleton key={i} />
        ))}
      </div>
    )
  }

  if (movies.length === 0) {
    return (
      <div className="text-muted-foreground flex flex-col items-center justify-center py-12">
        <p className="text-lg">No movies found</p>
        <p className="text-sm">Check back later for updated listings</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {movies.map(movie => (
        <MovieCard key={movie.id} movie={movie} onClick={() => onMovieClick(movie)} selectedDate={selectedDate} selectedCinemas={selectedCinemas} />
      ))}
      {loading &&
        Array.from({ length: 3 }).map((_, i) => <MovieCardSkeleton key={`skeleton-${i}`} />)}
    </div>
  )
}

function MovieCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-lg">
      <Skeleton className="aspect-2/3 w-full" />
      <div className="space-y-2 p-3">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  )
}

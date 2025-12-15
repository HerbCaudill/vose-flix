import { Card, CardContent } from "@/components/ui/card"
import { RatingBadge } from "@/components/RatingBadge"
import { formatDuration } from "@/lib/formatDuration"
import type { Movie } from "@/types"

interface MovieCardProps {
  movie: Movie
  onClick?: () => void
}

export function MovieCard({ movie, onClick }: MovieCardProps) {
  const { ratings } = movie

  // Get today's showtimes
  const today = new Date().toISOString().split("T")[0]
  const todayShowtimes = movie.showtimes.filter(s => s.date === today)
  const cinemaCount = new Set(todayShowtimes.map(s => s.cinema.id)).size

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:scale-[1.02] hover:shadow-xl gap-0 py-0"
      onClick={onClick}
    >
      <div className="bg-muted relative aspect-[2/3] overflow-hidden">
        {movie.posterUrl ?
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        : <div className="text-muted-foreground flex h-full items-center justify-center">
            No poster
          </div>
        }

        {/* Rating badges overlay */}
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          {ratings.rottenTomatoes && (
            <RatingBadge
              type="rt"
              value={ratings.rottenTomatoes.critics}
              label={`${ratings.rottenTomatoes.critics}%`}
            />
          )}
          {ratings.metacritic && (
            <RatingBadge
              type="mc"
              value={ratings.metacritic}
              label={ratings.metacritic.toString()}
            />
          )}
          {ratings.imdb && (
            <RatingBadge
              type="imdb"
              value={ratings.imdb.score * 10}
              label={ratings.imdb.score.toFixed(1)}
            />
          )}
        </div>
      </div>

      <CardContent className="p-3">
        <h3 className="line-clamp-2 leading-tight font-semibold">{movie.title}</h3>
        <div className="text-muted-foreground mt-1 flex items-center gap-2 text-sm">
          {movie.year && <span>{movie.year}</span>}
          {movie.year && movie.duration > 0 && <span>•</span>}
          {movie.duration > 0 && <span>{formatDuration(movie.duration)}</span>}
          {movie.genres.length > 0 && (
            <>
              <span>•</span>
              <span className="truncate">{movie.genres.slice(0, 2).join(", ")}</span>
            </>
          )}
        </div>
        {todayShowtimes.length > 0 && (
          <div className="text-muted-foreground mt-2 text-xs">
            {todayShowtimes.length} showings at {cinemaCount} cinema{cinemaCount !== 1 ? "s" : ""}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

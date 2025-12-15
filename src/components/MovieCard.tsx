import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
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
      className="group cursor-pointer overflow-hidden transition-all hover:scale-[1.02] hover:shadow-xl"
      onClick={onClick}
    >
      <div className="relative aspect-[2/3] overflow-hidden bg-muted">
        {movie.posterUrl ? (
          <img
            src={movie.posterUrl}
            alt={movie.title}
            className="h-full w-full object-cover transition-transform group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground">
            No poster
          </div>
        )}

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
            <RatingBadge type="mc" value={ratings.metacritic} label={ratings.metacritic.toString()} />
          )}
          {ratings.imdb && (
            <RatingBadge type="imdb" value={ratings.imdb.score * 10} label={ratings.imdb.score.toFixed(1)} />
          )}
        </div>
      </div>

      <CardContent className="p-3">
        <h3 className="line-clamp-2 font-semibold leading-tight">{movie.title}</h3>
        <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
          {movie.duration > 0 && <span>{formatDuration(movie.duration)}</span>}
          {movie.genres.length > 0 && (
            <>
              <span>•</span>
              <span className="truncate">{movie.genres.slice(0, 2).join(", ")}</span>
            </>
          )}
        </div>
        {todayShowtimes.length > 0 && (
          <div className="mt-2 text-xs text-muted-foreground">
            {todayShowtimes.length} showings at {cinemaCount} cinema{cinemaCount !== 1 ? "s" : ""} today
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface RatingBadgeProps {
  type: "rt" | "mc" | "imdb"
  value: number // normalized 0-100
  label: string
}

function RatingBadge({ type, value, label }: RatingBadgeProps) {
  const colors = {
    rt: value >= 60 ? "bg-red-600" : "bg-green-600",
    mc: value >= 60 ? "bg-green-600" : value >= 40 ? "bg-yellow-500" : "bg-red-600",
    imdb: value >= 70 ? "bg-yellow-500" : value >= 50 ? "bg-yellow-600" : "bg-yellow-700",
  }

  const icons = {
    rt: "🍅",
    mc: "M",
    imdb: "★",
  }

  return (
    <Badge className={`${colors[type]} text-white text-xs font-bold shadow-md`}>
      <span className="mr-1">{icons[type]}</span>
      {label}
    </Badge>
  )
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

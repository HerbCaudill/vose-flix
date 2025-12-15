import { Card, CardContent } from "@/components/ui/card"
import { MovieMeta } from "@/components/MovieMeta"
import type { Movie } from "@/types"
import { Popcorn, Projector } from "lucide-react"

interface MovieCardProps {
  movie: Movie
  onClick?: () => void
}

export function MovieCard({ movie, onClick }: MovieCardProps) {
  // Get today's showtimes
  const today = new Date().toISOString().split("T")[0]
  const todayShowtimes = movie.showtimes.filter(s => s.date === today)
  const cinemaCount = new Set(todayShowtimes.map(s => s.cinema.id)).size

  return (
    <Card
      className="group cursor-pointer overflow-hidden transition-all hover:scale-[1.02] hover:shadow-xl gap-0 py-0"
      onClick={onClick}
    >
      <div className="bg-muted aspect-[2/3] overflow-hidden">
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
      </div>

      <CardContent className="p-3">
        <h3 className="line-clamp-2 leading-tight font-semibold mb-2">{movie.title}</h3>
        <MovieMeta
          year={movie.year}
          duration={movie.duration}
          ratings={movie.ratings}
        />
        {todayShowtimes.length > 0 && (
          <div className="text-muted-foreground mt-2 text-xs space-y-0.5">
            <div className="flex items-center gap-1">
              <Popcorn className="h-3 w-3" />
              {todayShowtimes.length} showing{todayShowtimes.length !== 1 ? "s" : ""}
            </div>
            <div className="flex items-center gap-1">
              <Projector className="h-3 w-3" />
              {cinemaCount} cinema{cinemaCount !== 1 ? "s" : ""}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

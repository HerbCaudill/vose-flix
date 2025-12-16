import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MovieMeta } from "@/components/MovieMeta"
import type { Movie } from "@/types"

interface MovieCardProps {
  movie: Movie
  onClick?: () => void
}

export function MovieCard({ movie, onClick }: MovieCardProps) {
  // Get today's showtimes sorted by time
  const today = new Date().toISOString().split("T")[0]
  const todayShowtimes = movie.showtimes
    .filter(s => s.date === today)
    .sort((a, b) => a.time.localeCompare(b.time))

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
          <div className="mt-3 flex flex-col gap-1">
            {todayShowtimes.map((showtime, i) => (
              <a
                key={i}
                href={showtime.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                className="w-fit"
              >
                <Button variant="outline" size="sm" className="h-6 px-2 text-xs gap-1">
                  <span className="font-semibold">{showtime.time}</span>
                  <span className="text-muted-foreground">{showtime.cinema.name}</span>
                </Button>
              </a>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MovieMeta } from "@/components/MovieMeta"
import { groupShowtimesByCinema } from "@/lib/groupShowtimesByCinema"
import type { Movie } from "@/types"

interface MovieCardProps {
  movie: Movie
  onClick?: () => void
}

export function MovieCard({ movie, onClick }: MovieCardProps) {
  // Get today's showtimes
  const today = new Date().toISOString().split("T")[0]
  const todayShowtimes = movie.showtimes.filter(s => s.date === today)
  const showtimesByCinema = groupShowtimesByCinema(todayShowtimes)

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
        {showtimesByCinema.length > 0 && (
          <div className="mt-3 space-y-2">
            {showtimesByCinema.map(({ cinema, times }) => (
              <div key={cinema.id}>
                <div className="text-muted-foreground text-xs mb-1">{cinema.name}</div>
                <div className="flex flex-wrap gap-1">
                  {times.map((showtime, i) => (
                    <a
                      key={i}
                      href={showtime.bookingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={e => e.stopPropagation()}
                    >
                      <Button variant="outline" size="sm" className="h-6 px-2 text-xs">
                        {showtime.time}
                      </Button>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

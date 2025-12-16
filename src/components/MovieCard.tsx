import { Card, CardContent } from "@/components/ui/card"
import { MovieMeta } from "@/components/MovieMeta"
import { ShowtimesList } from "@/components/ShowtimesList"
import type { Movie } from "@/types"

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

interface MovieCardProps {
  movie: Movie
  onClick?: () => void
  selectedDate: string
  selectedCinemas: Set<string>
  timeRange: [number, number]
}

export function MovieCard({ movie, onClick, selectedDate, selectedCinemas, timeRange }: MovieCardProps) {
  // Get showtimes for the selected date, cinemas, and time range
  const filteredShowtimes = movie.showtimes.filter(s => {
    if (s.date !== selectedDate) return false
    if (!selectedCinemas.has(s.cinema.id)) return false
    const startMinutes = timeToMinutes(s.time)
    const endMinutes = startMinutes + movie.duration
    return startMinutes >= timeRange[0] && endMinutes <= timeRange[1]
  })

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
          rated={movie.rated}
        />
        {movie.plot && (
          <p className="text-muted-foreground text-xs line-clamp-4 mt-2">{movie.plot}</p>
        )}
        {filteredShowtimes.length > 0 && (
          <div className="mt-3">
            <ShowtimesList showtimes={filteredShowtimes} size="sm" />
          </div>
        )}
      </CardContent>
    </Card>
  )
}

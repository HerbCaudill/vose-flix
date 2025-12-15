import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DateSelector } from "@/components/DateSelector"
import { MovieMeta } from "@/components/MovieMeta"
import { RatingDisplay } from "@/components/RatingDisplay"
import type { Movie } from "@/types"
import { ArrowLeft, MapPin } from "lucide-react"
import { formatDateLabel } from "@/lib/formatDateLabel"
import { groupShowtimesByCinema } from "@/lib/groupShowtimesByCinema"

interface MovieDetailProps {
  movie: Movie
  selectedDate: string
  availableDates: string[]
  onDateChange: (date: string) => void
  onBack: () => void
}

export function MovieDetail({
  movie,
  selectedDate,
  availableDates,
  onDateChange,
  onBack,
}: MovieDetailProps) {
  const { ratings } = movie

  // Filter showtimes for selected date
  const filteredShowtimes = movie.showtimes.filter(s => s.date === selectedDate)

  // Group showtimes by cinema
  const showtimesByCinema = groupShowtimesByCinema(filteredShowtimes)

  return (
    <div className="bg-background min-h-screen">
      {/* Header */}
      <div className="bg-background/95 sticky top-0 z-10 border-b backdrop-blur">
        <div className="container mx-auto px-4 py-3">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* Movie header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row">
          {/* Poster */}
          <div className="w-full shrink-0 md:w-64">
            {movie.posterUrl ?
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full rounded-lg shadow-lg"
              />
            : <div className="bg-muted flex aspect-[2/3] items-center justify-center rounded-lg">
                No poster
              </div>
            }
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="mb-2 text-3xl font-bold">{movie.title}</h1>

            <div className="mb-4">
              <MovieMeta
                year={movie.year}
                duration={movie.duration}
                ratings={movie.ratings}
                genres={movie.genres}
              />
            </div>

            {/* Individual ratings */}
            <div className="flex flex-wrap gap-8">
              {ratings.rottenTomatoes && (
                <RatingDisplay
                  label="Rotten Tomatoes"
                  value={`${ratings.rottenTomatoes.critics}%`}
                  score={ratings.rottenTomatoes.critics}
                />
              )}
              {ratings.metacritic && (
                <RatingDisplay
                  label="Metacritic"
                  value={ratings.metacritic.toString()}
                  score={ratings.metacritic}
                />
              )}
              {ratings.imdb && (
                <RatingDisplay
                  label="IMDB"
                  value={`${ratings.imdb.score.toFixed(1)}`}
                  score={ratings.imdb.score * 10}
                  subtext={`(${(ratings.imdb.votes / 1000).toFixed(0)}k votes)`}
                />
              )}
            </div>
          </div>
        </div>

        {/* Showtimes */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Showtimes</h2>
          <DateSelector
            availableDates={availableDates}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
          />
        </div>
        {showtimesByCinema.length === 0 ?
          <p className="text-muted-foreground">
            No showtimes available for {formatDateLabel(selectedDate).toLowerCase()}
          </p>
        : <div className="flex gap-4 overflow-x-auto pb-2">
            {showtimesByCinema.map(({ cinema, times }) => (
              <Card key={cinema.id} className="shrink-0">
                <CardContent className="p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <MapPin className="text-muted-foreground h-4 w-4" />
                    <span className="font-medium">{cinema.name}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {times.map((showtime, i) => (
                      <a
                        key={i}
                        href={showtime.bookingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Button variant="outline" size="sm">
                          {showtime.time}
                        </Button>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        }
      </div>
    </div>
  )
}

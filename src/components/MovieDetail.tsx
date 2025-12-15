import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { DateSelector } from "@/components/DateSelector"
import { MovieMeta } from "@/components/MovieMeta"
import { RatingDisplay } from "@/components/RatingDisplay"
import type { Movie } from "@/types"
import { ArrowLeft, ExternalLink, MapPin } from "lucide-react"
import { formatDateLabel } from "@/lib/formatDateLabel"
import { groupShowtimesByCinema } from "@/lib/groupShowtimesByCinema"

interface MovieDetailProps {
  movie: Movie
  selectedDate: string
  availableDates: string[]
  onDateChange: (date: string) => void
  onBack: () => void
}

export function MovieDetail({ movie, selectedDate, availableDates, onDateChange, onBack }: MovieDetailProps) {
  const { ratings } = movie

  // Filter showtimes for selected date
  const filteredShowtimes = movie.showtimes.filter(s => s.date === selectedDate)

  // Group showtimes by cinema
  const showtimesByCinema = groupShowtimesByCinema(filteredShowtimes)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-3">
          <Button variant="ghost" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-4">
        {/* Movie header */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Poster */}
          <div className="w-full md:w-64 shrink-0">
            {movie.posterUrl ? (
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="w-full rounded-lg shadow-lg"
              />
            ) : (
              <div className="aspect-[2/3] rounded-lg bg-muted flex items-center justify-center">
                No poster
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">{movie.title}</h1>

            <div className="mb-4">
              <MovieMeta
                year={movie.year}
                duration={movie.duration}
                ratings={movie.ratings}
                genres={movie.genres}
              />
            </div>

            {/* Individual ratings */}
            <div className="flex flex-wrap gap-6">
              {ratings.rottenTomatoes && (
                <RatingDisplay
                  label="Rotten Tomatoes"
                  value={`${ratings.rottenTomatoes.critics}%`}
                />
              )}
              {ratings.metacritic && (
                <RatingDisplay
                  label="Metacritic"
                  value={ratings.metacritic.toString()}
                />
              )}
              {ratings.imdb && (
                <RatingDisplay
                  label="IMDB"
                  value={`${ratings.imdb.score.toFixed(1)}/10`}
                  subtext={`${(ratings.imdb.votes / 1000).toFixed(0)}k votes`}
                />
              )}
            </div>
          </div>
        </div>

        {/* Showtimes */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Showtimes</h2>
          <DateSelector
            availableDates={availableDates}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
          />
        </div>
        {showtimesByCinema.length === 0 ? (
          <p className="text-muted-foreground">No showtimes available for {formatDateLabel(selectedDate).toLowerCase()}</p>
        ) : (
          <div className="grid gap-4">
            {showtimesByCinema.map(({ cinema, times }) => (
              <Card key={cinema.id}>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
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
                        <Button variant="outline" size="sm" className="gap-1">
                          {showtime.time}
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

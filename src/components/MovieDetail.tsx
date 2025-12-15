import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Movie, Showtime } from "@/types"
import { format, parseISO, isToday, isTomorrow } from "date-fns"
import { ArrowLeft, ExternalLink, Clock, MapPin, Calendar } from "lucide-react"

interface MovieDetailProps {
  movie: Movie
  onBack: () => void
}

export function MovieDetail({ movie, onBack }: MovieDetailProps) {
  const { ratings } = movie
  const [showFutureDates, setShowFutureDates] = useState(false)

  // Filter showtimes: today only by default, or today + future if toggled
  const today = new Date().toISOString().split("T")[0]
  const filteredShowtimes = showFutureDates
    ? movie.showtimes.filter(s => s.date >= today)
    : movie.showtimes.filter(s => s.date === today)

  // Group showtimes by date, then by cinema
  const showtimesByDate = groupShowtimesByDate(filteredShowtimes)

  // Count future dates available
  const futureDatesCount = new Set(
    movie.showtimes.filter(s => s.date > today).map(s => s.date)
  ).size

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

      <div className="container mx-auto px-4 py-6">
        {/* Movie header */}
        <div className="flex flex-col md:flex-row gap-6 mb-8">
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

            <div className="flex flex-wrap gap-2 mb-4">
              {movie.duration > 0 && (
                <Badge variant="secondary" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {formatDuration(movie.duration)}
                </Badge>
              )}
              {movie.genres.map(genre => (
                <Badge key={genre} variant="outline">
                  {genre}
                </Badge>
              ))}
            </div>

            {/* Ratings */}
            <div className="flex flex-wrap gap-4 mb-6">
              {ratings.rottenTomatoes && (
                <RatingDisplay
                  label="Rotten Tomatoes"
                  icon="🍅"
                  value={`${ratings.rottenTomatoes.critics}%`}
                  color={ratings.rottenTomatoes.critics >= 60 ? "text-red-500" : "text-green-500"}
                />
              )}
              {ratings.metacritic && (
                <RatingDisplay
                  label="Metacritic"
                  icon="M"
                  value={ratings.metacritic.toString()}
                  color={
                    ratings.metacritic >= 60
                      ? "text-green-500"
                      : ratings.metacritic >= 40
                        ? "text-yellow-500"
                        : "text-red-500"
                  }
                />
              )}
              {ratings.imdb && (
                <RatingDisplay
                  label="IMDB"
                  icon="★"
                  value={`${ratings.imdb.score.toFixed(1)}/10`}
                  subtext={`${(ratings.imdb.votes / 1000).toFixed(0)}k votes`}
                  color="text-yellow-500"
                />
              )}
            </div>
          </div>
        </div>

        {/* Showtimes */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">Showtimes</h2>
          {futureDatesCount > 0 && (
            <Button
              variant={showFutureDates ? "default" : "outline"}
              size="sm"
              onClick={() => setShowFutureDates(!showFutureDates)}
              className="gap-2"
            >
              <Calendar className="h-4 w-4" />
              {showFutureDates ? "Today only" : `+${futureDatesCount} more days`}
            </Button>
          )}
        </div>
        {showtimesByDate.length === 0 ? (
          <p className="text-muted-foreground">No showtimes available for today</p>
        ) : (
          <div className="space-y-6">
            {showtimesByDate.map(({ date, cinemas }) => (
              <div key={date}>
                <h3 className="text-lg font-semibold mb-3 sticky top-16 bg-background/95 py-2">
                  {formatDateLabel(date)}
                </h3>
                <div className="grid gap-4">
                  {cinemas.map(({ cinema, times }) => (
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
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

interface RatingDisplayProps {
  label: string
  icon: string
  value: string
  subtext?: string
  color: string
}

function RatingDisplay({ label, icon, value, subtext, color }: RatingDisplayProps) {
  return (
    <div className="flex items-center gap-2">
      <span className={`text-2xl ${color}`}>{icon}</span>
      <div>
        <div className="font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{label}</div>
        {subtext && <div className="text-xs text-muted-foreground">{subtext}</div>}
      </div>
    </div>
  )
}

function groupShowtimesByDate(showtimes: Showtime[]) {
  const byDate = new Map<string, Map<string, Showtime[]>>()

  for (const showtime of showtimes) {
    if (!byDate.has(showtime.date)) {
      byDate.set(showtime.date, new Map())
    }
    const dateCinemas = byDate.get(showtime.date)!
    if (!dateCinemas.has(showtime.cinema.id)) {
      dateCinemas.set(showtime.cinema.id, [])
    }
    dateCinemas.get(showtime.cinema.id)!.push(showtime)
  }

  // Sort and structure
  return Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, cinemas]) => ({
      date,
      cinemas: Array.from(cinemas.entries())
        .sort(([, a], [, b]) => a[0].cinema.name.localeCompare(b[0].cinema.name))
        .map(([_cinemaId, times]) => ({
          cinema: times[0].cinema,
          times: times.sort((a, b) => a.time.localeCompare(b.time)),
        })),
    }))
}

function formatDateLabel(dateStr: string): string {
  const date = parseISO(dateStr)
  if (isToday(date)) return "Today"
  if (isTomorrow(date)) return "Tomorrow"
  return format(date, "EEEE, MMMM d")
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}m`
  if (mins === 0) return `${hours}h`
  return `${hours}h ${mins}m`
}

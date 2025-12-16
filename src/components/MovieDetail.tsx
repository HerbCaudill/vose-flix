import { Header } from "@/components/Header"
import { MovieMeta } from "@/components/MovieMeta"
import { RatingDisplay } from "@/components/RatingDisplay"
import { ShowtimesList } from "@/components/ShowtimesList"
import type { Cinema, Movie } from "@/types"
import { Globe, Trophy, Users, Video } from "lucide-react"
import { formatDateLabel } from "@/lib/formatDateLabel"

function formatNameList(names: string): string {
  const list = names.split(", ").map(n => n.trim()).filter(Boolean)
  if (list.length === 0) return ""
  if (list.length === 1) return list[0]
  if (list.length === 2) return `${list[0]} and ${list[1]}`
  return `${list.slice(0, -1).join(", ")}, and ${list[list.length - 1]}`
}

interface MovieDetailProps {
  movie: Movie
  selectedDate: string
  availableDates: string[]
  onDateChange: (date: string) => void
  minScore: number | null
  onMinScoreChange: (value: number | null) => void
  cinemas: Cinema[]
  selectedCinemas: Set<string>
  onSelectedCinemasChange: (cinemas: Set<string>) => void
  timeRange: [number, number]
  onTimeRangeChange: (value: [number, number]) => void
  loading: boolean
  onRefresh: () => void
  onBack: () => void
}

export function MovieDetail({
  movie,
  selectedDate,
  availableDates,
  onDateChange,
  minScore,
  onMinScoreChange,
  cinemas,
  selectedCinemas,
  onSelectedCinemasChange,
  timeRange,
  onTimeRangeChange,
  loading,
  onRefresh,
  onBack,
}: MovieDetailProps) {
  const { ratings } = movie

  // Convert "HH:MM" to minutes from midnight
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number)
    return hours * 60 + minutes
  }

  // Filter showtimes for selected date, selected cinemas, and time range
  const filteredShowtimes = movie.showtimes.filter(s => {
    if (s.date !== selectedDate) return false
    if (!selectedCinemas.has(s.cinema.id)) return false
    const startMinutes = timeToMinutes(s.time)
    const endMinutes = startMinutes + movie.duration
    return startMinutes >= timeRange[0] && endMinutes <= timeRange[1]
  })

  return (
    <div className="bg-background min-h-screen">
      <Header
        availableDates={availableDates}
        selectedDate={selectedDate}
        onDateChange={onDateChange}
        minScore={minScore}
        onMinScoreChange={onMinScoreChange}
        cinemas={cinemas}
        selectedCinemas={selectedCinemas}
        onSelectedCinemasChange={onSelectedCinemasChange}
        timeRange={timeRange}
        onTimeRangeChange={onTimeRangeChange}
        loading={loading}
        onRefresh={onRefresh}
        onLogoClick={onBack}
      />

      <div className="container mx-auto px-4 py-4">
        {/* Movie header */}
        <div className="mb-6 flex flex-col gap-4 md:flex-row">
          {/* Poster */}
          <div className="w-full shrink-0 md:w-64">
            {movie.posterUrl ?
              <img
                src={movie.posterUrl}
                alt={movie.title}
                className="max-h-80 w-auto rounded-lg shadow-lg md:max-h-none md:w-full"
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
                rated={movie.rated}
              />
            </div>

            {/* Individual ratings */}
            <div className="mb-4 flex flex-wrap gap-8">
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

            {/* Plot */}
            {movie.plot && (
              <p className="text-muted-foreground mb-4">{movie.plot}</p>
            )}

            {/* Country/Language */}
            {(movie.country || movie.language) && (
              <p className="mb-4 flex gap-2 text-sm">
                <Globe className="text-muted-foreground h-4 w-4 shrink-0 mt-0.5" />
                <span>
                  {movie.country}
                  {movie.country && movie.language && " "}
                  {movie.language && `(${movie.language})`}
                </span>
              </p>
            )}

            {/* Cast & Crew */}
            {(movie.actors || movie.director) && (
              <div className="mb-4 text-sm space-y-1">
                {movie.actors && (
                  <p className="flex gap-2">
                    <Users className="text-muted-foreground h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      <span className="text-muted-foreground">Starring</span> {formatNameList(movie.actors)}.
                    </span>
                  </p>
                )}
                {movie.director && (
                  <p className="flex gap-2">
                    <Video className="text-muted-foreground h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      <span className="text-muted-foreground">Directed by</span> {formatNameList(movie.director)}.
                    </span>
                  </p>
                )}
              </div>
            )}

            {/* Awards */}
            {movie.awards && movie.awards !== "N/A" && (
              <div className="mt-4 flex items-start gap-2 text-sm">
                <Trophy className="text-yellow-500 h-4 w-4 shrink-0 mt-0.5" />
                <span>{movie.awards}</span>
              </div>
            )}
          </div>
        </div>

        {/* Showtimes */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold">Showtimes</h2>
        </div>
        <ShowtimesList
          showtimes={filteredShowtimes}
          emptyMessage={`No showtimes available for ${formatDateLabel(selectedDate).toLowerCase()}`}
        />

        {/* Trailer */}
        {movie.trailerKey && (
          <div className="mt-6">
            <h2 className="mb-4 text-2xl font-bold">Trailer</h2>
            <div className="aspect-video w-full max-w-3xl overflow-hidden rounded-lg">
              <iframe
                src={`https://www.youtube.com/embed/${movie.trailerKey}`}
                title={`${movie.title} trailer`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="h-full w-full"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

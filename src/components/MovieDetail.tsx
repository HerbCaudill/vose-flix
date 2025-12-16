import { Button } from "@/components/ui/button"
import { DateSelector } from "@/components/DateSelector"
import { MovieMeta } from "@/components/MovieMeta"
import { MpaaRatingBadge } from "@/components/MpaaRatingBadge"
import { RatingDisplay } from "@/components/RatingDisplay"
import type { Movie } from "@/types"
import { ArrowLeft, Award, DollarSign, Globe, Trophy, Users, Video } from "lucide-react"
import { formatDateLabel } from "@/lib/formatDateLabel"

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

  // Filter and sort showtimes for selected date
  const filteredShowtimes = movie.showtimes
    .filter(s => s.date === selectedDate)
    .sort((a, b) => a.time.localeCompare(b.time))

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

            {/* Cast & Crew */}
            <div className="mb-4 space-y-2 text-sm">
              {movie.director && (
                <div className="flex gap-2">
                  <Video className="text-muted-foreground h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    <span className="text-muted-foreground">Director:</span>{" "}
                    {movie.director}
                  </span>
                </div>
              )}
              {movie.writer && (
                <div className="flex gap-2">
                  <Award className="text-muted-foreground h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    <span className="text-muted-foreground">Writer:</span>{" "}
                    {movie.writer}
                  </span>
                </div>
              )}
              {movie.actors && (
                <div className="flex gap-2">
                  <Users className="text-muted-foreground h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    <span className="text-muted-foreground">Cast:</span>{" "}
                    {movie.actors}
                  </span>
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
              {movie.rated && <MpaaRatingBadge rated={movie.rated} />}
              {movie.language && (
                <span className="flex items-center gap-1">
                  <Globe className="text-muted-foreground h-3 w-3" />
                  {movie.language}
                </span>
              )}
              {movie.country && (
                <span>
                  <span className="text-muted-foreground">Country:</span> {movie.country}
                </span>
              )}
              {movie.boxOffice && (
                <span className="flex items-center gap-1">
                  <DollarSign className="text-muted-foreground h-3 w-3" />
                  {movie.boxOffice}
                </span>
              )}
            </div>

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
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Showtimes</h2>
          <DateSelector
            availableDates={availableDates}
            selectedDate={selectedDate}
            onDateChange={onDateChange}
          />
        </div>
        {filteredShowtimes.length === 0 ?
          <p className="text-muted-foreground">
            No showtimes available for {formatDateLabel(selectedDate).toLowerCase()}
          </p>
        : <div className="flex flex-col gap-2">
            {filteredShowtimes.map((showtime, i) => (
              <a
                key={i}
                href={showtime.bookingUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-fit"
              >
                <Button variant="outline" size="sm" className="gap-2">
                  <span className="font-semibold">{showtime.time}</span>
                  <span className="text-muted-foreground">{showtime.cinema.name}</span>
                </Button>
              </a>
            ))}
          </div>
        }

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

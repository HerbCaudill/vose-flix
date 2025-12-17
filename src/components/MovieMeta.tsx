import { Badge } from "@/components/ui/badge"
import { MpaaRatingBadge } from "@/components/MpaaRatingBadge"
import { Clock } from "lucide-react"
import { formatDuration } from "@/lib/formatDuration"
import { calculateNormalizedScore } from "@/lib/calculateNormalizedScore"
import type { Ratings } from "@/types"

export function MovieMeta({ year, duration, ratings, genres, rated }: Props) {
  const normalizedScore = calculateNormalizedScore(ratings)

  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-2">
      {normalizedScore !== null && (
        <Badge className={`${getScoreColor(normalizedScore)} gap-1 font-bold text-white`}>
          {Math.round(normalizedScore)}
        </Badge>
      )}
      {year && <span>{year}</span>}
      {duration > 0 && (
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatDuration(duration)}
        </span>
      )}
      {genres?.map((genre, i) => (
        <span key={genre} className="flex items-center gap-2">
          {(year || duration > 0 || i > 0) && <span>•</span>}
          {genre}
        </span>
      ))}
      {rated && (
        <span className="ml-auto">
          <MpaaRatingBadge rated={rated} />
        </span>
      )}
    </div>
  )
}

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-green-600"
  if (score >= 50) return "bg-yellow-500"
  return "bg-red-600"
}

type Props = {
  year?: number
  duration: number
  ratings: Ratings
  genres?: string[]
  rated?: string
}

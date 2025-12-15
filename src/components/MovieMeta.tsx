import { Badge } from "@/components/ui/badge"
import { Clock } from "lucide-react"
import { formatDuration } from "@/lib/formatDuration"
import { calculateNormalizedScore } from "@/lib/calculateNormalizedScore"
import type { Ratings } from "@/types"

interface MovieMetaProps {
  year?: number
  duration: number
  ratings: Ratings
  genres?: string[]
}

function getScoreColor(score: number): string {
  if (score >= 70) return "bg-green-600"
  if (score >= 50) return "bg-yellow-500"
  return "bg-red-600"
}

export function MovieMeta({ year, duration, ratings, genres }: MovieMetaProps) {
  const normalizedScore = calculateNormalizedScore(ratings)

  return (
    <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
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
    </div>
  )
}

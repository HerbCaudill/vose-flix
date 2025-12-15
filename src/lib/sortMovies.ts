import type { Movie } from "@/types"
import { calculateNormalizedScore } from "./calculateNormalizedScore"

// Sort movies by year (descending) then by normalized score (descending)
export function sortMovies(movies: Movie[]): Movie[] {
  return [...movies].sort((a, b) => {
    // First sort by year (descending, with no-year movies at the end)
    const yearA = a.year ?? 0
    const yearB = b.year ?? 0
    if (yearA !== yearB) {
      return yearB - yearA
    }

    // Then sort by normalized score (descending, with no-score movies at the end)
    const scoreA = calculateNormalizedScore(a.ratings) ?? -1
    const scoreB = calculateNormalizedScore(b.ratings) ?? -1
    return scoreB - scoreA
  })
}

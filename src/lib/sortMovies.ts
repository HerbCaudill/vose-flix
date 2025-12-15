import type { Movie, Ratings } from "@/types"

// Calculate normalized score from 0-100 based on available ratings
function calculateNormalizedScore(ratings: Ratings): number | null {
  const scores: number[] = []

  if (ratings.rottenTomatoes?.critics != null) {
    scores.push(ratings.rottenTomatoes.critics) // Already 0-100
  }
  if (ratings.metacritic != null) {
    scores.push(ratings.metacritic) // Already 0-100
  }
  if (ratings.imdb?.score != null) {
    scores.push(ratings.imdb.score * 10) // Convert 0-10 to 0-100
  }

  if (scores.length === 0) return null
  return scores.reduce((a, b) => a + b, 0) / scores.length
}

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

import type { Ratings } from "@/types"

// Calculate normalized score from 0-100 based on available ratings
export function calculateNormalizedScore(ratings: Ratings): number | null {
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

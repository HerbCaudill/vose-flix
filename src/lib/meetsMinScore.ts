import type { Ratings } from "@/types"
import { calculateNormalizedScore } from "./calculateNormalizedScore"

/** Applies the minimum score, keeping unrated films because many foreign films have no rating. */
export function meetsMinScore(ratings: Ratings, minScore: number | null): boolean {
  if (minScore === null) return true
  const score = calculateNormalizedScore(ratings)
  return score === null || score >= minScore
}

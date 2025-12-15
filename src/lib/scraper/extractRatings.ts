import type { Ratings } from "@/types"

export function extractRatings(text: string): Ratings {
  const ratings: Ratings = {}

  // Rotten Tomatoes - look for percentage
  const rtMatch = text.match(/Rotten\s*Tomatoes[:\s]*(\d+)%/i)
  if (rtMatch) {
    ratings.rottenTomatoes = { critics: parseInt(rtMatch[1], 10) }
  }

  // Metacritic - look for score out of 100
  const mcMatch = text.match(/Metacritic[:\s]*(\d+)(?:\/100)?/i)
  if (mcMatch) {
    ratings.metacritic = parseInt(mcMatch[1], 10)
  }

  return ratings
}

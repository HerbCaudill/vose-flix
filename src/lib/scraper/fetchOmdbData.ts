import { OMDB_API_KEY } from "./constants"
import { getCachedOmdbData, setCachedOmdbData } from "./omdbCache"

export interface OmdbData {
  imdb?: { score: number; votes: number }
  rottenTomatoes?: { critics: number }
  metacritic?: number
  posterUrl?: string
  year?: number
}

export async function fetchOmdbData(title: string): Promise<OmdbData> {
  // Check cache first
  const cached = getCachedOmdbData(title)
  if (cached) {
    return cached
  }

  const result: OmdbData = {}
  try {
    const url = `https://www.omdbapi.com/?t=${encodeURIComponent(title)}&apikey=${OMDB_API_KEY}`
    console.log(`[fetch] OMDB: ${title}`)
    const response = await fetch(url)
    const data = await response.json()

    if (data.Response === "True") {
      // Extract IMDB rating
      if (data.imdbRating && data.imdbRating !== "N/A") {
        result.imdb = {
          score: parseFloat(data.imdbRating),
          votes: parseInt(data.imdbVotes?.replace(/,/g, "") || "0", 10),
        }
      }

      // Extract ratings from the Ratings array (includes RT and Metacritic)
      if (data.Ratings && Array.isArray(data.Ratings)) {
        for (const rating of data.Ratings) {
          if (rating.Source === "Rotten Tomatoes" && rating.Value) {
            const rtMatch = rating.Value.match(/(\d+)%/)
            if (rtMatch) {
              result.rottenTomatoes = { critics: parseInt(rtMatch[1], 10) }
            }
          }
          if (rating.Source === "Metacritic" && rating.Value) {
            const mcMatch = rating.Value.match(/(\d+)\/100/)
            if (mcMatch) {
              result.metacritic = parseInt(mcMatch[1], 10)
            }
          }
        }
      }

      // Also check Metascore field as fallback
      if (!result.metacritic && data.Metascore && data.Metascore !== "N/A") {
        result.metacritic = parseInt(data.Metascore, 10)
      }

      if (data.Poster && data.Poster !== "N/A") {
        result.posterUrl = data.Poster
      }

      if (data.Year && data.Year !== "N/A") {
        // Year can be "2024" or "2024–" (for series), extract first year
        const yearMatch = data.Year.match(/(\d{4})/)
        if (yearMatch) {
          result.year = parseInt(yearMatch[1], 10)
        }
      }

      // Cache successful response
      setCachedOmdbData(title, result)
    }
  } catch (error) {
    console.error("Failed to fetch OMDB data:", error)
  }
  return result
}

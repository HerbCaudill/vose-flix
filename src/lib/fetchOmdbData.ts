import { OMDB_API_KEY } from "./constants"
import { getCachedOmdbData, setCachedOmdbData } from "./omdbCache"

export interface OmdbData {
  imdb?: { score: number; votes: number; id: string }
  rottenTomatoes?: { critics: number }
  metacritic?: number
  posterUrl?: string
  year?: number
  rated?: string // e.g., "PG-13", "R"
  released?: string // e.g., "25 Dec 2024"
  director?: string
  writer?: string
  actors?: string
  plot?: string
  language?: string
  country?: string
  awards?: string
  boxOffice?: string
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
          id: data.imdbID || "",
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

      // Extract additional OMDB fields
      if (data.Rated && data.Rated !== "N/A") {
        result.rated = data.Rated
      }
      if (data.Released && data.Released !== "N/A") {
        result.released = data.Released
      }
      if (data.Director && data.Director !== "N/A") {
        result.director = data.Director
      }
      if (data.Writer && data.Writer !== "N/A") {
        result.writer = data.Writer
      }
      if (data.Actors && data.Actors !== "N/A") {
        result.actors = data.Actors
      }
      if (data.Plot && data.Plot !== "N/A") {
        result.plot = data.Plot
      }
      if (data.Language && data.Language !== "N/A") {
        result.language = data.Language
      }
      if (data.Country && data.Country !== "N/A") {
        result.country = data.Country
      }
      if (data.Awards && data.Awards !== "N/A") {
        result.awards = data.Awards
      }
      if (data.BoxOffice && data.BoxOffice !== "N/A") {
        result.boxOffice = data.BoxOffice
      }

      // Cache successful response
      setCachedOmdbData(title, result)
    }
  } catch (error) {
    console.error("Failed to fetch OMDB data:", error)
  }
  return result
}

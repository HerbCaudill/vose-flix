import * as cheerio from "cheerio"
import type { Movie } from "@/types"
import { BASE_URL } from "./constants"
import { fetchHtml } from "./fetchHtml"
import { extractRatings } from "./extractRatings"
import { extractShowtimes } from "./extractShowtimes"

export async function fetchMovieDetails(slug: string): Promise<Movie | null> {
  const url = `${BASE_URL}/m/${slug}/in-english-in-barcelona`
  const html = await fetchHtml(url)
  const $ = cheerio.load(html)

  // Get title
  const title = $("h1").first().text().trim()
  if (!title) return null

  // Get poster - look for images from their CDN or TMDB
  let posterUrl = $('img[src*="img.englishcinemabarcelona.com"]').first().attr("src") || ""
  if (!posterUrl) {
    posterUrl = $('img[src*="tmdb"], img[src*="poster"]').first().attr("src") || ""
  }
  // Also check for any image in the page with a reasonable size pattern
  if (!posterUrl) {
    $("img").each((_, el) => {
      const src = $(el).attr("src") || ""
      if (src.includes("http") && !posterUrl) {
        posterUrl = src
      }
    })
  }

  // Get duration
  const bodyText = $("body").text()
  const durationMatch = bodyText.match(/(\d+)\s*(?:minutes|mins|m)\b/i)
  const duration = durationMatch ? parseInt(durationMatch[1], 10) : 0

  // Get genres
  const genres: string[] = []
  $('a[href*="/genre/"]').each((_, el) => {
    const genre = $(el).text().trim()
    if (genre && !genres.includes(genre)) {
      genres.push(genre)
    }
  })

  // Extract ratings from text
  const ratings = extractRatings(bodyText)

  // Extract showtimes
  const showtimes = extractShowtimes($, slug)

  return {
    id: slug,
    title,
    slug,
    posterUrl,
    duration,
    genres,
    ratings,
    showtimes,
  }
}
